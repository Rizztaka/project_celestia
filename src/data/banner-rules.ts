/**
 * Authoritative Banner Rules & Gacha Mechanics (Version 7.2 Baseline)
 *
 * Single source of truth for base rates, soft pity thresholds, hard pity limits,
 * Capturing Radiance 4-state Markov renewal parameters, Fate Point rules,
 * 4-star absorbing Markov parameters, and provenance links.
 *
 * Patch Maintenance:
 * When HoYoverse modifies wish probabilities or pity rules, update the relevant
 * config object here, update its linked entry in `src/data/provenance-registry.ts`,
 * and run `pnpm test src/engines/gacha-verification.test.ts`.
 */

import { CURRENT_GAME_VERSION } from './game-version';

export const GACHA_RULES_VERSION = CURRENT_GAME_VERSION;

export interface BannerRuleConfig {
  provenanceId: string;
  versionIntroduced: string;
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
  provenanceId: 'gacha_rules_character_7_2',
  versionIntroduced: '5.0',
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
  featuredPoolCount: number;
  baseRateUpChance: number;
  baseTargetRate: number;
  guaranteedRateUpTargetRate: number;
  fatePointCeiling: number;
} = {
  provenanceId: 'gacha_rules_weapon_7_2',
  versionIntroduced: '5.0',
  baseRate: 0.007,
  softPityStart: 63,
  hardPity: 80,
  softIncrement: 0.07,
  fatePointCeiling: 1,
  fatePointsCarryOver: false,
  pityCarriesOver: true,
  guaranteeCarriesOver: true,
  featuredPoolCount: 2,
  baseRateUpChance: 0.75,
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
  provenanceId: 'gacha_rules_chronicled_7_2',
  versionIntroduced: '4.5',
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
 * 4-Star Pull & Pity Rules (Character/Chronicled & Weapon Event Wishes)
 * - Character/Chronicled Wish: 5.100% base rate, pull 9 soft pity (56.1%), pull 10 hard pity (100%)
 *   50% rate-up pool across 3 featured 4★ units (~16.67% non-guaranteed, ~33.33% guaranteed)
 * - Weapon Wish: 6.000% base rate, pull 8 soft pity (66.0%), pull 9 (96.0%), pull 10 hard pity (100%)
 *   75% rate-up pool across 5 featured 4★ weapons (15.00% non-guaranteed, 20.00% guaranteed)
 * - No hard ceiling / Fate Points exist for specific 4★ targets.
 */
export const FOUR_STAR_RULES = {
  provenanceId: 'gacha_rules_4star_7_2',
  versionIntroduced: '1.0',
  characterBaseRate: 0.051,
  weaponBaseRate: 0.060,
  softPityStart: 9,
  hardPity: 10,
  softIncrement: 0.51,
  weaponSoftPityStart: 8,
  weaponPull8Rate: 0.66,
  weaponPull9Rate: 0.96,
  featuredPoolCount: 3,
  weaponFeaturedPoolCount: 5,
  baseRateUpChance: 0.50,
  weaponBaseRateUpChance: 0.75,
  guaranteedRateUpChance: 1.00,
  targetOddsNonGuaranteed: 0.50 / 3, // ~16.667%
  targetOddsGuaranteed: 1.00 / 3, // ~33.333%
  weaponTargetOddsNonGuaranteed: 0.75 / 5, // 15.000%
  weaponTargetOddsGuaranteed: 1.00 / 5, // 20.000%
} as const;

/**
 * Masterless Starglitter Cashback Projection Factor (~8.0%)
 * Accounts for 4★ and 5★ duplicates converted to Starglitter (5 Starglitter = 1 Intertwined Fate).
 */
export const STARGLITTER_CASHBACK_RATE = 0.08;

export const STARGLITTER_CASHBACK_CONFIG = {
  provenanceId: 'gacha_rules_starglitter_7_2',
  rate: STARGLITTER_CASHBACK_RATE,
  starglitterPerFate: 5,
} as const;

export interface BannerRuleValidationReport {
  valid: boolean;
  version: string;
  errors: string[];
  radianceConsolidatedRate: number;
}

/**
 * Validates mathematical invariants across all configured banner rule tables.
 * Used by automated test suites and patch-update verification checks.
 */
export function validateBannerRules(): BannerRuleValidationReport {
  const errors: string[] = [];

  const check5StarConfig = (name: string, cfg: BannerRuleConfig) => {
    if (cfg.baseRate <= 0 || cfg.baseRate >= 1) {
      errors.push(`${name}: baseRate (${cfg.baseRate}) must be in (0, 1).`);
    }
    if (cfg.softPityStart < 1 || cfg.softPityStart >= cfg.hardPity) {
      errors.push(`${name}: softPityStart (${cfg.softPityStart}) must be in [1, hardPity).`);
    }
    if (cfg.softIncrement <= 0 || cfg.softIncrement > 1) {
      errors.push(`${name}: softIncrement (${cfg.softIncrement}) must be in (0, 1].`);
    }
    const maxPreHardRate =
      cfg.baseRate + cfg.softIncrement * (cfg.hardPity - 1 - (cfg.softPityStart - 1));
    if (maxPreHardRate < 0.9) {
      errors.push(`${name}: pre-hard-pity ramp (${maxPreHardRate.toFixed(3)}) unexpectedly low.`);
    }
  };

  check5StarConfig('CHARACTER_BANNER_RULES', CHARACTER_BANNER_RULES);
  check5StarConfig('WEAPON_BANNER_RULES', WEAPON_BANNER_RULES);
  check5StarConfig('CHRONICLED_BANNER_RULES', CHRONICLED_BANNER_RULES);

  // Verify Capturing Radiance 4-state Markov stationary distribution converges to consolidatedWinRate
  const [w0, w1, w2, w3] = CHARACTER_BANNER_RULES.radianceStreakRates;
  if (w3 !== 1.0) {
    errors.push(`CHARACTER_BANNER_RULES: streak 3 win rate must be 1.0, got ${w3}.`);
  }
  const r1 = 1 - w0;
  const r2 = r1 * (1 - w1);
  const r3 = r2 * (1 - w2);
  const pi0 = 1 / (1 + r1 + r2 + r3);
  const pi = [pi0, pi0 * r1, pi0 * r2, pi0 * r3];
  const consolidated = pi[0] * w0 + pi[1] * w1 + pi[2] * w2 + pi[3] * w3;
  if (Math.abs(consolidated - CHARACTER_BANNER_RULES.consolidatedWinRate) > 1e-9) {
    errors.push(
      `CHARACTER_BANNER_RULES: Markov consolidated rate (${consolidated.toFixed(6)}) does not match declared ${CHARACTER_BANNER_RULES.consolidatedWinRate}.`,
    );
  }

  // Verify Weapon 75/25 target rate consistency
  const expectedWeapBase =
    WEAPON_BANNER_RULES.baseRateUpChance / WEAPON_BANNER_RULES.featuredPoolCount;
  if (Math.abs(WEAPON_BANNER_RULES.baseTargetRate - expectedWeapBase) > 1e-9) {
    errors.push(
      `WEAPON_BANNER_RULES: baseTargetRate (${WEAPON_BANNER_RULES.baseTargetRate}) mismatch with 75/25 split (${expectedWeapBase}).`,
    );
  }
  if (WEAPON_BANNER_RULES.fatePointCeiling !== 1) {
    errors.push(
      `WEAPON_BANNER_RULES: fatePointCeiling expected 1 (v5.0+), got ${WEAPON_BANNER_RULES.fatePointCeiling}.`,
    );
  }

  // Verify 4-star rules consistency
  if (
    Math.abs(
      FOUR_STAR_RULES.targetOddsNonGuaranteed -
        FOUR_STAR_RULES.baseRateUpChance / FOUR_STAR_RULES.featuredPoolCount,
    ) > 1e-9
  ) {
    errors.push('FOUR_STAR_RULES: character non-guaranteed target odds mismatch.');
  }
  if (
    Math.abs(
      FOUR_STAR_RULES.weaponTargetOddsNonGuaranteed -
        FOUR_STAR_RULES.weaponBaseRateUpChance / FOUR_STAR_RULES.weaponFeaturedPoolCount,
    ) > 1e-9
  ) {
    errors.push('FOUR_STAR_RULES: weapon non-guaranteed target odds mismatch.');
  }

  return {
    valid: errors.length === 0,
    version: GACHA_RULES_VERSION,
    errors,
    radianceConsolidatedRate: Number(consolidated.toFixed(6)),
  };
}
