import { describe, expect, it } from 'vitest';

import {
  defensibleRotation,
} from '../../web/src/lib/team-damage/benchmark.calculator.ts';
import {
  generateDefensibleRotationCandidates,
  synthesizeTeamRotation,
} from '../../web/src/lib/team-damage/rotation-synthesizer.calculator.ts';
import {
  calculateTeamComfort,
  resolveStatisticalRankings,
  validateGearExclusivity,
} from '../../web/src/lib/team-damage/team-comfort.calculator.ts';
import { explainTeamComfort } from '../../web/src/lib/team-damage/team-comfort.explainer.ts';

describe('M3 End-to-End Integration Benchmarks', () => {
  it('benchmark 1: Raiden National executes realistic Bursts and battery funneling', () => {
    const raidenNational = {
      version: 1,
      uid: '800000001',
      id: 'raiden-national',
      name: 'Raiden National',
      members: [
        { characterKey: '10000052:5201', roleId: 'driver' }, // Raiden Shogun
        { characterKey: '10000032:3201', roleId: 'buffer' }, // Bennett
        { characterKey: '10000023:2301', roleId: 'sub_dps' }, // Xiangling
        { characterKey: '10000025:2501', roleId: 'sub_dps' }, // Xingqiu
      ],
    };

    const rotation = defensibleRotation(raidenNational, '10000052:5201');
    expect(rotation.length).toBeGreaterThan(0);

    // Burst executions present for all 4 members
    const burstChars = new Set(
      rotation.filter((s) => s.action === 'burst').map((s) => s.characterKey),
    );
    expect(burstChars.has('10000052:5201')).toBe(true);
    expect(burstChars.has('10000032:3201')).toBe(true);
    expect(burstChars.has('10000023:2301')).toBe(true);
    expect(burstChars.has('10000025:2501')).toBe(true);

    // Candidates generated within bounds
    const candidates = generateDefensibleRotationCandidates(
      rotation,
      '10000052:5201',
      48,
    );
    expect(candidates.candidates.length).toBeGreaterThan(1);
    expect(candidates.candidates.length).toBeLessThanOrEqual(48);

    // Comfort profile: Bennett provides sustained healing
    const comfort = calculateTeamComfort(
      raidenNational.members.map((m) => m.characterKey),
    );
    expect(comfort.metrics.hasSustainedHealing).toBe(true);
    expect(comfort.metrics.interruptionResistanceTier).toBe('complete'); // Raiden burst state
  });

  it('benchmark 2: Hu Tao Double Hydro achieves comfort_first tier with Zhongli shield', () => {
    const huTaoDoubleHydro = {
      version: 1,
      uid: '800000001',
      id: 'hu-tao-double-hydro',
      name: 'Hu Tao Double Hydro',
      members: [
        { characterKey: '10000046:4601', roleId: 'driver' }, // Hu Tao
        { characterKey: '10000025:2501', roleId: 'sub_dps' }, // Xingqiu
        { characterKey: '10000060:6001', roleId: 'sub_dps' }, // Yelan
        { characterKey: '10000030:3001', roleId: 'buffer' }, // Zhongli
      ],
    };

    const rotation = synthesizeTeamRotation({
      teamMembers: huTaoDoubleHydro.members,
      driverKey: '10000046:4601',
    });

    // Zhongli buff/shield comes before Xingqiu/Yelan and Hu Tao
    const zhongliIdx = rotation.findIndex(
      (s) => s.characterKey === '10000030:3001',
    );
    const huTaoIdx = rotation.findIndex(
      (s) => s.characterKey === '10000046:4601',
    );
    expect(zhongliIdx).toBeLessThan(huTaoIdx);

    // Comfort score is comfort_first (>= 80)
    const comfort = calculateTeamComfort(
      huTaoDoubleHydro.members.map((m) => m.characterKey),
    );
    expect(comfort.score).toBeGreaterThanOrEqual(80);
    expect(comfort.tier).toBe('comfort_first');
    expect(comfort.metrics.hasShield).toBe(true);

    const explainer = explainTeamComfort(comfort);
    expect(explainer.some((e) => /shield/i.test(e))).toBe(true);
  });

  it('benchmark 3: End-to-end gear exclusivity and statistical tie-breaking pipeline', () => {
    // 1. Gear check
    const members = [
      { character: { key: 'c1' }, weapon: { instanceId: 'w1' } },
      { character: { key: 'c2' }, weapon: { instanceId: 'w2' } },
    ];
    expect(validateGearExclusivity(members).valid).toBe(true);

    // 2. Statistical tie resolution
    const candidates = [
      { id: 'team_meta', result: { dps: 64100, stdDev: 1800, min: 61000, max: 67000 } },
      { id: 'team_fav', result: { dps: 63800, stdDev: 1500, min: 61200, max: 66500 } },
    ];
    const favoriteCounts = { team_meta: 0, team_fav: 2 };

    const resolved = resolveStatisticalRankings(
      candidates,
      'favorites',
      favoriteCounts,
    );
    expect(resolved.ties.has('team_meta')).toBe(true);
    expect(resolved.ties.has('team_fav')).toBe(true);
    expect(resolved.ranked[0].id).toBe('team_fav'); // Broken by player favorite count
  });
});
