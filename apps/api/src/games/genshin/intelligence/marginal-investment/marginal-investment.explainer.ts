import type { UpgradeCandidate } from '@celestia/api-contracts';

import type { MarginalInvestmentCalculatorResult } from './marginal-investment.calculator.js';

// ---------------------------------------------------------------------------
// Pure Explainer: Generates human-facing explanations from calculator output
// Adheres strictly to ADR-0011: performs zero math, zero state mutations.
// ---------------------------------------------------------------------------

function formatCategory(category: UpgradeCandidate['category']): string {
  switch (category) {
    case 'talent':
      return 'Talent Level';
    case 'weapon_level':
      return 'Weapon Level';
    case 'weapon_ascension':
      return 'Weapon Ascension';
    case 'character_ascension':
      return 'Character Ascension';
    case 'character_level':
      return 'Character Level';
    case 'artifact_main_stat':
      return 'Artifact Main Stat';
    case 'artifact_level':
      return 'Artifact Level';
    default:
      return category;
  }
}

export function explainMarginalInvestment(
  calcResult: MarginalInvestmentCalculatorResult,
): string[] {
  const explanations: string[] = [];
  const action = calcResult.recommendedNextAction;

  if (calcResult.metadata.missingSandsForEr) {
    explanations.push(
      'Energy Recharge Deficit: Current build requires additional Energy Recharge to meet rotation thresholds, but the Sands slot is missing or unrecorded. Acquiring an Energy Recharge Sands is an unavailable acquisition requirement.',
    );
  }

  if (
    calcResult.metadata.unsupportedProgressionTargets &&
    calcResult.metadata.unsupportedProgressionTargets.length > 0
  ) {
    for (const target of calcResult.metadata.unsupportedProgressionTargets) {
      explanations.push(
        `Progression costs for "${target}" are unavailable because it is not in the verified progression catalog.`,
      );
    }
  }

  if (!action) {
    if (calcResult.currentReadiness.status === 'insufficient_data') {
      explanations.push(
        'Build readiness has insufficient data. Resolve unrecorded priority talents, weapons, or role assumptions before evaluating marginal upgrades.',
      );
    } else if (calcResult.currentReadiness.status === 'ready_for_target') {
      explanations.push(
        'All evaluated investment dimensions meet or exceed the benchmark requirements. No immediate upgrades required.',
      );
    } else {
      explanations.push(
        'No viable upgrade candidates could be generated from available verified catalog data.',
      );
    }
    return explanations;
  }

  // 1. Primary Recommendation Rationale
  const targetLabel = action.target.toUpperCase();
  const categoryLabel = formatCategory(action.category);

  if (
    action.category === 'artifact_main_stat' &&
    action.target === 'sands' &&
    calcResult.metadata.hasEnergyDeficit
  ) {
    explanations.push(
      `Top Recommendation: Equip or level Energy Recharge Sands (+${action.expectedScoreDelta} pts, Efficiency: ${action.efficiencyScore}).`,
    );
    explanations.push(
      'Energy Recharge Deficit Resolution: Current build fails the rotation energy threshold. Resolving this critical gap removes the rotation penalty and yields the highest immediate marginal return.',
    );
  } else if (action.closesGap) {
    explanations.push(
      `Top Recommendation: Upgrade ${targetLabel} (${categoryLabel}) from Lv ${action.currentLevel} to Lv ${action.targetLevel} (+${action.expectedScoreDelta} pts, Efficiency: ${action.efficiencyScore}).`,
    );
    explanations.push(
      `Critical Gap Closed: This upgrade satisfies the minimum role benchmark for ${action.target}, transitioning the dimension to ready status and maximizing team performance.`,
    );
  } else {
    explanations.push(
      `Top Recommendation: Upgrade ${targetLabel} (${categoryLabel}) from Lv ${action.currentLevel} to Lv ${action.targetLevel} (+${action.expectedScoreDelta} pts, Efficiency: ${action.efficiencyScore}).`,
    );
    explanations.push(
      `Marginal Optimization: Expected composite readiness increases by +${action.expectedScoreDelta} points for a normalized resource cost ratio of ${action.efficiencyScore}.`,
    );
  }

  // 2. Resource Requirements Details
  if (action.costs.length > 0) {
    const costDetails = action.costs.map((c) => `${c.count.toLocaleString()} ${c.name}`).join(', ');
    explanations.push(`Materials Required: ${costDetails}.`);
  }

  // 3. Diminishing Returns & Farming Trap Context
  if (calcResult.currentReadiness.status === 'ready_for_target') {
    explanations.push(
      'Diminishing Returns Note: Current build is already verified ready for target. Remaining upgrades provide minor marginal stat increases and should be treated as optional late-game optimizations.',
    );
  } else {
    const crownTrap = calcResult.rankedUpgrades.find(
      (u) => !u.closesGap && u.category === 'talent' && u.targetLevel === 10,
    );
    if (crownTrap) {
      explanations.push(
        `Farming Trap Warning: Crowning non-essential talents (such as ${crownTrap.target} Lv 10) costs 700,000 Mora and a scarce Crown of Insight for an efficiency of ${crownTrap.efficiencyScore}. Prioritize key skill thresholds first.`,
      );
    }
  }

  return explanations;
}
