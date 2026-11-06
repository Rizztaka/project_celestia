import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const TEST_JWT_SECRET = 'test-only-jwt-secret-exactly-40-chars!!!';

vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'test-only-jwt-secret-exactly-40-chars!!!',
    JWT_EXPIRY: '1h',
  },
}));

const { mockPrismaSession, mockPrismaUser } = vi.hoisted(() => ({
  mockPrismaSession: {
    findFirst: vi.fn(),
  },
  mockPrismaUser: {
    findUnique: vi.fn(),
  },
}));

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: mockPrismaSession,
    user: mockPrismaUser,
  },
}));

import { createApp } from '@/app.js';

describe('Endgame Intelligence HTTP Routes Integration', () => {
  const app = createApp();
  const api = supertest(app);

  function makeAuthToken(userId = 'test-user-id'): string {
    return jwt.sign({ sub: userId, sid: 'fixture-session' }, TEST_JWT_SECRET, {
      expiresIn: '1h',
    });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaSession.findFirst.mockResolvedValue({
      id: 'fixture-session',
      userId: 'test-user-id',
    });
    mockPrismaUser.findUnique.mockResolvedValue({ id: 'test-user-id' });
  });

  // -------------------------------------------------------
  // Abyss Joint Solver Endpoint
  // -------------------------------------------------------

  describe('POST /api/v1/games/genshin/intelligence/endgame/abyss-joint', () => {
    const validAbyssPayload = {
      cycleId: '5.2-1',
      floor: 12,
      chamber: 1,
      candidateTeams: [
        {
          id: 'team-1',
          name: 'Raiden National',
          memberKeys: ['RaidenShogun', 'Bennett', 'Xiangling', 'Xingqiu'],
          primaryElement: 'Pyro',
          baseDps: 60000,
          comfortScore: 75,
        },
        {
          id: 'team-2',
          name: 'Keqing Aggravate',
          memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
          primaryElement: 'Electro',
          baseDps: 55000,
          comfortScore: 70,
        },
      ],
    };

    it('allows guest calculations when request is unauthenticated (returns HTTP 200)', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/abyss-joint')
        .send(validAbyssPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns HTTP 401 when malformed bearer token is provided', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/abyss-joint')
        .set('Authorization', 'Bearer invalid-token')
        .send(validAbyssPayload);

      expect(response.status).toBe(401);
    });

    it('returns HTTP 200 with structured joint recommendation when authenticated', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/abyss-joint')
        .set('Authorization', `Bearer ${token}`)
        .send(validAbyssPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          cycleId: '5.2-1',
          floor: 12,
          chamber: 1,
          firstHalf: expect.objectContaining({ score: expect.any(Number) }),
          secondHalf: expect.objectContaining({ score: expect.any(Number) }),
          jointScore: expect.any(Number),
          isJointOptimal: expect.any(Boolean),
          explanations: expect.any(Array),
        },
      });
      expect(response.body.data.explanations.length).toBeGreaterThan(0);
    });

    it('returns HTTP 400 validation error when fewer than 2 candidate teams are provided', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/abyss-joint')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cycleId: '5.2-1',
          floor: 12,
          chamber: 1,
          candidateTeams: [validAbyssPayload.candidateTeams[0]], // only 1 team
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // -------------------------------------------------------
  // Onslaught Joint Solver Endpoint
  // -------------------------------------------------------

  describe('POST /api/v1/games/genshin/intelligence/endgame/onslaught-joint', () => {
    const validOnslaughtPayload = {
      cycleId: '5.2-1',
      candidateTeams: [
        {
          id: 'team-1',
          name: 'Team 1',
          memberKeys: ['Neuvillette', 'Furina', 'Baizhu', 'KaedeharaKazuha'],
          baseDps: 70000,
          comfortScore: 90,
        },
        {
          id: 'team-2',
          name: 'Team 2',
          memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
          baseDps: 68000,
          comfortScore: 85,
        },
        {
          id: 'team-3',
          name: 'Team 3',
          memberKeys: ['Tighnari', 'Fischl', 'Nahida', 'RaidenShogun'],
          baseDps: 62000,
          comfortScore: 75,
        },
      ],
    };

    it('allows guest calculations when request is unauthenticated (returns HTTP 200)', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/onslaught-joint')
        .send(validOnslaughtPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns HTTP 401 when malformed bearer token is provided', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/onslaught-joint')
        .set('Authorization', 'Bearer invalid-token')
        .send(validOnslaughtPayload);

      expect(response.status).toBe(401);
    });

    it('returns HTTP 200 with 3-stage consecutive recommendation when authenticated', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/onslaught-joint')
        .set('Authorization', `Bearer ${token}`)
        .send(validOnslaughtPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          cycleId: '5.2-1',
          stages: expect.arrayContaining([
            expect.objectContaining({ stage: 1 }),
            expect.objectContaining({ stage: 2 }),
            expect.objectContaining({ stage: 3 }),
          ]),
          jointScore: expect.any(Number),
          allStagesCleared: true,
          explanations: expect.any(Array),
        },
      });
      expect(response.body.data.stages).toHaveLength(3);
    });

    it('returns HTTP 400 when candidate teams count is less than 3', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/onslaught-joint')
        .set('Authorization', `Bearer ${token}`)
        .send({
          cycleId: '5.2-1',
          candidateTeams: validOnslaughtPayload.candidateTeams.slice(0, 2),
        });

      expect(response.status).toBe(400);
    });
  });

  // -------------------------------------------------------
  // Theater Act Planner Endpoint
  // -------------------------------------------------------

  describe('POST /api/v1/games/genshin/intelligence/endgame/theater-plan', () => {
    const validTheaterPayload = {
      seasonId: '2026-11-01',
      difficulty: 'HARD',
      castKeys: [
        'HuTao',
        'Arlecchino',
        'RaidenShogun',
        'Keqing',
        'Yoimiya',
        'Diluc',
        'Xiangling',
        'Xingqiu',
        'Yelan',
        'Fischl',
        'Furina',
        'YaeMiko',
        'Bennett',
        'KaedeharaKazuha',
        'Sucrose',
        'Zhongli',
        'Baizhu',
        'Layla',
      ],
      currentAct: 1,
      remainingVigor: {},
      completedActs: [],
    };

    it('allows guest calculations when request is unauthenticated (returns HTTP 200)', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/theater-plan')
        .send(validTheaterPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('returns HTTP 401 when malformed bearer token is provided', async () => {
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/theater-plan')
        .set('Authorization', 'Bearer invalid-token')
        .send(validTheaterPayload);

      expect(response.status).toBe(401);
    });

    it('returns HTTP 200 with dynamic act schedule and boss locks when authenticated', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/theater-plan')
        .set('Authorization', `Bearer ${token}`)
        .send(validTheaterPayload);

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        data: {
          seasonId: '2026-11-01',
          currentAct: 1,
          nextRecommendedTeam: expect.any(Array),
          projectedSchedule: expect.any(Array),
          reservedForBosses: expect.any(Object),
          vigorExhaustionRisk: false,
          explanations: expect.any(Array),
        },
      });
      expect(response.body.data.nextRecommendedTeam).toHaveLength(4);
      expect(response.body.data.projectedSchedule).toHaveLength(8);
    });

    it('returns HTTP 400 when castKeys size is below minimum (10)', async () => {
      const token = makeAuthToken();
      const response = await api
        .post('/api/v1/games/genshin/intelligence/endgame/theater-plan')
        .set('Authorization', `Bearer ${token}`)
        .send({
          ...validTheaterPayload,
          castKeys: ['HuTao', 'Bennett'], // only 2
        });

      expect(response.status).toBe(400);
    });
  });
});
