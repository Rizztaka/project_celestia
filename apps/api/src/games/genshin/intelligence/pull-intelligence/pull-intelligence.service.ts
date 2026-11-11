import type {
  PullBudgetInput,
  PullCompareRequest,
  PullCompareResponse,
  PullIntelligenceResponse,
  PullRecommendation,
  PullTargetMode,
  PullUserWeights,
} from '@celestia/api-contracts';
import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { ShowcaseService } from '../../showcase/showcase.service.js';
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import { CharacterIntelligenceService } from '../character-intelligence/character-intelligence.service.js';
import type { TeamTemplate } from '../team-intelligence/team-intelligence.calculator.js';
import { scoreAllTemplates } from '../team-intelligence/team-intelligence.calculator.js';
import {
  type ActiveBanner,
  type ConstellationBenchmarksMap,
  evaluateCounterfactualAddition,
} from './pull-intelligence.calculator.js';
import { explainPullValue } from './pull-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const rawBannersData = require('../../static/active-banners.json') as {
  banners: (ActiveBanner & {
    historical?: boolean;
    startDate?: string;
    sourceUrl?: string;
    simulation?: boolean;
  })[];
  rulesSource?: string;
};

const ALL_BANNERS = rawBannersData.banners;
const RULES_SOURCE = rawBannersData.rulesSource;

export function isValidUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  try {
    const url = new URL(val);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getVerifiedActiveBanners(
  banners: typeof ALL_BANNERS = ALL_BANNERS,
  rulesSource: string | null | undefined = RULES_SOURCE,
  now: Date = new Date(),
) {
  const isRulesVerified =
    rulesSource !== undefined ? isValidUrl(rulesSource) : isValidUrl(RULES_SOURCE);
  if (!isRulesVerified) return [];

  return banners.filter((b) => {
    if (b.historical || b.simulation) return false;
    if (!isValidUrl(b.sourceUrl)) return false;
    if (b.startDate) {
      const start = new Date(b.startDate);
      if (isNaN(start.getTime()) || start > now) return false;
    }
    const end = new Date(b.endDate);
    if (isNaN(end.getTime()) || end <= now) return false;
    return true;
  });
}

const { templates: META_TEMPLATES } = require('../../static/team-templates.json') as {
  templates: TeamTemplate[];
};

const { constellations: CONSTELLATION_BENCHMARKS } =
  require('../../static/constellation-benchmarks.json') as {
    constellations: ConstellationBenchmarksMap;
  };

const CHARACTER_ELEMENTS = require('../../static/character-elements.json') as Record<
  string,
  string
>;

// Re-export response types for convenience
export type { PullIntelligenceResponse, PullRecommendation };

// -------------------------------------------------------
// Service Implementation
// -------------------------------------------------------

export class PullIntelligenceService {
  private readonly characterService: CharacterIntelligenceService;
  private readonly genshinCharacterService: GenshinCharacterService;
  private readonly showcaseService: ShowcaseService;

  constructor(
    characterService = new CharacterIntelligenceService(),
    genshinCharacterService = new GenshinCharacterService(),
    showcaseService = new ShowcaseService(),
  ) {
    this.characterService = characterService;
    this.genshinCharacterService = genshinCharacterService;
    this.showcaseService = showcaseService;
  }

  /**
   * Returns Account-Value Pull recommendations for all currently active banners,
   * scored by how much each banner target improves the user's roster, team versatility,
   * endgame coverage, and execution comfort.
   */
  async getRecommendations(
    userId: string,
    options?: {
      weights?: PullUserWeights;
      budget?: PullBudgetInput;
    },
  ): Promise<PullIntelligenceResponse> {
    // 1. Verify Genshin account
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    // 2. Fetch user's roster
    const rawRoster: CharacterWithWeapon[] =
      await this.genshinCharacterService.getCharactersForUser(userId);

    const roster: CharacterInput[] = rawRoster.map((char) => ({
      characterKey: char.characterKey,
      level: char.level,
      ascension: char.ascension,
      constellation: char.constellation,
      talentNormal: char.talentNormal,
      talentSkill: char.talentSkill,
      talentBurst: char.talentBurst,
      equippedWeapon: char.equippedWeapon
        ? {
            weaponKey: char.equippedWeapon.weaponKey,
            level: char.equippedWeapon.level,
            refinement: char.equippedWeapon.refinement,
          }
        : null,
    }));

    // 3. User favorites / preferences (graceful fallback)
    let favorites: string[] = [];
    try {
      const prefs = await prisma.genshinTeamPreferences.findFirst({ where: { userId } });
      if (prefs?.payload && typeof prefs.payload === 'object') {
        const payloadObj = prefs.payload as Record<string, unknown>;
        if (Array.isArray(payloadObj.favorites)) {
          favorites = payloadObj.favorites as string[];
        }
      }
    } catch {
      // Non-fatal if table not migrated or absent
    }

    // 4. Precompute current team score breakdowns
    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    // 5. Fetch Character Intelligence recommendations for fallback synergy
    let characterRecs: Awaited<
      ReturnType<CharacterIntelligenceService['getRecommendations']>
    >['recommendations'] = [];
    try {
      const ciResponse = await this.characterService.getRecommendations(userId);
      characterRecs = ciResponse.recommendations;
    } catch {
      // Non-fatal
    }

    // 6. Filter active banners with provenance and date gating
    const now = new Date();
    const activeBanners = getVerifiedActiveBanners(ALL_BANNERS, RULES_SOURCE, now);

    const userWeights: PullUserWeights = options?.weights ?? {
      weightEndgame: 0.35,
      weightFlexibility: 0.25,
      weightComfort: 0.2,
      weightFavorites: 0.2,
    };

    const budget: PullBudgetInput = options?.budget ?? {
      primogems: 0,
      fates: 0,
      pity: 0,
      guaranteed: false,
    };

    if (activeBanners.length === 0) {
      return {
        available: false,
        reason: 'No verified active banners currently live.',
        status: 'UNAVAILABLE',
        confidence: 'STALE',
        recommendations: [],
        userWeights,
        isPartialAccount: false,
        analyzedAt: now.toISOString(),
      };
    }

    // 7. Evaluate each active banner
    const recommendations: PullRecommendation[] = activeBanners
      .map((banner) => {
        const target = {
          targetKey: banner.fiveStarKey,
          targetType: (banner.type === 'WEAPON' ? 'weapon' : 'character') as 'character' | 'weapon',
          mode: (banner.type === 'WEAPON' ? 'signature_weapon' : 'c0_unlock') as PullTargetMode,
        };

        const rec = evaluateCounterfactualAddition({
          target,
          banner,
          roster,
          accountContext: {
            isPartialAccount: false,
            favorites,
            characterElements: CHARACTER_ELEMENTS,
          },
          templates: META_TEMPLATES,
          currentBreakdowns,
          characterRecs,
          userWeights,
          budget,
          constellationBenchmarks: CONSTELLATION_BENCHMARKS,
          scoreAllTemplatesFn: scoreAllTemplates,
        });

        rec.explanations = explainPullValue(rec);
        return rec;
      })
      .sort((a, b) => b.accountValueScore - a.accountValueScore);

    return {
      available: true,
      status: 'AVAILABLE',
      confidence: 'VERIFIED',
      recommendations,
      userWeights,
      isPartialAccount: false,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates active banners for a public showcase account.
   * Explicitly flags partial account data so that absent characters are not presumed unowned.
   */
  async getPublicShowcaseRecommendations(
    uid: string,
    options?: {
      weights?: PullUserWeights;
      budget?: PullBudgetInput;
    },
  ): Promise<PullIntelligenceResponse> {
    let roster: CharacterInput[] = [];

    try {
      const showcase = await this.showcaseService.lookup(uid);
      if (showcase.snapshot?.characters) {
        roster = showcase.snapshot.characters.map((c) => ({
          characterKey: c.key,
          level: c.level ?? 1,
          ascension: c.ascension ?? 0,
          constellation: c.constellation ?? 0,
          talentNormal: 6,
          talentSkill: 6,
          talentBurst: 6,
          equippedWeapon: c.weapon
            ? {
                weaponKey: c.weapon.name,
                level: c.weapon.level ?? 1,
                refinement: c.weapon.refinement ?? 1,
              }
            : null,
        }));
      }
    } catch {
      // Non-fatal: if lookup fails or rates out, proceed with empty observed roster
    }

    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    const now = new Date();
    const activeBanners = getVerifiedActiveBanners(ALL_BANNERS, RULES_SOURCE, now);

    const userWeights: PullUserWeights = options?.weights ?? {
      weightEndgame: 0.35,
      weightFlexibility: 0.25,
      weightComfort: 0.2,
      weightFavorites: 0.2,
    };

    const budget: PullBudgetInput = options?.budget ?? {
      primogems: 0,
      fates: 0,
      pity: 0,
      guaranteed: false,
    };

    if (activeBanners.length === 0) {
      return {
        available: false,
        reason: 'No verified active banners currently live.',
        status: 'UNAVAILABLE',
        confidence: 'STALE',
        recommendations: [],
        userWeights,
        isPartialAccount: true,
        analyzedAt: now.toISOString(),
      };
    }

    const recommendations: PullRecommendation[] = activeBanners
      .map((banner) => {
        const target = {
          targetKey: banner.fiveStarKey,
          targetType: (banner.type === 'WEAPON' ? 'weapon' : 'character') as 'character' | 'weapon',
          mode: (banner.type === 'WEAPON' ? 'signature_weapon' : 'c0_unlock') as PullTargetMode,
        };

        const rec = evaluateCounterfactualAddition({
          target,
          banner,
          roster,
          accountContext: {
            isPartialAccount: true, // Marked as partial showcase!
            favorites: [],
            characterElements: CHARACTER_ELEMENTS,
          },
          templates: META_TEMPLATES,
          currentBreakdowns,
          characterRecs: [],
          userWeights,
          budget,
          constellationBenchmarks: CONSTELLATION_BENCHMARKS,
          scoreAllTemplatesFn: scoreAllTemplates,
        });

        rec.explanations = explainPullValue(rec);
        return rec;
      })
      .sort((a, b) => b.accountValueScore - a.accountValueScore);

    return {
      available: true,
      status: 'AVAILABLE',
      confidence: 'VERIFIED',
      recommendations,
      userWeights,
      isPartialAccount: true,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Compares a custom hypothetical character, constellation, or weapon addition
   * against the player's account context.
   */
  async compareCustomHypothetical(
    userIdOrUid: string,
    input: PullCompareRequest,
    isPublic = false,
  ): Promise<PullCompareResponse> {
    let roster: CharacterInput[] = [];
    let favorites: string[] = [];
    const isPartial = isPublic;

    if (!isPublic) {
      try {
        const rawRoster = await this.genshinCharacterService.getCharactersForUser(userIdOrUid);
        roster = rawRoster.map((char) => ({
          characterKey: char.characterKey,
          level: char.level,
          ascension: char.ascension,
          constellation: char.constellation,
          talentNormal: char.talentNormal,
          talentSkill: char.talentSkill,
          talentBurst: char.talentBurst,
          equippedWeapon: char.equippedWeapon
            ? {
                weaponKey: char.equippedWeapon.weaponKey,
                level: char.equippedWeapon.level,
                refinement: char.equippedWeapon.refinement,
              }
            : null,
        }));
        const prefs = await prisma.genshinTeamPreferences.findFirst({
          where: { userId: userIdOrUid },
        });
        if (prefs?.payload && typeof prefs.payload === 'object') {
          const payloadObj = prefs.payload as Record<string, unknown>;
          if (Array.isArray(payloadObj.favorites)) {
            favorites = payloadObj.favorites as string[];
          }
        }
      } catch {
        // Fallback
      }
    } else {
      try {
        const showcase = await this.showcaseService.lookup(userIdOrUid);
        if (showcase.snapshot?.characters) {
          roster = showcase.snapshot.characters.map((c) => ({
            characterKey: c.key,
            level: c.level ?? 1,
            ascension: c.ascension ?? 0,
            constellation: c.constellation ?? 0,
            talentNormal: 6,
            talentSkill: 6,
            talentBurst: 6,
            equippedWeapon: null,
          }));
        }
      } catch {
        // Fallback
      }
    }

    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    const banner: ActiveBanner = {
      bannerId: `custom_${input.targetKey.toLowerCase()}`,
      name: `Custom Analysis: ${input.targetKey}`,
      type: input.targetType === 'weapon' ? 'WEAPON' : 'CHARACTER',
      fiveStarKey: input.targetKey,
      fourStarKeys: [],
      endDate: '2099-01-01',
      simulation: true,
    };

    const target = {
      targetKey: input.targetKey,
      targetType: input.targetType,
      mode: input.mode,
      targetConstellation: input.targetConstellation,
    };

    const rec = evaluateCounterfactualAddition({
      target,
      banner,
      roster,
      accountContext: {
        isPartialAccount: isPartial,
        favorites,
        characterElements: CHARACTER_ELEMENTS,
      },
      templates: META_TEMPLATES,
      currentBreakdowns,
      characterRecs: [],
      userWeights: input.weights,
      budget: input.budget,
      constellationBenchmarks: CONSTELLATION_BENCHMARKS,
      scoreAllTemplatesFn: scoreAllTemplates,
    });

    rec.explanations = explainPullValue(rec);

    return {
      comparison: rec,
      analyzedAt: new Date().toISOString(),
    };
  }
}
