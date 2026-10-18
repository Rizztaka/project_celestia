import { randomUUID } from 'node:crypto';

import {
  dailyResinBudgetSchema,
  type GoalAdvice,
  type GoalRecord,
  planCommandSchema,
  type PlanSnapshot,
  type RecordedStockSnapshot,
} from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';
import { composePlanAdvice } from './plan-composition.js';

// Explicitly synthetic verified facts. These values are NOT catalog evidence.
class SyntheticProvider extends GenshinCompanionProvider {
  constructor(
    private readonly overrides: Partial<{
      cost: number;
      closed: boolean;
      unavailable: boolean;
      conflict: boolean;
    }> = {},
  ) {
    super();
  }
  override getGoalAdvice(goal: GoalRecord): GoalAdvice {
    if (this.overrides.unavailable || goal.targetKey === 'Unavailable')
      return { available: false, reason: 'Synthetic missing costs.' };
    return {
      available: true,
      costs: { Shared: 6, Mora: 10 },
      sources: [],
      route: {
        available: true,
        domain: {
          domainKey: goal.targetKey === 'SecondSource' ? 'synthetic-second' : 'synthetic-shared',
          name: 'SYNTHETIC verified test route',
          location: 'test only',
          days: this.overrides.closed ? [] : [0, 1, 2, 3, 4, 5, 6],
          drops: ['Shared material'],
          dropKeys: ['Shared'],
          resinPerClaim:
            this.overrides.conflict && goal.talentType === 'skill' ? 7 : (this.overrides.cost ?? 7),
        },
      },
    };
  }
}
const now = new Date('2026-10-05T00:00:00Z');
const goal = (extra: Partial<GoalRecord> = {}): GoalRecord => ({
  id: randomUUID(),
  goalType: 'CHARACTER_TALENT',
  targetKey: 'HuTao',
  talentType: 'normal',
  fromPhase: 1,
  toPhase: 6,
  priority: 3,
  revision: 0,
  status: 'active',
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
  completedAt: null,
  completionReason: null,
  predecessorId: null,
  needsReview: false,
  limitations: [],
  ...extra,
});
const stock = (inventory: Record<string, number> = {}): RecordedStockSnapshot => ({
  inventory,
  stockBasis: {
    kind: 'recorded_import',
    source: 'synthetic import',
    importedAt: null,
    scope: null,
    suppliedEntryCount: null,
  },
});
function setup(
  goals = [goal()],
  budget: number | null = 100,
  resin: number | null = 90,
  provider: GenshinCompanionProvider = new SyntheticProvider(),
) {
  const routine = provider.projectSnapshot({
    routineRow: {
      userId: 'synthetic',
      revision: 0,
      serverId: 'asia',
      dailyPeriodStart: null,
      commissionsDone: false,
      teapotChecked: false,
      transformerLastUsedAt: null,
      resinAmount: resin,
      resinRecordedAt: resin === null ? null : now,
      weeklyPeriodStart: null,
      weeklyRewardClaims: null,
      createdAt: now,
      updatedAt: now,
    },
    legacySummary: null,
    now,
  });
  const plan: PlanSnapshot = {
    contractVersion: 1,
    revision: 0,
    serverNow: now.toISOString(),
    routineRevision: 0,
    serverId: 'asia',
    period: routine.period,
    preferences: { enabledRoutineKinds: [], dailyResinBudget: budget },
    goalRevisions: goals.map(({ id, revision }) => ({ id, revision })),
    goals: goals.map((g) => ({ goal: g, dismissed: [] })),
    routines: [],
    weekly: { available: true, rewardClaims: null },
  };
  return {
    plan,
    routine,
    provider,
    run: (inventory = stock()) => composePlanAdvice(plan, routine, inventory, provider),
  };
}
describe('C4 deterministic composition and accounting', () => {
  it('uses the same crafting deficits in Today allocations and the materials summary', () => {
    const g = goal({ fromPhase: 9, toPhase: 10 });
    const result = setup([g], 100, 100, new GenshinCompanionProvider()).run(
      stock({
        TeachingsOfDiligence: 144,
        PhilosophiesOfDiligence: 0,
        EnergyNectar: 12,
        ShardOfAFoulLegacy: 2,
        CrownOfInsight: 1,
        Mora: 700000,
      }),
    );
    expect(result.materials.delta.PhilosophiesOfDiligence).toBe(0);
    expect(result.goalDemand[0]).toMatchObject({
      state: 'covered',
      deficits: { PhilosophiesOfDiligence: 0 },
    });
    expect(result.sources).toEqual([]);
  });
  it('subtracts shared stock once, retains Mora, and attributes in stable priority order', () => {
    const a = goal({ priority: 1 }),
      b = goal({ talentType: 'skill', priority: 2 });
    const result = setup([b, a]).run(stock({ Shared: 8, Mora: 5 }));
    expect(result.materials.needed).toEqual({ Shared: 12, Mora: 20 });
    expect(result.materials.delta).toEqual({ Shared: 4, Mora: 15 });
    expect(result.goalDemand.map((item) => item.deficits)).toEqual([
      { Shared: 0, Mora: 5 },
      { Shared: 4, Mora: 10 },
    ]);
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]).toMatchObject({ claims: 12, resin: 84, goalIds: [b.id] });
  });
  it('groups two compatible goals into one paid source, never a paid claim per goal', () => {
    const a = goal(),
      b = goal({ talentType: 'skill' });
    const result = setup([a, b], 70, 200).run(stock({ Shared: 1, Mora: 1 }));
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]?.goalIds).toHaveLength(2);
    expect(result.allocatedResin).toBe(70);
    expect(result.sources[0]?.claims).toBe(10);
  });
  it('has no historical per-goal run cap, score or yield fallback', () => {
    const result = setup([goal()], 200, 200, new SyntheticProvider({ cost: 1 })).run(
      stock({ Shared: 1 }),
    );
    expect(result.sources[0]?.claims).toBe(200);
    expect(result.allocatedResin).toBe(200);
    expect(result).not.toHaveProperty('completionDate');
  });
  it('uses creation time then ID for ties and returns identical repeated reads without mutations', () => {
    const a = goal({ id: 'a' }),
      b = goal({ id: 'b' }),
      early = goal({ id: 'z', createdAt: '2026-09-01T00:00:00Z' });
    const fixture = setup([b, early, a]);
    const before = JSON.stringify(fixture.plan);
    const result = fixture.run(stock({ Shared: 1 }));
    expect(result.goalDemand.map((item) => item.goalId)).toEqual(['z', 'a', 'b']);
    expect(fixture.run(stock({ Shared: 1 }))).toEqual(result);
    expect(JSON.stringify(fixture.plan)).toBe(before);
  });
  it('priority precedes availability without inventing a missing ordering value', () => {
    const unavailable = goal({ priority: 1, targetKey: 'Unavailable' });
    const result = setup([goal({ priority: 5 }), unavailable]).run(stock({ Shared: 1 }));
    expect(result.goalDemand[0]).toMatchObject({ goalId: unavailable.id, state: 'unavailable' });
    expect(result.materials.neededComplete).toBe(false);
    expect(result.materials.needed.Mora).toBe(10);
  });
  it.each([
    [0, 100, 0],
    [6, 100, 0],
    [7, 100, 7],
    [8, 100, 7],
    [100, 7, 7],
    [100, 0, 0],
  ])(
    'bounds budget %s by available resin %s, exact whole claim = %s',
    (budget, resin, expected) => {
      const result = setup([goal()], budget, resin).run(stock({ Shared: 1 }));
      expect(result.allocatedResin).toBe(expected);
      expect(result.sources.every((source) => Number.isInteger(source.claims))).toBe(true);
      expect(result.allocatedResin).toBeLessThanOrEqual(Math.min(budget, resin));
    },
  );
  it.each([
    [null, 80],
    [80, null],
    [null, null],
  ])('does not fund with missing budget/resin (%s/%s)', (budget, resin) => {
    const result = setup([goal()], budget, resin).run(stock({ Shared: 1 }));
    expect(result.ceiling).toBeNull();
    expect(result.allocatedResin).toBe(0);
  });
  it('unknown stock only provides route information, never a deficit or covered claim', () => {
    const result = setup().run();
    expect(result.materials.delta).toEqual({ Shared: null, Mora: null });
    expect(result.goalDemand[0]?.state).toBe('unknown');
    expect(result.sources[0]).toMatchObject({ claims: 0, resin: 0 });
    expect(result.sources[0]?.reason).toContain('Route information only');
  });
  it('covered stock never auto-completes the goal', () => {
    const fixture = setup();
    const result = fixture.run(stock({ Shared: 60, Mora: 100 }));
    expect(result.goalDemand[0]?.state).toBe('covered');
    expect(result.materials.delta).toEqual({ Shared: 0, Mora: 0 });
    expect(result.sources).toEqual([]);
    expect(fixture.plan.goals[0]?.goal.status).toBe('active');
  });
  it('dismissed and collapsed demand remains in total accounting while selected allocation is separate', () => {
    const fixture = setup([
      goal({ priority: 1 }),
      goal({ priority: 2, talentType: 'skill' }),
      goal({ priority: 3, talentType: 'burst' }),
      goal({ priority: 4 }),
    ]);
    fixture.plan.goals[0]!.dismissed = ['day'];
    const result = fixture.run(stock({ Shared: 8, Mora: 5 }));
    expect(result.materials.needed.Shared).toBe(24);
    expect(result.materials.delta.Shared).toBe(16);
    expect(result.sources[0]?.goalIds).not.toContain(fixture.plan.goals[0]!.goal.id);
    expect(result.goalDemand.reduce((sum, item) => sum + (item.deficits.Shared ?? 0), 0)).toBe(16);
  });
  it('paused, completed, archived, duplicate and malformed goals add no demand', () => {
    const result = setup([
      goal({ status: 'paused' }),
      goal({ status: 'completed' }),
      goal({ status: 'archived' }),
      goal({ needsReview: true }),
      goal({ fromPhase: -2, talentType: 'bad' }),
    ]).run();
    expect(result.materials.needed).toEqual({});
    expect(result.materials.neededComplete).toBe(false);
    expect(result.goalDemand).toHaveLength(2);
    expect(result.allocatedResin).toBe(0);
  });
  it('shared material has only one paid source when two alternative sources offer it', () => {
    const result = setup([
      goal({ priority: 1 }),
      goal({ priority: 2, targetKey: 'SecondSource' }),
    ]).run(stock({ Shared: 1 }));
    expect(result.sources).toHaveLength(1);
    expect(result.sources[0]?.domain.domainKey).toBe('synthetic-shared');
  });
  it('contradictory shared-source metadata fails closed', () => {
    const result = setup(
      [goal(), goal({ talentType: 'skill' })],
      100,
      100,
      new SyntheticProvider({ conflict: true, cost: 8 }),
    ).run(stock({ Shared: 1 }));
    expect(result.sources).toEqual([]);
    expect(result.allocatedResin).toBe(0);
  });
  it.each([0, -1, 2.5, Infinity, NaN])('rejects invalid claim cost %s without fallback', (cost) => {
    const result = setup([goal()], 100, 100, new SyntheticProvider({ cost })).run(
      stock({ Shared: 1 }),
    );
    expect(result.sources).toEqual([]);
  });
  it('closed weekday and unsupported clock never allocate', () => {
    expect(
      setup([goal()], 100, 100, new SyntheticProvider({ closed: true })).run(stock({ Shared: 1 }))
        .sources,
    ).toEqual([]);
    const fixture = setup();
    fixture.plan.period = null;
    expect(fixture.run(stock({ Shared: 1 })).sources).toEqual([]);
  });
  it('production costs include Mora while routes/events/deadlines remain unavailable', () => {
    const production = new GenshinCompanionProvider();
    const fixture = setup();
    const result = composePlanAdvice(fixture.plan, fixture.routine, stock(), production);
    expect(result.materials.needed.Mora).toBe(122500);
    expect(result.sources).toEqual([]);
    expect(result.allocatedResin).toBe(0);
    expect(production.getEventsData().events).toEqual([]);
    expect(production.getWeeklyBossesData().bosses).toEqual([]);
    expect(result).not.toHaveProperty('deadlines');
  });
});
describe('C4 strict shared write contracts', () => {
  it.each([-1, 0.5, 201, 2147483647, Infinity, -Infinity, NaN, '20', undefined])(
    'rejects invalid budget %s',
    (value) => {
      expect(dailyResinBudgetSchema.safeParse(value).success).toBe(false);
    },
  );
  it.each([null, 0, 200])('allows explicit %s budget', (value) =>
    expect(dailyResinBudgetSchema.parse(value)).toBe(value),
  );
  it('rejects unknown fields, duplicate/unsupported routines and identity injection', () => {
    const request = {
      contractVersion: 1,
      expectedRevision: 0,
      action: 'preferences',
      preferences: { enabledRoutineKinds: [], dailyResinBudget: null },
    };
    expect(planCommandSchema.safeParse(request).success).toBe(true);
    for (const bad of [
      { ...request, userId: 'foreign' },
      { ...request, expectedRevision: -1 },
      {
        ...request,
        preferences: { ...request.preferences, enabledRoutineKinds: ['teapot', 'teapot'] },
      },
      { ...request, preferences: { ...request.preferences, enabledRoutineKinds: ['events'] } },
    ])
      expect(planCommandSchema.safeParse(bad).success).toBe(false);
  });
});
