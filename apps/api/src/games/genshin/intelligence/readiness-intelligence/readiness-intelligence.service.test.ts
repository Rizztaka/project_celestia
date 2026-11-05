import {
  type CharacterReadinessRequestInput,
  characterReadinessRequestSchema,
  characterReadinessResponseSchema,
} from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { ReadinessIntelligenceService } from './readiness-intelligence.service.js';

describe('Readiness Intelligence Service', () => {
  const service = new ReadinessIntelligenceService();

  const fullyReadyBennett: CharacterReadinessRequestInput = {
    character: {
      characterKey: 'Bennett',
      level: 80,
      ascension: 5,
      constellation: 1,
      talents: { normal: 1, skill: 6, burst: 9 },
      weapon: {
        weaponKey: 'SkywardBlade',
        level: 90,
        refinement: 1,
      },
      artifacts: {
        flower: { slot: 'flower', setKey: 'NoblesseOblige', mainStatKey: 'hp' },
        plume: { slot: 'plume', setKey: 'NoblesseOblige', mainStatKey: 'atk' },
        sands: { slot: 'sands', setKey: 'NoblesseOblige', mainStatKey: 'energyRecharge' },
        goblet: { slot: 'goblet', setKey: 'NoblesseOblige', mainStatKey: 'hpPercent' },
        circlet: { slot: 'circlet', setKey: 'NoblesseOblige', mainStatKey: 'healingBonus' },
      },
      stats: {
        energyRecharge: 235,
        maxHp: 28000,
        baseAtk: 799,
      },
    },
    roleProfile: 'healing_support',
  };

  const energyDeficitBennett: CharacterReadinessRequestInput = {
    character: {
      characterKey: 'Bennett',
      level: 90,
      ascension: 6,
      constellation: 5,
      talents: { normal: 1, skill: 8, burst: 10 },
      weapon: {
        weaponKey: 'MistsplitterReforged',
        level: 90,
        refinement: 1,
      },
      artifacts: {
        flower: { slot: 'flower', setKey: 'NoblesseOblige', mainStatKey: 'hp' },
        plume: { slot: 'plume', setKey: 'NoblesseOblige', mainStatKey: 'atk' },
        sands: { slot: 'sands', setKey: 'NoblesseOblige', mainStatKey: 'hpPercent' },
        goblet: { slot: 'goblet', setKey: 'NoblesseOblige', mainStatKey: 'pyroDmg' },
        circlet: { slot: 'circlet', setKey: 'NoblesseOblige', mainStatKey: 'critRate' },
      },
      stats: {
        // High damage/healing stats, but ER is 130% vs 200% required (70% deficit)
        energyRecharge: 130,
        critRate: 65,
        critDmg: 160,
        maxHp: 29000,
      },
    },
    roleProfile: 'healing_support',
  };

  it('orchestrates calculation and explanation returning standard response structure', () => {
    const result = service.evaluateReadiness(fullyReadyBennett);

    expect(result.status).toBe('ready_for_target');
    expect(result.score).toBeGreaterThanOrEqual(90);
    expect(result.recommendation).toBeDefined();
    expect(result.recommendation.status).toBe('ready_for_target');
    expect(result.dimensions).toBeDefined();
    expect(Array.isArray(result.explanations)).toBe(true);
    expect(result.explanations.length).toBeGreaterThan(0);

    // Conforms strictly to contract schema
    const validated = characterReadinessResponseSchema.safeParse(result);
    expect(validated.success).toBe(true);

    // Explanations confirm positive readiness
    const text = result.explanations.join(' ');
    expect(text).toContain('meets readiness criteria');
    expect(text).toContain('meet recommended target levels');
    expect(text).toContain('matches recommended options');
  });

  it('generates clear explanatory warning when energy deficit defeats other stats', () => {
    const result = service.evaluateReadiness(energyDeficitBennett);

    expect(result.status).toBe('needs_investment');
    expect(result.score).toBeLessThanOrEqual(58);

    const energyExplanation = result.explanations.find((e) =>
      e.includes('Critical Rotation Energy deficit'),
    );
    expect(energyExplanation).toBeDefined();
    expect(energyExplanation).toContain('Inconsistent burst uptime defeats high offensive stats');

    // Conforms to contract schema
    const validated = characterReadinessResponseSchema.safeParse(result);
    expect(validated.success).toBe(true);
  });

  it('generates diagnostic explanation when critical data is unrecorded', () => {
    const unrecordedBuild: CharacterReadinessRequestInput = {
      character: {
        characterKey: 'Bennett',
        level: 80,
        ascension: 5,
        talents: { normal: null, skill: null, burst: null },
        weapon: null,
        artifacts: {
          flower: null,
          plume: null,
          sands: null,
          goblet: null,
          circlet: null,
        },
        stats: {},
      },
      roleProfile: 'healing_support',
    };

    const result = service.evaluateReadiness(unrecordedBuild);
    expect(result.status).toBe('insufficient_data');
    expect(result.missingData.length).toBeGreaterThanOrEqual(3);

    const text = result.explanations.join(' ');
    expect(text).toContain('Insufficient build data');
    expect(text).toContain('Energy Recharge stat is unrecorded');
    expect(text).toContain('Talent levels are unrecorded');
    expect(text).toContain('No equipped weapon recorded');
  });

  it('validates request schema rejecting invalid character builds', () => {
    // Missing characterKey
    const invalidRequest = {
      character: {
        level: 95, // invalid level > 90
        ascension: 7, // invalid ascension > 6
      },
    };

    const parsed = characterReadinessRequestSchema.safeParse(invalidRequest);
    expect(parsed.success).toBe(false);
  });
});
