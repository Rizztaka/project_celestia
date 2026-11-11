import { companionSummaryResponseSchema } from '@celestia/api-contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { GenshinCharacterService } from '../../characters/character.service.js';
import type { ShowcaseService } from '../../showcase/showcase.service.js';
import type { PullIntelligenceService } from '../pull-intelligence/pull-intelligence.service.js';
import type { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
import { CompanionSummaryService } from './companion-summary.service.js';

describe('CompanionSummaryService', () => {
  let service: CompanionSummaryService;
  let mockCharacterService: { getCharactersForUser: ReturnType<typeof vi.fn> };
  let mockShowcaseService: { lookup: ReturnType<typeof vi.fn> };
  let mockPullService: {
    getRecommendations: ReturnType<typeof vi.fn>;
    getPublicShowcaseRecommendations: ReturnType<typeof vi.fn>;
  };
  let mockTeamService: {
    getRecommendations: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    mockCharacterService = {
      getCharactersForUser: vi.fn().mockResolvedValue([
        {
          characterKey: 'Mavuika',
          level: 90,
          ascension: 6,
          constellation: 0,
          talentNormal: 6,
          talentSkill: 10,
          talentBurst: 10,
          equippedWeapon: {
            weaponKey: 'AThousandBlazingSuns',
            level: 90,
            refinement: 1,
          },
        },
        {
          characterKey: 'Bennett',
          level: 80,
          ascension: 5,
          constellation: 5,
          talentNormal: 1,
          talentSkill: 6,
          talentBurst: 9,
          equippedWeapon: {
            weaponKey: 'SapwoodBlade',
            level: 80,
            refinement: 1,
          },
        },
      ]),
    };

    mockShowcaseService = {
      lookup: vi.fn().mockResolvedValue({
        snapshot: {
          uid: '800000001',
          nickname: 'Traveler',
          characters: [
            {
              key: 'Mavuika',
              level: 90,
              constellation: 0,
              weapon: { key: 'AThousandBlazingSuns', level: 90, refinement: 1 },
            },
          ],
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

    mockTeamService = {
      getRecommendations: vi.fn().mockResolvedValue({
        recommendations: [
          {
            templateName: 'Mavuika Hypercarry',
            archetype: 'Vaporize / Melt Burst',
            reaction: 'vaporize',
            score: 95,
            isBuildable: true,
            roster: [
              { characterKey: 'Mavuika' },
              { characterKey: 'Bennett' },
              { characterKey: 'Xilonen' },
              { characterKey: 'Citlali' },
            ],
            explanations: ['Exceptional Natlan burst scaling with double pyro resonance.'],
          },
        ],
      }),
    };

    service = new CompanionSummaryService(
      undefined,
      undefined,
      undefined,
      mockPullService as unknown as PullIntelligenceService,
      mockCharacterService as unknown as GenshinCharacterService,
      mockShowcaseService as unknown as ShowcaseService,
      mockTeamService as unknown as TeamIntelligenceService,
    );
  });

  it('generates authenticated companion summary for existing user', async () => {
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

    const summary = await service.getSummary('user-1');

    expect(summary.contractVersion).toBe(1);
    expect(summary.accountScope).toBe('authenticated');
    expect(summary.isPartialAccount).toBe(false);
    expect(summary.primaryAction).toBeDefined();
    expect(summary.teamSuggestion).toBeDefined();
    expect(summary.teamSuggestion?.teamName).toBe('Mavuika Hypercarry');
    expect(summary.narrativeOverview.length).toBeGreaterThan(0);

    const parsed = companionSummaryResponseSchema.safeParse(summary);
    expect(parsed.success).toBe(true);
  });

  it('throws NotFoundError when account does not exist', async () => {
    vi.spyOn(prisma.genshinAccount, 'findUnique').mockResolvedValue(null);

    await expect(service.getSummary('unknown-user')).rejects.toThrow(NotFoundError);
  });

  it('generates public showcase companion summary for valid UID', async () => {
    const summary = await service.getPublicShowcaseSummary('800000001');

    expect(summary.contractVersion).toBe(1);
    expect(summary.accountScope).toBe('public_showcase');
    expect(summary.isPartialAccount).toBe(true);
    expect(summary.missingDataCaveats.some((c) => c.includes('Partial public showcase'))).toBe(
      true,
    );

    const parsed = companionSummaryResponseSchema.safeParse(summary);
    expect(parsed.success).toBe(true);
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
      {
        characterKey: 'Bennett',
        level: 80,
        ascension: 5,
        constellation: 5,
        talentNormal: 1,
        talentSkill: 6,
        talentBurst: 9,
        equippedWeapon: null,
      },
      {
        characterKey: 'UnindexedCharacterXYZ',
        level: 80,
        ascension: 5,
        constellation: 0,
        talentNormal: 6,
        talentSkill: 6,
        talentBurst: 6,
        equippedWeapon: null,
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
