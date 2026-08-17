// ADR-0011 compliant: pure string generation, no arithmetic.
import type { PullScoreBreakdown } from './pull-intelligence.calculator.js';

/**
 * Generates plain-language explanation bullets for a single banner's
 * Pull Value Score.
 *
 * @param breakdown - The fully calculated score breakdown from the calculator.
 * @returns string[] of bullets shown on the frontend.
 */
export function explainPullValue(breakdown: PullScoreBreakdown): string[] {
  const explanations: string[] = [];
  const name = formatName(breakdown.fiveStarKey);

  // ── 1. Already owned — short SKIP explanation ─────────────────────────────
  if (breakdown.alreadyOwned) {
    explanations.push(
      `You already have ${name} in your roster. Constellations are not yet tracked — this banner is rated as SKIP.`,
    );
    return explanations;
  }

  // ── 2. Team Enabler ───────────────────────────────────────────────────────
  if (breakdown.teamEnablerBonus >= 60) {
    explanations.push(
      `Pulling ${name} unlocks the S-tier "${breakdown.teamEnablerTemplateName}" team composition — the highest-value outcome possible.`,
    );
  } else if (breakdown.teamEnablerBonus >= 40) {
    explanations.push(
      `Pulling ${name} enables the A-tier "${breakdown.teamEnablerTemplateName}" team composition with your current roster.`,
    );
  } else {
    explanations.push(
      `${name} does not unlock a new high-tier team with your current roster. Their team synergy bonus is low.`,
    );
  }

  // ── 3. Synergy with invested characters ───────────────────────────────────
  if (breakdown.synergyWith.length > 0) {
    const names = breakdown.synergyWith.map(formatName).join(', ');
    explanations.push(
      `Strong synergy detected with your most-invested characters: ${names}. ${name} frequently appears alongside them in proven team templates.`,
    );
  } else {
    explanations.push(
      `${name} does not synergize strongly with your current top-priority characters.`,
    );
  }

  // ── 4. 4-star value ───────────────────────────────────────────────────────
  if (breakdown.fourStarGapBonus > 0) {
    const missingNames = breakdown.fourStarKeys.map(formatName).join(', ');
    explanations.push(
      `The banner's 4-stars (${missingNames}) include at least one you don't own yet — extra value from the featured 4-stars.`,
    );
  } else {
    const fourStarNames = breakdown.fourStarKeys.map(formatName).join(', ');
    explanations.push(
      `You already own all featured 4-stars (${fourStarNames}) — no additional roster gains from the rate-up.`,
    );
  }

  // ── 5. Overall verdict ────────────────────────────────────────────────────
  if (breakdown.recommendation === 'MUST_PULL') {
    explanations.push(
      `Overall verdict: MUST PULL — ${name} delivers high team value and strong synergy with your roster. Prioritise this banner.`,
    );
  } else if (breakdown.recommendation === 'GOOD_VALUE') {
    explanations.push(
      `Overall verdict: GOOD VALUE — ${name} offers meaningful improvements but is not urgently needed. Pull if you have surplus primos.`,
    );
  } else {
    explanations.push(
      `Overall verdict: SKIP — ${name} offers low incremental value for your current account state. Save your primos.`,
    );
  }

  return explanations;
}

// -------------------------------------------------------
// Internal helpers
// -------------------------------------------------------

function formatName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}
