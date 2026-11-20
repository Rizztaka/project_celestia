/**
 * Version 7.2 Featured 4-Star Absorbing Markov Chain Gacha Engine
 *
 * Featured 4-star targets do NOT have a hard ceiling or Fate Point guarantee.
 * This engine uses an absorbing Markov chain combined with 10-pull soft/hard pity cycles
 * to model the true continuous probability distribution of featured 4-star acquisition.
 *
 * Mechanics:
 * - 4★ Base Rate: 5.100% (Character/Chronicled) or 6.000% (Weapon)
 * - 4★ Pity: Soft pity starts at pull 9 (+51%), hard pity at pull 10
 * - Rate-Up: 50% rate-up pool (split across 3 featured 4★ = ~16.67% target chance)
 * - Guaranteed Rate-Up: 100% pool (split across 3 featured 4★ = ~33.33% target chance)
 * - Expected Median: ~35 pulls; 90th percentile: ~105 pulls
 */

import { FOUR_STAR_RULES } from '../data/banner-rules';
import type { GachaOddsResult, MultiCopyStepBreakdown } from './gacha-math';
import { convolvePmfs } from './gacha-math';

/**
 * Computes single 10-pull 4★ cycle PMF (probability of 4★ appearing on pull k in 1..10-pity)
 */
function compute4StarCyclePmf(
  currentPity: number = 0,
  bannerType: 'character' | 'weapon' = 'character',
): number[] {
  const safePity = Math.max(0, Math.min(FOUR_STAR_RULES.hardPity - 1, Math.floor(Number(currentPity) || 0)));
  const maxAdditional = FOUR_STAR_RULES.hardPity - safePity;
  const pmf: number[] = new Array(maxAdditional + 1).fill(0);

  const baseRate =
    bannerType === 'weapon'
      ? FOUR_STAR_RULES.weaponBaseRate
      : FOUR_STAR_RULES.characterBaseRate;

  let survival = 1.0;
  for (let k = 1; k <= maxAdditional; k++) {
    const pullNumber = safePity + k;
    let rate: number = baseRate;
    if (pullNumber >= FOUR_STAR_RULES.hardPity) {
      rate = 1.0;
    } else if (pullNumber >= FOUR_STAR_RULES.softPityStart) {
      rate = Math.min(1.0, baseRate + FOUR_STAR_RULES.softIncrement);
    }

    const prob = survival * rate;
    pmf[k] = prob;
    survival *= 1.0 - rate;
  }

  // Normalize
  const sum = pmf.reduce((a, b) => a + b, 0);
  if (sum > 0) {
    for (let k = 1; k <= maxAdditional; k++) {
      pmf[k] /= sum;
    }
  }

  return pmf;
}

/**
 * Computes the PMF of pulls needed to acquire 1 target 4-star copy
 * via absorbing Markov renewal method.
 */
function computeSingleCopy4StarPmf(
  currentPity: number = 0,
  isGuaranteed: boolean = false,
  bannerType: 'character' | 'weapon' = 'character',
  maxDrops: number = 45,
): number[] {
  const initCyclePmf = compute4StarCyclePmf(currentPity, bannerType);
  const freshCyclePmf = compute4StarCyclePmf(0, bannerType);

  // Markov chain states:
  // State 0: 50/50 rate-up
  // State 1: Guaranteed rate-up
  // Terminal: Target acquired
  const P_win_0 = FOUR_STAR_RULES.targetOddsNonGuaranteed; // 1/6
  const P_other_0 = (FOUR_STAR_RULES.baseRateUpChance * (FOUR_STAR_RULES.featuredPoolCount - 1)) / FOUR_STAR_RULES.featuredPoolCount; // 1/3 -> State 0
  const P_off_0 = 1.0 - FOUR_STAR_RULES.baseRateUpChance; // 1/2 -> State 1

  const P_win_1 = FOUR_STAR_RULES.targetOddsGuaranteed; // 1/3
  const P_other_1 = ((1.0) * (FOUR_STAR_RULES.featuredPoolCount - 1)) / FOUR_STAR_RULES.featuredPoolCount; // 2/3 -> State 0

  // Calculate E(m): prob target acquired on exactly the m-th 4-star drop
  const E: number[] = new Array(maxDrops + 1).fill(0);
  let p0 = isGuaranteed ? 0 : 1.0;
  let p1 = isGuaranteed ? 1.0 : 0;

  for (let m = 1; m <= maxDrops; m++) {
    const winFrom0 = p0 * P_win_0;
    const winFrom1 = p1 * P_win_1;
    E[m] = winFrom0 + winFrom1;

    const nextP0 = p0 * P_other_0 + p1 * P_other_1;
    const nextP1 = p0 * P_off_0;

    p0 = nextP0;
    p1 = nextP1;
  }

  // Normalize E(m) to ensure total probability equals 1.0
  const eSum = E.reduce((acc, v) => acc + v, 0);
  if (eSum > 0) {
    for (let m = 1; m <= maxDrops; m++) {
      E[m] /= eSum;
    }
  }

  // Convolve pull timing for each drop count m
  // Cm is the pull timing of m-th drop
  let totalPmf: number[] = [0];
  let currentDropPmf = initCyclePmf;

  for (let m = 1; m <= maxDrops; m++) {
    const em = E[m];
    if (em > 0) {
      if (currentDropPmf.length > totalPmf.length) {
        const expanded = new Array(currentDropPmf.length).fill(0);
        for (let i = 0; i < totalPmf.length; i++) expanded[i] = totalPmf[i];
        totalPmf = expanded;
      }
      for (let k = 0; k < currentDropPmf.length; k++) {
        totalPmf[k] += em * currentDropPmf[k];
      }
    }
    currentDropPmf = convolvePmfs(currentDropPmf, freshCyclePmf);
  }

  // Normalize final PMF
  const sum = totalPmf.reduce((acc, v) => acc + v, 0);
  if (sum > 0) {
    for (let k = 0; k < totalPmf.length; k++) {
      totalPmf[k] /= sum;
    }
  }

  return totalPmf;
}

export function calculate4StarTargetOdds(
  pullsAvailable: number,
  currentPity: number = 0,
  isGuaranteed: boolean = false,
  targetCopies: number = 1,
  bannerType: 'character' | 'weapon' = 'character',
): GachaOddsResult {
  const safePulls = Math.max(0, Math.floor(Number(pullsAvailable) || 0));
  const copies = Math.max(1, Math.floor(Number(targetCopies) || 1));

  let pmf = computeSingleCopy4StarPmf(currentPity, isGuaranteed, bannerType);
  const breakdowns: MultiCopyStepBreakdown[] = [];

  // Helper to analyze partial PMF
  const analyzeSinglePmf = (p: number[], copyNum: number) => {
    let cum = 0;
    let expected = 0;
    let median = 0;
    for (let k = 1; k < p.length; k++) {
      expected += k * p[k];
      cum += p[k];
      if (median === 0 && cum >= 0.50) {
        median = k;
      }
    }

    let cumAtPulls = 0;
    for (let k = 1; k <= safePulls && k < p.length; k++) {
      cumAtPulls += p[k];
    }

    return {
      copyNumber: copyNum,
      label: `Copy ${copyNum}`,
      expectedPulls: Number(expected.toFixed(1)),
      medianPulls: median || 35 * copyNum,
      guaranteedPulls: 0,
      cumulativeProbability: Number(Math.min(1.0, cumAtPulls).toFixed(4)),
    };
  };

  breakdowns.push(analyzeSinglePmf(pmf, 1));

  if (copies > 1) {
    const freshPmf = computeSingleCopy4StarPmf(0, false, bannerType);
    for (let c = 2; c <= copies; c++) {
      pmf = convolvePmfs(pmf, freshPmf);
      breakdowns.push(analyzeSinglePmf(pmf, c));
    }
  }

  // Compute final percentiles
  let expectedPulls = 0;
  for (let k = 1; k < pmf.length; k++) {
    expectedPulls += k * pmf[k];
  }

  let p25 = 0;
  let p50 = 0;
  let p75 = 0;
  let p90 = 0;
  let p99 = 0;
  let cum = 0;

  for (let k = 1; k < pmf.length; k++) {
    cum += pmf[k];
    if (p25 === 0 && cum >= 0.25) p25 = k;
    if (p50 === 0 && cum >= 0.50) p50 = k;
    if (p75 === 0 && cum >= 0.75) p75 = k;
    if (p90 === 0 && cum >= 0.90) p90 = k;
    if (p99 === 0 && cum >= 0.99) {
      p99 = k;
      break;
    }
  }

  let cumulativeProbability = 0;
  for (let k = 1; k <= safePulls && k < pmf.length; k++) {
    cumulativeProbability += pmf[k];
  }
  cumulativeProbability = Math.min(1.0, Math.max(0.0, cumulativeProbability));

  return {
    pullsAvailable: safePulls,
    cumulativeProbability: Number(cumulativeProbability.toFixed(4)),
    expectedPulls: Number(expectedPulls.toFixed(1)),
    medianPulls: p50 || 35 * copies,
    guaranteedPulls: 0,
    primogemsNeeded: 0,
    p25: p25 || 20 * copies,
    p50: p50 || 35 * copies,
    p75: p75 || 65 * copies,
    p90: p90 || 105 * copies,
    p99: p99 || 180 * copies,
    isUncapped: true,
    copiesBreakdown: copies > 1 ? breakdowns : undefined,
  };
}

export function generate4StarProbabilityDistribution(
  currentPity: number = 0,
  isGuaranteed: boolean = false,
  bannerType: 'character' | 'weapon' = 'character',
  targetCopies: number = 1,
): Array<{ pulls: number; probability: number }> {
  let pmf = computeSingleCopy4StarPmf(currentPity, isGuaranteed, bannerType);
  if (targetCopies > 1) {
    const fresh = computeSingleCopy4StarPmf(0, false, bannerType);
    for (let c = 2; c <= targetCopies; c++) {
      pmf = convolvePmfs(pmf, fresh);
    }
  }

  const distribution: Array<{ pulls: number; probability: number }> = [];
  distribution.push({ pulls: 0, probability: 0 });

  let cumulative = 0;
  // Truncate at p99.9 or 250 pulls
  const limit = Math.min(pmf.length - 1, 260 * targetCopies);

  for (let k = 1; k <= limit; k++) {
    cumulative += pmf[k] || 0;
    distribution.push({
      pulls: k,
      probability: Number(Math.min(1.0, cumulative).toFixed(4)),
    });
    if (cumulative >= 0.9995 && k >= 150 * targetCopies) {
      break;
    }
  }

  return distribution;
}
