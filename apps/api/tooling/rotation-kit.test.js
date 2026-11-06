import { describe, expect, it } from 'vitest';

import { engineCharacter } from '../../web/src/lib/team-damage/calculator.ts';
import {
  getCharacterRotationKit,
  reviewedRotationKits,
} from '../../web/src/lib/team-damage/rotation-kit.ts';

describe('character rotation kits (M3.1)', () => {
  it('provides reviewed sequencing and burst prerequisites for core supports and drivers', () => {
    // Bennett: Burst -> Skill buffer
    const bennett = getCharacterRotationKit('10000032:3201');
    expect(bennett).toBeDefined();
    expect(bennett.role).toBe('buffer');
    expect(bennett.burstCost).toBe(60);
    expect(bennett.setupSteps.map((s) => s.action)).toEqual(['burst', 'skill']);

    // Xiangling: Burst -> Skill off-field snapshot
    const xiangling = getCharacterRotationKit('10000023:2301');
    expect(xiangling.role).toBe('sub_dps');
    expect(xiangling.burstCost).toBe(80);
    expect(xiangling.setupSteps.map((s) => s.action)).toEqual(['burst', 'skill']);

    // Xingqiu: Burst -> Skill -> Normal Attack (proc rainswords)
    const xingqiu = getCharacterRotationKit('10000025:2501');
    expect(xingqiu.role).toBe('sub_dps');
    expect(xingqiu.burstCost).toBe(80);
    expect(xingqiu.setupSteps.map((s) => s.action)).toEqual(['burst', 'skill', 'attack']);

    // Furina: Skill (Salon Solitaire) -> Burst (Let the People Rejoice)
    const furina = getCharacterRotationKit('10000089:8901');
    expect(furina.role).toBe('buffer');
    expect(furina.burstCost).toBe(60);
    expect(furina.setupSteps.map((s) => s.action)).toEqual(['skill', 'burst']);

    // Kazuha: Skill -> High Plunge -> Burst
    const kazuha = getCharacterRotationKit('10000047:4701');
    expect(kazuha.role).toBe('debuffer');
    expect(kazuha.burstCost).toBe(60);
    expect(kazuha.setupSteps.map((s) => s.action)).toEqual(['skill', 'high_plunge', 'burst']);

    // Nahida: Skill -> Burst
    const nahida = getCharacterRotationKit('10000073:7301');
    expect(nahida.role).toBe('aura_setup');
    expect(nahida.burstCost).toBe(50);
    expect(nahida.setupSteps.map((s) => s.action)).toEqual(['skill', 'burst']);

    // Raiden Shogun: Setup E, then Burst + Normal Attack string
    const raiden = getCharacterRotationKit('10000052:5201');
    expect(raiden.role).toBe('battery');
    expect(raiden.burstCost).toBe(90);
    expect(raiden.setupSteps.map((s) => s.action)).toEqual(['skill']);
    expect(raiden.fieldSteps.map((s) => s.action)).toEqual(['burst', 'attack']);
  });

  it('guarantees that every action in every reviewed rotation kit is supported by the pinned engine metadata', () => {
    for (const [characterKey, kit] of Object.entries(reviewedRotationKits)) {
      const profile = engineCharacter(characterKey);
      expect(
        profile,
        `Character ${characterKey} must exist in pinned engine metadata`,
      ).not.toBeNull();

      const validActions = new Set(profile.actions.map((a) => a.action));
      for (const step of [...kit.setupSteps, ...kit.fieldSteps]) {
        expect(
          validActions.has(step.action),
          `Action "${step.action}" for ${characterKey} must be a valid engine action in ${Array.from(validActions).join(', ')}`,
        ).toBe(true);
      }
    }
  });

  it('synthesizes a safe fallback rotation kit for unreviewed characters without throwing', () => {
    const fallback = getCharacterRotationKit('99999999:9901', 'Hydro', 60);
    expect(fallback).toBeDefined();
    expect(fallback.characterKey).toBe('99999999:9901');
    expect(fallback.setupSteps.length).toBeGreaterThan(0);
    expect(fallback.setupSteps[0].action).toBe('skill');
    expect(fallback.fieldSteps.some((s) => s.action === 'attack')).toBe(true);
  });
});
