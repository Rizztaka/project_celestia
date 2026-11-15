import type {
  Character,
  TheaterActPlan,
  TheaterDifficulty,
  TheaterSeasonConfig,
  OwnedCharacterProfile,
  BossMatchupRating,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { THEATER_DIFFICULTIES, THEATER_BOSS_INFO } from '../data/theater-seasons';
import { isNightsoulCharacter } from './combat-mechanics';

export interface FilteredTheaterRoster {
  eligible: Character[];
  openingCast: Character[];
  guestCast: Character[];
  alternateCast: Character[];
}

/**
 * Filters the user's owned roster against the current Theater season elements & guest cast.
 */
export function filterEligibleTheaterRoster(
  ownedIds: string[],
  season: TheaterSeasonConfig,
): FilteredTheaterRoster {
  const ownedSet = new Set(ownedIds);
  const seasonElements = new Set(season.elements);
  const guestSet = new Set(season.specialGuestIds);
  const openingSet = new Set(season.openingCastIds);

  const ownedChars = CHARACTERS.filter((c) => ownedSet.has(c.id));

  const openingCast: Character[] = [];
  const guestCast: Character[] = [];
  const alternateCast: Character[] = [];
  const eligible: Character[] = [];

  for (const char of ownedChars) {
    const isOpening = openingSet.has(char.id);
    const isGuest = guestSet.has(char.id);
    const isSeasonElement = seasonElements.has(char.element);

    if (isOpening) {
      openingCast.push(char);
      eligible.push(char);
    } else if (isGuest) {
      guestCast.push(char);
      eligible.push(char);
    } else if (isSeasonElement) {
      alternateCast.push(char);
      eligible.push(char);
    }
  }

  return {
    eligible,
    openingCast,
    guestCast,
    alternateCast,
  };
}

/**
 * Computes remaining vigor (0 to 2) for each character based on usage across acts.
 */
export function calculateVigorState(
  acts: TheaterActPlan[],
  allEligibleIds: string[],
): Record<string, number> {
  const vigor: Record<string, number> = {};
  for (const id of allEligibleIds) {
    vigor[id] = 2;
  }

  for (const act of acts) {
    for (const member of act.team) {
      if (vigor[member.id] === undefined) {
        vigor[member.id] = 2;
      }
      vigor[member.id] = Math.max(0, vigor[member.id] - 1);
    }
  }

  return vigor;
}

export interface TheaterScheduleResult {
  acts: TheaterActPlan[];
  vigorState: Record<string, number>;
  validationErrors: string[];
  shortfallSuggestions?: Character[];
}

/**
 * Auto-drafts an optimal Theater act schedule respecting:
 * 1. Strict 2-Vigor constraint (no character can appear in > 2 acts).
 * 2. Boss Act allocation: Acts 3, 6, 8, 10 prioritize premier carries & buffers tailored to boss mechanics.
 * 3. Shortfall detection with specific character unlock recommendations when roster is deficient.
 * 4. Diversity heuristics preventing identical 4-character team clones across acts.
 */
export function autoDraftTheaterSchedule(
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
  userLocks?: Record<number, string[]>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
): TheaterScheduleResult {
  const diffConfig = THEATER_DIFFICULTIES[difficulty];
  const totalActs = diffConfig.acts;
  const requiredCount = diffConfig.requiredCharacters;
  const bossActSet = new Set(diffConfig.bossActs);

  const validationErrors: string[] = [];
  let shortfallSuggestions: Character[] | undefined;

  if (eligible.length < requiredCount) {
    const deficit = requiredCount - eligible.length;
    validationErrors.push(
      `Roster Shortfall: Selected difficulty "${difficulty}" requires at least ${requiredCount} characters, but your eligible pool only has ${eligible.length}. Need ${deficit} more characters.`,
    );

    const eligibleIdSet = new Set(eligible.map((c) => c.id));
    const seasonElements = new Set(season.elements);
    const guestSet = new Set(season.specialGuestIds);
    const openingSet = new Set(season.openingCastIds);

    const unownedSeasonChars = CHARACTERS.filter(
      (c) =>
        !eligibleIdSet.has(c.id) &&
        (seasonElements.has(c.element) || guestSet.has(c.id) || openingSet.has(c.id)),
    );

    unownedSeasonChars.sort((a, b) => {
      let scoreA = a.rarity === 5 ? 100 : 50;
      if (a.roles.includes('On-Field DPS')) scoreA += 30;
      if (a.roles.includes('Buffer/Shred')) scoreA += 25;
      let scoreB = b.rarity === 5 ? 100 : 50;
      if (b.roles.includes('On-Field DPS')) scoreB += 30;
      if (b.roles.includes('Buffer/Shred')) scoreB += 25;
      return scoreB - scoreA;
    });

    shortfallSuggestions = unownedSeasonChars.slice(0, 6);
  }

  // Character lookup map
  const charMap = new Map<string, Character>();
  for (const c of eligible) {
    charMap.set(c.id, c);
  }

  // Also include any locked characters that might be outside the passed eligible slice
  if (userLocks) {
    for (const ids of Object.values(userLocks)) {
      for (const id of ids) {
        if (!charMap.has(id)) {
          const found = CHARACTERS.find((c) => c.id === id);
          if (found) charMap.set(found.id, found);
        }
      }
    }
  }

  // Initialize vigor tracking
  const vigor: Record<string, number> = {};
  for (const id of charMap.keys()) {
    vigor[id] = 2;
  }

  // Prepare acts array
  const acts: TheaterActPlan[] = [];
  for (let actNum = 1; actNum <= totalActs; actNum++) {
    const isBoss = bossActSet.has(actNum);
    const bossName = isBoss ? season.bosses[actNum] || `Boss Act ${actNum}` : undefined;
    const bossInfo = bossName ? THEATER_BOSS_INFO[bossName] : undefined;

    acts.push({
      actNumber: actNum,
      type: isBoss ? 'Boss' : actNum === 2 || actNum === 5 ? 'Defense' : 'Normal',
      bossName,
      recommendedArchetypes: bossInfo ? bossInfo.recommendedArchetypes : [],
      team: [],
      isLocked: false,
    });
  }

  // 1. Process user locks
  if (userLocks) {
    for (const [actStr, lockedIds] of Object.entries(userLocks)) {
      const actNum = parseInt(actStr, 10);
      const act = acts.find((a) => a.actNumber === actNum);
      if (act) {
        for (const id of lockedIds) {
          const char = charMap.get(id);
          if (char && act.team.length < 4 && (vigor[id] ?? 0) > 0 && !act.team.some((m) => m.id === id)) {
            act.team.push(char);
            vigor[id] = (vigor[id] ?? 0) - 1;
            act.isLocked = true;
          }
        }
      }
    }
  }

  // Sort candidates by initial power level
  const scoreBase = (c: Character): number => {
    let score = c.rarity === 5 ? 100 : 50;
    if (c.roles.includes('On-Field DPS')) score += 30;
    if (c.roles.includes('Buffer/Shred')) score += 25;
    if (c.roles.includes('Off-Field DPS')) score += 20;
    return score;
  };

  // Candidates for auto-drafting are strictly the eligible roster for this season
  const candidates = [...eligible].sort(
    (a, b) => scoreBase(b) - scoreBase(a),
  );

  const usedPairCounts = new Map<string, number>();
  const bossCarriesAssigned = new Set<string>();

  // 2. Draft Boss Acts in descending order (e.g. Acts 10, 8, 6, 3) with specialized counter picks
  const bossActsToSchedule = acts
    .filter((a) => a.type === 'Boss')
    .sort((a, b) => b.actNumber - a.actNumber);

  for (const act of bossActsToSchedule) {
    fillActTeam(act, candidates, vigor, true, usedPairCounts, bossCarriesAssigned, rosterProfiles);
  }

  // 3. Draft Regular Acts descending (e.g. Acts 9, 7, 5, 4, 2, 1) to prioritize harder later stages
  const regularActsToSchedule = acts
    .filter((a) => a.type !== 'Boss')
    .sort((a, b) => b.actNumber - a.actNumber);
  for (const act of regularActsToSchedule) {
    fillActTeam(act, candidates, vigor, false, usedPairCounts, bossCarriesAssigned, rosterProfiles);
  }

  // 4. Anti-cloning safeguard:
  // If sufficient roster exists, verify no two acts have the identical 4-character team.
  if (eligible.length >= 8) {
    for (let i = 0; i < acts.length; i++) {
      if (acts[i].team.length < 4) continue;
      for (let j = 0; j < i; j++) {
        if (acts[j].team.length < 4) continue;
        const setJ = new Set(acts[j].team.map((m) => m.id));
        const isClone = acts[i].team.every((m) => setJ.has(m.id));
        if (isClone) {
          // If both acts are locked by the user, respect user locks and do not mutate
          if (acts[i].isLocked && acts[j].isLocked) continue;

          // Target the act that is not locked by the user
          const targetAct = !acts[i].isLocked ? acts[i] : acts[j];
          const targetSet = new Set(targetAct.team.map((m) => m.id));

          const replacement = candidates.find(
            (c) => !targetSet.has(c.id) && (vigor[c.id] ?? 0) > 0,
          );
          if (replacement) {
            const replaceIdx = targetAct.team.findIndex(
              (m) => !m.roles.includes('On-Field DPS'),
            );
            const targetIdx = replaceIdx !== -1 ? replaceIdx : 3;
            const oldChar = targetAct.team[targetIdx];
            targetAct.team[targetIdx] = replacement;
            vigor[oldChar.id] = (vigor[oldChar.id] ?? 0) + 1;
            vigor[replacement.id] = (vigor[replacement.id] ?? 0) - 1;
          }
        }
      }
    }
  }

  // Attach boss matchup rating for boss acts
  for (const act of acts) {
    if (act.bossName) {
      act.bossMatchup = evaluateBossActMatchup(act.team, act.bossName);
    }
  }

  return {
    acts,
    vigorState: vigor,
    validationErrors,
    shortfallSuggestions,
  };
}

/**
 * Scores a candidate character's suitability for a specific act and role slot.
 */
function scoreCandidateForAct(
  c: Character,
  act: TheaterActPlan,
  isBoss: boolean,
  roleSlot: 'Carry' | 'Buffer' | 'Sustain' | 'Flex',
  alreadyInAct: Character[],
  usedPairCounts: Map<string, number>,
  bossCarriesAssigned: Set<string>,
  currentVigor: number,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
): number {
  let score = c.rarity === 5 ? 80 : 40;

  // Investment bonuses from roster profiles
  if (rosterProfiles && rosterProfiles[c.id]) {
    const prof = rosterProfiles[c.id];
    score += Math.round((prof.level / 90) * 15);
    score += prof.constellation * (c.rarity === 4 ? 4 : 5);
    if (prof.weapon) {
      score += Math.round((prof.weapon.level / 90) * 10);
      score += prof.weapon.refinement * 2;
    }
    // High-investment characters are prioritized for Climax Acts (7+) and Boss acts
    if (isBoss || act.actNumber >= 7) {
      if (prof.constellation >= 2 || prof.level >= 85) {
        score += 25;
      }
    }
  }

  // Role fit
  if (roleSlot === 'Carry') {
    if (c.roles.includes('On-Field DPS')) score += 55;
    else score -= 40;
    // Prefer distinct carries across boss acts so they don't get cloned
    if (isBoss && bossCarriesAssigned.has(c.id)) {
      score -= 65;
    }
  } else if (roleSlot === 'Buffer') {
    if (c.roles.includes('Buffer/Shred')) score += 45;
    else if (c.tags.includes('VV') || c.tags.includes('Cinder-City') || c.tags.includes('Universal-Buffer')) score += 35;
    else if (c.roles.includes('Off-Field DPS')) score += 20;
  } else if (roleSlot === 'Sustain') {
    if (c.roles.includes('Sustain')) score += 50;
    else score -= 15;
  } else {
    // Flex slot
    if (c.roles.includes('Off-Field DPS')) score += 30;
    if (c.roles.includes('Buffer/Shred')) score += 20;
    if (c.roles.includes('Sustain')) score += 15;
  }

  // Boss specific mechanic synergies & weakness targeting
  if (isBoss && act.bossName) {
    const bossInfo = THEATER_BOSS_INFO[act.bossName];
    if (bossInfo) {
      for (const arch of bossInfo.recommendedArchetypes) {
        if (c.tags.some((t) => t.toLowerCase() === arch.toLowerCase() || arch.toLowerCase().includes(t.toLowerCase()))) {
          score += 35;
        }
      }
      const weaknessLower = bossInfo.weakness.toLowerCase();
      const hazardLower = bossInfo.hazard.toLowerCase();

      if (weaknessLower.includes(c.element.toLowerCase())) {
        score += 25;
      }
      if (weaknessLower.includes('nightsoul') && c.tags.includes('Nightsoul')) {
        score += 45;
      }
      if (hazardLower.includes(`${c.element.toLowerCase()} res`) || hazardLower.includes(`${c.element.toLowerCase()} immunity`)) {
        score -= 60;
      }
    }
  }

  // In regular acts, prioritize characters with 2 remaining vigor to utilize full roster
  if (!isBoss && currentVigor === 2) {
    score += 25;
  }

  // Diversity penalty: penalize pairing characters who were already grouped in prior acts
  for (const member of alreadyInAct) {
    const pairKey = [member.id, c.id].sort().join(':');
    const priorShared = usedPairCounts.get(pairKey) || 0;
    if (priorShared > 0) {
      score -= priorShared * 30;
    }
  }

  return score;
}

/**
 * Fills up to 4 members into an Act respecting vigor > 0 and avoiding duplicate characters in the act.
 */
function fillActTeam(
  act: TheaterActPlan,
  candidates: Character[],
  vigor: Record<string, number>,
  isBoss: boolean,
  usedPairCounts: Map<string, number>,
  bossCarriesAssigned: Set<string>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
) {
  if (act.team.length >= 4) return;

  const currentIds = new Set(act.team.map((m) => m.id));

  const needsCarry = !act.team.some((m) => m.roles.includes('On-Field DPS'));
  const needsBuffer = !act.team.some((m) => m.roles.includes('Buffer/Shred'));
  const needsSustain = !act.team.some((m) => m.roles.includes('Sustain'));

  const pickBest = (roleSlot: 'Carry' | 'Buffer' | 'Sustain' | 'Flex'): Character | undefined => {
    let bestChar: Character | undefined;
    let bestScore = -Infinity;

    for (const c of candidates) {
      if (currentIds.has(c.id)) continue;
      const remVigor = vigor[c.id] ?? 0;
      if (remVigor <= 0) continue;

      const score = scoreCandidateForAct(
        c,
        act,
        isBoss,
        roleSlot,
        act.team,
        usedPairCounts,
        bossCarriesAssigned,
        remVigor,
        rosterProfiles,
      );

      if (score > bestScore) {
        bestScore = score;
        bestChar = c;
      }
    }

    return bestChar;
  };

  // 1. Fill Carry
  if (needsCarry && act.team.length < 4) {
    const carry = pickBest('Carry') || pickBest('Flex');
    if (carry) {
      act.team.push(carry);
      currentIds.add(carry.id);
      vigor[carry.id] = (vigor[carry.id] ?? 0) - 1;
      if (isBoss) bossCarriesAssigned.add(carry.id);
    }
  }

  // 2. Fill Buffer
  if (needsBuffer && act.team.length < 4) {
    const buffer = pickBest('Buffer') || pickBest('Flex');
    if (buffer) {
      act.team.push(buffer);
      currentIds.add(buffer.id);
      vigor[buffer.id] = (vigor[buffer.id] ?? 0) - 1;
    }
  }

  // 3. Fill Sustain
  if (needsSustain && act.team.length < 4) {
    const sustain = pickBest('Sustain') || pickBest('Flex');
    if (sustain) {
      act.team.push(sustain);
      currentIds.add(sustain.id);
      vigor[sustain.id] = (vigor[sustain.id] ?? 0) - 1;
    }
  }

  // 4. Fill remaining slots with highest scoring flex
  while (act.team.length < 4) {
    const flex = pickBest('Flex');
    if (!flex) break;
    act.team.push(flex);
    currentIds.add(flex.id);
    vigor[flex.id] = (vigor[flex.id] ?? 0) - 1;
  }

  // Record pair usages
  for (let i = 0; i < act.team.length; i++) {
    for (let j = i + 1; j < act.team.length; j++) {
      const pairKey = [act.team[i].id, act.team[j].id].sort().join(':');
      usedPairCounts.set(pairKey, (usedPairCounts.get(pairKey) || 0) + 1);
    }
  }
}

/**
 * Manually swaps or adds a character in an act.
 * If oldCharId is empty string, adds the new character into an available slot (up to 4 members).
 * Validates vigor availability and ensures no duplicate characters in the act.
 */
export function swapTheaterActMember(
  currentActs: TheaterActPlan[],
  actNumber: number,
  oldCharId: string,
  newCharId: string,
  vigorState: Record<string, number>,
): { acts: TheaterActPlan[]; vigorState: Record<string, number>; error?: string } {
  const actIndex = currentActs.findIndex((a) => a.actNumber === actNumber);
  if (actIndex === -1) {
    return { acts: currentActs, vigorState, error: `Act ${actNumber} not found.` };
  }

  const act = currentActs[actIndex];

  if (act.team.some((m) => m.id === newCharId)) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character is already in Act ${actNumber}.`,
    };
  }

  const availableVigor = vigorState[newCharId] ?? 2;
  if (availableVigor <= 0) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character has 0 vigor remaining and cannot be drafted.`,
    };
  }

  const newChar = CHARACTERS.find((c) => c.id === newCharId);
  if (!newChar) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character ${newCharId} not found in database.`,
    };
  }

  // Adding into an incomplete slot (oldCharId is empty)
  if (!oldCharId) {
    if (act.team.length >= 4) {
      return {
        acts: currentActs,
        vigorState,
        error: `Act ${actNumber} already has maximum 4 members.`,
      };
    }

    const updatedActs = currentActs.map((a, idx) => {
      if (idx !== actIndex) return a;
      return { ...a, team: [...a.team, newChar] };
    });

    const updatedVigor = {
      ...vigorState,
      [newCharId]: Math.max(0, (vigorState[newCharId] ?? 2) - 1),
    };

    return {
      acts: updatedActs,
      vigorState: updatedVigor,
    };
  }

  // Replacing an existing member
  const oldMemberIndex = act.team.findIndex((m) => m.id === oldCharId);
  if (oldMemberIndex === -1) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character ${oldCharId} is not in Act ${actNumber}.`,
    };
  }

  const updatedActs = currentActs.map((a, idx) => {
    if (idx !== actIndex) return a;
    const updatedTeam = [...a.team];
    updatedTeam[oldMemberIndex] = newChar;
    return { ...a, team: updatedTeam };
  });

  const updatedVigor = {
    ...vigorState,
    [oldCharId]: Math.min(2, (vigorState[oldCharId] ?? 1) + 1),
    [newCharId]: Math.max(0, (vigorState[newCharId] ?? 2) - 1),
  };

  return {
    acts: updatedActs,
    vigorState: updatedVigor,
  };
}

/**
 * Removes a character from an act and restores 1 point of vigor.
 */
export function removeTheaterActMember(
  currentActs: TheaterActPlan[],
  actNumber: number,
  charId: string,
  vigorState: Record<string, number>,
): { acts: TheaterActPlan[]; vigorState: Record<string, number>; error?: string } {
  const actIndex = currentActs.findIndex((a) => a.actNumber === actNumber);
  if (actIndex === -1) {
    return { acts: currentActs, vigorState, error: `Act ${actNumber} not found.` };
  }

  const act = currentActs[actIndex];
  const charIndex = act.team.findIndex((m) => m.id === charId);
  if (charIndex === -1) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character ${charId} is not in Act ${actNumber}.`,
    };
  }

  const updatedActs = currentActs.map((a, idx) => {
    if (idx !== actIndex) return a;
    return {
      ...a,
      team: a.team.filter((m) => m.id !== charId),
    };
  });

  const updatedVigor = {
    ...vigorState,
    [charId]: Math.min(2, (vigorState[charId] ?? 1) + 1),
  };

  return {
    acts: updatedActs,
    vigorState: updatedVigor,
  };
}

/**
 * Evaluates clear rating and mechanical suitability of a 4-person team against an apex boss.
 */
export function evaluateBossActMatchup(
  team: Character[],
  bossName: string,
): BossMatchupRating {
  if (!team || team.length === 0) {
    return {
      rating: 'C',
      score: 0,
      reason: 'No characters assigned to this boss encounter.',
      counterHighlights: [],
    };
  }

  const bossInfo = THEATER_BOSS_INFO[bossName];
  let score = 30; // Base baseline
  const highlights: string[] = [];

  const roles = new Set(team.flatMap((m) => m.roles));
  const elements = new Set(team.map((m) => m.element));
  const memberTags = new Set(team.flatMap((m) => m.tags));

  // Role balance
  if (roles.has('On-Field DPS')) {
    score += 20;
    highlights.push('Dedicated Carry');
  } else {
    score -= 10;
  }

  if (roles.has('Buffer/Shred') || roles.has('Off-Field DPS')) {
    score += 15;
    highlights.push('Sub-DPS / Amplification');
  }

  if (roles.has('Sustain')) {
    score += 15;
    highlights.push('Sustain Support');
  }

  // Archetype matching
  if (bossInfo) {
    for (const arch of bossInfo.recommendedArchetypes) {
      if (memberTags.has(arch)) {
        score += 10;
        highlights.push(`${arch} Archetype Match`);
      }
    }
  }

  // Boss-specific mechanics
  if (bossName === 'Centaur Automaton') {
    const hasNightsoul = team.some((m) => isNightsoulCharacter(m));
    if (hasNightsoul) {
      score += 30;
      highlights.push('Natlan Nightsoul Node Breaker (+300% speed)');
    } else {
      score -= 15;
    }
  } else if (bossName === 'Jadeplume Terrorshroom') {
    const hasElectro = elements.has('Electro');
    const carry = team.find((m) => m.roles.includes('On-Field DPS'));
    const isCarryDendro = carry && carry.element === 'Dendro';

    if (hasElectro) {
      score += 25;
      highlights.push('Electro Activated State Stunner');
    } else {
      score -= 15;
    }
    if (isCarryDendro) {
      score -= 30;
      highlights.push('Warning: Dendro Carry Faces 80% Dendro RES');
    }
    if (team.every((m) => m.element === 'Dendro')) {
      score -= 40;
    }
  } else if (bossName === 'Icewind Suite: Coppelia') {
    const hasPyroOrMelt = elements.has('Pyro') || memberTags.has('Melt');
    if (hasPyroOrMelt) {
      score += 25;
      highlights.push('Pyro Shield Disruption');
    }
  } else if (bossName === 'Maguu Kenki') {
    const hasHighSustain = team.some((m) => m.roles.includes('Sustain'));
    if (hasHighSustain) {
      score += 20;
      highlights.push('High Resilience vs Melee Slashes');
    }
  } else if (bossName === 'Millennial Pearl Seahorse') {
    const hasBreakers = elements.has('Pyro') || elements.has('Cryo') || elements.has('Dendro');
    const carry = team.find((m) => m.roles.includes('On-Field DPS'));
    const isCarryElectro = carry && carry.element === 'Electro';

    if (hasBreakers) {
      score += 25;
      highlights.push('Pearl Shatterer (Pyro/Cryo/Dendro)');
    } else {
      score -= 25;
    }
    if (isCarryElectro && !hasBreakers) {
      score -= 35;
      highlights.push('Warning: Electro Carry Without Shield Breakers');
    }
    if (team.every((m) => m.element === 'Electro')) {
      score -= 40;
    }
  } else if (bossName === 'Algorithm of Semi-Intransient Matrix') {
    const hasQuickenOrElectro = elements.has('Electro') || (elements.has('Dendro') && elements.has('Electro'));
    if (hasQuickenOrElectro) {
      score += 30;
      highlights.push('Catalyze/Electro Stealth Breaker');
    } else {
      score -= 20;
    }
  } else if (bossName === 'Iniquitous Baptist') {
    if (elements.size >= 3) {
      score += 25;
      highlights.push('Rainbow Multi-Shield Counter');
    } else {
      score -= 20;
    }
  } else if (bossName === 'Hydro Tulpa') {
    const hasReaction = elements.has('Pyro') || elements.has('Dendro') || elements.has('Electro');
    const carry = team.find((m) => m.roles.includes('On-Field DPS'));
    const isCarryHydro = carry && carry.element === 'Hydro';
    const hasNonHydroDps = team.some(
      (m) => (m.roles.includes('On-Field DPS') || m.roles.includes('Off-Field DPS')) && m.element !== 'Hydro',
    );

    if (hasReaction) {
      score += 25;
      highlights.push('Forward Reaction Trigger (Vape/Bloom)');
    }
    if (isCarryHydro && !hasNonHydroDps) {
      score -= 50;
      highlights.push('Critical: Hydro Carry Deals 0 DMG to Immune Tulpa');
    }
    if (team.every((m) => m.element === 'Hydro')) {
      score -= 60;
    }
  }

  score = Math.max(10, Math.min(100, score));

  let rating: 'S' | 'A' | 'B' | 'C';
  let reason: string;

  if (score >= 85) {
    rating = 'S';
    reason = 'Optimal counters & burst: Perfect mechanical synergy and elemental counters.';
  } else if (score >= 65) {
    rating = 'A';
    reason = 'Solid counters: Capable of handling boss mechanics with adequate survivability.';
  } else if (score >= 45) {
    rating = 'B';
    reason = 'Passable: Can clear, but lacks optimal elemental or defensive counters.';
  } else {
    rating = 'C';
    reason = 'Struggles with mechanics: Missing key counters or role requirements.';
  }

  return {
    rating,
    score,
    reason,
    counterHighlights: Array.from(new Set(highlights)),
  };
}

/**
 * Recommends top 3 support cast characters to borrow from friends.
 * Feasibility Rule: Suggests ONLY characters the player does NOT currently own,
 * who strictly match the active season's element or guest cast.
 */
export function recommendSupportCastBorrow(
  eligible: Character[],
  season: TheaterSeasonConfig,
  ownedIds?: string[],
): Character[] {
  const ownedSet = new Set(ownedIds ?? eligible.map((c) => c.id));
  const seasonElements = new Set(season.elements);
  const guestSet = new Set(season.specialGuestIds);
  const openingSet = new Set(season.openingCastIds);

  // Candidates: characters NOT owned, but eligible by element, guest status, or opening cast
  const candidates = CHARACTERS.filter((c) => {
    if (ownedSet.has(c.id)) return false;
    return seasonElements.has(c.element) || guestSet.has(c.id) || openingSet.has(c.id);
  });

  if (candidates.length === 0) return [];

  // Identify apex boss for the season (Act 10 or highest act boss)
  const bossActs = Object.keys(season.bosses).map(Number).sort((a, b) => b - a);
  const apexBossAct = bossActs[0];
  const apexBossName = apexBossAct ? season.bosses[apexBossAct] : undefined;

  const scoredCandidates = candidates.map((char) => {
    let value = 0;

    // 5-star priority
    if (char.rarity === 5) value += 30;

    // Key roles
    if (char.roles.includes('On-Field DPS')) value += 30;
    if (char.roles.includes('Buffer/Shred')) value += 35;
    if (char.roles.includes('Sustain')) value += 20;

    // Premier meta supports & carries
    const premierIds = new Set([
      'Furina',
      'Mavuika',
      'Xilonen',
      'KaedeharaKazuha',
      'Nahida',
      'Bennett',
      'Zhongli',
      'Neuvillette',
      'Arlecchino',
      'Citlali',
      'Chasca',
      'Kinich',
      'RaidenShogun',
      'Yelan',
    ]);
    if (premierIds.has(char.id)) value += 40;

    // Nightsoul bonus for Natlan bosses (e.g. Centaur Automaton)
    if (apexBossName === 'Centaur Automaton' && isNightsoulCharacter(char)) {
      value += 40;
    }

    // Boss weakness matching
    if (apexBossName) {
      const bossInfo = THEATER_BOSS_INFO[apexBossName];
      if (bossInfo) {
        for (const arch of bossInfo.recommendedArchetypes) {
          if (char.tags.includes(arch)) value += 15;
        }
      }
    }

    return { char, value };
  });

  scoredCandidates.sort((a, b) => b.value - a.value);
  return scoredCandidates.slice(0, 3).map((item) => item.char);
}
