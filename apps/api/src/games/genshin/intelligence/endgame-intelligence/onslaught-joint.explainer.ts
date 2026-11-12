import type { OnslaughtJointCalculationResult } from './onslaught-joint.calculator.js';

/**
 * Pure Explainer for Stygian Onslaught Joint Recommendations (ADR-0011).
 *
 * Formats human-readable stage breakdowns, mechanic counter rationales,
 * and joint harmonic clearance analytics.
 * Strictly free of any numeric calculations or mutations.
 */
export function explainOnslaughtJoint(result: OnslaughtJointCalculationResult): string[] {
  const points: string[] = [];

  // 1. Overall Header
  if (!result.isCurrentCycle || result.isExpired) {
    points.push(
      `[ARCHIVED / HISTORICAL CYCLE] Note: Cycle ${result.cycleId} is not the active cycle. ${result.expirationNote ?? 'Historical manual preset evaluated.'}`,
    );
  }
  points.push(
    `Stygian Onslaught 3-Boss Consecutive Allocation (Cycle: ${result.cycleId}) — Joint Recommendation:`,
  );
  points.push(
    `Joint clearance score: ${result.jointScore.toLocaleString()} (3-Way Harmonic Mean). All 3 teams satisfy strict 12-character and gear exclusivity ($T_1 \\cap T_2 \\cap T_3 = \\emptyset$).`,
  );
  points.push(
    `Overall Clearance Verdict: ${result.allStagesCleared ? 'ALL 3 STAGES CLEARED' : 'BOTTLENECK DETECTED (One or more stages unviable)'}.`,
  );

  if (result.hasMechanicGaps) {
    points.push(
      'MECHANIC GAP WARNING: Encounter contains unmodeled boss mechanics lacking verified simulation curves. Combat readiness contains gaps.',
    );
  }

  // 2. Stage-by-Stage Breakdown
  for (const stage of result.stages) {
    points.push(
      `Stage ${stage.stage}: "${stage.bossName}" vs "${stage.team.name}" [${stage.team.memberKeys.join(', ')}] — Evaluated Score: ${stage.stageScore.toLocaleString()} (Base DPS: ${stage.team.baseDps.toLocaleString()}):`,
    );
    if (stage.mechanicCounters.length > 0) {
      for (const counter of stage.mechanicCounters) {
        points.push(`  • ${counter}`);
      }
    }
    if (stage.gapNotes.length > 0) {
      for (const gap of stage.gapNotes) {
        points.push(`  • [MECHANIC GAP] ${gap}`);
      }
    }
  }

  // 3. Permutation & Disjointness Notice
  points.push(
    `Verified across ${result.metadata.permutationsEvaluated} permutation(s) (${result.metadata.tripletsEvaluated} disjoint triplet(s)) evaluated from a pool of ${result.metadata.totalCandidates} candidates.`,
  );

  return points;
}
