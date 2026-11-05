import { randomUUID } from 'node:crypto';

import {
  defaultTeamSearchPreferences,
  teamPreferencesResponseSchema,
} from '@celestia/api-contracts';
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
    JWT_SECRET: 'synthetic-team-preferences-integration-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { createApp } from '@/app.js';

const databaseUrl = disposableTestDatabase();
const url = '/api/v1/games/genshin/team-preferences';
const uid = '800000001';

describe.skipIf(!databaseUrl)('M1 actual PostgreSQL team preferences', () => {
  let db: PrismaClient;
  let owner: string;
  const users: string[] = [];
  const api = supertest(createApp());
  const token = (userId = owner) =>
    jwt.sign(
      { sid: userId },
      'synthetic-team-preferences-integration-secret-at-least-32-characters',
      {
        subject: userId,
        algorithm: 'HS256',
      },
    );

  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    shared.db = db;
  });
  beforeEach(async () => {
    owner = randomUUID();
    users.push(owner);
    await db.user.create({
      data: {
        id: owner,
        username: `prefs-${owner}`,
        email: `${owner}@test.invalid`,
        password: 'synthetic',
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
  });
  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: users } } });
    await db.$disconnect();
    shared.db = null;
  });

  it('persists owner-scoped preferences and rejects stale concurrent writes', async () => {
    const base = defaultTeamSearchPreferences(uid, { ownerId: owner, accountId: null });
    const empty = await api.get(`${url}?uid=${uid}`).auth(token(), { type: 'bearer' });
    expect(empty.status).toBe(200);
    const first = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({ scope: { uid, accountId: null }, expectedRevision: 0, preferences: base });
    expect(first.status).toBe(200);
    const parsed = teamPreferencesResponseSchema.parse(first.body.data);
    expect(parsed.revision).toBe(1);
    const stale = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({ scope: { uid, accountId: null }, expectedRevision: 0, preferences: base });
    expect(stale.status).toBe(409);
    expect(
      await db.genshinTeamPreferences.count({ where: { userId: owner, scopeKey: `uid:${uid}` } }),
    ).toBe(1);
  });

  it('persists a private UID-null account scope without widening ownership', async () => {
    const account = await db.genshinAccount.create({ data: { userId: owner, uid: null } });
    const base = defaultTeamSearchPreferences(null, { ownerId: owner, accountId: account.id });
    const empty = await api.get(`${url}?accountId=${account.id}`).auth(token(), { type: 'bearer' });
    expect(empty.status).toBe(200);
    expect(empty.body.data.preferences).toMatchObject({ uid: null, accountId: account.id });
    const saved = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({
        scope: { uid: null, accountId: account.id },
        expectedRevision: 0,
        preferences: base,
      });
    expect(saved.status).toBe(200);
    expect(
      await db.genshinTeamPreferences.count({
        where: { userId: owner, scopeKey: `account:${account.id}`, uid: null },
      }),
    ).toBe(1);
  });

  it('normalizes an account-only scope from the stored account UID', async () => {
    const account = await db.genshinAccount.create({ data: { userId: owner, uid } });
    const empty = await api.get(`${url}?accountId=${account.id}`).auth(token(), { type: 'bearer' });
    expect(empty.status, JSON.stringify(empty.body)).toBe(200);
    expect(empty.body.data.preferences).toMatchObject({ uid, accountId: account.id });

    const base = defaultTeamSearchPreferences(null, { ownerId: owner, accountId: account.id });
    const saved = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({
        scope: { uid: null, accountId: account.id },
        expectedRevision: 0,
        preferences: base,
      });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    const row = await db.genshinTeamPreferences.findUniqueOrThrow({
      where: { userId_scopeKey: { userId: owner, scopeKey: `account:${account.id}` } },
    });
    expect(row.uid).toBe(uid);
  });

  it('round-trips goodEnoughCharacters intent array and advances revision', async () => {
    const base = defaultTeamSearchPreferences(uid, { ownerId: owner, accountId: null });
    const initialWithGoodEnough = {
      ...base,
      goodEnoughCharacters: ['avatar:10000046', 'avatar:10000089'],
    };

    // 1. Initial write with revision 0 -> becomes revision 1
    const createRes = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({
        scope: { uid, accountId: null },
        expectedRevision: 0,
        preferences: initialWithGoodEnough,
      });
    expect(createRes.status, JSON.stringify(createRes.body)).toBe(200);
    const createdData = teamPreferencesResponseSchema.parse(createRes.body.data);
    expect(createdData.revision).toBe(1);
    expect(createdData.preferences.goodEnoughCharacters).toEqual([
      'avatar:10000046',
      'avatar:10000089',
    ]);

    // 2. Fetch and verify persistence
    const fetchRes = await api.get(`${url}?uid=${uid}`).auth(token(), { type: 'bearer' });
    expect(fetchRes.status).toBe(200);
    const fetchedData = teamPreferencesResponseSchema.parse(fetchRes.body.data);
    expect(fetchedData.revision).toBe(1);
    expect(fetchedData.preferences.goodEnoughCharacters).toEqual([
      'avatar:10000046',
      'avatar:10000089',
    ]);

    // 3. Update goodEnoughCharacters (add avatar:10000103) with expectedRevision 1 -> becomes revision 2
    const updatedPreferences = {
      ...fetchedData.preferences,
      goodEnoughCharacters: ['avatar:10000046', 'avatar:10000089', 'avatar:10000103'],
    };
    const updateRes = await api
      .patch(url)
      .auth(token(), { type: 'bearer' })
      .send({
        scope: { uid, accountId: null },
        expectedRevision: 1,
        preferences: updatedPreferences,
      });
    expect(updateRes.status, JSON.stringify(updateRes.body)).toBe(200);
    const updatedData = teamPreferencesResponseSchema.parse(updateRes.body.data);
    expect(updatedData.revision).toBe(2);
    expect(updatedData.preferences.goodEnoughCharacters).toEqual([
      'avatar:10000046',
      'avatar:10000089',
      'avatar:10000103',
    ]);

    // 4. Re-fetch and verify updated state persists in DB
    const finalFetchRes = await api.get(`${url}?uid=${uid}`).auth(token(), { type: 'bearer' });
    expect(finalFetchRes.status).toBe(200);
    const finalData = teamPreferencesResponseSchema.parse(finalFetchRes.body.data);
    expect(finalData.revision).toBe(2);
    expect(finalData.preferences.goodEnoughCharacters).toEqual([
      'avatar:10000046',
      'avatar:10000089',
      'avatar:10000103',
    ]);
  });
});
