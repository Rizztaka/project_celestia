import { createRequire } from 'module';

import { prisma } from '@/core/db/prisma.js';
import { NotFoundError } from '@/core/errors/app-error.js';

import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinCharacterService } from '../../characters/character.service.js';
import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import { type KnowledgeInsightData, runAllAnalyzers } from './knowledge-intelligence.calculator.js';
import { explainInsight } from './knowledge-intelligence.explainer.js';

// -------------------------------------------------------
// Static data — loaded once at module init
// -------------------------------------------------------

const require = createRequire(import.meta.url);

const ELEMENT_MAP: Record<string, string> = require('../../static/character-elements.json');

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

/** Number of insights to return per request. */
const INSIGHTS_TO_RETURN = 3;

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface KnowledgeInsight {
  key: string;
  title: string;
  body: string;
  iconKey: string;
}

export interface KnowledgeIntelligenceResponse {
  insights: KnowledgeInsight[];
  totalInsightsFound: number;
  analysedAt: string;
}

// -------------------------------------------------------
// Helper — seeded pseudo-random selection
// -------------------------------------------------------

/**
 * Selects up to `count` items from `arr` using a simple seeded shuffle.
 * The seed is derived from the current UTC date + userId so the selection
 * changes daily but is consistent within a single day per user.
 */
function selectDailyInsights<T>(arr: T[], count: number, seed: number): T[] {
  if (arr.length <= count) return arr;

  // Simple seeded LCG shuffle (deterministic for the same seed)
  let s = seed;
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

/**
 * Builds a numeric daily seed from a date string + a user ID substring.
 * Consistent for the same user on the same UTC day.
 */
function buildDailySeed(userId: string): number {
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  const combined = today + userId.slice(0, 8);
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = (Math.imul(31, hash) + combined.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// -------------------------------------------------------
// Helper — roster shape
// -------------------------------------------------------

function toCharacterInput(chars: CharacterWithWeapon[]): CharacterInput[] {
  return chars.map((c) => ({
    characterKey: c.characterKey,
    level: c.level,
    ascension: c.ascension,
    constellation: c.constellation,
    talentNormal: c.talentNormal,
    talentSkill: c.talentSkill,
    talentBurst: c.talentBurst,
    equippedWeapon: c.equippedWeapon
      ? {
          weaponKey: c.equippedWeapon.weaponKey,
          level: c.equippedWeapon.level,
          refinement: c.equippedWeapon.refinement,
        }
      : null,
  }));
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class KnowledgeIntelligenceService {
  private readonly characterService: GenshinCharacterService;

  constructor() {
    this.characterService = new GenshinCharacterService();
  }

  /**
   * Generates personalized daily account insights for the authenticated user.
   *
   * Returns up to INSIGHTS_TO_RETURN insights, rotated daily by a seeded
   * selection so returning users see variety without needing server-side state.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   */
  async getInsights(userId: string): Promise<KnowledgeIntelligenceResponse> {
    // ── 1. Verify Genshin account ─────────────────────────────────────────
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    // ── 2. Fetch roster ───────────────────────────────────────────────────
    const rawRoster = await this.characterService.getCharactersForUser(userId);
    const roster = toCharacterInput(rawRoster);

    // ── 3. Fetch artifact counts ──────────────────────────────────────────
    const totalArtifactCount = await prisma.genshinArtifact.count({
      where: { accountId: account.id },
    });
    const equippedArtifactCount = await prisma.genshinArtifact.count({
      where: { accountId: account.id, equippedCharacterId: { not: null } },
    });

    // ── 4. Run analyzers ──────────────────────────────────────────────────
    const allInsights: KnowledgeInsightData[] = runAllAnalyzers(
      roster,
      ELEMENT_MAP,
      totalArtifactCount,
      equippedArtifactCount,
    );

    // ── 5. Select daily insights ──────────────────────────────────────────
    const seed = buildDailySeed(userId);
    const selected = selectDailyInsights(allInsights, INSIGHTS_TO_RETURN, seed);

    // ── 6. Explain selected insights ─────────────────────────────────────
    const insights: KnowledgeInsight[] = selected.map((data) => {
      const explanation = explainInsight(data);
      return {
        key: data.key,
        title: explanation.title,
        body: explanation.body,
        iconKey: explanation.iconKey,
      };
    });

    return {
      insights,
      totalInsightsFound: allInsights.length,
      analysedAt: new Date().toISOString(),
    };
  }
}
