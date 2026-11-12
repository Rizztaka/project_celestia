import { createRequire } from 'node:module';

import {
  type TheaterActPlanRequestInput,
  theaterActPlanRequestSchema,
  type TheaterActScheduleItem,
} from '@celestia/api-contracts';

import { getCharacterElement } from './abyss-joint.calculator.js';

const require = createRequire(import.meta.url);
const defaultEncounters = require('../../static/endgame-encounters.json');

// -------------------------------------------------------
// Season Expiry & Active Status Gate
// -------------------------------------------------------

export interface SeasonPackStatus {
  isCurrentSeason: boolean;
  isExpired: boolean;
  expirationNote: string | null;
}

export function evaluateSeasonStatus(
  requestedSeasonId: string,
  referenceDate = new Date(),
): SeasonPackStatus {
  const activeSeason = defaultEncounters.theaterSeason;
  if (!activeSeason) {
    return {
      isCurrentSeason: false,
      isExpired: true,
      expirationNote: 'No active Theater season configured. Operating in manual preset mode.',
    };
  }

  const isMatch = requestedSeasonId === activeSeason.seasonId;
  if (!isMatch) {
    return {
      isCurrentSeason: false,
      isExpired: true,
      expirationNote: `Requested season "${requestedSeasonId}" does not match active season "${activeSeason.seasonId}". Preserving historical/manual preset draft.`,
    };
  }

  if (defaultEncounters.isExpired) {
    return {
      isCurrentSeason: false,
      isExpired: true,
      expirationNote: `Theater season "${activeSeason.seasonId}" is marked expired. Lost current-season status.`,
    };
  }

  if (defaultEncounters.source && !defaultEncounters.source.verified) {
    return {
      isCurrentSeason: false,
      isExpired: true,
      expirationNote: `Theater season "${activeSeason.seasonId}" has unverified source. Operating in historical/unverified mode.`,
    };
  }

  if (activeSeason.validUntil) {
    const expiry = new Date(activeSeason.validUntil);
    if (!Number.isNaN(expiry.getTime()) && referenceDate > expiry) {
      return {
        isCurrentSeason: false,
        isExpired: true,
        expirationNote: `Theater season "${activeSeason.seasonId}" expired on ${activeSeason.validUntil}. Operating in historical mode.`,
      };
    }
  }

  if (defaultEncounters.expiryDate) {
    const expiry = new Date(defaultEncounters.expiryDate);
    if (!Number.isNaN(expiry.getTime()) && referenceDate > expiry) {
      return {
        isCurrentSeason: false,
        isExpired: true,
        expirationNote: `Theater season "${activeSeason.seasonId}" expired on ${defaultEncounters.expiryDate}. Operating in historical mode.`,
      };
    }
  }

  return {
    isCurrentSeason: true,
    isExpired: false,
    expirationNote: null,
  };
}

// -------------------------------------------------------
// Character Role Classifications for Theater Drafting
// -------------------------------------------------------

export type TheaterRoleCategory = 'main_dps' | 'sub_dps' | 'buffer_support' | 'sustain';

export const MAIN_DPS_SET = new Set([
  'HuTao',
  'Arlecchino',
  'Neuvillette',
  'Alhaitham',
  'RaidenShogun',
  'Yoimiya',
  'KamisatoAyaka',
  'KamisatoAyato',
  'Keqing',
  'Navia',
  'Lyney',
  'Wanderer',
  'Xiao',
  'Cyno',
  'Tighnari',
  'Diluc',
  'Klee',
  'Yanfei',
  'Eula',
  'Gaming',
  'Tartaglia',
  'Sethos',
  'Kinich',
  'Mualani',
  'Chasca',
]);

export const SUSTAIN_SET = new Set([
  'Zhongli',
  'Baizhu',
  'SangonomiyaKokomi',
  'Jean',
  'Xianyun',
  'Layla',
  'Kirara',
  'Diona',
  'Barbara',
  'Charlotte',
  'KukiShinobu',
  'Sigewinne',
  'Yaoyao',
  'Noelle',
  'Thoma',
  'Dehya',
  'Mika',
  'Qiqi',
  'Dori',
  'Chevreuse',
]);

export const BUFFER_SUPPORT_SET = new Set([
  'Bennett',
  'KaedeharaKazuha',
  'Sucrose',
  'Venti',
  'Faruzan',
  'KujouSara',
  'Gorou',
  'YunJin',
  'Mona',
  'Shenhe',
  'Kachina',
  'Xilonen',
]);

export function getTheaterRole(characterKey: string): TheaterRoleCategory {
  if (MAIN_DPS_SET.has(characterKey)) return 'main_dps';
  if (SUSTAIN_SET.has(characterKey)) return 'sustain';
  if (BUFFER_SUPPORT_SET.has(characterKey)) return 'buffer_support';
  return 'sub_dps';
}

// -------------------------------------------------------
// Difficulty & Boss Act Specifications
// -------------------------------------------------------

export interface BossActDefinition {
  act: number;
  bossName: string;
  preferredElements: string[];
  counterNote: string;
}

export const DIFFICULTY_CONFIGS: Record<
  'EASY' | 'NORMAL' | 'HARD' | 'VISIONARY',
  { totalActs: number; bossActs: BossActDefinition[] }
> = {
  EASY: {
    totalActs: 6,
    bossActs: [
      {
        act: 3,
        bossName: 'Millennial Pearl Seahorse',
        preferredElements: ['Pyro', 'Dendro', 'Cryo'],
        counterNote: 'Electro shield requires Pyro/Dendro/Cryo element counter',
      },
      {
        act: 6,
        bossName: 'Maguu Kenki',
        preferredElements: ['Pyro', 'Hydro', 'Electro'],
        counterNote: 'High burst boss demands defensive sustain or super-armor',
      },
    ],
  },
  NORMAL: {
    totalActs: 8,
    bossActs: [
      {
        act: 3,
        bossName: 'Millennial Pearl Seahorse',
        preferredElements: ['Pyro', 'Dendro', 'Cryo'],
        counterNote: 'Electro shield requires Pyro/Dendro/Cryo element counter',
      },
      {
        act: 6,
        bossName: 'Maguu Kenki',
        preferredElements: ['Pyro', 'Hydro', 'Electro'],
        counterNote: 'High burst boss demands defensive sustain or super-armor',
      },
      {
        act: 8,
        bossName: 'Icewind Suite - Nemesis of Coppelius',
        preferredElements: ['Pyro', 'Electro'],
        counterNote: 'Cryo shield & Pneuma demands Pyro DPS or Ousia aligned attacks',
      },
    ],
  },
  HARD: {
    totalActs: 8,
    bossActs: [
      {
        act: 3,
        bossName: 'Millennial Pearl Seahorse',
        preferredElements: ['Pyro', 'Dendro', 'Cryo'],
        counterNote: 'Electro shield requires Pyro/Dendro/Cryo element counter',
      },
      {
        act: 6,
        bossName: 'Maguu Kenki',
        preferredElements: ['Pyro', 'Hydro', 'Electro'],
        counterNote: 'High burst boss demands defensive sustain or super-armor',
      },
      {
        act: 8,
        bossName: 'Icewind Suite - Nemesis of Coppelius',
        preferredElements: ['Pyro', 'Electro'],
        counterNote: 'Cryo shield & Pneuma demands Pyro DPS or Ousia aligned attacks',
      },
    ],
  },
  VISIONARY: {
    totalActs: 10,
    bossActs: [
      {
        act: 3,
        bossName: 'Millennial Pearl Seahorse',
        preferredElements: ['Pyro', 'Dendro', 'Cryo'],
        counterNote: 'Electro shield requires Pyro/Dendro/Cryo element counter',
      },
      {
        act: 6,
        bossName: 'Maguu Kenki',
        preferredElements: ['Pyro', 'Hydro', 'Electro'],
        counterNote: 'High burst boss demands defensive sustain or super-armor',
      },
      {
        act: 8,
        bossName: 'Icewind Suite - Nemesis of Coppelius',
        preferredElements: ['Pyro', 'Electro'],
        counterNote: 'Cryo shield & Pneuma demands Pyro DPS or Ousia aligned attacks',
      },
      {
        act: 10,
        bossName: 'Iniquitous Baptist / Shadow Sovereign',
        preferredElements: ['Pyro', 'Hydro', 'Dendro', 'Electro'],
        counterNote: 'Climax boss with shifting multi-element elemental barriers',
      },
    ],
  },
};

// -------------------------------------------------------
// Calculator Results Interface (ADR-0011)
// -------------------------------------------------------

export interface TheaterActPlanCalculationResult {
  seasonId: string;
  isCurrentSeason: boolean;
  isExpired: boolean;
  expirationNote: string | null;
  difficulty: 'EASY' | 'NORMAL' | 'HARD' | 'VISIONARY';
  currentAct: number;
  totalActs: number;
  nextRecommendedTeam: string[];
  projectedSchedule: TheaterActScheduleItem[];
  reservedForBosses: Record<string, number>;
  remainingVigorEndState: Record<string, number>;
  vigorExhaustionRisk: boolean;
  ineligibleCastExcluded: Array<{ characterKey: string; reason: string }>;
  metadata: {
    totalCastSize: number;
    activeCastCount: number;
    bossActsScheduled: number[];
  };
}

// -------------------------------------------------------
// Backward-Chaining Reservation & Forward Simulation
// -------------------------------------------------------

export function solveTheaterActPlan(
  input: TheaterActPlanRequestInput,
  referenceDate?: Date,
): TheaterActPlanCalculationResult {
  const parsed = theaterActPlanRequestSchema.parse(input);
  const config = DIFFICULTY_CONFIGS[parsed.difficulty];
  const totalActs = config.totalActs;
  const bossActs = config.bossActs;

  const refDate = referenceDate ?? new Date();
  const seasonStatus = evaluateSeasonStatus(parsed.seasonId, refDate);
  const activeSeason = defaultEncounters.theaterSeason;
  const ineligibleCastExcluded: Array<{ characterKey: string; reason: string }> = [];

  // When evaluating active season, verify cast eligibility against allowed elements, openings and guests
  const effectiveCastKeys = parsed.castKeys;
  if (seasonStatus.isCurrentSeason && activeSeason) {
    const allowed = new Set(activeSeason.allowedElements ?? []);
    const openings = new Set(activeSeason.openingKeys ?? []);
    const guests = new Set(activeSeason.guestKeys ?? []);

    for (const key of parsed.castKeys) {
      const el = getCharacterElement(key);
      const isOpening = openings.has(key);
      const isGuest = guests.has(key);
      const isAllowedEl = el ? allowed.has(el) : false;

      if (!isOpening && !isGuest && !isAllowedEl) {
        ineligibleCastExcluded.push({
          characterKey: key,
          reason: `Element ${el ?? 'Unknown'} is outside standard season elements (${[...allowed].join('/')}). Treated as special guest or friend borrow.`,
        });
      }
    }
  }

  // Initialize remaining vigor from input or default to 2
  const vigorMap: Record<string, number> = {};
  for (const key of effectiveCastKeys) {
    vigorMap[key] = parsed.remainingVigor[key] ?? 2;
  }

  // Deduct vigor already consumed by completed acts
  for (const completed of parsed.completedActs) {
    for (const key of completed.teamKeys) {
      if (key in vigorMap) {
        vigorMap[key] = Math.max(0, vigorMap[key] - 1);
      }
    }
  }

  // 1. Backward-Chaining: Reserve optimal 4-man strike teams for each upcoming boss act
  const reservedForBosses: Record<string, number> = {};
  const bossTeamMap = new Map<number, string[]>();

  // Filter to upcoming boss acts only
  const upcomingBossActs = bossActs.filter((b) => b.act >= parsed.currentAct);

  for (const bossDef of upcomingBossActs) {
    const actNumber = bossDef.act;
    const reservedForThisBoss: string[] = [];

    // Eligible candidates for this boss: vigor > 0 and not already reserved for another boss
    const available = effectiveCastKeys.filter(
      (key) => (vigorMap[key] ?? 0) > 0 && !reservedForBosses[key],
    );

    // Pick 1 DPS (matching preferred element if possible)
    const dpsCandidates = available.filter((k) => getTheaterRole(k) === 'main_dps');
    const matchedDps =
      dpsCandidates.find((k) => {
        const el = getCharacterElement(k);
        return el && bossDef.preferredElements.includes(el);
      }) ?? dpsCandidates[0];

    if (matchedDps) {
      reservedForThisBoss.push(matchedDps);
      reservedForBosses[matchedDps] = actNumber;
    }

    // Pick 1 Sustain
    const remainingAvail1 = available.filter((k) => !reservedForThisBoss.includes(k));
    const sustainCandidates = remainingAvail1.filter((k) => getTheaterRole(k) === 'sustain');
    const matchedSustain = sustainCandidates[0];
    if (matchedSustain) {
      reservedForThisBoss.push(matchedSustain);
      reservedForBosses[matchedSustain] = actNumber;
    }

    // Pick 2 Sub-DPS / Support (matching element preferred)
    const remainingAvail2 = available.filter((k) => !reservedForThisBoss.includes(k));
    const supportCandidates = remainingAvail2.sort((a, b) => {
      const elA = getCharacterElement(a);
      const elB = getCharacterElement(b);
      const matchA = elA && bossDef.preferredElements.includes(elA) ? 1 : 0;
      const matchB = elB && bossDef.preferredElements.includes(elB) ? 1 : 0;
      return matchB - matchA;
    });

    for (const sup of supportCandidates) {
      if (reservedForThisBoss.length >= 4) break;
      reservedForThisBoss.push(sup);
      reservedForBosses[sup] = actNumber;
    }

    // Fallback if fewer than 4 could be role-matched
    if (reservedForThisBoss.length < 4) {
      const remainingAny = available.filter((k) => !reservedForThisBoss.includes(k));
      for (const anyChar of remainingAny) {
        if (reservedForThisBoss.length >= 4) break;
        reservedForThisBoss.push(anyChar);
        reservedForBosses[anyChar] = actNumber;
      }
    }

    bossTeamMap.set(actNumber, reservedForThisBoss);
  }

  // 2. Forward Act Simulation & Schedule Generation
  const simVigor = { ...vigorMap };
  const projectedSchedule: TheaterActScheduleItem[] = [];
  let vigorExhaustionRisk = false;

  for (let act = parsed.currentAct; act <= totalActs; act++) {
    const bossDef = bossActs.find((b) => b.act === act);
    const isBoss = !!bossDef;
    let selectedTeam: string[] = [];
    let rationale: string;

    if (isBoss) {
      // Use reserved boss team
      const reserved = bossTeamMap.get(act) ?? [];
      selectedTeam = reserved.filter((k) => (simVigor[k] ?? 0) > 0);

      // If any reserved character lost all vigor, backfill from remaining pool
      if (selectedTeam.length < 4) {
        const backfills = effectiveCastKeys.filter(
          (k) => (simVigor[k] ?? 0) > 0 && !selectedTeam.includes(k),
        );
        for (const bf of backfills) {
          if (selectedTeam.length >= 4) break;
          selectedTeam.push(bf);
        }
      }

      rationale = `Boss Act: Strike team counters ${bossDef.bossName}. ${bossDef.counterNote}.`;
    } else {
      // Non-Boss Act: Draft characters preserving future boss reserves
      // A character can only be used in this act if:
      // - They have vigor > 0
      // - If they ARE reserved for a future boss act B (where B > act), they must have vigor >= 2 (so spending 1 leaves 1 for the boss)
      const nonBossEligible = effectiveCastKeys.filter((k) => {
        const v = simVigor[k] ?? 0;
        if (v <= 0) return false;
        const resAct = reservedForBosses[k];
        if (resAct && resAct > act && v < 2) {
          // Locked for future boss!
          return false;
        }
        return true;
      });

      // Sort priority:
      // 1. Unreserved with vigor === 2 (expend auxiliary units first)
      // 2. Reserved with vigor === 2 (safe to spend 1)
      // 3. Unreserved with vigor === 1
      nonBossEligible.sort((a, b) => {
        const vA = simVigor[a] ?? 0;
        const vB = simVigor[b] ?? 0;
        const resA = reservedForBosses[a] ? 1 : 0;
        const resB = reservedForBosses[b] ? 1 : 0;

        if (vA !== vB) return vB - vA; // higher vigor first
        return resA - resB; // unreserved first
      });

      // Assemble balanced roles if possible: 1 DPS, 1 Sustain, 2 Support/Sub-DPS
      const pickTeam: string[] = [];

      const dps = nonBossEligible.find((k) => getTheaterRole(k) === 'main_dps');
      if (dps) pickTeam.push(dps);

      const sustain = nonBossEligible.find(
        (k) => getTheaterRole(k) === 'sustain' && !pickTeam.includes(k),
      );
      if (sustain) pickTeam.push(sustain);

      for (const k of nonBossEligible) {
        if (pickTeam.length >= 4) break;
        if (!pickTeam.includes(k)) pickTeam.push(k);
      }

      selectedTeam = pickTeam;
      rationale = `Clearing Act: Auxiliary cast deployed to conserve reserves for upcoming Boss Acts.`;
    }

    // Decrement simulated vigor
    for (const key of selectedTeam) {
      simVigor[key] = Math.max(0, (simVigor[key] ?? 0) - 1);
    }

    if (selectedTeam.length < 4) {
      vigorExhaustionRisk = true;
    }

    // Build role tags for the selected team
    const roleTags: Record<string, string> = {};
    for (const k of selectedTeam) {
      roleTags[k] = getTheaterRole(k);
    }

    projectedSchedule.push({
      act,
      isBoss,
      bossName: bossDef ? bossDef.bossName : null,
      recommendedTeam: selectedTeam,
      roleTags,
      rationale,
    });
  }

  const nextRecommendedTeam =
    projectedSchedule.length > 0 ? projectedSchedule[0].recommendedTeam : [];

  const activeCastCount = Object.values(vigorMap).filter((v) => v > 0).length;

  return {
    seasonId: parsed.seasonId,
    isCurrentSeason: seasonStatus.isCurrentSeason,
    isExpired: seasonStatus.isExpired,
    expirationNote: seasonStatus.expirationNote,
    difficulty: parsed.difficulty,
    currentAct: parsed.currentAct,
    totalActs,
    nextRecommendedTeam,
    projectedSchedule,
    reservedForBosses,
    remainingVigorEndState: simVigor,
    vigorExhaustionRisk,
    ineligibleCastExcluded,
    metadata: {
      totalCastSize: effectiveCastKeys.length,
      activeCastCount,
      bossActsScheduled: upcomingBossActs.map((b) => b.act),
    },
  };
}
