import { describe, expect, it } from 'vitest';

import {
  estimateYield,
  optimizeStops,
  paceFamilies,
  routeDistance,
} from './farming-intelligence.calculator.js';

describe('Mean-yield planning with directional crafting', () => {
  it('crafts upwards three-to-one, without downgrading rare material', () => {
    expect(estimateYield([0, 0, 1], [0, 0, 0], [3, 0, 0])).toMatchObject({
      planningRuns: 3,
      resin: 60,
      meanDrops: [9, 0, 0],
    });
    expect(estimateYield([1, 0, 0], [0, 0, 1], [1, 0, 0]).planningRuns).toBe(1);
    expect(estimateYield([0, 0, 1], [9, 0, 0], null)).toMatchObject({
      state: 'covered',
      planningRuns: 0,
      resin: 0,
    });
  });
  it('reserves lower-tier demand before crafting its surplus', () => {
    expect(estimateYield([1, 0, 1], [9, 0, 0], [1, 0, 0]).planningRuns).toBe(1);
    expect(estimateYield([0, 0, 0, 1], [26, 0, 0, 0], [1, 0, 0, 0]).planningRuns).toBe(1);
  });
  it('preserves unknown required inventory and missing difficulty', () => {
    expect(estimateYield([3, 0, 0], [null, 0, 0], [2.52, 0, 0]).state).toBe('unknown_stock');
    expect(estimateYield([3, 0, 0], [0, 0, 0], null).state).toBe('difficulty_required');
    expect(estimateYield([0, 0, 1], [null, null, 0], [0, 0, 1]).planningRuns).toBe(1);
  });
  it('uses integer reward sets rather than fractional runs or a mean stopping-time promise', () => {
    expect(estimateYield([3, 0, 0], [1, 0, 0], [2.197, 1.977, 0.227])).toMatchObject({
      planningRuns: 1,
      resin: 20,
    });
    expect(estimateYield([4, 0, 0], [1, 0, 0], [2.197, 1.977, 0.227])).toMatchObject({
      planningRuns: 2,
      resin: 40,
    });
  });
  it('bounds impossible and enormous demands', () => {
    expect(estimateYield([1], [0], [0]).state).toBe('limit');
    expect(estimateYield([Number.MAX_SAFE_INTEGER], [0], [1]).state).toBe('limit');
  });
  it.each([
    [[-1], [0], [1]],
    [[1.2], [0], [1]],
    [[1], [-1], [1]],
    [[1], [0], [Infinity]],
    [[1], [0], [-1]],
    [[1, 2], [0], [1]],
  ])('rejects invalid numeric input %j', (needed, stock, rates) => {
    expect(() => estimateYield(needed, stock, rates)).toThrow(RangeError);
  });
  it('is monotone in required quantities and never mutates inputs', () => {
    const stock = Object.freeze([1, 2, 3]);
    const rates = Object.freeze([2.197, 1.977, 0.227]);
    let previous = 0;
    for (let n = 4; n < 200; n++) {
      const result = estimateYield([0, 0, n], [...stock], [...rates]);
      expect(result.planningRuns).toBeGreaterThanOrEqual(previous);
      previous = result.planningRuns!;
    }
    expect(stock).toEqual([1, 2, 3]);
  });
});
describe('Shared-budget weekday pacing', () => {
  it('starts at the next server reset and waits for a closed source', () => {
    const result = paceFamilies([{ key: 'talent', days: [1, 4, 6], runs: 3 }], 40, 0);
    expect(result.calendarDays).toBe(4);
    expect(result.days.filter((d) => d.resin)).toEqual([
      { offset: 1, weekday: 1, resin: 40, allocations: [{ domainKey: 'talent', runs: 2 }] },
      { offset: 4, weekday: 4, resin: 20, allocations: [{ domainKey: 'talent', runs: 1 }] },
    ]);
  });
  it('shares one daily ceiling across families rather than giving each the full budget', () => {
    const result = paceFamilies(
      [
        { key: 'a', days: [0, 1, 2, 3, 4, 5, 6], runs: 3 },
        { key: 'b', days: [0, 1, 2, 3, 4, 5, 6], runs: 3 },
      ],
      60,
      6,
    );
    expect(result.calendarDays).toBe(2);
    expect(result.days.map((d) => d.resin)).toEqual([60, 60]);
    expect(result.days[0]?.allocations).toEqual([{ domainKey: 'a', runs: 3 }]);
  });
  it('does not spend leftover resin that cannot fund a reward set', () => {
    expect(
      paceFamilies([{ key: 'a', days: [0, 1, 2, 3, 4, 5, 6], runs: 2 }], 39, 0).calendarDays,
    ).toBe(2);
    expect(paceFamilies([{ key: 'a', days: [1], runs: 1 }], 19, 0).state).toBe('unavailable');
    expect(paceFamilies([], null, null).calendarDays).toBeNull();
    expect(paceFamilies([], 20, 0).calendarDays).toBe(0);
  });
  it('handles Sunday rollover and a bounded long horizon', () => {
    expect(paceFamilies([{ key: 'a', days: [0], runs: 1 }], 20, 6).calendarDays).toBe(1);
    const result = paceFamilies([{ key: 'a', days: [0], runs: 1000000 }], 20, 6);
    expect(result.state).toBe('exceeds_horizon');
    expect(result.days).toHaveLength(28);
  });
});
describe('Coordinate stop ordering', () => {
  const p = (id: string, x: number, y: number) => ({ id, x, y, landmark: id });
  const start = p('start', 0, 0);
  it('uses actual points once, retains the chosen start, and improves or preserves the baseline', () => {
    const points = [p('a', 1, 1), p('b', 8, 1), p('c', 5, 5), p('d', 1, 8), p('e', 8, 8)];
    const before = JSON.stringify(points);
    const route = optimizeStops(start, points, 5);
    expect(route.stops.map((p) => p.id).sort()).toEqual(points.map((p) => p.id).sort());
    expect(route.mapDistance).toBeLessThanOrEqual(route.baselineDistance + 1e-8);
    expect(route.mapDistance).toBe(routeDistance(start, route.stops));
    expect(JSON.stringify(points)).toBe(before);
    expect(optimizeStops(start, [...points].reverse(), 5)).toEqual(route);
  });
  it('selects a bounded nearby subset and deterministic ties', () => {
    const result = optimizeStops(start, [p('b', 1, 0), p('a', 0, 1), p('far', 999, 999)], 1);
    expect(result.stops.map((p) => p.id)).toEqual(['a']);
    expect(result.candidateCount).toBe(3);
    expect(optimizeStops(start, [], 5).mapDistance).toBe(0);
  });
  it('rejects non-finite coordinates and unsafe route sizes', () => {
    expect(() => optimizeStops(start, [p('a', Infinity, 0)], 5)).toThrow(RangeError);
    expect(() => optimizeStops(start, [], 21)).toThrow(RangeError);
  });
});
