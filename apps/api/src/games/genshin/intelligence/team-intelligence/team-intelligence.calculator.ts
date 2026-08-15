// -------------------------------------------------------
// Types — shared with the Explainer and Service
// -------------------------------------------------------

import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';

export type { CharacterInput };

export interface TemplateRole {
  roleId: string;
  label: string;
  element: string | null;
  candidates: string[];
  required: boolean;
  flex: boolean;
  weight: number;
}

export interface TeamTemplate {
  id: string;
  name: string;
  archetype: string;
  reaction: string;
  reactionElements: string[];
  description: string;
  roles: TemplateRole[];
}

export interface TemplateRoleResult {
  roleId: string;
  label: string;
  element: string | null;
  filledBy: string | null;        // characterKey, or null if no candidate in roster
  investmentScore: number;        // 0–100 (simplified, ascension + talents only)
  isRequired: boolean;
  flex: boolean;
  weight: number;
}

export interface TeamScoreBreakdown {
  templateId: string;
  score: number;                  // 0–100, clamped
  subScores: {
    roleCoverage: number;         // 0–50
    investmentLevel: number;      // 0–30
    resonanceBonus: number;       // 0–12
    reactionCompleteness: number; // 0–8
  };
  roles: TemplateRoleResult[];
  isBuildable: boolean;
}

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

/**
 * Simplified investment score for a single character.
 *
 * Intentionally excludes metaTier and weapon mismatch (those are
 * per-character priorities; the template itself defines the meta relevance
 * of the team). Uses only ascension phase and talent levels.
 *
 * Returns a value in [0, 100].
 */
function characterInvestmentScore(character: CharacterInput): number {
  // ── Base score from ascension phase ──────────────────────────────────────
  let base: number;
  if (character.ascension >= 6 && character.level >= 80) {
    base = 80;
  } else if (character.ascension >= 4) {
    base = 55;
  } else if (character.ascension >= 2) {
    base = 30;
  } else {
    base = 5;
  }

  // ── Talent bonus (average of all three talents) ───────────────────────
  const avgTalent = (character.talentNormal + character.talentSkill + character.talentBurst) / 3;
  let talentBonus = 0;
  if (avgTalent >= 6) {
    talentBonus = 10;
  } else if (avgTalent >= 4) {
    talentBonus = 5;
  }

  return Math.min(100, base + talentBonus);
}

/**
 * Greedy role assignment.
 *
 * Assigns each roster character to the highest-weight unfilled role it
 * qualifies for. A character can fill at most one role per team (deduplication).
 * Roles are processed in descending weight order to maximize the total score.
 */
function assignRoles(
  template: TeamTemplate,
  roster: CharacterInput[],
): TemplateRoleResult[] {
  // Build a map from characterKey → CharacterInput for O(1) lookups.
  const rosterMap = new Map<string, CharacterInput>(
    roster.map((c) => [c.characterKey, c]),
  );

  // Sort roles by weight descending so the most important slots are filled first.
  const sortedRoles = [...template.roles].sort((a, b) => b.weight - a.weight);

  const usedCharacters = new Set<string>();
  const results: TemplateRoleResult[] = [];

  for (const role of sortedRoles) {
    // Find the best (highest investment) unused candidate for this role.
    let bestKey: string | null = null;
    let bestScore = -1;

    for (const candidateKey of role.candidates) {
      if (usedCharacters.has(candidateKey)) continue;
      const char = rosterMap.get(candidateKey);
      if (!char) continue;
      const score = characterInvestmentScore(char);
      if (score > bestScore) {
        bestScore = score;
        bestKey = candidateKey;
      }
    }

    if (bestKey !== null) {
      usedCharacters.add(bestKey);
    }

    results.push({
      roleId: role.roleId,
      label: role.label,
      element: role.element,
      filledBy: bestKey,
      investmentScore: bestKey !== null ? bestScore : 0,
      isRequired: role.required,
      flex: role.flex,
      weight: role.weight,
    });
  }

  // Restore original role order (by appearance in the template) for display.
  const originalOrder = template.roles.map((r) => r.roleId);
  results.sort((a, b) => originalOrder.indexOf(a.roleId) - originalOrder.indexOf(b.roleId));

  return results;
}

// -------------------------------------------------------
// Resonance detection
// -------------------------------------------------------

const HIGH_VALUE_RESONANCE_ELEMENTS = new Set(['Pyro', 'Hydro', 'Cryo']);

function calculateResonanceBonus(roles: TemplateRoleResult[]): number {
  // Count elements among filled roles only.
  const elementCounts = new Map<string, number>();
  let filledCount = 0;

  for (const role of roles) {
    if (role.filledBy === null || role.element === null) continue;
    filledCount++;
    elementCounts.set(role.element, (elementCounts.get(role.element) ?? 0) + 1);
  }

  // Mono: all 4 filled slots share the same element.
  if (filledCount >= 4) {
    for (const count of elementCounts.values()) {
      if (count >= 4) return 12;
    }
  }

  // Resonance (2+ of same element).
  for (const [element, count] of elementCounts.entries()) {
    if (count >= 2) {
      return HIGH_VALUE_RESONANCE_ELEMENTS.has(element) ? 12 : 8;
    }
  }

  return 0;
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure scoring function — the "Calculator" layer for the Team Intelligence Engine.
 *
 * Accepts a single TeamTemplate and the user's full roster. Returns a
 * deterministic TeamScoreBreakdown containing all numeric sub-scores,
 * the final clamped score, and the role assignment results.
 *
 * This function must NEVER contain any string explanations or UI-facing text.
 */
export function calculateTeamScore(
  template: TeamTemplate,
  roster: CharacterInput[],
): TeamScoreBreakdown {
  // ── Role assignment ───────────────────────────────────────────────────────
  const roles = assignRoles(template, roster);

  // ── Buildability gate ─────────────────────────────────────────────────────
  const isBuildable = roles
    .filter((r) => r.isRequired)
    .every((r) => r.filledBy !== null);

  // ── Sub-score 1: Role Coverage (max 50) ───────────────────────────────────
  const totalWeight = template.roles.reduce((sum, r) => sum + r.weight, 0);
  const filledWeight = roles
    .filter((r) => r.filledBy !== null)
    .reduce((sum, r) => sum + r.weight, 0);

  const roleCoverage = totalWeight > 0
    ? Math.round((filledWeight / totalWeight) * 50)
    : 0;

  // ── Sub-score 2: Investment Level (max 30) ────────────────────────────────
  const filledRoles = roles.filter((r) => r.filledBy !== null);
  const avgInvestment =
    filledRoles.length > 0
      ? filledRoles.reduce((sum, r) => sum + r.investmentScore, 0) / filledRoles.length
      : 0;

  const investmentLevel = Math.round((avgInvestment / 100) * 30);

  // ── Sub-score 3: Resonance Bonus (max 12) ────────────────────────────────
  const resonanceBonus = calculateResonanceBonus(roles);

  // ── Sub-score 4: Reaction Completeness (max 8) ────────────────────────────
  const filledElements = new Set(
    roles
      .filter((r) => r.filledBy !== null && r.element !== null)
      .map((r) => r.element as string),
  );

  const reactionElements = template.reactionElements;
  const coveredCount = reactionElements.filter((el) => filledElements.has(el)).length;
  let reactionCompleteness: number;
  if (reactionElements.length === 0) {
    reactionCompleteness = 0;
  } else if (coveredCount >= reactionElements.length) {
    reactionCompleteness = 8;
  } else if (coveredCount > 0) {
    reactionCompleteness = 4;
  } else {
    reactionCompleteness = 0;
  }

  // ── Final Score ───────────────────────────────────────────────────────────
  const rawScore = roleCoverage + investmentLevel + resonanceBonus + reactionCompleteness;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    templateId: template.id,
    score,
    subScores: {
      roleCoverage,
      investmentLevel,
      resonanceBonus,
      reactionCompleteness,
    },
    roles,
    isBuildable,
  };
}

/**
 * Scores all provided templates against the roster and returns the sorted
 * breakdown for every template (buildable and non-buildable alike).
 *
 * The service layer is responsible for filtering to only buildable templates.
 */
export function scoreAllTemplates(
  templates: TeamTemplate[],
  roster: CharacterInput[],
): TeamScoreBreakdown[] {
  return templates
    .map((template) => calculateTeamScore(template, roster))
    .sort((a, b) => b.score - a.score);
}
