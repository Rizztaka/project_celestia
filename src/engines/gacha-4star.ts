/**
 * Version 7.2 Featured 4-Star Absorbing Markov Chain Gacha Engine
 *
 * Featured 4-star targets do NOT have a hard ceiling or Fate Point guarantee.
 * This engine uses an absorbing Markov chain combined with exact 10-pull soft/hard
 * pity cycles (segregated by Character vs Weapon banner 4★ rules) to model the
 * true uncapped probability distribution of featured 4-star acquisition.
 *
 * Mechanics (from src/data/banner-rules.ts):
 * - Character/Chronicled 4★: 5.100% base, pull 9 soft (56.1%), pull 10 hard (100%);
 *   50% rate-up across 3 featured units (16.67% non-guaranteed, 33.33% guaranteed).
 *   Closed-form expected drops: 4.50 (~34.6 pulls mean, ~26 pulls median, ~77 pulls p90).
 * - Weapon 4★: 6.000% base, pull 8 soft (66.0%), pull 9 (96.0%), pull 10 hard (100%);
 *   75% rate-up across 5 featured weapons (15.00% non-guaranteed, 20.00% guaranteed).
 *   Closed-form expected drops: 6.25 (~44.1 pulls mean, ~34 pulls median, ~99 pulls p90).
 */

import { FOUR_STAR_RULES } from '../data/banner-rules';
import type { GachaOddsResult, MultiCopyStepBreakdown } from './gacha-math';
import { convolvePmfs } from './gacha-math';

/**
 * Conditional probability of receiving a 4★ (or higher) on 4★ pity pull n (1..10).
 */
export function get4StarPullRate(
  n: number,
  bannerType: 'character' | 'weapon' = 'character',
): number {
  if (n <= 0) return 0;
  if (n >= FOUR_STAR_RULES.hardPity) return 1.0;

  if (bannerType === 'weapon') {
    if (n === FOUR_STAR_RULES.weaponSoftPityStart) return FOUR_STAR_RULES.weaponPull8Rate;
    if (n === FOUR_STAR_RULES.weaponSoftPityStart + 1) return FOUR_STAR_RULES.weaponPull9Rate;
    return FOUR_STAR_RULES.weaponBaseRate;
  }

  if (n >= FOUR_STAR_RULES.softPityStart) {
    return Math.min(1.0, FOUR_STAR_RULES.characterBaseRate + FOUR_STAR_RULES.softIncrement);
  }
  return FOUR_STAR_RULES.characterBaseRate;
}

/**
 * Computes single 10-pull 4★ cycle PMF (probability of 4★ appearing on additional pull k in 1..10-pity).
 */
function compute4StarCyclePmf(
  currentPity: number = 0,
  bannerType: 'character' | 'weapon' = 'character',
): number[] {
  const rawPity = Number(currentPity);
  const safePity = Number.isFinite(rawPity)
    ? Math.max(0, Math.min(FOUR_STAR_RULES.hardPity - 1, Math.floor(rawPity)))
    : 0;
  const maxAdditional = FOUR_STAR_RULES.hardPity - safePity;
  const pmf: number[] = new Array(maxAdditional + 1).fill(0);

  let survival = 1.0;
  for (let k = 1; k <= maxAdditional; k++) {
    const pullNumber = safePity + k;
    const rate = get4StarPullRate(pullNumber, bannerType);
    const prob = survival * rate;
    pmf[k] = prob;
    survival *= 1.0 - rate;
  }

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
 * via absorbing Markov renewal method with adaptive tail convergence (< 1e-9 residual mass).
 */
function computeSingleCopy4StarPmf(
  currentPity: number = 0,
  isGuaranteed: boolean = false,
  bannerType: 'character' | 'weapon' = 'character',
  maxDropsCap: number = 120,
): number[] {
  const initCyclePmf = compute4StarCyclePmf(currentPity, bannerType);
  const freshCyclePmf = compute4StarCyclePmf(0, bannerType);

  const isWeapon = bannerType === 'weapon';
  const poolCount = isWeapon
    ? FOUR_STAR_RULES.weaponFeaturedPoolCount
    : FOUR_STAR_RULES.featuredPoolCount;
  const baseRateUp = isWeapon
    ? FOUR_STAR_RULES.weaponBaseRateUpChance
    : FOUR_STAR_RULES.baseRateUpChance;

  const pWin0 = baseRateUp / poolCount;
  const pOther0 = (baseRateUp * (poolCount - 1)) / poolCount;
  const pOff0 = 1.0 - baseRateUp;

  const pWin1 = FOUR_STAR_RULES.guaranteedRateUpChance / poolCount;
  const pOther1 = (FOUR_STAR_RULES.guaranteedRateUpChance * (poolCount - 1)) / poolCount;

  // Compute E[m]: exact probability target is acquired on the m-th 4★ drop
  const E: number[] = [0];
  let p0 = isGuaranteed ? 0 : 1.0;
  let p1 = isGuaranteed ? 1.0 : 0;

  for (let m = 1; m <= maxDropsCap; m++) {
    const winProb = p0 * pWin0 + p1 * pWin1;
    E.push(winProb);

    const nextP0 = p0 * pOther0 + p1 * pOther1;
    const nextP1 = p0 * pOff0;
    p0 = nextP0;
    p1 = nextP1;

    if (p0 + p1 < 1e-9) {
      break;
    }
  }

  // Normalize E(m) for negligible remaining tail (< 1e-9)
  const eSum = E.reduce((acc, v) => acc + v, 0);
  if (eSum > 0) {
    for (let m = 1; m < E.length; m++) {
      E[m] /= eSum;
    }
  }

  // Convolve pull timing for each drop count m
  let totalPmf: number[] = [0];
  let currentDropPmf = initCyclePmf;

  for (let m = 1; m < E.length; m++) {
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
    if (m + 1 < E.length) {
      currentDropPmf = convolvePmfs(currentDropPmf, freshCyclePmf);
    }
  }

  const sum = totalPmf.reduce((acc, v) => acc + v, 0);
  if (sum > 0) {
    for (let k = 0; k < totalPmf.length; k++) {
      totalPmf[k] /= sum;
    }
  }

  return totalPmf;
}

function extractPercentiles(pmf: number[]): {
  expectedPulls: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p99: number;
} {
  let expectedPulls = 0;
  let p25: number | null = null;
  let p50: number | null = null;
  let p75: number | null = null;
  let p90: number | null = null;
  let p99: number | null = null;
  let cum = 0;

  for (let k = 1; k < pmf.length; k++) {
    const pk = pmf[k];
    expectedPulls += k * pk;
    cum += pk;
    if (p25 === null && cum >= 0.25) p25 = k;
    if (p50 === null && cum >= 0.50) p50 = k;
    if (p75 === null && cum >= 0.75) p75 = k;
    if (p90 === null && cum >= 0.90) p90 = k;
    if (p99 === null && cum >= 0.99) p99 = k;
  }

  const tail = Math.max(1, pmf.length - 1);
  return {
    expectedPulls,
    p25: p25 ?? tail,
    p50: p50 ?? tail,
    p75: p75 ?? tail,
    p90: p90 ?? tail,
    p99: p99 ?? tail,
  };
}

export function calculate4StarTargetOdds(
  pullsAvailable: number,
  currentPity: number = 0,
  isGuaranteed: boolean = false,
  targetCopies: number = 1,
  bannerType: 'character' | 'weapon' = 'character',
): GachaOddsResult {
  const rawPulls = Number(pullsAvailable);
  const safePulls = Number.isFinite(rawPulls) ? Math.max(0, Math.floor(rawPulls)) : 0;
  const rawCopies = Number(targetCopies);
  const copies = Number.isFinite(rawCopies) ? Math.max(1, Math.floor(rawCopies)) : 1;

  let pmf = computeSingleCopy4StarPmf(currentPity, isGuaranteed, bannerType);
  const breakdowns: MultiCopyStepBreakdown[] = [];

  const analyzeSinglePmf = (p: number[], copyNum: number): MultiCopyStepBreakdown => {
    const stats = extractPercentiles(p);
    let cumAtPulls = 0;
    for (let k = 1; k <= safePulls && k < p.length; k++) {
      cumAtPulls += p[k];
    }

    return {
      copyNumber: copyNum,
      label: `Copy ${copyNum}`,
      expectedPulls: Number(stats.expectedPulls.toFixed(1)),
      medianPulls: stats.p50,
      guaranteedPulls: 0,
      cumulativeProbability: Number(Math.min(1.0, Math.max(0.0, cumAtPulls)).toFixed(4)),
    };
  };

  breakdowns.push(analyzeSinglePmf(pmf, 1));

  if (copies > 1) {
    // After winning a featured 4★, 4★ guarantee is always consumed (false) and 4★ pity resets to 0
    const freshPmf = computeSingleCopy4StarPmf(0, false, bannerType);
    for (let c = 2; c <= copies; c++) {
      pmf = convolvePmfs(pmf, freshPmf);
      breakdowns.push(analyzeSinglePmf(pmf, c));
    }
  }

  const finalStats = extractPercentiles(pmf);

  let cumulativeProbability = 0;
  for (let k = 1; k <= safePulls && k < pmf.length; k++) {
    cumulativeProbability += pmf[k];
  }
  cumulativeProbability = Math.min(1.0, Math.max(0.0, cumulativeProbability));

  return {
    pullsAvailable: safePulls,
    cumulativeProbability: Number(cumulativeProbability.toFixed(4)),
    expectedPulls: Number(finalStats.expectedPulls.toFixed(1)),
    medianPulls: finalStats.p50,
    guaranteedPulls: 0,
    primogemsNeeded: 0,
    p25: finalStats.p25,
    p50: finalStats.p50,
    p75: finalStats.p75,
    p90: finalStats.p90,
    p99: finalStats.p99,
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
  const rawCopies = Number(targetCopies);
  const copies = Number.isFinite(rawCopies) ? Math.max(1, Math.floor(rawCopies)) : 1;

  let pmf = computeSingleCopy4StarPmf(currentPity, isGuaranteed, bannerType);
  if (copies > 1) {
    const fresh = computeSingleCopy4StarPmf(0, false, bannerType);
    for (let c = 2; c <= copies; c++) {
      pmf = convolvePmfs(pmf, fresh);
    }
  }

  const distribution: Array<{ pulls: number; probability: number }> = [];
  distribution.push({ pulls: 0, probability: 0 });

  let cumulative = 0;
  const maxVisualPulls = Math.min(pmf.length - 1, (bannerType === 'weapon' ? 320 : 260) * copies);

  for (let k = 1; k <= maxVisualPulls; k++) {
    cumulative += pmf[k] || 0;
    distribution.push({
      pulls: k,
      probability: Number(Math.min(1.0, cumulative).toFixed(4)),
    });
    if (cumulative >= 0.9995 && k >= 150 * copies) {
      break;
    }
  }

  return distribution;
}
