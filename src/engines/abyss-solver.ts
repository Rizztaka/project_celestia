import type {
  Character,
  TeamRecommendation,
  AbyssDualTeamPlan,
  AbyssChamberCoverage,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { generateBestTeams } from './team-generator';
import { synthesizeTeamRotation } from './rotation-synthesizer';

const NATLAN_NIGHTSOUL_IDS = new Set([
  'Mavuika',
  'Xilonen',
  'Citlali',
  'Kinich',
  'Chasca',
  'Kachina',
  'Mualani',
  'Ororon',
  'Iansan',
  'Ifa',
  'LanYan',
  'YumemizukiMizuki',
  'Varesa',
  'Ineffa',
  'Escoffier',
  'Dahlia',
  'Skirk',
]);

/**
 * Evaluates Floor 12 chamber mechanic coverage for a First Half and Second Half team pair.
 */
export function evaluateChamberMechanicCoverage(
  teamA: TeamRecommendation,
  teamB: TeamRecommendation,
): { coverage: AbyssChamberCoverage[]; totalScore: number } {
  let score = teamA.synergyScore + teamB.synergyScore;

  // --- Chamber 1 (12-1) ---
  // First Half: Hydro Phantasm (Hydro Immune) -> Wants Pyro, Dendro, Cryo, Electro
  const team1HasNonHydroCounters = teamA.members.some((m) =>
    ['Pyro', 'Dendro', 'Cryo', 'Electro'].includes(m.element),
  );
  const team1PureHydro = teamA.members.every((m) => m.element === 'Hydro');
  const chamber1FirstSatisfied = team1HasNonHydroCounters && !team1PureHydro;
  const chamber1FirstStatus = chamber1FirstSatisfied
    ? 'Counters Hydro Phantasm & Consecrated Beasts with non-Hydro burst'
    : 'Caution: Heavy Hydro reliance against Hydro-immune Phantasms';
  if (chamber1FirstSatisfied) score += 30;

  // Second Half: Pyro Lector -> Rapid Hydro shield breaker required
  const team2HasHydro = teamB.members.some((m) => m.element === 'Hydro');
  const chamber1SecondSatisfied = team2HasHydro;
  const chamber1SecondStatus = chamber1SecondSatisfied
    ? 'Rapid Hydro shield-shredder active for Pyro Lector'
    : 'Warning: Missing Hydro shield-breaker for Pyro Lector';
  if (chamber1SecondSatisfied) score += 60;
  else score -= 100;

  // --- Chamber 2 (12-2) ---
  // First Half: Maguu Kenki Trio -> High AoE & Sustain
  const team1HasSustain = teamA.members.some((m) => m.roles.includes('Sustain'));
  const chamber2FirstSatisfied = team1HasSustain || teamA.synergyScore >= 90;
  const chamber2FirstStatus = chamber2FirstSatisfied
    ? 'High AoE burst & survivability ready for Kenki Trio'
    : 'Caution: Risk of burst damage deaths against Kenki Trio';
  if (chamber2FirstSatisfied) score += 20;

  // Second Half: Aeonblight Drake -> Bow user STRICTLY required
  const team2HasBow = teamB.members.some((m) => m.weapon === 'Bow');
  const chamber2SecondSatisfied = team2HasBow;
  const chamber2SecondStatus = chamber2SecondSatisfied
    ? 'Bow user equipped to disable flying Aeonblight Drake thrusters'
    : 'Critical: No Bow user to ground flying Aeonblight Drake';
  if (chamber2SecondSatisfied) score += 100;
  else score -= 300;

  // --- Chamber 3 (12-3) ---
  // First Half: Natlan Wayob / Automaton -> Nightsoul advantage (300% faster)
  const team1HasNightsoul = teamA.members.some(
    (m) => NATLAN_NIGHTSOUL_IDS.has(m.id) || m.tags.includes('Nightsoul'),
  );
  const chamber3FirstSatisfied = team1HasNightsoul;
  const chamber3FirstStatus = chamber3FirstSatisfied
    ? 'Nightsoul blessing: 300% faster Nightspirit shield break'
    : 'Standard shield break (slower without Natlan units)';
  if (chamber3FirstSatisfied) score += 40;

  // Second Half: Iniquitous Baptist -> Multi-element counters (Electro, Pyro, Cryo shields)
  const team2Elements = new Set(teamB.members.map((m) => m.element));
  const chamber3SecondSatisfied = team2Elements.size >= 3;
  const chamber3SecondStatus = chamber3SecondSatisfied
    ? `Tri-element coverage (${Array.from(team2Elements).join(', ')}) ready for rotating shields`
    : 'Caution: Less than 3 elements against rotating shields';
  if (chamber3SecondSatisfied) score += 40;

  const coverage: AbyssChamberCoverage[] = [
    {
      chamber: 1,
      firstHalfStatus: chamber1FirstStatus,
      secondHalfStatus: chamber1SecondStatus,
      firstHalfSatisfied: chamber1FirstSatisfied,
      secondHalfSatisfied: chamber1SecondSatisfied,
    },
    {
      chamber: 2,
      firstHalfStatus: chamber2FirstStatus,
      secondHalfStatus: chamber2SecondStatus,
      firstHalfSatisfied: chamber2FirstSatisfied,
      secondHalfSatisfied: chamber2SecondSatisfied,
    },
    {
      chamber: 3,
      firstHalfStatus: chamber3FirstStatus,
      secondHalfStatus: chamber3SecondStatus,
      firstHalfSatisfied: chamber3FirstSatisfied,
      secondHalfSatisfied: chamber3SecondSatisfied,
    },
  ];

  return { coverage, totalScore: score };
}

/**
 * Builds a fallback team of 4 characters from available pool when standard archetypes do not match.
 */
function buildFallbackTeam(pool: Character[], teamId: string, teamName: string): TeamRecommendation {
  const chosen: Character[] = [];

  // Try to pick: Carry, Buffer, Sub-DPS, Sustain
  const carry = pool.find((c) => c.roles.includes('On-Field DPS')) || pool[0];
  if (carry) chosen.push(carry);

  const buffer = pool.find((c) => !chosen.includes(c) && c.roles.includes('Buffer/Shred'));
  if (buffer) chosen.push(buffer);

  const subDps = pool.find((c) => !chosen.includes(c) && c.roles.includes('Off-Field DPS'));
  if (subDps) chosen.push(subDps);

  const sustain = pool.find((c) => !chosen.includes(c) && c.roles.includes('Sustain'));
  if (sustain) chosen.push(sustain);

  // Fill up to 4
  for (const c of pool) {
    if (chosen.length >= 4) break;
    if (!chosen.includes(c)) chosen.push(c);
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
    resonance: [],
  };
}

/**
 * Solves the unified Spiral Abyss Floor 12 pairing:
 * Finds two completely disjoint teams (TeamA ∩ TeamB = ∅) maximizing chamber shield & mechanic clearance.
 */
export function solveAbyssDualTeams(ownedIds: string[]): AbyssDualTeamPlan {
  const ownedSet = new Set(ownedIds);
  const ownedChars = CHARACTERS.filter((c) => ownedSet.has(c.id));

  // If player has fewer than 8 characters, gracefully create best-effort teams
  if (ownedChars.length < 8) {
    const half1Chars = ownedChars.slice(0, 4);
    const half2Chars = ownedChars.slice(4, 8);

    const team1 = buildFallbackTeam(half1Chars, 'abyss-half-1', 'Abyss First Half');
    const team2 = buildFallbackTeam(half2Chars, 'abyss-half-2', 'Abyss Second Half');
    const { coverage, totalScore } = evaluateChamberMechanicCoverage(team1, team2);
    return {
      firstHalfTeam: team1,
      secondHalfTeam: team2,
      chamberCoverage: coverage,
      overallScore: Math.max(0, totalScore),
      warnings: [
        `Roster Shortfall: Floor 12 requires at least 8 distinct characters (4 for First Half, 4 for Second Half). Your roster only has ${ownedChars.length} characters. Showing partial draft.`,
      ],
    };
  }

  // 1. Generate candidate primary teams from full owned roster
  const candidateTeams = generateBestTeams(ownedIds);

  interface ScoredPair {
    firstHalfTeam: TeamRecommendation;
    secondHalfTeam: TeamRecommendation;
    coverage: AbyssChamberCoverage[];
    score: number;
  }

  let bestPair: ScoredPair | null = null;

  // Helper to test a pair in both orientations (A=First, B=Second and B=First, A=Second)
  const considerPair = (teamA: TeamRecommendation, teamB: TeamRecommendation) => {
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
    const res1 = evaluateChamberMechanicCoverage(teamA, teamB);
    if (!bestPair || res1.totalScore > bestPair.score) {
      bestPair = {
        firstHalfTeam: teamA,
        secondHalfTeam: teamB,
        coverage: res1.coverage,
        score: res1.totalScore,
      };
    }

    // Orientation 2: B on First Half, A on Second Half
    const res2 = evaluateChamberMechanicCoverage(teamB, teamA);
    if (res2.totalScore > bestPair.score) {
      bestPair = {
        firstHalfTeam: teamB,
        secondHalfTeam: teamA,
        coverage: res2.coverage,
        score: res2.totalScore,
      };
    }
  };

  // 2. Iterate through candidate teams, and for each, generate secondary candidate teams from remaining roster
  for (const team1 of candidateTeams) {
    const team1Ids = new Set(team1.members.map((m) => m.id));
    const remainingIds = ownedIds.filter((id) => !team1Ids.has(id));

    if (remainingIds.length >= 4) {
      const secondaryTeams = generateBestTeams(remainingIds);

      if (secondaryTeams.length > 0) {
        for (const team2 of secondaryTeams) {
          considerPair(team1, team2);
        }
      } else {
        // Fallback team from remaining pool
        const remainingChars = CHARACTERS.filter((c) => remainingIds.includes(c.id));
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
    const { coverage, totalScore } = evaluateChamberMechanicCoverage(team1, team2);
    bestPair = {
      firstHalfTeam: team1,
      secondHalfTeam: team2,
      coverage,
      score: totalScore,
    };
  }

  const finalPair: ScoredPair = bestPair;
  return {
    firstHalfTeam: finalPair.firstHalfTeam,
    secondHalfTeam: finalPair.secondHalfTeam,
    chamberCoverage: finalPair.coverage,
    overallScore: Math.max(0, finalPair.score),
  };
}
