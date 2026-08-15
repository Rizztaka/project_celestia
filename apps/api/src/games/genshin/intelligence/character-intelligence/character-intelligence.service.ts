import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import {
  calculateCharacterScore,
  type CharacterInput,
  type RecommendationLabel,
  type StaticCharacterProfile,
} from './character-intelligence.calculator.js';
import { explainCharacterScore } from './character-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

 
const characterProfiles: Record<string, StaticCharacterProfile> = require(
  '../../static/character-profiles.json',
);

const FALLBACK_PROFILE: StaticCharacterProfile = {
  metaTier: 3,
  role: 'sub_dps',
  priorityTalent: 'burst',
  weaponRarity: 4,
};

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface CharacterRecommendation {
  characterKey: string;
  rank: number;
  score: number;
  recommendation: RecommendationLabel;
  explanations: string[];
}

export interface SkippedCharacter {
  characterKey: string;
  reason: string;
}

export interface IntelligenceResponse {
  recommendations: CharacterRecommendation[];
  skipped: SkippedCharacter[];
  analysedAt: string;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class CharacterIntelligenceService {
  private readonly characterService: GenshinCharacterService;

  constructor() {
    this.characterService = new GenshinCharacterService();
  }

  /**
   * Analyses the authenticated user's roster and returns the top 5 highest-ROI
   * characters to invest in next, along with a plain-language explanation for
   * each recommendation.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if the account has an empty roster.
   */
  async getRecommendations(userId: string): Promise<IntelligenceResponse> {
    // ── 1. Verify account exists ──────────────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError(
        'No Genshin Impact account found. Please import your data first.',
      );
    }

    // ── 2. Fetch roster ───────────────────────────────────────────────────
    const roster: CharacterWithWeapon[] =
      await this.characterService.getCharactersForUser(userId);

    if (roster.length === 0) {
      throw new UnprocessableError(
        'Your roster is empty. Import your character data to receive recommendations.',
      );
    }

    // ── 3. Score every character ──────────────────────────────────────────
    const recommendations: Array<CharacterRecommendation & { _sortScore: number }> = [];
    const skipped: SkippedCharacter[] = [];

    for (const char of roster) {
      const profile = characterProfiles[char.characterKey] ?? null;
      const hasFallbackProfile = profile === null;
      const resolvedProfile: StaticCharacterProfile = profile ?? FALLBACK_PROFILE;

      const input: CharacterInput = {
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
      };

      const breakdown = calculateCharacterScore(input, resolvedProfile);

      if (breakdown.score < 20) {
        skipped.push({
          characterKey: char.characterKey,
          reason: 'Investment appears complete or priority is low — no significant gaps found.',
        });
      } else {
        const explanations = explainCharacterScore(
          input,
          resolvedProfile,
          breakdown,
          hasFallbackProfile,
        );
        recommendations.push({
          characterKey: char.characterKey,
          rank: 0, // populated after sorting
          score: breakdown.score,
          recommendation: breakdown.recommendationLabel,
          explanations,
          _sortScore: breakdown.score,
        });
      }
    }

    // ── 4. Sort and return top 5 ──────────────────────────────────────────
    recommendations.sort((a, b) => b._sortScore - a._sortScore);

    const top5 = recommendations.slice(0, 5).map(({ _sortScore: _, ...rec }, index) => ({
      ...rec,
      rank: index + 1,
    }));

    return {
      recommendations: top5,
      skipped,
      analysedAt: new Date().toISOString(),
    };
  }
}
