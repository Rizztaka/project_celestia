/**
 * Version 7.2 Genshin Impact Gacha Probability & Expected Wish Cost Engine
 *
 * Accurately models:
 * - Character Event Wishes (4-state Capturing Radiance Markov model: [0.50, 0.50, 8/11, 1.00] -> exact 55.000% consolidated win rate)
 * - Exact multi-copy Character Markov state propagation across C1–C6 (streak carryover & exact Radiance ceiling)
 * - Weapon Event Wishes (5.0+ 1 Fate Point ceiling + 75/25 off-banner carryover guarantee)
 * - Chronicled Wishes (0.600% base, 74 soft, 90 hard, 50% rate-up, 1 Fate Point non-carrying)
 * - Multi-Copy Goal Modeling (discrete polynomial convolution for R1–R5 and Chronicled)
 * - Full Percentile Milestone extraction (p25, p50, p75, p90, p99)
 */

import {
  CHARACTER_BANNER_RULES,
  WEAPON_BANNER_RULES,
  CHRONICLED_BANNER_RULES,
} from '../data/banner-rules';
import type { PullBudgetState } from '../types/genshin';

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
 * Defensively handles non-integers, floats, negative values, Infinity, and NaN.
 */
export function calculateTotalPulls(primogems: number, fates: number): number {
  const numPrimos = Number(primogems);
  const numFates = Number(fates);
  const safePrimos = Number.isFinite(numPrimos) ? Math.max(0, Math.floor(numPrimos)) : 0;
  const safeFates = Number.isFinite(numFates) ? Math.max(0, Math.floor(numFates)) : 0;
  return Math.floor(safePrimos / 160) + safeFates;
}

/**
 * Sanitizes a PullBudgetState into valid, finite domain bounds.
 */
export function sanitizePullBudget(budget: PullBudgetState): PullBudgetState {
  const clampInt = (val: unknown, min: number, max: number): number => {
    const n = Number(val);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
  };

  return {
    primogems: clampInt(budget.primogems, 0, 100_000_000),
    fates: clampInt(budget.fates, 0, 1_000_000),
    characterPity: clampInt(budget.characterPity, 0, CHARACTER_BANNER_RULES.hardPity - 1),
    characterGuaranteed: Boolean(budget.characterGuaranteed),
    consecutiveLossCount: clampInt(budget.consecutiveLossCount ?? 0, 0, 3),
    weaponPity: clampInt(budget.weaponPity, 0, WEAPON_BANNER_RULES.hardPity - 1),
    weaponGuaranteed: Boolean(budget.weaponGuaranteed),
    weaponFatePoints: clampInt(budget.weaponFatePoints, 0, WEAPON_BANNER_RULES.fatePointCeiling),
    chronicledPity: clampInt(budget.chronicledPity ?? 0, 0, CHRONICLED_BANNER_RULES.hardPity - 1),
    chronicledFatePoints: clampInt(
      budget.chronicledFatePoints ?? 0,
      0,
      CHRONICLED_BANNER_RULES.fatePointCeiling,
    ),
    includeCashback: Boolean(budget.includeCashback),
  };
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
  const raw = Number(consecutiveLosses);
  const streak = Number.isFinite(raw) ? Math.max(0, Math.floor(raw)) : 0;
  if (streak >= 3) return CHARACTER_BANNER_RULES.radianceStreakRates[3]; // 1.0
  if (streak === 2) return CHARACTER_BANNER_RULES.radianceStreakRates[2]; // 8 / 11
  return CHARACTER_BANNER_RULES.radianceStreakRates[0]; // 0.50
}

/**
 * Returns conditional probability of 5-star on pull n given no 5-star on 1..n-1.
 */
export function getCharacterPullRate(n: number): number {
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

export function getWeaponPullRate(n: number): number {
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

export function getChronicledPullRate(n: number): number {
  if (n <= 0) return 0;
  if (n < CHRONICLED_BANNER_RULES.softPityStart) return CHRONICLED_BANNER_RULES.baseRate;
  if (n < CHRONICLED_BANNER_RULES.hardPity) {
    return Math.min(
      1.0,
      CHRONICLED_BANNER_RULES.baseRate +
        CHRONICLED_BANNER_RULES.softIncrement * (n - (CHRONICLED_BANNER_RULES.softPityStart - 1)),
    );
  }
  return 1.0;
}

/**
 * Computes probability mass function f(k) of a single 5-star arriving on
 * exactly additional pull k (k in 1..hardPity-currentPity).
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
 * Raw (unnormalized) scaled convolution accumulation:
 * target[i + j] += scale * a[i] * b[j]
 * Used by exact Markov state propagation where state vectors sum to state probabilities < 1.
 */
function accumulateScaledConvolution(
  target: number[],
  a: number[],
  b: number[],
  scale: number,
): void {
  if (scale <= 0 || a.length === 0 || b.length === 0) return;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    if (ai === 0) continue;
    const scaledAi = ai * scale;
    for (let j = 0; j < b.length; j++) {
      const bj = b[j];
      if (bj === 0) continue;
      const idx = i + j;
      if (idx < target.length) {
        target[idx] += scaledAi * bj;
      }
    }
  }
}

/**
 * Computes exact worst-case guaranteed pull ceiling for N copies on the Character Event Wish,
 * accounting for Capturing Radiance guaranteeing every 4th consecutive 50/50 attempt (streak 3 -> 0).
 */
export function computeCharacterMultiCopyCeiling(
  copiesNeeded: number,
  currentPity: number,
  isGuaranteed: boolean,
  consecutiveLosses: number = 0,
): number {
  const n = Math.max(1, Math.floor(Number(copiesNeeded) || 1));
  const rawPity = Number(currentPity);
  const clampedPity = Number.isFinite(rawPity)
    ? Math.max(0, Math.min(CHARACTER_BANNER_RULES.hardPity - 1, Math.floor(rawPity)))
    : 0;
  const rawStreak = Number(consecutiveLosses);
  let streak = Number.isFinite(rawStreak) ? Math.max(0, Math.min(3, Math.floor(rawStreak))) : 0;

  let total = 0;

  // Copy 1
  if (isGuaranteed) {
    // Consumes 50/50 guarantee without rolling a 50/50 -> Radiance streak preserved for Copy 2
    total += CHARACTER_BANNER_RULES.hardPity - clampedPity;
  } else if (calculateRadianceWinRate(streak) >= 1.0) {
    // Capturing Radiance forces a 100% win on 1st 5★ -> streak resets to 0
    total += CHARACTER_BANNER_RULES.hardPity - clampedPity;
    streak = 0;
  } else {
    // Worst case: lose 50/50, win guaranteed 2nd 5★ -> streak advances
    total += CHARACTER_BANNER_RULES.hardPity - clampedPity + CHARACTER_BANNER_RULES.hardPity;
    streak = Math.min(3, streak + 1);
  }

  // Copies 2..N (always enter with pity=0, guaranteed=false)
  for (let copy = 2; copy <= n; copy++) {
    if (calculateRadianceWinRate(streak) >= 1.0) {
      total += CHARACTER_BANNER_RULES.hardPity;
      streak = 0;
    } else {
      total += 2 * CHARACTER_BANNER_RULES.hardPity;
      streak = Math.min(3, streak + 1);
    }
  }

  return total;
}

interface CharacterMultiCopyStepPmf {
  copyNumber: number;
  pmf: number[];
  guaranteedPulls: number;
}

/**
 * Exact 4-state Markov state-tracked PMF computation for 1..N Character Event Wish copies.
 * Tracks joint distribution P(totalPulls = k, endingRadianceStreak = s) for s in {0, 1, 2, 3}.
 */
function computeCharacterMultiCopySteps(
  copiesNeeded: number,
  currentPity: number,
  isGuaranteed: boolean,
  consecutiveLosses: number = 0,
): CharacterMultiCopyStepPmf[] {
  const n = Math.max(1, Math.floor(Number(copiesNeeded) || 1));
  const rawPity = Number(currentPity);
  const clampedPity = Number.isFinite(rawPity)
    ? Math.max(0, Math.min(CHARACTER_BANNER_RULES.hardPity - 1, Math.floor(rawPity)))
    : 0;
  const rawStreak = Number(consecutiveLosses);
  const clampedStreak = Number.isFinite(rawStreak)
    ? Math.max(0, Math.min(3, Math.floor(rawStreak)))
    : 0;

  const cycle1 = computeSingleCyclePmf(
    getCharacterPullRate,
    CHARACTER_BANNER_RULES.hardPity,
    clampedPity,
  );
  const cycleFresh = computeSingleCyclePmf(
    getCharacterPullRate,
    CHARACTER_BANNER_RULES.hardPity,
    0,
  );
  const cycleTwoFresh = convolvePmfs(cycleFresh, cycleFresh);

  // Copy 1 state-partitioned PMFs: statePmfs[s][k] = P(copy 1 takes k pulls and ends at streak s)
  const ceiling1 = computeCharacterMultiCopyCeiling(1, clampedPity, isGuaranteed, clampedStreak);
  let statePmfs: [number[], number[], number[], number[]] = [
    new Array(ceiling1 + 1).fill(0),
    new Array(ceiling1 + 1).fill(0),
    new Array(ceiling1 + 1).fill(0),
    new Array(ceiling1 + 1).fill(0),
  ];

  const winRate1 = calculateRadianceWinRate(clampedStreak);
  if (isGuaranteed) {
    // Guaranteed 5★ arrives on cycle1; Radiance streak stays unchanged
    for (let k = 1; k < cycle1.length; k++) {
      statePmfs[clampedStreak][k] += cycle1[k];
    }
  } else if (winRate1 >= 1.0) {
    // Radiance guaranteed win on 1st 5★ -> resets streak to 0
    for (let k = 1; k < cycle1.length; k++) {
      statePmfs[0][k] += cycle1[k];
    }
  } else {
    const lossRate1 = 1.0 - winRate1;
    const nextLossStreak = Math.min(3, clampedStreak + 1);

    // Win on 1st 5★ -> streak resets to 0
    for (let k = 1; k < cycle1.length; k++) {
      statePmfs[0][k] += winRate1 * cycle1[k];
    }
    // Lose on 1st 5★, win guaranteed 2nd -> streak increments
    accumulateScaledConvolution(statePmfs[nextLossStreak], cycle1, cycleFresh, lossRate1);
  }

  const mergeAndNormalizeStates = (
    states: [number[], number[], number[], number[]],
    ceiling: number,
  ): number[] => {
    const combined = new Array(ceiling + 1).fill(0);
    let totalMass = 0;
    for (let s = 0; s < 4; s++) {
      const vec = states[s];
      for (let k = 1; k < vec.length && k <= ceiling; k++) {
        combined[k] += vec[k];
        totalMass += vec[k];
      }
    }
    if (totalMass > 0) {
      for (let k = 1; k <= ceiling; k++) {
        combined[k] /= totalMass;
      }
    }
    return combined;
  };

  const steps: CharacterMultiCopyStepPmf[] = [
    {
      copyNumber: 1,
      pmf: mergeAndNormalizeStates(statePmfs, ceiling1),
      guaranteedPulls: ceiling1,
    },
  ];

  // Subsequent copies 2..N with exact Markov transition
  for (let copy = 2; copy <= n; copy++) {
    const ceilingC = computeCharacterMultiCopyCeiling(copy, clampedPity, isGuaranteed, clampedStreak);
    const nextStates: [number[], number[], number[], number[]] = [
      new Array(ceilingC + 1).fill(0),
      new Array(ceilingC + 1).fill(0),
      new Array(ceilingC + 1).fill(0),
      new Array(ceilingC + 1).fill(0),
    ];

    for (let s = 0; s < 4; s++) {
      const prevVec = statePmfs[s];
      // Skip empty states
      let hasMass = false;
      for (let k = 1; k < prevVec.length; k++) {
        if (prevVec[k] > 0) {
          hasMass = true;
          break;
        }
      }
      if (!hasMass) continue;

      const w = calculateRadianceWinRate(s);
      if (w >= 1.0) {
        // Streak 3: guaranteed win on 1st 5★, streak resets to 0
        accumulateScaledConvolution(nextStates[0], prevVec, cycleFresh, 1.0);
      } else {
        // Win 50/50 -> streak resets to 0
        accumulateScaledConvolution(nextStates[0], prevVec, cycleFresh, w);
        // Lose 50/50 + guaranteed 2nd 5★ -> streak increments
        const nextStreak = Math.min(3, s + 1);
        accumulateScaledConvolution(nextStates[nextStreak], prevVec, cycleTwoFresh, 1.0 - w);
      }
    }

    statePmfs = nextStates;
    steps.push({
      copyNumber: copy,
      pmf: mergeAndNormalizeStates(statePmfs, ceilingC),
      guaranteedPulls: ceilingC,
    });
  }

  return steps;
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
    const [step1] = computeCharacterMultiCopySteps(1, currentPity, isGuaranteed, auxiliaryState);
    return { pmf: step1.pmf, guaranteedPulls: step1.guaranteedPulls };
  } else if (bannerType === 'weapon') {
    const fatePoints = auxiliaryState;
    const rawPity = Number(currentPity);
    const clampedPity = Number.isFinite(rawPity)
      ? Math.max(0, Math.min(WEAPON_BANNER_RULES.hardPity - 1, Math.floor(rawPity)))
      : 0;
    const cycle1 = computeSingleCyclePmf(getWeaponPullRate, WEAPON_BANNER_RULES.hardPity, clampedPity);

    const rawFate = Number(fatePoints);
    const safeFate = Number.isFinite(rawFate) ? Math.floor(Math.max(0, rawFate)) : 0;
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
    const rawPity = Number(currentPity);
    const clampedPity = Number.isFinite(rawPity)
      ? Math.max(0, Math.min(CHRONICLED_BANNER_RULES.hardPity - 1, Math.floor(rawPity)))
      : 0;
    const cycle1 = computeSingleCyclePmf(
      getChronicledPullRate,
      CHRONICLED_BANNER_RULES.hardPity,
      clampedPity,
    );

    const rawFate = Number(fatePoints);
    const safeFate = Number.isFinite(rawFate) ? Math.floor(Math.max(0, rawFate)) : 0;
    if (safeFate >= CHRONICLED_BANNER_RULES.fatePointCeiling) {
      const guaranteedPulls = CHRONICLED_BANNER_RULES.hardPity - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(
      getChronicledPullRate,
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
 * Uses null sentinels for percentile extraction so edge cases (guaranteedPulls = 0 or 1) never stall.
 */
function analyzeOdds(
  pmf: number[],
  guaranteedPulls: number,
  pullsAvailable: number,
  isUncapped: boolean = false,
): GachaOddsResult {
  const rawPulls = Number(pullsAvailable);
  const safePulls = Number.isFinite(rawPulls) ? Math.max(0, Math.floor(rawPulls)) : 0;

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
  let p25: number | null = null;
  let p50: number | null = null;
  let p75: number | null = null;
  let p90: number | null = null;
  let p99: number | null = null;

  let cum = 0;
  for (let k = 1; k < pmf.length; k++) {
    cum += pmf[k];
    if (p25 === null && cum >= 0.25) p25 = k;
    if (p50 === null && cum >= 0.50) p50 = k;
    if (p75 === null && cum >= 0.75) p75 = k;
    if (p90 === null && cum >= 0.90) p90 = k;
    if (p99 === null && cum >= 0.99) {
      p99 = k;
      break;
    }
  }

  const fallbackPull = Math.max(1, guaranteedPulls || pmf.length - 1);
  const finalP25 = p25 ?? fallbackPull;
  const finalP50 = p50 ?? fallbackPull;
  const finalP75 = p75 ?? fallbackPull;
  const finalP90 = p90 ?? fallbackPull;
  const finalP99 = p99 ?? fallbackPull;

  const primogemsNeeded = isUncapped
    ? 0
    : Math.max(0, guaranteedPulls - safePulls) * 160;

  return {
    pullsAvailable: safePulls,
    cumulativeProbability: Number(cumulativeProbability.toFixed(4)),
    expectedPulls: Number(expectedPulls.toFixed(1)),
    medianPulls: finalP50,
    guaranteedPulls: isUncapped ? 0 : guaranteedPulls,
    primogemsNeeded,
    p25: finalP25,
    p50: finalP50,
    p75: finalP75,
    p90: finalP90,
    p99: finalP99,
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
 * Multi-Copy Goal Modeling:
 * - Character Banner: Exact 4-state Capturing Radiance Markov propagation across copies.
 * - Weapon & Chronicled Wishes: Discrete polynomial convolution (since acquiring a target
 *   always resets pity=0, fatePoints=0, weaponGuaranteed=false).
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
  const rawN = Number(copiesNeeded);
  const n = Number.isFinite(rawN) ? Math.max(1, Math.floor(rawN)) : 1;

  if (n === 1) {
    if (bannerType === 'character') {
      return calculateCharacterBannerOdds(pullsAvailable, currentPity, isGuaranteed, auxiliaryState);
    } else if (bannerType === 'weapon') {
      return calculateWeaponBannerOdds(pullsAvailable, currentPity, auxiliaryState, weaponGuaranteed);
    } else {
      return calculateChronicledWishOdds(pullsAvailable, currentPity, auxiliaryState);
    }
  }

  if (bannerType === 'character') {
    const steps = computeCharacterMultiCopySteps(n, currentPity, isGuaranteed, auxiliaryState);
    const breakdowns: MultiCopyStepBreakdown[] = steps.map((step) => {
      const stepOdds = analyzeOdds(step.pmf, step.guaranteedPulls, pullsAvailable);
      return {
        copyNumber: step.copyNumber,
        label: `Copy ${step.copyNumber}`,
        expectedPulls: stepOdds.expectedPulls,
        medianPulls: stepOdds.medianPulls,
        guaranteedPulls: stepOdds.guaranteedPulls,
        cumulativeProbability: stepOdds.cumulativeProbability,
      };
    });

    const lastStep = steps[steps.length - 1];
    const finalOdds = analyzeOdds(lastStep.pmf, lastStep.guaranteedPulls, pullsAvailable);
    return {
      ...finalOdds,
      copiesBreakdown: breakdowns,
    };
  }

  // Weapon & Chronicled: Copy 1 (current state) convolved with (N-1) fresh copies
  const copy1Target = computeTargetPmf(
    bannerType,
    currentPity,
    isGuaranteed,
    auxiliaryState,
    weaponGuaranteed,
  );
  const freshTarget = computeTargetPmf(bannerType, 0, false, 0, false);

  const breakdowns: MultiCopyStepBreakdown[] = [];
  let currentPmf = copy1Target.pmf;
  let currentGuaranteed = copy1Target.guaranteedPulls;

  const step1Odds = analyzeOdds(currentPmf, currentGuaranteed, pullsAvailable);
  breakdowns.push({
    copyNumber: 1,
    label: `Copy 1`,
    expectedPulls: step1Odds.expectedPulls,
    medianPulls: step1Odds.medianPulls,
    guaranteedPulls: step1Odds.guaranteedPulls,
    cumulativeProbability: step1Odds.cumulativeProbability,
  });

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

  const rawN = Number(copiesNeeded);
  const n = Number.isFinite(rawN) ? Math.max(1, Math.floor(rawN)) : 1;

  if (bannerType === 'character') {
    const steps = computeCharacterMultiCopySteps(n, currentPity, isGuaranteed, auxiliaryState);
    const last = steps[steps.length - 1];
    pmf = last.pmf;
    guaranteedPulls = last.guaranteedPulls;
  } else if (n > 1) {
    const copy1 = computeTargetPmf(
      bannerType,
      currentPity,
      isGuaranteed,
      auxiliaryState,
      weaponGuaranteed,
    );
    const fresh = computeTargetPmf(bannerType, 0, false, 0, false);
    pmf = copy1.pmf;
    guaranteedPulls = copy1.guaranteedPulls;
    for (let c = 2; c <= n; c++) {
      pmf = convolvePmfs(pmf, fresh.pmf);
      guaranteedPulls += fresh.guaranteedPulls;
    }
  } else {
    const target = computeTargetPmf(
      bannerType,
      currentPity,
      isGuaranteed,
      auxiliaryState,
      weaponGuaranteed,
    );
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
