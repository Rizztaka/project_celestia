import { engineCharacter, type RotationStep } from './calculator';
import type { DamageResult } from './service';

export interface RotationExecution {
  key: string;
  state:
    | 'unknown'
    | 'energy_blocked'
    | 'burst_not_tested'
    | 'burst_not_executed'
    | 'no_energy_block_observed';
  burstCount: number | null;
  energyChecks: number | null;
  cooldownChecks: number | null;
  otherChecks: number | null;
}

const cooldownReasons = new Set(['swap_cd', 'skill_cd', 'burst_cd', 'dash_cd']);

export function rotationExecution(
  result: DamageResult,
  steps: RotationStep[],
): RotationExecution[] {
  return result.members.map((member) => {
    if (!result.diagnosticsAvailable || !member.blockedAttempts || !member.actionCounts)
      return {
        key: member.key,
        state: 'unknown',
        burstCount: null,
        energyChecks: null,
        cooldownChecks: null,
        otherChecks: null,
      };
    const burstCount = member.actionCounts.burst ?? 0;
    const energyChecks = member.blockedAttempts.insufficient_energy ?? 0;
    const cooldownChecks = Object.entries(member.blockedAttempts).reduce(
      (sum, [key, count]) => sum + (cooldownReasons.has(key) ? count : 0),
      0,
    );
    const otherChecks = Object.entries(member.blockedAttempts).reduce(
      (sum, [key, count]) =>
        sum + (!cooldownReasons.has(key) && key !== 'insufficient_energy' ? count : 0),
      0,
    );
    const burstRequested = steps.some(
      (step) => step.action === 'burst' && engineCharacter(step.characterKey)?.key === member.key,
    );
    return {
      key: member.key,
      burstCount,
      energyChecks,
      cooldownChecks,
      otherChecks,
      state:
        energyChecks > 0
          ? 'energy_blocked'
          : !burstRequested
            ? 'burst_not_tested'
            : burstCount === 0
              ? 'burst_not_executed'
              : 'no_energy_block_observed',
    };
  });
}
