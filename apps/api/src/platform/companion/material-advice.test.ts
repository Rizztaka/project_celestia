import type { AdviceGoalInput, GoalAdvice, RecordedStockSnapshot } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { GenshinCompanionProvider } from '../../games/genshin/companion/genshin-companion.provider.js';
import { projectMaterialAccounting, projectMaterialAdvice } from './material-advice.js';

const goal: AdviceGoalInput = {
  id: 'one',
  targetKey: 'HuTao',
  goalType: 'CHARACTER_TALENT',
  talentType: 'normal',
  fromPhase: 1,
  toPhase: 10,
};
const stock = (inventory: Record<string, number>): RecordedStockSnapshot => ({
  inventory,
  stockBasis: {
    kind: 'recorded_import',
    importedAt: null,
    source: null,
    scope: null,
    suppliedEntryCount: null,
  },
});
const entry = (costs: Record<string, number>, id = 'one') => ({
  goal: { ...goal, id },
  advice: {
    available: true,
    costs,
    conversionGroups: [['Low', 'Mid', 'High']],
    sources: [],
    route: { available: false, reason: 'Synthetic' },
  } as GoalAdvice,
});

describe('shared 3:1 material accounting', () => {
  it('reserves lower demand before converting surplus through multiple tiers', () => {
    const result = projectMaterialAdvice(
      [entry({ High: 4, Low: 3, Mid: 2 })],
      stock({ Low: 39, Mid: 2, High: 0 }),
    );
    expect(result.delta).toEqual({ High: 0, Low: 0, Mid: 0 });
    expect(result.inventory).toEqual({ Low: 39, Mid: 2, High: 0 });
  });
  it('uses whole conversions and never breaks higher-tier items down', () => {
    expect(
      projectMaterialAdvice([entry({ High: 1 })], stock({ Low: 8, Mid: 0, High: 0 })).delta.High,
    ).toBe(1);
    expect(projectMaterialAdvice([entry({ Low: 1 })], stock({ Low: 0, High: 100 })).delta.Low).toBe(
      1,
    );
  });
  it('spends shared stock once and protects later lower-tier goals', () => {
    const result = projectMaterialAccounting(
      [entry({ High: 1 }), entry({ Mid: 2 }, 'two')],
      stock({ Low: 9, Mid: 2, High: 0 }),
    );
    expect(result.goalDeficits).toEqual([{ High: 0 }, { Mid: 0 }]);
    expect(result.materials.delta).toEqual({ High: 0, Mid: 0 });
    const shared = projectMaterialAccounting(
      [entry({ High: 1 }), entry({ High: 1 }, 'two')],
      stock({ Low: 9, High: 0 }),
    );
    expect(shared.goalDeficits).toEqual([{ High: 0 }, { High: 1 }]);
    expect(shared.materials.delta.High).toBe(1);
  });
  it('reserves intermediate demand even when that tier must itself be crafted', () => {
    const result = projectMaterialAccounting(
      [entry({ High: 2 }), entry({ Mid: 2 }, 'two')],
      stock({ Low: 18, Mid: 0, High: 0 }),
    );
    expect(result.goalDeficits).toEqual([{ High: 1 }, { Mid: 0 }]);
  });
  it('keeps unknown stock explicit unless known lower tiers cover the whole need', () => {
    expect(projectMaterialAdvice([entry({ High: 1 })], stock({ Low: 8 })).delta.High).toBeNull();
    expect(projectMaterialAdvice([entry({ High: 1 })], stock({ Low: 9 })).delta.High).toBe(0);
    expect(projectMaterialAdvice([entry({ High: 1 })], stock({})).delta.High).toBeNull();
  });
  it('returns goal-first planning totals with no inventory and credits partial known stock once', () => {
    const none = projectMaterialAdvice([entry({ High: 2, Mora: 100 })], stock({}));
    expect(none.planningDelta).toEqual({ High: 2, Mora: 100 });
    expect(none.delta).toEqual({ High: null, Mora: null });
    expect(none.inventory).toEqual({});
    const partial = projectMaterialAccounting(
      [entry({ High: 2 }), entry({ High: 1 }, 'two')],
      stock({ Low: 9 }),
    );
    expect(partial.materials.planningDelta).toEqual({ High: 2 });
    expect(partial.materials.delta.High).toBeNull();
    expect(partial.materials.inventory).toEqual({ Low: 9 });
  });
  it('includes non-demanded lower inventory and leaves inputs unchanged across repeated reads', () => {
    const entries = [entry({ High: 2, Mora: 100 })];
    const recorded = stock({ Low: 27, Mora: 80 });
    const before = structuredClone({ entries, recorded });
    expect(projectMaterialAdvice(entries, recorded).delta).toEqual({ High: 0, Mora: 20 });
    expect(projectMaterialAdvice(entries, recorded)).toEqual(
      projectMaterialAdvice(entries, recorded),
    );
    expect({ entries, recorded }).toEqual(before);
  });
  it('joins real talent, gem, common and weapon families without converting crowns or Mora', () => {
    const provider = new GenshinCompanionProvider();
    const advice = provider.getGoalAdvice(goal);
    if (!advice.available) throw new Error(advice.reason);
    expect(advice.conversionGroups).toContainEqual([
      'TeachingsOfDiligence',
      'GuideToDiligence',
      'PhilosophiesOfDiligence',
    ]);
    expect(advice.conversionGroups).toContainEqual([
      'WhopperflowerNectar',
      'ShimmeringNectar',
      'EnergyNectar',
    ]);
    expect(advice.conversionGroups).toContainEqual([
      'AgnidusAgateSliver',
      'AgnidusAgateFragment',
      'AgnidusAgateChunk',
      'AgnidusAgateGemstone',
    ]);
    expect(advice.conversionGroups).toContainEqual([
      'GrainOfAerosiderite',
      'PieceOfAerosiderite',
      'BitOfAerosiderite',
      'ChunkOfAerosiderite',
    ]);
    expect(advice.conversionGroups?.flat()).not.toContain('CrownOfInsight');
    expect(advice.conversionGroups?.flat()).not.toContain('BrilliantDiamondSliver');
    expect(advice.conversionGroups?.flat()).not.toContain('Mora');
    const high = provider.getGoalAdvice({ ...goal, fromPhase: 9 });
    expect(
      projectMaterialAdvice(
        [{ goal, advice: high }],
        stock({ TeachingsOfDiligence: 144, PhilosophiesOfDiligence: 0 }),
      ).delta.PhilosophiesOfDiligence,
    ).toBe(0);
  });
  it('rejects contradictory and cyclic conversion metadata', () => {
    const cyclic = entry({ High: 1 });
    if (!cyclic.advice.available) throw new Error();
    cyclic.advice.conversionGroups = [
      ['Low', 'High'],
      ['High', 'Low'],
    ];
    expect(() => projectMaterialAdvice([cyclic], stock({}))).toThrow('Cyclic');
  });
});
