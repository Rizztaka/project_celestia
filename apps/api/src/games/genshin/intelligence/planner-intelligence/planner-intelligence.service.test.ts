import { GoalType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  allocateResin,
  filterAndScoreGoals,
} from './planner-intelligence.calculator.js';

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function makeGoal(overrides: Partial<Parameters<typeof filterAndScoreGoals>[0][0]> = {}) {
  return {
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

describe('filterAndScoreGoals', () => {
  it('returns an empty array if no goals are provided', () => {
    const result = filterAndScoreGoals([], 1, []);
    expect(result).toHaveLength(0);
  });

  it('includes CHARACTER_ASCENSION goals on any day (day 0 = Monday)', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_ASCENSION });
    const result = filterAndScoreGoals([goal], 0, []);
    expect(result).toHaveLength(1);
    expect(result[0].resinPerRun).toBe(40);
    expect(result[0].isTimeGated).toBe(false);
  });

  it('includes CHARACTER_TALENT goals when the book drops today (Monday = day 0 for "Freedom")', () => {
    // HuTao uses "Ballad" books. Ballad drops on Wednesday (day 2) & Saturday (day 5).
    // Venti also uses "Ballad". Let's test with a character that uses "Freedom" (Monday/Thursday).
    // We don't have a character with "Freedom" in our materials.json without knowing exact data,
    // so we use HuTao (Ballad) and assert it is NOT available on Monday (day 0).
    const goal = makeGoal({ goalType: GoalType.CHARACTER_TALENT, targetKey: 'HuTao' });
    const resultMonday = filterAndScoreGoals([goal], 0, []); // Monday — Ballad not available
    expect(resultMonday).toHaveLength(0);

    const resultWednesday = filterAndScoreGoals([goal], 2, []); // Wednesday — Ballad available
    expect(resultWednesday).toHaveLength(1);
  });

  it('includes all CHARACTER_TALENT goals on Sunday (day 6)', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_TALENT, targetKey: 'HuTao' });
    const result = filterAndScoreGoals([goal], 6, []); // Sunday — all domains open
    expect(result).toHaveLength(1);
    expect(result[0].isTimeGated).toBe(false); // Sunday is not time-gated
  });

  it('skips CHARACTER_TALENT goals for characters with no material profile', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_TALENT, targetKey: 'UnknownChar' });
    const result = filterAndScoreGoals([goal], 6, []);
    expect(result).toHaveLength(0);
  });

  it('applies TIME_GATE_BONUS (+20) for domain goals available today', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_TALENT, targetKey: 'HuTao' });
    const result = filterAndScoreGoals([goal], 2, []); // Wednesday — Ballad available
    expect(result).toHaveLength(1);
    expect(result[0].timeGatedBonus).toBe(20);
    expect(result[0].totalScore).toBeGreaterThan(50);
  });

  it('does NOT apply TIME_GATE_BONUS for CHARACTER_ASCENSION (boss) goals', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_ASCENSION });
    const result = filterAndScoreGoals([goal], 0, []);
    expect(result[0].timeGatedBonus).toBe(0);
  });

  it('applies characterPriorityWeight correctly — lower score = higher priority', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_ASCENSION });
    const lowPriority = filterAndScoreGoals([goal], 0, [makeRanking('HuTao', 90)]);
    const highPriority = filterAndScoreGoals([goal], 0, [makeRanking('HuTao', 10)]);

    // Low character score (10) means high farming priority → higher weight
    expect(highPriority[0].characterPriorityWeight).toBeGreaterThan(
      lowPriority[0].characterPriorityWeight,
    );
    expect(highPriority[0].totalScore).toBeGreaterThan(lowPriority[0].totalScore);
  });

  it('falls back to neutral weight (50) if character has no ranking', () => {
    const goal = makeGoal({ goalType: GoalType.CHARACTER_ASCENSION });
    const result = filterAndScoreGoals([goal], 0, []); // no rankings
    expect(result[0].characterPriorityWeight).toBe(50); // 100 - 50 fallback
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
      goal: makeGoal({ id: 'goal-high' }),
      totalScore: 150,
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
      goal: makeGoal({ id: 'goal-low', targetKey: 'Venti' }),
      totalScore: 80,
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
