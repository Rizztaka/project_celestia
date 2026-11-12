import { createRequire } from 'node:module';

import {
  type CandidateEndgameTeam,
  type CandidateEndgameTeamInput,
  type OnslaughtBossConfig,
  type OnslaughtJointRequestInput,
  onslaughtJointRequestSchema,
} from '@celestia/api-contracts';

import {
  areTeamsDisjoint,
  calculateComfortMultiplier,
  calculateResistanceMultiplier,
  evaluateEncounterPackStatus,
  getCharacterElement,
} from './abyss-joint.calculator.js';

const require = createRequire(import.meta.url);
const defaultEncounters = require('../../static/endgame-encounters.json');

// -------------------------------------------------------
// Mechanic Archetype Sets
// -------------------------------------------------------

export const PARTY_HEALERS = new Set([
  'Baizhu',
  'Jean',
  'SangonomiyaKokomi',
  'Barbara',
  'Xianyun',
  'Charlotte',
  'Sigewinne',
  'Yaoyao',
  'Noelle',
]);

export const SINGLE_TARGET_HEALERS = new Set([
  'Bennett',
  'KukiShinobu',
  'Diona',
  'Sayu',
  'Mika',
  'Chevreuse',
  'Dori',
  'Qiqi',
]);

export const SHIELDERS = new Set(['Zhongli', 'Layla', 'Kirara', 'Diona', 'Thoma', 'Noelle']);

export const SUPER_ARMOR_UNITS = new Set(['RaidenShogun', 'Dehya']);

export const RANGED_ATTACKERS = new Set([
  'Yoimiya',
  'Yelan',
  'Xingqiu',
  'Tighnari',
  'Nahida',
  'Fischl',
  'Neuvillette',
  'Wanderer',
  'Ganyu',
  'Lyney',
  'YaeMiko',
  'Chasca',
  'Ororon',
  'Sethos',
  'Sigewinne',
  'Yanfei',
  'Klee',
  'Ningguang',
]);

// -------------------------------------------------------
// 3-Way Triplet Disjoint Verification
// -------------------------------------------------------

export interface TripletDisjointResult {
  isDisjoint: boolean;
  characterConflicts: string[];
  gearConflicts: string[];
}

export function areTeamsTripletDisjoint(
  team1: CandidateEndgameTeamInput,
  team2: CandidateEndgameTeamInput,
  team3: CandidateEndgameTeamInput,
): TripletDisjointResult {
  const check12 = areTeamsDisjoint(team1, team2);
  const check13 = areTeamsDisjoint(team1, team3);
  const check23 = areTeamsDisjoint(team2, team3);

  const characterConflicts = [
    ...check12.characterConflicts,
    ...check13.characterConflicts,
    ...check23.characterConflicts,
  ];

  const gearConflicts = [
    ...check12.gearConflicts,
    ...check13.gearConflicts,
    ...check23.gearConflicts,
  ];

  return {
    isDisjoint: check12.isDisjoint && check13.isDisjoint && check23.isDisjoint,
    characterConflicts: [...new Set(characterConflicts)],
    gearConflicts: [...new Set(gearConflicts)],
  };
}

// -------------------------------------------------------
// 3-Way Harmonic Mean
// -------------------------------------------------------

export function calculate3WayHarmonicScore(s1: number, s2: number, s3: number): number {
  if (s1 <= 0 || s2 <= 0 || s3 <= 0) return 0;
  const denominator = s1 * s2 + s2 * s3 + s3 * s1;
  if (denominator <= 0) return 0;
  return Math.round((3 * s1 * s2 * s3) / denominator);
}

// -------------------------------------------------------
// Single Stage Evaluation
// -------------------------------------------------------

export interface CalculatedStageEvaluation {
  stage: number;
  bossKey: string;
  bossName: string;
  team: CandidateEndgameTeam;
  stageScore: number;
  mechanicCounters: string[];
  unsupportedMechanics: string[];
  gapNotes: string[];
  multipliers: {
    mechanic: number;
    element: number;
    resistance: number;
    comfort: number;
  };
}

export function evaluateTeamForBoss(
  team: CandidateEndgameTeam,
  boss: OnslaughtBossConfig,
): CalculatedStageEvaluation {
  const teamElements = new Set<string>();
  for (const key of team.memberKeys) {
    const el = getCharacterElement(key);
    if (el && el !== 'Adaptive') teamElements.add(el);
  }

  let mechanicMult = 1.0;
  const mechanicCounters: string[] = [];
  const unsupportedMechanics: string[] = [];
  const gapNotes: string[] = [];

  // Track unsupported / unmodeled mechanics producing calculation gaps
  const SUPPORTED_MECHANICS = new Set(['corrosion', 'heavy_stagger', 'flying_mobile']);
  for (const m of boss.mechanics) {
    if (!SUPPORTED_MECHANICS.has(m)) {
      unsupportedMechanics.push(m);
      gapNotes.push(
        `Unmodeled boss mechanic "${m}" on ${boss.bossName} lacks verified damage/timing curve — clearance calculation produces gap.`,
      );
    }
  }

  // 1. Corrosion Mechanic Check
  if (boss.mechanics.includes('corrosion')) {
    const hasPartyHealer = team.memberKeys.some((k) => PARTY_HEALERS.has(k));
    const hasSingleHealer = team.memberKeys.some((k) => SINGLE_TARGET_HEALERS.has(k));

    if (hasPartyHealer) {
      mechanicMult *= 1.2;
      mechanicCounters.push('Corrosion Counter: Party-wide sustained healing (+20%)');
    } else if (hasSingleHealer) {
      mechanicMult *= 0.95;
      mechanicCounters.push('Corrosion Warning: Single-target healing only (-5%)');
    } else {
      mechanicMult *= 0.55;
      mechanicCounters.push('Corrosion Failure: Zero dedicated healers (-45%)');
    }
  }

  // 2. Heavy Stagger Mechanic Check
  if (boss.mechanics.includes('heavy_stagger')) {
    const hasShield = team.memberKeys.some((k) => SHIELDERS.has(k));
    const hasSuperArmor = team.memberKeys.some((k) => SUPER_ARMOR_UNITS.has(k));

    if (hasShield || hasSuperArmor) {
      mechanicMult *= 1.15;
      mechanicCounters.push('Heavy Stagger Counter: Shield / Super-armor active (+15%)');
    } else {
      mechanicMult *= 0.75;
      mechanicCounters.push('Heavy Stagger Warning: Vulnerable to interruption (-25%)');
    }
  }

  // 3. Flying / Mobile Mechanic Check
  if (boss.mechanics.includes('flying_mobile')) {
    const hasRanged = team.memberKeys.some((k) => RANGED_ATTACKERS.has(k));

    if (hasRanged) {
      mechanicMult *= 1.15;
      mechanicCounters.push('Mobile Boss Counter: Ranged/Tracking damage active (+15%)');
    } else {
      mechanicMult *= 0.75;
      mechanicCounters.push('Mobile Boss Warning: Melee-restricted targeting (-25%)');
    }
  }

  // 4. Recommended Elements Check
  let elementMult = 1.0;
  if (boss.recommendedElements.length > 0) {
    const hasRecommended = boss.recommendedElements.some((el) => teamElements.has(el));
    if (hasRecommended) {
      elementMult = 1.15;
      mechanicCounters.push(
        `Element Match: Team includes ${boss.recommendedElements.join('/')} (+15%)`,
      );
    } else {
      elementMult = 0.85;
      mechanicCounters.push(
        `Element Gap: Lacks recommended ${boss.recommendedElements.join('/')} (-15%)`,
      );
    }
  }

  // 5. Resistance Check
  const primaryElement = team.primaryElement ?? [...teamElements][0];
  const resResult = calculateResistanceMultiplier(
    primaryElement,
    teamElements,
    team.memberKeys,
    boss.resistanceProfile,
  );
  if (resResult.resistanceNotes.length > 0) {
    mechanicCounters.push(...resResult.resistanceNotes);
  }

  // 6. Comfort Multiplier
  const comfortMult = calculateComfortMultiplier(team.comfortScore);

  const rawScore = team.baseDps * mechanicMult * elementMult * resResult.multiplier * comfortMult;
  const stageScore = Math.max(0, Math.round(rawScore));

  return {
    stage: boss.stage,
    bossKey: boss.bossKey,
    bossName: boss.bossName,
    team,
    stageScore,
    mechanicCounters,
    unsupportedMechanics,
    gapNotes,
    multipliers: {
      mechanic: Number(mechanicMult.toFixed(2)),
      element: Number(elementMult.toFixed(2)),
      resistance: Number(resResult.multiplier.toFixed(2)),
      comfort: Number(comfortMult.toFixed(2)),
    },
  };
}

// -------------------------------------------------------
// Main Onslaught Triplet Solver (ADR-0011: Calculator)
// -------------------------------------------------------

export interface OnslaughtJointCalculationResult {
  cycleId: string;
  isCurrentCycle: boolean;
  isExpired: boolean;
  expirationNote: string | null;
  stages: CalculatedStageEvaluation[];
  jointScore: number;
  allStagesCleared: boolean;
  hasMechanicGaps: boolean;
  metadata: {
    tripletsEvaluated: number;
    permutationsEvaluated: number;
    totalCandidates: number;
  };
}

export function solveOnslaughtJoint(
  input: OnslaughtJointRequestInput,
  referenceDate?: Date,
): OnslaughtJointCalculationResult {
  const parsed = onslaughtJointRequestSchema.parse(input);
  const candidates = parsed.candidateTeams;

  // Resolve 3 bosses from override or static pack
  const bosses: OnslaughtBossConfig[] = parsed.bossOverrides ?? defaultEncounters.onslaughtBosses;

  if (!bosses || bosses.length !== 3) {
    throw new Error('Onslaught solver requires exactly 3 boss configurations');
  }

  // Pre-calculate score for every candidate against every boss
  const bossEvaluations = new Map<string, CalculatedStageEvaluation>();
  for (const team of candidates) {
    for (const boss of bosses) {
      const key = `${team.id}:${boss.stage}`;
      bossEvaluations.set(key, evaluateTeamForBoss(team, boss));
    }
  }

  let bestAssignment: {
    stages: CalculatedStageEvaluation[];
    jointScore: number;
  } | null = null;

  let tripletsEvaluated = 0;
  let permutationsEvaluated = 0;

  // Iterate over all candidate triplets
  const n = candidates.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const tA = candidates[i];
        const tB = candidates[j];
        const tC = candidates[k];

        const disjointCheck = areTeamsTripletDisjoint(tA, tB, tC);
        if (!disjointCheck.isDisjoint) continue;

        tripletsEvaluated++;

        // 6 permutations of assigning tA, tB, tC to boss 1, 2, 3
        const perms = [
          [tA, tB, tC],
          [tA, tC, tB],
          [tB, tA, tC],
          [tB, tC, tA],
          [tC, tA, tB],
          [tC, tB, tA],
        ];

        for (const [team1, team2, team3] of perms) {
          permutationsEvaluated++;
          const eval1 = bossEvaluations.get(`${team1.id}:${bosses[0].stage}`)!;
          const eval2 = bossEvaluations.get(`${team2.id}:${bosses[1].stage}`)!;
          const eval3 = bossEvaluations.get(`${team3.id}:${bosses[2].stage}`)!;

          const score = calculate3WayHarmonicScore(
            eval1.stageScore,
            eval2.stageScore,
            eval3.stageScore,
          );

          if (!bestAssignment || score > bestAssignment.jointScore) {
            bestAssignment = {
              stages: [eval1, eval2, eval3],
              jointScore: score,
            };
          }
        }
      }
    }
  }

  if (!bestAssignment) {
    throw new Error('No valid 3-team disjoint assignment could be formed from the candidate pool');
  }

  const allStagesCleared = bestAssignment.stages.every((s) => s.stageScore > 0);
  const refDate = referenceDate ?? new Date();
  const packStatus = evaluateEncounterPackStatus(parsed.cycleId, refDate);
  const hasMechanicGaps = bestAssignment.stages.some((s) => s.unsupportedMechanics.length > 0);

  return {
    cycleId: parsed.cycleId,
    isCurrentCycle: packStatus.isCurrentCycle,
    isExpired: packStatus.isExpired,
    expirationNote: packStatus.expirationNote,
    stages: bestAssignment.stages,
    jointScore: bestAssignment.jointScore,
    allStagesCleared,
    hasMechanicGaps,
    metadata: {
      tripletsEvaluated,
      permutationsEvaluated,
      totalCandidates: candidates.length,
    },
  };
}
