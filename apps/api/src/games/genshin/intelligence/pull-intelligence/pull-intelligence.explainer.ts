import type { PullRecommendation } from '@celestia/api-contracts';

// ADR-0011 compliant: pure string generation, no arithmetic.

export function formatCharacterName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * Generates plain-language, transparent explanation bullets for an
 * Account-Value Pull Recommendation.
 *
 * @param rec - The fully calculated PullRecommendation from the calculator.
 * @returns string[] of bullets shown in UI and API responses.
 */
export function explainPullValue(rec: PullRecommendation): string[] {
  const explanations: string[] = [];
  const name = formatCharacterName(rec.targetKey);
  const { breakdown, budgetForecast, mode, targetType } = rec;

  // ── 1. Target & Mode Context ──────────────────────────────────────────────
  if (targetType === 'weapon') {
    explanations.push(
      `Signature Weapon (${name}): Provides high base stats and targeted passives for optimal carry scaling.`,
    );
  } else if (mode === 'constellation') {
    const constLabel = `C${rec.targetConstellation ?? (rec.currentConstellation ?? 0) + 1}`;
    explanations.push(
      `Constellation Upgrade (${name} ${constLabel}): Upgrades existing owned character (currently C${rec.currentConstellation ?? 0}) with incremental multipliers and rotational advantages.`,
    );
  } else {
    if (breakdown.unlockedTeamsCount > 0) {
      explanations.push(
        `Roster Enabler: Unlocks ${breakdown.unlockedTeamsCount} new buildable team composition(s) across ${breakdown.unlockedArchetypes.join(', ')}.`,
      );
    } else {
      explanations.push(
        `Roster Addition: Expands horizontal coverage across ${breakdown.unlockedArchetypes.length} archetype(s).`,
      );
    }
  }

  // ── 2. Versatility vs Redundancy ──────────────────────────────────────────
  if (breakdown.supportFlexibility >= 75) {
    explanations.push(
      `High Archetype Flexibility: Slots effectively into ${breakdown.unlockedArchetypes.length || 3}+ proven team archetypes as a versatile support/enabler.`,
    );
  } else if (breakdown.supportFlexibility <= 25 && targetType === 'character') {
    explanations.push(
      `Specialized Role: Primarily limited to narrow or dedicated team compositions.`,
    );
  }

  if (breakdown.redundancyPenalty > 0) {
    const redundantList = breakdown.redundantWithOwned.map(formatCharacterName).join(', ');
    explanations.push(
      `Redundancy Caution: Your account already possesses built carry options in this role (${redundantList}). Value is discounted due to role overlap.`,
    );
  }

  // ── 3. Execution Comfort & Defensive Utility ──────────────────────────────
  if (breakdown.comfortImpact >= 70) {
    explanations.push(
      `High Execution Comfort: Delivers premier defensive stability (shielding/healing), significantly easing Abyss and boss rotation execution.`,
    );
  } else if (breakdown.comfortImpact >= 50) {
    explanations.push(
      `Moderate Execution Comfort: Enhances rotation flexibility and teamwide survivability.`,
    );
  }

  // ── 4. Player Favorites & Preferences ─────────────────────────────────────
  if (breakdown.favoriteSynergy >= 90) {
    explanations.push(
      `Top Preference Alignment: Directly aligns with or supercharges your saved favorite characters.`,
    );
  } else if (breakdown.favoriteSynergy >= 60) {
    explanations.push(
      `Synergistic with Favorites: Proven synergy detected with characters on your favorites list.`,
    );
  }

  // ── 5. Investment Load & Friction ─────────────────────────────────────────
  if (breakdown.investmentFriction === 0) {
    explanations.push(
      `Zero Leveling Friction: Character is already ascended and leveled; constellation takes effect immediately.`,
    );
  } else if (breakdown.investmentFriction <= 8) {
    explanations.push(
      `Low Investment Burden: Weapon domain ascension requires minimal resin (~3-5 days) to max out.`,
    );
  } else {
    explanations.push(
      `Investment Required: Requires estimated ~14-18 days of resin for character ascension, boss materials, and talent books to reach combat readiness.`,
    );
  }

  // ── 6. Wish Budget & Strategic Savings ────────────────────────────────────
  const probPercent = Math.round(budgetForecast.acquisitionProbability * 100);
  explanations.push(
    `Wish Budget Forecast: With ${budgetForecast.currentPullsAvailable} pulls available, acquisition probability is ~${probPercent}% (median needed: ~${budgetForecast.medianPullsNeeded} pulls). ${budgetForecast.savingsAdvice}`,
  );

  // ── 7. Overall Strategic Verdict ──────────────────────────────────────────
  switch (rec.strategicRecommendation) {
    case 'HIGH_ACCOUNT_VALUE':
      explanations.push(
        `Strategic Verdict: HIGH ACCOUNT VALUE — Delivers exceptional team-building returns and unblocks critical bottlenecks for your roster.`,
      );
      break;
    case 'MODERATE_UPGRADE':
      explanations.push(
        `Strategic Verdict: MODERATE UPGRADE — Meaningful addition or solid comfort upgrade, though your existing roster operates well without it.`,
      );
      break;
    case 'NICHE_OR_REDUNDANT':
      explanations.push(
        `Strategic Verdict: NICHE OR REDUNDANT — Competes directly with existing well-built characters. Recommend pulling only for aesthetic preference.`,
      );
      break;
    case 'SAVE_RECOMMENDED':
      explanations.push(
        `Strategic Verdict: SAVE RECOMMENDED — Low incremental value or insufficient wish reserves to justify risking 50/50. Saving for high-priority targets is advised.`,
      );
      break;
    case 'CONDITIONAL_DATA_GAP':
      explanations.push(
        `Strategic Verdict: CONDITIONAL (DATA GAP) — Account data from public showcase is partial. Final recommendation is conditional on unobserved roster.`,
      );
      break;
  }

  return explanations;
}
