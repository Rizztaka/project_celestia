import { createRequire } from 'node:module';

import {
  type AbyssChamberConfig,
  type AbyssChamberHalfConfig,
  type AbyssJointRequestInput,
  abyssJointRequestSchema,
  type CandidateEndgameTeam,
  type CandidateEndgameTeamInput,
  type CrowdControlDemand,
  type ElementalShieldType,
  type EncounterGeometry,
} from '@celestia/api-contracts';

const require = createRequire(import.meta.url);
const characterElements: Record<string, string> = require('../../static/character-elements.json');
const defaultEncounters = require('../../static/endgame-encounters.json');

// -------------------------------------------------------
// Character & Role Metadata Helpers
// -------------------------------------------------------

export const CC_GROUPERS = new Set(['KaedeharaKazuha', 'Venti', 'Sucrose']);
export const RES_SHREDDERS = new Set([
  'KaedeharaKazuha',
  'Venti',
  'Sucrose',
  'Jean',
  'Sayu',
  'Lynette',
  'Xianyun',
  'ShikanoinHeizou',
  'Zhongli',
]);

export function getCharacterIdentity(characterKey: string): string {
  if (/^(Traveler|Aether|Lumine)/.test(characterKey)) return 'Traveler';
  return characterKey;
}

export function getCharacterElement(characterKey: string): string | null {
  return characterElements[characterKey] ?? null;
}

// -------------------------------------------------------
// Encounter Expiry & Current-Cycle Gate
// -------------------------------------------------------

export interface EncounterPackStatus {
  isCurrentCycle: boolean;
  isExpired: boolean;
  expirationNote: string | null;
}

export function evaluateEncounterPackStatus(
  requestedCycleId: string,
  referenceDate = new Date(),
): EncounterPackStatus {
  const currentCycleId = defaultEncounters.cycleId;
  const isMatch = requestedCycleId === currentCycleId;

  if (!isMatch) {
    return {
      isCurrentCycle: false,
      isExpired: true,
      expirationNote: `Requested cycle "${requestedCycleId}" does not match active cycle "${currentCycleId}". Operating in historical/manual preset mode.`,
    };
  }

  if (defaultEncounters.isExpired) {
    return {
      isCurrentCycle: false,
      isExpired: true,
      expirationNote: `Encounter pack "${currentCycleId}" is marked expired. Lost current-cycle status.`,
    };
  }

  if (defaultEncounters.expiryDate) {
    const expiry = new Date(defaultEncounters.expiryDate);
    if (!isNaN(expiry.getTime()) && referenceDate > expiry) {
      return {
        isCurrentCycle: false,
        isExpired: true,
        expirationNote: `Encounter pack "${currentCycleId}" expired on ${defaultEncounters.expiryDate}. Operating in historical mode.`,
      };
    }
  }

  return {
    isCurrentCycle: true,
    isExpired: false,
    expirationNote: null,
  };
}

// -------------------------------------------------------
// Disjoint Validation
// -------------------------------------------------------

export interface DisjointCheckResult {
  isDisjoint: boolean;
  characterConflicts: string[];
  gearConflicts: string[];
}

export function areTeamsDisjoint(
  team1: CandidateEndgameTeamInput,
  team2: CandidateEndgameTeamInput,
): DisjointCheckResult {
  const charIdentities1 = new Map<string, string>();
  for (const key of team1.memberKeys) {
    charIdentities1.set(getCharacterIdentity(key), key);
  }

  const characterConflicts: string[] = [];
  for (const key of team2.memberKeys) {
    const identity = getCharacterIdentity(key);
    if (charIdentities1.has(identity)) {
      characterConflicts.push(key);
    }
  }

  const gearConflicts: string[] = [];
  const weaponInstances1 = new Set<string>();
  const artifactInstances1 = new Set<string>();

  for (const gear of team1.gear ?? []) {
    if (gear.weaponInstanceId) weaponInstances1.add(gear.weaponInstanceId);
    for (const artId of gear.artifactInstanceIds ?? []) artifactInstances1.add(artId);
  }

  for (const gear of team2.gear ?? []) {
    if (gear.weaponInstanceId && weaponInstances1.has(gear.weaponInstanceId)) {
      gearConflicts.push(`weapon:${gear.weaponInstanceId}`);
    }
    for (const artId of gear.artifactInstanceIds ?? []) {
      if (artifactInstances1.has(artId)) {
        gearConflicts.push(`artifact:${artId}`);
      }
    }
  }

  return {
    isDisjoint: characterConflicts.length === 0 && gearConflicts.length === 0,
    characterConflicts,
    gearConflicts,
  };
}

// -------------------------------------------------------
// Multiplier Calculators (ADR-0011: Pure Numeric Logic)
// -------------------------------------------------------

export function calculateShieldMultiplier(
  teamElements: Set<string>,
  shields: ElementalShieldType[],
): { multiplier: number; counterBadges: string[] } {
  if (shields.length === 0) {
    return { multiplier: 1.0, counterBadges: [] };
  }

  let totalMult = 1.0;
  const counterBadges: string[] = [];

  for (const shield of shields) {
    switch (shield) {
      case 'Cryo':
        if (teamElements.has('Pyro')) {
          totalMult *= 1.15;
          counterBadges.push('Cryo Shield: Countered by Pyro');
        } else if (teamElements.has('Electro') || teamElements.has('Geo')) {
          totalMult *= 0.9;
          counterBadges.push('Cryo Shield: Neutral Counter (Electro/Geo)');
        } else {
          totalMult *= 0.4;
          counterBadges.push('Cryo Shield: Uncountered (-60% effectiveness)');
        }
        break;

      case 'Hydro':
        if (teamElements.has('Dendro') || teamElements.has('Cryo')) {
          totalMult *= 1.15;
          counterBadges.push('Hydro Shield: Countered by Dendro/Cryo');
        } else if (teamElements.has('Electro') || teamElements.has('Pyro')) {
          totalMult *= 0.9;
          counterBadges.push('Hydro Shield: Neutral Counter (Electro/Pyro)');
        } else {
          totalMult *= 0.4;
          counterBadges.push('Hydro Shield: Uncountered (-60% effectiveness)');
        }
        break;

      case 'Pyro':
        if (teamElements.has('Hydro')) {
          totalMult *= 1.15;
          counterBadges.push('Pyro Shield: Countered by Hydro');
        } else if (teamElements.has('Electro')) {
          totalMult *= 0.9;
          counterBadges.push('Pyro Shield: Neutral Counter (Electro)');
        } else {
          totalMult *= 0.4;
          counterBadges.push('Pyro Shield: Uncountered (-60% effectiveness)');
        }
        break;

      case 'Electro':
        if (teamElements.has('Pyro') || teamElements.has('Cryo') || teamElements.has('Dendro')) {
          totalMult *= 1.15;
          counterBadges.push('Electro Shield: Countered by Pyro/Cryo/Dendro');
        } else {
          totalMult *= 0.4;
          counterBadges.push('Electro Shield: Uncountered (-60% effectiveness)');
        }
        break;

      case 'Geo':
        if (teamElements.has('Geo') || (teamElements.has('Pyro') && teamElements.has('Electro'))) {
          totalMult *= 1.15;
          counterBadges.push('Geo Shield: Countered by Geo/Overload');
        } else {
          totalMult *= 0.5;
          counterBadges.push('Geo Shield: Uncountered (-50% effectiveness)');
        }
        break;

      case 'Dendro':
        if (teamElements.has('Pyro') || teamElements.has('Electro')) {
          totalMult *= 1.15;
          counterBadges.push('Dendro Shield: Countered by Pyro/Electro');
        } else {
          totalMult *= 0.5;
          counterBadges.push('Dendro Shield: Uncountered (-50% effectiveness)');
        }
        break;
    }
  }

  return { multiplier: totalMult, counterBadges };
}

export function calculateResistanceMultiplier(
  primaryElement: string | undefined,
  teamElements: Set<string>,
  teamKeys: string[],
  resistanceProfile: Record<string, number>,
): { multiplier: number; resistanceNotes: string[] } {
  if (!primaryElement || !(primaryElement in resistanceProfile)) {
    return { multiplier: 1.0, resistanceNotes: [] };
  }

  const res = resistanceProfile[primaryElement];
  const resistanceNotes: string[] = [];

  if (res >= 1.0) {
    resistanceNotes.push(`Primary element ${primaryElement} is IMMUNE (100% RES)`);
    return { multiplier: 0.05, resistanceNotes };
  }

  if (res >= 0.7) {
    const hasShred = teamElements.has('Anemo') || teamKeys.some((k) => RES_SHREDDERS.has(k));
    if (hasShred) {
      resistanceNotes.push(
        `High ${primaryElement} RES (${Math.round(res * 100)}%) mitigated by Shred Support`,
      );
      return { multiplier: 0.8, resistanceNotes };
    } else {
      resistanceNotes.push(
        `Severe ${primaryElement} RES penalty (${Math.round(res * 100)}%) without Shred`,
      );
      return { multiplier: 0.5, resistanceNotes };
    }
  }

  return { multiplier: 1.0, resistanceNotes: [] };
}

export function calculateGeometryMultiplier(
  geometry: EncounterGeometry,
  ccDemand: CrowdControlDemand,
  teamKeys: string[],
): { multiplier: number; geometryNotes: string[] } {
  const hasGrouper = teamKeys.some((k) => CC_GROUPERS.has(k));
  const geometryNotes: string[] = [];

  if (geometry === 'aoe_crowd') {
    if (hasGrouper) {
      geometryNotes.push('Crowd control grouping advantage applied (+25%)');
      return { multiplier: 1.25, geometryNotes };
    } else if (ccDemand === 'essential') {
      geometryNotes.push('Missing Anemo grouper in essential crowd-control wave (-25%)');
      return { multiplier: 0.75, geometryNotes };
    } else {
      geometryNotes.push('Un-grouped multi-target wave (-15%)');
      return { multiplier: 0.85, geometryNotes };
    }
  }

  if (geometry === 'single_target_boss') {
    geometryNotes.push('Single-target focus multiplier applied (+10%)');
    return { multiplier: 1.1, geometryNotes };
  }

  return { multiplier: 1.0, geometryNotes: [] };
}

export function calculateComfortMultiplier(comfortScore: number): number {
  return 0.85 + 0.3 * (Math.max(0, Math.min(100, comfortScore)) / 100);
}

// -------------------------------------------------------
// Single Team Half Evaluation
// -------------------------------------------------------

export interface CalculatedTeamHalfEvaluation {
  team: CandidateEndgameTeam;
  half: 1 | 2;
  score: number;
  multipliers: {
    shield: number;
    resistance: number;
    geometry: number;
    comfort: number;
  };
  shieldCounters: string[];
  geometryNotes: string[];
  resistanceNotes: string[];
}

export function evaluateTeamForHalf(
  team: CandidateEndgameTeam,
  halfConfig: AbyssChamberHalfConfig,
): CalculatedTeamHalfEvaluation {
  const teamElements = new Set<string>();
  for (const key of team.memberKeys) {
    const el = getCharacterElement(key);
    if (el && el !== 'Adaptive') teamElements.add(el);
  }

  // Aggregate shields, resistances, and geometry from all waves in the half
  const allShields: ElementalShieldType[] = [];
  const combinedResProfile: Record<string, number> = {};
  let dominantGeometry: EncounterGeometry = 'mixed';
  let highestCcDemand: CrowdControlDemand = 'optional';

  for (const wave of halfConfig.waves) {
    allShields.push(...wave.shields);
    Object.assign(combinedResProfile, wave.resistanceProfile);
    if (wave.geometry === 'aoe_crowd' || wave.geometry === 'single_target_boss') {
      dominantGeometry = wave.geometry;
    }
    if (wave.ccDemand === 'essential') highestCcDemand = 'essential';
    else if (wave.ccDemand === 'recommended' && highestCcDemand !== 'essential') {
      highestCcDemand = 'recommended';
    }
  }

  const shieldResult = calculateShieldMultiplier(teamElements, allShields);
  const primaryElement = team.primaryElement ?? [...teamElements][0];
  const resResult = calculateResistanceMultiplier(
    primaryElement,
    teamElements,
    team.memberKeys,
    combinedResProfile,
  );
  const geomResult = calculateGeometryMultiplier(
    dominantGeometry,
    highestCcDemand,
    team.memberKeys,
  );
  const comfortMult = calculateComfortMultiplier(team.comfortScore);

  const rawScore =
    team.baseDps *
    shieldResult.multiplier *
    resResult.multiplier *
    geomResult.multiplier *
    comfortMult;

  const score = Math.max(0, Math.round(rawScore));

  return {
    team,
    half: halfConfig.half,
    score,
    multipliers: {
      shield: Number(shieldResult.multiplier.toFixed(2)),
      resistance: Number(resResult.multiplier.toFixed(2)),
      geometry: Number(geomResult.multiplier.toFixed(2)),
      comfort: Number(comfortMult.toFixed(2)),
    },
    shieldCounters: shieldResult.counterBadges,
    geometryNotes: geomResult.geometryNotes,
    resistanceNotes: resResult.resistanceNotes,
  };
}

export function calculateHarmonicJointScore(score1: number, score2: number): number {
  if (score1 <= 0 || score2 <= 0) return 0;
  return Math.round((2 * score1 * score2) / (score1 + score2));
}

// -------------------------------------------------------
// Main Bipartite Joint Solver (ADR-0011: Calculator)
// -------------------------------------------------------

export interface AbyssJointCalculationResult {
  cycleId: string;
  floor: number;
  chamber: number;
  status: 'CURRENT_CYCLE' | 'HISTORICAL_BENCHMARK';
  isCurrentCycle: boolean;
  isExpired: boolean;
  expirationNote: string | null;
  firstHalf: CalculatedTeamHalfEvaluation;
  secondHalf: CalculatedTeamHalfEvaluation;
  jointScore: number;
  isJointOptimal: boolean;
  greedyComparison: {
    greedyFirstHalfScore: number;
    greedySecondHalfScore: number;
    greedyJointScore: number;
    scoreDeltaPercent: number;
  } | null;
  metadata: {
    disjointPairsEvaluated: number;
    totalCandidates: number;
    greedyFirstTeamId: string;
    greedySecondTeamId: string | null;
  };
}

export function solveAbyssJoint(
  input: AbyssJointRequestInput,
  referenceDate?: Date,
): AbyssJointCalculationResult {
  const parsed = abyssJointRequestSchema.parse(input);
  const candidates = parsed.candidateTeams;

  // Resolve chamber configuration: from override or default static pack
  let chamberConfig: AbyssChamberConfig;
  if (parsed.encounterOverride) {
    chamberConfig = parsed.encounterOverride;
  } else {
    const floor = defaultEncounters.abyssFloors?.find(
      (f: { floor: number }) => f.floor === parsed.floor,
    );
    const chamber = floor?.chambers?.find((c: { chamber: number }) => c.chamber === parsed.chamber);
    if (!chamber) {
      throw new Error(
        `Encounter configuration for Floor ${parsed.floor} Chamber ${parsed.chamber} not found`,
      );
    }
    chamberConfig = chamber;
  }

  // Pre-calculate half evaluations for all candidates
  const half1Evaluations = new Map<string, CalculatedTeamHalfEvaluation>();
  const half2Evaluations = new Map<string, CalculatedTeamHalfEvaluation>();

  for (const team of candidates) {
    half1Evaluations.set(team.id, evaluateTeamForHalf(team, chamberConfig.firstHalf));
    half2Evaluations.set(team.id, evaluateTeamForHalf(team, chamberConfig.secondHalf));
  }

  // Search all disjoint pairs to maximize harmonic mean
  let bestPair: {
    firstHalf: CalculatedTeamHalfEvaluation;
    secondHalf: CalculatedTeamHalfEvaluation;
    jointScore: number;
  } | null = null;
  let disjointPairsEvaluated = 0;

  for (let i = 0; i < candidates.length; i++) {
    for (let j = i + 1; j < candidates.length; j++) {
      const tA = candidates[i];
      const tB = candidates[j];
      const check = areTeamsDisjoint(tA, tB);
      if (!check.isDisjoint) continue;

      disjointPairsEvaluated++;

      // Permutation 1: tA on Half 1, tB on Half 2
      const evalA1 = half1Evaluations.get(tA.id)!;
      const evalB2 = half2Evaluations.get(tB.id)!;
      const score1 = calculateHarmonicJointScore(evalA1.score, evalB2.score);

      if (!bestPair || score1 > bestPair.jointScore) {
        bestPair = {
          firstHalf: evalA1,
          secondHalf: evalB2,
          jointScore: score1,
        };
      }

      // Permutation 2: tB on Half 1, tA on Half 2
      const evalB1 = half1Evaluations.get(tB.id)!;
      const evalA2 = half2Evaluations.get(tA.id)!;
      const score2 = calculateHarmonicJointScore(evalB1.score, evalA2.score);

      if (score2 > bestPair.jointScore) {
        bestPair = {
          firstHalf: evalB1,
          secondHalf: evalA2,
          jointScore: score2,
        };
      }
    }
  }

  if (!bestPair) {
    throw new Error('No valid disjoint team pair could be formed from the provided candidate pool');
  }

  // Compute Greedy assignment for comparison:
  // Greedy Step 1: Pick best possible team for Half 1
  const sortedHalf1 = [...candidates].sort((a, b) => {
    return half1Evaluations.get(b.id)!.score - half1Evaluations.get(a.id)!.score;
  });
  const greedyFirstTeam = sortedHalf1[0];
  const greedyFirstEval = half1Evaluations.get(greedyFirstTeam.id)!;

  // Greedy Step 2: Pick best remaining disjoint team for Half 2
  const eligibleSecondTeams = candidates.filter(
    (t) => t.id !== greedyFirstTeam.id && areTeamsDisjoint(greedyFirstTeam, t).isDisjoint,
  );
  eligibleSecondTeams.sort((a, b) => {
    return half2Evaluations.get(b.id)!.score - half2Evaluations.get(a.id)!.score;
  });

  let greedyComparison: AbyssJointCalculationResult['greedyComparison'] = null;
  const greedySecondTeam = eligibleSecondTeams[0] ?? null;

  if (greedySecondTeam) {
    const greedySecondEval = half2Evaluations.get(greedySecondTeam.id)!;
    const greedyJointScore = calculateHarmonicJointScore(
      greedyFirstEval.score,
      greedySecondEval.score,
    );
    const delta =
      greedyJointScore > 0
        ? Number((((bestPair.jointScore - greedyJointScore) / greedyJointScore) * 100).toFixed(1))
        : 0;

    greedyComparison = {
      greedyFirstHalfScore: greedyFirstEval.score,
      greedySecondHalfScore: greedySecondEval.score,
      greedyJointScore,
      scoreDeltaPercent: delta,
    };
  }

    const refDate =
      referenceDate ?? (parsed.referenceDate ? new Date(parsed.referenceDate) : new Date());
    const packStatus = evaluateEncounterPackStatus(parsed.cycleId, refDate);
    const isCurrent = packStatus.isCurrentCycle && !packStatus.isExpired;

    return {
      cycleId: parsed.cycleId,
      floor: parsed.floor,
      chamber: parsed.chamber,
      status: isCurrent ? 'CURRENT_CYCLE' : 'HISTORICAL_BENCHMARK',
      isCurrentCycle: isCurrent,
      isExpired: packStatus.isExpired,
      expirationNote: packStatus.expirationNote,
      firstHalf: bestPair.firstHalf,
      secondHalf: bestPair.secondHalf,
      jointScore: bestPair.jointScore,
      isJointOptimal: greedyComparison
        ? bestPair.jointScore >= greedyComparison.greedyJointScore
        : true,
      greedyComparison,
      metadata: {
        disjointPairsEvaluated,
        totalCandidates: candidates.length,
        greedyFirstTeamId: greedyFirstTeam.id,
        greedySecondTeamId: greedySecondTeam ? greedySecondTeam.id : null,
      },
    };
}
