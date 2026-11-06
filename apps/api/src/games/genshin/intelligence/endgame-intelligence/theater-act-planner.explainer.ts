import type { TheaterActPlanCalculationResult } from './theater-act-planner.calculator.js';

/**
 * Pure Explainer for Imaginarium Theater Dynamic Act & Vigor Planning (ADR-0011).
 *
 * Formats tactical guidance, boss reservations, and forward act scheduling
 * without performing any numeric calculations or mutations.
 */
export function explainTheaterActPlan(result: TheaterActPlanCalculationResult): string[] {
  const points: string[] = [];

  // 1. Season & Status Header
  if (!result.isCurrentSeason) {
    points.push(
      `[ARCHIVED / HISTORICAL SEASON] Note: Season ${result.seasonId} is not active. ${result.expirationNote ?? 'Evaluating historical draft configuration.'}`,
    );
  }
  points.push(
    `Imaginarium Theater Act Planner (Season: ${result.seasonId}, Difficulty: ${result.difficulty}) — Schedule from Act ${result.currentAct} to ${result.totalActs}:`,
  );
  points.push(
    `Cast Status: ${result.metadata.activeCastCount} of ${result.metadata.totalCastSize} characters currently have remaining vigor.`,
  );

  if (result.ineligibleCastExcluded && result.ineligibleCastExcluded.length > 0) {
    points.push(
      `Season Ineligible Cast Excluded (${result.ineligibleCastExcluded.length}): ${result.ineligibleCastExcluded.map((e) => `${e.characterKey}`).join(', ')}.`,
    );
  }

  if (result.vigorExhaustionRisk) {
    points.push(
      'CRITICAL VIGOR WARNING: One or more projected acts lack sufficient eligible characters with remaining vigor. Re-evaluate earlier acts to conserve units.',
    );
  } else {
    points.push(
      'Vigor Reserves: Healthy. Full 4-man teams are projected for all remaining acts through the climax without early exhaustion.',
    );
  }

  // 2. Next Recommended Act
  if (result.projectedSchedule.length > 0) {
    const nextAct = result.projectedSchedule[0];
    const teamRoles = nextAct.recommendedTeam
      .map((k) => `${k} (${nextAct.roleTags[k] ?? 'sub_dps'})`)
      .join(', ');
    points.push(
      `Next Action (Act ${nextAct.act} ${nextAct.isBoss ? `[BOSS: ${nextAct.bossName}]` : '[CLEARING]'}): Deploy [${teamRoles}].`,
    );
    points.push(`  • Intent: ${nextAct.rationale}`);
  }

  // 3. Boss Reservation Breakdown
  const reservedEntries = Object.entries(result.reservedForBosses);
  if (reservedEntries.length > 0) {
    // Group by boss act
    const byAct = new Map<number, string[]>();
    for (const [charKey, actNum] of reservedEntries) {
      if (!byAct.has(actNum)) byAct.set(actNum, []);
      byAct.get(actNum)!.push(charKey);
    }

    points.push('Boss Reserve Locks (Reserved to prevent premature vigor depletion):');
    for (const [actNum, chars] of byAct.entries()) {
      points.push(`  • Act ${actNum} Boss: Reserved [${chars.join(', ')}].`);
    }
  }

  // 4. Projected Schedule Summary
  points.push('Projected Act-by-Act Flow:');
  for (const item of result.projectedSchedule) {
    const stageType = item.isBoss ? `BOSS (${item.bossName})` : 'CLEARING';
    points.push(`  • Act ${item.act} [${stageType}]: [${item.recommendedTeam.join(', ')}]`);
  }

  return points;
}
