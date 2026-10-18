import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { requestSafetyPolicy } from '../src/core/config/request-safety.ts';
import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';
import { ids, seed } from './recovery/seed.mjs';
import { snapshot } from './recovery/snapshot.mjs';

// Reuse the full synthetic 25-table recovery seed, in the separately guarded suite DB.
// No source/restore database or normal environment configuration is accepted.
const databaseUrl = disposableTestDatabase();
let db, client, createApp, api, now;
let seeded = false;
const extraOwners = [];
const queries = [];
const secret = 'c5c-postgres-synthetic-secret-at-least-32-characters';
const password = 'C5c-synthetic-only!';
vi.mock('../src/core/db/prisma.js', () => ({
  get prisma() {
    return db;
  },
}));
vi.mock('../src/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'c5c-postgres-synthetic-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('../src/core/logger/logger.js', () => ({ logger: { info: vi.fn(), error: vi.fn() } }));
const token = (id = ids.a) => jwt.sign({ sid: id }, secret, { subject: id });
const root = '/api/v1/games/genshin/import';
const small = {
  requestVersion: 1,
  payload: { format: 'GOOD', version: 2, materials: { Mora: 123 } },
  sections: ['materials'],
};
function post(path, body, owner = ids.a) {
  return api.post(path).auth(token(owner), { type: 'bearer' }).send(body);
}
async function unchanged(before) {
  // Compare exact full canonical rows without printing rows/password hashes on assertion failure.
  expect((await snapshot(client)).canonical === before.canonical).toBe(true);
}
async function previewCommit(input, owner = ids.a) {
  const preview = await post(`${root}/preview`, input, owner);
  expect(preview.status).toBe(200);
  const result = await post(
    root,
    {
      ...input,
      previewToken: preview.body.data.previewToken,
      confirmClear: preview.body.data.clearSections,
    },
    owner,
  );
  expect(result.status).toBe(200);
  return result;
}

describe.skipIf(!databaseUrl)('C5c admission with actual disposable PostgreSQL', () => {
  beforeAll(async () => {
    client = new pg.Client({ connectionString: databaseUrl });
    await client.connect();
    db = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl }),
      log: [{ emit: 'event', level: 'query' }],
    });
    db.$on('query', (event) => queries.push(event.query));
    await seed(client, password);
    seeded = true;
    ({ createApp } = await import('../src/app.ts'));
  });
  beforeEach(() => {
    now = 0;
    queries.length = 0;
    api = supertest(createApp({ clock: () => now }));
  });
  afterAll(async () => {
    // Only IDs successfully created by this suite, plus its committed synthetic seed.
    if (db) {
      await db.user.deleteMany({
        where: { id: { in: [...(seeded ? [ids.a, ids.b, ids.empty] : []), ...extraOwners] } },
      });
      await db.$disconnect();
    }
    await client?.end();
    vi.restoreAllMocks();
  });
  it('preserves all twenty tables, receipts and intent after malformed/oversized/resource/foreign rejections', async () => {
    const before = await snapshot(client);
    expect(
      (await api.post(root).set('Content-Type', 'application/json').send('x'.repeat(100_000)))
        .status,
    ).toBe(401);
    expect(
      (
        await api
          .post(root)
          .auth(token(), { type: 'bearer' })
          .set('Content-Type', 'application/json')
          .send('{')
      ).status,
    ).toBe(400);
    expect(
      (
        await post(`${root}/preview`, {
          ...small,
          payload: { format: 'GOOD', version: 2, artifacts: Array(5001).fill({}) },
        })
      ).status,
    ).toBe(400);
    expect((await post(root, { ...small, padding: 'x'.repeat(4_194_304) })).status).toBe(413);
    const preview = await post(`${root}/preview`, small);
    expect(preview.status).toBe(200);
    expect(
      (
        await post(
          root,
          { ...small, previewToken: preview.body.data.previewToken, confirmClear: [] },
          ids.b,
        )
      ).status,
    ).toBe(409);
    await unchanged(before);
  });
  it('rejects a valid commit on the shared preview budget before any database access, then retries successfully', async () => {
    api = supertest(
      createApp({
        policy: { ...requestSafetyPolicy, import: { ...requestSafetyPolicy.import, burst: 1 } },
        clock: () => now,
      }),
    );
    const preview = await post(`${root}/preview`, small);
    expect(preview.status).toBe(200);
    const body = { ...small, previewToken: preview.body.data.previewToken, confirmClear: [] };
    const before = await snapshot(client);
    queries.length = 0;
    const rejection = await post(root, body);
    expect(rejection.status).toBe(429);
    expect(rejection.headers['retry-after']).toBe('10');
    expect(queries).toEqual([]);
    await unchanged(before);
    now = 10_000;
    expect((await post(root, body)).status).toBe(200);
    const after = await snapshot(client);
    const unchangedTables = [
      'upgrade_goals',
      'genshin_character_focus',
      'genshin_routine_state',
      'genshin_plan_preferences',
      'genshin_plan_dismissals',
      'genshin_weapons',
      'genshin_artifacts',
      'genshin_characters',
    ];
    for (const name of unchangedTables)
      expect(after.summary.tables.find((t) => t.name === name).sha256).toBe(
        before.summary.tables.find((t) => t.name === name).sha256,
      );
    const states = await db.genshinImportSectionState.findMany({
      where: { accountId: ids.accountA },
    });
    expect(states.find((row) => row.section === 'materials').entryCount).toBe(1);
  });
  it('does not create a first Genshin account on resource or admission rejection', async () => {
    const before = await snapshot(client);
    for (let i = 0; i < 6; i++)
      expect(
        (
          await post(
            `${root}/preview`,
            { ...small, payload: { format: 'GOOD', version: 2, characters: Array(513).fill({}) } },
            ids.empty,
          )
        ).status,
      ).toBe(400);
    expect((await post(root, small, ids.empty)).status).toBe(429);
    expect(await db.genshinAccount.findUnique({ where: { userId: ids.empty } })).toBeNull();
    await unchanged(before);
  });
  it('preserves credential semantics and rejects registration before bcrypt or account creation', async () => {
    const invalid = await api
      .post('/api/v1/auth/login')
      .send({ email: 'c5b-a@test.invalid', password: 'wrong-synthetic' });
    expect(invalid.status).toBe(401);
    expect(invalid.body.error.message).toBe('Invalid email or password.');
    expect(
      (await api.post('/api/v1/auth/login').send({ email: 'c5b-a@test.invalid', password })).status,
    ).toBe(200);
    const before = await snapshot(client);
    const hash = vi.spyOn(bcrypt, 'hash');
    for (let i = 0; i < 3; i++)
      expect((await api.post('/api/v1/auth/register').send({})).status).toBe(400);
    queries.length = 0;
    const res = await api
      .post('/api/v1/auth/register')
      .send({ email: 'c5c-rejected@test.invalid', username: 'c5c-rejected', password });
    expect(res.status).toBe(429);
    expect(hash).not.toHaveBeenCalled();
    expect(queries).toEqual([]);
    hash.mockRestore();
    await unchanged(before);
  });
  it('accepts registration and the no-import manual core journey with retained NIKKE/endgame routes', async () => {
    const suffix = randomUUID();
    const registered = await api
      .post('/api/v1/auth/register')
      .send({ email: `${suffix}@test.invalid`, username: `c5c-${suffix.slice(0, 8)}`, password });
    expect(registered.status).toBe(201);
    const owner = registered.body.data.user.id;
    const registeredToken = registered.body.data.token;
    extraOwners.push(owner);
    for (const path of [
      '/api/v1/companion/plan?contractVersion=1',
      '/api/v1/companion/routine?contractVersion=2',
      '/api/v1/games/genshin/characters',
    ])
      expect((await api.get(path).auth(registeredToken, { type: 'bearer' })).status).toBe(200);
    const settings = await api
      .patch('/api/v1/companion/routine/settings')
      .auth(registeredToken, { type: 'bearer' })
      .send({ contractVersion: 2, expectedRevision: 0, serverId: 'asia' });
    expect(settings.status).toBe(200);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
    expect(
      (await api.get(`/api/v1/users/${ids.a}`).auth(registeredToken, { type: 'bearer' })).status,
    ).toBe(404);
    expect(
      (
        await api
          .post('/api/v1/games/nikke/accounts/me')
          .auth(registeredToken, { type: 'bearer' })
          .send({ commanderName: 'C5c synthetic', commanderLevel: 1 })
      ).status,
    ).toBe(201);
    expect(
      (
        await post('/api/v1/games/genshin/endgame/abyss', {
          cycleId: 'c5c-synthetic',
          floor: 9,
          chamber: 1,
          half: 1,
          stars: 0,
          team: ['HuTao'],
        })
      ).status,
    ).toBe(201);
  });
  it('accepts a 9500-item synthetic export, preserving intent/history/focus and independent receipts', async () => {
    const before = await snapshot(client);
    const payload = {
      format: 'GOOD',
      version: 2,
      source: 'C5c synthetic support measurement',
      characters: Array.from({ length: 250 }, (_, i) => ({
        key: `SyntheticCharacter${i}`,
        level: 90,
        constellation: 1,
        ascension: 6,
        talent: { auto: 6, skill: 9, burst: 9 },
      })),
      weapons: Array.from({ length: 2500 }, () => ({
        key: 'SyntheticWeapon',
        level: 90,
        ascension: 6,
        refinement: 1,
        location: '',
        lock: false,
      })),
      artifacts: Array.from({ length: 4750 }, () => ({
        setKey: 'SyntheticSet',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'hp',
        location: '',
        substats: [{ key: 'critRate_', value: 3.9 }],
        lock: false,
      })),
      materials: Object.fromEntries(
        Array.from({ length: 2000 }, (_, i) => [`OpaqueMaterial${i}`, 1]),
      ),
    };
    const input = {
      requestVersion: 1,
      payload,
      sections: ['characters', 'weapons', 'artifacts', 'materials'],
    };
    expect(Buffer.byteLength(JSON.stringify(input))).toBe(1_056_750);
    const response = await previewCommit(input);
    expect(response.body.data).toMatchObject({
      charactersImported: 250,
      weaponsImported: 2500,
      artifactsImported: 4750,
      materialsImported: 2000,
    });
    const after = await snapshot(client);
    for (const name of [
      'upgrade_goals',
      'genshin_character_focus',
      'genshin_routine_state',
      'genshin_plan_preferences',
      'genshin_plan_dismissals',
    ])
      expect(after.summary.tables.find((t) => t.name === name).sha256).toBe(
        before.summary.tables.find((t) => t.name === name).sha256,
      );
    // Prevent repeated merges from growing stored state beyond the supported envelope.
    const tooMany = {
      ...input,
      payload: {
        format: 'GOOD',
        version: 2,
        characters: Array.from({ length: 300 }, (_, i) => ({
          ...payload.characters[0],
          key: `Another${i}`,
        })),
      },
      sections: ['characters'],
    };
    expect((await post(`${root}/preview`, tooMany)).status).toBe(400);
    await unchanged(after);
  }, 60_000);
  it('rejects oversized inherited state without returning or committing a truncated snapshot', async () => {
    const preview = await post(`${root}/preview`, small, ids.empty);
    expect(preview.status).toBe(200);
    expect(await db.genshinAccount.findUnique({ where: { userId: ids.empty } })).toBeNull();
    const account = await db.genshinAccount.create({ data: { userId: ids.empty } });
    try {
      await db.genshinMaterial.createMany({
        data: Array.from({ length: 5001 }, (_, i) => ({
          accountId: account.id,
          itemKey: `InheritedSynthetic${i}`,
          quantity: 1,
        })),
      });
      const before = await snapshot(client);
      const rejectedPreview = await post(`${root}/preview`, small, ids.empty);
      expect(rejectedPreview.status).toBe(400);
      expect(rejectedPreview.body.error.code).toBe('IMPORT_RESOURCE_LIMIT');
      const rejectedCommit = await post(
        root,
        { ...small, previewToken: preview.body.data.previewToken, confirmClear: [] },
        ids.empty,
      );
      expect(rejectedCommit.status).toBe(400);
      expect(rejectedCommit.body.error.code).toBe('IMPORT_RESOURCE_LIMIT');
      await unchanged(before);
    } finally {
      await db.genshinAccount.delete({ where: { id: account.id } });
    }
  });
});
