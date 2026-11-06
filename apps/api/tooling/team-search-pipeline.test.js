import { describe, expect, it } from 'vitest';

import {
  buildAutoTeamPool,
} from '../../web/src/lib/team-damage/auto-generator.calculator.ts';
import { calculateTeamComfort } from '../../web/src/lib/team-damage/team-comfort.calculator.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';

describe('bounded team search and candidate pruning (M3.4)', () => {
  it('disqualifies candidate teams that violate gear exclusivity', () => {
    const fixture = analysisFixture(uid);
    const records = [0, 2, 4, 5].map((index) => ({
      uid,
      observedAt: '2026-10-25T10:00:00Z',
      character: structuredClone(fixture.snapshot.characters[index]),
    }));

    // Characters start with unique weapons from the fixture; candidate pool has 1 candidate
    const cleanPool = buildAutoTeamPool(uid, records[0].character.key, records);
    expect(cleanPool.candidates.length).toBe(1);

    // Explicitly set the same instance ID on character 0 and character 1's weapons
    records[0].character.weapon = structuredClone(records[0].character.weapon);
    records[0].character.weapon.instanceId = 'inst_unique_weapon_1';
    records[1].character.weapon = structuredClone(records[1].character.weapon);
    records[1].character.weapon.instanceId = 'inst_unique_weapon_1';

    const conflictingPool = buildAutoTeamPool(uid, records[0].character.key, records);
    expect(conflictingPool.candidates.length).toBe(0);
  });

  it('selects both high DPS finalists and comfortable alternative finalists', () => {
    // Mock simulation results with DPS and comfort scores
    const screenedResults = [
      { id: 'team_glass_1', dps: 65000, members: ['10000023:2301', '10000025:2501', '10000031:3101'] },
      { id: 'team_glass_2', dps: 64000, members: ['10000023:2301', '10000025:2501', '10000047:4701'] },
      { id: 'team_comfort_1', dps: 61000, members: ['10000030:3001', '10000054:5401', '10000052:5201'] }, // Zhongli + Kokomi
      { id: 'team_comfort_2', dps: 58000, members: ['10000030:3001', '10000032:3201', '10000023:2301'] }, // Zhongli + Bennett
    ];

    const withComfort = screenedResults.map((r) => ({
      ...r,
      comfort: calculateTeamComfort(r.members),
    }));

    // High DPS
    const topDps = [...withComfort].sort((a, b) => b.dps - a.dps)[0];
    expect(topDps.id).toBe('team_glass_1');

    // Comfort alternative: highest DPS among comfort_first tier
    const comfortAlternative = [...withComfort]
      .filter((r) => r.comfort.tier === 'comfort_first')
      .sort((a, b) => b.dps - a.dps)[0];

    expect(comfortAlternative).toBeDefined();
    expect(comfortAlternative.id).toBe('team_comfort_1');
    expect(comfortAlternative.comfort.score).toBeGreaterThanOrEqual(80);
  });
});
