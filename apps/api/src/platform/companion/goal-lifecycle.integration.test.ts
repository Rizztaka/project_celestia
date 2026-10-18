import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

import type { GoalRecord } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const shared = vi.hoisted(() => ({ db: null as PrismaClient | null }));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, key) {
        if (!shared.db) throw new Error('Disposable database not initialized');
        const value = Reflect.get(shared.db, key);
        return typeof value === 'function' ? value.bind(shared.db) : value;
      },
    },
  ),
}));
vi.mock('@/core/config/env.js', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'c3b-fixture-secret-only', JWT_EXPIRY: '1h' },
}));
import { app } from '@/app.js';

import { GenshinCharacterFocusService } from '../../games/genshin/characters/character-focus.service.js';
import { GenshinImportRepository } from '../../games/genshin/importer/importer.repository.js';
import { GenshinImportService } from '../../games/genshin/importer/importer.service.js';
import { GoalRepository } from './goal.repository.js';
import { GoalService } from './goal.service.js';

const databaseUrl = process.env.CELESTIA_TEST_DATABASE_URL;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !url.pathname.startsWith('/celestia_test_')
  )
    throw new Error('Explicit disposable loopback celestia_test_* database required.');
}
const input = (overrides: Record<string, unknown> = {}) => ({
  contractVersion: 3,
  requestId: randomUUID(),
  goalType: 'CHARACTER_TALENT',
  targetKey: 'HuTao',
  fromPhase: 1,
  toPhase: 6,
  talentType: 'normal',
  priority: 3,
  ...overrides,
});
const character = (key = 'HuTao') => ({
  key,
  level: 80,
  ascension: 5,
  constellation: 3,
  talent: { auto: 9, skill: 12, burst: 15 },
});
const command = (goal: Pick<GoalRecord, 'revision'>, action: string, extra = {}) => ({
  contractVersion: 3,
  expectedRevision: goal.revision,
  action,
  ...extra,
});

describe.skipIf(!databaseUrl)('C3b actual PostgreSQL lifecycle/focus', () => {
  let db: PrismaClient;
  let service: GoalService;
  let focus: GenshinCharacterFocusService;
  let importer: GenshinImportService;
  let owner: string;
  const owners: string[] = [];
  const queries: string[] = [];
  const api = supertest(app);
  const auth = (id = owner) => jwt.sign({ sid: id }, 'c3b-fixture-secret-only', { subject: id });
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `c3b-${id}`, email: `${id}@test.invalid`, password: 'fixture' },
    });
    await db.session.create({
      data: {
        id,
        userId: id,
        tokenHash: id.replaceAll('-', '').repeat(2),
        expiresAt: new Date('2099-01-01'),
      },
    });
    return id;
  };
  const commit = async (payload: Record<string, unknown>, target = owner, impl = importer) => {
    const request = {
      requestVersion: 1,
      sections: Object.keys(payload),
      payload: { format: 'GOOD', version: 2, source: 'C3b fixture', ...payload },
    };
    const preview = await impl.preview(target, request);
    return impl.importAccount(target, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  const seed = async () => {
    await commit({
      characters: [character(), character('Opaque / 字')],
      weapons: [{ key: 'OpaqueWeapon', level: 60, ascension: 3, refinement: 1, location: 'HuTao' }],
      materials: { Mora: 200000 },
    });
    await db.genshinRoutineState.create({
      data: {
        userId: owner,
        serverId: 'asia',
        resinAmount: 80,
        resinRecordedAt: new Date(),
        weeklyRewardClaims: 2,
      },
    });
  };
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (event) => queries.push(event.query));
    db = client;
    shared.db = db;
    service = new GoalService(() => new Date('2026-10-04T00:00:00Z'), new GoalRepository(db));
    focus = new GenshinCharacterFocusService(db);
    importer = new GenshinImportService(new GenshinImportRepository(db));
  });
  beforeEach(async () => {
    owner = await user();
    queries.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });

  it('creates sourced catalog intent before import with neutral defaults and no account/focus', async () => {
    const goal = await service.createGoal(owner, input({ priority: undefined }));
    expect(goal).toMatchObject({
      status: 'active',
      priority: 3,
      revision: 0,
      completedAt: null,
      completionReason: null,
      predecessorId: null,
    });
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
    expect(await focus.list(owner)).toEqual([]);
    expect((await service.getMaterialDelta(owner)).needed.Mora).toBe(122500);
    expect((await service.getMaterialDelta(owner)).delta.Mora).toBeNull();
  });
  it('accepts owned opaque character and weapon type keys; rejects absent and foreign targets', async () => {
    await seed();
    for (const data of [
      input({ targetKey: 'Opaque / 字' }),
      input({
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'OpaqueWeapon',
        talentType: null,
        fromPhase: 0,
      }),
    ]) {
      const goal = await service.createGoal(owner, data);
      expect(goal.limitations.length).toBeGreaterThan(0);
      await expect(service.createGoal(await user(), data)).rejects.toMatchObject({
        statusCode: 400,
      });
    }
    await expect(service.createGoal(owner, input({ targetKey: 'Absent' }))).rejects.toMatchObject({
      statusCode: 400,
    });
  });
  it('serializes concurrent null-slot current-intent creates: exactly one succeeds', async () => {
    const results = await Promise.allSettled(
      [0, 1, 2].map(() =>
        service.createGoal(
          owner,
          input({ goalType: 'CHARACTER_ASCENSION', talentType: null, fromPhase: 0 }),
        ),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(
      results
        .filter((r) => r.status === 'rejected')
        .every((r) => r.status === 'rejected' && r.reason.statusCode === 409),
    ).toBe(true);
    expect(await db.upgradeGoal.count({ where: { userId: owner } })).toBe(1);
  });
  it('rejects repeated create request IDs even after the accepted goal is archived', async () => {
    const request = input();
    const goal = await service.createGoal(owner, request);
    await service.updateGoal(owner, goal.id, command(goal, 'archive'));
    await expect(service.createGoal(owner, request)).rejects.toMatchObject({ statusCode: 409 });
    expect(await db.upgradeGoal.count({ where: { userId: owner } })).toBe(1);
  });
  it('pause/resume is reversible and active/paused edits retain identity and declared origin', async () => {
    let goal = await service.createGoal(owner, input());
    const id = goal.id;
    goal = (await service.updateGoal(owner, id, command(goal, 'pause'))).goal;
    goal = (
      await service.updateGoal(
        owner,
        id,
        command(goal, 'edit', { fromPhase: 2, toPhase: 5, priority: 1 }),
      )
    ).goal;
    expect(goal).toMatchObject({
      id,
      status: 'paused',
      fromPhase: 2,
      toPhase: 5,
      priority: 1,
      revision: 2,
    });
    goal = (await service.updateGoal(owner, id, command(goal, 'resume'))).goal;
    expect(goal).toMatchObject({ status: 'active', fromPhase: 2, priority: 1, revision: 3 });
  });
  it.each(['achieved', 'good_enough'])(
    'manual %s completion is independent of absent stock; archive retains completion',
    async (reason) => {
      let goal = await service.createGoal(owner, input());
      goal = (await service.updateGoal(owner, goal.id, command(goal, 'complete', { reason }))).goal;
      expect(goal).toMatchObject({
        status: 'completed',
        completionReason: reason,
        completedAt: '2026-10-04T00:00:00.000Z',
        fromPhase: 1,
      });
      const closed = goal;
      goal = (await service.updateGoal(owner, goal.id, command(goal, 'archive'))).goal;
      expect(goal).toMatchObject({
        status: 'archived',
        completionReason: reason,
        completedAt: closed.completedAt,
        fromPhase: closed.fromPhase,
        toPhase: closed.toPhase,
      });
      expect((await service.getMaterialDelta(owner)).needed).toEqual({});
    },
  );
  it('successors retain closed history, reject concurrent/replayed requests, and never overwrite a raised target', async () => {
    let goal = await service.createGoal(owner, input({ toPhase: 3 }));
    goal = (
      await service.updateGoal(owner, goal.id, command(goal, 'complete', { reason: 'good_enough' }))
    ).goal;
    const request = command(goal, 'successor', { fromPhase: 3, toPhase: 6, priority: 1 });
    const results = await Promise.allSettled([
      service.updateGoal(owner, goal.id, request),
      service.updateGoal(owner, goal.id, request),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const rows = await service.listGoals(owner);
    expect(rows).toHaveLength(2);
    expect(rows.find((r) => r.id === goal.id)).toMatchObject({
      status: 'completed',
      toPhase: 3,
      completionReason: 'good_enough',
      completedAt: goal.completedAt,
      revision: 2,
    });
    const successor = rows.find((r) => r.predecessorId === goal.id)!;
    expect(successor).toMatchObject({
      status: 'active',
      fromPhase: 3,
      toPhase: 6,
      priority: 1,
      revision: 0,
    });
    await service.updateGoal(owner, successor.id, command(successor, 'archive'));
    await expect(
      service.updateGoal(owner, goal.id, { ...request, expectedRevision: 2 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });
  it('restores archived intent as a successor and blocks it when another current intent exists', async () => {
    let old = await service.createGoal(owner, input());
    old = (await service.updateGoal(owner, old.id, command(old, 'archive'))).goal;
    const current = await service.createGoal(owner, input());
    await expect(
      service.updateGoal(
        owner,
        old.id,
        command(old, 'successor', { fromPhase: 1, toPhase: 4, priority: 2 }),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
    await service.updateGoal(owner, current.id, command(current, 'archive'));
    const result = await service.updateGoal(
      owner,
      old.id,
      command(old, 'successor', { fromPhase: 1, toPhase: 4, priority: 2 }),
    );
    expect(result.goal.status).toBe('archived');
    expect(result.successor?.status).toBe('active');
  });
  it.each(['edit', 'priority', 'complete'])(
    'stale %s cannot overwrite newer priority/status/range',
    async (action) => {
      const goal = await service.createGoal(owner, input());
      const saved = await service.updateGoal(
        owner,
        goal.id,
        command(goal, 'priority', { priority: 1 }),
      );
      const extra =
        action === 'edit'
          ? { fromPhase: 2, toPhase: 4, priority: 5 }
          : action === 'priority'
            ? { priority: 5 }
            : { reason: 'achieved' };
      await expect(
        service.updateGoal(owner, goal.id, command(goal, action, extra)),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect((await service.listGoals(owner))[0]).toEqual(saved.goal);
    },
  );
  it('concurrent different-field edits sharing one revision have exactly one winner', async () => {
    const goal = await service.createGoal(owner, input());
    const results = await Promise.allSettled([
      service.updateGoal(owner, goal.id, command(goal, 'pause')),
      service.updateGoal(owner, goal.id, command(goal, 'priority', { priority: 1 })),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await service.listGoals(owner))[0]?.revision).toBe(1);
  });
  it('rejects every invalid transition without changing persisted state', async () => {
    const steps: [string, string[], Record<string, unknown>][] = [
      ['active', ['resume', 'successor'], {}],
      ['paused', ['pause', 'successor'], {}],
      [
        'completed',
        ['pause', 'resume', 'complete', 'edit', 'priority'],
        { completedAt: new Date(), completionReason: 'achieved' },
      ],
      ['archived', ['pause', 'resume', 'complete', 'edit', 'priority', 'archive'], {}],
    ];
    for (const [status, actions, fields] of steps) {
      const goal = await db.upgradeGoal.create({
        data: {
          userId: owner,
          goalType: 'CHARACTER_TALENT',
          targetKey: 'HuTao',
          talentType: 'normal',
          fromPhase: 1,
          toPhase: 6,
          status: status as 'active',
          ...fields,
        },
      });
      for (const action of actions) {
        const extra = ['edit', 'successor'].includes(action)
          ? { fromPhase: 1, toPhase: 5, priority: 3 }
          : action === 'priority'
            ? { priority: 2 }
            : action === 'complete'
              ? { reason: 'achieved' }
              : {};
        await expect(
          service.updateGoal(owner, goal.id, command(goal, action, extra)),
        ).rejects.toMatchObject({ statusCode: 409 });
        expect(await db.upgradeGoal.findUnique({ where: { id: goal.id } })).toEqual(goal);
      }
    }
  });
  it('retains duplicate rows, excludes every ambiguous active demand, and resolves only on explicit closure', async () => {
    const first = await service.createGoal(owner, input());
    const duplicate = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'HuTao',
        talentType: 'normal',
        fromPhase: 1,
        toPhase: 6,
        status: 'paused',
      },
    });
    expect((await service.listGoals(owner)).every((goal) => goal.needsReview)).toBe(true);
    expect(await service.getMaterialDelta(owner)).toMatchObject({
      needed: {},
      neededComplete: false,
      goals: [{ goalId: first.id, available: false }],
    });
    await expect(service.createGoal(owner, input())).rejects.toMatchObject({ statusCode: 409 });
    await service.updateGoal(owner, duplicate.id, command(duplicate, 'archive'));
    expect((await service.getMaterialDelta(owner)).needed.Mora).toBe(122500);
    expect((await service.listGoals(owner)).every((goal) => !goal.needsReview)).toBe(true);
  });
  it('materials, Today and direct Planner exclude inactive goals and preserve priority order', async () => {
    await seed();
    const a = await service.createGoal(owner, input({ talentType: 'normal', priority: 4 }));
    const b = await service.createGoal(owner, input({ talentType: 'skill', priority: 1 }));
    const c = await service.createGoal(owner, input({ talentType: 'burst', priority: 2 }));
    await service.updateGoal(owner, c.id, command(c, 'pause'));
    for (const path of [
      '/companion/goals/materials',
      '/companion/goals/today',
      '/games/genshin/intelligence/planner',
    ]) {
      const response = await api.get(`/api/v1${path}`).auth(auth(), { type: 'bearer' });
      expect(response.status).toBe(200);
      expect(response.body.data.goals.map((goal: { goalId: string }) => goal.goalId)).toEqual([
        b.id,
        a.id,
      ]);
    }
    expect((await service.getMaterialDelta(owner)).needed.Mora).toBe(245000);
    await service.updateGoal(owner, a.id, command(a, 'complete', { reason: 'achieved' }));
    await service.updateGoal(owner, b.id, command(b, 'archive'));
    expect((await service.getTodayDomains(owner)).availability.reason).toContain('No active goals');
    expect(
      (await api.get('/api/v1/games/genshin/intelligence/planner').auth(auth(), { type: 'bearer' }))
        .body.error.message,
    ).toContain('No active goals');
  });
  it('orders equal priorities by createdAt then ID deterministically', async () => {
    const createdAt = new Date('2026-01-01');
    for (const id of ['z', 'a', 'm'])
      await db.upgradeGoal.create({
        data: {
          id: `${owner}-${id}`,
          userId: owner,
          goalType: 'CHARACTER_ASCENSION',
          targetKey: id,
          fromPhase: 0,
          toPhase: 6,
          createdAt,
        },
      });
    expect((await service.listGoals(owner)).map((goal) => goal.targetKey)).toEqual(['a', 'm', 'z']);
  });
  it('legacy invalid targets/ranges/slots remain visible and manageable without clamping', async () => {
    const goal = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'Unknown',
        talentType: 'invalid',
        fromPhase: -8,
        toPhase: 99,
      },
    });
    expect((await service.listGoals(owner))[0]).toMatchObject({
      id: goal.id,
      fromPhase: -8,
      toPhase: 99,
      targetKey: 'Unknown',
      talentType: 'invalid',
      limitations: [expect.stringContaining('Legacy intent')],
    });
    expect((await service.getMaterialDelta(owner)).needed).toEqual({});
    await service.updateGoal(owner, goal.id, command(goal, 'priority', { priority: 1 }));
    const saved = (await service.listGoals(owner))[0]!;
    expect(saved).toMatchObject({
      priority: 1,
      revision: 1,
      fromPhase: -8,
      toPhase: 99,
      talentType: 'invalid',
      targetKey: 'Unknown',
      status: 'active',
    });
    await service.updateGoal(owner, goal.id, command(saved, 'archive'));
    expect((await service.listGoals(owner))[0]?.fromPhase).toBe(-8);
  });
  it('focus supports opaque owned keys, retains unfocus revisions and never affects goals', async () => {
    await seed();
    const goal = await service.createGoal(owner, input());
    const focused = await focus.set(owner, 'Opaque / 字', {
      contractVersion: 1,
      expectedRevision: 0,
      focused: true,
    });
    expect(focused).toEqual({ characterKey: 'Opaque / 字', focused: true, revision: 1 });
    await focus.set(owner, 'Opaque / 字', {
      contractVersion: 1,
      expectedRevision: 1,
      focused: false,
    });
    await expect(
      focus.set(owner, 'Opaque / 字', { contractVersion: 1, expectedRevision: 0, focused: true }),
    ).rejects.toMatchObject({ statusCode: 409 });
    expect((await service.listGoals(owner))[0]).toEqual(goal);
    await expect(
      focus.set(await user(), 'Opaque / 字', {
        contractVersion: 1,
        expectedRevision: 0,
        focused: true,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it('concurrent first focus writes serialize, with one authoritative winner', async () => {
    await seed();
    const results = await Promise.allSettled(
      [true, false].map((focused) =>
        focus.set(owner, 'HuTao', { contractVersion: 1, expectedRevision: 0, focused }),
      ),
    );
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect((await focus.list(owner))[0]?.revision).toBe(1);
  });
  it('HTTP authenticates reads/writes and conceals foreign goal IDs; retired DELETE fails closed', async () => {
    const goal = await service.createGoal(owner, input());
    const other = await user();
    expect((await api.get('/api/v1/companion/goals')).status).toBe(401);
    for (const id of [goal.id, randomUUID()]) {
      expect(
        (
          await api
            .patch(`/api/v1/companion/goals/${id}`)
            .auth(auth(other), { type: 'bearer' })
            .send(command(goal, 'archive'))
        ).status,
      ).toBe(404);
      expect(
        (await api.delete(`/api/v1/companion/goals/${id}`).auth(auth(other), { type: 'bearer' }))
          .status,
      ).toBe(404);
    }
    expect(
      (await api.delete(`/api/v1/companion/goals/${goal.id}`).auth(auth(), { type: 'bearer' }))
        .status,
    ).toBe(409);
    expect(
      (
        await api
          .post('/api/v1/companion/goals')
          .auth(auth(), { type: 'bearer' })
          .send({ goalType: 'CHARACTER_ASCENSION', targetKey: 'HuTao', fromPhase: 0, toPhase: 6 })
      ).status,
    ).toBe(409);
    expect((await service.listGoals(owner))[0]).toEqual(goal);
  });
  it('rolls back successor insertion when the parent update fails inside the real transaction', async () => {
    let goal = await service.createGoal(owner, input());
    goal = (await service.updateGoal(owner, goal.id, command(goal, 'archive'))).goal;
    const failing = db.$extends({
      query: {
        upgradeGoal: {
          async update() {
            throw new Error('forced parent update failure');
          },
        },
      },
    });
    const failService = new GoalService(
      undefined,
      new GoalRepository(failing as unknown as PrismaClient),
    );
    await expect(
      failService.updateGoal(
        owner,
        goal.id,
        command(goal, 'successor', { fromPhase: 1, toPhase: 6, priority: 3 }),
      ),
    ).rejects.toThrow('forced parent');
    expect(await service.listGoals(owner)).toEqual([goal]);
  });
  it('partial, empty, replacement and failed imports preserve all intent/history/focus fields', async () => {
    await seed();
    const active = await service.createGoal(owner, input());
    const weapon = await service.createGoal(
      owner,
      input({
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'OpaqueWeapon',
        talentType: null,
        fromPhase: 0,
      }),
    );
    await service.updateGoal(
      owner,
      weapon.id,
      command(weapon, 'complete', { reason: 'good_enough' }),
    );
    await focus.set(owner, 'HuTao', { contractVersion: 1, expectedRevision: 0, focused: true });
    const before = await service.listGoals(owner);
    const focused = await focus.list(owner);
    const routine = await db.genshinRoutineState.findUnique({ where: { userId: owner } });
    for (const payload of [
      { characters: [character('NewOpaque')] },
      { weapons: [] },
      { characters: [], materials: {} },
      {
        weapons: [
          { key: 'ChangedWeapon', level: 1, ascension: 0, refinement: 1, location: 'HuTao' },
        ],
      },
    ]) {
      await commit(payload);
      expect(await service.listGoals(owner)).toEqual(before);
      expect(await focus.list(owner)).toEqual(focused);
    }
    await expect(
      commit({
        weapons: [{ key: 'Bad', level: 1, ascension: 0, refinement: 1, location: 'Missing' }],
      }),
    ).rejects.toThrow();
    expect(await service.listGoals(owner)).toEqual(before);
    expect((await service.listGoals(owner)).find((g) => g.id === active.id)?.fromPhase).toBe(1);
    expect(await db.genshinRoutineState.findUnique({ where: { userId: owner } })).toEqual(routine);
  });
  it('intent and focus writes leave all import receipts, account snapshot and routine untouched', async () => {
    await seed();
    const snapshots = new GenshinImportRepository(db);
    const before = await snapshots.readSnapshot(owner);
    const routine = await db.genshinRoutineState.findUnique({ where: { userId: owner } });
    const goal = await service.createGoal(owner, input());
    await focus.set(owner, 'HuTao', { contractVersion: 1, expectedRevision: 0, focused: true });
    await service.updateGoal(owner, goal.id, command(goal, 'pause'));
    expect(await snapshots.readSnapshot(owner)).toEqual(before);
    expect(await db.genshinRoutineState.findUnique({ where: { userId: owner } })).toEqual(routine);
  });
  it('an actual importer holding the owner lock serializes subsequent goal and focus writes', async () => {
    await seed();
    let reached!: () => void;
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pausedDb = db.$extends({
      query: {
        genshinMaterial: {
          async createMany({ args, query }) {
            reached();
            await gate;
            return query(args);
          },
        },
      },
    });
    const saving = commit(
      { materials: { Mora: 50 } },
      owner,
      new GenshinImportService(new GenshinImportRepository(pausedDb as unknown as PrismaClient)),
    );
    await paused;
    const creating = service.createGoal(owner, input());
    const focusing = focus.set(owner, 'HuTao', {
      contractVersion: 1,
      expectedRevision: 0,
      focused: true,
    });
    try {
      expect(await service.listGoals(owner)).toEqual([]);
      expect(await focus.list(owner)).toEqual([]);
    } finally {
      release();
    }
    await saving;
    await creating;
    await focusing;
    expect((await service.getMaterialDelta(owner)).inventory.Mora).toBe(50);
    expect((await focus.list(owner))[0]?.focused).toBe(true);
  });
  it('direct/indirect GETs are SELECT-only, including missing-account paths', async () => {
    await seed();
    await service.createGoal(owner, input());
    const empty = await user();
    const before = await service.listGoals(owner);
    queries.length = 0;
    for (const id of [owner, empty])
      for (const path of [
        '/companion/goals',
        '/companion/goals/materials',
        '/companion/goals/today',
        '/games/genshin/focus',
        '/games/genshin/intelligence/planner',
        '/games/genshin/characters/HuTao/equipment',
      ]) {
        const response = await api.get(`/api/v1${path}`).auth(auth(id), { type: 'bearer' });
        expect([200, 404, 422]).toContain(response.status);
      }
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await service.listGoals(owner)).toEqual(before);
    expect(await db.genshinAccount.findUnique({ where: { userId: empty } })).toBeNull();
  });
  it('database constraints enforce lifecycle metadata, priority and revisions', async () => {
    for (const extra of [
      { priority: 0 },
      { priority: 6 },
      { revision: -1 },
      { status: 'completed' },
      { completionReason: 'good_enough' },
      { status: 'paused', completedAt: new Date(), completionReason: 'achieved' },
      { completedAt: new Date() },
    ])
      await expect(
        db.upgradeGoal.create({
          data: {
            userId: owner,
            goalType: 'CHARACTER_ASCENSION',
            targetKey: 'HuTao',
            fromPhase: 0,
            toPhase: 6,
            ...extra,
          } as Parameters<typeof db.upgradeGoal.create>[0]['data'],
        }),
      ).rejects.toThrow();
    expect(await db.upgradeGoal.count({ where: { userId: owner } })).toBe(0);
  });
  it('upgrades populated C3a with nullable duplicates, unsupported ranges, two owners and no accounts losslessly', async () => {
    const connection = new Client({ connectionString: databaseUrl! });
    await connection.connect();
    try {
      await connection.query('BEGIN');
      const schema = `c3b_upgrade_${randomUUID().replaceAll('-', '')}`;
      await connection.query(`CREATE SCHEMA "${schema}"`);
      await connection.query(`SET LOCAL search_path TO "${schema}"`);
      const directory = new URL('../../../prisma/migrations/', import.meta.url);
      const folders = (await readdir(directory, { withFileTypes: true }))
        .filter((f) => f.isDirectory())
        .map((f) => f.name)
        .sort();
      const migration = '20261003180000_add_focus_goal_lifecycle';
      for (const name of folders.filter((name) => name < migration))
        await connection.query(await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'));
      await connection.query(`INSERT INTO users (id,email,username,password,"updatedAt") VALUES ('a','a@fixture.invalid','a','fixture','2026-01-01'), ('b','b@fixture.invalid','b','fixture','2026-01-01');
        INSERT INTO upgrade_goals (id,"userId","goalType","targetKey","fromPhase","toPhase","talentType","createdAt","updatedAt") VALUES
        ('null1','a','CHARACTER_ASCENSION','HuTao',0,6,NULL,'2026-01-01','2026-01-02'),
        ('null2','a','CHARACTER_ASCENSION','HuTao',0,5,NULL,'2026-01-03','2026-01-04'),
        ('talent','a','CHARACTER_TALENT','HuTao',1,6,'normal','2026-01-05','2026-01-06'),
        ('invalid','a','CHARACTER_TALENT','Unknown',-5,99,'invalid','2026-01-07','2026-01-08'),
        ('foreign','b','CHARACTER_ASCENSION','HuTao',0,6,NULL,'2026-01-09','2026-01-10');`);
      await connection.query(`INSERT INTO genshin_accounts (id,"userId","updatedAt") VALUES ('account','b','2026-01-01');
        INSERT INTO genshin_characters (id,"accountId","characterKey",level,ascension,constellation,"talentNormal","talentSkill","talentBurst","updatedAt") VALUES ('character','account','HuTao',80,5,3,9,12,15,'2026-01-01');
        INSERT INTO genshin_weapons (id,"accountId","weaponKey",level,ascension,refinement,"updatedAt") VALUES ('weapon','account','StaffOfHoma',80,5,1,'2026-01-01');
        UPDATE genshin_characters SET "equippedWeaponId"='weapon' WHERE id='character';
        INSERT INTO genshin_import_sections (id,"accountId",section,"importedAt",source,"entryCount") VALUES ('receipt','account','characters','2026-01-01','legacy fixture',1);
        INSERT INTO genshin_routine_state ("userId",revision,"serverId","updatedAt") VALUES ('b',7,'asia','2026-01-01');`);
      const preserved = new Map();
      for (const table of [
        'genshin_accounts',
        'genshin_characters',
        'genshin_weapons',
        'genshin_import_sections',
        'genshin_routine_state',
      ])
        preserved.set(table, (await connection.query(`SELECT * FROM ${table}`)).rows);
      const before = (await connection.query('SELECT * FROM upgrade_goals ORDER BY id')).rows;
      const users = (await connection.query('SELECT * FROM users ORDER BY id')).rows;
      await connection.query(
        await readFile(new URL(`${migration}/migration.sql`, directory), 'utf8'),
      );
      const after = (await connection.query('SELECT * FROM upgrade_goals ORDER BY id')).rows;
      expect(after).toHaveLength(before.length);
      for (let i = 0; i < before.length; i++) {
        expect(after[i]).toMatchObject(before[i]);
        expect(after[i]).toMatchObject({
          status: 'active',
          priority: 3,
          revision: 0,
          completedAt: null,
          completionReason: null,
          predecessorId: null,
          createRequestId: null,
        });
      }
      expect((await connection.query('SELECT * FROM users ORDER BY id')).rows).toEqual(users);
      for (const [table, rows] of preserved)
        expect((await connection.query(`SELECT * FROM ${table}`)).rows).toEqual(rows);
      expect(
        (await connection.query('SELECT * FROM genshin_accounts WHERE "userId"=\'a\'')).rows,
      ).toEqual([]);
      expect((await connection.query('SELECT * FROM genshin_character_focus')).rows).toEqual([]);
      await connection.query(
        `UPDATE upgrade_goals SET status='archived' WHERE id='talent'; INSERT INTO upgrade_goals (id,"userId","goalType","targetKey","fromPhase","toPhase","talentType","updatedAt","predecessorId") VALUES ('successor','a','CHARACTER_TALENT','HuTao',1,6,'normal','2026-10-04','talent');`,
      );
      expect(
        (await connection.query('SELECT count(*)::int AS n FROM upgrade_goals')).rows[0].n,
      ).toBe(6);
    } finally {
      await connection.query('ROLLBACK');
      await connection.end();
    }
  }, 20000);
});
