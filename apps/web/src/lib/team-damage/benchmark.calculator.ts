import type { SavedUidTeam } from '../build-analysis/teams-storage';
import type { DamageSettings, RotationStep } from './calculator';
import { synthesizeTeamRotation } from './rotation-synthesizer.calculator';

export const TEAM_BENCHMARK = Object.freeze({
  enemyLevel: 100,
  resistance: 0,
  duration: 60,
  samples: 20,
});

export function benchmarkSettings(steps: RotationStep[]): DamageSettings {
  return { ...TEAM_BENCHMARK, steps: steps.map((step) => ({ ...step })) };
}

export function defaultRotation(team: SavedUidTeam, driver: string): RotationStep[] {
  if (!team.members.some((member) => member.characterKey === driver)) return [];
  return synthesizeTeamRotation({
    teamMembers: team.members,
    driverKey: driver,
  });
}
