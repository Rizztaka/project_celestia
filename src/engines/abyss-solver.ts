import type {
  Character,
  TeamRecommendation,
  AbyssDualTeamPlan,
  AbyssChamberCoverage,
  ChamberHalfMetrics,
  OwnedCharacterProfile,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from './team-generator';
import { synthesizeTeamRotation } from './rotation-synthesizer';
import {
  calculateEffectiveResMultiplier,
  calculateShieldBreakTime,
  calculateTeamResShred,
  isNightsoulCharacter,
  NATLAN_NIGHTSOUL_IDS,
} from './combat-mechanics';
import {
  ABYSS_CYCLES,
  type AbyssCycleConfig,
  type AbyssChamberHalfConfig,
} from '../data/abyss-schedules';
import { getSavedCustomAbyss } from '../services/storage';
import { isSameCharacterOrTraveler } from './team-rules';

export { NATLAN_NIGHTSOUL_IDS };

/**
 * Evaluates mechanic coverage and shield efficiency for a single half.
 */
function evaluateHalf(
  team: TeamRecommendation,
  halfConfig: AbyssChamberHalfConfig,
  chamberNum: number,
  isFirstHalf: boolean,
  _cycleId: string,
): { satisfied: boolean; status: string; scoreDelta: number; metrics: ChamberHalfMetrics } {
  const primaryEnemy = halfConfig.enemies[0];
  const enemyName = primaryEnemy?.name || 'Enemies';
  const enemyShort = enemyName.replace(/:.*/, '');

  if (!team.members || team.members.length === 0) {
    return {
      satisfied: false,
      status: `Warning: Incomplete team for ${enemyName}`,
      scoreDelta: 0,
      metrics: {},
    };
  }

  const { mechanics } = halfConfig;
  let satisfied = true;
  let scoreDelta = 0;
  const statusPhrases: string[] = [];

  // 1. Prohibited elements (immunities)
  if (mechanics.prohibitedElements && mechanics.prohibitedElements.length > 0) {
    const hasImmuneOnly = team.members.every((m) => mechanics.prohibitedElements!.includes(m.element));
    const carry = team.members.find((m) => m.roles.includes('On-Field DPS'));
    const isCarryProhibited = carry && mechanics.prohibitedElements.includes(carry.element);
    const hasNonProhibitedDps = team.members.some(
      (m) =>
        (m.roles.includes('On-Field DPS') || m.roles.includes('Off-Field DPS')) &&
        !mechanics.prohibitedElements!.includes(m.element),
    );

    if (hasImmuneOnly) {
      satisfied = false;
      scoreDelta -= 80;
      statusPhrases.push(`Caution: Heavy ${mechanics.prohibitedElements.join('/')} reliance against immune ${enemyName}`);
    } else if (isCarryProhibited && !hasNonProhibitedDps) {
      satisfied = false;
      scoreDelta -= 100;
      statusPhrases.push(`Critical: Carry ${carry.name} is immune to ${enemyName}`);
    } else if (hasNonProhibitedDps) {
      scoreDelta += 30;
      statusPhrases.push(`Counters ${enemyShort} with non-${mechanics.prohibitedElements.join('/')} burst`);
    } else {
      satisfied = false;
      scoreDelta -= 50;
      statusPhrases.push(`Caution: Missing effective non-${mechanics.prohibitedElements.join('/')} damage dealers`);
    }
  }

  // 2. Bow requirement
  if (mechanics.requiresBow) {
    const hasBow = team.members.some((m) => m.weapon === 'Bow');
    if (hasBow) {
      scoreDelta += 100;
      statusPhrases.push(`Bow user equipped to disable flying ${enemyShort} thrusters`);
    } else {
      satisfied = false;
      scoreDelta -= 300;
      statusPhrases.push(`Critical: No Bow user to ground flying ${enemyShort}`);
    }
  }

  // 3. Shield Break computation
  let metrics: ChamberHalfMetrics = {};
  if (mechanics.shieldType && mechanics.shieldUnits !== undefined) {
    const shieldResult = calculateShieldBreakTime(
      mechanics.shieldType,
      mechanics.shieldUnits,
      team.members,
    );

    metrics = {
      shieldBreakTime: shieldResult.seconds === Infinity ? 999 : shieldResult.seconds,
      shieldBreakRating: shieldResult.rating,
      shieldBreakBreakdown: shieldResult.breakdown,
    };

    const isPyroLector =
      enemyName.toLowerCase().includes('pyro lector') ||
      (enemyName.toLowerCase().includes('lector') && mechanics.shieldType === 'Pyro');
    const targetLabel = isPyroLector ? 'Pyro Lector' : enemyShort;

    if (shieldResult.rating === 'Fast') {
      scoreDelta += 60;
      if (mechanics.shieldType === 'Pyro') {
        statusPhrases.push(`Rapid Hydro shield-shredder active for ${targetLabel}`);
      } else {
        statusPhrases.push(`⚡ Fast ${mechanics.shieldType} shield-break (${shieldResult.seconds}s) for ${targetLabel}`);
      }
    } else if (shieldResult.rating === 'Medium') {
      scoreDelta += 30;
      statusPhrases.push(`Medium ${mechanics.shieldType} shield-break (${shieldResult.seconds}s) for ${targetLabel}`);
    } else {
      satisfied = false;
      scoreDelta -= 100;
      if (mechanics.shieldType === 'Pyro') {
        statusPhrases.push(`Warning: Missing Hydro shield-breaker for ${targetLabel}`);
      } else {
        statusPhrases.push(`Warning: Slow / Ineffective ${mechanics.shieldType} shield breaking (${shieldResult.seconds}s) for ${targetLabel}`);
      }
    }
  }

  // 4. Nightsoul / Natlan blessing
  if (mechanics.favorsNightsoul) {
    const hasNightsoul = team.members.some((m) => isNightsoulCharacter(m));
    if (hasNightsoul) {
      scoreDelta += 40;
      statusPhrases.push(`Nightsoul blessing: 300% faster Nightspirit shield break for ${enemyShort}`);
    } else {
      satisfied = false;
      statusPhrases.push(`Standard shield break (slower without Natlan units against ${enemyShort})`);
    }
  }

  // 5. AoE / Sustain
  if (mechanics.favorsAoE) {
    const hasSustain = team.members.some((m) => m.roles.includes('Sustain'));
    if (hasSustain || team.synergyScore >= 90) {
      scoreDelta += 20;
      statusPhrases.push(`High AoE burst & survivability ready for ${enemyShort}`);
    } else {
      satisfied = false;
      statusPhrases.push(`Caution: Risk of burst damage deaths against ${enemyShort}`);
    }
  }

  // 6. Specific Chamber 3 Second Half handling for rotating shields / multi-element
  if (chamberNum === 3 && !isFirstHalf && !mechanics.shieldType && !mechanics.requiresBow) {
    const teamElements = new Set(team.members.map((m) => m.element));
    const multiElementOk = teamElements.size >= 3;
    if (multiElementOk) {
      scoreDelta += 40;
      statusPhrases.push(`Tri-element coverage (${Array.from(teamElements).join(', ')}) ready for rotating shields`);
    } else {
      satisfied = false;
      statusPhrases.push('Caution: Less than 3 elements against rotating shields');
    }
  }

  // 7. Team RES shred estimation
  const carry = team.members.find((m) => m.roles.includes('On-Field DPS'));
  const isCarryProhibited = carry && mechanics.prohibitedElements?.includes(carry.element);
  const subDps = team.members.find(
    (m) => m.roles.includes('Off-Field DPS') && !mechanics.prohibitedElements?.includes(m.element),
  );
  const effectiveDps =
    (!isCarryProhibited ? carry : undefined) ||
    subDps ||
    team.members.find((m) => !mechanics.prohibitedElements?.includes(m.element)) ||
    team.members[0];
  const dominantElement = effectiveDps?.element || 'Pyro';
  const shred = calculateTeamResShred(team.members, dominantElement);
  const targetEnemyRes = primaryEnemy?.baseRes[dominantElement] ?? 10;
  const dmgMultiplier = calculateEffectiveResMultiplier(targetEnemyRes, shred.totalShred);

  metrics = {
    ...metrics,
    effectiveResShred: shred.totalShred,
    resShredSources: shred.sources,
    effectiveDmgMultiplier: Math.round(dmgMultiplier * 100) / 100,
  };

  const status = statusPhrases.length > 0
    ? statusPhrases.join(' · ')
    : 'Chamber mechanics fully handled.';

  return { satisfied, status, scoreDelta, metrics };
}



/**
 * Evaluates Floor 12 chamber mechanic coverage for a First Half and Second Half team pair.
 */
export function evaluateChamberMechanicCoverage(
  teamA: TeamRecommendation,
  teamB: TeamRecommendation,
  cycle?: AbyssCycleConfig,
): { coverage: AbyssChamberCoverage[]; totalScore: number } {
  const activeCycle = cycle || ABYSS_CYCLES[0];
  let score = teamA.synergyScore + teamB.synergyScore;
  const coverage: AbyssChamberCoverage[] = [];

  for (const chamberConfig of activeCycle.chambers) {
    const chamberNum = chamberConfig.chamber;

    const resFirst = evaluateHalf(
      teamA,
      chamberConfig.firstHalf,
      chamberNum,
      true,
      activeCycle.id,
    );
    const resSecond = evaluateHalf(
      teamB,
      chamberConfig.secondHalf,
      chamberNum,
      false,
      activeCycle.id,
    );

    score += resFirst.scoreDelta + resSecond.scoreDelta;

    coverage.push({
      chamber: chamberNum,
      firstHalfStatus: resFirst.status,
      secondHalfStatus: resSecond.status,
      firstHalfSatisfied: resFirst.satisfied,
      secondHalfSatisfied: resSecond.satisfied,
      firstHalfMetrics: resFirst.metrics,
      secondHalfMetrics: resSecond.metrics,
    });
  }

  return { coverage, totalScore: score };
}

function calculateResonance(members: Character[]): string[] {
  const counts: Record<string, number> = {};
  for (const m of members) {
    counts[m.element] = (counts[m.element] || 0) + 1;
  }
  const resonances: string[] = [];
  if ((counts['Pyro'] ?? 0) >= 2) resonances.push('Fervent Flames: +25% ATK');
  if ((counts['Hydro'] ?? 0) >= 2) resonances.push('Soothing Water: +25% Max HP');
  if ((counts['Dendro'] ?? 0) >= 2) resonances.push('Sprawling Greenery: +50 to +100 EM');
  if ((counts['Cryo'] ?? 0) >= 2) resonances.push('Shattering Ice: +15% CRIT Rate against Frozen/Cryo');
  if ((counts['Geo'] ?? 0) >= 2) resonances.push('Enduring Rock: +15% Shield Strength & +15% DMG dealt');
  if ((counts['Anemo'] ?? 0) >= 2) resonances.push('Impetuous Winds: -15% Stamina & +10% Movement Speed');
  if ((counts['Electro'] ?? 0) >= 2) resonances.push('High Voltage: Electro reactions generate Energy particles');
  return resonances;
}

/**
 * Builds a fallback team of 4 characters from available pool when standard archetypes do not match.
 */
function buildFallbackTeam(pool: Character[], teamId: string, teamName: string): TeamRecommendation {
  const chosen: Character[] = [];

  // Try to pick: Carry, Buffer, Sub-DPS, Sustain without duplicating characters or Travelers
  const carry = pool.find((c) => c.roles.includes('On-Field DPS')) || pool[0];
  if (carry) chosen.push(carry);

  const buffer = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Buffer/Shred'),
  );
  if (buffer) chosen.push(buffer);

  const subDps = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Off-Field DPS'),
  );
  if (subDps) chosen.push(subDps);

  const sustain = pool.find(
    (c) => !chosen.some((x) => isSameCharacterOrTraveler(x, c)) && c.roles.includes('Sustain'),
  );
  if (sustain) chosen.push(sustain);

  // Fill up to 4
  for (const c of pool) {
    if (chosen.length >= 4) break;
    if (!chosen.some((x) => isSameCharacterOrTraveler(x, c))) chosen.push(c);
  }

  const stepped = synthesizeTeamRotation(chosen);

  return {
    id: teamId,
    name: teamName,
    archetype: 'Custom Flex',
    members: chosen,
    synergyScore: 78,
    comfortScore: chosen.some((m) => m.roles.includes('Sustain')) ? 85 : 65,
    reasons: ['Balanced combat composition constructed from remaining roster.'],
    rotation: stepped.summaryString || 'Execute support skills followed by carry combo.',
    steppedRotation: stepped,
    resonance: calculateResonance(chosen),
  };
}

/**
 * Solves the unified Spiral Abyss Floor 12 pairing:
 * Finds two completely disjoint teams (TeamA ∩ TeamB = ∅) prioritizing 100% chamber mechanics clearance,
 * then returns Top-3 distinct pairings (Primary Best-in-Slot, Comfort/High Sustain, Accessible/Alternative).
 */
export function solveAbyssDualTeams(
  ownedIds: string[],
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  cycle?: AbyssCycleConfig,
): AbyssDualTeamPlan {
  const activeCycle = cycle || ABYSS_CYCLES[0];
  const ownedSet = new Set(ownedIds);
  const ownedChars = CHARACTERS.filter((c) => ownedSet.has(c.id));
  const uniqueOwnedIds = Array.from(ownedSet);

  // If player has fewer than 8 characters, gracefully create best-effort teams
  if (ownedChars.length < 8) {
    const half1Chars = ownedChars.slice(0, 4);
    const half2Chars = ownedChars.slice(4, 8);

    const team1 = buildFallbackTeam(half1Chars, 'abyss-half-1', 'Abyss First Half');
    const team2 = buildFallbackTeam(half2Chars, 'abyss-half-2', 'Abyss Second Half');
    const { coverage, totalScore } = evaluateChamberMechanicCoverage(team1, team2, activeCycle);
    const partialPlan: AbyssDualTeamPlan = {
      firstHalfTeam: team1,
      secondHalfTeam: team2,
      chamberCoverage: coverage,
      overallScore: Math.max(0, totalScore),
      mechanicCoverageScore: Math.max(0, totalScore),
      cycleId: activeCycle.id,
      variantType: 'primary',
      label: 'Primary Best-in-Slot',
      description: 'Partial draft composition due to limited character roster.',
      warnings: [
        `Roster Shortfall: Floor 12 requires at least 8 distinct characters (4 for First Half, 4 for Second Half). Your roster only has ${ownedChars.length} characters. Showing partial draft.`,
      ],
    };
    partialPlan.allPairs = [partialPlan];
    partialPlan.primaryPair = partialPlan;
    return partialPlan;
  }

  // 1. Generate candidate primary teams from full owned roster
  const candidateTeams = generateBestTeams(uniqueOwnedIds, undefined, rosterProfiles);

  interface ScoredPair {
    firstHalfTeam: TeamRecommendation;
    secondHalfTeam: TeamRecommendation;
    coverage: AbyssChamberCoverage[];
    totalScore: number;
    satisfiedCount: number;
    comfortScore: number;
    synergyScore: number;
  }

  const evaluatedPairs: ScoredPair[] = [];
  const evaluatedPairKeys = new Set<string>();

  // Helper to test a pair in both orientations (A=First, B=Second and B=First, A=Second)
  const considerPair = (teamA: TeamRecommendation, teamB: TeamRecommendation) => {
    // Ensure all characters in both teams are strictly owned by the player
    if (
      teamA.members.some((m) => !ownedSet.has(m.id)) ||
      teamB.members.some((m) => !ownedSet.has(m.id))
    ) {
      return;
    }

    // Check strict disjointness including all Traveler configurations
    const hasOverlap = teamB.members.some((mB) =>
      teamA.members.some((mA) => isSameCharacterOrTraveler(mA, mB)),
    );
    if (hasOverlap) {
      return;
    }

    // Ensure stepped rotations exist
    if (!teamA.steppedRotation) {
      teamA.steppedRotation = synthesizeTeamRotation(teamA.members);
    }
    if (!teamB.steppedRotation) {
      teamB.steppedRotation = synthesizeTeamRotation(teamB.members);
    }

    const testOrientation = (t1: TeamRecommendation, t2: TeamRecommendation) => {
      const key = `${t1.members.map((m) => m.id).sort().join(',')}|${t2.members.map((m) => m.id).sort().join(',')}`;
      if (evaluatedPairKeys.has(key)) return;
      evaluatedPairKeys.add(key);

      const res = evaluateChamberMechanicCoverage(t1, t2, activeCycle);
      const satisfiedCount = res.coverage.reduce(
        (acc, c) => acc + (c.firstHalfSatisfied ? 1 : 0) + (c.secondHalfSatisfied ? 1 : 0),
        0,
      );

      evaluatedPairs.push({
        firstHalfTeam: t1,
        secondHalfTeam: t2,
        coverage: res.coverage,
        totalScore: res.totalScore,
        satisfiedCount,
        comfortScore: t1.comfortScore + t2.comfortScore,
        synergyScore: t1.synergyScore + t2.synergyScore,
      });
    };

    // Orientation 1: A on First Half, B on Second Half
    testOrientation(teamA, teamB);
    // Orientation 2: B on First Half, A on Second Half
    testOrientation(teamB, teamA);
  };

  // 2. Iterate through top candidate teams, and for each, generate secondary candidate teams from remaining roster
  const primaryPool = candidateTeams.slice(0, 8);
  for (const team1 of primaryPool) {
    const remainingChars = ownedChars.filter(
      (c) => !team1.members.some((m) => isSameCharacterOrTraveler(m, c)),
    );

    if (remainingChars.length >= 4) {
      const remainingIds = remainingChars.map((c) => c.id);
      // Pass rosterProfiles into secondary team generation
      const secondaryTeams = generateBestTeams(remainingIds, undefined, rosterProfiles);

      if (secondaryTeams.length > 0) {
        for (const team2 of secondaryTeams.slice(0, 6)) {
          considerPair(team1, team2);
        }
      } else {
        // Fallback team from remaining pool
        const fallbackTeam2 = buildFallbackTeam(
          remainingChars,
          `team-sub-${team1.id}`,
          'Secondary Composition',
        );
        considerPair(team1, fallbackTeam2);
      }
    }
  }

  // 3. Fallback if no pair was discovered (e.g. extremely constrained roster)
  if (evaluatedPairs.length === 0) {
    const half1 = ownedChars.slice(0, 4);
    const remainingForHalf2 = ownedChars
      .slice(4)
      .filter((c) => !half1.some((h) => isSameCharacterOrTraveler(h, c)));
    const team1 = buildFallbackTeam(half1, 'abyss-fallback-1', 'First Half Vanguard');
    const team2 = buildFallbackTeam(remainingForHalf2.slice(0, 4), 'abyss-fallback-2', 'Second Half Rearguard');
    considerPair(team1, team2);

    if (evaluatedPairs.length === 0) {
      const res = evaluateChamberMechanicCoverage(team1, team2, activeCycle);
      evaluatedPairs.push({
        firstHalfTeam: team1,
        secondHalfTeam: team2,
        coverage: res.coverage,
        totalScore: res.totalScore,
        satisfiedCount: 0,
        comfortScore: team1.comfortScore + team2.comfortScore,
        synergyScore: team1.synergyScore + team2.synergyScore,
      });
    }
  }

  // Rank pairs strictly prioritizing chamber mechanics clearance first (each satisfied half = 1000 base weight)
  const rankScore = (pair: ScoredPair) => pair.satisfiedCount * 1000 + pair.totalScore;
  evaluatedPairs.sort((a, b) => rankScore(b) - rankScore(a));

  const toPlan = (
    sp: ScoredPair,
    variantType: 'primary' | 'comfort' | 'alternative',
    label: string,
    description: string,
  ): AbyssDualTeamPlan => ({
    firstHalfTeam: sp.firstHalfTeam,
    secondHalfTeam: sp.secondHalfTeam,
    chamberCoverage: sp.coverage,
    overallScore: Math.max(0, sp.totalScore),
    mechanicCoverageScore: Math.max(0, sp.totalScore),
    cycleId: activeCycle.id,
    variantType,
    label,
    description,
  });

  const bestScored = evaluatedPairs[0];
  const primaryPair = toPlan(
    bestScored,
    'primary',
    'Primary Best-in-Slot',
    'Optimal pairing maximizing elemental shield shredding, boss counter mechanics, and combat synergy.',
  );

  const areDifferentPairs = (p1: ScoredPair, p2: ScoredPair) => {
    const s1A = new Set(p1.firstHalfTeam.members.map((m) => m.id));
    const s1B = new Set(p1.secondHalfTeam.members.map((m) => m.id));
    const isSameOrient =
      p2.firstHalfTeam.members.every((m) => s1A.has(m.id)) &&
      p2.secondHalfTeam.members.every((m) => s1B.has(m.id));
    const isSwappedOrient =
      p2.firstHalfTeam.members.every((m) => s1B.has(m.id)) &&
      p2.secondHalfTeam.members.every((m) => s1A.has(m.id));
    return !isSameOrient && !isSwappedOrient;
  };

  // Find Comfort Pair: dedicated sustain on both halves or highest comfort score
  let comfortScored = evaluatedPairs.slice(1).find((p) => {
    if (!areDifferentPairs(p, bestScored)) return false;
    const hasSustainA = p.firstHalfTeam.members.some((m) => m.roles.includes('Sustain'));
    const hasSustainB = p.secondHalfTeam.members.some((m) => m.roles.includes('Sustain'));
    return (hasSustainA && hasSustainB) || p.comfortScore >= 160;
  });
  if (!comfortScored) {
    comfortScored = evaluatedPairs
      .slice(1)
      .filter((p) => areDifferentPairs(p, bestScored))
      .sort((a, b) => b.comfortScore - a.comfortScore)[0];
  }

  const comfortPair = comfortScored
    ? toPlan(
        comfortScored,
        'comfort',
        'Comfort / High Sustain',
        'High-safety composition featuring dedicated shielders and healers for maximum error tolerance.',
      )
    : undefined;

  // Find Alternative Pair: different carries or alternative composition
  let alternativeScored = evaluatedPairs.slice(1).find((p) => {
    if (!areDifferentPairs(p, bestScored)) return false;
    if (comfortScored && !areDifferentPairs(p, comfortScored)) return false;
    return true;
  });

  const alternativePair = alternativeScored
    ? toPlan(
        alternativeScored,
        'alternative',
        'Accessible / Alternative Core',
        'Versatile alternative lineup leveraging adaptable core characters and accessible substitutions.',
      )
    : undefined;

  const allPairs: AbyssDualTeamPlan[] = [primaryPair];
  if (comfortPair) allPairs.push(comfortPair);
  if (alternativePair) allPairs.push(alternativePair);

  primaryPair.allPairs = allPairs;
  primaryPair.primaryPair = primaryPair;
  primaryPair.comfortPair = comfortPair;
  primaryPair.alternativePair = alternativePair;

  return primaryPair;
}

/**
 * 1-Click Swap Halves: Swaps First Half and Second Half teams and re-evaluates chamber coverage.
 * Guaranteed 0-overlap preservation.
 */
export function swapAbyssDualHalves(
  plan: AbyssDualTeamPlan,
  cycle?: AbyssCycleConfig,
): AbyssDualTeamPlan {
  const swapSingle = (p: AbyssDualTeamPlan): AbyssDualTeamPlan => {
    const swappedFirst = { ...p.secondHalfTeam };
    const swappedSecond = { ...p.firstHalfTeam };
    const activeCycle =
      cycle ||
      (p.cycleId === 'custom-sandbox'
        ? getSavedCustomAbyss()
        : p.cycleId
        ? ABYSS_CYCLES.find((c) => c.id === p.cycleId)
        : undefined) ||
      ABYSS_CYCLES[0];

    const { coverage, totalScore } = evaluateChamberMechanicCoverage(
      swappedFirst,
      swappedSecond,
      activeCycle,
    );

    return {
      ...p,
      firstHalfTeam: swappedFirst,
      secondHalfTeam: swappedSecond,
      chamberCoverage: coverage,
      overallScore: Math.max(0, totalScore),
      mechanicCoverageScore: Math.max(0, totalScore),
    };
  };

  const swappedPrimary = swapSingle(plan);
  if (plan.allPairs && plan.allPairs.length > 0) {
    const swappedAll = plan.allPairs.map((p) => swapSingle(p));
    swappedPrimary.allPairs = swappedAll;
    swappedPrimary.primaryPair = swappedAll[0];
    swappedPrimary.comfortPair = swappedAll.find((p) => p.variantType === 'comfort');
    swappedPrimary.alternativePair = swappedAll.find((p) => p.variantType === 'alternative');
  }
  return swappedPrimary;
}
