import type { ArtifactPiece, ArtifactSlot, StatKey } from '../types/genshin';
import {
  MAIN_STAT_ELIGIBILITY_TABLE,
  SUBSTAT_ROLL_TIERS,
  MAX_SUBSTAT_VALUES,
} from '../data/artifact-weights';

export interface SubstatDecompositionResult {
  isValid: boolean;
  rolls: number;
  tierBreakdown: number[];
  averageEfficiency: number; // e.g. 90.0%
  error?: string;
}

export interface ArtifactValidationResult {
  isValid: boolean;
  errors: string[];
  totalRolls: number;
  substatDecompositions: Record<string, SubstatDecompositionResult>;
}

export interface GoodArtifactValidationResult {
  isValid: boolean;
  sanitizedPiece?: ArtifactPiece;
  errors: string[];
}

/**
 * Checks if a given main stat is legal for the specified artifact slot.
 */
export function isValidMainStatForSlot(slot: ArtifactSlot, statKey: StatKey): boolean {
  const eligible = MAIN_STAT_ELIGIBILITY_TABLE[slot];
  return eligible ? eligible.includes(statKey) : false;
}

// Generate all combinations of k items from tiers with replacement
function getCombinations(tiers: number[], k: number): number[][] {
  const results: number[][] = [];
  function backtrack(startIdx: number, current: number[]) {
    if (current.length === k) {
      results.push([...current]);
      return;
    }
    for (let i = startIdx; i < tiers.length; i++) {
      current.push(tiers[i]);
      backtrack(i, current);
      current.pop();
    }
  }
  backtrack(0, []);
  return results;
}

// Cache combinations per statKey and roll count k in [1..6]
const COMBINATIONS_CACHE = new Map<string, { sum: number; combo: number[] }[]>();

function getPrecomputedTierSums(
  statKey: StatKey,
  k: number,
): { sum: number; combo: number[] }[] {
  const cacheKey = `${statKey}_${k}`;
  const cached = COMBINATIONS_CACHE.get(cacheKey);
  if (cached) return cached;

  const tiers = SUBSTAT_ROLL_TIERS[statKey] || [];
  if (tiers.length === 0) return [];

  const combos = getCombinations(tiers, k);
  const sums = combos.map((c) => ({
    sum: c.reduce((acc, val) => acc + val, 0),
    combo: c,
  }));

  COMBINATIONS_CACHE.set(cacheKey, sums);
  return sums;
}

/**
 * Decomposes a substat value into its constituent rolls and tiers.
 * Supports floating point tolerance (for rounded displays in UI/GOOD format).
 */
export function decomposeSubstatRolls(
  statKey: StatKey,
  value: number,
): SubstatDecompositionResult {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    return {
      isValid: false,
      rolls: 0,
      tierBreakdown: [],
      averageEfficiency: 0,
      error: 'Value must be a positive number',
    };
  }

  const tiers = SUBSTAT_ROLL_TIERS[statKey];
  if (!tiers || tiers.length === 0) {
    return {
      isValid: false,
      rolls: 0,
      tierBreakdown: [],
      averageEfficiency: 0,
      error: `Stat '${statKey}' is not a valid 5-star substat`,
    };
  }

  const minSingle = tiers[0];
  const maxSingle = tiers[tiers.length - 1];

  // Hard sanity boundary checks
  const isFlatStat = statKey === 'hp' || statKey === 'atk' || statKey === 'def';
  const minBoundary = minSingle * 0.9;
  const maxBoundary = maxSingle * 6 * 1.1;

  if (value < minBoundary || value > maxBoundary) {
    return {
      isValid: false,
      rolls: 0,
      tierBreakdown: [],
      averageEfficiency: 0,
      error: `Value ${value} is outside possible roll range [${minSingle}, ${maxSingle * 6}] for ${statKey}`,
    };
  }

  // Tolerance definition: strict epsilon = +-0.05 (+0.01 float arithmetic window) for percentage stats,
  // 0.6 for elemental mastery (game integer rounding), 2.5 for flat stats (hp, atk, def)
  const tolerance = isFlatStat
    ? Math.max(2.5, value * 0.02)
    : statKey === 'eleMas'
      ? 0.6
      : 0.06;

  const maxVal = MAX_SUBSTAT_VALUES[statKey] || 1;
  let bestMatch: { rolls: number; diff: number; combo: number[]; score: number } | null = null;

  for (let k = 1; k <= 6; k++) {
    const candidateSums = getPrecomputedTierSums(statKey, k);
    for (const cand of candidateSums) {
      const diff = Math.abs(cand.sum - value);
      if (diff <= tolerance) {
        // Average tier efficiency of this combination
        const comboEfficiency =
          (cand.combo.reduce((acc, t) => acc + t / maxVal, 0) / k) * 100;
        // Natural distribution penalty: median 5★ roll efficiency is ~85%.
        // Extreme 6-roll pieces into a single stat are 1-in-1024 rarities; slight tiebreaker bias towards plausible lower k
        const rarityTiebreaker = k === 6 ? 0.08 : 0;
        const score = diff + Math.abs(comboEfficiency - 85) * 0.005 + rarityTiebreaker;

        if (!bestMatch || score < bestMatch.score) {
          bestMatch = { rolls: k, diff, combo: cand.combo, score };
        }
      }
    }
  }

  if (!bestMatch) {
    return {
      isValid: false,
      rolls: 0,
      tierBreakdown: [],
      averageEfficiency: 0,
      error: `No valid combination of 5★ rolls found for value ${value} on ${statKey}`,
    };
  }

  // Calculate efficiency from matched combo tiers
  const efficiency = Number(
    (
      (bestMatch.combo.reduce((acc, t) => acc + t / maxVal, 0) /
        bestMatch.rolls) *
      100
    ).toFixed(1),
  );

  return {
    isValid: true,
    rolls: bestMatch.rolls,
    tierBreakdown: bestMatch.combo,
    averageEfficiency: Math.min(105, Math.max(65, efficiency)),
  };
}

/**
 * Validates a single artifact piece against canonical 5★ +20 Genshin Impact rules.
 */
export function validateArtifactPiece(
  piece: ArtifactPiece,
): ArtifactValidationResult {
  const errors: string[] = [];
  const substatDecompositions: Record<string, SubstatDecompositionResult> = {};

  if (!piece) {
    return {
      isValid: false,
      errors: ['Artifact piece is null or undefined'],
      totalRolls: 0,
      substatDecompositions,
    };
  }

  const { slotKey, mainStatKey, substats, level = 20, rarity = 5 } = piece;

  // 1. Slot and Main Stat check
  if (!isValidMainStatForSlot(slotKey, mainStatKey)) {
    errors.push(
      `Invalid main stat '${mainStatKey}' for slot '${slotKey}'`,
    );
  }

  // 2. Substats array validation
  if (!Array.isArray(substats)) {
    errors.push('Artifact substats must be an array');
    return { isValid: false, errors, totalRolls: 0, substatDecompositions };
  }

  if (level >= 20 && substats.length > 0 && substats.length !== 4) {
    errors.push(
      `Level 20 5★ artifacts must have exactly 4 substats, found ${substats.length}`,
    );
  }

  const seenSubstats = new Set<StatKey>();
  let totalRolls = 0;

  for (const sub of substats) {
    if (!sub || !sub.key) continue;

    // Duplicate check
    if (seenSubstats.has(sub.key)) {
      errors.push(`Duplicate substat '${sub.key}' found on artifact`);
    }
    seenSubstats.add(sub.key);

    // Substat matches main stat check
    if (sub.key === mainStatKey) {
      errors.push(
        `Substat '${sub.key}' matches main stat '${mainStatKey}', which is impossible in game`,
      );
    }

    // Roll decomposition
    const decomp = decomposeSubstatRolls(sub.key, sub.value);
    substatDecompositions[sub.key] = decomp;

    if (!decomp.isValid) {
      errors.push(
        `Invalid substat roll on '${sub.key}' (value: ${sub.value}): ${decomp.error}`,
      );
    } else {
      if (decomp.rolls > 6) {
        errors.push(
          `Substat '${sub.key}' has ${decomp.rolls} rolls, exceeding maximum 6 rolls`,
        );
      }
      totalRolls += decomp.rolls;
    }
  }

  // 3. Total rolls check for Level 20 5★ piece with substats
  if (level >= 20 && rarity === 5 && substats.length > 0) {
    // 5★ pieces start with 3 or 4 substats, plus 5 upgrades (+4, +8, +12, +16, +20)
    // => Total rolls must be 8 (from 3-liner) or 9 (from 4-liner)
    if (totalRolls < 8 || totalRolls > 9) {
      errors.push(
        `Total rolls for +20 5★ piece must be 8 or 9, but calculated ${totalRolls}`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    totalRolls,
    substatDecompositions,
  };
}

/**
 * Validates and sanitizes a raw artifact object from external GOOD JSON format.
 */
export function validateGoodArtifact(raw: any): GoodArtifactValidationResult {
  if (!raw || typeof raw !== 'object') {
    return {
      isValid: false,
      errors: ['Raw artifact is not a valid object'],
    };
  }

  const slotKey = String(raw.slotKey || '').toLowerCase() as ArtifactSlot;
  if (!['flower', 'plume', 'sands', 'goblet', 'circlet'].includes(slotKey)) {
    return {
      isValid: false,
      errors: [`Invalid or missing slotKey: '${raw.slotKey}'`],
    };
  }

  const mainStatKey = String(raw.mainStatKey || '') as StatKey;
  if (!mainStatKey) {
    return {
      isValid: false,
      errors: ['Missing mainStatKey'],
    };
  }

  const rarity = Number(raw.rarity) || 5;
  const level =
    typeof raw.level === 'number' && !isNaN(raw.level)
      ? raw.level
      : raw.level !== undefined && !isNaN(Number(raw.level))
        ? Number(raw.level)
        : 20;

  const rawSubstats = Array.isArray(raw.substats) ? raw.substats : [];
  const sanitizedSubstats = rawSubstats
    .filter(
      (s: any) =>
        s &&
        s.key &&
        s.value !== undefined &&
        !isNaN(Number(s.value)) &&
        Number(s.value) > 0,
    )
    .map((s: any) => ({
      key: s.key as StatKey,
      value: Number(s.value),
    }));

  const sanitizedPiece: ArtifactPiece = {
    id: raw.id ? String(raw.id) : undefined,
    slotKey,
    setKey: raw.setKey ? String(raw.setKey) : undefined,
    rarity,
    level,
    mainStatKey,
    substats: sanitizedSubstats,
    location: raw.location ? String(raw.location) : undefined,
  };

  const validation = validateArtifactPiece(sanitizedPiece);

  return {
    isValid: validation.isValid,
    sanitizedPiece: validation.isValid ? sanitizedPiece : undefined,
    errors: validation.errors,
  };
}
