import type {
  ArtifactPiece,
  ArtifactSlot,
  ArtifactStopAnalysisResult,
  CharacterStatWeightConfig,
  DiminishingReturnsPoint,
  GuaranteedAlternative,
  SlotUpgradeProbability,
} from '../types/genshin';
import {
  DOMAIN_CONSTANTS,
  MAX_SUBSTAT_VALUES,
  getCharacterStatWeights,
} from '../data/artifact-weights';

export const SLOT_NAMES: Record<ArtifactSlot, string> = {
  flower: 'Flower of Life',
  plume: 'Plume of Death',
  sands: 'Sands of Eon',
  goblet: 'Goblet of Eonothem',
  circlet: 'Circlet of Logos',
};

/**
 * Calculates raw and weighted roll values for a single artifact piece.
 */
export function calculatePieceRollValue(
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
): { rawRollValue: number; weightedRollValue: number; usefulRolls: number } {
  if (!piece || !piece.substats || piece.substats.length === 0) {
    return { rawRollValue: 0, weightedRollValue: 0, usefulRolls: 0 };
  }

  let rawRollValue = 0;
  let weightedRollValue = 0;

  for (const sub of piece.substats) {
    const maxVal = MAX_SUBSTAT_VALUES[sub.key] ?? 0;
    if (maxVal <= 0 || !sub.value) continue;

    const rawRoll = (sub.value / maxVal) * 100; // e.g. 100% = 1 max roll
    const weight = config.statWeights[sub.key] ?? 0;

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
 * Returns estimated base drop chance for a usable candidate piece for this slot.
 */
function getBaseSlotCandidateDropRate(
  slot: ArtifactSlot,
  config: CharacterStatWeightConfig,
): number {
  const { FIVE_STAR_PER_RUN, TARGET_SET_CHANCE, SLOT_CHANCE } = DOMAIN_CONSTANTS;
  const baseChance = FIVE_STAR_PER_RUN * TARGET_SET_CHANCE * SLOT_CHANCE; // ~0.1065

  switch (slot) {
    case 'flower':
    case 'plume':
      return baseChance; // Main stat is guaranteed (HP or ATK)
    case 'sands': {
      // Check preferred main stats
      const preferred = config.preferredMainStats.sands;
      let weight = 0;
      if (preferred.includes('atk_')) weight += 0.2666;
      if (preferred.includes('hp_')) weight += 0.2668;
      if (preferred.includes('def_')) weight += 0.2666;
      if (preferred.includes('enerRech_')) weight += 0.1;
      if (preferred.includes('eleMas')) weight += 0.1;
      return baseChance * (weight || 0.2666);
    }
    case 'goblet': {
      // Elemental goblet is ~5% each.
      const preferred = config.preferredMainStats.goblet;
      let weight = 0;
      for (const p of preferred) {
        if (p.includes('dmg_')) weight += 0.05;
        else if (p === 'eleMas') weight += 0.025;
        else if (p === 'atk_' || p === 'hp_') weight += 0.1925;
      }
      return baseChance * (weight || 0.05);
    }
    case 'circlet': {
      const preferred = config.preferredMainStats.circlet;
      let weight = 0;
      if (preferred.includes('critRate_')) weight += 0.1;
      if (preferred.includes('critDMG_')) weight += 0.1;
      if (preferred.includes('heal_')) weight += 0.1;
      if (preferred.includes('eleMas')) weight += 0.04;
      if (preferred.includes('hp_')) weight += 0.22;
      return baseChance * (weight || 0.2);
    }
  }
}

/**
 * Probability that a dropped candidate piece rolls substats exceeding target RV.
 * Calibrated against standard 5-star artifact substat distributions.
 */
function getSubstatUpgradeProbability(targetRV: number): number {
  if (targetRV <= 0) return 0.98;
  if (targetRV <= 120) return 0.88;
  if (targetRV <= 220) return 0.62;
  if (targetRV <= 320) return 0.32;
  if (targetRV <= 420) return 0.11;
  if (targetRV <= 520) return 0.028;
  if (targetRV <= 620) return 0.0055;
  if (targetRV <= 720) return 0.00065;
  return 0.00008;
}

/**
 * Calculates per-slot upgrade probability and expected runs/days of resin.
 */
export function calculateSlotUpgradeProbability(
  slot: ArtifactSlot,
  piece: ArtifactPiece | null,
  config: CharacterStatWeightConfig,
): SlotUpgradeProbability {
  const { weightedRollValue, usefulRolls } = calculatePieceRollValue(piece, config);
  const baseDropRate = getBaseSlotCandidateDropRate(slot, config);
  const substatUpgradeChance = getSubstatUpgradeProbability(weightedRollValue);

  // Upgrade probability per single 20-resin domain run
  const upgradeProbabilityPerRun = Math.max(0.00001, baseDropRate * substatUpgradeChance);

  // Runs needed for 50% chance of at least 1 upgrade: 1 - (1 - p)^N = 0.5 => N = ln(0.5)/ln(1-p)
  const expectedRunsForUpgrade = Math.max(
    1,
    Math.round(Math.log(0.5) / Math.log(1 - upgradeProbabilityPerRun)),
  );
  const expectedDaysForUpgrade = Number(
    (expectedRunsForUpgrade / DOMAIN_CONSTANTS.RUNS_PER_DAY).toFixed(1),
  );

  let status: 'Near Ceiling' | 'Diminishing Returns' | 'High ROI';
  let recommendation: string;

  if (weightedRollValue >= 580 || expectedDaysForUpgrade >= 22) {
    status = 'Near Ceiling';
    recommendation = `This ${SLOT_NAMES[slot]} is near theoretical ceiling (${weightedRollValue}% RV). Upgrading it has a 1-in-${expectedRunsForUpgrade} run probability (~${expectedDaysForUpgrade} days of resin). DO NOT farm this slot.`;
  } else if (weightedRollValue >= 360 || expectedDaysForUpgrade >= 9) {
    status = 'Diminishing Returns';
    recommendation = `Solid piece (${weightedRollValue}% RV). Upgrades take ~${expectedDaysForUpgrade} days (${expectedRunsForUpgrade} runs). Farm other pieces or talents first.`;
  } else {
    status = 'High ROI';
    recommendation = `High potential upgrade (${weightedRollValue}% RV). You have a solid 50% chance of finding an upgrade within ~${expectedDaysForUpgrade} days of farming (${expectedRunsForUpgrade} runs).`;
  }

  return {
    slotKey: slot,
    slotName: SLOT_NAMES[slot],
    currentPiece: piece,
    currentRollValue: weightedRollValue,
    currentUsefulRolls: usefulRolls,
    upgradeProbabilityPerRun,
    expectedRunsForUpgrade,
    expectedDaysForUpgrade,
    status,
    recommendation,
  };
}

/**
 * Generates data points plotting Days of Resin vs Probability of Upgrade.
 * P(t) = 1 - (1 - p)^(9 * t)
 */
export function generateDiminishingReturnsCurve(
  pPerRun: number,
  maxDays: number = 60,
): DiminishingReturnsPoint[] {
  const points: DiminishingReturnsPoint[] = [];
  const safeP = Math.min(0.999, Math.max(0.00001, pPerRun));

  for (let day = 1; day <= maxDays; day++) {
    const runs = day * DOMAIN_CONSTANTS.RUNS_PER_DAY;
    const probability = 1 - Math.pow(1 - safeP, runs);
    points.push({
      days: day,
      resin: day * DOMAIN_CONSTANTS.DAILY_RESIN,
      probability: Math.min(0.999, Math.max(0, Number(probability.toFixed(4)))),
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

  // Sort by highest upgrade probability per run (lowest expected runs)
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
      title: `${characterName} Talent Level 8 → 9`,
      costResin: 260,
      daysResin: 1.4,
      guaranteedGain: '+6.2% Damage',
      description: `Guaranteed multiplier increase with zero RNG. 260 Resin in Talent Domain + Weekly Boss gives an immediate DPS jump without wasting weeks on 0.5% artifact drops.`,
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
 * Extracts and maps 5-slot equipped artifacts for a character from imported raw GOOD data.
 */
export function extractEquippedArtifactsForCharacter(
  rawArtifacts: any[],
  characterId: string,
): Partial<Record<ArtifactSlot, ArtifactPiece>> {
  const result: Partial<Record<ArtifactSlot, ArtifactPiece>> = {};
  if (!Array.isArray(rawArtifacts)) return result;

  const charNorm = characterId.replace(/[\s\-_]/g, '').toLowerCase();

  for (const art of rawArtifacts) {
    if (!art || !art.location) continue;
    const locNorm = String(art.location).replace(/[\s\-_]/g, '').toLowerCase();
    if (locNorm === charNorm) {
      const slot = String(art.slotKey).toLowerCase() as ArtifactSlot;
      if (['flower', 'plume', 'sands', 'goblet', 'circlet'].includes(slot)) {
        result[slot] = {
          slotKey: slot,
          setKey: art.setKey,
          rarity: Number(art.rarity) || 5,
          level: Number(art.level) || 20,
          mainStatKey: art.mainStatKey,
          substats: Array.isArray(art.substats)
            ? art.substats
                .filter((s: any) => s && s.key && s.value)
                .map((s: any) => ({
                  key: s.key,
                  value: Number(s.value),
                }))
            : [],
          location: art.location,
        };
      }
    }
  }
  return result;
}

/**
 * Performs complete stop-point analysis across all 5 slots.
 */
export function analyzeArtifactBuild(
  characterIdOrName: string,
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
): ArtifactStopAnalysisResult {
  const config = getCharacterStatWeights(characterIdOrName);
  const slotKeys: ArtifactSlot[] = ['flower', 'plume', 'sands', 'goblet', 'circlet'];

  const slotBreakdown: Record<ArtifactSlot, SlotUpgradeProbability> = {} as any;
  let totalRV = 0;
  let totalUsefulRolls = 0;

  for (const slot of slotKeys) {
    const piece = slots[slot] ?? null;
    const analysis = calculateSlotUpgradeProbability(slot, piece, config);
    slotBreakdown[slot] = analysis;
    totalRV += analysis.currentRollValue;
    totalUsefulRolls += analysis.currentUsefulRolls;
  }

  const averageSlotRollValue = Math.round(totalRV / 5);
  const weakestSlot = findWeakestSlot(slotBreakdown);

  // Overall combined upgrade probability in domain (chance that a run upgrades AT LEAST ONE slot)
  // P(upgrade any) = 1 - product(1 - p_slot)
  let pNoUpgrade = 1.0;
  for (const slot of slotKeys) {
    pNoUpgrade *= 1 - slotBreakdown[slot].upgradeProbabilityPerRun;
  }
  const overallUpgradePPerRun = Math.max(0.0001, 1 - pNoUpgrade);

  const curve = generateDiminishingReturnsCurve(overallUpgradePPerRun, 60);

  let overallStatus: 'Ready / Stop Farming' | 'High ROI' | 'Diminishing Returns';
  let advice: string;

  if (totalRV >= 2700 || averageSlotRollValue >= 540) {
    overallStatus = 'Ready / Stop Farming';
    advice = `Elite Top 1% build (${totalRV}% total Roll Value, ~${totalUsefulRolls.toFixed(1)} useful rolls). Finding an upgrade across the entire domain now has < 0.8% odds per run (~${weakestSlot?.expectedDaysForUpgrade ?? 30}+ days of resin). STOP farming this domain.`;
  } else if (totalRV >= 2100 || averageSlotRollValue >= 420) {
    overallStatus = 'Diminishing Returns';
    advice = `High investment build (${totalRV}% total Roll Value, ~${totalUsefulRolls.toFixed(1)} useful rolls). Any further piece upgrade will take ~${weakestSlot?.expectedDaysForUpgrade ?? 14} days of daily resin. Consider leveling talents, weapons, or supports.`;
  } else {
    overallStatus = 'High ROI';
    advice = `Early to mid build (${totalRV}% total Roll Value). Upgrading your ${weakestSlot?.slotName ?? 'weakest slot'} is very likely within ~${weakestSlot?.expectedDaysForUpgrade ?? 4} days of farming. Keep farming your 4pc set.`;
  }

  const guaranteedAlternative = getGuaranteedAlternative(config.characterName, overallStatus);

  return {
    characterId: config.characterId,
    characterName: config.characterName,
    totalRollValue: totalRV,
    totalUsefulRolls: Number(totalUsefulRolls.toFixed(2)),
    averageSlotRollValue,
    overallStatus,
    daysToNextUpgrade: weakestSlot ? weakestSlot.expectedDaysForUpgrade : 14,
    weakestSlot,
    slotBreakdown,
    curve,
    guaranteedAlternative,
    advice,
  };
}

/**
 * Synthesizes a simulated 5-piece build from slider stats for rapid estimation.
 */
export function estimateBuildFromSliders(
  characterName: string,
  critRate: number,
  critDmg: number,
  secondaryStatValue: number = 100, // EM, HP%, DEF%, or ER
  isReactionOrDefScaler: boolean = false,
): ArtifactStopAnalysisResult {
  const config = getCharacterStatWeights(characterName);

  // Total CV from artifacts
  const cv = Math.round(critRate * 2 + critDmg);
  // Estimate rolls: 1 roll of CV is ~6.6 CV.
  const estimatedCvRolls = cv / 6.6;
  const secondaryRolls = secondaryStatValue / 20;

  // Total rolls distributed over 5 pieces
  const totalRolls = estimatedCvRolls + (isReactionOrDefScaler ? secondaryRolls * 1.2 : secondaryRolls * 0.4);
  const avgRollsPerPiece = totalRolls / 5;

  const mockSlots: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
    flower: {
      slotKey: 'flower',
      rarity: 5,
      level: 20,
      mainStatKey: 'hp',
      substats: [
        { key: 'critRate_', value: Number(((avgRollsPerPiece * 0.4) * 3.89).toFixed(1)) },
        { key: 'critDMG_', value: Number(((avgRollsPerPiece * 0.6) * 7.77).toFixed(1)) },
      ],
    },
    plume: {
      slotKey: 'plume',
      rarity: 5,
      level: 20,
      mainStatKey: 'atk',
      substats: [
        { key: 'critRate_', value: Number(((avgRollsPerPiece * 0.45) * 3.89).toFixed(1)) },
        { key: 'critDMG_', value: Number(((avgRollsPerPiece * 0.55) * 7.77).toFixed(1)) },
      ],
    },
    sands: {
      slotKey: 'sands',
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.sands[0] || 'atk_',
      substats: [
        { key: 'critRate_', value: Number(((avgRollsPerPiece * 0.35) * 3.89).toFixed(1)) },
        { key: 'critDMG_', value: Number(((avgRollsPerPiece * 0.45) * 7.77).toFixed(1)) },
      ],
    },
    goblet: {
      slotKey: 'goblet',
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.goblet[0] || 'pyro_dmg_',
      substats: [
        { key: 'critRate_', value: Number(((avgRollsPerPiece * 0.3) * 3.89).toFixed(1)) },
        { key: 'critDMG_', value: Number(((avgRollsPerPiece * 0.4) * 7.77).toFixed(1)) },
      ],
    },
    circlet: {
      slotKey: 'circlet',
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.circlet[0] || 'critRate_',
      substats: [
        { key: 'critDMG_', value: Number(((avgRollsPerPiece * 0.5) * 7.77).toFixed(1)) },
        { key: 'atk_', value: 10 },
      ],
    },
  };

  return analyzeArtifactBuild(config.characterId, mockSlots);
}
