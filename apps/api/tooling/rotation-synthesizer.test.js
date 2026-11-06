import { describe, expect, it } from 'vitest';

import {
  defaultRotation,
  defensibleRotation,
} from '../../web/src/lib/team-damage/benchmark.calculator.ts';
import {
  generateDefensibleRotationCandidates,
  synthesizeTeamRotation,
} from '../../web/src/lib/team-damage/rotation-synthesizer.calculator.ts';

describe('defensible team rotation synthesis (M3.2)', () => {
  it('synthesizes role-ordered team rotations for standard archetype teams (Raiden National)', () => {
    // Raiden National: Raiden (battery/driver), Bennett (buffer), Xiangling (sub_dps), Xingqiu (sub_dps)
    const members = [
      { characterKey: '10000052:5201', roleId: 'driver' }, // Raiden Shogun
      { characterKey: '10000032:3201', roleId: 'buffer' }, // Bennett
      { characterKey: '10000023:2301', roleId: 'sub_dps' }, // Xiangling
      { characterKey: '10000025:2501', roleId: 'sub_dps' }, // Xingqiu
    ];

    const rotation = synthesizeTeamRotation({
      teamMembers: members,
      driverKey: '10000052:5201',
    });

    expect(rotation.length).toBeGreaterThan(0);

    // 1. Raiden E must be set up first
    expect(rotation[0].characterKey).toBe('10000052:5201');
    expect(rotation[0].action).toBe('skill');

    // 2. Xingqiu / Bennett buffs must precede Xiangling burst snapshot
    const bennettBurstIdx = rotation.findIndex(
      (s) => s.characterKey === '10000032:3201' && s.action === 'burst',
    );
    const xianglingBurstIdx = rotation.findIndex(
      (s) => s.characterKey === '10000023:2301' && s.action === 'burst',
    );
    expect(bennettBurstIdx).toBeGreaterThan(0);
    expect(xianglingBurstIdx).toBeGreaterThan(bennettBurstIdx);

    // 3. Driver (Raiden) takes the field at the end for Burst + Normal attacks
    const driverBurstIdx = rotation.findIndex(
      (s) => s.characterKey === '10000052:5201' && s.action === 'burst',
    );
    expect(driverBurstIdx).toBeGreaterThan(xianglingBurstIdx);
    expect(rotation.at(-1)?.characterKey).toBe('10000052:5201');
    expect(rotation.at(-1)?.action).toBe('attack');
  });

  it('generates bounded candidate permutations testing driver combo variations and swap orders', () => {
    const members = [
      { characterKey: '10000052:5201' },
      { characterKey: '10000032:3201' },
      { characterKey: '10000023:2301' },
      { characterKey: '10000025:2501' },
    ];
    const baseRotation = synthesizeTeamRotation({
      teamMembers: members,
      driverKey: '10000052:5201',
    });

    const candidateResult = generateDefensibleRotationCandidates(baseRotation, '10000052:5201', 48);

    expect(candidateResult.candidates.length).toBeGreaterThan(0);
    expect(candidateResult.candidates.length).toBeLessThanOrEqual(48);

    // First candidate is always the synthesized baseline
    expect(candidateResult.candidates[0].steps).toEqual(baseRotation);

    // All candidates must be unique
    const uniqueKeys = new Set(candidateResult.candidates.map((c) => JSON.stringify(c.steps)));
    expect(uniqueKeys.size).toBe(candidateResult.candidates.length);

    // Total action count for every candidate must be bounded <= 200
    for (const candidate of candidateResult.candidates) {
      const totalActions = candidate.steps.reduce((sum, s) => sum + s.repeat, 0);
      expect(totalActions).toBeLessThanOrEqual(200);
      expect(candidate.steps.length).toBeLessThanOrEqual(64);
    }
  });

  it('updates defaultRotation in benchmark.calculator to use synthesized defensible rotations while preserving unreviewed fallback compatibility', () => {
    // Unreviewed team should preserve legacy shape: teammates do skill, driver does skill + attack x6
    const mockTeam = {
      version: 1,
      uid: '800000001',
      id: 'mock-team',
      name: 'Mock',
      members: ['mock_a', 'mock_b', 'mock_c', 'mock_d'].map((characterKey) => ({
        characterKey,
        roleId: 'unspecified',
      })),
    };
    const steps = defaultRotation(mockTeam, 'mock_c');
    expect(steps.map((s) => s.characterKey)).toEqual([
      'mock_a',
      'mock_b',
      'mock_d',
      'mock_c',
      'mock_c',
    ]);
    expect(steps.at(-1)).toMatchObject({ action: 'attack', repeat: 6 });

    // Reviewed team receives real Burst and buff steps in defensibleRotation
    const reviewedTeam = {
      version: 1,
      uid: '800000001',
      id: 'reviewed-team',
      name: 'Raiden National',
      members: [
        { characterKey: '10000052:5201', roleId: 'unspecified' },
        { characterKey: '10000032:3201', roleId: 'unspecified' },
        { characterKey: '10000023:2301', roleId: 'unspecified' },
        { characterKey: '10000025:2501', roleId: 'unspecified' },
      ],
    };
    const reviewedSteps = defensibleRotation(reviewedTeam, '10000052:5201');
    expect(reviewedSteps.some((s) => s.action === 'burst')).toBe(true);
  });
});
