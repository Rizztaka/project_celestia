import type { CompanionSummaryCalculationResult } from './companion-summary.calculator.js';

/**
 * Pure explainer: transforms the mathematical synthesis into honest, plain-English
 * narrative points for the companion dashboard.
 */
export function explainCompanionSummary(result: CompanionSummaryCalculationResult): string[] {
  const points: string[] = [];

  // 1. Primary Action Rationale [Comfort & Goals]
  points.push(
    `[Comfort & Goals] Today's Focus [${result.primaryAction.category}]: ${result.primaryAction.headline} — ${result.primaryAction.subtext}`,
  );

  // 2. Readiness Context [Game Rule]
  const { readyCount, totalAssessed, targetEncounter } = result.readyBuildsSummary;
  if (totalAssessed > 0) {
    points.push(
      `[Game Rule] Encounter Readiness: ${readyCount} of ${totalAssessed} evaluated characters meet ${targetEncounter.toUpperCase()} benchmark thresholds.`,
    );
  } else {
    points.push(
      '[Game Rule] Encounter Readiness: No characters assessed yet. Add characters to your roster to evaluate readiness.',
    );
  }

  // 3. Marginal Investments Context [Game Rule or Simulated]
  if (result.topMarginalInvestments.length > 0) {
    const todayAvailable = result.topMarginalInvestments.filter((u) => u.todayDomainAvailable);
    if (todayAvailable.length > 0) {
      const names = todayAvailable.map((u) => `${u.characterKey} (${u.actionDetail})`).join(', ');
      points.push(
        `[Game Rule] Active Drop Schedules: Materials for ${names} are available in today's rotating domains.`,
      );
    } else {
      const top = result.topMarginalInvestments[0];
      points.push(
        `[Simulated] Top Investment: Upgrading ${top.characterKey}'s ${top.actionDetail} provides the highest marginal score increase (+${top.efficiencyScore.toFixed(0)} pts).`,
      );
    }
  }

  // 4. Team Lineup Recommendation [Simulated]
  if (result.teamSuggestion) {
    points.push(
      `[Simulated] Recommended Lineup [${result.teamSuggestion.archetype}]: ${result.teamSuggestion.teamName} (${result.teamSuggestion.members.join(', ')}) — ${result.teamSuggestion.keyAdvantage}`,
    );
  }

  // 5. Endgame Synthesis [Comfort & Goals]
  const { abyssReady, abyssScore, theaterMaxActsEstimated } = result.endgameSnapshot;
  if (abyssReady) {
    points.push(
      `[Comfort & Goals] Endgame Alignment: Roster achieves disjoint Spiral Abyss Floor 12 clearance (harmonic score: ${abyssScore.toFixed(0)}/100).`,
    );
  } else {
    points.push(
      `[Comfort & Goals] Endgame Alignment: Spiral Abyss Floor 12 clearance bottlenecked (harmonic score: ${abyssScore.toFixed(0)}/100). Review joint allocations in Endgame Center.`,
    );
  }
  if (theaterMaxActsEstimated > 0) {
    points.push(
      `[Comfort & Goals] Imaginarium Theater: Estimated depth of ${theaterMaxActsEstimated} consecutive acts based on current elemental cast vigor.`,
    );
  }

  // 6. Pull Intelligence Context [Comfort & Goals]
  if (result.pullAdviceSnapshot) {
    const pull = result.pullAdviceSnapshot;
    points.push(
      `[Comfort & Goals] Wish Spending Advisory: ${pull.targetCharacterKey} on banner "${pull.targetBannerName}" evaluated as ${pull.recommendation}. ${pull.keyReason}`,
    );
  }

  // 7. Data Caveats [Game Rule]
  if (result.missingDataCaveats.length > 0) {
    for (const caveat of result.missingDataCaveats) {
      points.push(`[Game Rule] Data Gap Notice: ${caveat}`);
    }
  }

  return points;
}
