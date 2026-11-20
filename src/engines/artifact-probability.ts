import type {
  ArtifactPiece,
  ArtifactSlot,
  ArtifactStopAnalysisResult,
  CharacterStatWeightConfig,
  DiminishingReturnsPoint,
  DomainRouteRecommendation,
  GuaranteedAlternative,
  RoiComparison,
  RoiMilestoneComparison,
  SetComparisonResult,
  SetOptionComparison,
  SlotUpgradeProbability,
  StatKey,
  TeamContext,
  WholeBuildErEvaluation,
} from '../types/genshin';
import {
  DOMAIN_CONSTANTS,
  DOMAIN_PAIRS_REGISTRY,
  MAX_SUBSTAT_VALUES,
  STRONGBOX_SETS_SET,
  getCharacterStatWeights,
} from '../data/artifact-weights';
import {
  calculateSetEquivalentSubstatRolls,
  parseActiveSetBonuses,
} from '../data/artifact-set-effects';

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
    sub.rollValue = Math.round(rawRoll);
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
      const preferred = config.preferredMainStats?.sands ?? [];
      let weight = 0;
      if (preferred.includes('atk_')) weight += 0.2666;
      if (preferred.includes('hp_')) weight += 0.2668;
      if (preferred.includes('def_')) weight += 0.2666;
      if (preferred.includes('enerRech_')) weight += 0.1;
      if (preferred.includes('eleMas')) weight += 0.1;
      return baseChance * (weight || 0.2666);
    }
    case 'goblet': {
      const preferred = config.preferredMainStats?.goblet ?? [];
      let weight = 0;
      for (const p of preferred) {
        if (p.includes('dmg_')) weight += 0.05;
        else if (p === 'eleMas') weight += 0.025;
        else if (p === 'atk_' || p === 'hp_' || p === 'def_') weight += 0.1925;
      }
      return baseChance * (weight || 0.05);
    }
    case 'circlet': {
      const preferred = config.preferredMainStats?.circlet ?? [];
      let weight = 0;
      if (preferred.includes('critRate_')) weight += 0.1;
      if (preferred.includes('critDMG_')) weight += 0.1;
      if (preferred.includes('heal_')) weight += 0.1;
      if (preferred.includes('eleMas')) weight += 0.04;
      if (preferred.includes('hp_')) weight += 0.22;
      if (preferred.includes('atk_')) weight += 0.22;
      if (preferred.includes('def_')) weight += 0.22;
      return baseChance * (weight || 0.2);
    }
  }
}

/**
 * Probability that a dropped candidate piece rolls substats exceeding target RV.
 * Calibrated against standard 5-star artifact substat distributions using a
 * continuous logistic decay curve.
 */
export function getSubstatUpgradeProbability(targetRV: number): number {
  if (targetRV <= 0) return 0.99;
  const z = (targetRV - 320) / 110;
  const p = 1 / (1 + Math.exp(1.8 * z));
  return Math.max(0.00005, Math.min(0.99, Number(p.toFixed(5))));
}

/**
 * Calculates per-slot upgrade probability and dual expected runs (median 50% milestone vs mean 1/p).
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
  const rawP = baseDropRate * substatUpgradeChance;
  const upgradeProbabilityPerRun =
    !rawP || isNaN(rawP) ? 0.00001 : Math.min(0.999, Math.max(0.00001, rawP));

  // Runs needed for 50% chance of at least 1 upgrade: 1 - (1 - p)^N = 0.5 => N = ln(0.5)/ln(1-p)
  const logDenominator = Math.log(1 - upgradeProbabilityPerRun);
  const medianRunsForUpgrade =
    !logDenominator || isNaN(logDenominator) || logDenominator === 0
      ? 1
      : Math.max(1, Math.ceil(Math.log(0.5) / logDenominator));

  // Mathematical expectation E[X] = 1/p
  const meanExpectedRuns =
    upgradeProbabilityPerRun > 0
      ? Math.min(100000, Math.ceil(1 / upgradeProbabilityPerRun))
      : 100000;

  const expectedRunsForUpgrade = medianRunsForUpgrade;
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
    medianRunsForUpgrade,
    meanExpectedRuns,
    expectedDaysForUpgrade,
    status,
    recommendation,
  };
}

/**
 * Generates data points plotting Days of Resin vs Probability of Upgrade.
 */
export function generateDiminishingReturnsCurve(
  pPerRun: number,
  maxDays: number = 60,
): DiminishingReturnsPoint[] {
  const points: DiminishingReturnsPoint[] = [];
  const safeP = !pPerRun || isNaN(pPerRun) ? 0.00001 : Math.min(0.999, Math.max(0.00001, pPerRun));

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
 * Evaluates Whole-Build ER sufficiency using the canonical Three-Zone Model:
 * 1. Deficit (< Target - 15%): Triggers score penalty factor and severe warning
 * 2. Target window ([Target - 15%, Target + 10%]): Full 1.0x score factor
 * 3. Surplus (> Target + 10%): Overcap warning (diminishing return on extra ER)
 */
export function evaluateWholeBuildEr(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  targetEr: number = 130,
  active2pcSets: string[] = [],
  baseEr: number = 100,
  weaponEr: number = 0,
  ascensionEr: number = 0,
): WholeBuildErEvaluation {
  let totalEr = baseEr + weaponEr + ascensionEr;

  // Sands main stat
  if (slots.sands?.mainStatKey === 'enerRech_') {
    totalEr += 51.8;
  }

  // 2pc set bonuses that give ER
  for (const set of active2pcSets) {
    if (
      set === 'Emblem of Severed Fate' ||
      set === 'The Exile' ||
      set === "Silken Moon's Serenade" ||
      set === 'Scholar'
    ) {
      totalEr += 20;
    }
  }

  // Substats
  for (const piece of Object.values(slots)) {
    if (!piece || !piece.substats) continue;
    for (const sub of piece.substats) {
      if (sub.key === 'enerRech_') {
        totalEr += sub.value || 0;
      }
    }
  }

  totalEr = Number(totalEr.toFixed(1));
  const diff = Number((totalEr - targetEr).toFixed(1));

  let status: 'Deficit' | 'Target' | 'Overcap';
  let penaltyFactor = 1.0;
  let message = '';

  if (totalEr < targetEr - 15) {
    status = 'Deficit';
    penaltyFactor = Math.max(0.4, Number((totalEr / targetEr).toFixed(2)));
    message = `Severe ER Deficit! Build has ${totalEr}% ER vs required ${targetEr}%. Elemental Bursts will not be ready on cooldown, reducing real DPS by ${Math.round((1 - penaltyFactor) * 100)}%. Prioritize ER rolls or ER Sands!`;
  } else if (totalEr > targetEr + 20) {
    status = 'Overcap';
    penaltyFactor = 1.0;
    message = `ER Surplus (+${diff}% over ${targetEr}% target). Extra ER substats have diminished value unless running 4pc Emblem of Severed Fate.`;
  } else {
    status = 'Target';
    penaltyFactor = 1.0;
    message = `Optimal ER Target reached (${totalEr}% / ${targetEr}%). Burst will reliably recharge every team rotation.`;
  }

  return {
    totalEr,
    targetEr,
    status,
    penaltyFactor,
    erDifference: diff,
    message,
  };
}

/**
 * Dynamically adjusts stat weights to account for external Team Context and buff dilution.
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

  const isBennettActive =
    context.preset === 'hypercarry_bennett_furina' ||
    context.hasBennett ||
    (context.customFlatAtkBuff !== undefined && context.customFlatAtkBuff >= 800);

  const isFurinaActive =
    context.preset === 'hypercarry_bennett_furina' ||
    context.hasFurina ||
    (context.customDmgBonus !== undefined && context.customDmgBonus >= 50);

  const isAmplifyingActive =
    context.preset === 'vape_melt' || context.hasAmplifyingReaction;

  const isQuickenActive =
    context.preset === 'quicken_spread' || context.hasQuickenReaction;

  // 1. Flat ATK Dilution (Bennett / Sara massive flat ATK buffs dilute ATK% value by ~35%)
  if (isBennettActive && statWeights.atk_ !== undefined) {
    statWeights.atk_ = Number(
      Math.max(0.15, statWeights.atk_ * 0.65).toFixed(2),
    );
  }

  // 2. Reaction EM Boost
  if (isAmplifyingActive && statWeights.eleMas !== undefined) {
    statWeights.eleMas = Number(
      Math.min(1.0, Math.max(0.85, statWeights.eleMas * 1.35)).toFixed(2),
    );
  } else if (isQuickenActive && statWeights.eleMas !== undefined) {
    statWeights.eleMas = Number(
      Math.min(1.0, Math.max(0.75, statWeights.eleMas * 1.25)).toFixed(2),
    );
  }

  // 3. Furina Fanfare DMG% Dilution: elevates HP% and ATK% goblet viability
  const preferredGoblet = [...config.preferredMainStats.goblet];
  if (isFurinaActive) {
    if (config.statWeights.hp_ && !preferredGoblet.includes('hp_')) {
      preferredGoblet.push('hp_');
    }
    if (config.statWeights.atk_ && !preferredGoblet.includes('atk_')) {
      preferredGoblet.push('atk_');
    }
  }

  return {
    ...config,
    preferredMainStats: {
      ...config.preferredMainStats,
      goblet: preferredGoblet,
    },
    statWeights,
  };
}

/**
 * Compares currently equipped artifact sets against theoretical 4pc BiS, 2pc/2pc, and Rainbow sets.
 */
export function compareSetConfigurations(
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  characterIdOrName: string,
  _context?: TeamContext,
  totalEr: number = 100,
): SetComparisonResult {
  const config = getCharacterStatWeights(characterIdOrName);
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';

  // 1. Current active sets
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
  );

  // 2. Theoretical 4pc BiS
  const theoretical4pc = calculateSetEquivalentSubstatRolls(
    [{ setKey: targetSetName, pieces: 4 }],
    config.characterId,
    totalEr,
  );

  // 3. Theoretical 2pc+2pc hybrid
  const secondSet = config.targetSets?.[1] || "Gladiator's Finale";
  const theoretical2pc2pc = calculateSetEquivalentSubstatRolls(
    [
      { setKey: targetSetName, pieces: 2 },
      { setKey: secondSet, pieces: 2 },
    ],
    config.characterId,
    totalEr,
  );

  const deltaToBiS = Number(
    (theoretical4pc.totalEsr - currentEsr.totalEsr).toFixed(1),
  );
  const breakEven2pc = Number(
    (theoretical4pc.totalEsr - theoretical2pc2pc.totalEsr).toFixed(1),
  );

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
      description: `A 2pc/2pc hybrid needs +${breakEven2pc} additional useful substat rolls to equal the 4pc set.`,
    },
    {
      name: 'Rainbow / Off-Piece Broken Set',
      type: 'Rainbow',
      esr: 0,
      breakEvenRollDelta: theoretical4pc.totalEsr,
      description: `Rainbow pieces have 0 set bonus ESR and require +${theoretical4pc.totalEsr} extra god-tier substat rolls to compete with 4pc BiS.`,
    },
  ];

  let verdict = '';
  if (active.active4pc.includes(targetSetName)) {
    verdict = `4pc ${targetSetName} BiS active (+${theoretical4pc.totalEsr} ESR). Focus on optimizing individual piece roll quality.`;
  } else if (active.active4pc.length > 0) {
    verdict = `Equipped with 4pc ${active.active4pc[0]} (+${currentEsr.totalEsr} ESR). Target BiS is 4pc ${targetSetName} (+${deltaToBiS} roll advantage).`;
  } else if (active.active2pc.length >= 2) {
    verdict = `2pc/2pc hybrid active (+${currentEsr.totalEsr} ESR). You need +${deltaToBiS} higher substat rolls on this build to match 4pc ${targetSetName}.`;
  } else {
    verdict = `Rainbow build (+${currentEsr.totalEsr} ESR). Equipping 4pc ${targetSetName} would immediately gain +${deltaToBiS} equivalent substat rolls!`;
  }

  return {
    currentSetEsr: currentEsr.totalEsr,
    activeSets: active.active4pc.length > 0 ? active.active4pc : active.active2pc,
    options,
    breakEvenRollDelta: Math.max(0, deltaToBiS),
    verdict,
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
): RoiComparison {
  const marginalDpsPerRoll = Number(
    Math.max(1.8, Math.min(3.8, 80 / (currentUsefulRolls + 12))).toFixed(2),
  );

  const expectedResinToUpgrade = Math.max(20, weakestSlotExpectedRuns * 20);
  const resinPerOnePctArtifactDps = Math.round(
    expectedResinToUpgrade / marginalDpsPerRoll,
  );

  const milestones: RoiMilestoneComparison[] = [
    {
      name: 'Talent Level 8 → 9/10 (Guaranteed)',
      costResin: 260,
      expectedDpsGainPct: 5.5,
      resinPerOnePctDps: 47,
      isGuaranteed: true,
      efficiencyRatioVsArtifacts: Number(
        (resinPerOnePctArtifactDps / 47).toFixed(1),
      ),
    },
    {
      name: 'Weapon Level 80 → 90 (Guaranteed)',
      costResin: 220,
      expectedDpsGainPct: 4.8,
      resinPerOnePctDps: 46,
      isGuaranteed: true,
      efficiencyRatioVsArtifacts: Number(
        (resinPerOnePctArtifactDps / 46).toFixed(1),
      ),
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
        (
          resinPerOnePctArtifactDps /
          (isReactionOrHpDefScaler ? 21 : 120)
        ).toFixed(1),
      ),
    },
  ];

  let decision: 'Stop Farming' | 'Continue Farming' | 'Switch to Guaranteed Upgrades';
  let summaryBanner = '';

  if (resinPerOnePctArtifactDps >= 800 || currentUsefulRolls >= 28) {
    decision = 'Stop Farming';
    const topRatio = Math.max(
      ...milestones.map((m) => m.efficiencyRatioVsArtifacts),
    );
    summaryBanner = `STOP FARMING THIS DOMAIN. Expected cost is ~${resinPerOnePctArtifactDps.toLocaleString()} resin per 1% DPS gain. Your resin is ${topRatio}x more effective on guaranteed upgrades (Talents & Weapons).`;
  } else if (resinPerOnePctArtifactDps >= 350 || currentUsefulRolls >= 22) {
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
 * Smart Strongbox and domain pairing routing advisor.
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
        ? `${targetSetName} is available in Mystic Offering. Craft pieces using domain trash from universal domains.`
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
    guidance = `Domain partner (${companionSet}) is a resin trap with low account value. DO NOT farm ${domain.domainName}! Farm universal domains (Denouement of Sin / Spire of Solitary Enlightenment) and recycle fodder 3:1 into Mystic Offering for ${targetSetName}.`;
  } else if (companionValue === 'High') {
    recommendedAction = 'Farm Domain';
    guidance = `Both ${targetSetName} and ${companionSet} are elite sets. Farming ${domain.domainName} provides 100% resin efficiency!`;
  } else {
    recommendedAction = isStrongboxEligible ? 'Neutral' : 'Farm Domain';
    guidance = isStrongboxEligible
      ? `${targetSetName} is in Strongbox. You can farm ${domain.domainName} or recycle fodder.`
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
  if (!Array.isArray(rawArtifacts)) return result;

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
                    !isNaN(Number(s.value)) &&
                    Number(s.value) > 0,
                )
                .map((s: any) => {
                  const numVal = Number(s.value);
                  const maxVal = MAX_SUBSTAT_VALUES[s.key as StatKey] ?? 0;
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
 * Performs complete stop-point and build intelligence analysis across all 5 slots.
 */
export function analyzeArtifactBuild(
  characterIdOrName: string,
  slots: Partial<Record<ArtifactSlot, ArtifactPiece | null>>,
  teamContext?: TeamContext,
): ArtifactStopAnalysisResult {
  const baseConfig = getCharacterStatWeights(characterIdOrName);
  const config = adjustWeightsForTeamContext(baseConfig, teamContext);
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
  let pNoUpgrade = 1.0;
  for (const slot of slotKeys) {
    pNoUpgrade *= 1 - slotBreakdown[slot].upgradeProbabilityPerRun;
  }
  const overallUpgradePPerRun = Math.max(0.0001, 1 - pNoUpgrade);
  const curve = generateDiminishingReturnsCurve(overallUpgradePPerRun, 60);

  // Set bonuses and active sets
  const pieceSetKeys = Object.values(slots)
    .filter((p): p is ArtifactPiece => !!p && !!p.setKey)
    .map((p) => p.setKey!);
  const activeSets = parseActiveSetBonuses(pieceSetKeys);

  // Whole-Build ER evaluation
  const erEvaluation = evaluateWholeBuildEr(
    slots,
    config.erRequirement || 130,
    activeSets.active2pc,
  );

  // Apply ER deficit penalty if rotations fail
  if (erEvaluation.status === 'Deficit') {
    totalRV = Math.round(totalRV * erEvaluation.penaltyFactor);
    totalUsefulRolls = Number(
      (totalUsefulRolls * erEvaluation.penaltyFactor).toFixed(2),
    );
  }

  // Set comparison
  const setComparison = compareSetConfigurations(
    slots,
    characterIdOrName,
    teamContext,
    erEvaluation.totalEr,
  );

  // Domain routing
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';
  const domainRoute = evaluateDomainRoute(targetSetName);

  // ROI evaluation
  const isReactionOrHpDef =
    config.statWeights.hp_ === 1.0 ||
    config.statWeights.def_ === 1.0 ||
    config.statWeights.eleMas === 1.0;

  const roiComparison = evaluateRoiAgainstGuaranteedUpgrades(
    config.characterName,
    totalUsefulRolls,
    weakestSlot?.expectedRunsForUpgrade || 20,
    isReactionOrHpDef,
  );

  let overallStatus: 'Ready / Stop Farming' | 'High ROI' | 'Diminishing Returns';
  let advice: string;

  if (totalRV >= 2700 || averageSlotRollValue >= 540) {
    overallStatus = 'Ready / Stop Farming';
    advice = `Elite Top 1% build (${totalRV}% total RV, ~${totalUsefulRolls.toFixed(1)} useful rolls). Upgrade probability is < 0.8% per run (~${weakestSlot?.expectedDaysForUpgrade ?? 30}+ days of resin). STOP farming this domain.`;
  } else if (totalRV >= 2100 || averageSlotRollValue >= 420) {
    overallStatus = 'Diminishing Returns';
    advice = `High investment build (${totalRV}% total RV, ~${totalUsefulRolls.toFixed(1)} useful rolls). Upgrades will take ~${weakestSlot?.expectedDaysForUpgrade ?? 14} days of resin. Consider guaranteed upgrades.`;
  } else {
    overallStatus = 'High ROI';
    advice = `Early to mid build (${totalRV}% total RV). Upgrading ${weakestSlot?.slotName ?? 'weakest slot'} is likely within ~${weakestSlot?.expectedDaysForUpgrade ?? 4} days. Keep farming.`;
  }

  if (erEvaluation.status === 'Deficit') {
    advice = `⚠️ ER DEFICIT WARNING: ${erEvaluation.message} ` + advice;
  }

  const guaranteedAlternative = getGuaranteedAlternative(
    config.characterName,
    overallStatus,
  );

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
    erEvaluation,
    setComparison,
    roiComparison,
    domainRoute,
    activeSetsSummary: {
      active2pc: activeSets.active2pc,
      active4pc: activeSets.active4pc,
      totalEsr: setComparison.currentSetEsr,
    },
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
  teamContext?: TeamContext,
): ArtifactStopAnalysisResult {
  const config = getCharacterStatWeights(characterName);
  const targetSetName = config.targetSets?.[0] || 'Emblem of Severed Fate';

  // Total CV from artifacts
  const cv = Math.max(0, Math.round(critRate * 2 + critDmg));
  const estimatedCvRolls = cv / 6.6;
  const secondaryRolls = secondaryStatValue / 22;

  // Capped at 36 useful rolls max for 5 pieces (realistic game limit)
  const rawUsefulRolls =
    estimatedCvRolls +
    (isReactionOrDefScaler ? secondaryRolls * 1.1 : secondaryRolls * 0.35);
  const cappedUsefulRolls = Math.max(4, Math.min(36, rawUsefulRolls));
  const avgRollsPerPiece = cappedUsefulRolls / 5;

  // Determine whether this character prioritizes Crit or pure stat scaling
  const isCritRelevant =
    !isReactionOrDefScaler &&
    (config.statWeights.critRate_ ?? 0) > 0.3 &&
    (config.statWeights.critDMG_ ?? 0) > 0.3;

  let crRollsPerPiece = 0;
  let cdRollsPerPiece = 0;
  let secRollsPerPiece = 0;

  if (isCritRelevant) {
    crRollsPerPiece = Math.min(3.0, avgRollsPerPiece * 0.4);
    cdRollsPerPiece = Math.min(3.5, avgRollsPerPiece * 0.5);
    secRollsPerPiece = Math.max(
      0,
      Math.min(3.0, avgRollsPerPiece - (crRollsPerPiece + cdRollsPerPiece)),
    );
  } else {
    // Pure stat / reaction scalers (Kuki, Nilou, Kokomi, Gorou support)
    crRollsPerPiece = 0;
    cdRollsPerPiece = 0;
    secRollsPerPiece = Math.min(6.0, avgRollsPerPiece);
  }

  // Determine secondary stat key based on character kit
  let secKey: StatKey = 'atk_';
  let secBase = 5.83;
  if (config.statWeights.hp_ === 1.0) {
    secKey = 'hp_';
    secBase = 5.83;
  } else if (config.statWeights.def_ === 1.0) {
    secKey = 'def_';
    secBase = 7.29;
  } else if (config.statWeights.eleMas === 1.0) {
    secKey = 'eleMas';
    secBase = 23.31;
  } else if ((config.statWeights.enerRech_ || 0) >= 0.7) {
    secKey = 'enerRech_';
    secBase = 6.48;
  }

  // Fallback alternative useful stat when main stat conflicts with secKey
  const altKey: StatKey =
    config.statWeights.hp_ && secKey !== 'hp_'
      ? 'hp_'
      : (config.statWeights.enerRech_ || 0) >= 0.6 && secKey !== 'enerRech_'
        ? 'enerRech_'
        : (config.statWeights.atk_ || 0) >= 0.5 && secKey !== 'atk_'
          ? 'atk_'
          : 'def_';

  const secValue = Number((secRollsPerPiece * secBase).toFixed(1));

  const mockSlots: Partial<Record<ArtifactSlot, ArtifactPiece>> = {
    flower: {
      slotKey: 'flower',
      setKey: targetSetName,
      rarity: 5,
      level: 20,
      mainStatKey: 'hp',
      substats: [
        {
          key: 'critRate_',
          value: Number((crRollsPerPiece * 3.89).toFixed(1)),
        },
        {
          key: 'critDMG_',
          value: Number((cdRollsPerPiece * 7.77).toFixed(1)),
        },
        { key: secValue > 0 ? secKey : 'def', value: secValue > 0 ? secValue : 21 },
        { key: 'hp', value: 298 },
      ],
    },
    plume: {
      slotKey: 'plume',
      setKey: targetSetName,
      rarity: 5,
      level: 20,
      mainStatKey: 'atk',
      substats: [
        {
          key: 'critRate_',
          value: Number((crRollsPerPiece * 3.89).toFixed(1)),
        },
        {
          key: 'critDMG_',
          value: Number((cdRollsPerPiece * 7.77).toFixed(1)),
        },
        { key: secValue > 0 ? secKey : 'def', value: secValue > 0 ? secValue : 21 },
        { key: 'hp', value: 298 },
      ],
    },
    sands: {
      slotKey: 'sands',
      setKey: targetSetName,
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.sands[0] || 'atk_',
      substats: [
        {
          key: 'critRate_',
          value: Number((crRollsPerPiece * 3.89).toFixed(1)),
        },
        {
          key: 'critDMG_',
          value: Number((cdRollsPerPiece * 7.77).toFixed(1)),
        },
        {
          key:
            secValue > 0
              ? config.preferredMainStats.sands[0] === secKey
                ? altKey
                : secKey
              : 'def',
          value: secValue > 0 ? secValue : 21,
        },
        { key: 'hp', value: 298 },
      ],
    },
    goblet: {
      slotKey: 'goblet',
      setKey: targetSetName,
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.goblet[0] || 'pyro_dmg_',
      substats: [
        {
          key: 'critRate_',
          value: Number((crRollsPerPiece * 3.89).toFixed(1)),
        },
        {
          key: 'critDMG_',
          value: Number((cdRollsPerPiece * 7.77).toFixed(1)),
        },
        {
          key:
            secValue > 0
              ? config.preferredMainStats.goblet[0] === secKey
                ? altKey
                : secKey
              : 'def',
          value: secValue > 0 ? secValue : 21,
        },
        { key: 'hp', value: 298 },
      ],
    },
    circlet: {
      slotKey: 'circlet',
      setKey: "Gladiator's Finale", // Standard 4pc + 1 off-piece
      rarity: 5,
      level: 20,
      mainStatKey: config.preferredMainStats.circlet[0] || 'critRate_',
      substats: [
        {
          key: 'critDMG_',
          value: Number((cdRollsPerPiece * 7.77).toFixed(1)),
        },
        {
          key:
            secValue > 0
              ? config.preferredMainStats.circlet[0] === secKey
                ? altKey
                : secKey
              : 'def',
          value: secValue > 0 ? secValue : 21,
        },
        { key: 'hp', value: 298 },
        { key: 'atk', value: 18 },
      ],
    },
  };

  return analyzeArtifactBuild(characterName, mockSlots, teamContext);
}
