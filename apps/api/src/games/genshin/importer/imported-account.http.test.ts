import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { importedAccountFixture } from './imported-account.fixtures.js';

const storage = vi.hoisted(() => ({ snapshot: vi.fn(), session: vi.fn() }));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    PORT: '4000',
    DATABASE_URL: 'postgresql://localhost/placeholder',
    JWT_SECRET: 'synthetic-imported-account-http-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
// Real auth, router, service and repository; only external database I/O is substituted.
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: { findFirst: storage.session },
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
    genshinAccount: { findUnique: storage.snapshot },
    $transaction: async (read: (tx: unknown) => unknown) =>
      read({ genshinAccount: { findUnique: storage.snapshot } }),
  },
}));

import { createApp } from '@/app.js';

const url = '/api/v1/games/genshin/import/context';
const token = (owner = 'owner-a') =>
  jwt.sign(
    { sid: 'synthetic-session' },
    'synthetic-imported-account-http-secret-at-least-32-characters',
    { subject: owner, algorithm: 'HS256' },
  );
let api = supertest(createApp());
beforeEach(() => {
  vi.resetAllMocks();
  api = supertest(createApp());
  storage.session.mockResolvedValue({ id: 'synthetic-session' });
  storage.snapshot.mockImplementation(async ({ where }) =>
    where.userId === 'owner-a' ? importedAccountFixture() : null,
  );
});

describe('authenticated imported account HTTP', () => {
  it('returns a shared-contract context and stored instance evidence through the real repository', async () => {
    const response = await api.get(url).auth(token(), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.context).toMatchObject({
      uid: null,
      accountId: 'account-a',
      rosterScope: 'partial',
    });
    expect(response.body.data.evidence.weapons[0]).toMatchObject({
      id: 'weapon-a',
      weaponKey: 'StaffOfHoma',
    });
    expect(storage.snapshot).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'owner-a' } }),
    );
  });
  it('requires a live authenticated session before reading private data', async () => {
    expect((await api.get(url)).status).toBe(401);
    expect((await api.get(url).auth('bad-token', { type: 'bearer' })).status).toBe(401);
    storage.session.mockResolvedValue(null);
    expect((await api.get(url).auth(token(), { type: 'bearer' })).status).toBe(401);
    expect(storage.snapshot).not.toHaveBeenCalled();
  });
  it('isolates the selected account even for two owners sharing a public UID', async () => {
    storage.snapshot.mockImplementation(async ({ where }) => ({
      ...importedAccountFixture(),
      id: where.userId === 'owner-a' ? 'account-a' : 'account-b',
      userId: where.userId,
      uid: '800000001',
      ...(where.userId === 'owner-a'
        ? {}
        : { characters: [], weapons: [], artifacts: [], importStates: [] }),
    }));
    const own = await api.get(`${url}?accountId=account-a`).auth(token(), { type: 'bearer' });
    expect(own.status).toBe(200);
    for (const accountId of ['account-a', 'nonexistent']) {
      const denied = await api
        .get(`${url}?accountId=${accountId}`)
        .auth(token('owner-b'), { type: 'bearer' });
      expect(denied.status).toBe(404);
      expect(JSON.stringify(denied.body)).not.toContain('StaffOfHoma');
    }
    const other = await api.get(url).auth(token('owner-b'), { type: 'bearer' });
    expect(other.status).toBe(200);
    expect(other.body.data.evidence.characters).toEqual([]);
  });
  it.each(['uid=800000001', 'userId=owner-a', 'accountId=a&accountId=b'])(
    'rejects identity overrides: %s',
    async (query) => {
      expect(
        (await api.get(`${url}?${query}`).auth(token('owner-b'), { type: 'bearer' })).status,
      ).toBe(400);
      expect(storage.snapshot).not.toHaveBeenCalled();
    },
  );
  it('returns an unknown empty context without initializing an account', async () => {
    const response = await api.get(url).auth(token('new-owner'), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data.context).toMatchObject({
      accountId: null,
      uid: null,
      rosterScope: 'unknown',
      characters: [],
    });
    expect(response.body.data.evidence).toMatchObject({
      characters: [],
      weapons: [],
      artifacts: [],
      receipts: [],
    });
  });
  it('does not mount a public UID imported-account read', async () => {
    expect((await api.get('/api/v1/games/genshin/showcase/800000001/import/context')).status).toBe(
      404,
    );
    expect(storage.snapshot).not.toHaveBeenCalled();
  });
});
