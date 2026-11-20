import { describe, it, expect } from 'vitest';
import {
  calculate4StarTargetOdds,
  generate4StarProbabilityDistribution,
} from './gacha-4star';

describe('Gacha 4-Star Target Engine (Absorbing Markov Model)', () => {
  it('correctly models featured 4-star target without hard ceiling (uncapped)', () => {
    const result = calculate4StarTargetOdds(35, 0, false);
    expect(result.isUncapped).toBe(true);
    // There is no 100% hard guarantee for a specific featured 4-star
    expect(result.guaranteedPulls).toBe(0);
  });

  it('yields realistic percentiles: median ~25-35 pulls, mean ~35 pulls, 90th percentile ~105 pulls', () => {
    const result = calculate4StarTargetOdds(100, 0, false);
    // Median pulls (Drop 3) is around 25 - 35 pulls
    expect(result.medianPulls).toBeGreaterThanOrEqual(24);
    expect(result.medianPulls).toBeLessThanOrEqual(38);

    // Expected mean pulls is ~35 pulls
    expect(result.expectedPulls).toBeGreaterThanOrEqual(30);
    expect(result.expectedPulls).toBeLessThanOrEqual(42);

    // 90th percentile is around 70 - 105 pulls
    expect(result.p90).toBeDefined();
    expect(result.p90!).toBeGreaterThanOrEqual(65);
    expect(result.p90!).toBeLessThanOrEqual(105);

    // Cumulative probability at median pulls must be >= 0.50
    const atMedian = calculate4StarTargetOdds(result.medianPulls, 0, false);
    expect(atMedian.cumulativeProbability).toBeGreaterThanOrEqual(0.48);
  });

  it('reflects higher initial probability when 4-star is already guaranteed (off-banner carryover)', () => {
    const nonGuaranteed = calculate4StarTargetOdds(20, 0, false);
    const guaranteed = calculate4StarTargetOdds(20, 0, true);

    expect(guaranteed.cumulativeProbability).toBeGreaterThan(nonGuaranteed.cumulativeProbability);
    expect(guaranteed.expectedPulls).toBeLessThan(nonGuaranteed.expectedPulls);
    expect(guaranteed.medianPulls).toBeLessThanOrEqual(nonGuaranteed.medianPulls);
  });

  it('reflects pity advancement on 4-star cycle', () => {
    const atPity0 = calculate4StarTargetOdds(10, 0, false);
    const atPity8 = calculate4StarTargetOdds(10, 8, false);

    expect(atPity8.cumulativeProbability).toBeGreaterThan(atPity0.cumulativeProbability);
    expect(atPity8.expectedPulls).toBeLessThan(atPity0.expectedPulls);
  });

  it('conserves probability mass: PMF sums to 1.0 ± 1e-4', () => {
    const distribution = generate4StarProbabilityDistribution(0, false);
    expect(distribution.length).toBeGreaterThan(150);
    expect(distribution[0]).toEqual({ pulls: 0, probability: 0 });

    const finalProb = distribution[distribution.length - 1].probability;
    expect(finalProb).toBeGreaterThanOrEqual(0.999);
    expect(finalProb).toBeLessThanOrEqual(1.0);

    // Monotonicity check
    for (let i = 1; i < distribution.length; i++) {
      expect(distribution[i].probability).toBeGreaterThanOrEqual(distribution[i - 1].probability);
    }
  });

  it('supports multi-copy 4-star targets (e.g. C2 = 2 copies)', () => {
    const singleCopy = calculate4StarTargetOdds(50, 0, false, 1);
    const twoCopies = calculate4StarTargetOdds(50, 0, false, 2);

    expect(twoCopies.expectedPulls).toBeGreaterThan(singleCopy.expectedPulls);
    expect(twoCopies.medianPulls).toBeGreaterThan(singleCopy.medianPulls);
    expect(twoCopies.cumulativeProbability).toBeLessThan(singleCopy.cumulativeProbability);
  });

  it('supports weapon banner 4-star targets with 75% rate-up pool across 5 featured weapons', () => {
    const charBanner4Star = calculate4StarTargetOdds(30, 0, false, 1, 'character');
    const weaponBanner4Star = calculate4StarTargetOdds(30, 0, false, 1, 'weapon');

    expect(charBanner4Star.pullsAvailable).toBe(30);
    expect(weaponBanner4Star.isUncapped).toBe(true);
    expect(weaponBanner4Star.pullsAvailable).toBe(30);
    expect(weaponBanner4Star.medianPulls).toBeGreaterThan(20);
    expect(weaponBanner4Star.medianPulls).toBeLessThan(45);
  });

  it('defensively handles boundary conditions and malformed inputs', () => {
    const zeroPulls = calculate4StarTargetOdds(0, 0, false);
    expect(zeroPulls.cumulativeProbability).toBe(0);
    expect(zeroPulls.pullsAvailable).toBe(0);

    const floatPity = calculate4StarTargetOdds(10, 8.7, false);
    expect(floatPity.pullsAvailable).toBe(10);

    const negPity = calculate4StarTargetOdds(10, -5, false);
    expect(negPity.pullsAvailable).toBe(10);

    const nanPity = calculate4StarTargetOdds(10, NaN as any, false);
    expect(nanPity.pullsAvailable).toBe(10);
  });
});
