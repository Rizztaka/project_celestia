import { describe, expect, it } from 'vitest';

import {
  calculateMarginalImpact,
  calculateMaterialDeficitWeight,
  calculateMultiObjectiveEfficiency,
  calculatePriorityWeight,
  calculateTimeGatingFactor,
  optimizePlannerSchedule,
  type PlannerCandidateInput,
} from './planner-optimization.calculator.js';

function makeCandidate(overrides: Partial<PlannerCandidateInput> = {}): PlannerCandidateInput {
  return {
    candidateId: 'goal-hutao-burst',
    goalId: 'goal-hutao-burst',
    actionType: 'domain_talent',
    targetKey: 'HuTao',
    talentType: 'burst',
    domainKey: 'TaishanMansion',
    domainName: 'Taishan Mansion',
    resourceName: 'Diligence',
    openDays: [1, 4, 6], // Tue, Fri, Sun
    resinPerRun: 20,
    requiredMaterials: {
      TeachingsOfDiligence: 3,
      GuideToDiligence: 21,
      Mora: 120000,
    },
    domainDropKeys: ['TeachingsOfDiligence', 'GuideToDiligence', 'PhilosophiesOfDiligence'],
    goalPriority: 1,
    expectedScoreDelta: 20,
    closesGap: true,
    ...overrides,
  };
}

describe('planner-optimization.calculator', () => {
  describe('mathematical primitives', () => {
    it('computes time-gating factor G_a: 1.35 on rotating weekday, 1.0 on Sunday or always-open source, 0 when closed', () => {
      // Tuesday (day 1) for Tue/Fri/Sun domain -> 1.35
      expect(calculateTimeGatingFactor([1, 4, 6], 1, 'domain_talent')).toEqual({
        factor: 1.35,
        isTimeGated: true,
        isOpenToday: true,
      });

      // Sunday (day 6) -> 1.0 (all domains open)
      expect(calculateTimeGatingFactor([1, 4, 6], 6, 'domain_talent')).toEqual({
        factor: 1.0,
        isTimeGated: false,
        isOpenToday: true,
      });

      // Monday (day 0) for Tue/Fri/Sun domain -> 0.0 (closed)
      expect(calculateTimeGatingFactor([1, 4, 6], 0, 'domain_talent')).toEqual({
        factor: 0.0,
        isTimeGated: false,
        isOpenToday: false,
      });

      // World boss is open every day -> 1.0
      expect(calculateTimeGatingFactor([0, 1, 2, 3, 4, 5, 6], 2, 'world_boss')).toEqual({
        factor: 1.0,
        isTimeGated: false,
        isOpenToday: true,
      });
    });

    it('computes material deficit weight D_a and returns 0.0 when recorded inventory covers required materials', () => {
      const required = {
        TeachingsOfDiligence: 6,
        GuideToDiligence: 14,
        Mora: 50000,
      };

      // Empty inventory -> D_a = 1.0
      const fullDeficit = calculateMaterialDeficitWeight(required, {});
      expect(fullDeficit.deficitRatio).toBe(1.0);
      expect(fullDeficit.totalDeficit).toBe(20);

      // Half owned -> D_a = 0.5
      const halfDeficit = calculateMaterialDeficitWeight(required, {
        TeachingsOfDiligence: 6,
        GuideToDiligence: 4,
      });
      expect(halfDeficit.deficitRatio).toBe(0.5);
      expect(halfDeficit.totalDeficit).toBe(10);

      // Fully owned -> D_a = 0.0
      const covered = calculateMaterialDeficitWeight(required, {
        TeachingsOfDiligence: 10,
        GuideToDiligence: 25,
      });
      expect(covered.deficitRatio).toBe(0.0);
      expect(covered.totalDeficit).toBe(0);
    });

    it('computes marginal impact Delta R_a, priority weight P_a, and multi-objective efficiency E_a', () => {
      // Delta R_a = 20 * 1.5 (closesGap=true) = 30
      const deltaR = calculateMarginalImpact(20, true);
      expect(deltaR).toBe(30);

      // P_a for priority 1 = 2.0; priority 3 = 1.5; priority 10 = clamped to 0.5
      expect(calculatePriorityWeight(1)).toBe(2.0);
      expect(calculatePriorityWeight(3)).toBe(1.5);
      expect(calculatePriorityWeight(10)).toBe(0.5);

      // E_a = ((30 * 0.5 + 50 * 1.0 + 20) * 1.35 * 2.0) / 20 = (85 * 2.7) / 20 = 11.48
      const efficiency = calculateMultiObjectiveEfficiency({
        marginalImpact: 30,
        deficitRatio: 1.0,
        timeGatingFactor: 1.35,
        priorityWeight: 2.0,
        resinPerRun: 20,
      });
      expect(efficiency).toBeCloseTo(11.48, 2);

      // E_a is 0 when D_a = 0 (materials owned) or G_a = 0 (domain closed)
      expect(
        calculateMultiObjectiveEfficiency({
          marginalImpact: 30,
          deficitRatio: 0,
          timeGatingFactor: 1.35,
          priorityWeight: 2.0,
          resinPerRun: 20,
        }),
      ).toBe(0);
      expect(
        calculateMultiObjectiveEfficiency({
          marginalImpact: 30,
          deficitRatio: 1.0,
          timeGatingFactor: 0,
          priorityWeight: 2.0,
          resinPerRun: 20,
        }),
      ).toBe(0);
    });
  });

  describe('optimizePlannerSchedule (knapsack & alternatives)', () => {
    it('allocates zero resin when inventory already satisfies goal requirements (D_a = 0)', () => {
      const candidate = makeCandidate();
      const result = optimizePlannerSchedule({
        candidates: [candidate],
        recordedInventory: {
          TeachingsOfDiligence: 10,
          GuideToDiligence: 30,
        },
        currentResin: 160,
        dayOfWeek: 1, // Tuesday (open)
      });

      expect(result.rankedPlan).toHaveLength(0);
      expect(result.allocatedResin).toBe(0);
      expect(result.unallocatedResin).toBe(160);
      expect(result.evaluatedCandidates[0]?.materialDeficitRatio).toBe(0);
    });

    it('packs highest E_a actions first while respecting both dailyResinBudget and timeBudgetMinutes', () => {
      const highRoiTalent = makeCandidate({
        candidateId: 'goal-1',
        goalId: 'goal-1',
        targetKey: 'HuTao',
        goalPriority: 1,
        expectedScoreDelta: 24,
        closesGap: true,
        openDays: [1, 4, 6],
        resinPerRun: 20,
      });

      const secondaryWeapon = makeCandidate({
        candidateId: 'goal-2',
        goalId: 'goal-2',
        actionType: 'domain_weapon',
        targetKey: 'StaffOfHoma',
        domainKey: 'HiddenPalaceOfLianshanFormula',
        domainName: 'Hidden Palace of Lianshan Formula',
        resourceName: 'Aerosiderite',
        openDays: [1, 4, 6],
        resinPerRun: 20,
        requiredMaterials: { PieceOfAerosiderite: 12 },
        domainDropKeys: ['PieceOfAerosiderite'],
        goalPriority: 2,
        expectedScoreDelta: 12,
        closesGap: false,
      });

      // Cap session time to 15 minutes (at 2.5m/run -> max 6 standard runs total = 120 Resin)
      // and dailyResinBudget to 140
      const result = optimizePlannerSchedule({
        candidates: [secondaryWeapon, highRoiTalent],
        recordedInventory: {},
        currentResin: 180,
        dailyResinBudget: 140,
        timeBudgetMinutes: 15,
        dayOfWeek: 1,
      });

      expect(result.effectiveResinBudget).toBe(140);
      expect(result.rankedPlan).toHaveLength(2);
      // Goal 1 gets 5 runs (100 Resin, 12.5m)
      expect(result.rankedPlan[0]).toMatchObject({
        goalId: 'goal-1',
        targetKey: 'HuTao',
        runs: 5,
        resinCost: 100,
        estimatedMinutes: 12.5,
      });
      // Remaining time is 2.5m -> Goal 2 gets 1 run (20 Resin, 2.5m)
      expect(result.rankedPlan[1]).toMatchObject({
        goalId: 'goal-2',
        targetKey: 'StaffOfHoma',
        runs: 1,
        resinCost: 20,
        estimatedMinutes: 2.5,
      });
      expect(result.totalEstimatedMinutes).toBe(15);
      expect(result.unallocatedResin).toBe(20);

      // Alternatives include condensed speedrun, overworld prep, and secondary goal focus
      const altKinds = result.alternatives.map((a) => a.kind);
      expect(altKinds).toContain('speedrun_condensed');
      expect(altKinds).toContain('overworld_prep');
      expect(altKinds).toContain('secondary_goal');
    });

    it('generates zero-resin overworld preparation alternative when today domain is closed but opens tomorrow', () => {
      // Wednesday (day 2) domain evaluated on Tuesday (day 1)
      const wednesdayGoal = makeCandidate({
        candidateId: 'goal-wed',
        goalId: 'goal-wed',
        targetKey: 'Furina',
        domainName: 'Pale Forgotten Glory',
        openDays: [2, 5, 6],
      });

      const result = optimizePlannerSchedule({
        candidates: [wednesdayGoal],
        recordedInventory: {},
        currentResin: 120,
        dayOfWeek: 1,
      });

      expect(result.rankedPlan).toHaveLength(0);
      expect(result.unallocatedResin).toBe(120);

      const overworldAlt = result.alternatives.find((a) => a.kind === 'overworld_prep');
      expect(overworldAlt).toBeDefined();
      expect(overworldAlt?.totalResinCost).toBe(0);
      expect(overworldAlt?.actions[0]?.targetKey).toBe('Furina');
      expect(overworldAlt?.actions[0]?.actionType).toBe('overworld_gather');
    });
  });
});
