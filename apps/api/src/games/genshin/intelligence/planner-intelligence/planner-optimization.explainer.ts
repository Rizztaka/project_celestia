import type { OptimizationPlanAction, OptimizationPlanAlternative } from '@celestia/api-contracts';

import type {
  CalculatedOptimizationAction,
  CalculatedOptimizationAlternative,
  OptimizationPlannerCalculationResult,
} from './planner-optimization.calculator.js';

// ---------------------------------------------------------------------------
// Pure Explainer Functions (Strict ADR-0011: Zero Arithmetic, Strings Only)
// ---------------------------------------------------------------------------

export function explainOptimizedAction(action: CalculatedOptimizationAction): string[] {
  const explanations: string[] = [];

  if (action.isCondensed) {
    explanations.push(
      `Condensed Speedrun: Complete ${action.runs} Condensed Resin run(s) at ${action.domainName} for ${action.targetKey} (${action.resinCost} Resin, ~${action.estimatedMinutes}m).`,
    );
  } else if (action.actionType === 'overworld_gather') {
    explanations.push(
      `Zero-Resin Overworld Route: Gather local specialties and enemy drops for ${action.targetKey} (~${action.estimatedMinutes}m, 0 Resin) in preparation for upcoming domain rotations.`,
    );
  } else if (action.actionType === 'world_boss') {
    explanations.push(
      `World Boss Ascension: Defeat ${action.domainName} ${action.runs} time(s) for ${action.targetKey}'s ascension materials (${action.resinCost} Resin, ~${action.estimatedMinutes}m).`,
    );
  } else if (action.actionType === 'domain_weapon') {
    explanations.push(
      `Weapon Ascension Domain: Run ${action.domainName} ${action.runs} time(s) for ${action.targetKey} (${action.resourceName}, ${action.resinCost} Resin, ~${action.estimatedMinutes}m).`,
    );
  } else {
    const talentLabel = action.talentType
      ? ({
          normal: 'Normal Attack',
          skill: 'Elemental Skill',
          burst: 'Elemental Burst',
        }[action.talentType] ?? 'talent')
      : 'talent';
    explanations.push(
      `Talent Book Domain: Run ${action.domainName} ${action.runs} time(s) for ${action.targetKey}'s ${talentLabel} books (${action.resourceName}, ${action.resinCost} Resin, ~${action.estimatedMinutes}m).`,
    );
  }

  if (action.timeGated) {
    explanations.push(
      `Time-Gated Urgency (1.35x bonus): ${action.domainName} is open on today's weekday rotation and closed tomorrow.`,
    );
  } else if (action.actionType !== 'overworld_gather') {
    explanations.push(
      `Flexible Availability (1.0x baseline): Source is available without single-weekday lockouts.`,
    );
  }

  const deficitPct = Math.round(action.materialDeficitRatio * 100);
  explanations.push(
    `Material Deficit Weight: ${deficitPct}% of required materials remain unfulfilled after accounting for recorded inventory stock.`,
  );

  if (action.marginalScoreDelta > 0) {
    const gapText = action.closesReadinessGap
      ? ' (closes target encounter readiness gap, 1.5x impact boost)'
      : '';
    explanations.push(
      `Marginal Readiness ROI: Projected +${action.marginalScoreDelta} readiness score delta${gapText} (efficiency score: ${action.efficiencyScore}).`,
    );
  } else {
    explanations.push(
      `Multi-Objective Efficiency: Scored at ${action.efficiencyScore} efficiency points per Resin spent (Goal Priority ${action.priority}).`,
    );
  }

  return explanations;
}

export function toOptimizationPlanAction(
  action: CalculatedOptimizationAction,
): OptimizationPlanAction {
  return {
    actionId: action.actionId,
    goalId: action.goalId,
    actionType: action.actionType,
    targetKey: action.targetKey,
    domainName: action.domainName,
    runs: action.runs,
    resinCost: action.resinCost,
    estimatedMinutes: action.estimatedMinutes,
    efficiencyScore: action.efficiencyScore,
    timeGated: action.timeGated,
    materialDeficitRatio: action.materialDeficitRatio,
    marginalScoreDelta: action.marginalScoreDelta,
    closesReadinessGap: action.closesReadinessGap,
    resourceName: action.resourceName,
    explanations: explainOptimizedAction(action),
  };
}

export function explainOptimizationAlternative(
  alt: CalculatedOptimizationAlternative,
): OptimizationPlanAlternative {
  const actions = alt.actions.map(toOptimizationPlanAction);
  const primaryTarget = alt.actions[0]?.targetKey ?? 'active goals';
  const primaryDomain = alt.actions[0]?.domainName ?? 'target domain';

  switch (alt.kind) {
    case 'speedrun_condensed':
      return {
        kind: 'speedrun_condensed',
        title: 'Condensed Resin Speedrun',
        description: `Minimizes session duration (~${alt.totalEstimatedMinutes}m) by concentrating ${alt.totalResinCost} Resin into Condensed Resin runs at ${primaryDomain} for ${primaryTarget}.`,
        totalResinCost: alt.totalResinCost,
        totalEstimatedMinutes: alt.totalEstimatedMinutes,
        actions,
      };

    case 'overworld_prep':
      return {
        kind: 'overworld_prep',
        title: 'Zero-Resin Overworld Preparation',
        description: `Spends 0 Resin (~${alt.totalEstimatedMinutes}m) pre-farming overworld mob drops and specialties for ${primaryTarget} ahead of upcoming domain rotations.`,
        totalResinCost: alt.totalResinCost,
        totalEstimatedMinutes: alt.totalEstimatedMinutes,
        actions,
      };

    case 'secondary_goal':
      return {
        kind: 'secondary_goal',
        title: `Secondary Goal Focus (${primaryTarget})`,
        description: `Redirects ${alt.totalResinCost} Resin (~${alt.totalEstimatedMinutes}m) to ${primaryTarget} at ${primaryDomain} if you prefer to defer today's top-ranked goal.`,
        totalResinCost: alt.totalResinCost,
        totalEstimatedMinutes: alt.totalEstimatedMinutes,
        actions,
      };
  }
}

export function explainOptimizationSummary(result: OptimizationPlannerCalculationResult): string {
  if (result.rankedPlan.length === 0) {
    const allCovered =
      result.evaluatedCandidates.length > 0 &&
      result.evaluatedCandidates.every((c) => c.materialDeficitRatio === 0);
    if (allCovered) {
      return `All active upgrade goals are fully covered by your recorded material inventory (0 Resin required today; ${result.unallocatedResin} Resin preserved).`;
    }
    if (result.effectiveResinBudget < 20) {
      return `Available Resin budget (${result.effectiveResinBudget} Resin) is below the 20-Resin threshold for a domain claim; review zero-Resin overworld preparation alternatives.`;
    }
    return `No active goal domains are open on today's server weekday rotation; ${result.unallocatedResin} Resin remains unallocated for condensed storage or alternative routes.`;
  }

  const topAction = result.rankedPlan[0]!;
  return `Allocated ${result.allocatedResin} of ${result.effectiveResinBudget} Resin across ${result.rankedPlan.length} prioritized action(s) (~${result.totalEstimatedMinutes}m of ${result.timeBudgetMinutes}m session budget), led by ${topAction.targetKey} at ${topAction.domainName} (efficiency ${topAction.efficiencyScore}).`;
}
