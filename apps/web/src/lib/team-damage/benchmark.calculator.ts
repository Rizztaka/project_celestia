import type { SavedUidTeam } from '../build-analysis/teams-storage';
import type { DamageSettings, RotationStep } from './calculator';

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
  const step = (characterKey: string, action = 'skill', repeat = 1): RotationStep => ({
    characterKey,
    action,
    repeat,
    params: '',
    waitFrames: 0,
  });
  return [
    ...team.members
      .filter((member) => member.characterKey !== driver)
      .map((member) => step(member.characterKey)),
    step(driver),
    step(driver, 'attack', 6),
  ];
}
