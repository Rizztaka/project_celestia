import { randomUUID } from 'node:crypto';

import { type ImportedAccountContext, importedAccountContextSchema } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';

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
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'synthetic-m1-integration-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { createApp } from '@/app.js';

const databaseUrl = disposableTestDatabase();
const base = '/api/v1/games/genshin/import';
const character = (key = 'HuTao', level = 80) => ({
  key,
  level,
  ascension: 5,
  constellation: 0,
  talent: { auto: 8, skill: 8, burst: 6 },
});
const weapon = {
  key: 'StaffOfHoma',
  level: 80,
  ascension: 5,
  refinement: 1,
  location: 'HuTao',
  lock: true,
};
const artifact = {
  setKey: 'GladiatorsFinale',
  slotKey: 'flower',
  level: 20,
  rarity: 5,
  mainStatKey: 'hp',
  substats: [{ key: 'critRate_', value: 3.9 }],
  location: 'HuTao',
};

describe.skipIf(!databaseUrl)('M1 actual PostgreSQL authenticated import → context', () => {
  let db: PrismaClient;
  let owner: string;
  let api = supertest(createApp());
  const owners: string[] = [];
  const queries: string[] = [];
  const token = (id = owner) =>
    jwt.sign({ sid: id }, 'synthetic-m1-integration-secret-at-least-32-characters', {
      subject: id,
      algorithm: 'HS256',
    });
  async function user() {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `m1-${id}`, email: `${id}@test.invalid`, password: 'synthetic-only' },
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
  }
  async function importData(payload: Record<string, unknown>, id = owner) {
    const input = {
      requestVersion: 1,
      sections: Object.keys(payload),
      payload: { format: 'GOOD', version: 2, source: 'M1 synthetic exporter', ...payload },
    };
    const preview = await api
      .post(`${base}/preview`)
      .auth(token(id), { type: 'bearer' })
      .send(input);
    expect(preview.status, JSON.stringify(preview.body)).toBe(200);
    const commit = await api
      .post(base)
      .auth(token(id), { type: 'bearer' })
      .send({
        ...input,
        previewToken: preview.body.data.previewToken,
        confirmClear: preview.body.data.clearSections,
      });
    expect(commit.status, JSON.stringify(commit.body)).toBe(200);
  }
  async function read(id = owner): Promise<ImportedAccountContext> {
    const response = await api.get(`${base}/context`).auth(token(id), { type: 'bearer' });
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    return importedAccountContextSchema.parse(response.body.data);
  }
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (event) => queries.push(event.query));
    db = client;
    shared.db = db;
  });
  beforeEach(async () => {
    api = supertest(createApp());
    owner = await user();
    queries.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
      shared.db = null;
    }
  });
  it('imports valid GOOD over HTTP and reads the stored instance IDs without fabricating UID, observation, or ownership', async () => {
    await importData({ characters: [character()], weapons: [weapon], artifacts: [artifact] });
    const stored = await db.genshinAccount.findUniqueOrThrow({
      where: { userId: owner },
      include: { characters: true, weapons: true, artifacts: true, importStates: true },
    });
    queries.length = 0;
    const result = await read();
    expect(result.context).toMatchObject({
      uid: null,
      accountId: stored.id,
      rosterScope: 'partial',
      absentCharacterOwnership: 'unknown',
    });
    expect(result.context.characters[0]).toMatchObject({
      ownership: 'unknown',
      observedAt: null,
      freshness: 'unknown',
      buildState: 'stored',
    });
    expect(result.evidence.weapons[0]!.id).toBe(stored.weapons[0]!.id);
    expect(result.evidence.artifacts[0]!.id).toBe(stored.artifacts[0]!.id);
    expect(result.evidence.characters[0]!.id).toBe(stored.characters[0]!.id);
    expect(result.evidence.receipts.find((r) => r.section === 'characters')!.importedAt).toBe(
      stored.importStates.find((r) => r.section === 'characters')!.importedAt.toISOString(),
    );
    expect(queries.some((query) => /\b(INSERT|UPDATE|DELETE)\b/i.test(query))).toBe(false);
    expect((await read()).context.fingerprint).toBe(result.context.fingerprint);
  });
  it('preserves old equipment as separately dated fragments after a partial import, never as a refreshed whole build', async () => {
    await importData({ characters: [character()], weapons: [weapon], artifacts: [artifact] });
    const before = await read();
    await importData({ characters: [character('Furina')] });
    const after = await read();
    expect(after.evidence.characters.find((c) => c.characterKey === 'HuTao')).toEqual(
      before.evidence.characters[0],
    );
    expect(after.evidence.weapons).toEqual(before.evidence.weapons);
    expect(after.evidence.artifacts).toEqual(before.evidence.artifacts);
    expect(
      after.context.characters.every((c) => c.observedAt === null && c.freshness === 'unknown'),
    ).toBe(true);
    expect(after.context.fingerprint).not.toBe(before.context.fingerprint);
    expect(
      after.evidence.characters.find((c) => c.characterKey === 'Furina')!.equippedWeaponId,
    ).toBeNull();
  });
  it('tracks replacement instance identities and explicit clearing without filling from old imports', async () => {
    await importData({ characters: [character()], weapons: [weapon], artifacts: [artifact] });
    const before = await read();
    await importData({ weapons: [weapon] });
    const replacement = await read();
    expect(replacement.evidence.weapons[0]!.id).not.toBe(before.evidence.weapons[0]!.id);
    expect(replacement.context.fingerprint).not.toBe(before.context.fingerprint);
    await importData({ weapons: [], artifacts: [] });
    const cleared = await read();
    expect(cleared.evidence.weapons).toEqual([]);
    expect(cleared.evidence.artifacts).toEqual([]);
    expect(cleared.evidence.characters[0]!.equippedWeaponId).toBeNull();
    expect(cleared.context.rosterScope).toBe('partial');
  });
  it('isolates real owners with the same UID and denies revoked sessions', async () => {
    await importData({ characters: [character()], weapons: [weapon] });
    const other = await user();
    await importData({ characters: [character('Furina')] }, other);
    await db.genshinAccount.updateMany({
      where: { userId: { in: [owner, other] } },
      data: { uid: '800000001' },
    });
    const a = await read();
    const b = await read(other);
    expect(b.evidence.weapons).toEqual([]);
    expect(b.context.fingerprint).not.toBe(a.context.fingerprint);
    for (const id of [a.context.accountId, 'not-an-account']) {
      expect(
        (
          await api
            .get(`${base}/context`)
            .query({ accountId: id })
            .auth(token(other), { type: 'bearer' })
        ).status,
      ).toBe(404);
    }
    await db.session.update({ where: { id: owner }, data: { revokedAt: new Date() } });
    expect((await api.get(`${base}/context`).auth(token(), { type: 'bearer' })).status).toBe(401);
  });
  it('does not turn unsupported ownership/completeness/form extensions or optimizer scenarios into claims', async () => {
    await importData({
      characters: [
        { ...character('TravelerAnemo'), hypothetical: true, owned: false, skillDepotId: 504 },
      ],
    });
    const result = await read();
    expect(result.context.characters).toEqual([]);
    expect(result.context.rosterScope).toBe('partial');
    expect(result.context.completenessEvidence).toBeNull();
    expect(result.evidence.characters[0]).toMatchObject({
      characterKey: 'TravelerAnemo',
      formKey: null,
    });
  });
  it('keeps no-import accounts absent and legacy record provenance unknown', async () => {
    expect((await read()).context).toMatchObject({
      accountId: null,
      uid: null,
      rosterScope: 'unknown',
      characters: [],
    });
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
    await db.genshinAccount.create({
      data: {
        userId: owner,
        characters: {
          create: {
            characterKey: 'HuTao',
            level: 1,
            ascension: 0,
            constellation: 0,
            talentNormal: 1,
            talentSkill: 1,
            talentBurst: 1,
          },
        },
      },
    });
    const result = await read();
    expect(result.evidence.receipts).toEqual([]);
    expect(result.context.characters[0]).toMatchObject({
      ownership: 'unknown',
      observedAt: null,
      freshness: 'unknown',
      sources: ['stored_account'],
    });
  });
});
