import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

import type { PlanCommand, PlanSnapshot } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';

const shared = vi.hoisted(() => ({ db: null as PrismaClient | null }));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, key) {
        if (!shared.db) throw new Error('Fixture not initialized');
        const value = Reflect.get(shared.db, key);
        return typeof value === 'function' ? value.bind(shared.db) : value;
      },
    },
  ),
}));
vi.mock('@/core/config/env.js', () => ({
  env: { NODE_ENV: 'test', JWT_SECRET: 'c4-fixture-secret-only', JWT_EXPIRY: '1h' },
}));
// No application import or connection until this fail-closed guard has run.
const databaseUrl = disposableTestDatabase();

describe.skipIf(!databaseUrl)('C4 actual PostgreSQL plan choices and reset boundaries', () => {
  let db: PrismaClient;
  let service: import('./plan.service.js').PlanService;
  let provider: import('../../games/genshin/companion/genshin-companion.provider.js').GenshinCompanionProvider;
  let goals: import('./goal.service.js').GoalService;
  let routine: import('./routine.service.js').RoutineService;
  let importer: import('../../games/genshin/importer/importer.service.js').GenshinImportService;
  let repository: import('./plan.repository.js').PlanRepository;
  let api: ReturnType<typeof supertest>;
  let owner: string;
  let now: Date;
  const owners: string[] = [],
    queries: string[] = [];
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `c4-${id}`, email: `${id}@test.invalid`, password: 'fixture' },
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
  const auth = (id = owner) => jwt.sign({ sid: id }, 'c4-fixture-secret-only', { subject: id });
  const preference = (expectedRevision = 0, dailyResinBudget: number | null = 70): PlanCommand => ({
    contractVersion: 1,
    expectedRevision,
    action: 'preferences',
    preferences: { dailyResinBudget, enabledRoutineKinds: ['commissions', 'weeklyClaims'] },
  });
  const makeGoal = (target = owner, extra = {}) =>
    goals.createGoal(target, {
      contractVersion: 3,
      requestId: randomUUID(),
      goalType: 'CHARACTER_TALENT',
      targetKey: 'HuTao',
      talentType: 'normal',
      fromPhase: 1,
      toPhase: 6,
      priority: 3,
      ...extra,
    });
  const select = () =>
    routine.patchSettings(owner, { contractVersion: 2, expectedRevision: 0, serverId: 'asia' });
  it.each(['america', 'europe', 'tw_hk_mo'] as const)(
    'saves a %s period dismissal and rejects it after a server change',
    async (serverId) => {
      await makeGoal();
      await routine.patchSettings(owner, { contractVersion: 2, expectedRevision: 0, serverId });
      const before = await service.getSnapshot(owner);
      const saved = await service.update(owner, dismissal(before, { serverId }));
      expect(saved.goals[0]?.dismissed).toEqual(['day']);
      expect(
        (await db.genshinPlanDismissal.findFirst({ where: { userId: owner } }))?.serverId,
      ).toBe(serverId);
      await routine.patchSettings(owner, {
        contractVersion: 2,
        expectedRevision: 1,
        serverId: 'asia',
      });
      expect((await service.getSnapshot(owner)).goals[0]?.dismissed).toEqual([]);
      await expect(service.update(owner, dismissal(saved, { serverId }))).rejects.toMatchObject({
        statusCode: 409,
      });
    },
  );
  const dismissal = (plan: PlanSnapshot, extra = {}): PlanCommand =>
    ({
      contractVersion: 1,
      action: 'dismissal',
      expectedRevision: plan.revision,
      expectedRoutineRevision: plan.routineRevision,
      serverId: 'asia',
      dailyPeriodId: plan.period!.dailyPeriodId,
      weeklyPeriodId: plan.period!.weeklyPeriodId,
      source: {
        kind: 'goal',
        goalId: plan.goals[0]!.goal.id,
        expectedGoalRevision: plan.goals[0]!.goal.revision,
      },
      scope: 'day',
      dismissed: true,
      ...extra,
    }) as PlanCommand;
  const commit = async (
    materials: Record<string, number>,
    source = 'C4 synthetic stock',
    impl = importer,
  ) => {
    const request = {
      requestVersion: 1,
      sections: ['materials'],
      payload: { format: 'GOOD', version: 2, source, materials },
    };
    const preview = await impl.preview(owner, request);
    return impl.importAccount(owner, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  beforeAll(async () => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (event) => queries.push(event.query));
    db = client;
    shared.db = db;
    const [
      { app },
      { PlanService },
      { PlanRepository },
      { GoalService },
      { GoalRepository },
      { RoutineService },
      { RoutineRepository },
      { GenshinCompanionProvider },
      { GenshinImportService },
      { GenshinImportRepository },
    ] = await Promise.all([
      import('@/app.js'),
      import('./plan.service.js'),
      import('./plan.repository.js'),
      import('./goal.service.js'),
      import('./goal.repository.js'),
      import('./routine.service.js'),
      import('./routine.repository.js'),
      import('../../games/genshin/companion/genshin-companion.provider.js'),
      import('../../games/genshin/importer/importer.service.js'),
      import('../../games/genshin/importer/importer.repository.js'),
    ]);
    provider = new GenshinCompanionProvider();
    repository = new PlanRepository(db);
    goals = new GoalService(() => now, new GoalRepository(db));
    service = new PlanService(provider, repository, new GoalRepository(db), goals, () => now);
    routine = new RoutineService(new RoutineRepository(db), provider, () => now, db);
    importer = new GenshinImportService(new GenshinImportRepository(db));
    api = supertest(app);
  });
  beforeEach(async () => {
    now = new Date('2026-10-05T00:00:00Z');
    owner = await user();
    queries.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });

  it('fresh defaults are SELECT-only, opt-in, budget-unset and usable before import', async () => {
    const plan = await service.getSnapshot(owner);
    expect(plan).toMatchObject({
      revision: 0,
      preferences: { enabledRoutineKinds: [], dailyResinBudget: null },
      goals: [],
      period: null,
    });
    expect(queries).toHaveLength(1);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await db.genshinPlanPreferences.count({ where: { userId: owner } })).toBe(0);
    expect(await db.genshinAccount.count({ where: { userId: owner } })).toBe(0);
  });
  it.each(['asia', 'america', 'europe', 'tw_hk_mo'] as const)(
    'serves owned read-only farming projections on %s without counting another owner stock',
    async (serverId) => {
      await routine.patchSettings(owner, { contractVersion: 2, expectedRevision: 0, serverId });
      await service.update(owner, preference(0, 40));
      await makeGoal();
      await commit({ TeachingsOfDiligence: 1, GuideToDiligence: 1, EnergyNectar: 1 });
      const foreign = await user();
      await makeGoal(foreign, {
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'StaffOfHoma',
        talentType: null,
        fromPhase: 0,
        toPhase: 6,
      });
      queries.length = 0;
      const response = await api
        .get(
          '/api/v1/games/genshin/intelligence/farming?contractVersion=1&talentTier=4&materialKey=EnergyNectar&maxStops=5',
        )
        .auth(auth(), { type: 'bearer' })
        .expect(200);
      const result = response.body.data.recommendation;
      expect(result.serverId).toBe(serverId);
      expect(result.estimates).toHaveLength(1);
      expect(result.estimates[0].materialKeys).toEqual([
        'TeachingsOfDiligence',
        'GuideToDiligence',
        'PhilosophiesOfDiligence',
      ]);
      expect(result.estimates[0].projection.state).toBe('estimated');
      expect(result.route.stops).toHaveLength(5);
      expect(result.dailyResinBudget).toBe(40);
      expect(result.goalRevisions).toHaveLength(1);
      expect(result.serverWeekday).toBe(
        provider.getServerWeekday(serverId, new Date(result.serverNow)),
      );
      const schedule = (
        await api
          .get('/api/v1/games/genshin/intelligence/farming?contractVersion=1&includeRoute=false')
          .auth(auth(), { type: 'bearer' })
          .expect(200)
      ).body.data.recommendation;
      expect(schedule.serverWeekday).toBe(result.serverWeekday);
      expect(schedule.estimates[0].domain.days).toEqual([1, 4, 6]);
      expect(schedule.route.stops).toEqual([]);
      expect(schedule.teleports).toEqual([]);
      expect(queries.length).toBeGreaterThan(0);
      expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    },
  );
  it('rejects unauthenticated and identity-bearing farming requests and leaves fresh state absent', async () => {
    const route = '/api/v1/games/genshin/intelligence/farming';
    await api.get(route + '?contractVersion=1').expect(401);
    await api
      .get(route + '?contractVersion=1&owner=foreign')
      .auth(auth(), { type: 'bearer' })
      .expect(400);
    await api
      .get(route + '?contractVersion=1&maxStops=200000')
      .auth(auth(), { type: 'bearer' })
      .expect(400);
    const response = await api
      .get(route + '?contractVersion=1')
      .auth(auth(), { type: 'bearer' })
      .expect(200);
    expect(response.body.data.recommendation.estimates).toEqual([]);
    expect(response.body.data.recommendation.route.available).toBe(false);
    expect(await db.genshinPlanPreferences.count({ where: { userId: owner } })).toBe(0);
    expect(await db.genshinRoutineState.count({ where: { userId: owner } })).toBe(0);
    expect(await db.genshinAccount.count({ where: { userId: owner } })).toBe(0);
  });
  it('persists preferences including zero and disable/re-enable without deleting routine records', async () => {
    await select();
    const recorded = await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { commissionsDone: true, dailyPeriodStart: now },
    });
    const saved = await service.update(owner, preference(0, 0));
    expect(saved.preferences.dailyResinBudget).toBe(0);
    expect((await service.getSnapshot(owner)).preferences).toEqual(saved.preferences);
    await service.update(owner, {
      ...preference(1),
      action: 'preferences',
      preferences: { enabledRoutineKinds: [], dailyResinBudget: null },
    });
    expect(await db.genshinRoutineState.findUnique({ where: { userId: owner } })).toEqual(recorded);
    expect((await service.update(owner, preference(2))).routines.map((r) => r.kind)).toEqual([
      'commissions',
      'weeklyClaims',
    ]);
  });
  it.each([false, true])(
    'serializes concurrent %s existing/first writes with one winner',
    async (existing) => {
      if (existing) await service.update(owner, preference());
      const revision = existing ? 1 : 0;
      const results = await Promise.allSettled([
        service.update(owner, preference(revision, 40)),
        service.update(owner, preference(revision, 80)),
      ]);
      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
      expect(results.filter((r) => r.status === 'rejected')).toMatchObject([
        { reason: { statusCode: 409 } },
      ]);
      expect((await service.getSnapshot(owner)).revision).toBe(revision + 1);
    },
  );
  it('dismisses/restores without changing intent, stock or completion; storage is bounded per source/scope', async () => {
    const goal = await makeGoal();
    await select();
    await commit({ Mora: 7 });
    let plan = await service.getSnapshot(owner);
    plan = await service.update(owner, dismissal(plan));
    expect(plan.goals[0]?.dismissed).toEqual(['day']);
    expect((await service.getAdvice(owner)).materials.needed.Mora).toBe(122500);
    plan = await service.update(owner, dismissal(plan, { dismissed: false }));
    expect(plan.goals[0]?.dismissed).toEqual([]);
    expect((await goals.listGoals(owner))[0]).toEqual(goal);
    await service.update(owner, dismissal(plan));
    now = new Date('2026-10-06T00:00:00Z');
    await service.update(owner, dismissal(await service.getSnapshot(owner)));
    expect(await db.genshinPlanDismissal.count({ where: { userId: owner } })).toBe(1);
  });
  it('routine identities and periods are strict and restore is not completion', async () => {
    await select();
    const plan = await service.update(owner, preference());
    const command = {
      ...dismissal({
        ...plan,
        goals: [{ goal: { id: randomUUID(), revision: 0 } as never, dismissed: [] }],
      }),
      source: { kind: 'routine', routineKind: 'commissions' },
    };
    const saved = await service.update(owner, command);
    expect(saved.routines[0]).toMatchObject({ dismissed: true, task: { done: false } });
    await expect(
      service.update(owner, { ...command, expectedRevision: saved.revision, scope: 'week' }),
    ).rejects.toMatchObject({ statusCode: 400 });
    const restored = await service.update(owner, {
      ...command,
      expectedRevision: saved.revision,
      dismissed: false,
    });
    expect(restored.routines[0]).toMatchObject({ dismissed: false, task: { done: false } });
  });
  it('foreign/missing goal IDs are 404 and owner snapshots never contain another owner data', async () => {
    const other = await user();
    const foreign = await makeGoal(other);
    await makeGoal();
    await select();
    const plan = await service.getSnapshot(owner);
    for (const id of [foreign.id, randomUUID()])
      await expect(
        service.update(
          owner,
          dismissal(plan, { source: { kind: 'goal', goalId: id, expectedGoalRevision: 0 } }),
        ),
      ).rejects.toMatchObject({ statusCode: 404 });
    expect((await service.getSnapshot(other)).preferences.dailyResinBudget).toBeNull();
    expect(plan.goals.map((g) => g.goal.id)).not.toContain(foreign.id);
  });
  it.each(['priority', 'edit', 'pause'])(
    'a %s goal change retires obsolete dismissal',
    async (action) => {
      const goal = await makeGoal();
      await select();
      await service.update(owner, dismissal(await service.getSnapshot(owner)));
      await goals.updateGoal(owner, goal.id, {
        contractVersion: 3,
        expectedRevision: 0,
        action,
        ...(action === 'priority'
          ? { priority: 1 }
          : action === 'edit'
            ? { fromPhase: 2, toPhase: 6, priority: 3 }
            : {}),
      });
      if (action === 'pause')
        await goals.updateGoal(owner, goal.id, {
          contractVersion: 3,
          expectedRevision: 1,
          action: 'resume',
        });
      expect((await service.getSnapshot(owner)).goals[0]?.dismissed).toEqual([]);
    },
  );
  it('server round trips clear dismissals and prevent stale writes even in the same Asia period', async () => {
    await makeGoal();
    await select();
    const saved = await service.update(owner, dismissal(await service.getSnapshot(owner)));
    await routine.patchSettings(owner, { contractVersion: 2, expectedRevision: 1, serverId: null });
    await routine.patchSettings(owner, {
      contractVersion: 2,
      expectedRevision: 2,
      serverId: 'asia',
    });
    const after = await service.getSnapshot(owner);
    expect(after.goals[0]?.dismissed).toEqual([]);
    expect(after.revision).toBe(saved.revision + 2);
    await expect(service.update(owner, dismissal(saved))).rejects.toMatchObject({
      statusCode: 409,
    });
  });
  it.each(['day', 'week'] as const)(
    'projects %s dismissal before/exactly/after reset without writes; recurring budget persists',
    async (scope) => {
      now = new Date(scope === 'day' ? '2026-10-05T19:59:59.999Z' : '2026-10-04T19:59:59.999Z');
      await makeGoal();
      await select();
      await service.update(owner, preference());
      let plan = await service.getSnapshot(owner);
      plan = await service.update(owner, dismissal(plan, { scope }));
      expect(plan.goals[0]?.dismissed).toEqual([scope]);
      const rows = await db.genshinPlanDismissal.findMany({ where: { userId: owner } });
      for (const increment of [1, 2]) {
        now = new Date(now.getTime() + increment);
        queries.length = 0;
        const fresh = await service.getSnapshot(owner);
        expect(fresh.goals[0]?.dismissed).toEqual([]);
        expect(fresh.preferences.dailyResinBudget).toBe(70);
        expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
      }
      expect(await db.genshinPlanDismissal.findMany({ where: { userId: owner } })).toEqual(rows);
    },
  );
  it('daily rollover keeps a same-week dismissal and weekly count, weekly rollover shows unknown count', async () => {
    await makeGoal();
    await select();
    const p = provider.getPeriodBoundaries('asia', now)!;
    await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { weeklyPeriodStart: p.weeklyBoundary, weeklyRewardClaims: 0 },
    });
    await service.update(owner, dismissal(await service.getSnapshot(owner), { scope: 'week' }));
    now = new Date('2026-10-06T00:00:00Z');
    expect(await service.getSnapshot(owner)).toMatchObject({
      goals: [{ dismissed: ['week'] }],
      weekly: { rewardClaims: 0 },
    });
    now = new Date('2026-10-11T20:00:00Z');
    expect(await service.getSnapshot(owner)).toMatchObject({
      goals: [{ dismissed: [] }],
      weekly: { rewardClaims: null },
    });
  });
  it('unsupported clock keeps manual choices/goals usable and refuses period dismissal', async () => {
    const { GenshinCompanionProvider } =
      await import('../../games/genshin/companion/genshin-companion.provider.js');
    const { PlanService } = await import('./plan.service.js');
    const { GoalRepository } = await import('./goal.repository.js');
    const unsupported = new PlanService(
      new GenshinCompanionProvider(false),
      repository,
      new GoalRepository(db),
      goals,
      () => now,
    );
    await makeGoal();
    await select();
    const plan = await service.getSnapshot(owner);
    expect((await unsupported.update(owner, preference())).goals).toHaveLength(1);
    await expect(
      unsupported.update(owner, { ...dismissal(plan), expectedRevision: 1 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });
  it.each(['day', 'week'])(
    'samples time after actual lock wait spanning %s reset',
    async (scope) => {
      now = new Date(scope === 'day' ? '2026-10-05T19:59:59.999Z' : '2026-10-04T19:59:59.999Z');
      await makeGoal();
      await select();
      const command = dismissal(await service.getSnapshot(owner), { scope });
      let release!: () => void, locked!: () => void;
      const hold = new Promise<void>((resolve) => {
        release = resolve;
      });
      const acquired = new Promise<void>((resolve) => {
        locked = resolve;
      });
      const blocker = db.$transaction(
        async (tx) => {
          await tx.$queryRaw`SELECT id FROM users WHERE id = ${owner} FOR UPDATE`;
          locked();
          await hold;
        },
        { timeout: 10000 },
      );
      await acquired;
      const saving = service.update(owner, command).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: null, error }),
      );
      try {
        await vi.waitFor(
          async () => {
            const waiting = await db.$queryRaw<
              { count: bigint }[]
            >`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%FROM users WHERE id =%'`;
            expect(Number(waiting[0]!.count)).toBeGreaterThan(0);
          },
          { timeout: 5000, interval: 25 },
        );
        now = new Date(now.getTime() + 1);
      } finally {
        release();
        await blocker;
      }
      expect((await saving).error).toMatchObject({ statusCode: 409 });
      expect((await service.getSnapshot(owner)).revision).toBe(0);
    },
  );
  it('stale routine/goal/period revisions reject atomically, preserving choices', async () => {
    await makeGoal();
    await select();
    const plan = await service.getSnapshot(owner);
    const valid = dismissal(plan);
    for (const bad of [
      { expectedRoutineRevision: 99 },
      { dailyPeriodId: 'old' },
      { weeklyPeriodId: 'old' },
      { source: { kind: 'goal', goalId: plan.goals[0]!.goal.id, expectedGoalRevision: 99 } },
    ])
      await expect(service.update(owner, { ...valid, ...bad })).rejects.toMatchObject({
        statusCode: 409,
      });
    expect((await service.getSnapshot(owner)).revision).toBe(0);
  });
  it.each([false, true])(
    'response failure rolls back %s existing/first preferences and dismissal writes',
    async (existing) => {
      await makeGoal();
      await select();
      if (existing) await service.update(owner, preference());
      const before = await repository.read(owner);
      const plan = await service.getSnapshot(owner);
      const project = service.project.bind(service);
      let calls = 0;
      const spy = vi.spyOn(service, 'project').mockImplementation((context, instant) => {
        if (++calls === 2) throw new Error('Forced response failure');
        return project(context, instant);
      });
      try {
        await expect(service.update(owner, dismissal(plan))).rejects.toThrow(
          'Forced response failure',
        );
      } finally {
        spy.mockRestore();
      }
      expect(await repository.read(owner)).toEqual(before);
    },
  );
  it('database constraints enforce budget, owner/goal ownership, routine kind and source identity', async () => {
    for (const budget of [-1, 201])
      await expect(
        db.genshinPlanPreferences.create({ data: { userId: owner, dailyResinBudget: budget } }),
      ).rejects.toThrow();
    const other = await user();
    const foreign = await makeGoal(other);
    const base = {
      userId: owner,
      sourceKey: `goal:${foreign.id}`,
      goalId: foreign.id,
      goalRevision: 0,
      scope: 'day',
      serverId: 'asia',
      periodId: 'period',
    };
    await expect(db.genshinPlanDismissal.create({ data: base })).rejects.toThrow();
    const own = await makeGoal();
    for (const bad of [
      { ...base, goalId: own.id },
      { ...base, sourceKey: `goal:${own.id}`, goalId: own.id, goalRevision: -1 },
      { ...base, sourceKey: 'routine:bad', goalId: null, goalRevision: null, routineKind: 'bad' },
      {
        ...base,
        sourceKey: 'routine:teapot',
        goalId: null,
        goalRevision: null,
        routineKind: 'teapot',
        scope: 'week',
      },
    ])
      await expect(db.genshinPlanDismissal.create({ data: bad })).rejects.toThrow();
  });
  it('preserves duplicate/malformed/paused/closed records while excluding ineligible demand', async () => {
    await makeGoal();
    await makeGoal(owner, { talentType: 'skill' });
    await db.upgradeGoal.create({
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
    const malformed = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'Unknown',
        talentType: 'bad',
        fromPhase: -8,
        toPhase: 99,
      },
    });
    const before = await db.upgradeGoal.findMany({ where: { userId: owner } });
    const advice = await service.getAdvice(owner);
    expect(advice.materials.needed.Mora).toBe(122500);
    expect(advice.materials.neededComplete).toBe(false);
    expect(await db.upgradeGoal.findMany({ where: { userId: owner } })).toEqual(before);
    await goals.updateGoal(owner, malformed.id, {
      contractVersion: 3,
      expectedRevision: 0,
      action: 'priority',
      priority: 1,
    });
    expect((await service.getSnapshot(owner)).goals[0]?.goal).toMatchObject({
      id: malformed.id,
      priority: 1,
      fromPhase: -8,
      toPhase: 99,
      talentType: 'bad',
    });
  });
  it('partial, empty and positive re-imports preserve preferences/dismissals/all intent', async () => {
    await makeGoal();
    await select();
    await service.update(owner, preference());
    await service.update(owner, dismissal(await service.getSnapshot(owner)));
    const before = await repository.read(owner);
    for (const values of [{ Mora: 42 }, {}, { Mora: 0 }, { Mora: 12500 }] as Record<
      string,
      number
    >[]) {
      await commit(values);
      expect(await repository.read(owner)).toEqual(before);
    }
    expect((await service.getAdvice(owner)).materials.inventory).toEqual({ Mora: 12500 });
  });
  it('a replacement import exposes complete old/new stock receipts without blocking or mutation on read', async () => {
    await makeGoal();
    await select();
    await commit({ Mora: 1 }, 'old synthetic');
    const { GenshinImportRepository } =
      await import('../../games/genshin/importer/importer.repository.js');
    const { GenshinImportService } =
      await import('../../games/genshin/importer/importer.service.js');
    let release!: () => void, reached!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const paused = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const delayed = db.$extends({
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
      { Mora: 200000 },
      'new synthetic',
      new GenshinImportService(new GenshinImportRepository(delayed as unknown as PrismaClient)),
    );
    try {
      await paused;
      queries.length = 0;
      const result = await service.getAdvice(owner);
      expect(result.materials).toMatchObject({
        inventory: { Mora: 1 },
        stockBasis: { source: 'old synthetic' },
      });
      expect(queries).toHaveLength(3);
      expect(queries.every((q) => /^SELECT\b/i.test(q.trim()))).toBe(true);
    } finally {
      release();
      await saving;
    }
    expect((await service.getAdvice(owner)).materials).toMatchObject({
      inventory: { Mora: 200000 },
      stockBasis: { source: 'new synthetic' },
    });
  });
  it('preserves UTC timestamps through plan, Materials and character equipment JSON reads', async () => {
    const goal = await makeGoal();
    await select();
    await commit({ Mora: 1 });
    const request = {
      requestVersion: 1,
      sections: ['characters', 'weapons', 'artifacts'],
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'C4 synthetic timestamp regression',
        characters: [
          {
            key: 'HuTao',
            level: 80,
            ascension: 5,
            constellation: 0,
            talent: { auto: 1, skill: 1, burst: 1 },
          },
        ],
        weapons: [],
        artifacts: [],
      },
    };
    const preview = await importer.preview(owner, request);
    await importer.importAccount(owner, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
    const receivedAt = new Date('2026-10-05T00:15:30.123Z');
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    await db.genshinImportSectionState.updateMany({
      where: { accountId: account.id },
      data: { importedAt: receivedAt },
    });
    await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { resinAmount: 80, resinRecordedAt: now },
    });
    const plan = await service.getSnapshot(owner);
    expect(plan.goals[0]!.goal.createdAt).toBe(goal.createdAt);
    expect((await service.getAdvice(owner)).availableResin).toBe(80);
    expect((await service.getAdvice(owner)).materials.stockBasis.importedAt).toBe(
      receivedAt.toISOString(),
    );
    expect((await goals.getMaterialDelta(owner)).stockBasis.importedAt).toBe(
      receivedAt.toISOString(),
    );
    const equipment = await api
      .get('/api/v1/games/genshin/characters/HuTao/equipment')
      .auth(auth(), { type: 'bearer' });
    expect(equipment.status).toBe(200);
    for (const section of ['characters', 'weapons', 'artifacts'])
      expect(equipment.body.data.provenance[section].importedAt).toBe(receivedAt.toISOString());
  });
  it('concurrent goal changes during stock read retry coherently and sustained churn fails closed', async () => {
    const goal = await makeGoal();
    const original = provider.getRecordedStock.bind(provider);
    let reads = 0;
    const spy = vi.spyOn(provider, 'getRecordedStock').mockImplementation(async (id) => {
      const result = await original(id);
      if (reads++ === 0)
        await goals.updateGoal(owner, goal.id, {
          contractVersion: 3,
          expectedRevision: 0,
          action: 'edit',
          fromPhase: 2,
          toPhase: 6,
          priority: 3,
        });
      return result;
    });
    try {
      expect((await service.getAdvice(owner)).materials.needed.Mora).toBe(110000);
      expect(reads).toBe(2);
    } finally {
      spy.mockRestore();
    }
    let revision = 1;
    const churn = vi.spyOn(provider, 'getRecordedStock').mockImplementation(async (id) => {
      const result = await original(id);
      await goals.updateGoal(owner, goal.id, {
        contractVersion: 3,
        expectedRevision: revision++,
        action: 'priority',
        priority: 3,
      });
      return result;
    });
    try {
      await expect(service.getAdvice(owner)).rejects.toMatchObject({ statusCode: 409 });
    } finally {
      churn.mockRestore();
    }
  });
  it('authenticated HTTP contracts and combined/indirect GETs remain SELECT-only at first use and rollover', async () => {
    expect((await api.get('/api/v1/companion/plan?contractVersion=1')).status).toBe(401);
    expect((await api.get('/api/v1/companion/plan').auth(auth(), { type: 'bearer' })).status).toBe(
      400,
    );
    expect(
      (
        await api
          .patch('/api/v1/companion/plan')
          .auth(auth(), { type: 'bearer' })
          .send({ ...preference(), userId: 'foreign' })
      ).status,
    ).toBe(400);
    for (const seeded of [false, true]) {
      if (seeded) {
        await makeGoal();
        await select();
        await db.genshinRoutineState.update({
          where: { userId: owner },
          data: {
            dailyPeriodStart: new Date('2020-01-01'),
            weeklyPeriodStart: new Date('2020-01-01'),
            resinAmount: 80,
            resinRecordedAt: new Date(),
          },
        });
        await commit({ Mora: 1 });
      }
      queries.length = 0;
      for (const path of [
        '/companion/plan?contractVersion=1',
        '/companion/plan/advice?contractVersion=1',
        '/companion/goals',
        '/companion/goals/materials',
        '/companion/routine?contractVersion=2',
        ...(seeded ? ['/companion/goals/today', '/games/genshin/intelligence/planner'] : []),
      ])
        expect((await api.get(`/api/v1${path}`).auth(auth(), { type: 'bearer' })).status).toBe(200);
      expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    }
    const response = await api
      .patch('/api/v1/companion/plan')
      .auth(auth(), { type: 'bearer' })
      .send(preference());
    expect(response.status).toBe(200);
    expect(response.body.data.revision).toBe(1);
  });
  it('upgrades populated C3b losslessly with neutral absent preferences and no dismissal backfill', async () => {
    const connection = new Client({ connectionString: databaseUrl! });
    await connection.connect();
    try {
      await connection.query('BEGIN');
      const schema = `c4_upgrade_${randomUUID().replaceAll('-', '')}`;
      await connection.query(`CREATE SCHEMA "${schema}"`);
      await connection.query(`SET LOCAL search_path TO "${schema}"`);
      const directory = new URL('../../../prisma/migrations/', import.meta.url);
      const migration = '20261005150000_add_today_plan_choices';
      for (const name of (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory() && entry.name < migration)
        .map((entry) => entry.name)
        .sort())
        await connection.query(await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'));
      await connection.query(`INSERT INTO users (id,email,username,password,"updatedAt") VALUES ('a','a@fixture.invalid','a','fixture','2026-01-01'),('b','b@fixture.invalid','b','fixture','2026-01-01');
        INSERT INTO upgrade_goals (id,"userId","goalType","targetKey","fromPhase","toPhase","talentType",status,revision,"updatedAt") VALUES
        ('legacy','a','CHARACTER_TALENT','Unknown',-8,99,'bad','active',3,'2026-01-02'),
        ('duplicate','a','CHARACTER_TALENT','Unknown',-8,99,'bad','paused',2,'2026-01-03'),
        ('closed','b','CHARACTER_ASCENSION','HuTao',0,6,NULL,'archived',7,'2026-01-04');
        INSERT INTO genshin_routine_state ("userId",revision,"serverId","updatedAt") VALUES ('b',7,'asia','2026-01-05');
        INSERT INTO genshin_accounts (id,"userId","updatedAt") VALUES ('account','b','2026-01-01');
        INSERT INTO genshin_materials (id,"accountId","itemKey",quantity,"updatedAt") VALUES ('stock','account','Mora',7,'2026-01-01');
        INSERT INTO genshin_import_sections (id,"accountId",section,"importedAt",source,"entryCount") VALUES ('receipt','account','materials','2026-01-01','legacy',1);`);
      const tables = [
        'users',
        'upgrade_goals',
        'genshin_routine_state',
        'genshin_accounts',
        'genshin_materials',
        'genshin_import_sections',
      ];
      const before = [];
      for (const table of tables)
        before.push((await connection.query(`SELECT * FROM ${table}`)).rows);
      await connection.query(
        await readFile(new URL(`${migration}/migration.sql`, directory), 'utf8'),
      );
      for (let i = 0; i < tables.length; i++)
        expect((await connection.query(`SELECT * FROM ${tables[i]}`)).rows).toEqual(before[i]);
      expect((await connection.query('SELECT * FROM genshin_plan_preferences')).rows).toEqual([]);
      expect((await connection.query('SELECT * FROM genshin_plan_dismissals')).rows).toEqual([]);
    } finally {
      await connection.query('ROLLBACK');
      await connection.end();
    }
  }, 20000);
});
