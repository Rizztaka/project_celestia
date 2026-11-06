import { describe, expect, it } from 'vitest';

import {
  calculateTeamComfort,
  resolveStatisticalRankings,
  validateGearExclusivity,
} from '../../web/src/lib/team-damage/team-comfort.calculator.ts';
import { explainTeamComfort } from '../../web/src/lib/team-damage/team-comfort.explainer.ts';

describe('team comfort and statistical resolution (M3.3)', () => {
  it('evaluates defensive coverage and assigns comfort_first tier for high-sustain teams', () => {
    // Zhongli + Kokomi + Raiden + Furina: Shield + Sustained healing + Interruption immunity
    const comfortableTeam = [
      '10000030:3001', // Zhongli
      '10000054:5401', // Kokomi
      '10000052:5201', // Raiden
      '10000089:8901', // Furina
    ];
    const comfort = calculateTeamComfort(comfortableTeam);
    expect(comfort.score).toBeGreaterThanOrEqual(80);
    expect(comfort.tier).toBe('comfort_first');
    expect(comfort.metrics.hasShield).toBe(true);
    expect(comfort.metrics.hasSustainedHealing).toBe(true);
    expect(comfort.metrics.interruptionResistanceTier).toBe('complete');

    const explanations = explainTeamComfort(comfort);
    expect(explanations.some((e) => /shield/i.test(e))).toBe(true);
    expect(explanations.some((e) => /healing/i.test(e))).toBe(true);
  });

  it('penalizes glass-cannon setups with zero sustain as high_execution', () => {
    // 4 DPS / Sub-DPS with no healer or shielder (e.g., Xiangling + Xingqiu + Fischl + Kazuha without Bennett)
    const glassCannon = [
      '10000023:2301', // Xiangling
      '10000025:2501', // Xingqiu (only micro-healing)
      '10000031:3101', // Fischl
      '10000047:4701', // Kazuha
    ];
    const comfort = calculateTeamComfort(glassCannon);
    expect(comfort.score).toBeLessThan(60);
    expect(comfort.tier).toBe('high_execution');
    expect(comfort.metrics.hasShield).toBe(false);
    expect(comfort.metrics.hasSustainedHealing).toBe(false);

    const explanations = explainTeamComfort(comfort);
    expect(explanations.some((e) => /sustain|dodge|interruption/i.test(e))).toBe(true);
  });

  it('detects gear exclusivity violations when members share identical equipment IDs', () => {
    const validMembers = [
      {
        character: { key: 'char_a' },
        weapon: { id: 'weapon_staff_1' },
        artifacts: [{ id: 'art_flower_1' }, { id: 'art_feather_1' }],
      },
      {
        character: { key: 'char_b' },
        weapon: { id: 'weapon_bow_1' },
        artifacts: [{ id: 'art_flower_2' }, { id: 'art_feather_2' }],
      },
    ];
    expect(validateGearExclusivity(validMembers).valid).toBe(true);
    expect(validateGearExclusivity(validMembers).conflicts).toEqual([]);

    const conflictingMembers = [
      {
        character: { key: 'char_a' },
        weapon: { id: 'shared_weapon_homa' },
        artifacts: [{ id: 'art_shared_circlet' }],
      },
      {
        character: { key: 'char_b' },
        weapon: { id: 'shared_weapon_homa' }, // DUPLICATE WEAPON
        artifacts: [{ id: 'art_shared_circlet' }], // DUPLICATE ARTIFACT
      },
    ];
    const check = validateGearExclusivity(conflictingMembers);
    expect(check.valid).toBe(false);
    expect(check.conflicts.length).toBe(2);
    expect(check.conflicts.map((c) => c.gearId)).toEqual([
      'shared_weapon_homa',
      'art_shared_circlet',
    ]);
  });

  it('identifies overlapping confidence intervals as statistical ties and prioritizes favorites', () => {
    // Candidate A: 60,000 DPS ± 1,500 [58,500 - 61,500] (favoriteCount: 1)
    // Candidate B: 59,500 DPS ± 1,200 [58,300 - 60,700] (favoriteCount: 3)
    // Overlapping CI! With priority 'favorites', Candidate B should rank above Candidate A!
    const candidates = [
      {
        id: 'team_a',
        result: { dps: 60000, stdDev: 1500, min: 57000, max: 63000 },
      },
      {
        id: 'team_b',
        result: { dps: 59500, stdDev: 1200, min: 56500, max: 62000 },
      },
      {
        id: 'team_c',
        result: { dps: 45000, stdDev: 1000, min: 42000, max: 48000 }, // Distinctly lower, not tied
      },
    ];
    const favoriteCounts = { team_a: 1, team_b: 3, team_c: 4 };

    // With priority 'damage': A ranks first by DPS
    const damageRanked = resolveStatisticalRankings(candidates, 'damage', favoriteCounts);
    expect(damageRanked.ranked[0].id).toBe('team_a');
    expect(damageRanked.ties.has('team_a')).toBe(true);
    expect(damageRanked.ties.has('team_b')).toBe(true);
    expect(damageRanked.ties.has('team_c')).toBe(false);

    // With priority 'favorites': B ranks first because A & B are in a statistical tie, and B has more favorites
    const favRanked = resolveStatisticalRankings(candidates, 'favorites', favoriteCounts);
    expect(favRanked.ranked[0].id).toBe('team_b');
    expect(favRanked.ranked[1].id).toBe('team_a');
    expect(favRanked.ranked[2].id).toBe('team_c');
  });
});
