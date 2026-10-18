import { randomUUID } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Client } from 'pg';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';
import { GenshinImportRepository } from '../../games/genshin/importer/importer.repository.js';
import { GenshinImportService } from '../../games/genshin/importer/importer.service.js';
import { RoutineRepository } from './routine.repository.js';
import { RoutineService } from './routine.service.js';

const shared = vi.hoisted(() => ({ db: null as PrismaClient | null }));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, key) {
        if (!shared.db) throw new Error('Disposable database is not initialized');
        const value = Reflect.get(shared.db, key);
        return typeof value === 'function' ? value.bind(shared.db) : value;
      },
    },
  ),
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-routine-integration-secret-at-least-32-characters',
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
    throw new Error('Routine integration requires a disposable loopback celestia_test_* database.');
  }
}

describe.skipIf(!databaseUrl)('Routine transactions on disposable PostgreSQL', () => {
  let db: PrismaClient;
  let repository: RoutineRepository;
  let service: RoutineService;
  let now: Date;
  let owner: string;
  const owners: string[] = [];
  const queries: string[] = [];
  // Exercise production default availability; only the acceptance time is injected.
  const provider = new GenshinCompanionProvider();
  const api = supertest(app);
  const auth = () =>
    jwt.sign({ sid: owner }, 'local-routine-integration-secret-at-least-32-characters', {
      subject: owner,
    });
  const manual = (revision = 0) => ({
    contractVersion: 2,
    expectedRevision: revision,
    serverId: null,
    dailyPeriodId: null,
  });
  const selected = (revision = 1) => ({
    ...manual(revision),
    serverId: 'asia',
    dailyPeriodId: provider.getPeriodBoundaries('asia', now)!.dailyPeriodId,
  });
  const row = () => db.genshinRoutineState.findUnique({ where: { userId: owner } });

  it.each(['asia', 'america', 'europe', 'tw_hk_mo'] as const)(
    'persists %s tasks and clears period records on a server change while retaining resin',
    async (serverId) => {
      const selectedServer = await service.patchSettings(owner, {
        contractVersion: 2,
        expectedRevision: 0,
        serverId,
      });
      const period = selectedServer.period!;
      const context = { contractVersion: 2, serverId, dailyPeriodId: period.dailyPeriodId };
      await service.patchChecklist(owner, {
        ...context,
        expectedRevision: 1,
        action: 'setDaily',
        commissionsDone: true,
      });
      await service.patchWeeklyClaims(owner, {
        ...context,
        expectedRevision: 2,
        weeklyPeriodId: period.weeklyPeriodId,
        rewardClaims: 2,
      });
      await service.patchResin(owner, { ...context, expectedRevision: 3, amount: 80 });
      const otherServer = serverId === 'asia' ? 'tw_hk_mo' : 'asia';
      const switched = await service.patchSettings(owner, {
        contractVersion: 2,
        expectedRevision: 4,
        serverId: otherServer,
      });
      expect(switched).toMatchObject({
        serverId: otherServer,
        resin: { known: true, checkpointAmount: 80 },
        weeklyClaims: { rewardClaims: null },
      });
      expect(switched.tasks.find((task) => task.id === 'commissions')?.done).toBe(false);
      expect(await row()).toMatchObject({
        dailyPeriodStart: null,
        weeklyPeriodStart: null,
        resinAmount: 80,
      });
      await expect(
        service.patchChecklist(owner, {
          ...context,
          expectedRevision: 5,
          action: 'setDaily',
          commissionsDone: true,
        }),
      ).rejects.toMatchObject({ statusCode: 409, errorCode: 'COMPANION_SERVER_MISMATCH' });
      expect((await row())?.revision).toBe(5);
    },
  );

  beforeAll(() => {
    const instrumented = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    instrumented.$on('query', (event) => queries.push(event.query));
    db = instrumented;
    shared.db = db;
    repository = new RoutineRepository(db);
    service = new RoutineService(repository, provider, () => now, db);
  });
  beforeEach(async () => {
    now = new Date('2026-09-27T20:00:00.000Z');
    owner = randomUUID();
    owners.push(owner);
    await db.user.create({
      data: {
        id: owner,
        username: `routine-${owner}`,
        email: `${owner}@test.invalid`,
        password: 'test-only',
      },
    });
    await db.session.create({
      data: {
        id: owner,
        userId: owner,
        tokenHash: owner.replaceAll('-', '').repeat(2),
        expiresAt: new Date('2099-01-01'),
      },
    });
    queries.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });

  async function select() {
    return service.patchSettings(owner, {
      contractVersion: 2,
      expectedRevision: 0,
      serverId: 'asia',
    });
  }
  async function seedExpired() {
    return db.genshinRoutineState.create({
      data: {
        userId: owner,
        serverId: 'asia',
        revision: 4,
        dailyPeriodStart: new Date('2026-09-26T20:00:00Z'),
        commissionsDone: true,
        teapotChecked: true,
        weeklyPeriodStart: new Date('2026-09-20T20:00:00Z'),
        weeklyRewardClaims: 3,
        transformerLastUsedAt: new Date('2026-09-25T10:00:00Z'),
      },
    });
  }
  async function legacy() {
    const daily = await db.dailyCompanion.create({
      data: {
        userId: owner,
        resinAmount: 55,
        commissionsDone: true,
        teapotClaimed: true,
        transformerClaimed: true,
      },
    });
    const weekly = await db.weeklyBossState.create({
      data: { userId: owner, defeatedBossKeys: ['Dvalin'] },
    });
    return { daily, weekly };
  }

  it('GET defaults and expired projections issue SELECT only and leave all rows unchanged', async () => {
    await legacy();
    const initial = await service.getSnapshot(owner);
    expect(initial).toMatchObject({
      revision: 0,
      resin: { known: false },
      weeklyClaims: { rewardClaims: null },
    });
    expect(await row()).toBeNull();
    const before = await seedExpired();
    queries.length = 0;
    for (let i = 0; i < 3; i++) {
      const snapshot = await service.getSnapshot(owner);
      expect(snapshot.tasks.find((t) => t.id === 'commissions')?.done).toBe(false);
      expect(snapshot.weeklyClaims.rewardClaims).toBeNull();
      expect(snapshot.legacy?.legacyDefeatedBossKeys).toEqual(['Dvalin']);
    }
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await row()).toEqual(before);
  });

  it('serializes concurrent first writes: one save, one conflict, one complete row', async () => {
    const results = await Promise.allSettled([
      service.patchResin(owner, { ...manual(), amount: 0 }),
      service.patchChecklist(owner, { ...manual(), action: 'recordTransformerUse' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toMatchObject([
      { reason: { statusCode: 409, errorCode: 'COMPANION_STALE_REVISION' } },
    ]);
    expect(await row()).toMatchObject({ revision: 1 });
  });

  it('serializes existing saves sharing a revision even across different fields', async () => {
    await select();
    const results = await Promise.allSettled([
      service.patchChecklist(owner, { ...selected(), action: 'setDaily', commissionsDone: true }),
      service.patchResin(owner, { ...selected(), amount: 80 }),
      service.patchWeeklyClaims(owner, {
        ...selected(),
        weeklyPeriodId: provider.getPeriodBoundaries('asia', now)!.weeklyPeriodId,
        rewardClaims: 2,
      }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(2);
    for (const result of results)
      if (result.status === 'rejected') expect(result.reason).toMatchObject({ statusCode: 409 });
    expect(await row()).toMatchObject({ revision: 2 });
  });

  it('a direct partial daily save after reset clears the stale sibling and weekly total', async () => {
    const before = await seedExpired();
    const saved = await service.patchChecklist(owner, {
      ...selected(4),
      action: 'setDaily',
      commissionsDone: true,
    });
    expect(await row()).toMatchObject({
      revision: 5,
      dailyPeriodStart: now,
      commissionsDone: true,
      teapotChecked: false,
      weeklyRewardClaims: null,
      transformerLastUsedAt: before.transformerLastUsedAt,
    });
    expect(saved.tasks.find((t) => t.id === 'teapot')?.done).toBe(false);
    await service.patchChecklist(owner, {
      ...selected(5),
      action: 'setDaily',
      teapotChecked: true,
    });
    expect(await row()).toMatchObject({ revision: 6, commissionsDone: true, teapotChecked: true });
  });

  it('zero weekly claims is known, clear is unknown, and neither changes resin', async () => {
    await select();
    await service.patchResin(owner, { ...selected(), amount: 90 });
    const checkpoint = (await row())!;
    const body = {
      ...selected(2),
      weeklyPeriodId: provider.getPeriodBoundaries('asia', now)!.weeklyPeriodId,
      rewardClaims: 0,
    };
    expect((await service.patchWeeklyClaims(owner, body)).weeklyClaims.rewardClaims).toBe(0);
    expect(
      (await service.patchWeeklyClaims(owner, { ...body, expectedRevision: 3, rewardClaims: null }))
        .weeklyClaims.rewardClaims,
    ).toBeNull();
    expect(await row()).toMatchObject({
      resinAmount: checkpoint.resinAmount,
      resinRecordedAt: checkpoint.resinRecordedAt,
    });
  });

  it('checks time after waiting for the owner lock across a reset', async () => {
    now = new Date('2026-09-27T19:59:59.999Z');
    await select();
    const before = await row();
    const stale = { ...selected(), action: 'setDaily', commissionsDone: true };
    let release!: () => void;
    let locked!: () => void;
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
    const outcome = service.patchChecklist(owner, stale).then(
      (value) => ({ value, error: null }),
      (error) => ({ value: null, error }),
    );
    try {
      // Confirm the second backend is actually waiting on a PostgreSQL lock.
      await vi.waitFor(
        async () => {
          const waiting = await db.$queryRaw<
            { count: bigint }[]
          >`SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%FROM users WHERE id =%'`;
          expect(Number(waiting[0]!.count)).toBeGreaterThan(0);
        },
        { timeout: 5000, interval: 25 },
      );
      now = new Date('2026-09-27T20:00:00.000Z');
    } finally {
      release();
      await blocker;
    }
    expect((await outcome).error).toMatchObject({
      errorCode: 'COMPANION_STALE_PERIOD',
      statusCode: 409,
    });
    expect(await row()).toEqual(before);
  });

  it('rejects stale week, stale day, and changed server without changing any field', async () => {
    await select();
    const before = await row();
    await expect(
      service.patchWeeklyClaims(owner, {
        ...selected(),
        weeklyPeriodId: 'old-week',
        rewardClaims: 1,
      }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_STALE_PERIOD' });
    await expect(
      service.patchResin(owner, { ...selected(), dailyPeriodId: 'old-day', amount: 80 }),
    ).rejects.toMatchObject({ errorCode: 'COMPANION_STALE_PERIOD' });
    await expect(service.patchResin(owner, { ...manual(1), amount: 80 })).rejects.toMatchObject({
      errorCode: 'COMPANION_SERVER_MISMATCH',
    });
    expect(await row()).toEqual(before);
  });

  it('rolls back initial creation and all updates if response construction fails', async () => {
    const broken = new RoutineRepository(db);
    vi.spyOn(broken, 'findLegacyCompanion').mockRejectedValue(
      new Error('forced post-write failure'),
    );
    const failing = new RoutineService(broken, provider, () => now, db);
    await expect(failing.patchResin(owner, { ...manual(), amount: 70 })).rejects.toThrow('forced');
    expect(await row()).toBeNull();
    const before = await seedExpired();
    await expect(
      failing.patchChecklist(owner, { ...selected(4), action: 'setDaily', teapotChecked: true }),
    ).rejects.toThrow('forced');
    expect(await row()).toEqual(before);
  });

  it('enforces database checks for revision, server, paired checkpoints and input ranges', async () => {
    const invalid = [
      { revision: -1 },
      { serverId: 'mars' },
      { resinAmount: 10 },
      { resinRecordedAt: now },
      { resinAmount: -1, resinRecordedAt: now },
      { resinAmount: 201, resinRecordedAt: now },
      { weeklyRewardClaims: -1 },
      { weeklyRewardClaims: 1001 },
    ];
    for (const data of invalid)
      await expect(
        db.genshinRoutineState.create({ data: { userId: owner, ...data } }),
      ).rejects.toThrow();
    expect(await row()).toBeNull();
  });

  it('preserves legacy data and isolates the routine from first and replacement imports', async () => {
    const old = await legacy();
    const saved = await service.patchResin(owner, { ...manual(), amount: 0 });
    expect(saved.resin).toMatchObject({ known: true, currentAmount: 0 });
    const before = await row();
    const importer = new GenshinImportService(new GenshinImportRepository(db));
    for (const quantity of [10, 20]) {
      const request = {
        requestVersion: 1 as const,
        sections: ['materials' as const],
        payload: { format: 'GOOD', version: 2, materials: { Mora: quantity } },
      };
      const preview = await importer.preview(owner, request);
      await importer.importAccount(owner, {
        ...request,
        previewToken: preview.previewToken,
        confirmClear: [],
      });
      expect(await row()).toEqual(before);
    }
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    const material = await db.genshinMaterial.findMany({ where: { accountId: account.id } });
    const provenance = await db.genshinImportSectionState.findMany({
      where: { accountId: account.id },
    });
    await service.patchChecklist(owner, { ...manual(1), action: 'recordTransformerUse' });
    expect(await db.genshinMaterial.findMany({ where: { accountId: account.id } })).toEqual(
      material,
    );
    expect(
      await db.genshinImportSectionState.findMany({ where: { accountId: account.id } }),
    ).toEqual(provenance);
    expect(await db.dailyCompanion.findUnique({ where: { userId: owner } })).toEqual(old.daily);
    expect(await db.weeklyBossState.findUnique({ where: { userId: owner } })).toEqual(old.weekly);
  });

  it('direct and indirect HTTP GETs issue SELECT only; V1 requests never write', async () => {
    await legacy();
    await db.genshinAccount.create({ data: { userId: owner } });
    await seedExpired();
    const before = await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { resinAmount: 0, resinRecordedAt: new Date() },
    });
    await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'CHARACTER_ASCENSION',
        targetKey: 'HuTao',
        fromPhase: 0,
        toPhase: 1,
      },
    });
    queries.length = 0;
    for (const [path, status] of [
      ['/companion/routine?contractVersion=2', 200],
      ['/companion/goals/today', 200],
      ['/games/genshin/intelligence/planner', 200],
      ['/companion/daily', 409],
      ['/companion/weekly-bosses', 409],
    ] as const)
      expect((await api.get(`/api/v1${path}`).auth(auth(), { type: 'bearer' })).status).toBe(
        status,
      );
    for (const path of ['/resin', '/checklist', '/weekly-bosses/Dvalin'])
      expect(
        (
          await api
            .patch(`/api/v1/companion${path}`)
            .auth(auth(), { type: 'bearer' })
            .send({ amount: 150, commissionsDone: true })
        ).status,
      ).toBe(409);
    expect(queries.length).toBeGreaterThan(0);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await row()).toEqual(before);
  });

  it('upgrades a populated C1b schema without changing legacy, inventory, provenance or goals', async () => {
    const connection = new Client({ connectionString: databaseUrl! });
    await connection.connect();
    try {
      await connection.query('BEGIN');
      // A fresh transaction-local schema on the guarded test DB. ROLLBACK
      // removes only this fixture, including its tables, enums and rows.
      const schema = `c2a_upgrade_${randomUUID().replaceAll('-', '')}`;
      await connection.query(`CREATE SCHEMA "${schema}"`);
      await connection.query(`SET LOCAL search_path TO "${schema}"`);
      const directory = new URL('../../../prisma/migrations/', import.meta.url);
      const migration = '20260927170000_add_genshin_routine_state';
      const folders = (await readdir(directory, { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .sort();
      for (const name of folders.filter((name) => name < migration)) {
        await connection.query(await readFile(new URL(`${name}/migration.sql`, directory), 'utf8'));
      }
      await connection.query(`
        INSERT INTO users (id,email,username,password,"updatedAt") VALUES ('owner','upgrade@test.invalid','upgrade','test-only','2026-09-01');
        INSERT INTO genshin_accounts (id,"userId","updatedAt") VALUES ('account','owner','2026-09-01');
        INSERT INTO daily_companion (id,"userId","resinAmount","resinUpdatedAt","commissionsDone","teapotClaimed","transformerClaimed","updatedAt") VALUES ('daily','owner',73,'2026-08-20',true,true,true,'2026-09-01');
        INSERT INTO weekly_boss_state (id,"userId","defeatedBossKeys","updatedAt") VALUES ('weekly','owner','["Dvalin","Childe"]','2026-09-01');
        INSERT INTO genshin_materials (id,"accountId","itemKey",quantity,"updatedAt") VALUES ('material','account','Mora',123,'2026-09-01');
        INSERT INTO genshin_import_sections (id,"accountId",section,"importedAt",source,"entryCount") VALUES ('provenance','account','materials','2026-09-01','Fixture',1);
        INSERT INTO upgrade_goals (id,"userId","updatedAt","goalType","targetKey","fromPhase","toPhase") VALUES ('goal','owner','2026-09-01','CHARACTER_ASCENSION','HuTao',1,2);
      `);
      const tables = [
        'users',
        'genshin_accounts',
        'daily_companion',
        'weekly_boss_state',
        'genshin_materials',
        'genshin_import_sections',
        'upgrade_goals',
      ];
      const before = [];
      for (const table of tables)
        before.push((await connection.query(`SELECT row_to_json(t) AS row FROM ${table} t`)).rows);
      await connection.query(
        await readFile(new URL(`${migration}/migration.sql`, directory), 'utf8'),
      );
      for (const [index, table] of tables.entries())
        expect(
          (await connection.query(`SELECT row_to_json(t) AS row FROM ${table} t`)).rows,
        ).toEqual(before[index]);
      expect((await connection.query('SELECT * FROM genshin_routine_state')).rows).toEqual([]);
    } finally {
      await connection.query('ROLLBACK');
      await connection.end();
    }
  });
});
