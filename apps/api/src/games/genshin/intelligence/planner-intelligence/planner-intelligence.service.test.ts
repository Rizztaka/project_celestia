import { GoalType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import { GenshinCompanionProvider } from '../../companion/genshin-companion.provider.js';
import { allocateResin, filterAndScoreGoals } from './planner-intelligence.calculator.js';

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
    fromPhase: 0,
    toPhase: 6,
    talentType: 'burst',
    createdAt: new Date(),
    updatedAt: new Date(),
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

// -------------------------------------------------------
// filterAndScoreGoals
// -------------------------------------------------------

companionRegistry.register(new GenshinCompanionProvider());
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

// -------------------------------------------------------
// allocateResin
// -------------------------------------------------------

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

    expect(result.route[0].goalId).toBe('goal-high');
    expect(result.route[0].runs).toBe(5); // MAX_RUNS_PER_GOAL
    expect(result.route[0].resinCost).toBe(100);
    expect(result.route[1].goalId).toBe('goal-low');
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

    // Only 50 resin available → can afford 2 runs (40 resin), not 5
    const result = allocateResin([goal], 50);
    expect(result.route[0].runs).toBe(2);
    expect(result.route[0].resinCost).toBe(40);
    expect(result.unallocatedResin).toBe(10);
  });

  it('skips goals where 0 runs can be afforded', () => {
    const goal = {
      goal: makeGoal({ goalType: GoalType.CHARACTER_ASCENSION }),
      totalScore: 100,
      baseScore: 50,
      timeGatedBonus: 0,
      characterPriorityWeight: 50,
      resinPerRun: 40, // boss cost
      sourceName: 'World Boss',
      isTimeGated: false,
      characterKey: 'HuTao',
      characterScore: 50,
      resourceName: 'boss drops',
    };

    // 30 resin — cannot afford a 40-resin boss run
    const result = allocateResin([goal], 30);
    expect(result.route).toHaveLength(0);
    expect(result.unallocatedResin).toBe(30);
  });
});
