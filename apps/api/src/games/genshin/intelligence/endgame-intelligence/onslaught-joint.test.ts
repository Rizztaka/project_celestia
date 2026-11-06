import type { CandidateEndgameTeamInput } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import {
  areTeamsTripletDisjoint,
  calculate3WayHarmonicScore,
  evaluateTeamForBoss,
  solveOnslaughtJoint,
} from './onslaught-joint.calculator.js';
import { explainOnslaughtJoint } from './onslaught-joint.explainer.js';

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

describe('M4 Subphase 4.3 — Stygian Onslaught 3-Boss Consecutive Allocator', () => {
  const team1: CandidateEndgameTeamInput = {
    id: 'team-1',
    name: 'Neuvillette Furina Baizhu',
    memberKeys: ['Neuvillette', 'Furina', 'Baizhu', 'KaedeharaKazuha'],
    primaryElement: 'Hydro',
    baseDps: 70000,
    comfortScore: 90,
    gear: [{ weaponInstanceId: 'w_tome_1', artifactInstanceIds: ['art_mh_1'] }],
  };

  const team2: CandidateEndgameTeamInput = {
    id: 'team-2',
    name: 'Hu Tao Double Hydro',
    memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
    primaryElement: 'Pyro',
    baseDps: 68000,
    comfortScore: 85,
    gear: [{ weaponInstanceId: 'w_homa_1', artifactInstanceIds: ['art_cw_1'] }],
  };

  const team3: CandidateEndgameTeamInput = {
    id: 'team-3',
    name: 'Tighnari Spread',
    memberKeys: ['Tighnari', 'Fischl', 'Nahida', 'RaidenShogun'],
    primaryElement: 'Dendro',
    baseDps: 62000,
    comfortScore: 75,
    gear: [{ weaponInstanceId: 'w_path_1', artifactInstanceIds: ['art_gd_1'] }],
  };

  describe('3-Way Triplet Disjoint Verification', () => {
    it('returns true when all 3 teams share zero characters and zero gear instances (12 distinct units)', () => {
      const result = areTeamsTripletDisjoint(team1, team2, team3);
      expect(result.isDisjoint).toBe(true);
      expect(result.characterConflicts).toHaveLength(0);
      expect(result.gearConflicts).toHaveLength(0);
    });

    it('detects character collision between any two teams in the triplet', () => {
      const team3Conflict: CandidateEndgameTeamInput = {
        id: 'team-3-conflict',
        memberKeys: ['Tighnari', 'Fischl', 'Nahida', 'Zhongli'], // shares Zhongli with team 2
        baseDps: 60000,
        comfortScore: 80,
      };

      const result = areTeamsTripletDisjoint(team1, team2, team3Conflict);
      expect(result.isDisjoint).toBe(false);
      expect(result.characterConflicts).toContain('Zhongli');
    });

    it('detects weapon instance collision between any two teams in the triplet', () => {
      const team3WeaponConflict: CandidateEndgameTeamInput = {
        id: 'team-3-weapon',
        memberKeys: ['Tighnari', 'Fischl', 'Nahida', 'RaidenShogun'],
        baseDps: 60000,
        comfortScore: 75,
        gear: [{ weaponInstanceId: 'w_tome_1' }], // shares weapon with team 1
      };

      const result = areTeamsTripletDisjoint(team1, team2, team3WeaponConflict);
      expect(result.isDisjoint).toBe(false);
      expect(result.gearConflicts).toContain('weapon:w_tome_1');
    });

    it('detects Traveler variant identity collision across the triplet', () => {
      const teamAether: CandidateEndgameTeamInput = {
        id: 'team-aether',
        memberKeys: ['TravelerGeo', 'Gorou', 'Albedo', 'Itto'],
        baseDps: 50000,
        comfortScore: 80,
      };

      const teamLumine: CandidateEndgameTeamInput = {
        id: 'team-lumine',
        memberKeys: ['TravelerAnemo', 'Venti', 'Faruzan', 'Xiao'],
        baseDps: 55000,
        comfortScore: 70,
      };

      const result = areTeamsTripletDisjoint(team1, teamAether, teamLumine);
      expect(result.isDisjoint).toBe(false);
      expect(result.characterConflicts).toContain('TravelerAnemo');
    });
  });

  describe('3-Way Harmonic Mean & Mechanic Multipliers', () => {
    it('calculates 3-way harmonic mean and penalizes a single failing bottleneck stage', () => {
      // Balanced: 60k, 60k, 60k -> 60,000
      expect(calculate3WayHarmonicScore(60000, 60000, 60000)).toBe(60000);

      // Severe bottleneck: 100k, 100k, 10k -> 25,000
      expect(calculate3WayHarmonicScore(100000, 100000, 10000)).toBe(25000);

      // Zero score on any stage yields 0
      expect(calculate3WayHarmonicScore(100000, 100000, 0)).toBe(0);
      expect(calculate3WayHarmonicScore(0, 80000, 80000)).toBe(0);
    });

    it('applies corrosion multipliers based on healer coverage', () => {
      const boss = {
        stage: 1 as const,
        bossKey: 'Rifthound',
        bossName: 'Stygian Rifthound',
        mechanics: ['corrosion' as const],
        recommendedElements: [],
        resistanceProfile: {},
      };

      // Team with Baizhu (party-wide healer) -> +20%
      const partyHealEval = evaluateTeamForBoss(
        {
          id: 'party',
          name: 'Party Heal',
          memberKeys: ['Baizhu', 'Furina', 'Neuvillette', 'KaedeharaKazuha'],
          baseDps: 50000,
          comfortScore: 80,
          gear: [],
        },
        boss,
      );
      expect(partyHealEval.multipliers.mechanic).toBe(1.2);
      expect(
        partyHealEval.mechanicCounters.some((c) => c.includes('Party-wide sustained healing')),
      ).toBe(true);

      // Team with only Bennett (single-target healer) -> -5%
      const singleHealEval = evaluateTeamForBoss(
        {
          id: 'single',
          name: 'Single Heal',
          memberKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
          baseDps: 50000,
          comfortScore: 70,
          gear: [],
        },
        boss,
      );
      expect(singleHealEval.multipliers.mechanic).toBe(0.95);

      // Team with no healer -> -45%
      const noHealEval = evaluateTeamForBoss(
        {
          id: 'none',
          name: 'No Heal',
          memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
          baseDps: 50000,
          comfortScore: 70,
          gear: [],
        },
        boss,
      );
      expect(noHealEval.multipliers.mechanic).toBe(0.55);
    });

    it('applies heavy stagger and mobile boss multipliers', () => {
      const staggerBoss = {
        stage: 2 as const,
        bossKey: 'Mech',
        bossName: 'Ruincruiser',
        mechanics: ['heavy_stagger' as const],
        recommendedElements: [],
        resistanceProfile: {},
      };

      // Team with Zhongli (shielder) -> +15%
      const shieldEval = evaluateTeamForBoss(
        {
          id: 'shield',
          name: 'Shield',
          memberKeys: ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli'],
          baseDps: 50000,
          comfortScore: 85,
          gear: [],
        },
        staggerBoss,
      );
      expect(shieldEval.multipliers.mechanic).toBe(1.15);

      // Mobile flying boss with ranged carry (Yoimiya) -> +15%
      const flyingBoss = {
        stage: 3 as const,
        bossKey: 'Drake',
        bossName: 'Aeon Drake',
        mechanics: ['flying_mobile' as const],
        recommendedElements: [],
        resistanceProfile: {},
      };

      const rangedEval = evaluateTeamForBoss(
        {
          id: 'ranged',
          name: 'Ranged',
          memberKeys: ['Yoimiya', 'Yelan', 'Fischl', 'Zhongli'],
          baseDps: 50000,
          comfortScore: 80,
          gear: [],
        },
        flyingBoss,
      );
      expect(rangedEval.multipliers.mechanic).toBe(1.15);
      expect(
        rangedEval.mechanicCounters.some((c) => c.includes('Ranged/Tracking damage active')),
      ).toBe(true);
    });
  });

  describe('Full 3-Boss End-to-End Onslaught Allocation', () => {
    it('globally optimizes 3 distinct teams to their ideal boss counters', () => {
      // 3 Bosses with contrasting demands:
      // Boss 1: Corrosion (wants Baizhu / party heal)
      // Boss 2: Heavy Stagger (wants Zhongli / shield)
      // Boss 3: Flying Mobile (wants Tighnari / ranged tracking)
      const request = {
        cycleId: '5.2-1',
        candidateTeams: [team1, team2, team3],
      };

      const result = solveOnslaughtJoint(request);

      expect(result.allStagesCleared).toBe(true);
      expect(result.stages).toHaveLength(3);
      expect(result.jointScore).toBeGreaterThan(50000);

      // Verify Stage 1 has Baizhu (Party healer against Corrosion)
      expect(result.stages[0].team.id).toBe('team-1');
      expect(result.stages[0].mechanicCounters.some((c) => c.includes('Corrosion Counter'))).toBe(
        true,
      );

      // Verify Stage 2 has Zhongli (Shield against Heavy Stagger)
      expect(result.stages[1].team.id).toBe('team-2');
      expect(
        result.stages[1].mechanicCounters.some((c) => c.includes('Heavy Stagger Counter')),
      ).toBe(true);

      // Verify Stage 3 has Tighnari/Fischl (Ranged against Flying Mobile)
      expect(result.stages[2].team.id).toBe('team-3');
      expect(result.stages[2].mechanicCounters.some((c) => c.includes('Mobile Boss Counter'))).toBe(
        true,
      );

      // Explainer integration
      const explanations = explainOnslaughtJoint(result);
      expect(explanations.some((p) => p.includes('ALL 3 STAGES CLEARED'))).toBe(true);
      expect(explanations.some((p) => p.includes('Stage 1:'))).toBe(true);
      expect(explanations.some((p) => p.includes('Stage 2:'))).toBe(true);
      expect(explanations.some((p) => p.includes('Stage 3:'))).toBe(true);
      expect(explanations.some((p) => p.includes('12-character and gear exclusivity'))).toBe(true);
    });

    it('preserves input immutability under deepFreeze', () => {
      const frozenRequest = deepFreeze({
        cycleId: '5.2-1',
        candidateTeams: [team1, team2, team3],
      });

      expect(() => solveOnslaughtJoint(frozenRequest)).not.toThrow();
    });

    it('produces gaps and gap notes when boss contains unsupported or unmodeled mechanics', () => {
      const bossWithGaps = [
        {
          stage: 1 as const,
          bossKey: 'BossUnmodeled',
          bossName: 'Quantum Shadow',
          mechanics: ['corrosion' as const, 'elemental_shield' as const, 'dps_check' as const],
          recommendedElements: [],
          resistanceProfile: {},
        },
        {
          stage: 2 as const,
          bossKey: 'Drake',
          bossName: 'Aeon Drake',
          mechanics: ['heavy_stagger' as const],
          recommendedElements: [],
          resistanceProfile: {},
        },
        {
          stage: 3 as const,
          bossKey: 'DendroChicken',
          bossName: 'Jadeplume',
          mechanics: ['flying_mobile' as const],
          recommendedElements: [],
          resistanceProfile: {},
        },
      ];

      const result = solveOnslaughtJoint({
        cycleId: '5.2-1',
        candidateTeams: [team1, team2, team3],
        bossOverrides: bossWithGaps,
      });

      expect(result.hasMechanicGaps).toBe(true);
      const stage1 = result.stages[0];
      expect(stage1.unsupportedMechanics).toEqual(['elemental_shield', 'dps_check']);
      expect(stage1.gapNotes.length).toBe(2);

      const explanations = explainOnslaughtJoint(result);
      expect(explanations.some((e) => e.includes('MECHANIC GAP WARNING'))).toBe(true);
      expect(explanations.some((e) => e.includes('[MECHANIC GAP]'))).toBe(true);
    });
  });
});
