import { describe, it, expect } from 'vitest';
import {
  calculateCharacterBannerOdds,
  calculateWeaponBannerOdds,
  generateProbabilityDistribution,
  calculateTotalPulls,
  calculateRadianceWinRate,
} from './gacha-math';

describe('Gacha Math Engine (5.x Rules)', () => {
  describe('calculateTotalPulls', () => {
    it('accurately calculates pull conversions and floors floats', () => {
      expect(calculateTotalPulls(16000, 20)).toBe(120);
      expect(calculateTotalPulls(159, 10.8)).toBe(10);
      expect(calculateTotalPulls(-500, -10)).toBe(0);
      expect(calculateTotalPulls(NaN as any, NaN as any)).toBe(0);
    });
  });

  describe('calculateRadianceWinRate (Capturing Radiance State Machine)', () => {
    it('returns base 55% at 0 consecutive losses', () => {
      expect(calculateRadianceWinRate(0)).toBeCloseTo(0.55, 4);
      expect(calculateRadianceWinRate()).toBeCloseTo(0.55, 4);
    });

    it('returns escalating ~77.5% at 1 consecutive loss', () => {
      expect(calculateRadianceWinRate(1)).toBeCloseTo(0.775, 4);
    });

    it('returns 100% (guaranteed) at 2 or more consecutive losses', () => {
      expect(calculateRadianceWinRate(2)).toBe(1.0);
      expect(calculateRadianceWinRate(3)).toBe(1.0);
    });

    it('defensively handles negative numbers, floats, and NaNs', () => {
      expect(calculateRadianceWinRate(-1)).toBeCloseTo(0.55, 4);
      expect(calculateRadianceWinRate(1.9)).toBeCloseTo(0.775, 4);
      expect(calculateRadianceWinRate(NaN as any)).toBeCloseTo(0.55, 4);
    });
  });

  describe('calculateCharacterBannerOdds', () => {
    it('accounts for Capturing Radiance consecutive loss streak', () => {
      // 0 losses (baseline): ~63.5% cumulative probability at 90 pulls
      const res0 = calculateCharacterBannerOdds(90, 0, false, 0);
      expect(res0.guaranteedPulls).toBe(180);
      expect(res0.cumulativeProbability).toBeCloseTo(0.635, 2);

      // 1 loss streak: ~81.7% cumulative probability at 90 pulls
      const res1 = calculateCharacterBannerOdds(90, 0, false, 1);
      expect(res1.guaranteedPulls).toBe(180);
      expect(res1.cumulativeProbability).toBeGreaterThan(0.775);
      expect(res1.cumulativeProbability).toBeGreaterThan(res0.cumulativeProbability);

      // 2 losses streak: 100% win rate -> guaranteed on 1st 5-star (90 pulls)
      const res2 = calculateCharacterBannerOdds(90, 0, false, 2);
      expect(res2.guaranteedPulls).toBe(90);
      expect(res2.cumulativeProbability).toBe(1.0);
      expect(res2.primogemsNeeded).toBe(0);
    });

    it('gracefully handles float, negative, or NaN pity values without crashing', () => {
      // Float pity 73.5 should floor to 73 without RangeError
      const resultFloat = calculateCharacterBannerOdds(10, 73.5, false);
      expect(resultFloat.guaranteedPulls).toBe(90 - 73 + 90); // 107
      expect(resultFloat.cumulativeProbability).toBeGreaterThan(0);

      // NaN should default to 0 pity
      const resultNaN = calculateCharacterBannerOdds(10, NaN as any, false);
      expect(resultNaN.guaranteedPulls).toBe(180);

      // Negative should clamp to 0 pity
      const resultNeg = calculateCharacterBannerOdds(10, -50, false);
      expect(resultNeg.guaranteedPulls).toBe(180);

      // Out of bounds pity (>= 90) should clamp to 89
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

    it('reflects ~55%-64% win chance at 90 pulls with 0 pity', () => {
      const result = calculateCharacterBannerOdds(90, 0, false);
      // With 90 pulls, user is guaranteed at least one 5-star (55% base win rate),
      // plus ~8.5% chance of an early 5-star + second pity within 90 pulls (~63.5% total).
      expect(result.cumulativeProbability).toBeGreaterThan(0.55);
      expect(result.cumulativeProbability).toBeLessThan(0.65);
    });

    it('calculates single pull odds accurately', () => {
      const singleNonGuaranteed = calculateCharacterBannerOdds(1, 0, false);
      // 0.006 * 0.55 = 0.0033
      expect(singleNonGuaranteed.cumulativeProbability).toBeCloseTo(0.0033, 4);

      const singleGuaranteed = calculateCharacterBannerOdds(1, 0, true);
      // 0.006 * 1.0 = 0.006
      expect(singleGuaranteed.cumulativeProbability).toBeCloseTo(0.006, 4);
    });

    it('accounts for existing pity correctly', () => {
      // 50 pity, guaranteed -> needs 40 pulls to hard guarantee
      const result = calculateCharacterBannerOdds(40, 50, true);
      expect(result.guaranteedPulls).toBe(40);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);

      // Pity 89 -> next pull is 100% 5-star
      const resultAt89 = calculateCharacterBannerOdds(1, 89, true);
      expect(resultAt89.guaranteedPulls).toBe(1);
      expect(resultAt89.cumulativeProbability).toBe(1.0);
    });

    it('calculates primogems needed based on remaining guaranteed pulls', () => {
      const result = calculateCharacterBannerOdds(20, 10, true);
      // guaranteed is 90 - 10 = 80 pulls. Available is 20 pulls. Remaining needed = 60 pulls = 9600 primos.
      expect(result.guaranteedPulls).toBe(80);
      expect(result.primogemsNeeded).toBe(60 * 160);
    });
  });

  describe('calculateWeaponBannerOdds (5.0+ 1 Fate Point Rule)', () => {
    it('returns 0 probability when 0 pulls available', () => {
      const result = calculateWeaponBannerOdds(0, 0, 0);
      expect(result.cumulativeProbability).toBe(0);
      expect(result.guaranteedPulls).toBe(160); // 2 pities max in 5.0+
      expect(result.primogemsNeeded).toBe(160 * 160);
    });

    it('guarantees weapon within 80 pulls if user already has 1 Fate Point', () => {
      const result = calculateWeaponBannerOdds(80, 0, 1);
      expect(result.guaranteedPulls).toBe(80);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
      expect(result.expectedPulls).toBeGreaterThan(50);
      expect(result.expectedPulls).toBeLessThan(75);
      expect(result.medianPulls).toBeGreaterThanOrEqual(63);
      expect(result.medianPulls).toBeLessThanOrEqual(72);
    });

    it('guarantees weapon within 160 pulls with 0 Fate Points', () => {
      const result = calculateWeaponBannerOdds(160, 0, 0);
      expect(result.guaranteedPulls).toBe(160);
      expect(result.cumulativeProbability).toBe(1.0);
      expect(result.primogemsNeeded).toBe(0);
    });

    it('reflects featured weapon win rate including early pity chance on first 80 pulls', () => {
      const result = calculateWeaponBannerOdds(80, 0, 0);
      // Base 37.5% win rate on 1st 5-star, plus ~13.6% early 5-star + second pity win within 80 pulls (~51.1%)
      expect(result.cumulativeProbability).toBeGreaterThan(0.375);
      expect(result.cumulativeProbability).toBeLessThan(0.55);
    });

    it('calculates single weapon pull odds accurately', () => {
      const singlePullNoFate = calculateWeaponBannerOdds(1, 0, 0);
      // 0.007 * 0.375 = 0.002625
      expect(singlePullNoFate.cumulativeProbability).toBeCloseTo(0.0026, 4);

      const singlePullWithFate = calculateWeaponBannerOdds(1, 0, 1);
      // 0.007 * 1.0 = 0.007
      expect(singlePullWithFate.cumulativeProbability).toBeCloseTo(0.007, 4);
    });

    it('accounts for weapon pity correctly', () => {
      // 60 pity, 1 fate point -> 20 pulls to hard guarantee
      const result = calculateWeaponBannerOdds(20, 60, 1);
      expect(result.guaranteedPulls).toBe(20);
      expect(result.cumulativeProbability).toBe(1.0);
    });
  });

  describe('generateProbabilityDistribution', () => {
    it('generates a monotonic CDF starting at pull 0 (0%) and ending at guaranteedPulls (100%)', () => {
      const charDist = generateProbabilityDistribution('character', 0, true);
      expect(charDist[0]).toEqual({ pulls: 0, probability: 0 });
      expect(charDist[charDist.length - 1].pulls).toBe(90);
      expect(charDist[charDist.length - 1].probability).toBe(1.0);

      // Verify monotonicity
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

      // Soft pity acceleration around 63
      const ratePreSoft = weaponDist[62].probability - weaponDist[61].probability;
      const ratePostSoft = weaponDist[64].probability - weaponDist[63].probability;
      expect(ratePostSoft).toBeGreaterThan(ratePreSoft);
    });
  });
});
