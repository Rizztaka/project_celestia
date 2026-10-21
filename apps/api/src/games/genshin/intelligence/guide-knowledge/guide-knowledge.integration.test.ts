import { randomUUID } from 'node:crypto';

import { guideAdviceSchema } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';

import { GenshinImportRepository } from '../../importer/importer.repository.js';
import { GenshinImportService } from '../../importer/importer.service.js';

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
const secret = 'local-k1-test-secret-at-least-32-characters';
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-k1-test-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { app } from '@/app.js';

const url = disposableTestDatabase();
describe.skipIf(!url)('K1 actual PostgreSQL guide advice', () => {
  let db: PrismaClient, importer: GenshinImportService, owner: string;
  const owners: string[] = [],
    queries: string[] = [];
  const api = supertest(app);
  const endpoint = (key = 'Keqing', query = 'contractVersion=1') =>
    `/api/v1/games/genshin/characters/${encodeURIComponent(key)}/guide-advice?${query}`;
  const auth = (id = owner) => jwt.sign({ sid: id }, secret, { subject: id });
  const get = (key = 'Keqing', query = 'contractVersion=1', id = owner) =>
    api.get(endpoint(key, query)).auth(auth(id), { type: 'bearer' });
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `k1-${id}`, email: `${id}@test.invalid`, password: 'test-only' },
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
  const commit = async (id = owner, key = 'Keqing', refinement = 1, includeWeapon = true) => {
    const input = {
      requestVersion: 1,
      sections: includeWeapon ? ['characters', 'weapons'] : ['characters'],
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'K1 synthetic fixture',
        characters: [
          {
            key,
            level: 80,
            ascension: 6,
            constellation: 0,
            talent: { auto: 1, skill: 1, burst: 1 },
          },
        ],
        ...(includeWeapon
          ? {
              weapons: [
                {
                  key: 'HarbingerOfDawn',
                  level: 80,
                  ascension: 6,
                  refinement,
                  location: key,
                  lock: false,
                },
              ],
            }
          : {}),
      },
    };
    const preview = await importer.preview(id, input);
    await importer.importAccount(id, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url! }),
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
  it('requires auth and gives identical non-enumerating 404s without creating an account', async () => {
    expect((await api.get(endpoint())).status).toBe(401);
    const missing = await get();
    const other = await user();
    await commit(other);
    const foreign = await get();
    expect(missing.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
  });
  it.each([
    '',
    'contractVersion=2',
    'contractVersion=1&hp=no',
    'contractVersion=1&hp=above_90&hp=unknown',
    'contractVersion=1&contractVersion=1',
    'contractVersion=1&userId=other',
    'contractVersion=1&refinement=5',
    'contractVersion=1&example=harbinger&refinement=6',
    'contractVersion=1&example=harbinger&refinement=1&refinement=5',
    'contractVersion=1&hp[x]=above_90',
  ])('rejects malformed, duplicate and unknown query %s', async (query) => {
    expect((await get('Keqing', query)).status).toBe(400);
  });
  it('uses the real recorded weapon, source evidence and stored refinement through the API', async () => {
    await commit(owner, 'Keqing', 5);
    const response = await get('Keqing', 'contractVersion=1&hp=above_90');
    expect(response.status).toBe(200);
    const data = guideAdviceSchema.parse(response.body.data);
    expect(data).toMatchObject({
      basis: 'recorded',
      conclusion: 'active',
      refinement: 5,
      modeledCritRatePp: 28,
    });
    expect(data.observation.weaponsReceipt).toMatchObject({
      status: 'imported',
      source: 'K1 synthetic fixture',
    });
    expect(data.evidence).toHaveLength(2);
    expect(data).not.toHaveProperty('score');
    // A real unrelated routine write must not change advice or its fingerprint.
    await db.genshinRoutineState.create({ data: { userId: owner } });
    await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { teapotChecked: true, dailyPeriodStart: new Date('2026-10-19T00:00:00Z') },
    });
    expect((await get('Keqing', 'contractVersion=1&hp=above_90')).body.data).toEqual(data);
    expect((await get()).body.data.modeledCritRatePp).toBeNull();
  });
  it('reads SELECT-only and never writes hypothetical equipment or changes recorded state', async () => {
    await commit(owner, 'Keqing', 1, false);
    queries.length = 0;
    const response = await get(
      'Keqing',
      'contractVersion=1&example=harbinger&refinement=5&hp=above_90',
    );
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      basis: 'hypothetical',
      modeledCritRatePp: 28,
      observation: { weaponState: 'unknown', weaponKey: null },
    });
    expect(queries.some((query) => /\b(INSERT|UPDATE|DELETE)\b/i.test(query))).toBe(false);
    const equipment = await api
      .get('/api/v1/games/genshin/characters/Keqing/equipment')
      .auth(auth(), { type: 'bearer' });
    expect(equipment.body.data.weapon).toMatchObject({ state: 'unknown', item: null });
    expect((await get()).body.data.basis).toBe('no_weapon_scenario');
  });
  it('keeps owner/refinement isolation and reflects successful re-imports', async () => {
    await commit(owner, 'Keqing', 1);
    const other = await user();
    await commit(other, 'Keqing', 5);
    const query = 'contractVersion=1&hp=above_90';
    const a = (await get('Keqing', query)).body.data,
      b = (await get('Keqing', query, other)).body.data;
    expect(a.modeledCritRatePp).toBe(14);
    expect(b.modeledCritRatePp).toBe(28);
    await commit(owner, 'Keqing', 5);
    const changed = (await get('Keqing', query)).body.data;
    expect(changed.modeledCritRatePp).toBe(28);
    expect(changed.fingerprint).not.toBe(a.fingerprint);
  });
  it('preserves equipment assignment/provenance distinctions and unknown legacy refinement', async () => {
    await commit();
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    await db.genshinWeapon.updateMany({
      where: { accountId: account.id },
      data: { refinement: 0 },
    });
    const unknown = (await get('Keqing', 'contractVersion=1&hp=above_90')).body.data;
    expect(unknown).toMatchObject({
      refinement: null,
      modeledCritRatePp: null,
      conclusion: 'conditional',
    });
    await db.genshinCharacter.updateMany({
      where: { accountId: account.id },
      data: { equippedWeaponId: null },
    });
    expect((await get()).body.data.observation.weaponState).toBe('unrecorded');
    await db.genshinImportSectionState.deleteMany({
      where: { accountId: account.id, section: 'weapons' },
    });
    expect((await get()).body.data.observation.weaponState).toBe('unknown');
  });
  it('preserves unsupported owned detail browsing and key validation', async () => {
    await commit(owner, 'HuTao');
    expect((await get('HuTao')).body.data).toMatchObject({
      coverage: 'unsupported',
      conclusion: 'unsupported',
    });
    expect(
      (
        await api
          .get('/api/v1/games/genshin/characters/HuTao/equipment')
          .auth(auth(), { type: 'bearer' })
      ).status,
    ).toBe(200);
    for (const key of ['bad\nkey', 'x'.repeat(201)]) expect((await get(key)).status).toBe(400);
  });
});
