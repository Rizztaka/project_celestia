import type { TeamComfortScore } from './team-comfort.calculator';

/**
 * Generates human-readable explanations explaining the team's comfort characteristics.
 * Adheres strictly to ADR-0011 (Separation of Calculator and Explainer).
 */
export function explainTeamComfort(comfort: TeamComfortScore): string[] {
  const points: string[] = [];

  if (comfort.metrics.hasShield) {
    points.push(
      'Full shield coverage provides persistent damage absorption and interruption resistance.',
    );
  }

  if (comfort.metrics.hasSustainedHealing) {
    points.push(
      'Sustained healing keeps the team stable across aggressive combat encounters.',
    );
  }

  if (comfort.metrics.interruptionResistanceTier === 'complete') {
    points.push(
      'Complete interruption resistance prevents attack animation cancels from enemy strikes.',
    );
  } else if (comfort.metrics.interruptionResistanceTier === 'partial') {
    points.push(
      'Partial interruption resistance reduces stagger from light enemy attacks.',
    );
  }

  if (comfort.metrics.executionFriction === 'strict') {
    points.push(
      'High-execution glass-cannon setup with zero sustain requires active dodging and strict stamina management.',
    );
  } else if (comfort.metrics.executionFriction === 'low') {
    points.push(
      'Execution-friendly rotation with lenient swap windows and low vulnerability to errors.',
    );
  }

  return points;
}
