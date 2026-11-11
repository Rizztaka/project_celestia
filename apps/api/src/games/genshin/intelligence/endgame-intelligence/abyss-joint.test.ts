import type { CandidateEndgameTeamInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  areTeamsDisjoint,
  calculateComfortMultiplier,
  calculateGeometryMultiplier,
  calculateHarmonicJointScore,
  calculateResistanceMultiplier,
  calculateShieldMultiplier,
  getCharacterIdentity,
  solveAbyssJoint,
} from './abyss-joint.calculator.js';
import { explainAbyssJoint } from './abyss-joint.explainer.js';

function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
      deepFreeze(val);
    }
  }
  return obj;
}

describe('M4 Subphase 4.2 — Spiral Abyss Joint Disjoint Solver', () => {
  describe('Disjoint Validation (areTeamsDisjoint)', () => {
    const team1: CandidateEndgameTeamInput = {
      id: 'team-1',
      name: 'Team 1',
      memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
      baseDps: 60000,
      comfortScore: 70,
      gear: [{ weaponInstanceId: 'w_sac_1', artifactInstanceIds: ['art_eosf_1', 'art_eosf_2'] }],
    };

    it('returns true when teams share zero characters and zero gear instances', () => {
      const team2: CandidateEndgameTeamInput = {
        id: 'team-2',
        name: 'Team 2',
        memberKeys: ['HuTao', 'Yelan', 'KaedeharaKazuha', 'Zhongli'],
        baseDps: 65000,
        comfortScore: 85,
        gear: [{ weaponInstanceId: 'w_homa_1', artifactInstanceIds: ['art_cw_1', 'art_cw_2'] }],
      };

      const result = areTeamsDisjoint(team1, team2);
      expect(result.isDisjoint).toBe(true);
      expect(result.characterConflicts).toHaveLength(0);
      expect(result.gearConflicts).toHaveLength(0);
    });

    it('detects character collision across teams', () => {
      const teamSharingBennett: CandidateEndgameTeamInput = {
        id: 'team-share-char',
        memberKeys: ['Bennett', 'Yelan', 'KaedeharaKazuha', 'Zhongli'],
        baseDps: 55000,
        comfortScore: 80,
      };

      const result = areTeamsDisjoint(team1, teamSharingBennett);
      expect(result.isDisjoint).toBe(false);
      expect(result.characterConflicts).toContain('Bennett');
    });

    it('detects Traveler variant identity collision across teams', () => {
      const teamAether: CandidateEndgameTeamInput = {
        id: 'team-aether',
        memberKeys: ['TravelerGeo', 'Zhongli', 'Albedo', 'Gorou'],
        baseDps: 45000,
        comfortScore: 90,
      };

      const teamLumine: CandidateEndgameTeamInput = {
        id: 'team-lumine',
        memberKeys: ['TravelerPyro', 'Mavuika', 'Bennett', 'Xiangling'],
        baseDps: 50000,
        comfortScore: 75,
      };

      expect(getCharacterIdentity('TravelerGeo')).toBe('Traveler');
      expect(getCharacterIdentity('TravelerPyro')).toBe('Traveler');

      const result = areTeamsDisjoint(teamAether, teamLumine);
      expect(result.isDisjoint).toBe(false);
      expect(result.characterConflicts).toContain('TravelerPyro');
    });

    it('detects weapon instance collision', () => {
      const teamSharingWeapon: CandidateEndgameTeamInput = {
        id: 'team-share-weapon',
        memberKeys: ['KaedeharaKazuha', 'Yelan', 'Fischl', 'Zhongli'],
        baseDps: 50000,
        comfortScore: 80,
        gear: [{ weaponInstanceId: 'w_sac_1', artifactInstanceIds: ['art_vv_1'] }],
      };

      const result = areTeamsDisjoint(team1, teamSharingWeapon);
      expect(result.isDisjoint).toBe(false);
      expect(result.gearConflicts).toContain('weapon:w_sac_1');
    });

    it('detects artifact instance collision', () => {
      const teamSharingArtifact: CandidateEndgameTeamInput = {
        id: 'team-share-art',
        memberKeys: ['KaedeharaKazuha', 'Yelan', 'Fischl', 'Zhongli'],
        baseDps: 50000,
        comfortScore: 80,
        gear: [{ weaponInstanceId: 'w_fav_1', artifactInstanceIds: ['art_eosf_1'] }],
      };

      const result = areTeamsDisjoint(team1, teamSharingArtifact);
      expect(result.isDisjoint).toBe(false);
      expect(result.gearConflicts).toContain('artifact:art_eosf_1');
    });
  });

  describe('Harmonic Mean Scoring & Counter Multipliers', () => {
    it('calculates harmonic mean and penalizes severe imbalance', () => {
      // Balanced: 50k and 50k -> 50k
      expect(calculateHarmonicJointScore(50000, 50000)).toBe(50000);

      // Imbalanced: 90k and 10k -> 18k (heavily penalizes the failing half)
      expect(calculateHarmonicJointScore(90000, 10000)).toBe(18000);

      // Zero score on either half yields 0
      expect(calculateHarmonicJointScore(100000, 0)).toBe(0);
      expect(calculateHarmonicJointScore(0, 100000)).toBe(0);
    });

    it('applies shield counter bonuses and uncountered penalties', () => {
      const pyroTeamElements = new Set(['Pyro', 'Anemo']);
      const cryoShieldResult = calculateShieldMultiplier(pyroTeamElements, ['Cryo']);
      expect(cryoShieldResult.multiplier).toBe(1.15);
      expect(cryoShieldResult.counterBadges[0]).toContain('Countered by Pyro');

      const noCounterElements = new Set(['Anemo', 'Dendro']);
      const uncounteredResult = calculateShieldMultiplier(noCounterElements, ['Cryo']);
      expect(uncounteredResult.multiplier).toBe(0.4);
      expect(uncounteredResult.counterBadges[0]).toContain('Uncountered');
    });

    it('applies resistance penalties and mitigation with shred supports', () => {
      const resProfile = { Cryo: 0.7 };

      // Cryo team without shred: severe penalty
      const withoutShred = calculateResistanceMultiplier(
        'Cryo',
        new Set(['Cryo', 'Hydro']),
        ['Ayaka', 'Shenhe'],
        resProfile,
      );
      expect(withoutShred.multiplier).toBe(0.5);

      // Cryo team with Kazuha (Anemo VV shred): mitigated
      const withShred = calculateResistanceMultiplier(
        'Cryo',
        new Set(['Cryo', 'Hydro', 'Anemo']),
        ['Ayaka', 'Shenhe', 'KaedeharaKazuha'],
        resProfile,
      );
      expect(withShred.multiplier).toBe(0.8);

      // Immunity: 100% resistance yields 0.05
      const immune = calculateResistanceMultiplier('Hydro', new Set(['Hydro']), ['Neuvillette'], {
        Hydro: 1.0,
      });
      expect(immune.multiplier).toBe(0.05);
    });

    it('applies crowd control geometry multipliers', () => {
      // Crowd wave with Kazuha -> +25%
      const withKazuha = calculateGeometryMultiplier('aoe_crowd', 'recommended', [
        'KaedeharaKazuha',
        'Bennett',
      ]);
      expect(withKazuha.multiplier).toBe(1.25);

      // Crowd wave without grouper -> -15%
      const withoutGrouper = calculateGeometryMultiplier('aoe_crowd', 'recommended', [
        'HuTao',
        'Xingqiu',
      ]);
      expect(withoutGrouper.multiplier).toBe(0.85);

      // Single target boss -> +10%
      const boss = calculateGeometryMultiplier('single_target_boss', 'optional', [
        'HuTao',
        'Xingqiu',
      ]);
      expect(boss.multiplier).toBe(1.1);
    });

    it('comfort multiplier scales between 0.85 and 1.15', () => {
      expect(calculateComfortMultiplier(0)).toBeCloseTo(0.85);
      expect(calculateComfortMultiplier(50)).toBeCloseTo(1.0);
      expect(calculateComfortMultiplier(100)).toBeCloseTo(1.15);
    });
  });

  describe('The Greedy vs Joint Optimization Invariant Proof', () => {
    it('proves mathematically that joint disjoint optimization outperforms greedy independent selection', () => {
      // 4 Candidate Teams:
      // T_A: Raiden National (Raiden, Bennett, Xiangling, Xingqiu) - Base 60,000 DPS
      const teamA: CandidateEndgameTeamInput = {
        id: 'team-raiden-national',
        name: 'Raiden National',
        memberKeys: ['RaidenShogun', 'Bennett', 'Xiangling', 'Xingqiu'],
        primaryElement: 'Pyro',
        baseDps: 60000,
        comfortScore: 75,
      };

      // T_B: Hu Tao Double Hydro (Hu Tao, Xingqiu, Yelan, Zhongli) - Base 72,000 DPS
      // NOTE: Shares Xingqiu with T_A!
      const teamB: CandidateEndgameTeamInput = {
        id: 'team-hu-tao-double-hydro',
        name: 'Hu Tao Double Hydro',
        memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
        primaryElement: 'Pyro',
        baseDps: 72000,
        comfortScore: 85,
      };

      // T_C: Keqing Aggravate (Keqing, Fischl, Nahida, Zhongli) - Base 52,000 DPS
      // Disjoint with T_A, but shares Zhongli with T_B!
      const teamC: CandidateEndgameTeamInput = {
        id: 'team-keqing-aggravate',
        name: 'Keqing Aggravate',
        memberKeys: ['Keqing', 'Fischl', 'Nahida', 'Zhongli'],
        primaryElement: 'Electro',
        baseDps: 52000,
        comfortScore: 85,
      };

      // T_D: Budget Tighnari (Tighnari, Collei, KukiShinobu, Dori) - Base 18,000 DPS
      // Disjoint with T_B!
      const teamD: CandidateEndgameTeamInput = {
        id: 'team-budget-tighnari',
        name: 'Budget Tighnari',
        memberKeys: ['Tighnari', 'Collei', 'KukiShinobu', 'Dori'],
        primaryElement: 'Dendro',
        baseDps: 18000,
        comfortScore: 60,
      };

      // Custom Encounter:
      // Half 1: Pyro Lectors (Cryo/Pyro shields) + AoE crowd
      // Half 2: Hydro Tulpa (Hydro 100% immune, requires Dendro/Electro)
      const encounterOverride = {
        chamber: 1,
        firstHalf: {
          half: 1 as const,
          targetTimeSeconds: 90,
          waves: [
            {
              waveNumber: 1,
              enemies: ['AbyssLector_FathomlessFlames'],
              shields: ['Pyro' as const],
              aura: null,
              geometry: 'aoe_crowd' as const,
              ccDemand: 'recommended' as const,
              resistanceProfile: { Pyro: 0.5 },
            },
          ],
        },
        secondHalf: {
          half: 2 as const,
          targetTimeSeconds: 90,
          waves: [
            {
              waveNumber: 1,
              enemies: ['HydroTulpa'],
              shields: ['Hydro' as const],
              aura: null,
              geometry: 'single_target_boss' as const,
              ccDemand: 'optional' as const,
              resistanceProfile: { Hydro: 1.0, Electro: 0.1, Dendro: 0.1 },
            },
          ],
        },
      };

      const request = {
        cycleId: '5.2-1',
        floor: 12,
        chamber: 1,
        candidateTeams: [teamA, teamB, teamC, teamD],
        encounterOverride,
      };

      const result = solveAbyssJoint(request);

      // Verify Joint Solver assigned Team A to Half 1 and Team C to Half 2
      expect(result.firstHalf.team.id).toBe('team-raiden-national');
      expect(result.secondHalf.team.id).toBe('team-keqing-aggravate');
      expect(result.isJointOptimal).toBe(true);

      // Verify Greedy comparison exists and has positive delta
      expect(result.greedyComparison).not.toBeNull();
      const gc = result.greedyComparison!;

      // Greedy choice took Team B on Half 1 (highest standalone score), leaving only Team D for Half 2
      expect(result.metadata.greedyFirstTeamId).toBe('team-hu-tao-double-hydro');
      expect(result.metadata.greedySecondTeamId).toBe('team-budget-tighnari');

      // Joint harmonic score must strictly beat greedy joint score
      expect(result.jointScore).toBeGreaterThan(gc.greedyJointScore);
      expect(gc.scoreDeltaPercent).toBeGreaterThan(50); // Massive >50% improvement over greedy bottleneck!

      // Generate explanations and verify content
      const explanations = explainAbyssJoint(result);
      expect(explanations.some((p) => p.includes('Joint clearance score'))).toBe(true);
      expect(
        explanations.some((p) => p.includes('Optimization Rationale: Joint optimization achieved')),
      ).toBe(true);
      expect(explanations.some((p) => p.includes('First Half: "Raiden National"'))).toBe(true);
      expect(explanations.some((p) => p.includes('Second Half: "Keqing Aggravate"'))).toBe(true);
    });

    it('does not mutate input objects under deepFreeze', () => {
      const frozenRequest = deepFreeze({
        cycleId: '5.2-1',
        floor: 12,
        chamber: 1,
        candidateTeams: [
          {
            id: 't1',
            name: 'T1',
            memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
            baseDps: 60000,
            comfortScore: 70,
          },
          {
            id: 't2',
            name: 'T2',
            memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
            baseDps: 55000,
            comfortScore: 65,
          },
        ],
      });

      expect(() => solveAbyssJoint(frozenRequest)).not.toThrow();
    });

    it('flags expired or non-current encounter cycles as historical mode', () => {
      const historicalRequest = {
        cycleId: '4.8-1',
        floor: 12,
        chamber: 1,
        candidateTeams: [
          {
            id: 't1',
            name: 'T1',
            memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
            baseDps: 60000,
            comfortScore: 70,
          },
          {
            id: 't2',
            name: 'T2',
            memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
            baseDps: 55000,
            comfortScore: 65,
          },
        ],
      };

      const result = solveAbyssJoint(historicalRequest);
      expect(result.isCurrentCycle).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.expirationNote).toContain('does not match active cycle');

      const explanations = explainAbyssJoint(result);
      expect(explanations.some((e) => e.includes('[ARCHIVED / HISTORICAL CYCLE]'))).toBe(true);
      expect(
        explanations.some((e) =>
          e.includes('Recommendations are based on historical cycle benchmarks (v4.8-1)'),
        ),
      ).toBe(true);
    });

    it('downgrades current cycle to HISTORICAL_BENCHMARK when evaluated after expiry date', () => {
      const expiredDateRequest = {
        cycleId: '5.2-1',
        floor: 12,
        chamber: 1,
        referenceDate: '2030-01-01T00:00:00Z',
        candidateTeams: [
          {
            id: 't1',
            name: 'T1',
            memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
            baseDps: 60000,
            comfortScore: 70,
          },
          {
            id: 't2',
            name: 'T2',
            memberKeys: ['Keqing', 'Fischl', 'Nahida', 'KaedeharaKazuha'],
            baseDps: 55000,
            comfortScore: 65,
          },
        ],
      };

      const result = solveAbyssJoint(expiredDateRequest);
      expect(result.isCurrentCycle).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.status).toBe('HISTORICAL_BENCHMARK');
      expect(result.expirationNote).toContain('expired on');

      const explanations = explainAbyssJoint(result);
      expect(
        explanations.some((e) =>
          e.includes(
            'Recommendations are based on historical cycle benchmarks (v5.2-1). Live chamber geometry and buff changes may alter performance.',
          ),
        ),
      ).toBe(true);
      expect(explanations.some((e) => e.includes('Joint clearance score'))).toBe(true);
    });
  });
});
