import type { AbyssJointCalculationResult } from './abyss-joint.calculator.js';

/**
 * Pure Explainer for Spiral Abyss Joint Recommendations (ADR-0011).
 *
 * Accepts the deterministic calculation result and formats human-readable
 * rationales, counter breakdowns, and greedy comparison analytics.
 * Strictly free of any numeric calculation or data mutation.
 */
export function explainAbyssJoint(result: AbyssJointCalculationResult): string[] {
  const points: string[] = [];

  // 1. Overall Header
  if (!result.isCurrentCycle || result.isExpired) {
    points.push(
      `[ARCHIVED / HISTORICAL CYCLE] Recommendations are based on historical cycle benchmarks (v${result.cycleId}). Live chamber geometry and buff changes may alter performance.`,
    );
    if (result.expirationNote) {
      points.push(`Cycle note: ${result.expirationNote}`);
    }
  }
  points.push(
    `Spiral Abyss Floor ${result.floor} Chamber ${result.chamber} (Cycle: ${result.cycleId}) — Joint Disjoint Recommendation:`,
  );
  points.push(
    `Joint clearance score: ${result.jointScore.toLocaleString()} (Harmonic Mean). Both halves satisfy character and gear exclusivity ($T_1 \\cap T_2 = \\emptyset$).`,
  );

  // 2. First Half Summary
  const h1 = result.firstHalf;
  points.push(
    `First Half: "${h1.team.name}" [${h1.team.memberKeys.join(', ')}] — Evaluated Score: ${h1.score.toLocaleString()} (Base DPS: ${h1.team.baseDps.toLocaleString()}).`,
  );
  if (h1.shieldCounters.length > 0) {
    points.push(`  • Shield Counters: ${h1.shieldCounters.join('; ')}.`);
  }
  if (h1.geometryNotes.length > 0) {
    points.push(`  • Wave Geometry: ${h1.geometryNotes.join('; ')}.`);
  }
  if (h1.resistanceNotes.length > 0) {
    points.push(`  • Resistance Profile: ${h1.resistanceNotes.join('; ')}.`);
  }

  // 3. Second Half Summary
  const h2 = result.secondHalf;
  points.push(
    `Second Half: "${h2.team.name}" [${h2.team.memberKeys.join(', ')}] — Evaluated Score: ${h2.score.toLocaleString()} (Base DPS: ${h2.team.baseDps.toLocaleString()}).`,
  );
  if (h2.shieldCounters.length > 0) {
    points.push(`  • Shield Counters: ${h2.shieldCounters.join('; ')}.`);
  }
  if (h2.geometryNotes.length > 0) {
    points.push(`  • Wave Geometry: ${h2.geometryNotes.join('; ')}.`);
  }
  if (h2.resistanceNotes.length > 0) {
    points.push(`  • Resistance Profile: ${h2.resistanceNotes.join('; ')}.`);
  }

  // 4. Greedy Comparison
  if (result.greedyComparison) {
    const gc = result.greedyComparison;
    if (gc.scoreDeltaPercent > 0) {
      points.push(
        `Optimization Rationale: Joint optimization achieved +${gc.scoreDeltaPercent}% higher harmonic clearance balance over greedy selection. Greedy allocation for Half 1 would have starved Half 2 of essential support synergy (Greedy Half 2: ${gc.greedySecondHalfScore.toLocaleString()} vs Joint Half 2: ${h2.score.toLocaleString()}).`,
      );
    } else {
      points.push(
        'Optimization Rationale: Greedy selection for Half 1 was already globally optimal, leaving a fully competitive disjoint lineup for Half 2.',
      );
    }
  }

  // 5. Verification Notice
  points.push(
    `Verified across ${result.metadata.disjointPairsEvaluated} disjoint permutation(s) from a candidate pool of ${result.metadata.totalCandidates} teams.`,
  );

  return points;
}
