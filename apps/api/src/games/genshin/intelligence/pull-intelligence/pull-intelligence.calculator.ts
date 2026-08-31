// -------------------------------------------------------
// Types — shared with Explainer and Service
// -------------------------------------------------------

import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import type {
  TeamScoreBreakdown,
  TeamTemplate,
} from '../team-intelligence/team-intelligence.calculator.js';
import type { CharacterRecommendation } from '../character-intelligence/character-intelligence.service.js';

// Re-export for convenience
export type { CharacterInput };

export interface ActiveBanner {
  bannerId: string;
  name: string;
  type: 'CHARACTER' | 'WEAPON';
  fiveStarKey: string;
  fourStarKeys: string[];
  endDate: string;
}

export type PullRecommendationLabel = 'MUST_PULL' | 'GOOD_VALUE' | 'SKIP';

export interface PullScoreBreakdown {
  bannerId: string;
  bannerName: string;
  fiveStarKey: string;
  fourStarKeys: string[];

  // Score components
  alreadyOwned: boolean;
  ownershipPenalty: number; // 0 or -100
  teamEnablerBonus: number; // 0..60
  teamEnablerTemplateName: string | null;
  synergyBonus: number; // 0..40
  synergyWith: string[]; // top invested chars that synergize
  fourStarGapBonus: number; // 0..20

  totalScore: number; // clamped 0-100
  recommendation: PullRecommendationLabel;
}

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const TEAM_ENABLER_BONUS_S = 60;
const TEAM_ENABLER_BONUS_A = 40;
const SYNERGY_BONUS = 40;
const FOUR_STAR_GAP_BONUS = 20;
const OWNERSHIP_PENALTY = 100;

/**
 * A team score >= 75 is treated as "S-tier buildable".
 * A team score >= 55 is treated as "A-tier buildable".
 */
const TIER_S_THRESHOLD = 75;
const TIER_A_THRESHOLD = 55;

/**
 * Number of the user's most-invested characters we consider for synergy.
 */
const TOP_N_FOR_SYNERGY = 3;

// -------------------------------------------------------
// Pure calculation functions
// -------------------------------------------------------

/**
 * Checks whether a character key appears as a candidate in any role of
 * any template at or above the given team score threshold.
 *
 * This lets us simulate "if the user owned X, which top-tier teams open up?"
 */
function findBestTeamEnabledBy(
  characterKey: string,
  templates: TeamTemplate[],
  roster: CharacterInput[],
  currentBreakdowns: TeamScoreBreakdown[],
  scoreAllTemplatesFn: (
    templates: TeamTemplate[],
    roster: CharacterInput[],
  ) => TeamScoreBreakdown[],
): { bonusScore: number; templateName: string | null } {
  // Only try for templates the character appears in as a candidate
  const relevantTemplates = templates.filter((t) =>
    t.roles.some((r) => r.candidates.includes(characterKey)),
  );

  if (relevantTemplates.length === 0) {
    return { bonusScore: 0, templateName: null };
  }

  // Build a simulated roster with the character added (prevent duplicates)
  const alreadyInRoster = roster.some((c) => c.characterKey === characterKey);
  const simulatedRoster = alreadyInRoster
    ? roster
    : [
        ...roster,
        {
          characterKey,
          level: 80,
          ascension: 6,
          constellation: 0,
          talentNormal: 6,
          talentSkill: 6,
          talentBurst: 6,
          equippedWeapon: null,
        },
      ];

  const simulatedBreakdowns = scoreAllTemplatesFn(relevantTemplates, simulatedRoster);

  let bestBonus = 0;
  let bestTemplateName: string | null = null;

  for (const sim of simulatedBreakdowns) {
    if (!sim.isBuildable) continue;

    // Find the current (pre-pull) score for this template
    const current = currentBreakdowns.find((b) => b.templateId === sim.templateId);
    const currentScore = current?.score ?? 0;

    // Only count if the pull actually improves it above a tier threshold
    if (sim.score >= TIER_S_THRESHOLD && currentScore < TIER_S_THRESHOLD) {
      const bonus = TEAM_ENABLER_BONUS_S;
      if (bonus > bestBonus) {
        bestBonus = bonus;
        bestTemplateName = relevantTemplates.find((t) => t.id === sim.templateId)?.name ?? null;
      }
    } else if (sim.score >= TIER_A_THRESHOLD && currentScore < TIER_A_THRESHOLD) {
      const bonus = TEAM_ENABLER_BONUS_A;
      if (bonus > bestBonus) {
        bestBonus = bonus;
        bestTemplateName = relevantTemplates.find((t) => t.id === sim.templateId)?.name ?? null;
      }
    }
  }

  return { bonusScore: bestBonus, templateName: bestTemplateName };
}

/**
 * Checks how many of the user's top-N most invested characters frequently
 * appear alongside the banner character in team templates.
 *
 * "Frequently" means they share at least one template together.
 */
function calculateSynergyBonus(
  characterKey: string,
  templates: TeamTemplate[],
  topInvestedKeys: string[],
): { bonus: number; synergyWith: string[] } {
  const templatesWithCharacter = templates.filter((t) =>
    t.roles.some((r) => r.candidates.includes(characterKey)),
  );

  const synergyWith: string[] = [];

  for (const investedKey of topInvestedKeys) {
    const shareTemplate = templatesWithCharacter.some((t) =>
      t.roles.some((r) => r.candidates.includes(investedKey)),
    );
    if (shareTemplate) {
      synergyWith.push(investedKey);
    }
  }

  // Scale bonus by how many top chars synergize (max SYNERGY_BONUS at 1+)
  const bonus = synergyWith.length > 0 ? SYNERGY_BONUS : 0;
  return { bonus, synergyWith };
}

/**
 * Checks if any 4-star on the banner would fill a meaningful gap:
 * the user doesn't own the character at all.
 */
function calculateFourStarGapBonus(
  fourStarKeys: string[],
  ownedCharacterKeys: Set<string>,
): number {
  const hasGap = fourStarKeys.some((key) => !ownedCharacterKeys.has(key));
  return hasGap ? FOUR_STAR_GAP_BONUS : 0;
}

/**
 * Maps a raw total score to a recommendation label.
 */
function scoreToLabel(score: number): PullRecommendationLabel {
  if (score >= 70) return 'MUST_PULL';
  if (score >= 35) return 'GOOD_VALUE';
  return 'SKIP';
}

// -------------------------------------------------------
// Main export
// -------------------------------------------------------

/**
 * Calculates a Pull Value Score for a single banner's 5-star character.
 *
 * ADR-0011 compliant: pure math, no strings.
 *
 * @param banner           - The banner being evaluated.
 * @param roster           - The user's current roster as CharacterInput[].
 * @param templates        - All team templates from team-templates.json.
 * @param currentBreakdowns - Team score breakdown with the user's CURRENT roster.
 * @param characterRecs    - Character Intelligence results (for priority ranking).
 * @param scoreAllTemplatesFn - Injected to allow pure unit testing.
 */
export function calculatePullValue(
  banner: ActiveBanner,
  roster: CharacterInput[],
  templates: TeamTemplate[],
  currentBreakdowns: TeamScoreBreakdown[],
  characterRecs: CharacterRecommendation[],
  scoreAllTemplatesFn: (
    templates: TeamTemplate[],
    roster: CharacterInput[],
  ) => TeamScoreBreakdown[],
): PullScoreBreakdown {
  const { fiveStarKey, fourStarKeys } = banner;
  const ownedKeys = new Set(roster.map((c) => c.characterKey));

  // ── 1. Ownership penalty ──────────────────────────────────────────────────
  const alreadyOwned = ownedKeys.has(fiveStarKey);
  const ownershipPenalty = alreadyOwned ? OWNERSHIP_PENALTY : 0;

  // If already owned, short-circuit with a SKIP score
  if (alreadyOwned) {
    return {
      bannerId: banner.bannerId,
      bannerName: banner.name,
      fiveStarKey,
      fourStarKeys,
      alreadyOwned: true,
      ownershipPenalty,
      teamEnablerBonus: 0,
      teamEnablerTemplateName: null,
      synergyBonus: 0,
      synergyWith: [],
      fourStarGapBonus: 0,
      totalScore: 0,
      recommendation: 'SKIP',
    };
  }

  // ── 2. Team Enabler Bonus ─────────────────────────────────────────────────
  const { bonusScore: teamEnablerBonus, templateName: teamEnablerTemplateName } =
    findBestTeamEnabledBy(fiveStarKey, templates, roster, currentBreakdowns, scoreAllTemplatesFn);

  // ── 3. Synergy Bonus ──────────────────────────────────────────────────────
  // Top N invested characters by Character Intelligence rank (rank 1 = best)
  const topInvestedKeys = characterRecs.slice(0, TOP_N_FOR_SYNERGY).map((r) => r.characterKey);

  const { bonus: synergyBonus, synergyWith } = calculateSynergyBonus(
    fiveStarKey,
    templates,
    topInvestedKeys,
  );

  // ── 4. 4-Star Gap Bonus ───────────────────────────────────────────────────
  const fourStarGapBonus = calculateFourStarGapBonus(fourStarKeys, ownedKeys);

  // ── 5. Total Score ────────────────────────────────────────────────────────
  const rawTotal = teamEnablerBonus + synergyBonus + fourStarGapBonus;
  const totalScore = Math.max(0, Math.min(100, rawTotal));
  const recommendation = scoreToLabel(totalScore);

  return {
    bannerId: banner.bannerId,
    bannerName: banner.name,
    fiveStarKey,
    fourStarKeys,
    alreadyOwned: false,
    ownershipPenalty: 0,
    teamEnablerBonus,
    teamEnablerTemplateName,
    synergyBonus,
    synergyWith,
    fourStarGapBonus,
    totalScore,
    recommendation,
  };
}
