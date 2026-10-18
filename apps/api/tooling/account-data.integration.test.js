import { performance } from 'node:perf_hooks';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';
import { quote, sha256 } from './recovery/policy.mjs';
import { applicationTables, ids, seed } from './recovery/seed.mjs';

const databaseUrl = disposableTestDatabase();
let db, client, createApp, Repository, Service, domains, repository, service, api;
const extras = [];
let seeded = false;
const password = 'C5d-synthetic-only!';
const secret = 'c5d-db-synthetic-secret-at-least-32-characters';
const body = { requestVersion: 1, password };
const deletion = { ...body, confirmation: 'DELETE MY CELESTIA ACCOUNT' };
vi.mock('../src/core/db/prisma.js', () => ({
  get prisma() {
    return db;
  },
}));
vi.mock('../src/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'c5d-db-synthetic-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('../src/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
const token = (owner) => jwt.sign({ sid: owner }, secret, { subject: owner });
const request = (
  owner = ids.a,
  deleting = false,
  value = deleting ? deletion : body,
  bearer = token(owner),
) =>
  api[deleting ? 'delete' : 'post'](`/api/v1/users/me/${deleting ? 'account' : 'export'}`)
    .auth(bearer, { type: 'bearer' })
    .send(value);
const canonical = (value) =>
  JSON.stringify(value, (_key, item) =>
    item && typeof item === 'object' && !Array.isArray(item)
      ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)))
      : item,
  );
const sorted = (rows) => rows.map(canonical).sort();
async function capture() {
  const tables = {};
  const metadata = (
    await client.query(
      "SELECT table_name,column_name,udt_name,is_nullable FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name,ordinal_position",
    )
  ).rows;
  for (const name of [...applicationTables, '_prisma_migrations']) {
    const columns = metadata
      .filter((entry) => entry.table_name === name)
      .map((entry) => entry.column_name);
    tables[name] = (
      await client.query(
        `SELECT ${columns.map((column) => `${quote(column)}::text AS ${quote(column)}`).join(',')} FROM ${quote(name)}`,
      )
    ).rows;
  }
  const constraints = (
    await client.query(
      "SELECT c.relname,con.conname,pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public' ORDER BY c.relname,con.conname",
    )
  ).rows;
  return { tables, metadata, constraints };
}
function owned(state, owner, includePassword = true) {
  const securityTables = new Set([
    'sessions',
    'rotated_refresh_tokens',
    'oauth_accounts',
    'password_reset_tokens',
    'email_verification_tokens',
  ]);
  const sessionIds = new Set(
    state.tables.sessions.filter((row) => row.userId === owner).map((row) => row.id),
  );
  const ga = new Set(
    state.tables.genshin_accounts.filter((r) => r.userId === owner).map((r) => r.id),
  );
  const na = new Set(state.tables.NikkeAccount.filter((r) => r.userId === owner).map((r) => r.id));
  const nc = new Set(
    state.tables.NikkeCharacter.filter((r) => na.has(r.accountId)).map((r) => r.id),
  );
  return Object.fromEntries(
    applicationTables
      .filter((name) => includePassword || !securityTables.has(name))
      .map((name) => [
        name,
        state.tables[name]
          .filter((row) => {
            if (name === 'users') return row.id === owner;
            if (name === 'rotated_refresh_tokens') return sessionIds.has(row.sessionId);
            if ('userId' in row) return row.userId === owner;
            if (name === 'NikkeEquipment') return nc.has(row.characterId);
            if (name === 'NikkeCharacter') return na.has(row.accountId);
            return ga.has(row.accountId);
          })
          .map((row) => {
            if (name !== 'users' || includePassword) return row;
            return Object.fromEntries(Object.entries(row).filter(([key]) => key !== 'password'));
          }),
      ]),
  );
}
function equalRows(a, b) {
  return (
    canonical(Object.fromEntries(Object.entries(a).map(([name, rows]) => [name, sorted(rows)]))) ===
    canonical(Object.fromEntries(Object.entries(b).map(([name, rows]) => [name, sorted(rows)])))
  );
}
function unchanged(a, b) {
  expect(equalRows(a.tables, b.tables)).toBe(true);
  expect(canonical(a.metadata) === canonical(b.metadata)).toBe(true);
  expect(canonical(a.constraints) === canonical(b.constraints)).toBe(true);
}
function preservedOthers(before, after, removed) {
  const removedRows = owned(before, removed);
  const expected = Object.fromEntries(
    Object.entries(before.tables).map(([table, rows]) => {
      const removedSet = new Set((removedRows[table] ?? []).map(canonical));
      return [table, rows.filter((row) => !removedSet.has(canonical(row)))];
    }),
  );
  // Compare the ENTIRE remaining database, including formerly owned child IDs.
  // Inferring ownership from already-deleted parents alone could hide an orphan.
  expect(equalRows(expected, after.tables)).toBe(true);
  for (const owner of [ids.a, ids.b, ids.empty].filter((id) => id !== removed))
    expect(equalRows(owned(before, owner), owned(after, owner))).toBe(true);
  expect(
    equalRows(
      { migrations: before.tables._prisma_migrations },
      { migrations: after.tables._prisma_migrations },
    ),
  ).toBe(true);
  expect(canonical(before.metadata) === canonical(after.metadata)).toBe(true);
  expect(canonical(before.constraints) === canonical(after.constraints)).toBe(true);
}
async function cleanup() {
  if (seeded)
    await db.user.deleteMany({ where: { id: { in: [ids.a, ids.b, ids.empty, ...extras] } } });
  seeded = false;
  extras.length = 0;
}
function deferred() {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
}
const smallImport = {
  requestVersion: 1,
  payload: { format: 'GOOD', version: 2, materials: { Mora: 777 } },
  sections: ['materials'],
};

describe.skipIf(!databaseUrl)('C5d actual disposable PostgreSQL', () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    await client.query("SET timezone='UTC'; SET datestyle='ISO,YMD'");
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
    ({ createApp } = await import('../src/app.ts'));
    ({ AccountDataRepository: Repository } =
      await import('../src/platform/account-data/account-data.repository.ts'));
    ({ AccountDataService: Service } =
      await import('../src/platform/account-data/account-data.service.ts'));
    const { genshinAccountData } =
      await import('../src/games/genshin/account-data/genshin-account-data.ts');
    const { nikkeAccountData } =
      await import('../src/games/nikke/account-data/nikke-account-data.ts');
    domains = [genshinAccountData, nikkeAccountData];
    repository = new Repository(domains, db);
    service = new Service(repository);
    expect(await db.user.count({ where: { id: { in: [ids.a, ids.b, ids.empty] } } })).toBe(0);
  });
  beforeEach(async () => {
    await cleanup();
    await seed(client, password);
    seeded = true;
    api = supertest(createApp());
  });
  afterAll(async () => {
    await cleanup();
    await db?.$disconnect();
    await client?.end();
  });

  it('exports all stored fields for both owners, exact legacy values and absence, with no mutation or secrets', async () => {
    await client.query(
      'UPDATE weekly_boss_state SET "defeatedBossKeys"=$1::jsonb WHERE "userId"=$2',
      ['{"legacy":[null,0,9007199254740993,{"opaque":"雪"}]}', ids.a],
    );
    const before = await capture();
    for (const owner of [ids.a, ids.b, ids.empty]) {
      const result = await request(owner);
      expect(result.status).toBe(200);
      expect(result.body.data.exportVersion).toBe(1);
      expect(equalRows(result.body.data.tables, owned(before, owner, false))).toBe(true);
      expect(
        Object.values(result.body.data.tables).some((rows) =>
          rows.some((row) =>
            Object.keys(row).some((key) => /password|token|secret|hash/i.test(key)),
          ),
        ),
      ).toBe(false);
    }
    unchanged(before, await capture());
  });
  it('preserves all rows after wrong credentials, missing confirmation, spoofing and throttling', async () => {
    const before = await capture();
    expect((await request(ids.a, true, { ...deletion, password: 'wrong' })).status).toBe(401);
    expect((await request(ids.a, true, body)).status).toBe(400);
    expect((await request(ids.a, false, { ...body, userId: ids.b })).status).toBe(400);
    expect((await request(ids.a, true)).status).toBe(429);
    unchanged(before, await capture());
  });
  it.each([ids.a, ids.b, ids.empty])(
    'atomically removes every owned row, including no-import owner (%#)',
    async (owner) => {
      const before = await capture();
      expect((await request(owner, true)).status).toBe(200);
      const after = await capture();
      expect(Object.values(owned(after, owner)).every((rows) => rows.length === 0)).toBe(true);
      preservedOthers(before, after, owner);
    },
  );
  it('rolls back actual partial goal/predecessor deletion on injected mid-operation failure', async () => {
    const before = await capture();
    const failure = {
      ...domains[1],
      async prepareDeletion() {
        throw new Error('injected after goal deletion');
      },
    };
    const failing = new Service(new Repository([domains[0], failure], db));
    await expect(failing.delete(ids.a, password)).rejects.toMatchObject({ statusCode: 503 });
    unchanged(before, await capture());
  });
  it.each(['predecessor', 'weapon', 'artifact'])(
    'rejects cross-owner %s relationships without changing either owner',
    async (kind) => {
      if (kind === 'predecessor')
        await client.query('UPDATE upgrade_goals SET "predecessorId"=$1 WHERE id=$2', [
          ids.archived,
          ids.foreignGoal,
        ]);
      if (kind === 'weapon') {
        await client.query('UPDATE genshin_characters SET "equippedWeaponId"=NULL WHERE id=$1', [
          ids.charA,
        ]);
        await client.query('UPDATE genshin_characters SET "equippedWeaponId"=$1 WHERE id=$2', [
          ids.weaponA,
          ids.charB,
        ]);
      }
      if (kind === 'artifact')
        await client.query(
          'UPDATE genshin_artifacts SET "slotKey"=$1,"equippedCharacterId"=$2 WHERE "accountId"=$3',
          ['legacy-cross-slot', ids.charA, ids.accountB],
        );
      const before = await capture();
      for (const owner of [ids.a, ids.b]) expect((await request(owner, true)).status).toBe(409);
      unchanged(before, await capture());
    },
  );
  it('rechecks credentials under the owner lock and preserves changed credentials', async () => {
    const credential = await repository.credential(ids.a);
    await client.query('UPDATE users SET password=$1 WHERE id=$2', [
      'synthetic-changed-credential',
      ids.a,
    ]);
    const before = await capture();
    await expect(repository.delete(ids.a, credential)).rejects.toMatchObject({ statusCode: 401 });
    await expect(repository.export(ids.a, credential)).rejects.toMatchObject({ statusCode: 401 });
    unchanged(before, await capture());
  });
  it('duplicate deletes commit once and reject the second without survivors', async () => {
    const before = await capture();
    const outcomes = await Promise.allSettled([
      service.delete(ids.a, password),
      service.delete(ids.a, password),
    ]);
    expect(outcomes.filter((result) => result.status === 'fulfilled').length).toBe(1);
    const after = await capture();
    expect(Object.values(owned(after, ids.a)).every((rows) => rows.length === 0)).toBe(true);
    preservedOthers(before, after, ids.a);
  });
  it('denies old tokens throughout protected domains and same-email registration gets a new empty identity', async () => {
    await service.delete(ids.a, password);
    const paths = [
      '/auth/me',
      `/users/${ids.a}`,
      '/companion/plan',
      '/companion/routine?contractVersion=2',
      '/companion/goals',
      '/companion/events',
      '/games/genshin/characters',
      '/games/genshin/import/status',
      '/games/genshin/endgame/abyss',
      '/games/genshin/endgame/theater',
      '/games/genshin/intelligence/characters',
      '/games/genshin/simulators/banners',
      '/games/nikke/accounts/me',
      '/games/nikke/characters',
    ];
    for (const path of paths)
      expect((await api.get('/api/v1' + path).auth(token(ids.a), { type: 'bearer' })).status).toBe(
        401,
      );
    const registered = await api
      .post('/api/v1/auth/register')
      .send({ email: 'c5b-a@test.invalid', username: 'c5b-a', password });
    expect(registered.status).toBe(201);
    const fresh = registered.body.data.user.id;
    extras.push(fresh);
    expect(fresh !== ids.a).toBe(true);
    expect((await request(ids.a)).status).toBe(401);
    const data = await request(fresh, false, body, registered.body.data.token);
    expect(data.status).toBe(200);
    expect(
      Object.entries(data.body.data.tables)
        .filter(([table]) => table !== 'users')
        .every(([, rows]) => rows.length === 0),
    ).toBe(true);
  });
  it('supports a substantial 9500-item C5c import and complete export', async () => {
    const { GenshinImportService } =
      await import('../src/games/genshin/importer/importer.service.ts');
    const importer = new GenshinImportService();
    const input = {
      requestVersion: 1,
      sections: ['characters', 'weapons', 'artifacts', 'materials'],
      payload: {
        format: 'GOOD',
        version: 2,
        characters: Array.from({ length: 250 }, (_, i) => ({
          key: `Opaque${i}`,
          level: 1,
          ascension: 0,
          constellation: 0,
          talent: { auto: 1, skill: 1, burst: 1 },
        })),
        weapons: Array.from({ length: 2500 }, () => ({
          key: 'OpaqueWeapon',
          level: 1,
          ascension: 0,
          refinement: 1,
          location: '',
          lock: false,
        })),
        artifacts: Array.from({ length: 4750 }, () => ({
          setKey: 'OpaqueSet',
          slotKey: 'flower',
          level: 0,
          rarity: 5,
          mainStatKey: 'hp',
          substats: [],
          location: '',
          lock: false,
        })),
        materials: Object.fromEntries(
          Array.from({ length: 2000 }, (_, i) => [`OpaqueMaterial${i}`, 1]),
        ),
      },
    };
    const preview = await importer.preview(ids.a, input);
    await importer.importAccount(ids.a, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
    const before = await capture();
    const started = performance.now();
    const result = await request();
    expect(result.status).toBe(200);
    expect(equalRows(result.body.data.tables, owned(before, ids.a, false))).toBe(true);
    console.log(
      JSON.stringify({
        c5dMeasurement: 'substantial-export',
        inputItems: 9500,
        outputBytes: Buffer.byteLength(result.text),
        rows: Object.values(result.body.data.tables).reduce((n, rows) => n + rows.length, 0),
        elapsedMs: Math.round(performance.now() - started),
        sha256: sha256(result.text),
      }),
    );
    unchanged(before, await capture());
  }, 30_000);
  it('rejects cap-plus-one goal history without partial output or mutation', async () => {
    await client.query(
      'INSERT INTO upgrade_goals (id,"userId","updatedAt","goalType","targetKey","fromPhase","toPhase") SELECT gen_random_uuid()::text,$1,now(),\'CHARACTER_ASCENSION\',\'Legacy\',0,1 FROM generate_series(1,10001)',
      [ids.a],
    );
    const before = await capture();
    expect((await request()).status).toBe(422);
    expect((await request(ids.a, true)).status).toBe(422);
    unchanged(before, await capture());
  });
  it('rejects compressed legacy JSON before text transfer without changing rows', async () => {
    await client.query(
      'UPDATE weekly_boss_state SET "defeatedBossKeys"=to_jsonb(repeat(\'x\',500000)) WHERE "userId"=$1',
      [ids.a],
    );
    const before = await capture();
    const result = await request();
    expect(result.status).toBe(422);
    expect(result.body.data).toBeUndefined();
    unchanged(before, await capture());
  });
  it('counts actual UTF-8 JSON escape expansion and rejects output overflow without partial success', async () => {
    await client.query(
      'INSERT INTO upgrade_goals (id,"userId","updatedAt","goalType","targetKey","fromPhase","toPhase") SELECT gen_random_uuid()::text,$1,now(),\'CHARACTER_ASCENSION\',repeat(chr(1),700),0,1 FROM generate_series(1,9000)',
      [ids.a],
    );
    const before = await capture();
    const result = await request();
    expect(result.status).toBe(422);
    expect(result.body.data).toBeUndefined();
    unchanged(before, await capture());
  }, 20_000);
  it('keeps one read-only snapshot while an actual import replaces equipment and receipts', async () => {
    const { GenshinImportService } =
      await import('../src/games/genshin/importer/importer.service.ts');
    const importer = new GenshinImportService();
    const preview = await importer.preview(ids.a, smallImport);
    const before = await capture(),
      started = deferred(),
      proceed = deferred();
    let held = false;
    const wrapped = {
      $transaction: (operation, options) =>
        db.$transaction(
          (tx) =>
            operation(
              new Proxy(tx, {
                get(target, property) {
                  if (property === '$queryRaw')
                    return async (...args) => {
                      const result = await target.$queryRaw(...args);
                      if (!held) {
                        held = true;
                        started.resolve();
                        await proceed.promise;
                      }
                      return result;
                    };
                  const value = target[property];
                  return typeof value === 'function' ? value.bind(target) : value;
                },
              }),
            ),
          options,
        ),
    };
    const credential = await repository.credential(ids.a);
    const exporting = new Repository(domains, wrapped).export(ids.a, credential);
    await started.promise;
    try {
      await importer.importAccount(ids.a, {
        ...smallImport,
        previewToken: preview.previewToken,
        confirmClear: preview.clearSections,
      });
    } finally {
      proceed.resolve();
    }
    expect(equalRows(JSON.parse(await exporting).data.tables, owned(before, ids.a, false))).toBe(
      true,
    );
    expect(equalRows(owned(before, ids.a), owned(await capture(), ids.a))).toBe(false);
  });
  it('coordinates deletion with an actual import and another owner-locked write', async () => {
    const { GenshinImportService } =
      await import('../src/games/genshin/importer/importer.service.ts');
    const { GoalRepository } = await import('../src/platform/companion/goal.repository.ts');
    const importer = new GenshinImportService();
    const preview = await importer.preview(ids.a, smallImport);
    const before = await capture();
    const outcomes = await Promise.allSettled([
      service.delete(ids.a, password),
      importer.importAccount(ids.a, {
        ...smallImport,
        previewToken: preview.previewToken,
        confirmClear: preview.clearSections,
      }),
      new GoalRepository(db).write(ids.a, (tx) =>
        tx.upgradeGoal.updateMany({ where: { userId: ids.a }, data: { priority: 2 } }),
      ),
    ]);
    expect(outcomes[0].status).toBe('fulfilled');
    const after = await capture();
    expect(Object.values(owned(after, ids.a)).every((rows) => rows.length === 0)).toBe(true);
    preservedOthers(before, after, ids.a);
  });
  it('preauthenticated retained NIKKE/endgame/event writes cannot resurrect deleted parents', async () => {
    const { nikkeAccountService } = await import('../src/games/nikke/accounts/account.service.ts');
    const { nikkeCharacterService } =
      await import('../src/games/nikke/characters/character.service.ts');
    const { upsertAbyssRun } = await import('../src/games/genshin/endgame/endgame.repository.ts');
    const before = await capture();
    await service.delete(ids.b, password);
    const outcomes = await Promise.allSettled([
      nikkeAccountService.createAccount(ids.b, 'Synthetic', 1),
      nikkeCharacterService.addCharacter(ids.b, 'Rapi'),
      upsertAbyssRun({
        accountId: ids.accountB,
        cycleId: 'synthetic',
        floor: 9,
        chamber: 1,
        half: 1,
        stars: 0,
        team: [],
      }),
      db.eventProgress.create({ data: { userId: ids.b, eventKey: 'synthetic', tierId: 'test' } }),
    ]);
    expect(outcomes.every((result) => result.status === 'rejected')).toBe(true);
    const after = await capture();
    expect(Object.values(owned(after, ids.b)).every((rows) => rows.length === 0)).toBe(true);
    preservedOthers(before, after, ids.b);
  });
  it('times out a conflicting owner lock without deleting or hanging', async () => {
    const before = await capture();
    await client.query('BEGIN');
    await client.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [ids.a]);
    try {
      expect((await request(ids.a, true)).status).toBe(503);
    } finally {
      await client.query('ROLLBACK');
    }
    unchanged(before, await capture());
  });
});
