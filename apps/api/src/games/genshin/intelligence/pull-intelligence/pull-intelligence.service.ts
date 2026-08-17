import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import { CharacterIntelligenceService } from '../character-intelligence/character-intelligence.service.js';
import {
  type ActiveBanner,
  calculatePullValue,
  type PullRecommendationLabel,
  type PullScoreBreakdown,
} from './pull-intelligence.calculator.js';
import { explainPullValue } from './pull-intelligence.explainer.js';
import type { TeamTemplate } from '../team-intelligence/team-intelligence.calculator.js';
import { scoreAllTemplates } from '../team-intelligence/team-intelligence.calculator.js';
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const { banners: ALL_BANNERS } = require('../../static/active-banners.json') as {
  banners: ActiveBanner[];
};

const { templates: META_TEMPLATES } = require('../../static/team-templates.json') as {
  templates: TeamTemplate[];
};

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface PullRecommendation {
  bannerId: string;
  bannerName: string;
  fiveStarKey: string;
  fourStarKeys: string[];
  pullValueScore: number;
  recommendation: PullRecommendationLabel;
  explanations: string[];
}

export interface PullIntelligenceResponse {
  recommendations: PullRecommendation[];
  analysedAt: string;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class PullIntelligenceService {
  private readonly characterService: CharacterIntelligenceService;
  private readonly genshinCharacterService: GenshinCharacterService;

  constructor() {
    this.characterService = new CharacterIntelligenceService();
    this.genshinCharacterService = new GenshinCharacterService();
  }

  /**
   * Returns Pull Value recommendations for all active banners, sorted by
   * score descending (highest priority first).
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   */
  async getRecommendations(userId: string): Promise<PullIntelligenceResponse> {
    // ── 1. Verify Genshin account ─────────────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    // ── 2. Fetch user's roster for calculator input ───────────────────────
    const rawRoster: CharacterWithWeapon[] =
      await this.genshinCharacterService.getCharactersForUser(userId);

    // ── 3. Shape roster into calculator inputs ────────────────────────────
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

    // ── 4. Compute current team score breakdowns (before simulating pulls) ─
    const currentBreakdowns = scoreAllTemplates(META_TEMPLATES, roster);

    // ── 5. Fetch Character Intelligence for synergy (graceful fallback) ───
    let characterRecs: Awaited<
      ReturnType<CharacterIntelligenceService['getRecommendations']>
    >['recommendations'] = [];

    try {
      const ciResponse = await this.characterService.getRecommendations(userId);
      characterRecs = ciResponse.recommendations;
    } catch {
      // Non-fatal: if roster is empty or CI fails, synergy scores fall back to 0
    }

    // ── 6. Filter banners to only non-expired ones ────────────────────────
    const now = new Date();
    const activeBanners = ALL_BANNERS.filter(
      (b) => new Date(b.endDate) > now,
    );

    // ── 7. Score and explain each banner ─────────────────────────────────
    const breakdowns: PullScoreBreakdown[] = activeBanners.map((banner) =>
      calculatePullValue(
        banner,
        roster,
        META_TEMPLATES,
        currentBreakdowns,
        characterRecs,
        scoreAllTemplates,
      ),
    );

    // ── 8. Attach explanations and sort ────────────────────────────────────
    const recommendations: PullRecommendation[] = breakdowns
      .map((breakdown) => ({
        bannerId: breakdown.bannerId,
        bannerName: breakdown.bannerName,
        fiveStarKey: breakdown.fiveStarKey,
        fourStarKeys: breakdown.fourStarKeys,
        pullValueScore: breakdown.totalScore,
        recommendation: breakdown.recommendation,
        explanations: explainPullValue(breakdown),
      }))
      .sort((a, b) => b.pullValueScore - a.pullValueScore);

    return {
      recommendations,
      analysedAt: new Date().toISOString(),
    };
  }
}
