import type {
  AccountValueBreakdown,
  PullBudgetForecast,
  PullBudgetInput,
  PullConfidence,
  PullRecommendation,
  PullTargetMode,
  PullTargetType,
  PullUserWeights,
  StrategicRecommendation,
} from '@celestia/api-contracts';

import type { CharacterInput } from '../character-intelligence/character-intelligence.calculator.js';
import type { CharacterRecommendation } from '../character-intelligence/character-intelligence.service.js';
import type {
  TeamScoreBreakdown,
  TeamTemplate,
} from '../team-intelligence/team-intelligence.calculator.js';

// Re-export CharacterInput
export type { CharacterInput };

export interface ActiveBanner {
  bannerId: string;
  name: string;
  type: 'CHARACTER' | 'WEAPON' | 'CHRONICLED';
  fiveStarKey: string;
  fiveStarKeys?: string[];
  fourStarKeys: string[];
  startDate?: string;
  endDate: string;
  historical?: boolean;
  simulation?: boolean;
  sourceUrl?: string;
  rulesSource?: string;
  source?: {
    id?: string;
    url?: string;
    verified?: boolean;
  };
}

export interface ConstellationBenchmark {
  valueScore: number;
  comfortBoost: number;
  category: string;
  description: string;
}

export type ConstellationBenchmarksMap = Record<string, Record<string, ConstellationBenchmark>>;

export interface CounterfactualTargetInput {
  targetKey: string;
  targetType: PullTargetType;
  mode: PullTargetMode;
  targetConstellation?: number;
}

export interface AccountContextInput {
  isPartialAccount?: boolean;
  favorites?: string[];
  ownedWeaponKeys?: string[];
  characterElements?: Record<string, string>;
}

// -------------------------------------------------------
// Pure Probability Calculation (Absorbing Markov Chain)
// -------------------------------------------------------

export function calculatePullProbability(
  pulls: number,
  pity: number,
  guaranteed: boolean,
  isWeapon: boolean,
): number {
  if (pulls <= 0) return 0;
  const hard = isWeapon ? 80 : 90;
  const base = isWeapon ? 0.007 : 0.006;
  const soft = isWeapon ? 63 : 74;
  const initialTargetRate = isWeapon ? (guaranteed ? 0.5 : 0.375) : guaranteed ? 1 : 0.5;

  let first = new Array<number>(hard).fill(0);
  let second = new Array<number>(hard).fill(0);
  first[Math.max(0, Math.min(hard - 1, pity))] = 1;
  let success = 0;

  for (let pull = 0; pull < Math.min(pulls, hard * 2); pull++) {
    const nextFirst = new Array<number>(hard).fill(0);
    const nextSecond = new Array<number>(hard).fill(0);
    for (let current = 0; current < hard; current++) {
      const next = current + 1;
      const rate =
        next >= hard
          ? 1
          : Math.min(1, base + Math.max(0, next - soft + 1) * (isWeapon ? 0.07 : 0.06));
      success += first[current] * rate * initialTargetRate + second[current] * rate;
      nextSecond[0] += first[current] * rate * (1 - initialTargetRate);
      if (next < hard) {
        nextFirst[next] += first[current] * (1 - rate);
        nextSecond[next] += second[current] * (1 - rate);
      }
    }
    first = nextFirst;
    second = nextSecond;
  }

  return Math.min(1, Math.max(0, Number(success.toFixed(4))));
}

// -------------------------------------------------------
// Pure Evaluation Helpers
// -------------------------------------------------------

/**
 * Calculates archetype flexibility: count of unique archetypes
 * where characterKey appears as a candidate.
 */
export function calculateArchetypeFlexibility(
  characterKey: string,
  templates: TeamTemplate[],
): { score: number; archetypes: string[] } {
  const matchingTemplates = templates.filter((t) =>
    t.roles.some((r) => r.candidates.includes(characterKey)),
  );

  const archetypes = Array.from(new Set(matchingTemplates.map((t) => t.archetype)));
  // Each archetype grants 25 points, capped at 100
  const score = Math.min(100, archetypes.length * 25);
  return { score, archetypes };
}

/**
 * Calculates redundancy penalty: applies when target is an on-field carry
 * and the player already possesses invested carries of the same element.
 */
export function calculateRedundancyPenalty(
  targetKey: string,
  roster: CharacterInput[],
  templates: TeamTemplate[],
  characterElements: Record<string, string> = {},
): { penalty: number; redundantWith: string[] } {
  // Check if target is considered an on-field DPS in templates
  const isDpsCandidate = templates.some((t) =>
    t.roles.some(
      (r) =>
        r.candidates.includes(targetKey) &&
        (r.roleId.toLowerCase().includes('dps') || r.label.toLowerCase().includes('dps')),
    ),
  );

  if (!isDpsCandidate) {
    return { penalty: 0, redundantWith: [] };
  }

  const targetElement = characterElements[targetKey];
  if (!targetElement) {
    return { penalty: 0, redundantWith: [] };
  }

  // Find owned characters sharing the same element that are built carries
  const redundantWith: string[] = [];
  for (const char of roster) {
    if (char.characterKey === targetKey) continue;
    const element = characterElements[char.characterKey];
    if (element !== targetElement) continue;

    // Check if owned char is also a DPS candidate
    const isOwnedDps = templates.some((t) =>
      t.roles.some(
        (r) =>
          r.candidates.includes(char.characterKey) &&
          (r.roleId.toLowerCase().includes('dps') || r.label.toLowerCase().includes('dps')),
      ),
    );

    // Consider built if ascension >= 5 or level >= 70 or talents >= 6
    const isBuilt = char.ascension >= 5 || char.level >= 70 || char.talentNormal >= 6;
    if (isOwnedDps && isBuilt) {
      redundantWith.push(char.characterKey);
    }
  }

  // 20 points per redundant carry, up to 50 max
  const penalty = Math.min(50, redundantWith.length * 20);
  return { penalty, redundantWith };
}

/**
 * Estimates team comfort impact: defensive capability and rotation ease.
 */
export function estimateComfortImpact(
  targetKey: string,
  targetType: PullTargetType,
  mode: PullTargetMode,
  constellationBoost = 0,
): number {
  if (targetType === 'weapon') {
    return 15; // Weapons primarily offer stats/damage, minor comfort
  }

  if (mode === 'constellation' && constellationBoost > 0) {
    return Math.min(100, 20 + constellationBoost);
  }

  // Defensive characters grant high baseline comfort
  const shielders = ['Zhongli', 'Layla', 'Thoma', 'Diona', 'Kirara', 'Noelle', 'Dehya'];
  const healers = [
    'Kokomi',
    'Baizhu',
    'Jean',
    'Barbara',
    'Xianyun',
    'KukiShinobu',
    'Bennett',
    'Yaoyao',
    'Charlotte',
    'Citlali',
  ];
  const universalBuffers = ['KaedeharaKazuha', 'Furina', 'Xilonen', 'Sucrose', 'Nahida', 'Yelan'];

  if (shielders.includes(targetKey)) return 85;
  if (healers.includes(targetKey)) return 75;
  if (universalBuffers.includes(targetKey)) return 55;

  return 25; // Default modest baseline for general units
}

/**
 * Calculates favorite synergy score.
 */
export function calculateFavoriteSynergy(
  targetKey: string,
  favorites: string[],
  templates: TeamTemplate[],
  topInvestedKeys: string[] = [],
): number {
  if (favorites.length === 0) {
    // Fall back to top-invested synergy if no favorites specified
    const matching = templates.filter(
      (t) =>
        t.roles.some((r) => r.candidates.includes(targetKey)) &&
        topInvestedKeys.some((k) => t.roles.some((r) => r.candidates.includes(k))),
    );
    return matching.length > 0 ? 50 : 20;
  }

  if (favorites.includes(targetKey)) {
    return 100; // The pull target IS a favorite
  }

  // Check how many favorites share a template with target
  const synergizingFavorites = favorites.filter((fav) =>
    templates.some(
      (t) =>
        t.roles.some((r) => r.candidates.includes(targetKey)) &&
        t.roles.some((r) => r.candidates.includes(fav)),
    ),
  );

  if (synergizingFavorites.length >= 2) return 90;
  if (synergizingFavorites.length === 1) return 65;
  return 15;
}

// -------------------------------------------------------
// Main Counterfactual Evaluation Function
// -------------------------------------------------------

export function evaluateCounterfactualAddition(params: {
  target: CounterfactualTargetInput;
  banner: ActiveBanner;
  roster: CharacterInput[];
  accountContext?: AccountContextInput;
  templates: TeamTemplate[];
  currentBreakdowns: TeamScoreBreakdown[];
  characterRecs?: CharacterRecommendation[];
  userWeights?: PullUserWeights;
  budget?: PullBudgetInput;
  constellationBenchmarks?: ConstellationBenchmarksMap;
  scoreAllTemplatesFn: (
    templates: TeamTemplate[],
    roster: CharacterInput[],
  ) => TeamScoreBreakdown[];
  referenceDate?: Date;
}): PullRecommendation {
  const {
    target,
    banner,
    roster,
    accountContext = {},
    templates,
    currentBreakdowns,
    characterRecs = [],
    userWeights = {
      weightEndgame: 0.35,
      weightFlexibility: 0.25,
      weightComfort: 0.2,
      weightFavorites: 0.2,
    },
    budget = { primogems: 0, fates: 0, pity: 0, guaranteed: false },
    constellationBenchmarks = {},
    scoreAllTemplatesFn,
  } = params;

  const isPartial = Boolean(accountContext.isPartialAccount);
  const favorites = accountContext.favorites ?? [];
  const ownedWeaponKeys = accountContext.ownedWeaponKeys ?? [];
  const characterElements = accountContext.characterElements ?? {};

  const existingChar = roster.find((c) => c.characterKey === target.targetKey);
  const alreadyOwned = existingChar !== undefined;
  const currentConstellation = existingChar ? existingChar.constellation : 0;

  // Resolve target constellation if mode is constellation or already owned
  let effectiveMode = target.mode;
  let targetConstellation = target.targetConstellation;
  if (target.targetType === 'character') {
    if (alreadyOwned && effectiveMode === 'c0_unlock') {
      effectiveMode = 'constellation';
      targetConstellation = Math.min(6, currentConstellation + 1);
    } else if (effectiveMode === 'constellation' && targetConstellation === undefined) {
      targetConstellation = Math.min(6, currentConstellation + 1);
    }
  }

  // 1. Archetype flexibility
  const { score: flexibilityScore, archetypes } =
    target.targetType === 'character'
      ? calculateArchetypeFlexibility(target.targetKey, templates)
      : { score: 30, archetypes: [] };

  // 2. Redundancy penalty
  const { penalty: redundancyPenalty, redundantWith } =
    target.targetType === 'character'
      ? calculateRedundancyPenalty(target.targetKey, roster, templates, characterElements)
      : { penalty: 0, redundantWith: [] };

  // 3. Endgame impact & newly unlocked teams
  let endgameCoverageImpact = 0;
  let unlockedTeamsCount = 0;
  const unlockedArchetypes: string[] = [];
  let constellationComfortBoost = 0;

  if (target.targetType === 'character' && effectiveMode === 'c0_unlock') {
    // Simulate adding character at Level 80 C0
    const simRoster: CharacterInput[] = [
      ...roster,
      {
        characterKey: target.targetKey,
        level: 80,
        ascension: 6,
        constellation: 0,
        talentNormal: 6,
        talentSkill: 6,
        talentBurst: 6,
        equippedWeapon: null,
      },
    ];

    const simBreakdowns = scoreAllTemplatesFn(templates, simRoster);
    for (const sim of simBreakdowns) {
      if (!sim.isBuildable) continue;
      const pre = currentBreakdowns.find((b) => b.templateId === sim.templateId);
      const preScore = pre?.score ?? 0;
      if (sim.score >= 55 && preScore < 55) {
        unlockedTeamsCount++;
        const tpl = templates.find((t) => t.id === sim.templateId);
        if (tpl && !unlockedArchetypes.includes(tpl.archetype)) {
          unlockedArchetypes.push(tpl.archetype);
        }
      }
    }

    const baselineGain = unlockedTeamsCount * 30;
    endgameCoverageImpact = Math.min(100, Math.max(25, baselineGain));
  } else if (effectiveMode === 'constellation') {
    // Constellation benchmark lookup
    const charBenchmarks = constellationBenchmarks[target.targetKey] ?? {};
    const benchmark = targetConstellation ? charBenchmarks[String(targetConstellation)] : null;
    if (benchmark) {
      endgameCoverageImpact = benchmark.valueScore;
      constellationComfortBoost = benchmark.comfortBoost;
    } else {
      // Generic fallback for unmodeled constellations
      endgameCoverageImpact = 25;
      constellationComfortBoost = 10;
    }
  } else if (target.targetType === 'weapon') {
    // Weapon signature value
    const hasMatching5Star = ownedWeaponKeys.includes(target.targetKey);
    endgameCoverageImpact = hasMatching5Star ? 30 : 65;
  }

  // 4. Comfort impact
  const comfortImpact = estimateComfortImpact(
    target.targetKey,
    target.targetType,
    effectiveMode,
    constellationComfortBoost,
  );

  // 5. Favorite synergy
  const topInvestedKeys = characterRecs.slice(0, 3).map((r) => r.characterKey);
  const favoriteSynergy = calculateFavoriteSynergy(
    target.targetKey,
    favorites,
    templates,
    topInvestedKeys,
  );

  // 6. Investment friction
  let investmentFriction: number;
  if (effectiveMode === 'constellation') {
    investmentFriction = 0; // Already leveled
  } else if (target.targetType === 'weapon') {
    investmentFriction = 6; // Fast weapon domain farming
  } else {
    investmentFriction = 14; // ~14-18 days resin for new character
  }

  // 7. Multi-objective total score
  const rawWeighted =
    userWeights.weightEndgame * endgameCoverageImpact +
    userWeights.weightFlexibility * flexibilityScore +
    userWeights.weightComfort * comfortImpact +
    userWeights.weightFavorites * favoriteSynergy -
    redundancyPenalty -
    investmentFriction;

  const totalScore = Math.round(Math.max(0, Math.min(100, rawWeighted)));

  // 8. Budget & pity forecast
  const currentPullsAvailable = Math.floor(budget.primogems / 160) + budget.fates;
  const isWeapon = target.targetType === 'weapon';
  const medianPullsNeeded = isWeapon ? (budget.guaranteed ? 55 : 95) : budget.guaranteed ? 76 : 105;
  const hardPityNeeded = isWeapon
    ? Math.max(0, 80 * 2 - budget.pity)
    : Math.max(0, (budget.guaranteed ? 90 : 180) - budget.pity);

  const acquisitionProbability = calculatePullProbability(
    currentPullsAvailable,
    budget.pity,
    budget.guaranteed,
    isWeapon,
  );

  let savingsAdvice: string;
  if (acquisitionProbability >= 0.8) {
    savingsAdvice = 'Sufficient reserves: high confidence of acquiring target within budget.';
  } else if (acquisitionProbability >= 0.45) {
    savingsAdvice =
      'Moderate reserve: coin-flip on 50/50. Saving additional wishes recommended for security.';
  } else {
    savingsAdvice =
      'Low reserves: high risk of missing target. Saving recommended unless willing to top up.';
  }

  const budgetForecast: PullBudgetForecast = {
    currentPullsAvailable,
    medianPullsNeeded,
    hardPityNeeded,
    acquisitionProbability,
    savingsAdvice,
  };

  // 9. Strategic Recommendation Verdict
  let strategicRecommendation: StrategicRecommendation;
  const missingDataNotes: string[] = [];

  if (isPartial) {
    missingDataNotes.push(
      'Account data from public showcase is partial. Unobserved characters cannot be assumed unowned.',
    );
  }

  const hasBudgetSpecified = budget.primogems > 0 || budget.fates > 0 || budget.pity > 0;
  const now = params.referenceDate ?? new Date();
  const isBannerUnverified = banner.source ? banner.source.verified === false : false;
  const isBannerExpired = banner.endDate ? new Date(banner.endDate) <= now : false;

  if (isBannerUnverified || isBannerExpired) {
    strategicRecommendation = 'CONDITIONAL_DATA_GAP';
    if (isBannerUnverified) {
      missingDataNotes.push(
        `Banner "${banner.name}" source is unverified. Strategic recommendation degraded to CONDITIONAL_DATA_GAP.`,
      );
    }
    if (isBannerExpired) {
      missingDataNotes.push(
        `Banner "${banner.name}" expired on ${banner.endDate}. Strategic recommendation degraded to CONDITIONAL_DATA_GAP.`,
      );
    }
  } else if (isPartial && totalScore < 60) {
    strategicRecommendation = 'CONDITIONAL_DATA_GAP';
  } else if (totalScore >= 70) {
    strategicRecommendation = 'HIGH_ACCOUNT_VALUE';
  } else if (redundancyPenalty >= 30 && totalScore < 45) {
    strategicRecommendation = 'NICHE_OR_REDUNDANT';
  } else if (
    totalScore < 35 ||
    (hasBudgetSpecified && totalScore < 55 && acquisitionProbability < 0.35)
  ) {
    strategicRecommendation = 'SAVE_RECOMMENDED';
  } else {
    strategicRecommendation = 'MODERATE_UPGRADE';
  }

  const breakdown: AccountValueBreakdown = {
    endgameCoverageImpact,
    supportFlexibility: flexibilityScore,
    redundancyPenalty,
    comfortImpact,
    favoriteSynergy,
    investmentFriction,
    unlockedTeamsCount,
    unlockedArchetypes: archetypes,
    redundantWithOwned: redundantWith,
    totalScore,
  };

  const isSimulation = Boolean(
    banner.historical ||
    banner.simulation ||
    banner.bannerId.startsWith('custom_') ||
    (banner.sourceUrl && !banner.sourceUrl.startsWith('http')),
  );
  let confidence: PullConfidence = isSimulation
    ? ('SIMULATED_SCENARIO' as const)
    : ('VERIFIED' as const);
  if (isBannerUnverified) {
    confidence = 'UNVERIFIED' as const;
  } else if (isBannerExpired) {
    confidence = 'STALE' as const;
  }

  const provenanceNotices: string[] = isSimulation
    ? ['Simulated scenario: evaluated outside of verified active banner window.']
    : [];
  if (isBannerUnverified) {
    provenanceNotices.push(`Unverified banner dataset: "${banner.name}".`);
  }
  if (isBannerExpired) {
    provenanceNotices.push(`Expired banner dataset: "${banner.name}" ended ${banner.endDate}.`);
  }

  return {
    targetKey: target.targetKey,
    targetName: target.targetKey.replace(/([A-Z])/g, ' $1').trim(),
    targetType: target.targetType,
    mode: effectiveMode,
    targetConstellation: effectiveMode === 'constellation' ? targetConstellation : undefined,
    currentConstellation: alreadyOwned ? currentConstellation : undefined,
    bannerId: banner.bannerId,
    bannerName: banner.name,
    fourStarKeys: banner.fourStarKeys,
    accountValueScore: totalScore,
    strategicRecommendation,
    breakdown,
    explanations: [], // Populated by explainer
    budgetForecast,
    isPartialAccount: isPartial,
    missingDataNotes,
    simulation: isSimulation,
    confidence,
    provenanceNotices,
    // Compatibility aliases:
    fiveStarKey: banner.fiveStarKey,
    pullValueScore: totalScore,
    recommendation: strategicRecommendation,
  };
}

// -------------------------------------------------------
// Legacy Signature Compatibility Bridge
// -------------------------------------------------------

export function calculatePullValue(
  banner: ActiveBanner,
  roster: CharacterInput[],
  templates: TeamTemplate[],
  currentBreakdowns: TeamScoreBreakdown[],
  characterRecs: CharacterRecommendation[],
  scoreAllTemplatesFn: (
    templates: TeamTemplate[],
    roster: CharacterInput[],
  ) => TeamScoreBreakdown[],
  options?: {
    accountContext?: AccountContextInput;
    userWeights?: PullUserWeights;
    budget?: PullBudgetInput;
    constellationBenchmarks?: ConstellationBenchmarksMap;
  },
): PullRecommendation {
  const target: CounterfactualTargetInput = {
    targetKey: banner.fiveStarKey,
    targetType: banner.type === 'WEAPON' ? 'weapon' : 'character',
    mode: 'c0_unlock',
  };

  return evaluateCounterfactualAddition({
    target,
    banner,
    roster,
    accountContext: options?.accountContext,
    templates,
    currentBreakdowns,
    characterRecs,
    userWeights: options?.userWeights,
    budget: options?.budget,
    constellationBenchmarks: options?.constellationBenchmarks,
    scoreAllTemplatesFn,
  });
}
