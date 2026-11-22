/**
 * Authoritative Banner Rules & Gacha Mechanics (Version 7.2 Baseline)
 *
 * Single source of truth for base rates, soft pity thresholds, hard pity limits,
 * Capturing Radiance 4-state Markov renewal parameters, Fate Point rules, and guarantee carryover.
 */

import { CURRENT_GAME_VERSION } from './game-version';

export const GACHA_RULES_VERSION = CURRENT_GAME_VERSION;

export interface BannerRuleConfig {
  baseRate: number;
  softPityStart: number;
  hardPity: number;
  softIncrement: number;
  fatePointCeiling?: number;
  fatePointsCarryOver: boolean;
  pityCarriesOver: boolean;
  guaranteeCarriesOver: boolean;
}

/**
 * Character Event Wish Rules (5.0+ / 7.2 Baseline)
 * - 0.600% base 5★ rate
 * - Soft pity starts at pull 74 (+6.0% per pull)
 * - Hard pity at pull 90
 * - Capturing Radiance 4-state Markov renewal model on 50/50:
 *   Streak 0: 50.0% win rate
 *   Streak 1: 50.0% win rate
 *   Streak 2: 8/11 (~72.727%) win rate
 *   Streak 3+: 100.0% guaranteed featured win
 *   Stationary consolidated 50/50 win rate = exactly 55.000%
 */
export const CHARACTER_BANNER_RULES: BannerRuleConfig & {
  radianceStreakRates: readonly [number, number, number, number];
  consolidatedWinRate: number;
} = {
  baseRate: 0.006,
  softPityStart: 74,
  hardPity: 90,
  softIncrement: 0.06,
  fatePointsCarryOver: false,
  pityCarriesOver: true,
  guaranteeCarriesOver: true,
  radianceStreakRates: [0.50, 0.50, 8 / 11, 1.00] as const,
  consolidatedWinRate: 0.55,
};

/**
 * Weapon Event Wish Rules (5.0+ / 7.2 Baseline)
 * - 0.700% base 5★ rate
 * - Soft pity starts at pull 63 (+7.0% per pull)
 * - Hard pity at pull 80
 * - Fate Point ceiling: 1 (Reduced from 2 in Version 5.0)
 * - 75/25 rate-up rule:
 *   - Initial state (weaponGuaranteed = false): 75% rate-up (37.5% per featured weapon)
 *   - Guaranteed state (weaponGuaranteed = true after off-banner loss): 100% rate-up (50.0% per featured weapon)
 * - Fate Points do NOT carry over between phases; 75/25 off-banner guarantee DOES carry over.
 */
export const WEAPON_BANNER_RULES: BannerRuleConfig & {
  baseTargetRate: number;
  guaranteedRateUpTargetRate: number;
  fatePointCeiling: number;
} = {
  baseRate: 0.007,
  softPityStart: 63,
  hardPity: 80,
  softIncrement: 0.07,
  fatePointCeiling: 1,
  fatePointsCarryOver: false,
  pityCarriesOver: true,
  guaranteeCarriesOver: true,
  baseTargetRate: 0.375, // 75% rate-up / 2 featured weapons
  guaranteedRateUpTargetRate: 0.50, // 100% rate-up / 2 featured weapons
};

/**
 * Chronicled Wish Rules (4.5+ / 7.2 Baseline)
 * - 0.600% base 5★ rate
 * - Soft pity starts at pull 74 (+6.0% per pull)
 * - Hard pity at pull 90
 * - Fate Point ceiling: 1
 * - Base rate-up target rate: 50.0%
 * - Pity carries over between Chronicled Wish periods; Fate Points reset to 0.
 * - Capturing Radiance does NOT apply to Chronicled Wish.
 */
export const CHRONICLED_BANNER_RULES: BannerRuleConfig & {
  baseTargetRate: number;
  fatePointCeiling: number;
} = {
  baseRate: 0.006,
  softPityStart: 74,
  hardPity: 90,
  softIncrement: 0.06,
  fatePointCeiling: 1,
  fatePointsCarryOver: false,
  pityCarriesOver: true,
  guaranteeCarriesOver: false,
  baseTargetRate: 0.50,
};

/**
 * 4-Star Pull & Pity Rules
 * - Character/Chronicled Wish: 5.100% base rate
 * - Weapon Wish: 6.000% base rate
 * - Soft pity starts at pull 9 (+51.0% increment)
 * - Hard pity at pull 10 (100% 4★ or higher)
 * - Rate-up: 50% rate-up pool (split across 3 featured 4★ units = ~16.67% target rate)
 * - Guaranteed rate-up: 100% pool (split across 3 featured 4★ units = ~33.33% target rate)
 * - No hard ceiling / Fate Points exist for specific 4★ targets.
 */
export const FOUR_STAR_RULES = {
  characterBaseRate: 0.051,
  weaponBaseRate: 0.060,
  softPityStart: 9,
  hardPity: 10,
  softIncrement: 0.51,
  featuredPoolCount: 3,
  baseRateUpChance: 0.50,
  guaranteedRateUpChance: 1.00,
  targetOddsNonGuaranteed: 0.50 / 3, // ~16.667%
  targetOddsGuaranteed: 1.00 / 3,    // ~33.333%
} as const;

/**
 * Masterless Starglitter Cashback Projection Factor (~8.0%)
 * Accounts for 4★ and 5★ duplicates converted to Starglitter (5 Starglitter = 1 Intertwined Fate).
 */
export const STARGLITTER_CASHBACK_RATE = 0.08;
