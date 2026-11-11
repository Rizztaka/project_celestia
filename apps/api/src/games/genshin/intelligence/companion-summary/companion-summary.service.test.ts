import { companionSummaryResponseSchema } from '@celestia/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { GenshinCharacterService } from '../../characters/character.service.js';
import type { ShowcaseService } from '../../showcase/showcase.service.js';
import { EndgameIntelligenceService } from '../endgame-intelligence/endgame-intelligence.service.js';
import type { PullIntelligenceService } from '../pull-intelligence/pull-intelligence.service.js';
import { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
import { CompanionSummaryService } from './companion-summary.service.js';

function makeTwelveCharacterRoster() {
  const keys = [
    'HuTao',
    'Xingqiu',
    'Bennett',
    'KaedeharaKazuha',
    'Nahida',
    'SangonomiyaKokomi',
    'KukiShinobu',
    'Yelan',
    'KamisatoAyaka',
    'Mona',
    'Diona',
    'Zhongli',
  ];

  return keys.map((characterKey, idx) => ({
    id: `char-${idx + 1}`,
    accountId: 'acc-1',
    characterKey,
    level: 90,
    ascension: 6,
    constellation: 1,
    talentNormal: 8,
    talentSkill: 9,
    talentBurst: 9,
    equippedWeaponId: `weap-${idx + 1}`,
    equippedWeapon: {
      id: `weap-${idx + 1}`,
      accountId: 'acc-1',
      weaponKey: 'FavoniusSword',
      level: 90,
      ascension: 6,
      refinement: 5,
      locked: true,
      createdAt: new Date('2026-10-20T00:00:00Z'),
      updatedAt: new Date('2026-10-20T00:00:00Z'),
    },
    createdAt: new Date('2026-10-20T00:00:00Z'),
    updatedAt: new Date('2026-10-20T00:00:00Z'),
  }));
}

describe('CompanionSummaryService', () => {
  let service: CompanionSummaryService;
  let realEndgameService: EndgameIntelligenceService;
  let realTeamService: TeamIntelligenceService;
  let mockCharacterService: { getCharactersForUser: ReturnType<typeof vi.fn> };
  let mockShowcaseService: { lookup: ReturnType<typeof vi.fn> };
  let mockPullService: {
    getRecommendations: ReturnType<typeof vi.fn>;
    getPublicShowcaseRecommendations: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockCharacterService = {
      getCharactersForUser: vi.fn().mockResolvedValue(makeTwelveCharacterRoster()),
    };

    mockShowcaseService = {
      lookup: vi.fn().mockResolvedValue({
        source: 'enka.network',
        delivery: 'fetched',
        fetchedAt: '2026-11-10T12:00:00.000Z',
        nextRefreshAt: '2026-11-10T12:05:00.000Z',
        issue: null,
        snapshot: {
          uid: '800000001',
          nickname: 'Traveler',
          adventureRank: 60,
          worldLevel: 8,
          signature: 'Endgame Showcase',
          characters: [
            'HuTao',
            'Xingqiu',
            'Bennett',
            'KaedeharaKazuha',
            'Nahida',
            'SangonomiyaKokomi',
            'KukiShinobu',
            'Yelan',
            'KamisatoAyaka',
            'Mona',
            'Diona',
            'Zhongli',
          ].map((key, idx) => ({
            key,
            id: 10000046 + idx,
            name: key,
            level: 90,
            ascension: 6,
            constellation: 0,
            weapon: { id: 13501 + idx, name: 'StaffOfHoma', level: 90, refinement: 1 },
            artifacts: [],
            stats: [{ key: 'energyRecharge', value: 210 }],
            talents: [
              { kind: 'normal', baseLevel: 8 },
              { kind: 'skill', baseLevel: 8 },
              { kind: 'burst', baseLevel: 8 },
            ],
          })),
        },
      }),
    };

    mockPullService = {
      getRecommendations: vi.fn().mockResolvedValue({
        recommendations: [
          {
            targetKey: 'Citlali',
            bannerName: 'Starry Night’s Whispers',
            strategicRecommendation: 'HIGH_ACCOUNT_VALUE',
            explanations: ['Provides high party shielding and melt support.'],
          },
        ],
      }),
      getPublicShowcaseRecommendations: vi.fn().mockResolvedValue({
        recommendations: [
          {
            targetKey: 'Citlali',
            bannerName: 'Starry Night’s Whispers',
            strategicRecommendation: 'HIGH_ACCOUNT_VALUE',
            explanations: ['Provides high party shielding.'],
          },
        ],
      }),
    };

    realEndgameService = new EndgameIntelligenceService();
    realTeamService = new TeamIntelligenceService(
      undefined,
      mockCharacterService as unknown as GenshinCharacterService,
    );

    service = new CompanionSummaryService(
      undefined,
      undefined,
      realEndgameService,
      mockPullService as unknown as PullIntelligenceService,
      mockCharacterService as unknown as GenshinCharacterService,
      mockShowcaseService as unknown as ShowcaseService,
      realTeamService,
    );
  });

  it('invokes real team search and all three endgame solvers for authenticated summary instead of character counts', async () => {
    vi.spyOn(prisma.genshinAccount, 'findUnique').mockResolvedValue({
      id: 'acc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      uid: '800000001',
      nickname: 'Traveler',
      adventureRank: 60,
      worldLevel: 8,
    });

    const spyAbyss = vi.spyOn(realEndgameService, 'evaluateAbyssJoint');
    const spyOnslaught = vi.spyOn(realEndgameService, 'evaluateOnslaughtJoint');
    const spyTheater = vi.spyOn(realEndgameService, 'evaluateTheaterActPlan');
    const spyTeamRoster = vi.spyOn(realTeamService, 'getRecommendationsForRoster');

    const summary = await service.getSummary('user-1');

    expect(spyTeamRoster).toHaveBeenCalled();
    expect(spyAbyss).toHaveBeenCalledTimes(1);
    expect(spyOnslaught).toHaveBeenCalledTimes(1);
    expect(spyTheater).toHaveBeenCalledTimes(1);

    expect(summary.contractVersion).toBe(1);
    expect(summary.accountScope).toBe('authenticated');
    expect(summary.isPartialAccount).toBe(false);
    expect(summary.teamSuggestion).toBeDefined();
    expect(summary.teamSuggestion?.teamName).toBe('National Vaporize');
    expect(summary.endgameSnapshot.abyssScore).toBeGreaterThan(0);
    expect(summary.endgameSnapshot.abyssReady).toBe(true);
    expect(summary.endgameSnapshot.onslaughtReady).toBe(true);
    expect(summary.endgameSnapshot.theaterMaxActsEstimated).toBe(10);

    const parsed = companionSummaryResponseSchema.safeParse(summary);
    expect(parsed.success).toBe(true);
  });

  it('throws NotFoundError when account does not exist', async () => {
    vi.spyOn(prisma.genshinAccount, 'findUnique').mockResolvedValue(null);

    await expect(service.getSummary('unknown-user')).rejects.toThrow(NotFoundError);
  });

  it('generates public showcase companion summary with real teamSuggestion and real endgame solver evaluations', async () => {
    const spyAbyss = vi.spyOn(realEndgameService, 'evaluateAbyssJoint');
    const spyOnslaught = vi.spyOn(realEndgameService, 'evaluateOnslaughtJoint');
    const spyTheater = vi.spyOn(realEndgameService, 'evaluateTheaterActPlan');

    const summary = await service.getPublicShowcaseSummary('800000001');

    expect(spyAbyss).toHaveBeenCalledTimes(1);
    expect(spyOnslaught).toHaveBeenCalledTimes(1);
    expect(spyTheater).toHaveBeenCalledTimes(1);

    expect(summary.contractVersion).toBe(1);
    expect(summary.accountScope).toBe('public_showcase');
    expect(summary.isPartialAccount).toBe(true);
    expect(summary.teamSuggestion).toBeDefined();
    expect(summary.teamSuggestion?.teamName).toBe('National Vaporize');
    expect(summary.endgameSnapshot.abyssScore).toBeGreaterThan(0);
    expect(summary.endgameSnapshot.onslaughtReady).toBe(true);
    expect(summary.endgameSnapshot.theaterMaxActsEstimated).toBe(10);
    expect(summary.missingDataCaveats.some((c) => c.includes('Partial public showcase'))).toBe(
      true,
    );

    const parsed = companionSummaryResponseSchema.safeParse(summary);
    expect(parsed.success).toBe(true);
  });

  it('gracefully falls back to zeroed endgame status when roster has fewer than 4 characters', async () => {
    vi.spyOn(prisma.genshinAccount, 'findUnique').mockResolvedValue({
      id: 'acc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      uid: '800000001',
      nickname: 'Traveler',
      adventureRank: 60,
      worldLevel: 8,
    });

    mockCharacterService.getCharactersForUser.mockResolvedValueOnce(
      makeTwelveCharacterRoster().slice(0, 2),
    );

    const summary = await service.getSummary('user-1');

    expect(summary.endgameSnapshot).toMatchObject({
      abyssScore: 0,
      abyssReady: false,
      onslaughtReady: false,
      theaterMaxActsEstimated: 0,
    });
    expect(companionSummaryResponseSchema.safeParse(summary).success).toBe(true);
  });

  it('isolates unverified roster characters into skippedUnverifiedCharacters and caveats', async () => {
    vi.spyOn(prisma.genshinAccount, 'findUnique').mockResolvedValue({
      id: 'acc-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'user-1',
      uid: '800000001',
      nickname: 'Traveler',
      adventureRank: 60,
      worldLevel: 8,
    });

    mockCharacterService.getCharactersForUser.mockResolvedValueOnce([
      ...makeTwelveCharacterRoster().slice(0, 4),
      {
        id: 'char-unverified',
        accountId: 'acc-1',
        characterKey: 'UnindexedCharacterXYZ',
        level: 80,
        ascension: 5,
        constellation: 0,
        talentNormal: 6,
        talentSkill: 6,
        talentBurst: 6,
        equippedWeaponId: null,
        equippedWeapon: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const summary = await service.getSummary('user-1');

    expect(summary.skippedUnverifiedCharacters).toContain('UnindexedCharacterXYZ');
    expect(
      summary.missingDataCaveats.some((c) =>
        c.includes(
          'Unverified character(s) [UnindexedCharacterXYZ] omitted from readiness assessment',
        ),
      ),
    ).toBe(true);

    const parsed = companionSummaryResponseSchema.safeParse(summary);
    expect(parsed.success).toBe(true);
  });
});
