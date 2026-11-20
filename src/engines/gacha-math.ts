/**
 * Version 7.2 Genshin Impact Gacha Probability & Expected Wish Cost Engine
 *
 * Accurately models:
 * - Character Event Wishes (4-state Capturing Radiance Markov model: [0.50, 0.50, 8/11, 1.00] -> exact 55.000% consolidated win rate)
 * - Weapon Event Wishes (5.0+ 1 Fate Point ceiling + 75/25 off-banner carryover guarantee)
 * - Chronicled Wishes (0.600% base, 74 soft, 90 hard, 50% rate-up, 1 Fate Point non-carrying)
 * - Multi-Copy Goal Modeling (discrete polynomial convolution for C1-C6 and R1-R5)
 * - Full Percentile Milestone extraction (p25, p50, p75, p90, p99)
 */

import {
  CHARACTER_BANNER_RULES,
  WEAPON_BANNER_RULES,
  CHRONICLED_BANNER_RULES,
} from '../data/banner-rules';

export interface MultiCopyStepBreakdown {
  copyNumber: number;
  label: string;
  expectedPulls: number;
  medianPulls: number;
  guaranteedPulls: number;
  cumulativeProbability: number;
}

export interface GachaOddsResult {
  pullsAvailable: number;
  cumulativeProbability: number; // 0.0 to 1.0
  expectedPulls: number;
  medianPulls: number;
  guaranteedPulls: number;
  primogemsNeeded: number;
  p25?: number;
  p50?: number;
  p75?: number;
  p90?: number;
  p99?: number;
  isUncapped?: boolean;
  copiesBreakdown?: MultiCopyStepBreakdown[];
}

/**
 * Calculates total available pulls from primogems and intertwined fates.
 * Defensively handles non-integers, floats, negative values, and NaN.
 */
export function calculateTotalPulls(primogems: number, fates: number): number {
  const safePrimos = Math.max(0, Math.floor(Number(primogems) || 0));
  const safeFates = Math.max(0, Math.floor(Number(fates) || 0));
  return Math.floor(safePrimos / 160) + safeFates;
}

/**
 * 4-state Capturing Radiance probability model (Version 5.0+ / 7.2 Baseline).
 * Evaluates the net win rate for a non-guaranteed 5-star character pull:
 * Streak is the number of consecutive 50/50 losses.
 * - Streak 0: 50.0%
 * - Streak 1: 50.0%
 * - Streak 2: 8/11 (~72.727%)
 * - Streak 3+: 100.0% (Guaranteed featured on 4th attempt)
 *
 * Mathematical Proof of 55.000% Consolidated Win Rate:
 * Stationary distribution pi = [11/20, 11/40, 11/80, 3/80]
 * Consolidated Win Rate = 0.55 * 0.50 + 0.275 * 0.50 + 0.1375 * (8/11) + 0.0375 * 1.00 = 0.55000 (55.000%)
 */
export function calculateRadianceWinRate(consecutiveLosses: number = 0): number {
  const streak = Math.max(0, Math.floor(Number(consecutiveLosses) || 0));
  if (streak >= 3) return CHARACTER_BANNER_RULES.radianceStreakRates[3]; // 1.0
  if (streak === 2) return CHARACTER_BANNER_RULES.radianceStreakRates[2]; // 8 / 11
  return CHARACTER_BANNER_RULES.radianceStreakRates[0]; // 0.50
}

/**
 * Returns conditional probability of 5-star on pull n given no 5-star on 1..n-1.
 */
function getCharacterPullRate(n: number): number {
  if (n <= 0) return 0;
  if (n < CHARACTER_BANNER_RULES.softPityStart) return CHARACTER_BANNER_RULES.baseRate;
  if (n < CHARACTER_BANNER_RULES.hardPity) {
    return Math.min(
      1.0,
      CHARACTER_BANNER_RULES.baseRate +
        CHARACTER_BANNER_RULES.softIncrement * (n - (CHARACTER_BANNER_RULES.softPityStart - 1)),
    );
  }
  return 1.0;
}

function getWeaponPullRate(n: number): number {
  if (n <= 0) return 0;
  if (n < WEAPON_BANNER_RULES.softPityStart) return WEAPON_BANNER_RULES.baseRate;
  if (n < WEAPON_BANNER_RULES.hardPity) {
    return Math.min(
      1.0,
      WEAPON_BANNER_RULES.baseRate +
        WEAPON_BANNER_RULES.softIncrement * (n - (WEAPON_BANNER_RULES.softPityStart - 1)),
    );
  }
  return 1.0;
}

/**
 * Computes probability density function f(k) of a single 5-star arriving on
 * exactly additional pull k (k in 1..maxPity-pity).
 */
function computeSingleCyclePmf(
  rateFunc: (n: number) => number,
  hardPity: number,
  currentPity: number,
): number[] {
  const maxAdditional = hardPity - currentPity;
  const pmf: number[] = new Array(maxAdditional + 1).fill(0);

  let survival = 1.0;
  for (let k = 1; k <= maxAdditional; k++) {
    const pullNumber = currentPity + k;
    const rate = rateFunc(pullNumber);
    const prob = survival * rate;
    pmf[k] = prob;
    survival *= 1.0 - rate;
  }

  // Normalize slightly for any floating point imprecision
  const sum = pmf.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let k = 1; k <= maxAdditional; k++) {
      pmf[k] /= sum;
    }
  }

  return pmf;
}

/**
 * Discrete polynomial convolution of two independent PMFs:
 * result[k] = sum_{j} pmfA[j] * pmfB[k - j]
 * Conservatively normalizes sum to 1.0.
 */
export function convolvePmfs(pmfA: number[], pmfB: number[]): number[] {
  if (!pmfA || pmfA.length === 0) return pmfB ? [...pmfB] : [];
  if (!pmfB || pmfB.length === 0) return [...pmfA];

  const lenA = pmfA.length;
  const lenB = pmfB.length;
  const result: number[] = new Array(lenA + lenB - 1).fill(0);

  for (let i = 0; i < lenA; i++) {
    const a = pmfA[i];
    if (a === 0) continue;
    for (let j = 0; j < lenB; j++) {
      const b = pmfB[j];
      if (b === 0) continue;
      result[i + j] += a * b;
    }
  }

  // Normalize for floating-point precision
  const sum = result.reduce((acc, v) => acc + v, 0);
  if (sum > 0) {
    for (let k = 0; k < result.length; k++) {
      result[k] /= sum;
    }
  }

  return result;
}

/**
 * Computes the PMF of pulls needed to acquire a single target item.
 * Index k represents total additional pulls.
 */
function computeTargetPmf(
  bannerType: 'character' | 'weapon' | 'chronicled',
  currentPity: number,
  isGuaranteed: boolean,
  auxiliaryState: number = 0,
  weaponGuaranteed: boolean = false,
): { pmf: number[]; guaranteedPulls: number } {
  if (bannerType === 'character') {
    const consecutiveLosses = auxiliaryState;
    const safeRawPity = Math.floor(Number(currentPity) || 0);
    const clampedPity = Math.max(0, Math.min(CHARACTER_BANNER_RULES.hardPity - 1, safeRawPity));
    const cycle1 = computeSingleCyclePmf(
      getCharacterPullRate,
      CHARACTER_BANNER_RULES.hardPity,
      clampedPity,
    );

    const winRate = calculateRadianceWinRate(consecutiveLosses);

    if (isGuaranteed || winRate >= 1.0) {
      const guaranteedPulls = CHARACTER_BANNER_RULES.hardPity - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(
      getCharacterPullRate,
      CHARACTER_BANNER_RULES.hardPity,
      0,
    );
    const guaranteedPulls =
      CHARACTER_BANNER_RULES.hardPity - clampedPity + CHARACTER_BANNER_RULES.hardPity;
    const pmf: number[] = new Array(guaranteedPulls + 1).fill(0);

    const lossRate = 1.0 - winRate;

    // Win on 1st 5-star
    for (let k = 1; k < cycle1.length; k++) {
      pmf[k] += winRate * cycle1[k];
    }

    // Lose on 1st 5-star, win on 2nd (guaranteed)
    for (let k1 = 1; k1 < cycle1.length; k1++) {
      const p1 = cycle1[k1];
      for (let k2 = 1; k2 < cycleFresh.length; k2++) {
        const kTotal = k1 + k2;
        pmf[kTotal] += lossRate * p1 * cycleFresh[k2];
      }
    }

    return { pmf, guaranteedPulls };
  } else if (bannerType === 'weapon') {
    const fatePoints = auxiliaryState;
    const safeRawPity = Math.floor(Number(currentPity) || 0);
    const clampedPity = Math.max(0, Math.min(WEAPON_BANNER_RULES.hardPity - 1, safeRawPity));
    const cycle1 = computeSingleCyclePmf(getWeaponPullRate, WEAPON_BANNER_RULES.hardPity, clampedPity);

    const safeFate = Math.floor(Math.max(0, Number(fatePoints) || 0));
    if (safeFate >= WEAPON_BANNER_RULES.fatePointCeiling) {
      const guaranteedPulls = WEAPON_BANNER_RULES.hardPity - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(getWeaponPullRate, WEAPON_BANNER_RULES.hardPity, 0);
    const guaranteedPulls =
      WEAPON_BANNER_RULES.hardPity - clampedPity + WEAPON_BANNER_RULES.hardPity;
    const pmf: number[] = new Array(guaranteedPulls + 1).fill(0);

    // If weaponGuaranteed is true (lost previous 5★ to off-banner standard weapon):
    // 100% rate-up pool split across 2 weapons = 50.0% win rate
    // Otherwise 75% rate-up pool split across 2 weapons = 37.5% win rate
    const winRate = weaponGuaranteed
      ? WEAPON_BANNER_RULES.guaranteedRateUpTargetRate
      : WEAPON_BANNER_RULES.baseTargetRate;
    const lossRate = 1.0 - winRate;

    // Win on 1st 5-star
    for (let k = 1; k < cycle1.length; k++) {
      pmf[k] += winRate * cycle1[k];
    }

    // Lose on 1st 5-star (gains 1 fate point -> 2nd is guaranteed)
    for (let k1 = 1; k1 < cycle1.length; k1++) {
      const p1 = cycle1[k1];
      for (let k2 = 1; k2 < cycleFresh.length; k2++) {
        const kTotal = k1 + k2;
        pmf[kTotal] += lossRate * p1 * cycleFresh[k2];
      }
    }

    return { pmf, guaranteedPulls };
  } else {
    // Chronicled Wish
    const fatePoints = auxiliaryState;
    const safeRawPity = Math.floor(Number(currentPity) || 0);
    const clampedPity = Math.max(0, Math.min(CHRONICLED_BANNER_RULES.hardPity - 1, safeRawPity));
    const cycle1 = computeSingleCyclePmf(
      getCharacterPullRate,
      CHRONICLED_BANNER_RULES.hardPity,
      clampedPity,
    );

    const safeFate = Math.floor(Math.max(0, Number(fatePoints) || 0));
    if (safeFate >= CHRONICLED_BANNER_RULES.fatePointCeiling) {
      const guaranteedPulls = CHRONICLED_BANNER_RULES.hardPity - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(
      getCharacterPullRate,
      CHRONICLED_BANNER_RULES.hardPity,
      0,
    );
    const guaranteedPulls =
      CHRONICLED_BANNER_RULES.hardPity - clampedPity + CHRONICLED_BANNER_RULES.hardPity;
    const pmf: number[] = new Array(guaranteedPulls + 1).fill(0);

    const winRate = CHRONICLED_BANNER_RULES.baseTargetRate; // 50%
    const lossRate = 1.0 - winRate; // 50%

    // Win on 1st 5-star
    for (let k = 1; k < cycle1.length; k++) {
      pmf[k] += winRate * cycle1[k];
    }

    // Lose on 1st 5-star (gains 1 fate point -> 2nd is guaranteed)
    for (let k1 = 1; k1 < cycle1.length; k1++) {
      const p1 = cycle1[k1];
      for (let k2 = 1; k2 < cycleFresh.length; k2++) {
        const kTotal = k1 + k2;
        pmf[kTotal] += lossRate * p1 * cycleFresh[k2];
      }
    }

    return { pmf, guaranteedPulls };
  }
}

/**
 * Calculates comprehensive gacha statistics from a target PMF.
 */
function analyzeOdds(
  pmf: number[],
  guaranteedPulls: number,
  pullsAvailable: number,
  isUncapped: boolean = false,
): GachaOddsResult {
  const safePulls = Math.max(0, Math.floor(Number(pullsAvailable) || 0));

  let cumulativeProbability = 0;
  if (!isUncapped && safePulls >= guaranteedPulls) {
    cumulativeProbability = 1.0;
  } else if (safePulls > 0) {
    for (let k = 1; k <= safePulls && k < pmf.length; k++) {
      cumulativeProbability += pmf[k];
    }
    cumulativeProbability = Math.min(1.0, Math.max(0.0, cumulativeProbability));
  }

  // Expected pulls
  let expectedPulls = 0;
  for (let k = 1; k < pmf.length; k++) {
    expectedPulls += k * pmf[k];
  }

  // Percentiles: p25, p50 (median), p75, p90, p99
  let p25 = guaranteedPulls || 1;
  let p50 = guaranteedPulls || 1;
  let p75 = guaranteedPulls || 1;
  let p90 = guaranteedPulls || 1;
  let p99 = guaranteedPulls || 1;

  let cum = 0;
  for (let k = 1; k < pmf.length; k++) {
    cum += pmf[k];
    if (p25 === guaranteedPulls && cum >= 0.25) p25 = k;
    if (p50 === guaranteedPulls && cum >= 0.50) p50 = k;
    if (p75 === guaranteedPulls && cum >= 0.75) p75 = k;
    if (p90 === guaranteedPulls && cum >= 0.90) p90 = k;
    if (p99 === guaranteedPulls && cum >= 0.99) {
      p99 = k;
      break;
    }
  }

  const primogemsNeeded = isUncapped
    ? 0
    : Math.max(0, guaranteedPulls - safePulls) * 160;

  return {
    pullsAvailable: safePulls,
    cumulativeProbability: Number(cumulativeProbability.toFixed(4)),
    expectedPulls: Number(expectedPulls.toFixed(1)),
    medianPulls: p50,
    guaranteedPulls: isUncapped ? 0 : guaranteedPulls,
    primogemsNeeded,
    p25,
    p50,
    p75,
    p90,
    p99,
    isUncapped,
  };
}

export function calculateCharacterBannerOdds(
  pullsAvailable: number,
  currentPity: number,
  isGuaranteed: boolean,
  consecutiveLosses: number = 0,
): GachaOddsResult {
  const { pmf, guaranteedPulls } = computeTargetPmf(
    'character',
    currentPity,
    isGuaranteed,
    consecutiveLosses,
  );
  return analyzeOdds(pmf, guaranteedPulls, pullsAvailable);
}

export function calculateWeaponBannerOdds(
  pullsAvailable: number,
  currentPity: number,
  fatePoints: number = 0,
  weaponGuaranteed: boolean = false,
): GachaOddsResult {
  const { pmf, guaranteedPulls } = computeTargetPmf(
    'weapon',
    currentPity,
    false,
    fatePoints,
    weaponGuaranteed,
  );
  return analyzeOdds(pmf, guaranteedPulls, pullsAvailable);
}

export function calculateChronicledWishOdds(
  pullsAvailable: number,
  currentPity: number = 0,
  fatePoints: number = 0,
): GachaOddsResult {
  const { pmf, guaranteedPulls } = computeTargetPmf(
    'chronicled',
    currentPity,
    false,
    fatePoints,
  );
  return analyzeOdds(pmf, guaranteedPulls, pullsAvailable);
}

/**
 * Multi-Copy Goal Modeling via Discrete Polynomial Convolution.
 * For goals needing N >= 1 copies:
 * PMF_N = PMF_copy1 * (PMF_fresh)^(N-1)
 * Generates an expandable per-copy breakdown with median, guarantee, and cumulative probability.
 */
export function calculateMultiCopyOdds(
  bannerType: 'character' | 'weapon' | 'chronicled',
  copiesNeeded: number,
  pullsAvailable: number,
  currentPity: number,
  isGuaranteed: boolean,
  auxiliaryState: number = 0,
  weaponGuaranteed: boolean = false,
): GachaOddsResult {
  const n = Math.max(1, Math.floor(Number(copiesNeeded) || 1));

  if (n === 1) {
    if (bannerType === 'character') {
      return calculateCharacterBannerOdds(pullsAvailable, currentPity, isGuaranteed, auxiliaryState);
    } else if (bannerType === 'weapon') {
      return calculateWeaponBannerOdds(pullsAvailable, currentPity, auxiliaryState, weaponGuaranteed);
    } else {
      return calculateChronicledWishOdds(pullsAvailable, currentPity, auxiliaryState);
    }
  }

  // Copy 1 (takes current account state)
  const copy1Target = computeTargetPmf(
    bannerType,
    currentPity,
    isGuaranteed,
    auxiliaryState,
    weaponGuaranteed,
  );

  // Fresh copies (starts from 0 pity, 0 fate, not guaranteed, 0 streak)
  const freshTarget = computeTargetPmf(bannerType, 0, false, 0, false);

  const breakdowns: MultiCopyStepBreakdown[] = [];
  let currentPmf = copy1Target.pmf;
  let currentGuaranteed = copy1Target.guaranteedPulls;

  // Record step 1
  const step1Odds = analyzeOdds(currentPmf, currentGuaranteed, pullsAvailable);
  breakdowns.push({
    copyNumber: 1,
    label: `Copy 1`,
    expectedPulls: step1Odds.expectedPulls,
    medianPulls: step1Odds.medianPulls,
    guaranteedPulls: step1Odds.guaranteedPulls,
    cumulativeProbability: step1Odds.cumulativeProbability,
  });

  // Convolve for subsequent copies
  for (let copy = 2; copy <= n; copy++) {
    currentPmf = convolvePmfs(currentPmf, freshTarget.pmf);
    currentGuaranteed += freshTarget.guaranteedPulls;

    const stepOdds = analyzeOdds(currentPmf, currentGuaranteed, pullsAvailable);
    breakdowns.push({
      copyNumber: copy,
      label: `Copy ${copy}`,
      expectedPulls: stepOdds.expectedPulls,
      medianPulls: stepOdds.medianPulls,
      guaranteedPulls: stepOdds.guaranteedPulls,
      cumulativeProbability: stepOdds.cumulativeProbability,
    });
  }

  const finalOdds = analyzeOdds(currentPmf, currentGuaranteed, pullsAvailable);
  return {
    ...finalOdds,
    copiesBreakdown: breakdowns,
  };
}

export function generateProbabilityDistribution(
  bannerType: 'character' | 'weapon' | 'chronicled',
  currentPity: number,
  isGuaranteed: boolean,
  auxiliaryState: number = 0,
  weaponGuaranteed: boolean = false,
  copiesNeeded: number = 1,
): Array<{ pulls: number; probability: number }> {
  let pmf: number[];
  let guaranteedPulls: number;

  const n = Math.max(1, Math.floor(Number(copiesNeeded) || 1));
  if (n > 1) {
    const copy1 = computeTargetPmf(bannerType, currentPity, isGuaranteed, auxiliaryState, weaponGuaranteed);
    const fresh = computeTargetPmf(bannerType, 0, false, 0, false);
    pmf = copy1.pmf;
    guaranteedPulls = copy1.guaranteedPulls;
    for (let c = 2; c <= n; c++) {
      pmf = convolvePmfs(pmf, fresh.pmf);
      guaranteedPulls += fresh.guaranteedPulls;
    }
  } else {
    const target = computeTargetPmf(bannerType, currentPity, isGuaranteed, auxiliaryState, weaponGuaranteed);
    pmf = target.pmf;
    guaranteedPulls = target.guaranteedPulls;
  }

  const distribution: Array<{ pulls: number; probability: number }> = [];
  distribution.push({ pulls: 0, probability: 0 });

  let cumulative = 0;
  for (let k = 1; k <= guaranteedPulls; k++) {
    if (k < pmf.length) {
      cumulative += pmf[k];
    }
    const prob = k >= guaranteedPulls ? 1.0 : Math.min(1.0, cumulative);
    distribution.push({
      pulls: k,
      probability: Number(prob.toFixed(4)),
    });
  }

  return distribution;
}
