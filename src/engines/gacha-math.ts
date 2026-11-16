/**
 * 5.x Genshin Impact Gacha Probability & Expected Wish Cost Engine
 * Accurately models Character Event Wishes (Capturing Radiance ~55% win rate)
 * and Weapon Event Wishes (5.0+ 1 Fate Point guarantee ceiling).
 */

export interface GachaOddsResult {
  pullsAvailable: number;
  cumulativeProbability: number; // 0.0 to 1.0
  expectedPulls: number;
  medianPulls: number;
  guaranteedPulls: number;
  primogemsNeeded: number;
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

// Character banner constants
const CHAR_BASE_RATE = 0.006;
const CHAR_SOFT_PITY_START = 74;
const CHAR_HARD_PITY = 90;
const CHAR_SOFT_INCREMENT = 0.06;

/**
 * State-aware Capturing Radiance probability model (Genshin 5.0+).
 * Evaluates the net win rate for a non-guaranteed 5-star pull:
 * P(Win) = 0.50 + 0.50 * P(Radiance | streak)
 * Base Radiance activation rate is ~10% (net ~55% win rate).
 * With consecutive 50/50 losses, Radiance chance escalates:
 * - 0 losses: 10% Radiance -> 55.0% net win rate
 * - 1 loss:   55% Radiance -> 77.5% net win rate
 * - 2+ losses: 100% Radiance -> 100% guaranteed featured win
 */
export function calculateRadianceWinRate(consecutiveLosses: number = 0): number {
  const safeLosses = Math.max(0, Math.floor(Number(consecutiveLosses) || 0));
  const conditionalRadiance = Math.min(1.0, 0.10 + 0.45 * safeLosses);
  return 0.50 + 0.50 * conditionalRadiance;
}

// Weapon banner constants (5.0+)
const WEAPON_BASE_RATE = 0.007;
const WEAPON_SOFT_PITY_START = 63;
const WEAPON_HARD_PITY = 80;
const WEAPON_SOFT_INCREMENT = 0.07;
const WEAPON_WIN_RATE = 0.375; // 75% rate-up / 2 featured weapons

/**
 * Returns conditional probability of 5-star on pull n given no 5-star on 1..n-1.
 */
function getCharacterPullRate(n: number): number {
  if (n <= 0) return 0;
  if (n < CHAR_SOFT_PITY_START) return CHAR_BASE_RATE;
  if (n < CHAR_HARD_PITY) {
    return Math.min(1.0, CHAR_BASE_RATE + CHAR_SOFT_INCREMENT * (n - (CHAR_SOFT_PITY_START - 1)));
  }
  return 1.0;
}

function getWeaponPullRate(n: number): number {
  if (n <= 0) return 0;
  if (n < WEAPON_SOFT_PITY_START) return WEAPON_BASE_RATE;
  if (n < WEAPON_HARD_PITY) {
    return Math.min(1.0, WEAPON_BASE_RATE + WEAPON_SOFT_INCREMENT * (n - (WEAPON_SOFT_PITY_START - 1)));
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
 * Computes the PMF of pulls needed to acquire the target item.
 * Index k represents total additional pulls.
 * For character banner, auxiliaryState represents consecutiveLosses.
 * For weapon banner, auxiliaryState represents fatePoints.
 */
function computeTargetPmf(
  bannerType: 'character' | 'weapon',
  currentPity: number,
  isGuaranteed: boolean,
  auxiliaryState: number = 0,
): { pmf: number[]; guaranteedPulls: number } {
  if (bannerType === 'character') {
    const consecutiveLosses = auxiliaryState;
    const safeRawPity = Math.floor(Number(currentPity) || 0);
    const clampedPity = Math.max(0, Math.min(CHAR_HARD_PITY - 1, safeRawPity));
    const cycle1 = computeSingleCyclePmf(getCharacterPullRate, CHAR_HARD_PITY, clampedPity);

    const winRate = calculateRadianceWinRate(consecutiveLosses);

    if (isGuaranteed || winRate >= 1.0) {
      const guaranteedPulls = CHAR_HARD_PITY - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(getCharacterPullRate, CHAR_HARD_PITY, 0);
    const guaranteedPulls = (CHAR_HARD_PITY - clampedPity) + CHAR_HARD_PITY;
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
  } else {
    // Weapon Banner
    const fatePoints = auxiliaryState;
    const safeRawPity = Math.floor(Number(currentPity) || 0);
    const clampedPity = Math.max(0, Math.min(WEAPON_HARD_PITY - 1, safeRawPity));
    const cycle1 = computeSingleCyclePmf(getWeaponPullRate, WEAPON_HARD_PITY, clampedPity);

    const safeFate = Math.floor(Math.max(0, Number(fatePoints) || 0));
    if (safeFate >= 1) {
      const guaranteedPulls = WEAPON_HARD_PITY - clampedPity;
      return { pmf: cycle1, guaranteedPulls };
    }

    const cycleFresh = computeSingleCyclePmf(getWeaponPullRate, WEAPON_HARD_PITY, 0);
    const guaranteedPulls = (WEAPON_HARD_PITY - clampedPity) + WEAPON_HARD_PITY;
    const pmf: number[] = new Array(guaranteedPulls + 1).fill(0);

    const winRate = WEAPON_WIN_RATE; // 37.5%
    const lossRate = 1.0 - winRate; // 62.5%

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
 * Calculates gacha statistics from a target PMF.
 */
function analyzeOdds(
  pmf: number[],
  guaranteedPulls: number,
  pullsAvailable: number,
): GachaOddsResult {
  const safePulls = Math.max(0, Math.floor(Number(pullsAvailable) || 0));

  let cumulativeProbability = 0;
  if (safePulls >= guaranteedPulls) {
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

  // Median pulls (pull count at which cumulative probability >= 0.50)
  let medianPulls = guaranteedPulls;
  let cum = 0;
  for (let k = 1; k < pmf.length; k++) {
    cum += pmf[k];
    if (cum >= 0.50) {
      medianPulls = k;
      break;
    }
  }

  const primogemsNeeded = Math.max(0, guaranteedPulls - safePulls) * 160;

  return {
    pullsAvailable: safePulls,
    cumulativeProbability: Number(cumulativeProbability.toFixed(4)),
    expectedPulls: Number(expectedPulls.toFixed(1)),
    medianPulls,
    guaranteedPulls,
    primogemsNeeded,
  };
}

export function calculateCharacterBannerOdds(
  pullsAvailable: number,
  currentPity: number,
  isGuaranteed: boolean,
  consecutiveLosses: number = 0,
): GachaOddsResult {
  const { pmf, guaranteedPulls } = computeTargetPmf('character', currentPity, isGuaranteed, consecutiveLosses);
  return analyzeOdds(pmf, guaranteedPulls, pullsAvailable);
}

export function calculateWeaponBannerOdds(
  pullsAvailable: number,
  currentPity: number,
  fatePoints: number = 0,
): GachaOddsResult {
  const { pmf, guaranteedPulls } = computeTargetPmf('weapon', currentPity, false, fatePoints);
  return analyzeOdds(pmf, guaranteedPulls, pullsAvailable);
}

export function generateProbabilityDistribution(
  bannerType: 'character' | 'weapon',
  currentPity: number,
  isGuaranteed: boolean,
  auxiliaryState: number = 0,
): Array<{ pulls: number; probability: number }> {
  const { pmf, guaranteedPulls } = computeTargetPmf(bannerType, currentPity, isGuaranteed, auxiliaryState);

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
