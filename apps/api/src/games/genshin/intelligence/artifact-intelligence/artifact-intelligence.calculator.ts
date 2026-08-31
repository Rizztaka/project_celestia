// -------------------------------------------------------
// Constants
// -------------------------------------------------------

export const MAX_ROLLS: Record<string, number> = {
  critRate_: 3.9,
  critDMG_: 7.8,
  enerRech_: 6.5,
  eleMas: 23,
  hp_: 5.8,
  atk_: 5.8,
  def_: 7.3,
  hp: 298.75,
  atk: 19.45,
  def: 23.15,
};

const MAX_POSSIBLE_ROLLS = 6;
const MAIN_STAT_BONUS = 15;

// -------------------------------------------------------
// Types
// -------------------------------------------------------

export interface ArtifactSubStat {
  key: string;
  value: number;
}

export interface ArtifactInput {
  slotKey: string; // 'flower' | 'plume' | 'sands' | 'goblet' | 'circlet'
  mainStatKey: string;
  subStats: ArtifactSubStat[];
}

export interface ArtifactWeightProfile {
  subStatWeights: Record<string, number>;
  mainStatPriority: {
    sands: string[];
    goblet: string[];
    circlet: string[];
  };
}

export interface SlotScoreBreakdown {
  slotScore: number;
  weightedRolls: number;
  mainStatBonus: number;
}

export interface ArtifactScoreBreakdown {
  artifactEfficiencyScore: number;
  recommendationScore: number;
  slotScores: Record<string, SlotScoreBreakdown>;
}

// -------------------------------------------------------
// Public API
// -------------------------------------------------------

/**
 * Pure function: Scores a single artifact slot based on the character's weight profile.
 */
export function calculateSlotScore(
  artifact: ArtifactInput | null,
  profile: ArtifactWeightProfile,
): SlotScoreBreakdown {
  if (!artifact) {
    return { slotScore: 0, weightedRolls: 0, mainStatBonus: 0 };
  }

  // 1. Calculate Weighted Roll Value (wRV) for sub-stats
  let weightedRolls = 0;
  for (const sub of artifact.subStats) {
    const maxRoll = MAX_ROLLS[sub.key];
    const weight = profile.subStatWeights[sub.key] ?? 0;

    if (maxRoll && maxRoll > 0 && weight > 0) {
      weightedRolls += (sub.value / maxRoll) * weight;
    }
  }

  // 2. Check main stat bonus
  let mainStatBonus = 0;
  const isSandsMatch =
    artifact.slotKey === 'sands' && profile.mainStatPriority.sands.includes(artifact.mainStatKey);
  const isGobletMatch =
    artifact.slotKey === 'goblet' && profile.mainStatPriority.goblet.includes(artifact.mainStatKey);
  const isCircletMatch =
    artifact.slotKey === 'circlet' &&
    profile.mainStatPriority.circlet.includes(artifact.mainStatKey);

  if (isSandsMatch || isGobletMatch || isCircletMatch) {
    mainStatBonus = MAIN_STAT_BONUS;
  }

  // 3. Final slot score (clamped to 100)
  const rawScore = (weightedRolls / MAX_POSSIBLE_ROLLS) * 100 + mainStatBonus;
  const slotScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  return {
    slotScore,
    weightedRolls: Number(weightedRolls.toFixed(2)),
    mainStatBonus,
  };
}

/**
 * Pure function: Aggregates 5 artifact slot scores into a final Artifact Efficiency Score (AES).
 *
 * AES is the mean of all 5 slots. Missing slots score 0.
 * recommendationScore = 100 - AES.
 */
export function calculateArtifactScore(
  equippedArtifacts: ArtifactInput[],
  profile: ArtifactWeightProfile,
): ArtifactScoreBreakdown {
  const slotKeys = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
  const slotScores: Record<string, SlotScoreBreakdown> = {};
  let totalScore = 0;

  for (const slotKey of slotKeys) {
    const artifact = equippedArtifacts.find((a) => a.slotKey === slotKey) ?? null;
    const breakdown = calculateSlotScore(artifact, profile);
    slotScores[slotKey] = breakdown;
    totalScore += breakdown.slotScore;
  }

  const aes = Math.round(totalScore / 5);
  const recommendationScore = 100 - aes;

  return {
    artifactEfficiencyScore: aes,
    recommendationScore,
    slotScores,
  };
}
