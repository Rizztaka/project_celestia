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

const { mockPrismaSession, mockPrismaUser, mockPrismaAccount, mockPrismaPref, mockPrismaShowcase } =
  vi.hoisted(() => ({
    mockPrismaSession: {
      findFirst: vi.fn(),
    },
    mockPrismaUser: {
      findUnique: vi.fn(),
    },
    mockPrismaAccount: {
      findUnique: vi.fn(),
    },
    mockPrismaPref: {
      findUnique: vi.fn(),
    },
    mockPrismaShowcase: {
      findUnique: vi.fn(),
    },
  }));

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    session: mockPrismaSession,
    user: mockPrismaUser,
    genshinAccount: mockPrismaAccount,
    genshinTeamPreference: mockPrismaPref,
    genshinShowcaseSnapshot: mockPrismaShowcase,
  },
}));

vi.mock('../../characters/character.service.js', () => {
  return {
    GenshinCharacterService: class {
      getCharactersForUser = vi.fn().mockResolvedValue([
        {
          id: 'char-1',
          characterKey: 'HuTao',
          level: 90,
          ascension: 6,
          constellation: 0,
          talentNormal: 10,
          talentSkill: 10,
          talentBurst: 10,
          equippedWeapon: null,
        },
        {
          id: 'char-2',
          characterKey: 'Xingqiu',
          level: 80,
          ascension: 6,
          constellation: 6,
          talentNormal: 1,
          talentSkill: 8,
          talentBurst: 8,
          equippedWeapon: null,
        },
      ]);
    },
  };
});

vi.mock('../../showcase/showcase.service.js', () => {
  return {
    ShowcaseService: class {
      lookup = vi.fn().mockResolvedValue({
        source: 'enka.network',
        delivery: 'cached',
        snapshot: {
          uid: '800000001',
          player: { nickname: 'Traveler', signature: '', level: 60, worldLevel: 8 },
          characters: [
            {
              key: 'HuTao',
              id: 10000046,
              name: 'Hu Tao',
              level: 90,
              ascension: 6,
              constellation: 0,
              element: 'Pyro',
              rarity: 5,
              weaponType: 'Polearm',
              metadataAvailable: true,
              portrait: null,
              skillDepotId: null,
              weapon: null,
              artifacts: [],
              stats: [],
            },
          ],
          recordCount: 1,
          source: 'enka.network',
          fetchedAt: new Date().toISOString(),
        },
        fetchedAt: new Date().toISOString(),
        nextRefreshAt: new Date(Date.now() + 60000).toISOString(),
        issue: null,
      });
    },
  };
});

import { createApp } from '@/app.js';

describe('Pull Intelligence HTTP Integration (Milestone 5)', () => {
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
    mockPrismaAccount.findUnique.mockResolvedValue({
      id: 'acc-1',
      userId: 'test-user-id',
      server: 'os_asia',
    });
    mockPrismaPref.findUnique.mockResolvedValue({
      id: 'pref-1',
      userId: 'test-user-id',
      favorites: ['HuTao'],
    });
  });

  describe('GET /api/v1/games/genshin/intelligence/pulls', () => {
    it('returns 401 when no authorization token is supplied', async () => {
      const res = await api.get('/api/v1/games/genshin/intelligence/pulls');
      expect(res.status).toBe(401);
    });

    it('returns 200 with recommendations for authenticated account', async () => {
      const token = makeAuthToken();
      const res = await api
        .get('/api/v1/games/genshin/intelligence/pulls')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.recommendations).toBeInstanceOf(Array);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      expect(res.body.data.isPartialAccount).toBe(false);
    });
  });

  describe('POST /api/v1/games/genshin/intelligence/pulls/compare', () => {
    it('returns 400 when body payload is invalid', async () => {
      const res = await api
        .post('/api/v1/games/genshin/intelligence/pulls/compare')
        .send({ targetKey: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 200 with comparative analysis for valid payload', async () => {
      const token = makeAuthToken();
      const res = await api
        .post('/api/v1/games/genshin/intelligence/pulls/compare')
        .set('Authorization', `Bearer ${token}`)
        .send({
          targetKey: 'Xilonen',
          targetType: 'character',
          mode: 'c0_unlock',
          weights: {
            weightEndgame: 0.4,
            weightFlexibility: 0.3,
            weightComfort: 0.15,
            weightFavorites: 0.15,
          },
          budget: {
            primogems: 8000,
            fates: 10,
            pity: 30,
            guaranteed: false,
          },
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.comparison).toBeDefined();
      expect(res.body.data.comparison.targetKey).toBe('Xilonen');
      expect(res.body.data.comparison.accountValueScore).toBeGreaterThanOrEqual(0);
      expect(res.body.data.comparison.budgetForecast.currentPullsAvailable).toBe(60);
    });
  });

  describe('GET /api/v1/games/genshin/public/uid/:uid/intelligence/pulls', () => {
    it('returns 400 for malformed UID', async () => {
      const res = await api.get('/api/v1/games/genshin/public/uid/invalid-uid/intelligence/pulls');
      expect(res.status).toBe(400);
    });

    it('returns 200 with partial account flags for valid 9-digit UID', async () => {
      const res = await api.get('/api/v1/games/genshin/public/uid/800000001/intelligence/pulls');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isPartialAccount).toBe(true);
      expect(res.body.data.recommendations.length).toBeGreaterThan(0);
      expect(res.body.data.recommendations[0].isPartialAccount).toBe(true);
    });
  });
});
