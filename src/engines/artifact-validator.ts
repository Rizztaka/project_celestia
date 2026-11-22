import type {
  ArtifactPiece,
  ArtifactSlot,
  SetBonusValidationIssue,
  SetBonusValidationResult,
  StatKey,
} from '../types/genshin';
import {
  MAIN_STAT_ELIGIBILITY_TABLE,
  SUBSTAT_ROLL_TIERS,
  MAX_SUBSTAT_VALUES,
} from '../data/artifact-weights';
import {
  getSetEffectDefinition,
  parseActiveSetBonuses,
} from '../data/artifact-set-effects';
import { CHARACTERS } from '../data/characters';

export interface SubstatDecompositionResult {
  isValid: boolean;
  rolls: number;
  tierBreakdown: number[];
  averageEfficiency: number;
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
export function isValidMainStatForSlot(
  slot: ArtifactSlot,
  statKey: StatKey,
): boolean {
  const eligible = MAIN_STAT_ELIGIBILITY_TABLE[slot];
  return eligible ? eligible.includes(statKey) : false;
}

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
 * Decomposes a substat value into its constituent 5★ rolls and tiers.
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

  const tolerance = isFlatStat
    ? Math.max(2.5, value * 0.02)
    : statKey === 'eleMas'
      ? 0.6
      : 0.06;

  const maxVal = MAX_SUBSTAT_VALUES[statKey] || 1;
  let bestMatch: {
    rolls: number;
    diff: number;
    combo: number[];
    score: number;
  } | null = null;

  for (let k = 1; k <= 6; k++) {
    const candidateSums = getPrecomputedTierSums(statKey, k);
    for (const cand of candidateSums) {
      const diff = Math.abs(cand.sum - value);
      if (diff <= tolerance) {
        const comboEfficiency =
          (cand.combo.reduce((acc, t) => acc + t / maxVal, 0) / k) * 100;
        const rarityTiebreaker = k === 6 ? 0.08 : 0;
        const score =
          diff + Math.abs(comboEfficiency - 85) * 0.005 + rarityTiebreaker;

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
 * Validates a single artifact piece against canonical Genshin Impact rules.
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

  // 1. Rarity & Level bounds
  if (!Number.isInteger(rarity) || rarity < 1 || rarity > 5) {
    errors.push(`Invalid artifact rarity '${rarity}' (expected 1–5)`);
  }
  const maxAllowedLevel =
    rarity === 5 ? 20 : rarity === 4 ? 16 : rarity === 3 ? 12 : 4;
  if (!Number.isFinite(level) || level < 0 || level > maxAllowedLevel) {
    errors.push(
      `Invalid artifact level ${level} for ${rarity}★ piece (expected 0–${maxAllowedLevel})`,
    );
  }

  // 2. Slot and Main Stat check
  if (!isValidMainStatForSlot(slotKey, mainStatKey)) {
    errors.push(`Invalid main stat '${mainStatKey}' for slot '${slotKey}'`);
  }

  // 3. Substats array validation
  if (!Array.isArray(substats)) {
    errors.push('Artifact substats must be an array');
    return { isValid: false, errors, totalRolls: 0, substatDecompositions };
  }

  if (substats.length > 4) {
    errors.push(
      `Artifacts cannot have more than 4 substats, found ${substats.length}`,
    );
  }

  if (rarity === 5 && level >= 4 && substats.length > 0 && substats.length !== 4) {
    errors.push(
      `Level ${level} 5★ artifacts must have exactly 4 substats, found ${substats.length}`,
    );
  }

  const seenSubstats = new Set<StatKey>();
  let totalRolls = 0;

  for (const sub of substats) {
    if (!sub || !sub.key) continue;

    if (seenSubstats.has(sub.key)) {
      errors.push(`Duplicate substat '${sub.key}' found on artifact`);
    }
    seenSubstats.add(sub.key);

    if (sub.key === mainStatKey) {
      errors.push(
        `Substat '${sub.key}' matches main stat '${mainStatKey}', which is impossible in game`,
      );
    }

    if (rarity === 5) {
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
  }

  // 4. Level-consistent total roll bounds for 5★ pieces
  if (rarity === 5 && substats.length > 0) {
    const upgradesEarned = Math.floor(Math.max(0, Math.min(20, level)) / 4);
    const minPossibleRolls = 3 + upgradesEarned;
    const maxPossibleRolls = 4 + upgradesEarned;

    if (totalRolls < minPossibleRolls || totalRolls > maxPossibleRolls) {
      errors.push(
        `Total rolls for +${level} 5★ piece must be ${minPossibleRolls} or ${maxPossibleRolls}, but calculated ${totalRolls}`,
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
 * Validates equipped set keys across 5 slots: checks set registration,
 * detects wasted 3pc configurations, and flags element-mismatched 2pc bonuses.
 */
export function validateArtifactSetBonuses(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  characterIdOrName?: string,
): SetBonusValidationResult {
  const issues: SetBonusValidationIssue[] = [];
  const recognizedSets = new Set<string>();
  const unknownSets = new Set<string>();
  const pieceCounts: Record<string, number> = {};
  const rawSetKeys: string[] = [];

  for (const piece of Object.values(slots)) {
    if (!piece?.setKey) continue;
    rawSetKeys.push(piece.setKey);
    const def = getSetEffectDefinition(piece.setKey);
    if (!def) {
      unknownSets.add(piece.setKey);
      issues.push({
        severity: 'error',
        code: 'UNKNOWN_SET',
        affectedSet: piece.setKey,
        message: `Unrecognized artifact set '${piece.setKey}' — set bonus ESR cannot be verified.`,
      });
    } else {
      recognizedSets.add(def.name);
      pieceCounts[def.name] = (pieceCounts[def.name] || 0) + 1;
    }
  }

  const { active2pc, active4pc } = parseActiveSetBonuses(rawSetKeys);

  // Detect 3-piece dead zone (paying for 3 pieces without unlocking 4pc)
  for (const [setName, count] of Object.entries(pieceCounts)) {
    if (count === 3) {
      issues.push({
        severity: 'warning',
        code: 'WASTED_3PC',
        affectedSet: setName,
        message: `Equipped 3 pieces of ${setName}: the 3rd piece grants no set bonus. Either finish 4pc ${setName} or swap the weakest piece to a second 2pc bonus / stronger off-piece.`,
      });
    }
  }

  // Detect rainbow build with 4+ equipped pieces
  const equippedPiecesCount = Object.values(slots).filter(Boolean).length;
  if (
    equippedPiecesCount >= 4 &&
    active2pc.length === 0 &&
    active4pc.length === 0 &&
    unknownSets.size === 0
  ) {
    issues.push({
      severity: 'warning',
      code: 'NO_ACTIVE_SET',
      message:
        'No active 2pc or 4pc set bonus detected (Rainbow build). Equipping a matching 2pc+2pc or 4pc set typically adds 6–12 equivalent substat rolls.',
    });
  }

  // Detect element-mismatched 2pc elemental DMG bonus
  if (characterIdOrName) {
    const norm = characterIdOrName.replace(/[\s\-_]/g, '').toLowerCase();
    const char = CHARACTERS.find(
      (c) =>
        c.id.toLowerCase() === norm ||
        c.name.replace(/[\s\-_]/g, '').toLowerCase() === norm,
    );
    if (char) {
      const expectedDmgKey = `${char.element.toLowerCase()}_dmg_` as StatKey;
      for (const setName of active2pc) {
        const def = getSetEffectDefinition(setName);
        const p2Stats = def?.piece2.stats;
        if (!p2Stats) continue;
        for (const statKey of Object.keys(p2Stats) as StatKey[]) {
          if (
            statKey.endsWith('_dmg_') &&
            statKey !== 'physical_dmg_' &&
            statKey !== expectedDmgKey
          ) {
            issues.push({
              severity: 'warning',
              code: 'ELEMENT_MISMATCH_2PC',
              affectedSet: setName,
              message: `2pc ${setName} grants ${statKey.replace('_dmg_', '').toUpperCase()} DMG%, which does not benefit ${char.name} (${char.element}).`,
            });
          }
        }
      }
    }
  }

  return {
    isValid: !issues.some((i) => i.severity === 'error'),
    recognizedSets: Array.from(recognizedSets),
    unknownSets: Array.from(unknownSets),
    active2pc,
    active4pc,
    issues,
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
