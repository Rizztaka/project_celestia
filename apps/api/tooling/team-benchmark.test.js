import { afterEach, expect, it, vi } from 'vitest';

import {
  benchmarkSettings,
  defaultRotation,
  TEAM_BENCHMARK,
} from '../../web/src/lib/team-damage/benchmark.calculator.ts';
import {
  readDamageSettings,
  readRotationChoice,
  saveRotationChoice,
} from '../../web/src/lib/team-damage/preferences.ts';

const uid = '800000001';
const team = {
  version: 1,
  uid,
  id: 'benchmark',
  name: 'Test',
  members: ['a', 'b', 'c', 'd'].map((characterKey) => ({ characterKey, roleId: 'unspecified' })),
};
const custom = [
  { characterKey: 'a', action: 'burst', repeat: 1, waitFrames: 90, params: 'hold=1' },
];
function storage() {
  const rows = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => rows.get(key) ?? null,
    setItem: (key, value) => rows.set(key, value),
  });
  return rows;
}
afterEach(() => vi.unstubAllGlobals());

it('uses one fixed benchmark and a deterministic default loop for the explicitly chosen attacker', () => {
  const before = structuredClone(team);
  expect(Object.isFrozen(TEAM_BENCHMARK)).toBe(true);
  const steps = defaultRotation(team, 'c');
  expect(steps.map((step) => step.characterKey)).toEqual(['a', 'b', 'd', 'c', 'c']);
  expect(steps.at(-1)).toMatchObject({ action: 'attack', repeat: 6 });
  expect(defaultRotation(team, 'unknown')).toEqual([]);
  const settings = benchmarkSettings(steps);
  expect(settings).toMatchObject({ enemyLevel: 100, resistance: 0, duration: 60, samples: 20 });
  settings.steps[0].repeat = 9;
  expect(steps[0].repeat).toBe(1);
  expect(team).toEqual(before);
});
it('remembers default/custom choice while preserving the custom draft and UID/team boundaries', () => {
  storage();
  saveRotationChoice(uid, team.id, 'default', 'c', custom);
  expect(readRotationChoice(uid, team.id)).toEqual({
    mode: 'default',
    driver: 'c',
    customSteps: custom,
  });
  expect(readDamageSettings(uid, team.id).steps).toEqual(custom);
  expect(readRotationChoice('800000002', team.id)).toBeNull();
  expect(readRotationChoice(uid, 'other')).toBeNull();
  saveRotationChoice(uid, team.id, 'custom', 'c', custom);
  expect(readRotationChoice(uid, team.id).mode).toBe('custom');
});
it('retains legacy custom steps but never uses their old enemy or test overrides', () => {
  const rows = storage();
  const key = `celestia.team-rotation.v1:${uid}:${team.id}`;
  const raw = JSON.stringify({
    version: 1,
    uid,
    teamId: team.id,
    settings: { duration: 180, enemyLevel: 50, resistance: 80, samples: 1, steps: custom },
  });
  rows.set(key, raw);
  const choice = readRotationChoice(uid, team.id);
  expect(choice).toEqual({ mode: 'custom', driver: '', customSteps: custom });
  expect(benchmarkSettings(choice.customSteps)).toEqual({ ...TEAM_BENCHMARK, steps: custom });
  expect(rows.get(key)).toBe(raw);
});
it('rejects corrupt choices and prevents invalid saves from overwriting the last valid draft', () => {
  const rows = storage();
  saveRotationChoice(uid, team.id, 'custom', 'c', custom);
  const key = `celestia.team-rotation.v1:${uid}:${team.id}`;
  const before = rows.get(key);
  expect(() => saveRotationChoice(uid, team.id, 'automatic', 'c', custom)).toThrow();
  expect(rows.get(key)).toBe(before);
  rows.set(key, JSON.stringify({ ...JSON.parse(before), rotationMode: 'automatic' }));
  expect(readRotationChoice(uid, team.id)).toBeNull();
  vi.stubGlobal('localStorage', {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('blocked');
    },
  });
  expect(readRotationChoice(uid, team.id)).toBeNull();
  expect(() => saveRotationChoice(uid, team.id, 'default', 'c', custom)).toThrow('blocked');
});
