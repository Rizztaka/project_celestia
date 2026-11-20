import { describe, it, expect } from 'vitest';
import {
  calculateCharacterBannerOdds,
  calculateWeaponBannerOdds,
  calculateChronicledWishOdds,
  calculateMultiCopyOdds,
  generateProbabilityDistribution,
  calculateTotalPulls,
  calculateRadianceWinRate,
  convolvePmfs,
} from './gacha-math';

describe('Gacha Math Engine (Version 7.2 Baseline)', () => {
  describe('calculateTotalPulls', () => {
    it('accurately calculates pull conversions and floors floats', () => {
      expect(calculateTotalPulls(16000, 20)).toBe(120);
      expect(calculateTotalPulls(159, 10.8)).toBe(10);
      expect(calculateTotalPulls(-500, -10)).toBe(0);
      expect(calculateTotalPulls(NaN as any, NaN as any)).toBe(0);
    });
  });

  describe('calculateRadianceWinRate (Capturing Radiance 4-State Markov Model)', () => {
    it('returns base 50% at 0 and 1 consecutive losses', () => {
      expect(calculateRadianceWinRate(0)).toBe(0.50);
      expect(calculateRadianceWinRate(1)).toBe(0.50);
      expect(calculateRadianceWinRate()).toBe(0.50);
    });

    it('returns 8/11 (~72.727%) at 2 consecutive losses', () => {
      expect(calculateRadianceWinRate(2)).toBeCloseTo(8 / 11, 5);
    });

    it('returns 100% (guaranteed) at 3 or more consecutive losses (4th attempt)', () => {
      expect(calculateRadianceWinRate(3)).toBe(1.0);
      expect(calculateRadianceWinRate(4)).toBe(1.0);
    });

    it('defensively handles negative numbers, floats, and NaNs', () => {
      expect(calculateRadianceWinRate(-1)).toBe(0.50);
      expect(calculateRadianceWinRate(1.9)).toBe(0.50);
      expect(calculateRadianceWinRate(2.8)).toBeCloseTo(8 / 11, 5);
      expect(calculateRadianceWinRate(NaN as any)).toBe(0.50);
    });

    it('mathematically converges to exactly 55.000% consolidated 50/50 win rate', () => {
      // Stationary distribution of the 4-state Markov renewal model:
      // P(Win|0) = 0.50, P(Win|1) = 0.50, P(Win|2) = 8/11, P(Win|3) = 1.00
      // pi_0 = 11/20 = 0.55
      // pi_1 = 11/40 = 0.275
      // pi_2 = 11/80 = 0.1375
      // pi_3 = 3/80 = 0.0375
      const pi = [11 / 20, 11 / 40, 11 / 80, 3 / 80];
      const winRates = [
        calculateRadianceWinRate(0),
        calculateRadianceWinRate(1),
        calculateRadianceWinRate(2),
        calculateRadianceWinRate(3),
      ];
      const consolidated = pi.reduce((sum, p, i) => sum + p * winRates[i], 0);
      expect(consolidated).toBeCloseTo(0.55000, 6);
    });
  });

  describe('calculateCharacterBannerOdds', () => {
    it('accounts for Capturing Radiance 4-state consecutive loss streak', () => {
      // 0 losses (baseline): 50% 1st 5-star win + ~9.5% early 2nd 5-star win within 90 pulls (~59.5%)
      const res0 = calculateCharacterBannerOdds(90, 0, false, 0);
      expect(res0.guaranteedPulls).toBe(180);
      expect(res0.cumulativeProbability).toBeGreaterThan(0.55);
      expect(res0.cumulativeProbability).toBeLessThan(0.65);

      // 1 loss streak: same base 50% on next 5-star
      const res1 = calculateCharacterBannerOdds(90, 0, false, 1);
      expect(res1.guaranteedPulls).toBe(180);
      expect(res1.cumulativeProbability).toBeCloseTo(res0.cumulativeProbability, 2);

      // 2 losses streak: 8/11 (~72.7%) win rate on 1st 5-star
      const res2 = calculateCharacterBannerOdds(90, 0, false, 2);
      expect(res2.guaranteedPulls).toBe(180);
      expect(res2.cumulativeProbability).toBeGreaterThan(res0.cumulativeProbability);
      expect(res2.cumulativeProbability).toBeGreaterThan(0.72);

      // 3 losses streak: 100% win rate -> guaranteed on 1st 5-star (90 pulls)
      const res3 = calculateCharacterBannerOdds(90, 0, false, 3);
      expect(res3.guaranteedPulls).toBe(90);
      expect(res3.cumulativeProbability).toBe(1.0);
      expect(res3.primogemsNeeded).toBe(0);
    });

    it('gracefully handles float, negative, or NaN pity values without crashing', () => {
      const resultFloat = calculateCharacterBannerOdds(10, 73.5, false);
      expect(resultFloat.guaranteedPulls).toBe(90 - 73 + 90); // 107
      expect(resultFloat.cumulativeProbability).toBeGreaterThan(0);

      const resultNaN = calculateCharacterBannerOdds(10, NaN as any, false);
      expect(resultNaN.guaranteedPulls).toBe(180);

      const resultNeg = calculateCharacterBannerOdds(10, -50, false);
      expect(resultNeg.guaranteedPulls).toBe(180);

      const resultHigh = calculateCharacterBannerOdds(1, 150, true);
      expect(resultHigh.guaranteedPulls).toBe(1);
      expect(resultHigh.cumulativeProbability).toBe(1.0);
    });

    it('returns 0 probability when 0 pulls available', () => {
      const result = calculateCharacterBannerOdds(0, 0, false);
      expect(result.cumulativeProbability).toBe(0);
      expect(result.pullsAvailable).toBe(0);
      expect(result.guaranteedPulls).toBe(180);
      expect(result.primogemsNeeded).toBe(180 * 160);
    });

    it('guarantees character at 90 pulls when already guaranteed', () => {
      const result = calculateCharacterBannerOdds(90, 0, true);
      expect(result.guaranteedPulls).toBe(90);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
      expect(result.expectedPulls).toBeGreaterThan(60);
      expect(result.expectedPulls).toBeLessThan(85);
      expect(result.medianPulls).toBeGreaterThanOrEqual(74);
      expect(result.medianPulls).toBeLessThanOrEqual(80);
    });

    it('guarantees character at 180 pulls when not guaranteed (50/50)', () => {
      const result = calculateCharacterBannerOdds(180, 0, false);
      expect(result.guaranteedPulls).toBe(180);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
    });

    it('calculates single pull odds accurately', () => {
      const singleNonGuaranteed = calculateCharacterBannerOdds(1, 0, false);
      // 0.006 * 0.50 = 0.0030
      expect(singleNonGuaranteed.cumulativeProbability).toBeCloseTo(0.0030, 4);

      const singleGuaranteed = calculateCharacterBannerOdds(1, 0, true);
      // 0.006 * 1.0 = 0.006
      expect(singleGuaranteed.cumulativeProbability).toBeCloseTo(0.006, 4);
    });

    it('accounts for existing pity correctly', () => {
      const result = calculateCharacterBannerOdds(40, 50, true);
      expect(result.guaranteedPulls).toBe(40);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);

      const resultAt89 = calculateCharacterBannerOdds(1, 89, true);
      expect(resultAt89.guaranteedPulls).toBe(1);
      expect(resultAt89.cumulativeProbability).toBe(1.0);
    });

    it('exports all percentile milestones: p25, p50, p75, p90, p99', () => {
      const result = calculateCharacterBannerOdds(180, 0, false);
      expect(result.p25).toBeDefined();
      expect(result.p50).toBeDefined();
      expect(result.p75).toBeDefined();
      expect(result.p90).toBeDefined();
      expect(result.p99).toBeDefined();

      expect(result.p25!).toBeLessThanOrEqual(result.p50!);
      expect(result.p50!).toBeLessThanOrEqual(result.p75!);
      expect(result.p75!).toBeLessThanOrEqual(result.p90!);
      expect(result.p90!).toBeLessThanOrEqual(result.p99!);
      expect(result.p99!).toBeLessThanOrEqual(180);
    });
  });

  describe('calculateWeaponBannerOdds (5.0+ 1 Fate Point & 75/25 Carryover)', () => {
    it('returns 0 probability when 0 pulls available', () => {
      const result = calculateWeaponBannerOdds(0, 0, 0, false);
      expect(result.cumulativeProbability).toBe(0);
      expect(result.guaranteedPulls).toBe(160);
      expect(result.primogemsNeeded).toBe(160 * 160);
    });

    it('guarantees weapon within 80 pulls if user already has 1 Fate Point', () => {
      const result = calculateWeaponBannerOdds(80, 0, 1, false);
      expect(result.guaranteedPulls).toBe(80);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
      expect(result.expectedPulls).toBeGreaterThan(50);
      expect(result.expectedPulls).toBeLessThan(75);
      expect(result.medianPulls).toBeGreaterThanOrEqual(63);
      expect(result.medianPulls).toBeLessThanOrEqual(72);
    });

    it('guarantees weapon within 160 pulls with 0 Fate Points', () => {
      const result = calculateWeaponBannerOdds(160, 0, 0, false);
      expect(result.guaranteedPulls).toBe(160);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
    });

    it('accurately incorporates weaponGuaranteed = true (75/25 off-banner carryover)', () => {
      // With weaponGuaranteed = false: 37.5% target win on 1st 5-star
      const noCarryover = calculateWeaponBannerOdds(80, 0, 0, false);
      // With weaponGuaranteed = true: 50.0% target win on 1st 5-star (saving ~6.6 expected pulls)
      const carryover = calculateWeaponBannerOdds(80, 0, 0, true);

      expect(carryover.cumulativeProbability).toBeGreaterThan(noCarryover.cumulativeProbability);
      expect(carryover.expectedPulls).toBeLessThan(noCarryover.expectedPulls);
      // Difference in expected pulls should be ~6 to 7 pulls
      const pullDifference = noCarryover.expectedPulls - carryover.expectedPulls;
      expect(pullDifference).toBeGreaterThanOrEqual(5.5);
      expect(pullDifference).toBeLessThanOrEqual(7.5);
    });

    it('calculates single weapon pull odds accurately based on guarantee flag', () => {
      const singlePullNoFateNoGuar = calculateWeaponBannerOdds(1, 0, 0, false);
      // 0.007 * 0.375 = 0.002625
      expect(singlePullNoFateNoGuar.cumulativeProbability).toBeCloseTo(0.0026, 4);

      const singlePullNoFateGuar = calculateWeaponBannerOdds(1, 0, 0, true);
      // 0.007 * 0.500 = 0.003500
      expect(singlePullNoFateGuar.cumulativeProbability).toBeCloseTo(0.0035, 4);

      const singlePullWithFate = calculateWeaponBannerOdds(1, 0, 1, false);
      // 0.007 * 1.0 = 0.007
      expect(singlePullWithFate.cumulativeProbability).toBeCloseTo(0.007, 4);
    });
  });

  describe('calculateChronicledWishOdds', () => {
    it('guarantees target at 90 pulls with 1 Fate Point', () => {
      const result = calculateChronicledWishOdds(90, 0, 1);
      expect(result.guaranteedPulls).toBe(90);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
    });

    it('guarantees target at 180 pulls with 0 Fate Points (50/50 base)', () => {
      const result = calculateChronicledWishOdds(180, 0, 0);
      expect(result.guaranteedPulls).toBe(180);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
    });

    it('reflects 50% base rate-up on first 5-star', () => {
      const result = calculateChronicledWishOdds(90, 0, 0);
      // Base 50% win on 1st 5-star, plus early second 5-star chance
      expect(result.cumulativeProbability).toBeGreaterThan(0.55);
      expect(result.cumulativeProbability).toBeLessThan(0.65);
    });
  });

  describe('Discrete Polynomial Convolution & Multi-Copy Goal Modeling', () => {
    it('convolvePmfs correctly convolves two discrete distributions with probability conservation', () => {
      const pmfA = [0, 0.4, 0.6]; // can arrive at pull 1 (0.4) or pull 2 (0.6)
      const pmfB = [0, 0.5, 0.5]; // can arrive at pull 1 (0.5) or pull 2 (0.5)
      const convolved = convolvePmfs(pmfA, pmfB);

      // max pull = 2 + 2 = 4
      expect(convolved.length).toBe(5);
      // Sum must equal 1.0
      const sum = convolved.reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 6);

      // Pull 2 = 0.4 * 0.5 = 0.2
      expect(convolved[2]).toBeCloseTo(0.2, 4);
      // Pull 3 = 0.4 * 0.5 + 0.6 * 0.5 = 0.5
      expect(convolved[3]).toBeCloseTo(0.5, 4);
      // Pull 4 = 0.6 * 0.5 = 0.3
      expect(convolved[4]).toBeCloseTo(0.3, 4);
    });

    it('calculates multi-copy character goal (e.g. C0 to C2 = 2 copies)', () => {
      const result2 = calculateMultiCopyOdds('character', 2, 200, 0, false, 0);
      // 2 fresh copies not guaranteed: hard ceiling = 180 + 180 = 360 pulls
      expect(result2.guaranteedPulls).toBe(360);
      // Median pulls for 2 copies should be around 170 - 200 pulls
      expect(result2.medianPulls).toBeGreaterThanOrEqual(165);
      expect(result2.medianPulls).toBeLessThanOrEqual(210);

      // Breakdown per-copy
      expect(result2.copiesBreakdown).toBeDefined();
      expect(result2.copiesBreakdown?.length).toBe(2);
      expect(result2.copiesBreakdown![0].copyNumber).toBe(1);
      expect(result2.copiesBreakdown![1].copyNumber).toBe(2);
      expect(result2.copiesBreakdown![1].medianPulls).toBe(result2.medianPulls);
      expect(result2.copiesBreakdown![1].guaranteedPulls).toBe(360);
    });

    it('calculates high constellation multi-copy (C6 = 6 copies) quickly without lag', () => {
      const t0 = performance.now();
      const result6 = calculateMultiCopyOdds('character', 6, 600, 0, false, 0);
      const elapsed = performance.now() - t0;

      // 6 copies: guaranteed is 6 * 180 = 1080 pulls
      expect(result6.guaranteedPulls).toBe(1080);
      expect(result6.copiesBreakdown?.length).toBe(6);
      expect(result6.medianPulls).toBeGreaterThan(450);
      expect(result6.medianPulls).toBeLessThan(650);
      // Execution must complete in under 50ms
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('generateProbabilityDistribution', () => {
    it('generates a monotonic CDF starting at pull 0 (0%) and ending at guaranteedPulls (100%)', () => {
      const charDist = generateProbabilityDistribution('character', 0, true);
      expect(charDist[0]).toEqual({ pulls: 0, probability: 0 });
      expect(charDist[charDist.length - 1].pulls).toBe(90);
      expect(charDist[charDist.length - 1].probability).toBe(1.0);

      for (let i = 1; i < charDist.length; i++) {
        expect(charDist[i].probability).toBeGreaterThanOrEqual(charDist[i - 1].probability);
      }

      // Check soft pity acceleration at pull 74
      const ratePreSoft = charDist[73].probability - charDist[72].probability;
      const ratePostSoft = charDist[75].probability - charDist[74].probability;
      expect(ratePostSoft).toBeGreaterThan(ratePreSoft);
    });

    it('generates weapon distribution with soft pity at 63 and hard pity at 80', () => {
      const weaponDist = generateProbabilityDistribution('weapon', 0, false, 1);
      expect(weaponDist[0]).toEqual({ pulls: 0, probability: 0 });
      expect(weaponDist[weaponDist.length - 1].pulls).toBe(80);
      expect(weaponDist[weaponDist.length - 1].probability).toBe(1.0);

      const ratePreSoft = weaponDist[62].probability - weaponDist[61].probability;
      const ratePostSoft = weaponDist[64].probability - weaponDist[63].probability;
      expect(ratePostSoft).toBeGreaterThan(ratePreSoft);
    });
  });
});
