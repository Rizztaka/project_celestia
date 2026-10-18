import { randomUUID } from 'node:crypto';

import type { MaterialAdviceResponse } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GenshinImportRepository } from '../../games/genshin/importer/importer.repository.js';
import { GenshinImportService } from '../../games/genshin/importer/importer.service.js';

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
const secret = 'local-c2b-test-secret-at-least-32-characters';
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-c2b-test-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { app } from '@/app.js';

const databaseUrl = process.env.CELESTIA_TEST_DATABASE_URL;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !url.pathname.startsWith('/celestia_test_')
  ) {
    throw new Error('C2b requires an explicit disposable loopback celestia_test_* database.');
  }
}
describe.skipIf(!databaseUrl)('C2b actual PostgreSQL advice/import reads', () => {
  let db: PrismaClient;
  let owner: string;
  let importer: GenshinImportService;
  const owners: string[] = [];
  const queries: string[] = [];
  const api = supertest(app);
  const auth = (id = owner) => jwt.sign({ sid: id }, secret, { subject: id });
  const read = async (id = owner) => {
    const response = await api
      .get('/api/v1/companion/goals/materials')
      .auth(auth(id), { type: 'bearer' });
    expect(response.status).toBe(200);
    return response.body.data as MaterialAdviceResponse;
  };
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `c2b-${id}`, email: `${id}@test.invalid`, password: 'test-only' },
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
  const talent = async (talentType = 'normal', id = owner) =>
    db.upgradeGoal.create({
      data: {
        userId: id,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'HuTao',
        fromPhase: 1,
        toPhase: 2,
        talentType,
      },
    });
  async function stock(materials: Record<string, number>, id = owner) {
    const request = {
      requestVersion: 1,
      sections: ['materials'],
      payload: { format: 'GOOD', version: 2, source: 'C2b fixture', materials },
    };
    const preview = await importer.preview(id, request);
    await importer.importAccount(id, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  }
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (event) => queries.push(event.query));
    db = client;
    shared.db = db;
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

  it('returns independently known needed totals with unknown absent stock before import', async () => {
    await talent();
    const result = await read();
    expect(result.needed).toEqual({ TeachingsOfDiligence: 3, WhopperflowerNectar: 6, Mora: 12500 });
    expect(result.delta).toEqual({
      TeachingsOfDiligence: null,
      WhopperflowerNectar: null,
      Mora: null,
    });
    expect(result.stockBasis.importedAt).toBeNull();
  });
  it('aggregates weapon and shared talent costs while reporting invalid intent', async () => {
    await talent();
    await talent('burst');
    await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'StaffOfHoma',
        fromPhase: 0,
        toPhase: 6,
      },
    });
    const invalid = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_TALENT',
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 6,
        talentType: 'skill',
      },
    });
    const result = await read();
    expect(result.needed).toEqual({
      TeachingsOfDiligence: 6,
      WhopperflowerNectar: 12,
      Mora: 250000,
      GrainOfAerosiderite: 5,
      PieceOfAerosiderite: 14,
      BitOfAerosiderite: 14,
      ChunkOfAerosiderite: 6,
      DeadLeyLineBranch: 23,
      DeadLeyLineLeaves: 27,
      LeyLineSprout: 41,
      SlimeCondensate: 15,
      SlimeSecretions: 23,
      SlimeConcentrate: 27,
    });
    expect(result.neededComplete).toBe(false);
    expect(result.goals.filter((g) => !g.available).map((g) => g.goalId)).toEqual([invalid.id]);
    expect(result.goals.every((g) => g.available || !!g.reason)).toBe(true);
    expect(await db.upgradeGoal.count({ where: { userId: owner } })).toBe(4);
  });
  it('uses positive recorded import quantities, preserves unknown keys, and computes zero when covered', async () => {
    await talent();
    await stock({ Mora: 13000, TeachingsOfDiligence: 1, OpaqueImportedKey: 7 });
    const result = await read();
    expect(result.inventory).toEqual({
      Mora: 13000,
      TeachingsOfDiligence: 1,
      OpaqueImportedKey: 7,
    });
    expect(result.delta).toEqual({ Mora: 0, TeachingsOfDiligence: 2, WhopperflowerNectar: null });
    expect(result.stockBasis).toMatchObject({
      kind: 'recorded_import',
      source: 'C2b fixture',
      scope: 'replacement_section',
      suppliedEntryCount: 3,
    });
    expect(result.stockBasis.importedAt).not.toBeNull();
  });
  it.each([{}, { Mora: 0 }] as Record<string, number>[])(
    'empty and zero-only imports preserve absent-stock uncertainty: %j',
    async (materials) => {
      await talent();
      await stock(materials);
      const result = await read();
      expect(result.inventory).toEqual({});
      expect(result.stockBasis.suppliedEntryCount).toBe(0);
      expect(Object.values(result.delta)).toEqual([null, null, null]);
    },
  );
  it('keeps another owner’s goals and stock isolated with independent bearer sessions', async () => {
    const other = await user();
    await talent();
    await talent('normal', other);
    await stock({ Mora: 1 });
    await stock({ Mora: 12500 }, other);
    expect((await read()).delta.Mora).toBe(12499);
    expect((await read(other)).delta.Mora).toBe(0);
    expect((await read()).goals[0]!.goalId).not.toBe((await read(other)).goals[0]!.goalId);
    expect((await api.get('/api/v1/companion/goals/materials')).status).toBe(401);
  });
  it('returns no complete demand for all-unavailable goals, without deleting them', async () => {
    const goal = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_ASCENSION',
        targetKey: 'UncataloguedCharacter',
        fromPhase: 0,
        toPhase: 6,
      },
    });
    expect(await read()).toMatchObject({
      needed: {},
      neededComplete: false,
      goals: [{ goalId: goal.id, available: false }],
    });
    expect(await db.upgradeGoal.findUnique({ where: { id: goal.id } })).not.toBeNull();
  });
  it('all bounded GET paths are SELECT-only and leave routine/import/progress records unchanged', async () => {
    await talent();
    await stock({ Mora: 12500 });
    const routine = await db.genshinRoutineState.create({
      data: {
        userId: owner,
        serverId: 'asia',
        revision: 1,
        resinAmount: 80,
        resinRecordedAt: new Date(),
        weeklyRewardClaims: 3,
        weeklyPeriodStart: new Date(),
        transformerLastUsedAt: new Date(),
      },
    });
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    const before = await db.genshinImportSectionState.findMany({
      where: { accountId: account.id },
    });
    queries.length = 0;
    for (const path of [
      '/companion/goals/materials',
      '/companion/goals/today',
      '/games/genshin/intelligence/planner',
      '/companion/events',
      '/companion/routine?contractVersion=2',
    ]) {
      expect((await api.get(`/api/v1${path}`).auth(auth(), { type: 'bearer' })).status).toBe(200);
    }
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await db.genshinRoutineState.findUnique({ where: { userId: owner } })).toEqual(routine);
    expect(
      await db.genshinImportSectionState.findMany({ where: { accountId: account.id } }),
    ).toEqual(before);
  });
  it('reads stock and its receipt coherently through an in-progress replacement with one stock SELECT', async () => {
    await talent();
    await stock({ Mora: 1 });
    const before = await read();
    let reached!: () => void;
    let release!: () => void;
    const paused = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
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
    const service = new GenshinImportService(
      new GenshinImportRepository(delayed as unknown as PrismaClient),
    );
    const request = {
      requestVersion: 1,
      sections: ['materials'],
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'new stock source',
        materials: { Mora: 12500 },
      },
    };
    const preview = await service.preview(owner, request);
    const saving = service.importAccount(owner, {
      ...request,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
    try {
      await paused;
      queries.length = 0;
      expect(await read()).toEqual(before);
      // Subject and revocable-session checks are read-only. Domain reads use one goal
      // SELECT and one stock+receipt statement; no second inventory read.
      expect(queries).toHaveLength(4);
      expect(queries.filter((query) => query.includes('FROM "public"."sessions"'))).toHaveLength(1);
      expect(
        queries.filter((query) =>
          /^SELECT "public"\."users"\."id" FROM "public"\."users"/.test(query),
        ),
      ).toHaveLength(1);
      expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
      expect(queries.filter((query) => query.includes('jsonb_object_agg'))).toHaveLength(1);
    } finally {
      release();
      await saving;
    }
    expect(await read()).toMatchObject({
      inventory: { Mora: 12500 },
      delta: { Mora: 0 },
      stockBasis: { source: 'new stock source' },
    });
  });
});
