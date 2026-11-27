import type {
  ArtifactBuildComputation,
  ArtifactPiece,
  ArtifactSlot,
  ArtifactStopAnalysisResult,
  CharacterStatWeightConfig,
  DiminishingReturnsPoint,
  DomainRouteRecommendation,
  GuaranteedAlternative,
  InvestmentGoal,
  RecommendationExecutionContext,
  ReshapePityTier,
  RoiComparison,
  RoiMilestoneComparison,
  SetComparisonResult,
  SetOptionComparison,
  SlotUpgradePriorityItem,
  SlotUpgradeProbability,
  StatKey,
  TeamContext,
  UniversalSlotMetrics,
  UniversalStopAction,
  UniversalStopOptions,
  UniversalStopSummary,
  WholeBuildErEvaluation,
} from '../types/genshin';
import {
  DOMAIN_CONSTANTS,
  DOMAIN_PAIRS_REGISTRY,
  MAX_SUBSTAT_VALUES,
  STRONGBOX_SETS_SET,
  SUBSTAT_ROLL_TIERS,
  getCharacterStatWeights,
} from '../data/artifact-weights';
import {
  calculateSetEquivalentSubstatRolls,
  parseActiveSetBonuses,
} from '../data/artifact-set-effects';
import { validateArtifactSetBonuses } from './artifact-validator';
import {
  evaluateEngineBoundaryReliability,
  type UnattestedLocalDependency,
} from '../services/engine-reliability';

export const SLOT_NAMES: Record<ArtifactSlot, string> = {
  flower: 'Flower of Life',
  plume: 'Plume of Death',
  sands: 'Sands of Eon',
  goblet: 'Goblet of Eonothem',
  circlet: 'Circlet of Logos',
};

const ALL_SLOTS: readonly ArtifactSlot[] = [
  'flower',
  'plume',
  'sands',
  'goblet',
  'circlet',
];

const ALL_SUBSTATS: readonly StatKey[] = [
  'hp',
  'atk',
  'def',
  'hp_',
  'atk_',
  'def_',
  'eleMas',
  'enerRech_',
  'critRate_',
  'critDMG_',
];

/** Official 5★ substat pool appearance weights (sampled without replacement). */
const SUBSTAT_POOL_WEIGHT: Readonly<Record<StatKey, number>> = {
  hp: 6,
  atk: 6,
  def: 6,
  hp_: 4,
  atk_: 4,
  def_: 4,
  enerRech_: 4,
  eleMas: 4,
  critRate_: 3,
  critDMG_: 3,
  heal_: 0,
  physical_dmg_: 0,
  pyro_dmg_: 0,
  hydro_dmg_: 0,
  dendro_dmg_: 0,
  electro_dmg_: 0,
  anemo_dmg_: 0,
  cryo_dmg_: 0,
  geo_dmg_: 0,
};

/** Fallback official 5★ max single-roll values in case MAX_SUBSTAT_VALUES lacks a key. */
const FALLBACK_MAX_ROLL: Readonly<Partial<Record<StatKey, number>>> = {
  hp: 298.75,
  atk: 19.45,
  def: 23.15,
  hp_: 5.83,
  atk_: 5.83,
  def_: 7.29,
  eleMas: 23.31,
  enerRech_: 6.48,
  critRate_: 3.89,
  critDMG_: 7.77,
};

const ROLL_TIERS = [0.7, 0.8, 0.9, 1.0] as const;

/** Official 5★ main stat drop probabilities per slot. */
const MAIN_STAT_PROBS: Readonly<Record<ArtifactSlot, Partial<Record<StatKey, number>>>> = {
  flower: { hp: 1.0 },
  plume: { atk: 1.0 },
  sands: {
    hp_: 0.2668,
    atk_: 0.2666,
    def_: 0.2666,
    enerRech_: 0.1,
    eleMas: 0.1,
  },
  goblet: {
    hp_: 0.1925,
    atk_: 0.1925,
    def_: 0.19,
    pyro_dmg_: 0.05,
    hydro_dmg_: 0.05,
    electro_dmg_: 0.05,
    cryo_dmg_: 0.05,
    anemo_dmg_: 0.05,
    geo_dmg_: 0.05,
    dendro_dmg_: 0.05,
    physical_dmg_: 0.05,
    eleMas: 0.025,
  },
  circlet: {
    hp_: 0.22,
    atk_: 0.22,
    def_: 0.22,
    critRate_: 0.1,
    critDMG_: 0.1,
    heal_: 0.1,
    eleMas: 0.04,
  },
};

/** Conditional 4pc CRIT Rate bonuses up to Genshin Impact v7.2. */
const SET_4PC_CONDITIONAL_CR: Readonly<Record<string, number>> = {
  'Blizzard Strayer': 20, // Conservative Cryo uptime (40% vs Frozen)
  'Marechaussee Hunter': 36,
  'Obsidian Codex': 40,
  "Night of the Sky's Unveiling": 15, // +15% Nascent / +30% Ascendant Gleam
  'Scarlet Proof': 16,
  'Disenchantment in Deep Shadow': 16,
  "Witch's Homework": 20,
};

/** 2pc ER%+ sets up to Genshin Impact v7.2. */
const SET_2PC_ER_BONUS = new Set<string>([
  'Emblem of Severed Fate',
  'The Exile',
  "Silken Moon's Serenade",
  'Scholar',
]);

const ELIXIR_COST: Readonly<Record<ArtifactSlot, number>> = {
  flower: 1,
  plume: 1,
  sands: 2,
  goblet: 4,
  circlet: 3,
};

const DUST_COST: Readonly<Record<ArtifactSlot, number>> = {
  flower: 1,
  plume: 1,
  sands: 2,
  goblet: 2,
  circlet: 2,
};

const GOAL_THRESHOLDS_PCT: Readonly<Record<InvestmentGoal, number>> = {
  casual: 1.5,
  endgame: 0.6,
  hyper: 0.2,
};

const DOMAIN_SECOND_DROP_PROB = 0.065;
const STYGIAN_BONUS_DROPS_PER_RUN = 1 / 6; // +1 bonus 5★ per 120 Resin (6 runs)
const DOMAIN_FOUR_LINE_PROB = 0.2;
const STRONGBOX_FOUR_LINE_PROB = 0.34;
const STRONGBOX_RECURSIVE_YIELD = 0.5; // sum_{n=1..inf} (1/3)^n

// Exact 1D discrete PMF grid (0.05 roll resolution up to 10.0 rolls = 1000% RV)
const BIN_STEP = 0.05;
const MAX_BINS = 201;
const EPS = 1e-9;

// Bounded LRU cache for exact slot PMFs (< 0.05ms on repeated slider updates)
const PMF_CACHE_LIMIT = 256;
const pmfCache = new Map<string, Float64Array>();

// ============================================================================
// SAFE NUMERIC HELPERS
// ============================================================================

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.max(min, Math.min(max, v));
}

function safeNonNeg(v: number | undefined | null, fallback = 0): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.max(0, v);
}

function getMaxRollValue(key: StatKey): number {
  const fromRegistry = MAX_SUBSTAT_VALUES[key];
  if (typeof fromRegistry === 'number' && Number.isFinite(fromRegistry) && fromRegistry > 0) {
    return fromRegistry;
  }
  return FALLBACK_MAX_ROLL[key] ?? 0;
}

function getNormalizedWeights(
  config?: CharacterStatWeightConfig,
): Record<StatKey, number> {
  const out = {} as Record<StatKey, number>;
  let maxW = 0;

  for (const s of ALL_SUBSTATS) {
    const raw = safeNonNeg(config?.statWeights?.[s], 0);
    out[s] = raw;
    if (raw > maxW) maxW = raw;
  }

  if (maxW > EPS) {
    for (const s of ALL_SUBSTATS) {
      out[s] = clamp(out[s] / maxW, 0, 1);
    }
  }
  return out;
}

function getMainStatProb(slot: ArtifactSlot, mainStat: StatKey): number {
  const exact = MAIN_STAT_PROBS[slot][mainStat];
  if (typeof exact === 'number') return exact;
  if (slot === 'goblet' && mainStat.includes('dmg_')) return 0.05;
  return 0;
}

function isMainStatValid(
  slot: ArtifactSlot,
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
): boolean {
  if (!piece) return false;
  if (slot === 'flower') return piece.mainStatKey === 'hp' || !piece.mainStatKey;
  if (slot === 'plume') return piece.mainStatKey === 'atk' || !piece.mainStatKey;
  const preferred = config.preferredMainStats?.[slot] ?? [];
  if (preferred.length === 0) return true;
  return preferred.includes(piece.mainStatKey);
}

function getSlotRealisticCeilingURV(
  mainStat: StatKey,
  weights: Record<StatKey, number>,
): number {
  const eligible = ALL_SUBSTATS.filter((s) => s !== mainStat)
    .map((s) => weights[s] ?? 0)
    .sort((a, b) => b - a);
  if (eligible.length < 4 || eligible[0] <= EPS) return 0;
  // Theoretical 9-roll max: 6*w1 + w2 + w3 + w4; realistic endgame ceiling ≈ 68% of theoretical max
  const theoreticalMax = 6 * eligible[0] + eligible[1] + eligible[2] + eligible[3];
  return theoreticalMax * 0.68;
}

// ============================================================================
// EXACT DISCRETE PMF CONVOLUTION ENGINE (ZERO-SINGULARITY, ZERO-NOISE)
// ============================================================================

/** Exact probability of drawing 4 unordered substats without replacement. */
function exactSubsetDrawProb(
  quad: readonly [StatKey, StatKey, StatKey, StatKey],
  totalPoolWeight: number,
): number {
  if (totalPoolWeight <= EPS) return 0;
  const w0 = SUBSTAT_POOL_WEIGHT[quad[0]];
  const w1 = SUBSTAT_POOL_WEIGHT[quad[1]];
  const w2 = SUBSTAT_POOL_WEIGHT[quad[2]];
  const w3 = SUBSTAT_POOL_WEIGHT[quad[3]];
  const w = [w0, w1, w2, w3];

  let prob = 0;
  for (let a = 0; a < 4; a++) {
    const wa = w[a];
    const rem1 = totalPoolWeight - wa;
    if (rem1 <= EPS) continue;
    const p1 = wa / totalPoolWeight;

    for (let b = 0; b < 4; b++) {
      if (b === a) continue;
      const wb = w[b];
      const rem2 = rem1 - wb;
      if (rem2 <= EPS) continue;
      const p2 = p1 * (wb / rem1);

      for (let c = 0; c < 4; c++) {
        if (c === a || c === b) continue;
        const wc = w[c];
        const rem3 = rem2 - wc;
        if (rem3 <= EPS) continue;
        const d = 6 - a - b - c;
        prob += p2 * (wc / rem2) * (w[d] / rem3);
      }
    }
  }
  return prob;
}

interface WeightedShift {
  shift: number;
  prob: number;
}

/** Compresses identical bin shifts for fast sparse convolution. */
function buildCompressedShifts(choiceWeights: readonly number[]): WeightedShift[] {
  const counts = new Map<number, number>();
  const totalOutcomes = choiceWeights.length * ROLL_TIERS.length;
  if (totalOutcomes === 0) return [];

  for (let i = 0; i < choiceWeights.length; i++) {
    const w = choiceWeights[i];
    for (let t = 0; t < ROLL_TIERS.length; t++) {
      const shift = Math.round((w * ROLL_TIERS[t]) / BIN_STEP);
      counts.set(shift, (counts.get(shift) ?? 0) + 1);
    }
  }

  const out: WeightedShift[] = [];
  for (const [shift, cnt] of counts.entries()) {
    out.push({ shift, prob: cnt / totalOutcomes });
  }
  return out;
}

function convolveSparse(
  pmf: Float64Array,
  activeHi: number,
  shifts: readonly WeightedShift[],
): { pmf: Float64Array<ArrayBuffer>; activeHi: number } {
  const next = new Float64Array(MAX_BINS);
  let nextHi = 0;

  for (let b = 0; b <= activeHi; b++) {
    const p = pmf[b];
    if (p <= 0) continue;
    for (let j = 0; j < shifts.length; j++) {
      const target = Math.min(MAX_BINS - 1, b + shifts[j].shift);
      next[target] += p * shifts[j].prob;
      if (target > nextHi) nextHi = target;
    }
  }
  return { pmf: next, activeHi: nextHi };
}

function buildInitialQuadPMF(
  quadWeights: readonly [number, number, number, number],
): { pmf: Float64Array<ArrayBuffer>; activeHi: number } {
  let pmf: Float64Array<ArrayBuffer> = new Float64Array(MAX_BINS);
  pmf[0] = 1.0;
  let activeHi = 0;

  for (let i = 0; i < 4; i++) {
    const w = quadWeights[i];
    if (w <= EPS) continue;
    const shifts = buildCompressedShifts([w]);
    const step = convolveSparse(pmf, activeHi, shifts);
    pmf = step.pmf;
    activeHi = step.activeHi;
  }
  return { pmf, activeHi };
}

/**
 * Exact discrete PMF of final +20 weighted roll value (in uRV units, bin = 0.05 rolls)
 * given mainStatKey, normalized substat weights, and 4-liner drop rate.
 * Groups identical sorted weight tuples and caches results for sub-millisecond speed.
 */
function computeExactSlotURVPMF(
  mainStatKey: StatKey,
  weights: Record<StatKey, number>,
  fourLineProb: number,
): Float64Array {
  // Quantize weights to 2 decimals for stable caching & tuple grouping
  const qWeights = {} as Record<StatKey, number>;
  const sigParts: string[] = [];
  for (const s of ALL_SUBSTATS) {
    const qw = Math.round(clamp(weights[s] ?? 0, 0, 1) * 100) / 100;
    qWeights[s] = qw;
    sigParts.push(`${qw}`);
  }
  const cacheKey = `${mainStatKey}|${fourLineProb.toFixed(2)}|${sigParts.join(',')}`;
  const cached = pmfCache.get(cacheKey);
  if (cached) return cached;

  const pool = ALL_SUBSTATS.filter((s) => s !== mainStatKey);
  const totalPoolWeight = pool.reduce((acc, s) => acc + SUBSTAT_POOL_WEIGHT[s], 0);

  // Group all C(9,4)=126 or C(10,4)=210 quads by sorted weight tuple
  const tupleProbs = new Map<string, { w: [number, number, number, number]; prob: number }>();

  const n = pool.length;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          const quad: [StatKey, StatKey, StatKey, StatKey] = [
            pool[i],
            pool[j],
            pool[k],
            pool[l],
          ];
          const drawP = exactSubsetDrawProb(quad, totalPoolWeight);
          if (drawP <= 0) continue;

          const sortedW = [
            qWeights[quad[0]],
            qWeights[quad[1]],
            qWeights[quad[2]],
            qWeights[quad[3]],
          ].sort((a, b) => b - a) as [number, number, number, number];

          const key = `${sortedW[0]},${sortedW[1]},${sortedW[2]},${sortedW[3]}`;
          const existing = tupleProbs.get(key);
          if (existing) {
            existing.prob += drawP;
          } else {
            tupleProbs.set(key, { w: sortedW, prob: drawP });
          }
        }
      }
    }
  }

  const totalPMF = new Float64Array(MAX_BINS);
  const p4 = clamp(fourLineProb, 0, 1);
  const p3 = 1 - p4;

  for (const { w, prob } of tupleProbs.values()) {
    if (w[0] + w[1] + w[2] + w[3] <= EPS) {
      totalPMF[0] += prob;
      continue;
    }

    const upgradeShifts = buildCompressedShifts(w);
    let state = buildInitialQuadPMF(w);
    // 4 upgrade rolls (common to 3-liner and 4-liner)
    for (let r = 0; r < 4; r++) {
      state = convolveSparse(state.pmf, state.activeHi, upgradeShifts);
    }
    // 5th upgrade roll (4-liner only)
    const state5 = convolveSparse(state.pmf, state.activeHi, upgradeShifts);
    const maxHi = Math.max(state.activeHi, state5.activeHi);

    for (let b = 0; b <= maxHi; b++) {
      totalPMF[b] += prob * (p3 * state.pmf[b] + p4 * state5.pmf[b]);
    }
  }

  if (pmfCache.size >= PMF_CACHE_LIMIT) {
    const oldestKey = pmfCache.keys().next().value;
    if (oldestKey !== undefined) pmfCache.delete(oldestKey);
  }
  pmfCache.set(cacheKey, totalPMF);
  return totalPMF;
}

/** Exact Dust of Enlightenment Reshape EV (keeps better of original or reshaped). */
function computeReshapeExpectedURVGain(
  piece: ArtifactPiece | null,
  weights: Record<StatKey, number>,
  currentURV: number,
  pityTier: ReshapePityTier,
): number {
  if (!piece || piece.rarity < 5 || piece.level < 20 || !piece.substats?.length) {
    return 0;
  }

  const presentKeys = piece.substats
    .filter((s) => s && safeNonNeg(s.value, 0) > 0 && ALL_SUBSTATS.includes(s.key))
    .map((s) => s.key);
  if (presentKeys.length < 4) return 0;

  const sortedByWeight = [...presentKeys]
    .slice(0, 4)
    .sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
  const allW = sortedByWeight.map((k) => weights[k] ?? 0);
  const favoredW = [allW[0], allW[1]];
  if (favoredW[0] + favoredW[1] <= EPS) return 0;

  // Estimate total historical rolls on piece to detect 4-liner (9 rolls) vs 3-liner (8 rolls)
  let totalRawRolls = 0;
  for (const sub of piece.substats) {
    const maxVal = getMaxRollValue(sub.key);
    if (maxVal > 0) totalRawRolls += safeNonNeg(sub.value, 0) / (maxVal * 0.85);
  }
  const upgradeRolls = totalRawRolls >= 8.5 ? 5 : 4;
  const guaranteed = pityTier === 'decreed' ? 4 : pityTier === 'advanced' ? 3 : 2;
  const gRolls = Math.min(guaranteed, upgradeRolls);
  const freeRolls = Math.max(0, upgradeRolls - gRolls);

  // Baseline initial 4-line roll value (~0.85 avg tier per line)
  const initialBaseURV = allW.reduce((acc, w) => acc + 0.85 * w, 0);
  const startBin = clamp(Math.round(initialBaseURV / BIN_STEP), 0, MAX_BINS - 1);

  let state: { pmf: Float64Array<ArrayBuffer>; activeHi: number } = {
    pmf: new Float64Array(MAX_BINS),
    activeHi: startBin,
  };
  state.pmf[startBin] = 1.0;

  const favoredShifts = buildCompressedShifts(favoredW);
  const allShifts = buildCompressedShifts(allW);

  for (let r = 0; r < gRolls; r++) {
    state = convolveSparse(state.pmf, state.activeHi, favoredShifts);
  }
  for (let r = 0; r < freeRolls; r++) {
    state = convolveSparse(state.pmf, state.activeHi, allShifts);
  }

  let evGain = 0;
  for (let b = 0; b <= state.activeHi; b++) {
    const u = b * BIN_STEP;
    if (u > currentURV + EPS) {
      evGain += (u - currentURV) * state.pmf[b];
    }
  }
  return Math.max(0, evGain);
}

/** Exact Sanctifying Elixir (Artifact Transmuter) EV for a slot. */
function computeElixirExpectedURVGain(
  slot: ArtifactSlot,
  bestMainStat: StatKey,
  currentURV: number,
  hasValidMain: boolean,
  weights: Record<StatKey, number>,
): number {
  const pool = ALL_SUBSTATS.filter((s) => s !== bestMainStat);
  const sorted = [...pool].sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0));
  if (sorted.length < 4) return 0;

  const chosen: [StatKey, StatKey] = [sorted[0], sorted[1]];
  const remaining = sorted.slice(2);
  const remWeightSum = remaining.reduce((acc, s) => acc + SUBSTAT_POOL_WEIGHT[s], 0);
  if (remWeightSum <= EPS) return 0;

  const totalPMF = new Float64Array(MAX_BINS);
  for (let i = 0; i < remaining.length - 1; i++) {
    for (let j = i + 1; j < remaining.length; j++) {
      const s3 = remaining[i];
      const s4 = remaining[j];
      const w3 = SUBSTAT_POOL_WEIGHT[s3];
      const w4 = SUBSTAT_POOL_WEIGHT[s4];
      const drawP =
        (w3 / remWeightSum) * (w4 / Math.max(remWeightSum - w3, EPS)) +
        (w4 / remWeightSum) * (w3 / Math.max(remWeightSum - w4, EPS));

      const qw: [number, number, number, number] = [
        weights[chosen[0]] ?? 0,
        weights[chosen[1]] ?? 0,
        weights[s3] ?? 0,
        weights[s4] ?? 0,
      ];
      const favoredShifts = buildCompressedShifts([qw[0], qw[1]]);
      const allShifts = buildCompressedShifts(qw);

      let state = buildInitialQuadPMF(qw);
      // 2 guaranteed rolls into defined substats (v5.5+ Transmuter guarantee)
      state = convolveSparse(state.pmf, state.activeHi, favoredShifts);
      state = convolveSparse(state.pmf, state.activeHi, favoredShifts);
      // 2 remaining rolls (3-liner) + optional 5th roll (20% 4-liner)
      state = convolveSparse(state.pmf, state.activeHi, allShifts);
      state = convolveSparse(state.pmf, state.activeHi, allShifts);
      const state5 = convolveSparse(state.pmf, state.activeHi, allShifts);
      const maxHi = Math.max(state.activeHi, state5.activeHi);

      for (let b = 0; b <= maxHi; b++) {
        totalPMF[b] += drawP * (0.8 * state.pmf[b] + 0.2 * state5.pmf[b]);
      }
    }
  }

  const baseline = hasValidMain ? currentURV : 0;
  let evGain = 0;
  for (let b = 0; b < MAX_BINS; b++) {
    const u = b * BIN_STEP;
    if (u > baseline + EPS) {
      evGain += (u - baseline) * totalPMF[b];
    }
  }
  const mainStatFixBonus =
    !hasValidMain && slot !== 'flower' && slot !== 'plume' ? 5.0 : 0;
  return Math.max(0, evGain + mainStatFixBonus);
}

// ============================================================================
// PUBLIC ENGINE FUNCTIONS (100% BACKWARD-COMPATIBLE + UNIVERSAL v7.2 ENGINE)
// ============================================================================

/**
 * Calculates raw and weighted roll values for a single artifact piece without
 * crashing on frozen objects or invalid substat values.
 */
export function calculatePieceRollValue(
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
): { rawRollValue: number; weightedRollValue: number; usefulRolls: number } {
  if (!piece || !Array.isArray(piece.substats) || piece.substats.length === 0) {
    return { rawRollValue: 0, weightedRollValue: 0, usefulRolls: 0 };
  }

  let rawRollValue = 0;
  let weightedRollValue = 0;

  for (const sub of piece.substats) {
    if (!sub || !sub.key) continue;
    const maxVal = getMaxRollValue(sub.key);
    const val = safeNonNeg(sub.value, 0);
    if (maxVal <= 0 || val <= 0) continue;

    const rawRoll = (val / maxVal) * 100;
    const weight = safeNonNeg(config?.statWeights?.[sub.key], 0);

    rawRollValue += rawRoll;
    weightedRollValue += rawRoll * weight;
  }

  const usefulRolls = Number((weightedRollValue / 100).toFixed(2));
  return {
    rawRollValue: Math.round(rawRollValue),
    weightedRollValue: Math.round(weightedRollValue),
    usefulRolls,
  };
}

/**
 * Returns base single-drop probability for a candidate piece of the right slot & main stat.
 */
function getSlotMainStatDropProb(
  slot: ArtifactSlot,
  config: CharacterStatWeightConfig,
): number {
  const slotChance = DOMAIN_CONSTANTS.SLOT_CHANCE || 0.2;

  switch (slot) {
    case 'flower':
    case 'plume':
      return slotChance;
    case 'sands': {
      const preferred = config.preferredMainStats?.sands ?? [];
      let sum = 0;
      for (const p of new Set(preferred)) sum += getMainStatProb('sands', p);
      return slotChance * (sum > 0 ? Math.min(1, sum) : 0.2666);
    }
    case 'goblet': {
      const preferred = config.preferredMainStats?.goblet ?? [];
      let sum = 0;
      for (const p of new Set(preferred)) sum += getMainStatProb('goblet', p);
      return slotChance * (sum > 0 ? Math.min(1, sum) : 0.05);
    }
    case 'circlet': {
      const preferred = config.preferredMainStats?.circlet ?? [];
      let sum = 0;
      for (const p of new Set(preferred)) sum += getMainStatProb('circlet', p);
      return slotChance * (sum > 0 ? Math.min(1, sum) : 0.2);
    }
  }
}

/**
 * Exact probability that a dropped candidate 5★ piece rolls substats exceeding `targetRV` (%).
 * Supports both 1-arg legacy callers and exact character/slot-aware callers.
 */
export function getSubstatUpgradeProbability(
  targetRV: number,
  mainStatKey: StatKey = 'hp',
  config?: CharacterStatWeightConfig,
  fourLineProb: number = DOMAIN_FOUR_LINE_PROB,
): number {
  if (!Number.isFinite(targetRV) || targetRV <= 0) return 0.99;

  const weights: Record<StatKey, number> = config
    ? getNormalizedWeights(config)
    : ({
        hp: 0,
        atk: 0.25,
        def: 0,
        hp_: 0,
        atk_: 0.75,
        def_: 0,
        eleMas: 0.5,
        enerRech_: 0.5,
        critRate_: 1.0,
        critDMG_: 1.0,
      } as Record<StatKey, number>);

  const totalW = ALL_SUBSTATS.reduce((acc, s) => acc + (weights[s] ?? 0), 0);
  if (totalW <= EPS) return 0.00005;

  const pmf = computeExactSlotURVPMF(mainStatKey, weights, fourLineProb);
  const targetURV = targetRV / 100;

  let prob = 0;
  for (let b = 0; b < MAX_BINS; b++) {
    if (b * BIN_STEP > targetURV + EPS) {
      prob += pmf[b];
    }
  }
  return clamp(Number(prob.toFixed(6)), 0.00005, 0.99);
}

/**
 * Calculates per-slot upgrade probability and expected runs using exact discrete PMF convolution.
 */
export function calculateSlotUpgradeProbability(
  slot: ArtifactSlot,
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
  isOffPiece: boolean = false,
  options?: UniversalStopOptions,
): SlotUpgradeProbability {
  const { weightedRollValue, usefulRolls } = calculatePieceRollValue(piece, config);
  const weights = getNormalizedWeights(config);
  const validMain = isMainStatValid(slot, piece, config);
  const isIncompletePiece = !piece || !validMain || piece.rarity < 5 || piece.level < 16;

  const preferredList =
    slot === 'flower'
      ? (['hp'] as StatKey[])
      : slot === 'plume'
        ? (['atk'] as StatKey[])
        : config.preferredMainStats?.[slot]?.length
          ? config.preferredMainStats[slot]
          : (['atk_'] as StatKey[]);
  const referenceMain: StatKey =
    piece && validMain ? piece.mainStatKey : preferredList[0];

  const targetSetChance = isOffPiece ? 1.0 : DOMAIN_CONSTANTS.TARGET_SET_CHANCE || 0.5;
  const slotMainProb = getSlotMainStatDropProb(slot, config);

  // If piece is missing, wrong main stat, or < +16 4★, any right-main-stat 5★ drop is an immediate upgrade
  const substatUpgradeChance = isIncompletePiece
    ? 0.99
    : getSubstatUpgradeProbability(
        weightedRollValue,
        referenceMain,
        config,
        DOMAIN_FOUR_LINE_PROB,
      );

  // Exact per-run probability with AR45+ bonus 5★ drop (6.5%) + optional Stygian Outbreak (+1/6 per run)
  const pDrop = clamp(targetSetChance * slotMainProb * substatUpgradeChance, 0, 1);
  let pRun = 1 - (1 - pDrop) * (1 - DOMAIN_SECOND_DROP_PROB * pDrop);
  if (options?.stygianOutbreakActive && pDrop > 0) {
    pRun = 1 - (1 - pRun) * Math.pow(1 - pDrop, STYGIAN_BONUS_DROPS_PER_RUN);
  }

  // Optional 3:1 recursive Strongbox recycling (34% 4-liner rate)
  const targetSet = config.targetSets?.[0] ?? '';
  const useStrongbox =
    (options?.includeStrongboxRecycling ?? false) && STRONGBOX_SETS_SET.has(targetSet);
  if (useStrongbox) {
    const sbSubChance = isIncompletePiece
      ? 0.99
      : getSubstatUpgradeProbability(
          weightedRollValue,
          referenceMain,
          config,
          STRONGBOX_FOUR_LINE_PROB,
        );
    const pSbDrop = clamp(slotMainProb * sbSubChance, 0, 1);
    const dropsPerRun =
      (DOMAIN_CONSTANTS.FIVE_STAR_PER_RUN || 1.065) +
      (options?.stygianOutbreakActive ? STYGIAN_BONUS_DROPS_PER_RUN : 0);
    const pRunSb = 1 - Math.pow(1 - pSbDrop, dropsPerRun * STRONGBOX_RECURSIVE_YIELD);
    pRun = 1 - (1 - pRun) * (1 - pRunSb);
  }

  const upgradeProbabilityPerRun = clamp(pRun, 0.00001, 0.999);

  // Median runs (50% confidence): 1 - (1 - p)^N = 0.5
  const logDenom = Math.log(1 - upgradeProbabilityPerRun);
  const medianRunsForUpgrade =
    !Number.isFinite(logDenom) || logDenom >= 0
      ? 1
      : Math.max(1, Math.ceil(Math.log(0.5) / logDenom));

  const meanExpectedRuns = Math.min(
    100000,
    Math.max(1, Math.ceil(1 / upgradeProbabilityPerRun)),
  );

  const runsPerDay = clamp(
    (options?.dailyResin ?? DOMAIN_CONSTANTS.DAILY_RESIN ?? 180) / 20,
    1,
    100,
  );
  const expectedRunsForUpgrade = medianRunsForUpgrade;
  const expectedDaysForUpgrade = Number((expectedRunsForUpgrade / runsPerDay).toFixed(1));

  // Normalize piece quality against THIS character & slot's realistic ceiling (works for 1-stat supports AND 4-stat carries)
  const realisticCeilingURV = getSlotRealisticCeilingURV(referenceMain, weights);
  const completionRatio =
    isIncompletePiece
      ? 0
      : realisticCeilingURV <= EPS
        ? 1
        : clamp(usefulRolls / realisticCeilingURV, 0, 1.25);

  let status: 'Near Ceiling' | 'Diminishing Returns' | 'High ROI';
  let recommendation: string;

  if (isIncompletePiece) {
    status = 'High ROI';
    recommendation = !piece
      ? `Empty ${SLOT_NAMES[slot]} slot. Any valid 5★ drop is an immediate upgrade (~${expectedDaysForUpgrade} days).`
      : !validMain
        ? `Wrong main stat on ${SLOT_NAMES[slot]} (${piece.mainStatKey}). Replace with ${preferredList.join('/')} (~${expectedDaysForUpgrade} days).`
        : `${SLOT_NAMES[slot]} is not a maxed +20 5★ piece. Upgrade or replace it first.`;
  } else if (completionRatio >= 0.9 || expectedDaysForUpgrade >= 22) {
    status = 'Near Ceiling';
    recommendation = `This ${SLOT_NAMES[slot]} is near ceiling (${weightedRollValue}% RV, ${Math.min(100, Math.round(completionRatio * 100))}% of build ceiling). Upgrading takes ~${expectedDaysForUpgrade} days (${expectedRunsForUpgrade} runs). DO NOT farm this slot.`;
  } else if (completionRatio >= 0.68 || expectedDaysForUpgrade >= 9) {
    status = 'Diminishing Returns';
    recommendation = `Solid piece (${weightedRollValue}% RV, ${Math.min(100, Math.round(completionRatio * 100))}% of build ceiling). Upgrades take ~${expectedDaysForUpgrade} days (${expectedRunsForUpgrade} runs). Prioritize weaker slots or guaranteed upgrades.`;
  } else {
    status = 'High ROI';
    recommendation = `High upgrade potential (${weightedRollValue}% RV). 50% chance of an upgrade within ~${expectedDaysForUpgrade} days (${expectedRunsForUpgrade} runs).`;
  }

  return {
    slotKey: slot,
    slotName: SLOT_NAMES[slot],
    currentPiece: piece,
    currentRollValue: weightedRollValue,
    currentUsefulRolls: usefulRolls,
    upgradeProbabilityPerRun,
    expectedRunsForUpgrade,
    medianRunsForUpgrade,
    meanExpectedRuns,
    expectedDaysForUpgrade,
    status,
    recommendation,
  };
}

/**
 * Generates data points plotting Days of Resin vs Probability of Upgrade.
 * Fixes ReferenceError bug in safeP initialization and clamps extreme inputs.
 */
export function generateDiminishingReturnsCurve(
  pPerRun: number,
  maxDays: number = 60,
): DiminishingReturnsPoint[] {
  const points: DiminishingReturnsPoint[] = [];
  const safeP =
    !Number.isFinite(pPerRun) || pPerRun <= 0
      ? 0.00001
      : Math.min(0.999, Math.max(0.00001, pPerRun));
  const safeDays = Math.max(1, Math.min(365, Math.floor(Number.isFinite(maxDays) ? maxDays : 60)));
  const runsPerDay = DOMAIN_CONSTANTS.RUNS_PER_DAY || 9;
  const dailyResin = DOMAIN_CONSTANTS.DAILY_RESIN || 180;

  for (let day = 1; day <= safeDays; day++) {
    const runs = day * runsPerDay;
    const probability = 1 - Math.pow(1 - safeP, runs);
    points.push({
      days: day,
      resin: day * dailyResin,
      probability: clamp(Number(probability.toFixed(4)), 0, 0.999),
    });
  }

  return points;
}

/**
 * Finds the "Weakest Link" slot offering the highest upgrade return per resin spent.
 */
export function findWeakestSlot(
  breakdown: Record<ArtifactSlot, SlotUpgradeProbability>,
): SlotUpgradeProbability | null {
  const slots = Object.values(breakdown);
  if (slots.length === 0) return null;

  const sorted = [...slots].sort(
    (a, b) => b.upgradeProbabilityPerRun - a.upgradeProbabilityPerRun,
  );
  return sorted[0];
}

/**
 * Provides guaranteed talent or weapon resin alternatives to RNG artifact farming.
 */
export function getGuaranteedAlternative(
  characterName: string,
  overallStatus: string,
): GuaranteedAlternative {
  if (overallStatus === 'Ready / Stop Farming' || overallStatus === 'Diminishing Returns') {
    return {
      title: `${characterName} Talent Level 8 → 9/10`,
      costResin: 260,
      daysResin: 1.4,
      guaranteedGain: '+5.5% to +6.2% Damage',
      description: `Guaranteed multiplier increase with zero RNG. 260 Resin in Talent Domain + Weekly Boss gives an immediate DPS jump without wasting weeks on low-odds artifact drops.`,
    };
  }

  return {
    title: `${characterName} Weapon Level 80 → 90`,
    costResin: 220,
    daysResin: 1.2,
    guaranteedGain: '+4.8% Base ATK / Stat',
    description: `Weapon ascension guarantees higher base scaling for both self and buffs. Finish this guaranteed upgrade alongside early artifact farming.`,
  };
}

/**
 * Evaluates Whole-Build ER sufficiency using the canonical Three-Zone Model.
 */
export function evaluateWholeBuildEr(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  targetEr: number = 130,
  active2pcSets: string[] = [],
  baseEr: number = 100,
  weaponEr: number = 0,
  ascensionEr: number = 0,
): WholeBuildErEvaluation {
  const safeTarget = Math.max(100, safeNonNeg(targetEr, 130));
  let totalEr = safeNonNeg(baseEr, 100) + safeNonNeg(weaponEr, 0) + safeNonNeg(ascensionEr, 0);

  if (slots.sands?.mainStatKey === 'enerRech_') {
    totalEr += 51.8;
  }

  for (const set of active2pcSets) {
    if (SET_2PC_ER_BONUS.has(set)) {
      totalEr += 20;
    }
  }

  for (const piece of Object.values(slots)) {
    if (!piece || !Array.isArray(piece.substats)) continue;
    for (const sub of piece.substats) {
      if (sub?.key === 'enerRech_') {
        totalEr += safeNonNeg(sub.value, 0);
      }
    }
  }

  totalEr = Number(totalEr.toFixed(1));
  const diff = Number((totalEr - safeTarget).toFixed(1));

  let status: 'Deficit' | 'Target' | 'Overcap';
  let penaltyFactor = 1.0;
  let message = '';

  if (totalEr < safeTarget - 15) {
    status = 'Deficit';
    penaltyFactor = Math.max(0.4, Number((totalEr / safeTarget).toFixed(2)));
    message = `Severe ER Deficit! Build has ${totalEr}% ER vs required ${safeTarget}%. Elemental Bursts will not be ready on cooldown, reducing real DPS by ${Math.round((1 - penaltyFactor) * 100)}%. Prioritize ER rolls or ER Sands!`;
  } else if (totalEr > safeTarget + 20) {
    status = 'Overcap';
    penaltyFactor = 1.0;
    message = `ER Surplus (+${diff}% over ${safeTarget}% target). Extra ER substats have diminished value unless running 4pc Emblem of Severed Fate.`;
  } else {
    status = 'Target';
    penaltyFactor = 1.0;
    message = `Optimal ER Target reached (${totalEr}% / ${safeTarget}%). Burst will reliably recharge every team rotation.`;
  }

  return {
    totalEr,
    targetEr: safeTarget,
    status,
    penaltyFactor,
    erDifference: diff,
    message,
  };
}

/**
 * Dynamically adjusts stat weights to account for external Team Context,
 * buff dilution, and v6.x–v7.2 Lunar & Stellar Glimmer reaction curves.
 */
export function adjustWeightsForTeamContext(
  config: CharacterStatWeightConfig,
  context?: TeamContext,
): CharacterStatWeightConfig {
  if (!context || context.preset === 'unbuffed') {
    return config;
  }

  const statWeights: Partial<Record<StatKey, number>> = {
    ...config.statWeights,
  };
  const preferredSands = [...(config.preferredMainStats?.sands ?? [])];
  const preferredGoblet = [...(config.preferredMainStats?.goblet ?? [])];
  const preferredCirclet = [...(config.preferredMainStats?.circlet ?? [])];

  const isBennettActive =
    context.preset === 'hypercarry_bennett_furina' ||
    context.hasBennett ||
    (context.customFlatAtkBuff !== undefined && context.customFlatAtkBuff >= 800);

  const isFurinaActive =
    context.preset === 'hypercarry_bennett_furina' ||
    context.hasFurina ||
    (context.customDmgBonus !== undefined && context.customDmgBonus >= 50);

  const isDmgSaturated = isFurinaActive || Boolean(context.hasKazuhaOrVV);

  const isAmplifyingActive =
    context.preset === 'vape_melt' || context.hasAmplifyingReaction;

  const isQuickenActive =
    context.preset === 'quicken_spread' || context.hasQuickenReaction;

  const isHyperbloomActive = context.preset === 'hyperbloom';

  const isLunarOrStellar = Boolean(
    context.hasLunarReaction || context.hasStellarReaction,
  );

  // 1. Flat ATK Dilution (Bennett / Sara / Iansan)
  if (isBennettActive) {
    if (statWeights.atk_ !== undefined) {
      statWeights.atk_ = Number(
        Math.max(0.15, statWeights.atk_ * 0.65).toFixed(2),
      );
    }
    if (statWeights.atk !== undefined) {
      statWeights.atk = Number(
        Math.max(0.05, statWeights.atk * 0.5).toFixed(2),
      );
    }
  }

  // 2. Reaction Scaling (Hyperbloom, Amplifying, Quicken, Lunar/Stellar)
  if (isHyperbloomActive) {
    statWeights.eleMas = 1.0;
    if (statWeights.critRate_ !== undefined) {
      statWeights.critRate_ = Number((statWeights.critRate_ * 0.25).toFixed(2));
    }
    if (statWeights.critDMG_ !== undefined) {
      statWeights.critDMG_ = Number((statWeights.critDMG_ * 0.25).toFixed(2));
    }
    if (statWeights.atk_ !== undefined) {
      statWeights.atk_ = Number((statWeights.atk_ * 0.3).toFixed(2));
    }
    if (!preferredSands.includes('eleMas')) preferredSands.unshift('eleMas');
    if (!preferredGoblet.includes('eleMas')) preferredGoblet.unshift('eleMas');
    if (!preferredCirclet.includes('eleMas')) preferredCirclet.unshift('eleMas');
  } else if (isAmplifyingActive && statWeights.eleMas !== undefined) {
    statWeights.eleMas = Number(
      Math.min(1.0, Math.max(0.85, statWeights.eleMas * 1.35)).toFixed(2),
    );
  } else if (isQuickenActive && statWeights.eleMas !== undefined) {
    statWeights.eleMas = Number(
      Math.min(1.0, Math.max(0.75, statWeights.eleMas * 1.25)).toFixed(2),
    );
  } else if (isLunarOrStellar) {
    const externalEm = safeNonNeg(context.customEmBuff, 0);
    const emSaturationFactor =
      externalEm >= 350 ? 0.55 : externalEm >= 200 ? 0.75 : 0.9;
    statWeights.eleMas = Number(
      clamp(Math.max(statWeights.eleMas ?? 0.6, emSaturationFactor), 0.35, 1.0).toFixed(2),
    );
    statWeights.critRate_ = Math.max(statWeights.critRate_ ?? 0, 1.0);
    statWeights.critDMG_ = Math.max(statWeights.critDMG_ ?? 0, 1.0);

    if (!preferredGoblet.includes('eleMas')) preferredGoblet.push('eleMas');
    if ((statWeights.atk_ ?? 0) >= 0.5 && !preferredGoblet.includes('atk_')) {
      preferredGoblet.push('atk_');
    }
    if ((statWeights.hp_ ?? 0) >= 0.5 && !preferredGoblet.includes('hp_')) {
      preferredGoblet.push('hp_');
    }
  }

  // 3. Furina / Kazuha DMG% Saturation: elevates HP%, ATK%, DEF% goblet viability
  if (isDmgSaturated) {
    if ((config.statWeights.hp_ ?? 0) >= 0.7 && !preferredGoblet.includes('hp_')) {
      preferredGoblet.push('hp_');
    }
    if ((config.statWeights.atk_ ?? 0) >= 0.7 && !preferredGoblet.includes('atk_')) {
      preferredGoblet.push('atk_');
    }
    if ((config.statWeights.def_ ?? 0) >= 0.7 && !preferredGoblet.includes('def_')) {
      preferredGoblet.push('def_');
    }
  }

  return {
    ...config,
    preferredMainStats: {
      sands: preferredSands,
      goblet: preferredGoblet,
      circlet: preferredCirclet,
    },
    statWeights,
  };
}

function pickRelevantSecond2pcSet(
  primarySet: string,
  config: CharacterStatWeightConfig,
): string {
  const altFromConfig = config.targetSets?.find((s) => s !== primarySet);
  if (altFromConfig) return altFromConfig;

  const w = config.statWeights;
  if ((w.hp_ ?? 0) >= 0.85) {
    return primarySet === 'Tenacity of the Millelith'
      ? "Vourukasha's Glow"
      : 'Tenacity of the Millelith';
  }
  if ((w.def_ ?? 0) >= 0.85) {
    return primarySet === 'Husk of Opulent Dreams'
      ? 'Emblem of Severed Fate'
      : 'Husk of Opulent Dreams';
  }
  if ((w.eleMas ?? 0) >= 0.85) {
    return primarySet === 'Gilded Dreams'
      ? "Wanderer's Troupe"
      : 'Gilded Dreams';
  }
  if ((w.heal_ ?? 0) >= 0.85) {
    return primarySet === 'Ocean-Hued Clam'
      ? 'Maiden Beloved'
      : 'Ocean-Hued Clam';
  }
  if ((w.enerRech_ ?? 0) >= 0.9) {
    return primarySet === 'Emblem of Severed Fate'
      ? "Silken Moon's Serenade"
      : 'Emblem of Severed Fate';
  }
  return primarySet === "Gladiator's Finale"
    ? "Shimenawa's Reminiscence"
    : "Gladiator's Finale";
}

export function compareSetConfigurations(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  characterIdOrName: string,
  context?: TeamContext,
  totalEr: number = 100,
  equippedUsefulRolls?: number,
): SetComparisonResult {
  const baseConfig = getCharacterStatWeights(characterIdOrName);
  const config = adjustWeightsForTeamContext(baseConfig, context);
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';

  const pieceSetKeys = Object.values(slots)
    .filter((p): p is ArtifactPiece => !!p && !!p.setKey)
    .map((p) => p.setKey!);

  const active = parseActiveSetBonuses(pieceSetKeys);
  const currentActiveSets = [
    ...active.active4pc.map((s) => ({ setKey: s, pieces: 4 })),
    ...active.active2pc
      .filter((s) => !active.active4pc.includes(s))
      .map((s) => ({ setKey: s, pieces: 2 })),
  ];

  const currentEsr = calculateSetEquivalentSubstatRolls(
    currentActiveSets,
    config.characterId,
    totalEr,
    context,
  );

  const theoretical4pc = calculateSetEquivalentSubstatRolls(
    [{ setKey: targetSetName, pieces: 4 }],
    config.characterId,
    totalEr,
    context,
  );

  const secondSet = pickRelevantSecond2pcSet(targetSetName, config);
  const theoretical2pc2pc = calculateSetEquivalentSubstatRolls(
    [
      { setKey: targetSetName, pieces: 2 },
      { setKey: secondSet, pieces: 2 },
    ],
    config.characterId,
    totalEr,
    context,
  );

  const deltaToBiS = Number(
    (theoretical4pc.totalEsr - currentEsr.totalEsr).toFixed(1),
  );
  const breakEven2pc = Number(
    (theoretical4pc.totalEsr - theoretical2pc2pc.totalEsr).toFixed(1),
  );

  const currentTotalEffectiveRolls =
    typeof equippedUsefulRolls === 'number'
      ? Number((equippedUsefulRolls + currentEsr.totalEsr).toFixed(1))
      : undefined;
  const target4pcRequiredSubstatRolls =
    currentTotalEffectiveRolls !== undefined
      ? Number(
          Math.max(0, currentTotalEffectiveRolls - theoretical4pc.totalEsr).toFixed(1),
        )
      : undefined;
  const hybrid2pcRequiredSubstatRolls =
    currentTotalEffectiveRolls !== undefined
      ? Number(
          Math.max(0, currentTotalEffectiveRolls - theoretical2pc2pc.totalEsr).toFixed(1),
        )
      : undefined;

  const options: SetOptionComparison[] = [
    {
      name: `4pc ${targetSetName} (BiS)`,
      type: '4pc',
      esr: theoretical4pc.totalEsr,
      breakEvenRollDelta: 0,
      description: `Optimal 4-piece set bonus providing ~${theoretical4pc.totalEsr} Equivalent Substat Rolls (ESR).`,
    },
    {
      name: `2pc ${targetSetName} + 2pc ${secondSet}`,
      type: '2pc+2pc',
      esr: theoretical2pc2pc.totalEsr,
      breakEvenRollDelta: Math.max(0, breakEven2pc),
      description:
        breakEven2pc > 0
          ? `Needs +${breakEven2pc} extra useful substat rolls to match 4pc ${targetSetName}.`
          : `Competitive with 4pc ${targetSetName} under current stats and team buffs.`,
    },
    {
      name: 'Rainbow / Off-Piece Broken Set',
      type: 'Rainbow',
      esr: 0,
      breakEvenRollDelta: theoretical4pc.totalEsr,
      description: `0 set bonus ESR; requires +${theoretical4pc.totalEsr} extra useful substat rolls to beat 4pc BiS.`,
    },
  ];

  let verdict = '';
  if (active.active4pc.includes(targetSetName)) {
    verdict = `4pc ${targetSetName} BiS active (+${theoretical4pc.totalEsr} ESR). Focus on upgrading your weakest piece rather than switching sets.`;
  } else if (active.active4pc.length > 0) {
    verdict = `Equipped with 4pc ${active.active4pc[0]} (+${currentEsr.totalEsr} ESR). 4pc ${targetSetName} offers ${deltaToBiS >= 0 ? `+${deltaToBiS}` : deltaToBiS} ESR${target4pcRequiredSubstatRolls !== undefined ? ` (beat your current build at ≥${target4pcRequiredSubstatRolls} useful rolls on 4pc BiS)` : ''}.`;
  } else if (active.active2pc.length >= 2) {
    verdict = `2pc/2pc active (+${currentEsr.totalEsr} ESR). ${deltaToBiS > 0 ? `Switching to 4pc ${targetSetName} beats this build once it reaches ≥${target4pcRequiredSubstatRolls ?? Math.max(0, deltaToBiS)} useful rolls (+${deltaToBiS} ESR gap).` : `Your 2pc/2pc already matches or exceeds 4pc ${targetSetName} ESR under this context.`}`;
  } else {
    verdict = `Rainbow build (+${currentEsr.totalEsr} ESR). Completing 4pc ${targetSetName} immediately adds +${deltaToBiS} equivalent substat rolls!`;
  }

  return {
    currentSetEsr: currentEsr.totalEsr,
    activeSets: active.active4pc.length > 0 ? active.active4pc : active.active2pc,
    options,
    breakEvenRollDelta: Math.max(0, deltaToBiS),
    verdict,
    currentTotalEffectiveRolls,
    target4pcRequiredSubstatRolls,
    hybrid2pcRequiredSubstatRolls,
    recommended2pcPair: [targetSetName, secondSet],
  };
}

/**
 * Computes marginal DPS gain per useful roll and resin cost per 1% DPS gain
 * directly benchmarked against guaranteed progression upgrades.
 */
export function evaluateRoiAgainstGuaranteedUpgrades(
  _characterName: string,
  currentUsefulRolls: number,
  weakestSlotExpectedRuns: number,
  isReactionOrHpDefScaler: boolean = false,
  exactRoiPer1kResinPct?: number,
): RoiComparison {
  const safeRolls = safeNonNeg(currentUsefulRolls, 0);
  const safeRuns = Math.max(1, safeNonNeg(weakestSlotExpectedRuns, 20));

  const marginalDpsPerRoll = Number(
    clamp(
      (isReactionOrHpDefScaler ? 32 : 80) / (safeRolls + 12),
      isReactionOrHpDefScaler ? 0.7 : 1.8,
      isReactionOrHpDefScaler ? 1.6 : 3.8,
    ).toFixed(2),
  );

  const fallbackResinPerPct = Math.round((safeRuns * 20) / marginalDpsPerRoll);
  const resinPerOnePctArtifactDps =
    typeof exactRoiPer1kResinPct === 'number' && Number.isFinite(exactRoiPer1kResinPct)
      ? Math.min(25000, Math.max(20, Math.round(1000 / Math.max(0.04, exactRoiPer1kResinPct))))
      : Math.min(25000, Math.max(20, fallbackResinPerPct));

  const milestones: RoiMilestoneComparison[] = [
    {
      name: 'Talent Level 8 → 9/10 (Guaranteed)',
      costResin: 260,
      expectedDpsGainPct: 5.5,
      resinPerOnePctDps: 47,
      isGuaranteed: true,
      efficiencyRatioVsArtifacts: Number((resinPerOnePctArtifactDps / 47).toFixed(1)),
    },
    {
      name: 'Weapon Level 80 → 90 (Guaranteed)',
      costResin: 220,
      expectedDpsGainPct: 4.8,
      resinPerOnePctDps: 46,
      isGuaranteed: true,
      efficiencyRatioVsArtifacts: Number((resinPerOnePctArtifactDps / 46).toFixed(1)),
    },
    {
      name: isReactionOrHpDefScaler
        ? 'Character Level 80 → 90 (Transformative Reaction / HP/DEF Scale)'
        : 'Character Level 80 → 90 (Base Scaling)',
      costResin: 420,
      expectedDpsGainPct: isReactionOrHpDefScaler ? 20.0 : 3.5,
      resinPerOnePctDps: isReactionOrHpDefScaler ? 21 : 120,
      isGuaranteed: true,
      efficiencyRatioVsArtifacts: Number(
        (resinPerOnePctArtifactDps / (isReactionOrHpDefScaler ? 21 : 120)).toFixed(1),
      ),
    },
  ];

  let decision: 'Stop Farming' | 'Continue Farming' | 'Switch to Guaranteed Upgrades';
  let summaryBanner = '';

  if (resinPerOnePctArtifactDps >= 1200) {
    decision = 'Stop Farming';
    const topRatio = Math.max(...milestones.map((m) => m.efficiencyRatioVsArtifacts));
    summaryBanner = `STOP FARMING THIS DOMAIN. Expected cost is ~${resinPerOnePctArtifactDps.toLocaleString()} resin per 1% DPS gain. Your resin is ${topRatio}x more effective on guaranteed upgrades (Talents & Weapons).`;
  } else if (resinPerOnePctArtifactDps >= 450) {
    decision = 'Switch to Guaranteed Upgrades';
    summaryBanner = `Diminishing returns reached (~${resinPerOnePctArtifactDps} resin per 1% DPS). Finish guaranteed Talents and Weapons first before seeking artifact upgrades.`;
  } else {
    decision = 'Continue Farming';
    summaryBanner = `High ROI zone (~${resinPerOnePctArtifactDps} resin per 1% DPS). Upgrading weak slots is cost-effective.`;
  }

  return {
    resinPerOnePctArtifactDps,
    artifactMarginalDpsGainPerRoll: marginalDpsPerRoll,
    decision,
    milestones,
    summaryBanner,
  };
}

/**
 * Smart Strongbox and domain pairing routing advisor (updated through v7.2).
 */
export function evaluateDomainRoute(
  targetSetName: string,
): DomainRouteRecommendation {
  const isStrongboxEligible = STRONGBOX_SETS_SET.has(targetSetName);

  const domain = DOMAIN_PAIRS_REGISTRY.find(
    (d) => d.sets[0] === targetSetName || d.sets[1] === targetSetName,
  );

  if (!domain) {
    return {
      targetSet: targetSetName,
      isStrongboxEligible,
      companionValue: 'Moderate',
      recommendedAction: isStrongboxEligible
        ? 'Use Strongbox / Farm Marechaussee or Deepwood'
        : 'Farm Domain',
      guidance: isStrongboxEligible
        ? `${targetSetName} is available in Mystic Offering (34% 4-liner rate). Craft pieces using fodder from high-value domains.`
        : `Farm ${targetSetName} directly in its dedicated domain.`,
    };
  }

  const companionSet =
    domain.sets[0] === targetSetName ? domain.sets[1] : domain.sets[0];

  const lowValueSets = new Set([
    'Lavawalker',
    'Maiden Beloved',
    'Thundersoother',
    'Retracing Bolide',
    'Echoes of an Offering',
    'Vermillion Hereafter',
    'Bloodstained Chivalry',
    'Nymph\'s Dream',
    'Vourukasha\'s Glow',
    'Song of Days Past',
  ]);
  const highValueSets = new Set([
    'Golden Troupe',
    'Marechaussee Hunter',
    'Gilded Dreams',
    'Deepwood Memories',
    'Obsidian Codex',
    'Scroll of the Hero of Cinder City',
    "Shimenawa's Reminiscence",
    'Emblem of Severed Fate',
    "Night of the Sky's Unveiling",
    "Silken Moon's Serenade",
    'Finale of the Deep Galleries',
    "Long Night's Oath",
    'Aubade of Morningstar and Moon',
    'A Day Carved From Rising Winds',
    'Scarlet Proof',
    'Disenchantment in Deep Shadow',
    'Heart of the Furnace',
  ]);

  let companionValue: 'High' | 'Low' | 'Moderate' = 'Moderate';
  if (lowValueSets.has(companionSet)) companionValue = 'Low';
  else if (highValueSets.has(companionSet)) companionValue = 'High';

  let recommendedAction:
    | 'Farm Domain'
    | 'Use Strongbox / Farm Marechaussee or Deepwood'
    | 'Neutral' = 'Farm Domain';
  let guidance = '';

  if (isStrongboxEligible && companionValue === 'Low') {
    recommendedAction = 'Use Strongbox / Farm Marechaussee or Deepwood';
    guidance = `Domain partner (${companionSet}) has low account value. DO NOT farm ${domain.domainName} directly—farm a high-efficiency domain and recycle fodder 3:1 into Mystic Offering (34% 4-liner rate) for ${targetSetName}.`;
  } else if (companionValue === 'High') {
    recommendedAction = 'Farm Domain';
    guidance = `Both ${targetSetName} and ${companionSet} are high-value sets. Farming ${domain.domainName} provides 100% resin efficiency!`;
  } else {
    recommendedAction = isStrongboxEligible ? 'Neutral' : 'Farm Domain';
    guidance = isStrongboxEligible
      ? `${targetSetName} is in Strongbox (34% 4-liner rate). You can farm ${domain.domainName} or recycle fodder.`
      : `Farm ${domain.domainName} directly.`;
  }

  return {
    targetSet: targetSetName,
    isStrongboxEligible,
    domainName: domain.domainName,
    companionSet,
    companionValue,
    recommendedAction,
    guidance,
  };
}

/**
 * Extracts and maps 5-slot equipped artifacts for a character from imported raw GOOD data.
 */
export function extractEquippedArtifactsForCharacter(
  rawArtifacts: any[],
  characterId: string,
): Partial<Record<ArtifactSlot, ArtifactPiece>> {
  const result: Partial<Record<ArtifactSlot, ArtifactPiece>> = {};
  if (!Array.isArray(rawArtifacts) || !characterId) return result;

  const charNorm = characterId.replace(/[\s\-_]/g, '').toLowerCase();

  for (const art of rawArtifacts) {
    if (!art || !art.location) continue;
    const locNorm = String(art.location).replace(/[\s\-_]/g, '').toLowerCase();
    if (locNorm === charNorm) {
      const slot = String(art.slotKey).toLowerCase() as ArtifactSlot;
      if (['flower', 'plume', 'sands', 'goblet', 'circlet'].includes(slot)) {
        result[slot] = {
          id: art.id,
          slotKey: slot,
          setKey: art.setKey,
          rarity: Number(art.rarity) || 5,
          level: Number(art.level) || 20,
          mainStatKey: art.mainStatKey,
          substats: Array.isArray(art.substats)
            ? art.substats
                .filter(
                  (s: any) =>
                    s &&
                    s.key &&
                    s.value !== undefined &&
                    Number.isFinite(Number(s.value)) &&
                    Number(s.value) > 0,
                )
                .map((s: any) => {
                  const numVal = Number(s.value);
                  const maxVal = getMaxRollValue(s.key as StatKey);
                  return {
                    key: s.key,
                    value: numVal,
                    rollValue: maxVal > 0 ? Math.round((numVal / maxVal) * 100) : undefined,
                  };
                })
            : [],
          location: art.location,
        };
      }
    }
  }
  return result;
}

/**
 * Computes exact expected uRV gain per single targeted 5★ drop in `slot`.
 */
function computeSlotExpectedGainPerDrop(
  slot: ArtifactSlot,
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
  weights: Record<StatKey, number>,
  fourLineProb: number,
): number {
  const validMain = isMainStatValid(slot, piece, config);
  const isIncomplete = !piece || !validMain || piece.rarity < 5 || piece.level < 16;
  const currentURV = isIncomplete
    ? 0
    : calculatePieceRollValue(piece, config).usefulRolls;

  const preferredList =
    slot === 'flower'
      ? (['hp'] as StatKey[])
      : slot === 'plume'
        ? (['atk'] as StatKey[])
        : config.preferredMainStats?.[slot]?.length
          ? config.preferredMainStats[slot]
          : (['atk_'] as StatKey[]);

  const slotChance = DOMAIN_CONSTANTS.SLOT_CHANCE || 0.2;
  const mainFixBonus =
    !validMain && slot !== 'flower' && slot !== 'plume' ? 5.0 : 0;

  let evPerTargetSetDrop = 0;
  for (const mStat of new Set(preferredList)) {
    const mProb = getMainStatProb(slot, mStat);
    if (mProb <= 0) continue;

    const pmf = computeExactSlotURVPMF(mStat, weights, fourLineProb);
    let slotEv = 0;
    for (let b = 0; b < MAX_BINS; b++) {
      const u = b * BIN_STEP;
      if (mainFixBonus > 0 || u > currentURV + EPS) {
        slotEv += (Math.max(0, u - currentURV) + mainFixBonus) * pmf[b];
      }
    }
    evPerTargetSetDrop += slotChance * mProb * slotEv;
  }

  return Math.max(0, evPerTargetSetDrop);
}

/**
 * Estimates total effective CRIT Rate (base + artifacts + active 4pc conditional + team buffs).
 */
function estimateEffectiveCritRate(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  active4pc: string[],
  teamContext?: TeamContext,
): { effectiveCr: number; conditionalSetCr: number } {
  let cr = safeNonNeg(teamContext?.baseCritRate, 5) + safeNonNeg(teamContext?.customCritRateBuff, 0);

  if (slots.circlet?.mainStatKey === 'critRate_') {
    cr += 31.1;
  }

  for (const piece of Object.values(slots)) {
    if (!piece || !Array.isArray(piece.substats)) continue;
    for (const sub of piece.substats) {
      if (sub?.key === 'critRate_') {
        cr += safeNonNeg(sub.value, 0);
      }
    }
  }

  let conditionalSetCr = 0;
  for (const setName of active4pc) {
    conditionalSetCr += SET_4PC_CONDITIONAL_CR[setName] ?? 0;
  }

  return {
    effectiveCr: Number((cr + conditionalSetCr).toFixed(1)),
    conditionalSetCr,
  };
}

function calibratedCharKey(c: CharacterStatWeightConfig) {
  return c.characterId || c.characterName;
}

/**
 * Artifact optimizer consumes `artifact-weights.ts`, `artifact-set-effects.ts`
 * (stat weights, roll tiers, main-stat targets, and set effects attested under
 * `artifact_weights_v7_2`), and `characters.ts` (`characters_v7_2_batch7`).
 * `artifacts-master.ts` (`artifacts_v7_2_master`) is NOT imported anywhere in the
 * optimizer call graph.
 */
const ARTIFACT_OPTIMIZER_REQUIRED_DATASETS = [
  'characters_v7_2_batch7',
  'artifact_weights_v7_2',
];

/**
 * Materially influential local tables and probability/transmuter constants consumed by
 * `computeArtifactBuildAnalysis` that are NOT attested in `DATA_PROVENANCE_REGISTRY`.
 * Declaring them ensures `analyzeArtifactBuild` never silently returns `reliable` / `isActionable: true`.
 */
const ARTIFACT_OPTIMIZER_UNATTESTED_DEPS: readonly UnattestedLocalDependency[] = [
  { name: 'DOMAIN_CONSTANTS', sourceFile: 'src/data/artifact-weights.ts' },
  { name: 'DOMAIN_PAIRS_REGISTRY', sourceFile: 'src/data/artifact-weights.ts' },
  { name: 'STRONGBOX_SETS_SET', sourceFile: 'src/data/artifact-weights.ts' },
  {
    name: 'Artifact probability, Strongbox, domainEfficiency, conditional set bonus & transmuter/reshape constants',
    sourceFile: 'src/engines/artifact-probability.ts',
  },
];

/**
 * Internal artifact build computation without reliability evaluation.
 * Shared by `analyzeArtifactBuild` and `computeBuildEstimateFromSlidersInternal`
 * to prevent duplicate reliability evaluations in nested calls.
 */
function computeArtifactBuildAnalysis(
  characterIdOrName: string,
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  teamContext?: TeamContext,
  options?: UniversalStopOptions,
): ArtifactBuildComputation {
  const baseConfig = getCharacterStatWeights(characterIdOrName);
  const config = adjustWeightsForTeamContext(baseConfig, teamContext);
  const goal: InvestmentGoal = options?.goal ?? 'endgame';
  const pityTier: ReshapePityTier = options?.reshapePityTier ?? 'standard';
  const setMode = options?.setMode ?? '4pc';
  const includeStrongbox = options?.includeStrongboxRecycling ?? true;
  const thresholdPct = GOAL_THRESHOLDS_PCT[goal];

  // 1. Active sets & 4pc conditional CRIT Rate
  const pieceSetKeys = Object.values(slots)
    .filter((p): p is ArtifactPiece => !!p && !!p.setKey)
    .map((p) => p.setKey!);
  const activeSets = parseActiveSetBonuses(pieceSetKeys);
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';
  const domainRoute = evaluateDomainRoute(targetSetName);

  // 2. Whole-Build ER evaluation (incorporating optional weapon / ascension ER & custom target)
  const erEvaluation = evaluateWholeBuildEr(
    slots,
    teamContext?.customErTarget ?? config.erRequirement ?? 130,
    activeSets.active2pc,
    100,
    teamContext?.weaponEr ?? 0,
    teamContext?.ascensionEr ?? 0,
  );

  // Validate equipped set bonuses (unknown sets, wasted 3pc, element-mismatched 2pc)
  const setBonusValidation = validateArtifactSetBonuses(slots, calibratedCharKey(config));

  // Track transparent weight adjustment explanations for the UI
  const weightAdjustmentNotes: string[] = [];
  if (teamContext?.preset === 'hypercarry_bennett_furina' || teamContext?.hasBennett) {
    weightAdjustmentNotes.push('Bennett/Flat ATK buff: ATK% weight ×0.65, Flat ATK ×0.50');
  }
  if (
    teamContext?.preset === 'hypercarry_bennett_furina' ||
    teamContext?.hasFurina ||
    teamContext?.hasKazuhaOrVV
  ) {
    weightAdjustmentNotes.push('Furina/VV DMG% saturation: HP%/ATK%/DEF% Goblets elevated');
  }
  if (teamContext?.preset === 'vape_melt' || teamContext?.hasAmplifyingReaction) {
    weightAdjustmentNotes.push('Vaporize/Melt active: EM weight boosted ×1.35');
  }
  if (teamContext?.preset === 'quicken_spread' || teamContext?.hasQuickenReaction) {
    weightAdjustmentNotes.push('Quicken/Spread active: EM weight boosted ×1.25');
  }
  if (teamContext?.preset === 'hyperbloom') {
    weightAdjustmentNotes.push('Hyperbloom active: EM locked to 1.0, Crit/ATK% downweighted');
  }

  // 3. Dynamic Three-Zone ER & 100% CR Overcap weight calibration
  const calibratedWeights: Partial<Record<StatKey, number>> = {
    ...config.statWeights,
  };

  const is4pcEmblem = activeSets.active4pc.includes('Emblem of Severed Fate');
  if (erEvaluation.status === 'Deficit') {
    const currentMaxW = Math.max(
      ...ALL_SUBSTATS.map((s) => safeNonNeg(calibratedWeights[s], 0)),
      1,
    );
    calibratedWeights.enerRech_ = Math.max(
      safeNonNeg(calibratedWeights.enerRech_, 0),
      currentMaxW,
    );
  } else if (erEvaluation.status === 'Overcap' && !is4pcEmblem) {
    if (calibratedWeights.enerRech_ !== undefined) {
      calibratedWeights.enerRech_ = Number(
        ((calibratedWeights.enerRech_ || 0.6) * 0.1).toFixed(2),
      );
    }
  }

  if (erEvaluation.status === 'Deficit') {
    weightAdjustmentNotes.push(
      `ER Deficit (${erEvaluation.totalEr}% / ${erEvaluation.targetEr}%): ER weight elevated to primary priority`,
    );
  } else if (erEvaluation.status === 'Overcap' && !is4pcEmblem) {
    weightAdjustmentNotes.push(
      `ER Surplus (+${erEvaluation.erDifference}%): ER substat weight decayed to 0.1×`,
    );
  }

  const { effectiveCr, conditionalSetCr } = estimateEffectiveCritRate(
    slots,
    activeSets.active4pc,
    teamContext,
  );
  if (effectiveCr >= 100 && (calibratedWeights.critRate_ ?? 0) > 0) {
    calibratedWeights.critRate_ = 0;
  } else if (effectiveCr >= 92 && (calibratedWeights.critRate_ ?? 0) > 0) {
    const headroomFactor = clamp((100 - effectiveCr) / 8, 0.15, 1);
    calibratedWeights.critRate_ = Number(
      ((calibratedWeights.critRate_ ?? 1) * headroomFactor).toFixed(2),
    );
  }

  if (effectiveCr >= 100 && (config.statWeights.critRate_ ?? 0) > 0) {
    weightAdjustmentNotes.push(
      `CR Overcap (${effectiveCr}% incl. +${conditionalSetCr}% set): CRIT Rate weight set to 0`,
    );
  } else if (effectiveCr >= 92 && (config.statWeights.critRate_ ?? 0) > 0) {
    weightAdjustmentNotes.push(
      `Near CR Cap (${effectiveCr}%): CRIT Rate weight tapered for headroom`,
    );
  }

  const calibratedConfig: CharacterStatWeightConfig = {
    ...config,
    statWeights: calibratedWeights,
  };
  const normWeights = getNormalizedWeights(calibratedConfig);

  // 4. Optimize 4pc + 1 Off-Piece assignment (maximizes expected uRV gain per 20 Resin)
  const dropsPerRun =
    (DOMAIN_CONSTANTS.FIVE_STAR_PER_RUN || 1.065) +
    (options?.stygianOutbreakActive ? STYGIAN_BONUS_DROPS_PER_RUN : 0);
  const strongboxActive = includeStrongbox && domainRoute.isStrongboxEligible;

  const perSlotDomEv = {} as Record<ArtifactSlot, number>;
  const perSlotSbEv = {} as Record<ArtifactSlot, number>;
  for (const slot of ALL_SLOTS) {
    perSlotDomEv[slot] = computeSlotExpectedGainPerDrop(
      slot,
      slots[slot] ?? null,
      calibratedConfig,
      normWeights,
      DOMAIN_FOUR_LINE_PROB,
    );
    perSlotSbEv[slot] = strongboxActive
      ? computeSlotExpectedGainPerDrop(
          slot,
          slots[slot] ?? null,
          calibratedConfig,
          normWeights,
          STRONGBOX_FOUR_LINE_PROB,
        )
      : 0;
  }

  let recommendedOffPieceSlot: ArtifactSlot = 'goblet';
  let bestEvAcross5 = -1;
  for (const offCandidate of ALL_SLOTS) {
    let sumEv = 0;
    for (const s of ALL_SLOTS) {
      const setP =
        setMode === '2pc2pc'
          ? 0.5
          : s === offCandidate
            ? 1.0
            : DOMAIN_CONSTANTS.TARGET_SET_CHANCE || 0.5;
      sumEv +=
        dropsPerRun * setP * perSlotDomEv[s] +
        (strongboxActive ? dropsPerRun * STRONGBOX_RECURSIVE_YIELD * perSlotSbEv[s] : 0);
    }
    if (sumEv > bestEvAcross5) {
      bestEvAcross5 = sumEv;
      recommendedOffPieceSlot = offCandidate;
    }
  }

  // 5. Evaluate per-slot upgrade probabilities, universal ROI, Elixir EV & Dust Reshape EV
  const slotBreakdown = {} as Record<ArtifactSlot, SlotUpgradeProbability>;
  const slotMetrics = {} as Record<ArtifactSlot, UniversalSlotMetrics>;
  const hardGatesFailed: string[] = [];

  if (setMode === '4pc') {
    const has4pc = activeSets.active4pc.length > 0;
    if (!has4pc && pieceSetKeys.length > 0) {
      hardGatesFailed.push(`Missing 4pc set bonus (target: ${targetSetName})`);
    }
  } else if (activeSets.active2pc.length < 2 && activeSets.active4pc.length === 0) {
    hardGatesFailed.push('Missing 2pc + 2pc set bonus');
  }

  if (erEvaluation.status === 'Deficit') {
    hardGatesFailed.push(
      `ER below target (${erEvaluation.totalEr}% / ${erEvaluation.targetEr}%)`,
    );
  }

  const domainEfficiency = clamp(
    options?.domainEfficiencyOverride ??
      (domainRoute.companionValue === 'High'
        ? 1.75
        : domainRoute.companionValue === 'Moderate'
          ? 1.25
          : 1.0),
    1.0,
    2.0,
  );

  const isReactionOrHpDef =
    (normWeights.hp_ ?? 0) >= 0.99 ||
    (normWeights.def_ ?? 0) >= 0.99 ||
    (normWeights.eleMas ?? 0) >= 0.99;

  // Approximate % build gain per 1 max roll of the build's #1 stat (diminishes smoothly with current rolls)
  let rawTotalRV = 0;
  let rawTotalUsefulRolls = 0;
  for (const slot of ALL_SLOTS) {
    const piece = slots[slot] ?? null;
    const isOff = setMode === '4pc' && slot === recommendedOffPieceSlot;
    const analysis = calculateSlotUpgradeProbability(
      slot,
      piece,
      calibratedConfig,
      isOff,
      options,
    );
    slotBreakdown[slot] = analysis;
    rawTotalRV += analysis.currentRollValue;
    rawTotalUsefulRolls += analysis.currentUsefulRolls;
  }

  const gainPerMaxRollPct = clamp(
    (isReactionOrHpDef ? 36 : 82) / (rawTotalUsefulRolls + 16),
    isReactionOrHpDef ? 0.9 : 1.7,
    isReactionOrHpDef ? 2.2 : 3.5,
  );

  let totalRoiPer1kResinPct = 0;
  let prioritySlot: ArtifactSlot = recommendedOffPieceSlot;
  let highestSlotRoi = -1;
  let completionSum = 0;

  for (const slot of ALL_SLOTS) {
    const piece = slots[slot] ?? null;
    const isOff = setMode === '4pc' && slot === recommendedOffPieceSlot;
    const validMain = isMainStatValid(slot, piece, calibratedConfig);
    if (!validMain) {
      hardGatesFailed.push(`Missing valid ${SLOT_NAMES[slot]} main stat`);
    } else if (piece && (piece.rarity < 5 || piece.level < 16)) {
      hardGatesFailed.push(`${SLOT_NAMES[slot]} is not a leveled 5★ piece`);
    }

    const preferredList =
      slot === 'flower'
        ? (['hp'] as StatKey[])
        : slot === 'plume'
          ? (['atk'] as StatKey[])
          : calibratedConfig.preferredMainStats?.[slot]?.length
            ? calibratedConfig.preferredMainStats[slot]
            : (['atk_'] as StatKey[]);
    const refMain = piece && validMain ? piece.mainStatKey : preferredList[0];

    const currentURV = validMain ? slotBreakdown[slot].currentUsefulRolls : 0;
    const realisticCeilingURV = getSlotRealisticCeilingURV(refMain, normWeights);
    const completionPct =
      !validMain
        ? 0
        : realisticCeilingURV <= EPS
          ? 100
          : clamp((currentURV / realisticCeilingURV) * 100, 0, 100);
    completionSum += completionPct;

    const setP =
      setMode === '2pc2pc'
        ? 0.5
        : isOff
          ? 1.0
          : DOMAIN_CONSTANTS.TARGET_SET_CHANCE || 0.5;
    const evURVPer20 =
      dropsPerRun * setP * perSlotDomEv[slot] +
      (strongboxActive ? dropsPerRun * STRONGBOX_RECURSIVE_YIELD * perSlotSbEv[slot] : 0);

    const slotRoi1k = 50 * domainEfficiency * evURVPer20 * gainPerMaxRollPct;
    totalRoiPer1kResinPct += slotRoi1k;

    if (slotRoi1k > highestSlotRoi) {
      highestSlotRoi = slotRoi1k;
      prioritySlot = slot;
    }

    const reshapeEV = computeReshapeExpectedURVGain(
      piece,
      normWeights,
      currentURV,
      pityTier,
    );
    const elixirEV = computeElixirExpectedURVGain(
      slot,
      refMain,
      currentURV,
      validMain,
      normWeights,
    );

    slotMetrics[slot] = {
      slotKey: slot,
      isOffPieceCandidate: isOff,
      hasValidMainStat: validMain,
      currentURV: Number(currentURV.toFixed(2)),
      realisticCeilingURV: Number(realisticCeilingURV.toFixed(2)),
      completionPct: Number(completionPct.toFixed(1)),
      expectedURVGainPerDrop: Number((setP * perSlotDomEv[slot]).toFixed(4)),
      expectedGainPctPer1kResin: Number(slotRoi1k.toFixed(3)),
      reshapeExpectedURVGain: Number(reshapeEV.toFixed(2)),
      elixirExpectedURVGain: Number(elixirEV.toFixed(2)),
      elixirCost: ELIXIR_COST[slot],
      dustCost: DUST_COST[slot],
    };
  }

  // 6. Combined diminishing returns curve across all 5 slots
  let pNoUpgrade = 1.0;
  for (const slot of ALL_SLOTS) {
    pNoUpgrade *= 1 - slotBreakdown[slot].upgradeProbabilityPerRun;
  }
  const overallUpgradePPerRun = clamp(1 - pNoUpgrade, 0.0001, 0.999);
  const curve = generateDiminishingReturnsCurve(overallUpgradePPerRun, 60);

  // 7. Apply ER deficit score penalty if rotations fail
  let totalRV = rawTotalRV;
  let totalUsefulRolls = Number(rawTotalUsefulRolls.toFixed(2));
  const averageSlotRollValue = Math.round(totalRV / 5);
  if (erEvaluation.status === 'Deficit') {
    totalRV = Math.round(totalRV * erEvaluation.penaltyFactor);
    totalUsefulRolls = Number((totalUsefulRolls * erEvaluation.penaltyFactor).toFixed(2));
  }

  const weakestSlot = findWeakestSlot(slotBreakdown);
  const setComparison = compareSetConfigurations(
    slots,
    characterIdOrName,
    teamContext,
    erEvaluation.totalEr,
    rawTotalUsefulRolls,
  );
  const roiComparison = evaluateRoiAgainstGuaranteedUpgrades(
    calibratedConfig.characterName,
    totalUsefulRolls,
    weakestSlot?.expectedRunsForUpgrade || 20,
    isReactionOrHpDef,
    totalRoiPer1kResinPct,
  );

  const baseStopScore = completionSum / 5;
  const stopScore = clamp(Math.round(baseStopScore - hardGatesFailed.length * 15), 0, 100);

  // 8. Universal 5-Way Stop-Farming Decision Engine
  const reasons: string[] = [];
  let action: UniversalStopAction = 'STOP';

  const bestDustSlot = [...ALL_SLOTS].sort(
    (a, b) =>
      slotMetrics[b].reshapeExpectedURVGain / DUST_COST[b] -
      slotMetrics[a].reshapeExpectedURVGain / DUST_COST[a],
  )[0];
  const bestElixirSlot = [...ALL_SLOTS].sort(
    (a, b) =>
      slotMetrics[b].elixirExpectedURVGain / ELIXIR_COST[b] -
      slotMetrics[a].elixirExpectedURVGain / ELIXIR_COST[a],
  )[0];
  const priorityShare =
    totalRoiPer1kResinPct > EPS ? highestSlotRoi / totalRoiPer1kResinPct : 0;

  if (hardGatesFailed.length > 0) {
    const onlyOneRareMainMissing =
      hardGatesFailed.length === 1 &&
      (!slotMetrics.goblet.hasValidMainStat ||
        !slotMetrics.circlet.hasValidMainStat ||
        !slotMetrics.sands.hasValidMainStat);
    if (onlyOneRareMainMissing) {
      action = 'USE_ELIXIR';
      reasons.push(
        `Only missing 1 rare main stat (${hardGatesFailed[0]}). Defining it with Sanctifying Elixir bypasses weeks of RNG.`,
      );
    } else {
      action = 'FARM_DOMAIN';
      reasons.push(`Hard gates unmet: ${hardGatesFailed.join('; ')}.`);
    }
  } else if (totalRoiPer1kResinPct < thresholdPct) {
    action = 'STOP';
    reasons.push(
      `Expected gain (${totalRoiPer1kResinPct.toFixed(2)}% / 1k Resin) is below the ${goal} threshold (${thresholdPct.toFixed(2)}%). Reallocate Resin to talents, weapons, or another character.`,
    );
  } else if (
    priorityShare >= 0.45 &&
    ['goblet', 'circlet', 'sands'].includes(prioritySlot) &&
    slotMetrics[bestElixirSlot].elixirExpectedURVGain >= 1.4 &&
    slotBreakdown[prioritySlot].expectedDaysForUpgrade >= 14
  ) {
    action = 'USE_ELIXIR';
    reasons.push(
      `${SLOT_NAMES[prioritySlot]} holds ${Math.round(priorityShare * 100)}% of remaining upgrade gain; Sanctifying Elixir saves >2 weeks of Resin.`,
    );
  } else if (
    slotMetrics[bestDustSlot].reshapeExpectedURVGain >= 0.85 &&
    (stopScore >= 70 || totalRoiPer1kResinPct < thresholdPct * 2.5)
  ) {
    action = 'USE_DUST';
    reasons.push(
      `${SLOT_NAMES[bestDustSlot]} has strong substats with poor roll luck (+${slotMetrics[bestDustSlot].reshapeExpectedURVGain} expected rolls via ${pityTier} Dust of Enlightenment reshape).`,
    );
  } else if (
    domainRoute.isStrongboxEligible &&
    domainRoute.companionValue === 'Low' &&
    totalRoiPer1kResinPct < thresholdPct * 2.0
  ) {
    action = 'STRONGBOX_ONLY';
    reasons.push(
      `Marginal ROI (${totalRoiPer1kResinPct.toFixed(2)}% / 1k Resin) and low-value companion set; farm a universal domain and Strongbox ${targetSetName} (34% 4-liner rate).`,
    );
  } else {
    action = 'FARM_DOMAIN';
    reasons.push(
      `Expected gain (${totalRoiPer1kResinPct.toFixed(2)}% / 1k Resin) beats the ${goal} threshold (${thresholdPct.toFixed(2)}%). Target ${SLOT_NAMES[prioritySlot]} (keep ${SLOT_NAMES[recommendedOffPieceSlot]} as flex off-piece).`,
    );
  }

  const universalStop: UniversalStopSummary = {
    action,
    shouldStop: action === 'STOP',
    stopScore,
    roiPer1kResinPct: Number(totalRoiPer1kResinPct.toFixed(3)),
    thresholdPct,
    goal,
    recommendedOffPieceSlot,
    prioritySlot,
    hardGatesFailed,
    effectiveCritRatePct: effectiveCr,
    conditionalCritRateFromSet: conditionalSetCr,
    slotMetrics,
    reasons,
  };

  // 9. Map universal verdict cleanly into existing overallStatus & advice fields
  let overallStatus: 'Ready / Stop Farming' | 'High ROI' | 'Diminishing Returns';
  let advice: string;

  if (action === 'STOP' || (hardGatesFailed.length === 0 && stopScore >= 88)) {
    overallStatus = 'Ready / Stop Farming';
    advice = `STOP FARMING (${stopScore}/100 build completion, ${totalRV}% RV, ~${totalUsefulRolls.toFixed(1)} useful rolls). Expected gain is only ${totalRoiPer1kResinPct.toFixed(2)}% per 1,000 Resin (~${weakestSlot?.expectedDaysForUpgrade ?? 30} days for weakest slot). ${reasons[0] ?? ''}`;
  } else if (
    hardGatesFailed.length === 0 &&
    (action === 'STRONGBOX_ONLY' ||
      action === 'USE_ELIXIR' ||
      action === 'USE_DUST' ||
      totalRoiPer1kResinPct < thresholdPct * 2.5)
  ) {
    overallStatus = 'Diminishing Returns';
    advice = `Diminishing returns (${stopScore}/100 completion, ${totalRV}% RV, ${totalRoiPer1kResinPct.toFixed(2)}% gain / 1k Resin). ${reasons[0] ?? ''}`;
  } else {
    overallStatus = 'High ROI';
    advice = `High ROI (${stopScore}/100 completion, ${totalRV}% RV, +${totalRoiPer1kResinPct.toFixed(2)}% gain / 1k Resin). Focus on ${SLOT_NAMES[prioritySlot]} (~${weakestSlot?.expectedDaysForUpgrade ?? 4} days).`;
  }

  if (erEvaluation.status === 'Deficit') {
    advice = `⚠️ ER DEFICIT WARNING: ${erEvaluation.message} ${advice}`;
  }

  const guaranteedAlternative = getGuaranteedAlternative(
    calibratedConfig.characterName,
    overallStatus,
  );

  const slotUpgradeRanking: SlotUpgradePriorityItem[] = [...ALL_SLOTS]
    .map((slot) => {
      const m = slotMetrics[slot];
      const br = slotBreakdown[slot];
      let priority: SlotUpgradePriorityItem['priority'] = 'Moderate';
      let reason = '';

      if (!m.hasValidMainStat || !slots[slot]) {
        priority = 'Immediate';
        reason = !slots[slot]
          ? 'Empty slot — any matching 5★ piece is an immediate gain.'
          : `Wrong main stat (${slots[slot]?.mainStatKey}) — replace immediately.`;
      } else if (m.expectedGainPctPer1kResin >= thresholdPct * 0.65 && m.completionPct < 75) {
        priority = 'High';
        reason = `+${m.expectedGainPctPer1kResin.toFixed(2)}% expected gain / 1k Resin (~${br.expectedDaysForUpgrade}d for 50% upgrade).`;
      } else if (m.completionPct >= 88 || m.expectedGainPctPer1kResin < thresholdPct * 0.2) {
        priority = 'Skip';
        reason = `Near ceiling (${m.completionPct}% completion, ~${br.expectedDaysForUpgrade}d ETA). Stop rolling this slot.`;
      } else {
        priority = 'Moderate';
        reason = `${m.completionPct}% completion (+${m.expectedGainPctPer1kResin.toFixed(2)}% / 1k Resin).${m.reshapeExpectedURVGain >= 0.85 ? ` Good Dust Reshape candidate (+${m.reshapeExpectedURVGain} rolls).` : ''}`;
      }

      return {
        slotKey: slot,
        slotName: SLOT_NAMES[slot],
        priority,
        expectedGainPctPer1kResin: m.expectedGainPctPer1kResin,
        completionPct: m.completionPct,
        reason,
      };
    })
    .sort((a, b) => b.expectedGainPctPer1kResin - a.expectedGainPctPer1kResin);

  return {
    characterId: calibratedConfig.characterId,
    characterName: calibratedConfig.characterName,
    totalRollValue: totalRV,
    totalUsefulRolls,
    averageSlotRollValue,
    overallStatus,
    daysToNextUpgrade: weakestSlot ? weakestSlot.expectedDaysForUpgrade : 14,
    weakestSlot,
    slotBreakdown,
    curve,
    guaranteedAlternative,
    advice,
    erEvaluation,
    setComparison,
    roiComparison,
    domainRoute,
    activeSetsSummary: {
      active2pc: activeSets.active2pc,
      active4pc: activeSets.active4pc,
      totalEsr: setComparison.currentSetEsr,
    },
    universalStop,
    calibratedWeights,
    weightAdjustmentNotes,
    setBonusValidation,
    slotUpgradeRanking,
  };
}

/**
 * Performs complete universal stop-point & build intelligence analysis across all 5 slots
 * for any Genshin Impact character, set, or archetype up to v7.2.
 */
export function analyzeArtifactBuild(
  characterIdOrName: string,
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  teamContext?: TeamContext,
  options?: UniversalStopOptions,
  executionContext?: RecommendationExecutionContext,
): ArtifactStopAnalysisResult {
  const computed = computeArtifactBuildAnalysis(characterIdOrName, slots, teamContext, options);
  const reliability = evaluateEngineBoundaryReliability({
    mode: 'current',
    requiredDatasetIds: ARTIFACT_OPTIMIZER_REQUIRED_DATASETS,
    unattestedLocalDependencies: ARTIFACT_OPTIMIZER_UNATTESTED_DEPS,
    executionContext,
  });
  return { ...computed, reliability };
}

/**
 * @internal Synthesizes a simulated 5-piece build from slider stats without invoking
 * reliability evaluation. Used by `estimateBuildFromSliders` and by the `cv >= 170`
 * delegation branch of excluded legacy helper `calculateArtifactStopPoint` in
 * `src/engines/artifact-stop.ts` (whose `cv < 170` and EM/DEF early-return branches
 * use direct CV arithmetic without calling this helper).
 */
export function computeBuildEstimateFromSlidersInternal(
  characterName: string,
  critRate: number,
  critDmg: number,
  secondaryStatValue: number = 100,
  isReactionOrDefScaler: boolean = false,
  teamContext?: TeamContext,
  options?: UniversalStopOptions,
): ArtifactBuildComputation {
  const config = getCharacterStatWeights(characterName);
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';

  const safeCr = safeNonNeg(critRate, 0);
  const safeCd = safeNonNeg(critDmg, 0);
  const safeSec = safeNonNeg(secondaryStatValue, 0);

  const cv = Math.max(0, Math.round(safeCr * 2 + safeCd));
  const estimatedCvRolls = cv / 6.6;
  const secondaryRolls = safeSec / 22;

  const rawUsefulRolls =
    estimatedCvRolls +
    (isReactionOrDefScaler ? secondaryRolls * 1.1 : secondaryRolls * 0.35);
  const cappedUsefulRolls = clamp(rawUsefulRolls, 4, 36);
  const avgRollsPerPiece = cappedUsefulRolls / 5;

  const isCritRelevant =
    !isReactionOrDefScaler &&
    (config.statWeights.critRate_ ?? 0) > 0.3 &&
    (config.statWeights.critDMG_ ?? 0) > 0.3;

  let secKey: StatKey = 'atk_';
  if (config.statWeights.hp_ === 1.0) secKey = 'hp_';
  else if (config.statWeights.def_ === 1.0) secKey = 'def_';
  else if (config.statWeights.eleMas === 1.0) secKey = 'eleMas';
  else if ((config.statWeights.enerRech_ || 0) >= 0.7) secKey = 'enerRech_';

  const altKey: StatKey =
    config.statWeights.hp_ && secKey !== 'hp_'
      ? 'hp_'
      : (config.statWeights.enerRech_ || 0) >= 0.6 && secKey !== 'enerRech_'
        ? 'enerRech_'
        : (config.statWeights.atk_ || 0) >= 0.5 && secKey !== 'atk_'
          ? 'atk_'
          : 'def_';

  function buildMockPiece(
    slotKey: ArtifactSlot,
    mainStatKey: StatKey,
    setKey: string,
  ): ArtifactPiece {
    const substatKeys: StatKey[] = [];
    const usedKeys = new Set<StatKey>([mainStatKey]);

    if (isCritRelevant) {
      if (!usedKeys.has('critRate_')) {
        substatKeys.push('critRate_');
        usedKeys.add('critRate_');
      }
      if (!usedKeys.has('critDMG_')) {
        substatKeys.push('critDMG_');
        usedKeys.add('critDMG_');
      }
    }

    const chosenSec = !usedKeys.has(secKey)
      ? secKey
      : !usedKeys.has(altKey)
        ? altKey
        : 'enerRech_';
    if (!usedKeys.has(chosenSec)) {
      substatKeys.push(chosenSec);
      usedKeys.add(chosenSec);
    }

    const candidateFillers: StatKey[] = [
      'atk',
      'def',
      'hp',
      'atk_',
      'def_',
      'hp_',
      'eleMas',
      'enerRech_',
    ];
    for (const f of candidateFillers) {
      if (substatKeys.length >= 4) break;
      if (!usedKeys.has(f)) {
        substatKeys.push(f);
        usedKeys.add(f);
      }
    }

    const desiredBonus = clamp(Math.round(avgRollsPerPiece - 1), 0, 5);
    const bonus0 = Math.min(desiredBonus, 3);
    const remBonus = desiredBonus - bonus0;
    const bonus1 = Math.min(remBonus, 2);
    const fillerBonus = 5 - (bonus0 + bonus1);
    const bonus2 = Math.min(fillerBonus, 3);
    const bonus3 = fillerBonus - bonus2;

    const rollCounts = [1 + bonus0, 1 + bonus1, 1 + bonus2, 1 + bonus3];

    const substats = substatKeys.map((key, idx) => {
      const rolls = rollCounts[idx];
      const tiers = SUBSTAT_ROLL_TIERS[key] || [getMaxRollValue(key) * 0.9 || 5.0];
      const tierVal = tiers[2] ?? tiers[0] ?? 5.0;
      const rawSum = tierVal * rolls;
      const displayVal = ['hp', 'atk', 'def', 'eleMas'].includes(key)
        ? Math.round(rawSum)
        : Number(rawSum.toFixed(1));

      return { key, value: displayVal };
    });

    return {
      slotKey,
      setKey,
      rarity: 5,
      level: 20,
      mainStatKey,
      substats,
    };
  }

  const sandsMain = config.preferredMainStats?.sands?.[0] || 'atk_';
  const gobletMain = config.preferredMainStats?.goblet?.[0] || 'pyro_dmg_';
  const circletMain = config.preferredMainStats?.circlet?.[0] || 'critRate_';

  const mockSlots: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
    flower: buildMockPiece('flower', 'hp', targetSetName),
    plume: buildMockPiece('plume', 'atk', targetSetName),
    sands: buildMockPiece('sands', sandsMain, targetSetName),
    goblet: buildMockPiece('goblet', gobletMain, targetSetName),
    circlet: buildMockPiece('circlet', circletMain, "Gladiator's Finale"),
  };

  return computeArtifactBuildAnalysis(characterName, mockSlots, teamContext, options);
}

/**
 * Synthesizes a simulated 5-piece build from slider stats for rapid estimation.
 * Classified as `'sandbox_simulation'` because the 5-piece artifact set is synthesized
 * from user sliders rather than observed equipped pieces.
 */
export function estimateBuildFromSliders(
  characterName: string,
  critRate: number,
  critDmg: number,
  secondaryStatValue: number = 100,
  isReactionOrDefScaler: boolean = false,
  teamContext?: TeamContext,
  options?: UniversalStopOptions,
  executionContext?: RecommendationExecutionContext,
): ArtifactStopAnalysisResult {
  const computed = computeBuildEstimateFromSlidersInternal(
    characterName,
    critRate,
    critDmg,
    secondaryStatValue,
    isReactionOrDefScaler,
    teamContext,
    options,
  );
  const reliability = evaluateEngineBoundaryReliability({
    mode: 'sandbox_simulation',
    requiredDatasetIds: ARTIFACT_OPTIMIZER_REQUIRED_DATASETS,
    unattestedLocalDependencies: ARTIFACT_OPTIMIZER_UNATTESTED_DEPS,
    executionContext,
  });
  return { ...computed, reliability };
}
