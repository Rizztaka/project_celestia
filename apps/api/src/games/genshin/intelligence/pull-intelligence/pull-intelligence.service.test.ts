import type { GenshinAccount, GenshinTeamPreferences } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import { CharacterIntelligenceService } from '../character-intelligence/character-intelligence.service.js';
import { PullIntelligenceService } from './pull-intelligence.service.js';

// -------------------------------------------------------
// Mocks
// -------------------------------------------------------

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinTeamPreferences: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    genshinShowcaseSnapshot: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from '@/core/db/prisma.js';

describe('PullIntelligenceService (Milestone 5)', () => {
  let service: PullIntelligenceService;
  let mockCharService: GenshinCharacterService;
  let mockCiService: CharacterIntelligenceService;
  let mockShowcaseService: ShowcaseService;

  const MOCK_USER_ID = 'test-user-uuid-123';

  const MOCK_ROSTER = [
    {
      id: 'char-1',
      characterKey: 'HuTao',
      level: 90,
      ascension: 6,
      constellation: 0,
      talentNormal: 10,
      talentSkill: 10,
      talentBurst: 10,
      equippedWeapon: {
        id: 'weap-1',
        weaponKey: 'StaffOfHoma',
        level: 90,
        refinement: 1,
      },
    },
    {
      id: 'char-2',
      characterKey: 'Xingqiu',
      level: 80,
      ascension: 6,
      constellation: 6,
      talentNormal: 1,
      talentSkill: 8,
      talentBurst: 9,
      equippedWeapon: null,
    },
  ] as unknown as CharacterWithWeapon[];

  beforeEach(() => {
    vi.clearAllMocks();

    mockCharService = new GenshinCharacterService();
    mockCiService = new CharacterIntelligenceService();
    mockShowcaseService = new ShowcaseService();

    vi.spyOn(mockCharService, 'getCharactersForUser').mockResolvedValue(MOCK_ROSTER);
    vi.spyOn(mockCiService, 'getRecommendations').mockResolvedValue({
      recommendations: [],
      skipped: [],
      analysedAt: new Date().toISOString(),
    });

    service = new PullIntelligenceService(mockCiService, mockCharService, mockShowcaseService);
  });

  it('throws NotFoundError if the user has no Genshin account', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue(null);

    await expect(service.getRecommendations('no-account-user')).rejects.toThrow(NotFoundError);
  });

  it('returns active banner recommendations for an authenticated account', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
      id: 'acc-1',
      userId: MOCK_USER_ID,
      server: 'os_asia',
      ar: 58,
      wl: 8,
      updatedAt: new Date(),
    } as unknown as GenshinAccount);

    vi.mocked(prisma.genshinTeamPreferences.findFirst).mockResolvedValue({
      id: 'pref-1',
      userId: MOCK_USER_ID,
      payload: {
        favorites: ['HuTao', 'Xilonen'],
      },
    } as unknown as GenshinTeamPreferences);

    const result = await service.getRecommendations(MOCK_USER_ID);

    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.isPartialAccount).toBe(false);
    expect(result.userWeights).toBeDefined();

    for (const rec of result.recommendations) {
      expect(rec.accountValueScore).toBeGreaterThanOrEqual(0);
      expect(rec.accountValueScore).toBeLessThanOrEqual(100);
      expect(rec.strategicRecommendation).toBeDefined();
      expect(rec.breakdown).toBeDefined();
      expect(rec.budgetForecast).toBeDefined();
      expect(rec.explanations.length).toBeGreaterThan(0);
    }
  });

  it('evaluates public showcase accounts with partial data flags', async () => {
    vi.spyOn(mockShowcaseService, 'lookup').mockResolvedValue({
      source: 'enka.network',
      delivery: 'cached',
      snapshot: {
        uid: '800000001',
        nickname: 'Traveler',
        signature: '',
        adventureRank: 60,
        worldLevel: 8,
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
            equipmentAvailable: true,
            talents: [],
          },
        ],
      },
      fetchedAt: new Date().toISOString(),
      nextRefreshAt: new Date(Date.now() + 60000).toISOString(),
      issue: null,
    });

    const result = await service.getPublicShowcaseRecommendations('800000001');

    expect(result.isPartialAccount).toBe(true);
    expect(result.recommendations.length).toBeGreaterThan(0);

    const firstRec = result.recommendations[0];
    expect(firstRec.isPartialAccount).toBe(true);
    expect(firstRec.missingDataNotes.length).toBeGreaterThan(0);
  });

  it('compares custom hypothetical target with user-defined weights and budget', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
      id: 'acc-1',
      userId: MOCK_USER_ID,
      server: 'os_asia',
    } as unknown as GenshinAccount);

    const result = await service.compareCustomHypothetical(MOCK_USER_ID, {
      targetKey: 'Xilonen',
      targetType: 'character',
      mode: 'c0_unlock',
      weights: {
        weightEndgame: 0.5,
        weightFlexibility: 0.3,
        weightComfort: 0.1,
        weightFavorites: 0.1,
      },
      budget: {
        primogems: 16000,
        fates: 20,
        pity: 50,
        guaranteed: true,
      },
    });

    expect(result.comparison).toBeDefined();
    expect(result.comparison.targetKey).toBe('Xilonen');
    expect(result.comparison.accountValueScore).toBeGreaterThan(30);
    expect(result.comparison.budgetForecast.currentPullsAvailable).toBe(120);
    expect(result.comparison.budgetForecast.acquisitionProbability).toBeGreaterThan(0.9);
    expect(result.comparison.simulation).toBe(true);
    expect(result.comparison.confidence).toBe('SIMULATED_SCENARIO');
    expect(result.comparison.explanations).toEqual(
      expect.arrayContaining([expect.stringContaining('Simulated Scenario')]),
    );
  });

  it('degrades to available: false when all banners are expired', async () => {
    vi.mocked(prisma.genshinAccount.findUnique).mockResolvedValue({
      id: 'acc-1',
      userId: MOCK_USER_ID,
      server: 'os_asia',
    } as unknown as GenshinAccount);

    // Set system time far into the future when 2029-12-31 is expired
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2035-01-01'));

    try {
      const result = await service.getRecommendations(MOCK_USER_ID);

      expect(result.available).toBe(false);
      expect(result.status).toBe('UNAVAILABLE');
      expect(result.confidence).toBe('STALE');
      expect(result.reason).toBe('No verified active banners currently live.');
      expect(result.recommendations).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('degrades to available: false for public showcase when all banners are expired', async () => {
    vi.spyOn(mockShowcaseService, 'lookup').mockResolvedValue({
      source: 'enka.network',
      delivery: 'cached',
      snapshot: {
        uid: '800000001',
        nickname: 'Traveler',
        signature: '',
        adventureRank: 60,
        worldLevel: 8,
        characters: [],
      },
      fetchedAt: new Date().toISOString(),
      nextRefreshAt: new Date().toISOString(),
      issue: null,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2035-01-01'));

    try {
      const result = await service.getPublicShowcaseRecommendations('800000001');

      expect(result.available).toBe(false);
      expect(result.status).toBe('UNAVAILABLE');
      expect(result.confidence).toBe('STALE');
      expect(result.reason).toBe('No verified active banners currently live.');
      expect(result.recommendations).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  describe('getVerifiedActiveBanners provenance gating', () => {
    it('rejects banners with missing or invalid rulesSource', async () => {
      const { getVerifiedActiveBanners } = await import('./pull-intelligence.service.js');
      const sample = [
        {
          bannerId: 'b1',
          name: 'Test',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Mavuika',
          fourStarKeys: [],
          startDate: '2026-01-01',
          endDate: '2028-01-01',
          sourceUrl: 'https://example.com/banner',
        },
      ];
      expect(getVerifiedActiveBanners(sample, 'not-a-url', new Date('2026-06-01'))).toEqual([]);
      expect(getVerifiedActiveBanners(sample, '', new Date('2026-06-01'))).toEqual([]);
      expect(getVerifiedActiveBanners(sample, null, new Date('2026-06-01'))).toEqual([]);
    });

    it('rejects banners with missing or invalid sourceUrl, or flagged historical/simulation', async () => {
      const { getVerifiedActiveBanners } = await import('./pull-intelligence.service.js');
      const sample = [
        {
          bannerId: 'b1',
          name: 'Test Valid',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Mavuika',
          fourStarKeys: [],
          startDate: '2026-01-01',
          endDate: '2028-01-01',
          sourceUrl: 'https://example.com/banner',
        },
        {
          bannerId: 'b2',
          name: 'Test Invalid Url',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Citlali',
          fourStarKeys: [],
          startDate: '2026-01-01',
          endDate: '2028-01-01',
          sourceUrl: 'invalid-url',
        },
        {
          bannerId: 'b3',
          name: 'Test Historical',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Xilonen',
          fourStarKeys: [],
          startDate: '2026-01-01',
          endDate: '2028-01-01',
          sourceUrl: 'https://example.com/banner',
          historical: true,
        },
        {
          bannerId: 'b4',
          name: 'Test Simulation',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Venti',
          fourStarKeys: [],
          startDate: '2026-01-01',
          endDate: '2028-01-01',
          sourceUrl: 'https://example.com/banner',
          simulation: true,
        },
        {
          bannerId: 'b5',
          name: 'Test Expired',
          type: 'CHARACTER' as const,
          fiveStarKey: 'Zhongli',
          fourStarKeys: [],
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          sourceUrl: 'https://example.com/banner',
        },
      ];
      const verified = getVerifiedActiveBanners(
        sample,
        'https://genshin.hoyoverse.com',
        new Date('2026-06-01'),
      );
      expect(verified).toHaveLength(1);
      expect(verified[0]!.bannerId).toBe('b1');
    });
  });
});
