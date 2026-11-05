import { defaultTeamSearchPreferences } from '@celestia/api-contracts';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({ session: vi.fn(), preference: vi.fn(), account: vi.fn() }));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://localhost/placeholder',
    JWT_SECRET: 'synthetic-team-preferences-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: { findFirst: storage.session },
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
    genshinTeamPreferences: {
      findUnique: storage.preference,
      findUniqueOrThrow: storage.preference,
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    genshinAccount: { findFirst: storage.account },
  },
}));

import { createApp } from '@/app.js';

const url = '/api/v1/games/genshin/team-preferences';
const owner = 'owner-a';
const uid = '800000001';
const token = jwt.sign(
  { sid: 'synthetic-session' },
  'synthetic-team-preferences-secret-at-least-32-characters',
  { subject: owner, algorithm: 'HS256' },
);
const preference = defaultTeamSearchPreferences(uid, { ownerId: owner, accountId: null });

describe('authenticated team preference HTTP', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    storage.session.mockResolvedValue({ id: 'synthetic-session' });
    storage.account.mockResolvedValue(null);
    storage.preference.mockResolvedValue(null);
    storage.preference.mockImplementation(async () => null);
  });

  it('returns owner-scoped defaults and saves with a monotonic revision', async () => {
    const api = supertest(createApp());
    const empty = await api.get(`${url}?uid=${uid}`).auth(token, { type: 'bearer' });
    expect(empty.status).toBe(200);
    expect(empty.body.data).toMatchObject({ revision: 0, preferences: { ownerId: owner, uid } });

    const saved = { ...preference, comfort: 'execution_friendly' };
    storage.preference.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: owner,
      scopeKey: `uid:${uid}`,
      revision: 1,
      payload: saved,
    });
    storage.preference.mockImplementationOnce(async () => null);
    const response = await api
      .patch(url)
      .auth(token, { type: 'bearer' })
      .send({ scope: { uid, accountId: null }, expectedRevision: 0, preferences: saved });
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    expect(response.body.data).toMatchObject({
      revision: 1,
      preferences: { comfort: 'execution_friendly' },
    });
    expect(empty.headers['cache-control']).toBe('no-store');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('supports a private account scope without a public UID', async () => {
    const api = supertest(createApp());
    storage.account.mockResolvedValue({ uid: null });
    const accountId = 'private-account';
    const scoped = defaultTeamSearchPreferences(null, { ownerId: owner, accountId });
    storage.preference.mockResolvedValue(null);
    const empty = await api.get(`${url}?accountId=${accountId}`).auth(token, { type: 'bearer' });
    expect(empty.status, JSON.stringify(empty.body)).toBe(200);
    expect(empty.body.data.preferences).toMatchObject({ uid: null, accountId, ownerId: owner });

    storage.preference.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: owner,
      scopeKey: `account:${accountId}`,
      uid: null,
      accountId,
      revision: 1,
      payload: scoped,
    });
    const saved = await api
      .patch(url)
      .auth(token, { type: 'bearer' })
      .send({
        scope: { uid: null, accountId },
        expectedRevision: 0,
        preferences: scoped,
      });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.data.preferences).toMatchObject({ uid: null, accountId });
    storage.account.mockResolvedValue(null);
    expect(
      (await api.get(`${url}?accountId=other-owner-account`).auth(token, { type: 'bearer' }))
        .status,
    ).toBe(404);
  });

  it('fills a missing UID from an account-only scope instead of rejecting it', async () => {
    const api = supertest(createApp());
    storage.account.mockResolvedValue({ uid });
    const accountId = 'account-with-uid';
    const empty = await api.get(`${url}?accountId=${accountId}`).auth(token, { type: 'bearer' });
    expect(empty.status, JSON.stringify(empty.body)).toBe(200);
    expect(empty.body.data.preferences).toMatchObject({ uid, accountId, ownerId: owner });

    const base = defaultTeamSearchPreferences(null, { ownerId: owner, accountId });
    storage.preference.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: owner,
      scopeKey: `account:${accountId}`,
      uid,
      accountId,
      revision: 1,
      payload: base,
    });
    const saved = await api
      .patch(url)
      .auth(token, { type: 'bearer' })
      .send({ scope: { uid: null, accountId }, expectedRevision: 0, preferences: base });
    expect(saved.status, JSON.stringify(saved.body)).toBe(200);
    expect(saved.body.data.preferences).toMatchObject({ uid, accountId });
  });

  it('rejects stale revisions and selected accounts belonging to another owner', async () => {
    const api = supertest(createApp());
    storage.preference.mockResolvedValue({
      userId: owner,
      scopeKey: `uid:${uid}`,
      revision: 2,
      payload: preference,
    });
    expect(
      (
        await api
          .patch(url)
          .auth(token, { type: 'bearer' })
          .send({ scope: { uid, accountId: null }, expectedRevision: 1, preferences: preference })
      ).status,
    ).toBe(409);
    storage.account.mockResolvedValue(null);
    expect(
      (await api.get(`${url}?uid=${uid}&accountId=other-account`).auth(token, { type: 'bearer' }))
        .status,
    ).toBe(404);
  });
});
