import { createRequire } from 'node:module';

import type {
  CharacterReadinessRequestInput,
  CompanionSummaryResponse,
  MarginalInvestmentRequestInput,
  PullAdviceSnapshot,
  SupportedServerId,
  TeamSuggestionSnapshot,
} from '@celestia/api-contracts';

const require = createRequire(import.meta.url);
const CHARACTER_ELEMENTS: Record<string, string> = require('../../static/character-elements.json');

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { getOpenDomains } from '../../companion/domain-schedule.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import { EndgameIntelligenceService } from '../endgame-intelligence/endgame-intelligence.service.js';
import { MarginalInvestmentService } from '../marginal-investment/marginal-investment.service.js';
import { PullIntelligenceService } from '../pull-intelligence/pull-intelligence.service.js';
import { ReadinessIntelligenceService } from '../readiness-intelligence/readiness-intelligence.service.js';
import { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
import {
  calculateCompanionSummary,
  type EvaluatedCharacterReadiness,
  type EvaluatedEndgameStatus,
  type EvaluatedMarginalUpgrade,
} from './companion-summary.calculator.js';
import { explainCompanionSummary } from './companion-summary.explainer.js';

function serverFromUid(uid: string): SupportedServerId {
  if (uid.startsWith('6')) return 'america';
  if (uid.startsWith('7')) return 'europe';
  if (uid.startsWith('9')) return 'tw_hk_mo';
  return 'asia';
}

const TARGET_ENCOUNTER = {
  difficulty: 'abyss_12' as const,
  minCharacterLevel: 80,
  minWeaponLevel: 80,
};

export class CompanionSummaryService {
  constructor(
    private readonly readinessService = new ReadinessIntelligenceService(),
    private readonly marginalService = new MarginalInvestmentService(),
    private readonly endgameService = new EndgameIntelligenceService(),
    private readonly pullService = new PullIntelligenceService(),
    private readonly characterService = new GenshinCharacterService(),
    private readonly showcaseService = new ShowcaseService(),
    private readonly teamService = new TeamIntelligenceService(),
  ) {}

  /**
   * Generates orchestrated companion summary for an authenticated user account.
   */
  async getSummary(userId: string): Promise<CompanionSummaryResponse> {
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    const server: SupportedServerId = serverFromUid(account.uid ?? '');

    const now = new Date();
    const openDomains = getOpenDomains(now, server);
    const openDropKeySet = new Set(openDomains.flatMap((d) => d.dropKeys));
    const domainFamilies = openDomains.map((d) => d.drops[0] ?? d.name);

    // Fetch user's characters
    const rawRoster: CharacterWithWeapon[] =
      await this.characterService.getCharactersForUser(userId);

    const readinessList: EvaluatedCharacterReadiness[] = [];
    const upgradesList: EvaluatedMarginalUpgrade[] = [];
    const skippedUnverifiedCharacters: string[] = [];

    for (const char of rawRoster) {
      if (
        !CHARACTER_ELEMENTS[char.characterKey] &&
        !/^(Traveler|Aether|Lumine)/.test(char.characterKey)
      ) {
        skippedUnverifiedCharacters.push(char.characterKey);
        continue;
      }

      const buildInput: CharacterReadinessRequestInput = {
        character: {
          characterKey: char.characterKey,
          level: char.level,
          ascension: char.ascension,
          constellation: char.constellation,
          talents: {
            normal: char.talentNormal,
            skill: char.talentSkill,
            burst: char.talentBurst,
          },
          weapon: char.equippedWeapon
            ? {
                weaponKey: char.equippedWeapon.weaponKey,
                level: char.equippedWeapon.level,
                refinement: char.equippedWeapon.refinement,
              }
            : null,
          artifacts: {
            flower: null,
            plume: null,
            sands: null,
            goblet: null,
            circlet: null,
          },
        },
        targetEncounter: TARGET_ENCOUNTER,
      };

      try {
        const readResult = this.readinessService.evaluateReadiness(buildInput);
        readinessList.push({
          characterKey: char.characterKey,
          role: readResult.status,
          score: readResult.score,
          status: readResult.status,
        });

        const margInput: MarginalInvestmentRequestInput = {
          character: buildInput.character,
          targetEncounter: TARGET_ENCOUNTER,
        };
        const margResult = this.marginalService.evaluate(margInput);

        if (margResult.recommendedNextAction) {
          const next = margResult.recommendedNextAction;
          const matchingCost = next.costs.find((c) => openDropKeySet.has(c.materialKey));
          upgradesList.push({
            characterKey: char.characterKey,
            actionType: next.category === 'talent' ? 'TALENT_UPGRADE' : 'WEAPON_ASCENSION',
            actionDetail: `${next.category}: ${next.target} (${next.currentLevel}→${next.targetLevel})`,
            efficiencyScore: next.efficiencyScore,
            domainFamily: matchingCost ? matchingCost.name : undefined,
          });
        }
      } catch {
        // Safe continuation on individual character calculation error
      }
    }

    // Pull Intelligence
    let pullAdvice: PullAdviceSnapshot | undefined;
    try {
      const pullsResponse = await this.pullService.getRecommendations(userId);
      if (pullsResponse.recommendations.length > 0) {
        const top = pullsResponse.recommendations[0];
        pullAdvice = {
          recommendation: top.strategicRecommendation,
          targetBannerName: top.bannerName,
          targetCharacterKey: top.targetKey,
          keyReason: top.explanations[0] ?? 'Account value evaluation.',
        };
      }
    } catch {
      // Graceful fallback if pull engine cannot evaluate
    }

    // Team Intelligence (M3)
    let teamSuggestion: TeamSuggestionSnapshot | undefined;
    try {
      const teamRes = await this.teamService.getRecommendations(userId);
      if (teamRes.recommendations.length > 0) {
        const topTeam = teamRes.recommendations[0];
        const memberKeys = topTeam.roster
          .map((r) => r.characterKey)
          .filter((k): k is string => Boolean(k));
        teamSuggestion = {
          teamName: topTeam.templateName,
          members: memberKeys.length > 0 ? memberKeys : ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
          archetype: topTeam.archetype,
          comfortRating: topTeam.reaction,
          keyAdvantage: topTeam.explanations[0] ?? 'High meta synergy and reaction efficiency.',
          targetRoute: '/teams',
        };
      }
    } catch {
      // Graceful fallback if no team is buildable or roster < 4
    }

    // Endgame status
    const endgameStatus: EvaluatedEndgameStatus = {
      abyssScore: Math.min(
        100,
        Math.round((readinessList.filter((r) => r.status === 'ready_for_target').length / 8) * 100),
      ),
      abyssReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 8,
      onslaughtReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 12,
      theaterMaxActs: Math.min(10, Math.floor(readinessList.length / 2)),
    };

    const calcResult = calculateCompanionSummary({
      accountScope: 'authenticated',
      isPartialAccount: false,
      readinessList,
      upgradesList,
      openDomainFamilies: domainFamilies,
      endgameStatus,
      pullAdvice,
      teamSuggestion,
      skippedUnverifiedCharacters,
      timestamp: now.toISOString(),
    });

    const narrativeOverview = explainCompanionSummary(calcResult);

    return {
      ...calcResult,
      narrativeOverview,
    };
  }

  /**
   * Generates orchestrated companion summary for a public showcase UID.
   */
  async getPublicShowcaseSummary(uid: string): Promise<CompanionSummaryResponse> {
    const showcaseResult = await this.showcaseService.lookup(uid);
    if (!showcaseResult.snapshot) {
      throw new NotFoundError('Public showcase profile not found for this UID.');
    }

    const server = serverFromUid(uid);
    const now = new Date();
    const openDomains = getOpenDomains(now, server);
    const openDropKeySet = new Set(openDomains.flatMap((d) => d.dropKeys));
    const domainFamilies = openDomains.map((d) => d.drops[0] ?? d.name);

    const chars = showcaseResult.snapshot.characters;
    const readinessList: EvaluatedCharacterReadiness[] = [];
    const upgradesList: EvaluatedMarginalUpgrade[] = [];
    const skippedUnverifiedCharacters: string[] = [];

    for (const char of chars) {
      if (!CHARACTER_ELEMENTS[char.key] && !/^(Traveler|Aether|Lumine)/.test(char.key)) {
        skippedUnverifiedCharacters.push(char.key);
        continue;
      }

      const buildInput: CharacterReadinessRequestInput = {
        character: {
          characterKey: char.key,
          level: char.level,
          ascension: null,
          constellation: char.constellation,
          talents: {
            normal: null,
            skill: null,
            burst: null,
          },
          weapon: char.weapon
            ? {
                weaponKey: char.weapon.name,
                level: char.weapon.level,
                refinement: char.weapon.refinement,
              }
            : null,
          artifacts: {
            flower: null,
            plume: null,
            sands: null,
            goblet: null,
            circlet: null,
          },
        },
        targetEncounter: TARGET_ENCOUNTER,
      };

      try {
        const readResult = this.readinessService.evaluateReadiness(buildInput);
        readinessList.push({
          characterKey: char.key,
          role: readResult.status,
          score: readResult.score,
          status: readResult.status,
        });

        const margInput: MarginalInvestmentRequestInput = {
          character: buildInput.character,
          targetEncounter: TARGET_ENCOUNTER,
        };
        const margResult = this.marginalService.evaluate(margInput);

        if (margResult.recommendedNextAction) {
          const next = margResult.recommendedNextAction;
          const matchingCost = next.costs.find((c) => openDropKeySet.has(c.materialKey));
          upgradesList.push({
            characterKey: char.key,
            actionType: next.category === 'talent' ? 'TALENT_UPGRADE' : 'WEAPON_ASCENSION',
            actionDetail: `${next.category}: ${next.target} (${next.currentLevel}→${next.targetLevel})`,
            efficiencyScore: next.efficiencyScore,
            domainFamily: matchingCost ? matchingCost.name : undefined,
          });
        }
      } catch {
        // Safe continuation
      }
    }

    // Pull Intelligence
    let pullAdvice: PullAdviceSnapshot | undefined;
    try {
      const pullsResponse = await this.pullService.getPublicShowcaseRecommendations(uid);
      if (pullsResponse.recommendations.length > 0) {
        const top = pullsResponse.recommendations[0];
        pullAdvice = {
          recommendation: top.strategicRecommendation,
          targetBannerName: top.bannerName,
          targetCharacterKey: top.targetKey,
          keyReason: top.explanations[0] ?? 'Account value evaluation.',
        };
      }
    } catch {
      // Fallback
    }

    const endgameStatus: EvaluatedEndgameStatus = {
      abyssScore: Math.min(
        100,
        Math.round((readinessList.filter((r) => r.status === 'ready_for_target').length / 8) * 100),
      ),
      abyssReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 8,
      onslaughtReady: readinessList.filter((r) => r.status === 'ready_for_target').length >= 12,
      theaterMaxActs: Math.min(10, Math.floor(readinessList.length / 2)),
    };

    const calcResult = calculateCompanionSummary({
      accountScope: 'public_showcase',
      isPartialAccount: true,
      readinessList,
      upgradesList,
      openDomainFamilies: domainFamilies,
      endgameStatus,
      pullAdvice,
      skippedUnverifiedCharacters,
      timestamp: now.toISOString(),
    });

    const narrativeOverview = explainCompanionSummary(calcResult);

    return {
      ...calcResult,
      narrativeOverview,
    };
  }
}

export const companionSummaryService = new CompanionSummaryService();
