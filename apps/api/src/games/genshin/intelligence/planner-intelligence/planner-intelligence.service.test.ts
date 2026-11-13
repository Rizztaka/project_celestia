import { optimizationPlannerResponseSchema } from '@celestia/api-contracts';
import { GoalType } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({
  prisma: {
    genshinAccount: {
      findUnique: vi.fn(),
    },
    genshinPlanPreferences: {
      findUnique: vi.fn(),
    },
    genshinPlanDismissal: {
      findMany: vi.fn(),
    },
    upgradeGoal: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from '@/core/db/prisma.js';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import type { RoutineService } from '../../../../platform/companion/routine.service.js';
import type { AccountContextProvider } from '../../account-data/account-context-provider.service.js';
import { GenshinCompanionProvider } from '../../companion/genshin-companion.provider.js';
import type { GenshinRecordedStockRepository } from '../../companion/recorded-stock.repository.js';
import { allocateResin, filterAndScoreGoals } from './planner-intelligence.calculator.js';
import { PlannerIntelligenceService } from './planner-intelligence.service.js';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function makeGoal(overrides: Partial<Parameters<typeof filterAndScoreGoals>[0][0]> = {}) {
  return {
    status: 'active' as const,
    priority: 3,
    revision: 0,
    completedAt: null,
    completionReason: null,
    predecessorId: null,
    createRequestId: null,
    id: 'goal-1',
    userId: 'user-1',
    goalType: GoalType.CHARACTER_TALENT,
    targetKey: 'HuTao',
    fromPhase: 1,
    toPhase: 6,
    talentType: 'burst',
    createdAt: new Date('2026-10-20T00:00:00.000Z'),
    updatedAt: new Date('2026-10-20T00:00:00.000Z'),
    ...overrides,
  };
}

function makeRanking(characterKey: string, score: number) {
  return {
    characterKey,
    rank: 1,
    score,
    recommendation: 'COMPLETE' as const,
    explanations: [],
  };
}

companionRegistry.register(new GenshinCompanionProvider());

// -------------------------------------------------------
// Legacy Calculator Unit Tests
// -------------------------------------------------------

describe('filterAndScoreGoals', () => {
  it('uses sourced weekday domains and leaves unknown or non-domain targets unrouted', () => {
    const open = filterAndScoreGoals([makeGoal({ fromPhase: 1 })], 1, []);
    expect(open).toHaveLength(1);
    expect(open[0]?.resinPerRun).toBe(20);
    expect(open[0]?.sourceName).toContain('Taishan Mansion');
    expect(filterAndScoreGoals([makeGoal({ fromPhase: 1 })], 0, [])).toEqual([]);
    expect(
      filterAndScoreGoals([makeGoal({ targetKey: 'UnknownCharacter', fromPhase: 1 })], 1, []),
    ).toEqual([]);
    expect(
      filterAndScoreGoals([makeGoal({ goalType: GoalType.CHARACTER_ASCENSION })], 0, []),
    ).toEqual([]);
  });

  it('retains neutral priority even with legacy rankings, using an explicit test-only route fixture', () => {
    const provider = new GenshinCompanionProvider();
    provider.getGoalAdvice = () => ({
      available: true,
      costs: { Mora: 12500 },
      sources: [],
      route: {
        available: true,
        domain: {
          domainKey: 'TestDomain',
          name: 'Test source',
          location: 'test-only',
          days: [1, 4, 6],
          drops: ['Diligence'],
          dropKeys: ['TeachingsOfDiligence'],
          resinPerClaim: 20,
        },
      },
    });
    const goal = makeGoal({ fromPhase: 1 });
    const low = filterAndScoreGoals([goal], 1, [makeRanking('HuTao', 90)], provider);
    const high = filterAndScoreGoals([goal], 1, [makeRanking('HuTao', 10)], provider);
    expect(low).toEqual(high);
    expect(high[0]).toMatchObject({ characterPriorityWeight: 50, totalScore: 120 });
    expect(filterAndScoreGoals([goal], 0, [], provider)).toEqual([]);
  });
});

describe('allocateResin', () => {
  it('returns empty route if there are no scored goals', () => {
    const result = allocateResin([], 160);
    expect(result.route).toHaveLength(0);
    expect(result.unallocatedResin).toBe(160);
  });

  it('allocates resin to the highest-priority goal first', () => {
    const highPriority = {
      goal: makeGoal({ id: 'goal-high', priority: 1 }),
      totalScore: 10,
      baseScore: 50,
      timeGatedBonus: 20,
      characterPriorityWeight: 80,
      resinPerRun: 20,
      sourceName: 'Taishan Mansion',
      isTimeGated: true,
      characterKey: 'HuTao',
      characterScore: 20,
      resourceName: 'Teachings of Diligence',
    };

    const lowPriority = {
      goal: makeGoal({ id: 'goal-low', targetKey: 'Venti', priority: 5 }),
      totalScore: 999,
      baseScore: 50,
      timeGatedBonus: 20,
      characterPriorityWeight: 10,
      resinPerRun: 20,
      sourceName: 'Forsaken Rift',
      isTimeGated: true,
      characterKey: 'Venti',
      characterScore: 90,
      resourceName: 'Teachings of Ballad',
    };

    const result = allocateResin([lowPriority, highPriority], 160);

    expect(result.route[0]!.goalId).toBe('goal-high');
    expect(result.route[0]!.runs).toBe(5);
    expect(result.route[0]!.resinCost).toBe(100);
    expect(result.route[1]!.goalId).toBe('goal-low');
    expect(result.unallocatedResin).toBe(0);
  });

  it('does not overspend resin beyond available amount', () => {
    const goal = {
      goal: makeGoal(),
      totalScore: 100,
      baseScore: 50,
      timeGatedBonus: 20,
      characterPriorityWeight: 30,
      resinPerRun: 20,
      sourceName: 'Taishan Mansion',
      isTimeGated: true,
      characterKey: 'HuTao',
      characterScore: 70,
      resourceName: 'Teachings of Diligence',
    };

    const result = allocateResin([goal], 50);
    expect(result.route[0]!.runs).toBe(2);
    expect(result.route[0]!.resinCost).toBe(40);
    expect(result.unallocatedResin).toBe(10);
  });

  it('skips goals where 0 runs can be afforded', () => {
    const goal = {
      goal: makeGoal({ goalType: GoalType.CHARACTER_ASCENSION }),
      totalScore: 100,
      baseScore: 50,
      timeGatedBonus: 0,
      characterPriorityWeight: 50,
      resinPerRun: 40,
      sourceName: 'World Boss',
      isTimeGated: false,
      characterKey: 'HuTao',
      characterScore: 50,
      resourceName: 'boss drops',
    };

    const result = allocateResin([goal], 30);
    expect(result.route).toHaveLength(0);
    expect(result.unallocatedResin).toBe(30);
  });
});

// -------------------------------------------------------
// PlannerIntelligenceService End-to-End Optimization Tests
// -------------------------------------------------------

describe('PlannerIntelligenceService (Multi-Objective Optimization Planner)', () => {
  let service: PlannerIntelligenceService;
  let mockContextProvider: { getForUser: ReturnType<typeof vi.fn> };
  let mockStockRepository: { readForUser: ReturnType<typeof vi.fn> };
  let mockRoutineService: { getSnapshot: ReturnType<typeof vi.fn> };

  // Tuesday in Asia server time (2026-11-10T10:00:00.000Z is Tuesday in UTC+8)
  const TUESDAY_SERVER_NOW = '2026-11-10T10:00:00.000Z';

  beforeEach(() => {
    vi.clearAllMocks();

    mockContextProvider = {
      getForUser: vi.fn().mockResolvedValue({
        context: {
          version: 1,
          scope: 'private_authenticated',
          uid: '800000001',
          accountId: 'acc-1',
          rosterScope: 'partial',
          completenessEvidence: null,
          absentCharacterOwnership: 'unknown',
          sources: ['stored_account'],
          oldestObservationAt: null,
          newestObservationAt: null,
          mixedObservationTimes: false,
          equipmentExclusivity: 'unverified',
          rejectedRecordCount: 0,
          freshnessPolicy: { maxAgeMs: 604800000, futureToleranceMs: 300000 },
          sourceTimestamps: [],
          missingData: [],
          characters: [],
          issues: [],
          fingerprint: 'fp-1',
          freshness: 'unknown',
        },
        rawRoster: [
          {
            id: 'char-hutao',
            accountId: 'acc-1',
            characterKey: 'HuTao',
            level: 80,
            ascension: 5,
            constellation: 1,
            talentNormal: 8,
            talentSkill: 8,
            talentBurst: 6,
            equippedWeaponId: 'weap-dragons-bane',
            equippedWeapon: {
              id: 'weap-dragons-bane',
              accountId: 'acc-1',
              weaponKey: 'DragonsBane',
              level: 80,
              ascension: 5,
              refinement: 1,
              locked: true,
              createdAt: new Date('2026-10-20T00:00:00.000Z'),
              updatedAt: new Date('2026-10-20T00:00:00.000Z'),
            },
            createdAt: new Date('2026-10-20T00:00:00.000Z'),
            updatedAt: new Date('2026-10-20T00:00:00.000Z'),
          },
        ],
        weapons: [],
        artifacts: [],
      }),
    };

    mockStockRepository = {
      readForUser: vi.fn().mockResolvedValue({
        inventory: {
          TeachingsOfDiligence: 1,
        },
        stockBasis: {
          kind: 'recorded_import',
          importedAt: '2026-11-09T00:00:00.000Z',
          source: 'GOOD',
          scope: 'replacement_section',
          suppliedEntryCount: 1,
        },
      }),
    };

    mockRoutineService = {
      getSnapshot: vi.fn().mockResolvedValue({
        contractVersion: 2,
        revision: 1,
        serverId: 'asia',
        clockStatus: 'verified',
        serverNow: TUESDAY_SERVER_NOW,
        period: {
          dailyPeriodId: 'daily-asia-2026-11-10',
          dailyResetAt: '2026-11-10T20:00:00.000Z',
          weeklyPeriodId: 'weekly-asia-2026-11-08',
          weeklyResetAt: '2026-11-15T20:00:00.000Z',
        },
        resin: {
          known: true,
          currentAmount: 160,
          maxAmount: 200,
          capAt: '2026-11-10T15:20:00.000Z',
          recordedAt: '2026-11-10T09:00:00.000Z',
        },
        tasks: [],
        weeklyClaims: { available: true, remainingClaims: 3 },
        legacySummary: null,
      }),
    };

    vi.mocked(prisma.genshinPlanPreferences.findUnique).mockResolvedValue({
      userId: 'user-1',
      revision: 1,
      dailyResinBudget: 120,
      commissions: true,
      teapot: true,
      transformer: false,
      weeklyClaims: true,
    });

    vi.mocked(prisma.genshinPlanDismissal.findMany).mockResolvedValue([]);

    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValue([
      makeGoal({
        id: 'goal-hutao-burst',
        targetKey: 'HuTao',
        goalType: GoalType.CHARACTER_TALENT,
        talentType: 'burst',
        fromPhase: 6,
        toPhase: 8,
        priority: 1,
      }),
      makeGoal({
        id: 'goal-dragons-bane-asc',
        targetKey: 'DragonsBane',
        goalType: GoalType.WEAPON_ASCENSION,
        talentType: null,
        fromPhase: 4,
        toPhase: 5,
        priority: 2,
      }),
      makeGoal({
        id: 'goal-homa-asc',
        targetKey: 'StaffOfHoma',
        goalType: GoalType.WEAPON_ASCENSION,
        talentType: null,
        fromPhase: 4,
        toPhase: 5,
        priority: 3,
      }),
    ]);

    service = new PlannerIntelligenceService(
      mockContextProvider as unknown as AccountContextProvider,
      mockStockRepository as unknown as GenshinRecordedStockRepository,
      mockRoutineService as unknown as RoutineService,
    );
  });

  it('generates a schema-valid OptimizationPlannerResponse integrating stock deficits, dailyResinBudget, marginal ROI, and alternatives', async () => {
    const plan = await service.getOptimizedPlan('user-1', {
      timeBudgetMinutes: 25,
    });

    expect(optimizationPlannerResponseSchema.safeParse(plan).success).toBe(true);
    expect(plan.currentResin).toBe(160);
    // Respects dailyResinBudget = 120 from GenshinPlanPreferences
    expect(plan.effectiveResinBudget).toBe(120);
    expect(plan.timeBudgetMinutes).toBe(25);
    expect(plan.rankedPlan.length).toBeGreaterThan(0);

    const topAction = plan.rankedPlan[0]!;
    expect(topAction.targetKey).toBe('HuTao');
    expect(topAction.domainName).toContain('Taishan Mansion');
    expect(topAction.timeGated).toBe(true);
    expect(topAction.materialDeficitRatio).toBeGreaterThan(0);
    expect(topAction.efficiencyScore).toBeGreaterThan(0);
    expect(topAction.explanations.length).toBeGreaterThan(0);

    // Alternatives include condensed speedrun and secondary goal
    expect(plan.alternatives.some((a) => a.kind === 'speedrun_condensed')).toBe(true);
    expect(plan.alternatives.some((a) => a.kind === 'secondary_goal')).toBe(true);
  });

  it('skips farming a goal in getRecommendations when recorded stock already covers 100% of required materials', async () => {
    mockStockRepository.readForUser.mockResolvedValueOnce({
      inventory: {
        // Cover all Diligence books for HuTao phase 6 -> 8
        TeachingsOfDiligence: 99,
        GuideToDiligence: 99,
        PhilosophiesOfDiligence: 99,
      },
      stockBasis: {
        kind: 'recorded_import',
        importedAt: '2026-11-09T00:00:00.000Z',
        source: 'GOOD',
        scope: 'replacement_section',
        suppliedEntryCount: 3,
      },
    });

    const rec = await service.getRecommendations('user-1');

    // HuTao goal is skipped because D_a = 0; DragonsBane goal receives the Resin allocation instead
    expect(rec.route.every((r) => r.goalId !== 'goal-hutao-burst')).toBe(true);
    expect(rec.route[0]?.goalId).toBe('goal-dragons-bane-asc');
  });

  it('autonomously discovers progression candidates and generates a valid plan when account has 0 manual goals', async () => {
    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValueOnce([]);

    const plan = await service.getOptimizedPlan('user-1');

    expect(optimizationPlannerResponseSchema.safeParse(plan).success).toBe(true);
    expect(plan.rankedPlan.length).toBeGreaterThan(0);
    // Discovered candidates have null goalId
    expect(plan.rankedPlan.every((action) => action.goalId === null)).toBe(true);
    expect(plan.rankedPlan.some((action) => action.actionId.includes('auto-'))).toBe(true);

    // Also test getRecommendations with 0 manual goals
    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValueOnce([]);
    const rec = await service.getRecommendations('user-1');

    expect(rec.goals.length).toBeGreaterThan(0);
    expect(rec.goals.every((g) => g.goalId.startsWith('auto-'))).toBe(true);
    expect(rec.route.length).toBeGreaterThan(0);
    expect(rec.route[0]?.goalId).toContain('auto-');
  });

  it('preserves legacy 422 behavior in getRecommendations when goals exist in DB but all are completed/archived/paused', async () => {
    vi.mocked(prisma.upgradeGoal.findMany).mockResolvedValueOnce([
      {
        id: 'archived-goal-1',
        userId: 'user-1',
        goalType: 'CHARACTER_TALENT',
        targetKey: 'HuTao',
        fromPhase: 1,
        toPhase: 6,
        talentType: 'normal',
        status: 'archived',
        priority: 1,
        revision: 1,
        completedAt: null,
        completionReason: null,
        predecessorId: null,
        createRequestId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(service.getRecommendations('user-1')).rejects.toThrow(
      'No active goals. Your routine remains available; manage goals in the Planner.',
    );
  });

  it('marks inventoryStatus as unknown when materials are unrecorded and reflects this in plan explanations', async () => {
    mockStockRepository.readForUser.mockResolvedValueOnce({
      inventory: {},
      stockBasis: {
        kind: 'recorded_import',
        importedAt: null,
        source: null,
        scope: null,
        suppliedEntryCount: null,
      },
    });

    const plan = await service.getOptimizedPlan('user-1');

    expect(plan.rankedPlan.length).toBeGreaterThan(0);
    expect(plan.rankedPlan[0]?.inventoryStatus).toBe('unknown');
    expect(
      plan.rankedPlan[0]?.explanations.some((exp) =>
        exp.includes('inventory stock unrecorded; assuming full deficit'),
      ),
    ).toBe(true);
  });
});
