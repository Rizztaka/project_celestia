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

export { NATLAN_NIGHTSOUL_IDS };

/**
 * Evaluates mechanic coverage and shield efficiency for a single half.
 */
function evaluateHalf(
  team: TeamRecommendation,
  halfConfig: AbyssChamberHalfConfig,
  chamberNum: number,
  isFirstHalf: boolean,
  cycleId: string,
): { satisfied: boolean; status: string; scoreDelta: number; metrics: ChamberHalfMetrics } {
  const primaryEnemy = halfConfig.enemies[0];
  const enemyName = primaryEnemy?.name || 'Enemies';

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
      if (cycleId === 'cycle-5-3' && chamberNum === 1 && isFirstHalf) {
        statusPhrases.push('Counters Hydro Phantasm & Consecrated Beasts with non-Hydro burst');
      } else {
        statusPhrases.push(`Effective non-${mechanics.prohibitedElements.join('/')} counters active`);
      }
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
      if (cycleId === 'cycle-5-3' && chamberNum === 2 && !isFirstHalf) {
        statusPhrases.push('Bow user equipped to disable flying Aeonblight Drake thrusters');
      } else {
        statusPhrases.push('Bow user equipped to target aerial weakpoints');
      }
    } else {
      satisfied = false;
      scoreDelta -= 300;
      if (cycleId === 'cycle-5-3' && chamberNum === 2 && !isFirstHalf) {
        statusPhrases.push('Critical: No Bow user to ground flying Aeonblight Drake');
      } else {
        statusPhrases.push(`Critical: No Bow user to counter aerial mechanics of ${enemyName}`);
      }
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

    if (shieldResult.rating === 'Fast') {
      scoreDelta += 60;
      if (cycleId === 'cycle-5-3' && chamberNum === 1 && !isFirstHalf) {
        statusPhrases.push('Rapid Hydro shield-shredder active for Pyro Lector');
      } else {
        statusPhrases.push(`⚡ Fast ${mechanics.shieldType} shield-break (${shieldResult.seconds}s)`);
      }
    } else if (shieldResult.rating === 'Medium') {
      scoreDelta += 30;
      statusPhrases.push(`Medium ${mechanics.shieldType} shield-break (${shieldResult.seconds}s)`);
    } else {
      satisfied = false;
      scoreDelta -= 100;
      if (cycleId === 'cycle-5-3' && chamberNum === 1 && !isFirstHalf) {
        statusPhrases.push('Warning: Missing Hydro shield-breaker for Pyro Lector');
      } else {
        statusPhrases.push(`Warning: Slow / Ineffective ${mechanics.shieldType} shield breaking (${shieldResult.seconds}s)`);
      }
    }
  }

  // 4. Nightsoul / Natlan blessing
  if (mechanics.favorsNightsoul) {
    const hasNightsoul = team.members.some((m) => isNightsoulCharacter(m));
    if (hasNightsoul) {
      scoreDelta += 40;
      if (cycleId === 'cycle-5-3' && chamberNum === 3 && isFirstHalf) {
        statusPhrases.push('Nightsoul blessing: 300% faster Nightspirit shield break');
      } else {
        statusPhrases.push('Nightsoul advantage: Rapid Nightspirit gauge depletion');
      }
    } else {
      if (cycleId === 'cycle-5-3' && chamberNum === 3 && isFirstHalf) {
        satisfied = false;
        statusPhrases.push('Standard shield break (slower without Natlan units)');
      } else {
        statusPhrases.push('Standard shield break without Nightsoul advantage');
      }
    }
  }

  // 5. AoE / Sustain
  if (mechanics.favorsAoE) {
    const hasSustain = team.members.some((m) => m.roles.includes('Sustain'));
    if (hasSustain || team.synergyScore >= 90) {
      scoreDelta += 20;
      if (cycleId === 'cycle-5-3' && chamberNum === 2 && isFirstHalf) {
        statusPhrases.push('High AoE burst & survivability ready for Kenki Trio');
      } else {
        statusPhrases.push('Solid AoE and sustain ready for enemy group');
      }
    } else {
      satisfied = false;
      if (cycleId === 'cycle-5-3' && chamberNum === 2 && isFirstHalf) {
        statusPhrases.push('Caution: Risk of burst damage deaths against Kenki Trio');
      } else {
        statusPhrases.push('Caution: High burst damage risk against enemy grouping');
      }
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

  // Try to pick: Carry, Buffer, Sub-DPS, Sustain
  const carry = pool.find((c) => c.roles.includes('On-Field DPS')) || pool[0];
  if (carry) chosen.push(carry);

  const buffer = pool.find((c) => !chosen.some((x) => x.id === c.id) && c.roles.includes('Buffer/Shred'));
  if (buffer) chosen.push(buffer);

  const subDps = pool.find((c) => !chosen.some((x) => x.id === c.id) && c.roles.includes('Off-Field DPS'));
  if (subDps) chosen.push(subDps);

  const sustain = pool.find((c) => !chosen.some((x) => x.id === c.id) && c.roles.includes('Sustain'));
  if (sustain) chosen.push(sustain);

  // Fill up to 4
  for (const c of pool) {
    if (chosen.length >= 4) break;
    if (!chosen.some((x) => x.id === c.id)) chosen.push(c);
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
 * Finds two completely disjoint teams (TeamA ∩ TeamB = ∅) maximizing chamber shield & mechanic clearance.
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
    return {
      firstHalfTeam: team1,
      secondHalfTeam: team2,
      chamberCoverage: coverage,
      overallScore: Math.max(0, totalScore),
      mechanicCoverageScore: Math.max(0, totalScore),
      cycleId: activeCycle.id,
      warnings: [
        `Roster Shortfall: Floor 12 requires at least 8 distinct characters (4 for First Half, 4 for Second Half). Your roster only has ${ownedChars.length} characters. Showing partial draft.`,
      ],
    };
  }

  // 1. Generate candidate primary teams from full owned roster
  const candidateTeams = generateBestTeams(uniqueOwnedIds, undefined, rosterProfiles);

  interface ScoredPair {
    firstHalfTeam: TeamRecommendation;
    secondHalfTeam: TeamRecommendation;
    coverage: AbyssChamberCoverage[];
    score: number;
  }

  let bestPair: ScoredPair | null = null;

  // Helper to test a pair in both orientations (A=First, B=Second and B=First, A=Second)
  const considerPair = (teamA: TeamRecommendation, teamB: TeamRecommendation) => {
    // Ensure all characters in both teams are strictly owned by the player
    if (
      teamA.members.some((m) => !ownedSet.has(m.id)) ||
      teamB.members.some((m) => !ownedSet.has(m.id))
    ) {
      return;
    }

    // Check strict disjointness
    const teamAIds = new Set(teamA.members.map((m) => m.id));
    if (teamB.members.some((m) => teamAIds.has(m.id))) {
      return;
    }

    // Ensure stepped rotations exist
    if (!teamA.steppedRotation) {
      teamA.steppedRotation = synthesizeTeamRotation(teamA.members);
    }
    if (!teamB.steppedRotation) {
      teamB.steppedRotation = synthesizeTeamRotation(teamB.members);
    }

    // Orientation 1: A on First Half, B on Second Half
    const res1 = evaluateChamberMechanicCoverage(teamA, teamB, activeCycle);
    if (!bestPair || res1.totalScore > bestPair.score) {
      bestPair = {
        firstHalfTeam: teamA,
        secondHalfTeam: teamB,
        coverage: res1.coverage,
        score: res1.totalScore,
      };
    }

    // Orientation 2: B on First Half, A on Second Half
    const res2 = evaluateChamberMechanicCoverage(teamB, teamA, activeCycle);
    if (res2.totalScore > bestPair.score) {
      bestPair = {
        firstHalfTeam: teamB,
        secondHalfTeam: teamA,
        coverage: res2.coverage,
        score: res2.totalScore,
      };
    }
  };

  // 2. Iterate through top candidate teams, and for each, generate secondary candidate teams from remaining roster
  const primaryPool = candidateTeams.slice(0, 8);
  for (const team1 of primaryPool) {
    const team1Ids = new Set(team1.members.map((m) => m.id));
    const remainingChars = ownedChars.filter((c) => !team1Ids.has(c.id));

    if (remainingChars.length >= 4) {
      const remainingIds = remainingChars.map((c) => c.id);
      const secondaryTeams = generateBestTeams(remainingIds);

      if (secondaryTeams.length > 0) {
        for (const team2 of secondaryTeams) {
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
  if (!bestPair) {
    const half1 = ownedChars.slice(0, 4);
    const half2 = ownedChars.slice(4, 8);
    const team1 = buildFallbackTeam(half1, 'abyss-fallback-1', 'First Half Vanguard');
    const team2 = buildFallbackTeam(half2, 'abyss-fallback-2', 'Second Half Rearguard');
    considerPair(team1, team2);

    if (!bestPair) {
      const { coverage, totalScore } = evaluateChamberMechanicCoverage(team1, team2, activeCycle);
      bestPair = {
        firstHalfTeam: team1,
        secondHalfTeam: team2,
        coverage,
        score: totalScore,
      };
    }
  }

  const finalPair: ScoredPair = bestPair;
  return {
    firstHalfTeam: finalPair.firstHalfTeam,
    secondHalfTeam: finalPair.secondHalfTeam,
    chamberCoverage: finalPair.coverage,
    overallScore: Math.max(0, finalPair.score),
    mechanicCoverageScore: Math.max(0, finalPair.score),
    cycleId: activeCycle.id,
  };
}

/**
 * 1-Click Swap Halves: Swaps First Half and Second Half teams and re-evaluates chamber coverage.
 * Guaranteed 0-overlap preservation.
 */
export function swapAbyssDualHalves(
  plan: AbyssDualTeamPlan,
  cycle?: AbyssCycleConfig,
): AbyssDualTeamPlan {
  const swappedFirst = { ...plan.secondHalfTeam };
  const swappedSecond = { ...plan.firstHalfTeam };
  const activeCycle =
    cycle ||
    (plan.cycleId === 'custom-sandbox'
      ? getSavedCustomAbyss()
      : plan.cycleId
      ? ABYSS_CYCLES.find((c) => c.id === plan.cycleId)
      : undefined) ||
    ABYSS_CYCLES[0];

  const { coverage, totalScore } = evaluateChamberMechanicCoverage(
    swappedFirst,
    swappedSecond,
    activeCycle,
  );

  return {
    ...plan,
    firstHalfTeam: swappedFirst,
    secondHalfTeam: swappedSecond,
    chamberCoverage: coverage,
    overallScore: Math.max(0, totalScore),
    mechanicCoverageScore: Math.max(0, totalScore),
  };
}
