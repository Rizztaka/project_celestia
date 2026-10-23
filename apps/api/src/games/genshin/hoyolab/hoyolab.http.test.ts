import { randomUUID } from 'node:crypto';

import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.HOYOLAB_SESSION_KEY = Buffer.alloc(32, 42).toString('base64');
});
vi.mock('@/core/logger/logger.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { createApp } from '@/app.js';
import { env } from '@/core/config/env.js';
import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';
import { prisma } from '@/core/db/prisma.js';

import { fixtureCookies, fixtureDetailResponse, fixtureRole } from './hoyolab.fixtures.js';
import { mapCharacters } from './hoyolab.mapper.js';
import { HoyolabProvider } from './hoyolab.provider.js';

const databaseUrl = disposableTestDatabase();
const root = '/api/v1/games/genshin/hoyolab';
describe.skipIf(!databaseUrl)('HoYoLAB authenticated HTTP boundary', () => {
  const owners: string[] = [];
  let owner: string, bearer: string, api: ReturnType<typeof supertest>;
  beforeEach(async () => {
    owner = randomUUID();
    owners.push(owner);
    await prisma.user.create({
      data: {
        id: owner,
        email: `${owner}@test.invalid`,
        username: `http-${owner}`,
        password: 'synthetic-only',
      },
    });
    await prisma.session.create({
      data: {
        id: owner,
        userId: owner,
        tokenHash: owner,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    bearer = jwt.sign({ sid: owner }, env.JWT_SECRET, { subject: owner, expiresIn: '1h' });
    vi.restoreAllMocks();
    vi.spyOn(HoyolabProvider.prototype, 'accounts').mockResolvedValue([fixtureRole]);
    vi.spyOn(HoyolabProvider.prototype, 'snapshot').mockImplementation(async () => ({
      role: fixtureRole,
      observedAt: new Date(),
      notes: null,
      characters: mapCharacters(fixtureDetailResponse(), [10000038]),
    }));
    api = supertest(createApp());
  });
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: { in: owners } } });
    await prisma.$disconnect();
    vi.restoreAllMocks();
  });
  it('rejects anonymous and revoked-session credential writes before calling HoYoLAB', async () => {
    expect((await api.get(root)).status).toBe(401);
    expect(
      (await api.post(root + '/connect').send({ cookies: fixtureCookies, consent: true })).status,
    ).toBe(401);
    await prisma.session.update({ where: { id: owner }, data: { revokedAt: new Date() } });
    expect(
      (
        await api
          .post(root + '/connect')
          .auth(bearer, { type: 'bearer' })
          .send({ cookies: fixtureCookies, consent: true })
      ).status,
    ).toBe(401);
    expect(HoyolabProvider.prototype.accounts).not.toHaveBeenCalled();
    expect(
      await prisma.genshinHoyolabConnection.findUnique({ where: { userId: owner } }),
    ).toBeNull();
  });
  it('requires consent, bounds the body and rejects unrelated cookie families', async () => {
    for (const body of [
      { cookies: fixtureCookies },
      { cookies: { ...fixtureCookies, stoken: 'unneeded' }, consent: true },
    ])
      expect(
        (
          await api
            .post(root + '/connect')
            .auth(bearer, { type: 'bearer' })
            .send(body)
        ).status,
      ).toBe(400);
    expect(
      (
        await api
          .post(root + '/connect')
          .auth(bearer, { type: 'bearer' })
          .send({ cookies: { ...fixtureCookies, ltoken_v2: 'x'.repeat(100000) }, consent: true })
      ).status,
    ).toBe(413);
    expect(HoyolabProvider.prototype.accounts).not.toHaveBeenCalled();
  });
  it('connects, refreshes, returns equipped-only gear and removes the session on disconnect', async () => {
    const connected = await api
      .post(root + '/connect')
      .auth(bearer, { type: 'bearer' })
      .send({ cookies: fixtureCookies, consent: true });
    expect(connected.status).toBe(200);
    expect(connected.headers['cache-control']).toBe('no-store');
    expect(connected.text).not.toMatch(/ltoken|encryptedSession|leaseId/);
    const refreshed = await api.post(root + '/sync').auth(bearer, { type: 'bearer' });
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.data.syncedAt).toBeTruthy();
    const account = await prisma.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    await prisma.genshinArtifact.create({
      data: {
        accountId: account.id,
        setKey: 'UnwornSet',
        slotKey: 'flower',
        level: 0,
        rarity: 5,
        mainStatKey: 'hp',
        subStats: [],
      },
    });
    const gear = await api
      .get('/api/v1/games/genshin/artifacts?equipped=true')
      .auth(bearer, { type: 'bearer' });
    expect(gear.status).toBe(200);
    expect(gear.body.data.artifacts).toHaveLength(1);
    expect(gear.body.data.artifacts[0].mainStatValue).toBe(4780);
    expect(gear.body.data.artifacts[0].equippedBy.characterKey).toBe('Albedo');
    const weapons = await api
      .get('/api/v1/games/genshin/weapons?equipped=true')
      .auth(bearer, { type: 'bearer' });
    expect(weapons.body.data.weapons[0].equippedBy.characterKey).toBe('Albedo');
    const equipment = await api
      .get('/api/v1/games/genshin/characters/Albedo/equipment')
      .auth(bearer, { type: 'bearer' });
    expect(equipment.status).toBe(200);
    expect(equipment.body.data.character.talentBasis).toBe('hoyolab_displayed');
    const disconnected = await api.delete(root).auth(bearer, { type: 'bearer' });
    expect(disconnected.status).toBe(200);
    expect(disconnected.body.data.connected).toBe(false);
    expect(
      (await prisma.genshinHoyolabConnection.findUniqueOrThrow({ where: { userId: owner } }))
        .encryptedSession,
    ).toBeNull();
    expect(await prisma.genshinCharacter.count({ where: { accountId: account.id } })).toBe(1);
  });
});
