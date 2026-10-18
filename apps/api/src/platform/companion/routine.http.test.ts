import type { GenshinRoutineState } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { RoutineStateCreate, RoutineStateUpdate } from './routine.repository.js';

const mocks = vi.hoisted(() => ({
  rows: new Map<string, GenshinRoutineState>(),
  read: vi.fn(),
  write: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-routine-http-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    $transaction: mocks.transaction,
    session: { findFirst: async () => ({ id: 'fixture-session' }) },
    user: { findUnique: async ({ where }: { where: { id: string } }) => ({ id: where.id }) },
  },
}));
vi.mock('./routine.repository.js', () => ({
  RoutineRepository: class {
    async findByUserId(id: string) {
      mocks.read(id);
      return mocks.rows.get(id) ?? null;
    }
    async findByUserIdInTx(_tx: unknown, id: string) {
      return this.findByUserId(id);
    }
    async findLegacyCompanion() {
      return null;
    }
    async findLegacyWeeklyBossState() {
      return null;
    }
    async createInTx(_tx: unknown, data: RoutineStateCreate) {
      const now = new Date();
      const row: GenshinRoutineState = {
        serverId: null,
        dailyPeriodStart: null,
        commissionsDone: false,
        teapotChecked: false,
        transformerLastUsedAt: null,
        resinAmount: null,
        resinRecordedAt: null,
        weeklyPeriodStart: null,
        weeklyRewardClaims: null,
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      mocks.write(data.userId);
      mocks.rows.set(data.userId, row);
      return row;
    }
    async updateInTx(_tx: unknown, id: string, data: RoutineStateUpdate) {
      const row = { ...mocks.rows.get(id)!, ...data };
      mocks.write(id);
      mocks.rows.set(id, row);
      return row;
    }
  },
}));
import { app } from '@/app.js';

const api = supertest(app);
const token = (owner = 'user-a') =>
  jwt.sign({ sid: 'fixture-session' }, 'local-routine-http-secret-at-least-32-characters', {
    subject: owner,
  });
const root = '/api/v1/companion';
const manual = { contractVersion: 2, expectedRevision: 0, serverId: null, dailyPeriodId: null };
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-09-27T20:00:00.000Z'));
  vi.clearAllMocks();
  mocks.rows.clear();
  mocks.transaction.mockImplementation(async (callback) =>
    callback({
      $queryRaw: vi.fn().mockResolvedValue([{ id: 'user-a' }]),
      genshinPlanDismissal: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      genshinPlanPreferences: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
    }),
  );
});
afterEach(() => vi.useRealTimers());

describe('Routine V2 HTTP contract and startup', () => {
  it.each(['/routine?contractVersion=2', '/daily', '/weekly-bosses'])(
    'authenticates GET %s',
    async (path) => {
      expect((await api.get(root + path)).status).toBe(401);
      expect(mocks.read).not.toHaveBeenCalled();
    },
  );
  it.each([
    '/routine/settings',
    '/routine/checklist',
    '/routine/resin',
    '/routine/weekly-claims',
    '/resin',
    '/checklist',
    '/weekly-bosses/Dvalin',
  ])('authenticates PATCH %s', async (path) => {
    expect((await api.patch(root + path).send(manual)).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('imports the real app before provider resolution and reads defaults without creating a row', async () => {
    const response = await api
      .get(root + '/routine?contractVersion=2')
      .auth(token(), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      contractVersion: 2,
      revision: 0,
      serverId: null,
      clockStatus: 'unselected',
      period: null,
      resin: { known: false },
    });
    expect(mocks.read).toHaveBeenCalledWith('user-a');
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each(['', '?contractVersion=1', '?contractVersion=2&userId=victim'])(
    'rejects malformed or identity-bearing query %s',
    async (query) => {
      expect(
        (await api.get(root + '/routine' + query).auth(token(), { type: 'bearer' })).status,
      ).toBe(400);
      expect(mocks.read).not.toHaveBeenCalled();
    },
  );
  it('accepts direct zero resin PATCH without a GET; only authenticated owner is written', async () => {
    const response = await api
      .patch(root + '/routine/resin')
      .auth(token(), { type: 'bearer' })
      .send({ ...manual, amount: 0 });
    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      revision: 1,
      resin: { known: true, currentAmount: 0 },
      serverNow: expect.any(String),
    });
    expect(mocks.write).toHaveBeenCalledExactlyOnceWith('user-a');
    expect(
      (await api.get(root + '/routine?contractVersion=2').auth(token('user-b'), { type: 'bearer' }))
        .body.data.revision,
    ).toBe(0);
  });
  it.each([
    { ...manual, amount: 50, userId: 'victim' },
    { ...manual, amount: 50, recordedAt: '2020-01-01' },
    { ...manual, amount: -1 },
    { ...manual, amount: 201 },
    { ...manual, amount: 0.5 },
    { ...manual, amount: '50' },
    { ...manual, amount: 50, expectedRevision: -1 },
    { ...manual, amount: 50, serverId: 'mars' },
    { amount: 50 },
  ])('rejects malformed resin input without a transaction: %j', async (body) => {
    expect(
      (
        await api
          .patch(root + '/routine/resin')
          .auth(token(), { type: 'bearer' })
          .send(body)
      ).status,
    ).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each([
    { ...manual, action: 'setDaily' },
    { ...manual, action: 'recordTransformerUse', commissionsDone: true },
    { ...manual, action: 'clearTransformerUse', transformerLastUsedAt: null },
  ])('rejects empty or mixed checklist actions: %j', async (body) => {
    expect(
      (
        await api
          .patch(root + '/routine/checklist')
          .auth(token(), { type: 'bearer' })
          .send(body)
      ).status,
    ).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it('returns visible revision, server, and period conflicts without retry or write', async () => {
    await api
      .patch(root + '/routine/resin')
      .auth(token(), { type: 'bearer' })
      .send({ ...manual, amount: 20 });
    for (const [body, code] of [
      [{ ...manual, amount: 80 }, 'COMPANION_STALE_REVISION'],
      [
        { ...manual, expectedRevision: 1, serverId: 'asia', amount: 80 },
        'COMPANION_SERVER_MISMATCH',
      ],
      [
        { ...manual, expectedRevision: 1, dailyPeriodId: 'old', amount: 80 },
        'COMPANION_STALE_PERIOD',
      ],
    ] as const) {
      const response = await api
        .patch(root + '/routine/resin')
        .auth(token(), { type: 'bearer' })
        .send(body);
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe(code);
    }
    expect(mocks.write).toHaveBeenCalledTimes(1);
  });
  it('activates Asia through real app registration and accepts current daily and weekly writes', async () => {
    const settings = await api
      .patch(root + '/routine/settings')
      .auth(token(), { type: 'bearer' })
      .send({ contractVersion: 2, expectedRevision: 0, serverId: 'asia' });
    expect(settings.body.data).toMatchObject({
      clockStatus: 'available',
      serverId: 'asia',
      period: {
        dailyPeriodId: 'genshin:asia:v1:daily:2026-09-27T20:00:00.000Z',
        weeklyPeriodId: 'genshin:asia:v1:weekly:2026-09-27T20:00:00.000Z',
      },
    });
    const body = {
      ...manual,
      expectedRevision: 1,
      serverId: 'asia',
      dailyPeriodId: settings.body.data.period.dailyPeriodId,
    };
    // An older unverified-clock client must refresh instead of writing with null periods.
    const stale = await api
      .patch(root + '/routine/checklist')
      .auth(token(), { type: 'bearer' })
      .send({ ...body, dailyPeriodId: null, action: 'setDaily', commissionsDone: true });
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('COMPANION_STALE_PERIOD');
    expect(mocks.write).toHaveBeenCalledTimes(1);
    const daily = await api
      .patch(root + '/routine/checklist')
      .auth(token(), { type: 'bearer' })
      .send({ ...body, action: 'setDaily', commissionsDone: true });
    expect(daily.status).toBe(200);
    expect(daily.body.data.tasks).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'commissions', done: true })]),
    );
    const partial = await api
      .patch(root + '/routine/checklist')
      .auth(token(), { type: 'bearer' })
      .send({ ...body, expectedRevision: 2, action: 'setDaily', teapotChecked: true });
    expect(partial.status).toBe(200);
    expect(partial.body.data.tasks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'commissions', done: true }),
        expect.objectContaining({ id: 'teapot', done: true }),
      ]),
    );
    const weekly = await api
      .patch(root + '/routine/weekly-claims')
      .auth(token(), { type: 'bearer' })
      .send({
        ...body,
        expectedRevision: 3,
        weeklyPeriodId: settings.body.data.period.weeklyPeriodId,
        rewardClaims: 0,
      });
    expect(weekly.status).toBe(200);
    expect(weekly.body.data.weeklyClaims).toMatchObject({ rewardClaims: 0 });
    const manualResponse = await api
      .patch(root + '/routine/checklist')
      .auth(token(), { type: 'bearer' })
      .send({ ...body, expectedRevision: 4, action: 'recordTransformerUse' });
    expect(manualResponse.status).toBe(200);
    expect(manualResponse.body.data.revision).toBe(5);
    const read = await api
      .get(root + '/routine?contractVersion=2')
      .auth(token(), { type: 'bearer' });
    expect(read.body.data).toEqual(manualResponse.body.data);
    expect(mocks.write).toHaveBeenCalledTimes(5);
  });
  it('fails every retired endpoint closed without reading or writing legacy state', async () => {
    const responses = [
      await api.get(root + '/daily').auth(token(), { type: 'bearer' }),
      await api.get(root + '/weekly-bosses').auth(token(), { type: 'bearer' }),
      ...(await Promise.all(
        ['/resin', '/checklist', '/weekly-bosses/Dvalin'].map((path) =>
          api
            .patch(root + path)
            .auth(token(), { type: 'bearer' })
            .send({ amount: 50 }),
        ),
      )),
    ];
    for (const response of responses) {
      expect(response.status).toBe(409);
      expect(response.body.error.code).toBe('COMPANION_CLIENT_UPDATE_REQUIRED');
    }
    expect(mocks.read).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
