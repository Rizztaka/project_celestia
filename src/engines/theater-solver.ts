import type {
  Character,
  TheaterActPlan,
  TheaterDifficulty,
  TheaterSeasonConfig,
  TheaterSeasonAnalysis,
  TheaterPreservationEntry,
  TheaterDraftStep,
  OwnedCharacterProfile,
  BossMatchupRating,
  RecommendationCollection,
  RecommendationExecutionContext,
  RecommendationReliability,
} from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { THEATER_DIFFICULTIES, THEATER_BOSS_INFO } from '../data/theater-seasons';
import { isNightsoulCharacter } from './combat-mechanics';
import { isSameCharacterOrTraveler } from './team-rules';
import {
  evaluateEngineBoundaryReliability,
  evaluateScheduledEngineReliability,
  type UnattestedLocalDependency,
} from '../services/engine-reliability';

export interface FilteredTheaterRoster {
  eligible: Character[];
  openingCast: Character[];
  guestCast: Character[];
  alternateCast: Character[];
  excludedUnderleveled?: Character[];
}

/**
 * Filters the user's owned roster against the current Theater season elements & guest cast.
 * Incorporates all 6 Opening Cast members as Level 80 trial units (or uses player's profile
 * if owned at Lv 80+), enforces Level 70 minimum for alternate cast in Hard/Visionary mode,
 * reports excluded underleveled characters, and unifies Traveler configurations.
 */
export function filterEligibleTheaterRoster(
  ownedIds: string[],
  season: TheaterSeasonConfig,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  difficulty?: TheaterDifficulty,
): FilteredTheaterRoster {
  const ownedSet = new Set(ownedIds);
  const seasonElements = new Set(season.elements);
  const guestSet = new Set(season.specialGuestIds);
  const openingSet = new Set(season.openingCastIds);

  const openingCast: Character[] = [];
  const guestCast: Character[] = [];
  const alternateCast: Character[] = [];
  const eligible: Character[] = [];
  const excludedUnderleveled: Character[] = [];

  // 1. Opening Cast (Trial + Owned Hybrid)
  for (const openingId of season.openingCastIds) {
    const baseChar = CHARACTERS.find((c) => c.id === openingId);
    if (!baseChar) continue;

    const isOwned = ownedSet.has(openingId);
    const profile = rosterProfiles?.[openingId];

    const useTrial = !isOwned || (profile !== undefined && profile.level < 80);
    const char: Character = {
      ...baseChar,
      isOwned,
      isTrial: useTrial,
      level: useTrial ? 80 : (profile?.level ?? 90),
      constellation: useTrial ? 0 : (profile?.constellation ?? 0),
    };

    openingCast.push(char);
    eligible.push(char);
  }

  // 2. Alternate Cast & Special Guests from player's owned roster
  const ownedChars = CHARACTERS.filter((c) => ownedSet.has(c.id));
  const minLevelRequired = difficulty === 'Hard' || difficulty === 'Visionary' ? 70 : 0;

  const travelerCandidates = ownedChars.filter((c) => {
    if (!isSameCharacterOrTraveler(c, 'TravelerAnemo')) return false;
    return guestSet.has(c.id) || seasonElements.has(c.element);
  });
  const bestTravelerId = travelerCandidates.sort((a, b) => {
    const profA = rosterProfiles?.[a.id];
    const profB = rosterProfiles?.[b.id];
    const scoreA = (profA?.level ?? a.level ?? 90) * 10 + (profA?.constellation ?? a.constellation ?? 0);
    const scoreB = (profB?.level ?? b.level ?? 90) * 10 + (profB?.constellation ?? b.constellation ?? 0);
    return scoreB - scoreA;
  })[0]?.id;

  for (const char of ownedChars) {
    if (openingSet.has(char.id)) continue;

    const isGuest = guestSet.has(char.id);
    const isSeasonElement = seasonElements.has(char.element);
    if (!isGuest && !isSeasonElement) continue;

    const charLevel = rosterProfiles?.[char.id]?.level ?? char.level;
    if (minLevelRequired > 0 && charLevel !== undefined && charLevel < minLevelRequired) {
      excludedUnderleveled.push({ ...char, level: charLevel });
      continue;
    }

    if (isSameCharacterOrTraveler(char, 'TravelerAnemo')) {
      if (char.id !== bestTravelerId || eligible.some((e) => isSameCharacterOrTraveler(e, char))) {
        continue;
      }
    } else if (eligible.some((e) => isSameCharacterOrTraveler(e, char))) {
      continue;
    }

    const profile = rosterProfiles?.[char.id];
    const qualifiedChar: Character = {
      ...char,
      isOwned: true,
      isTrial: false,
      level: profile?.level ?? char.level ?? 90,
      constellation: profile?.constellation ?? char.constellation ?? 0,
    };

    if (isGuest) {
      guestCast.push(qualifiedChar);
      eligible.push(qualifiedChar);
    } else if (isSeasonElement) {
      alternateCast.push(qualifiedChar);
      eligible.push(qualifiedChar);
    }
  }

  return {
    eligible,
    openingCast,
    guestCast,
    alternateCast,
    excludedUnderleveled,
  };
}

/**
 * Computes remaining vigor (0 to 2) for each character based on usage across acts.
 * Unifies Traveler configurations so drafting any Traveler element deducts vigor from all Travelers.
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
      for (const id of Object.keys(vigor)) {
        if (isSameCharacterOrTraveler(id, member.id)) {
          vigor[id] = Math.max(0, vigor[id] - 1);
        }
      }
    }
  }

  return vigor;
}

export interface TheaterScheduleResult {
  acts: TheaterActPlan[];
  vigorState: Record<string, number>;
  validationErrors: string[];
  shortfallSuggestions?: Character[];
  seasonAnalysis?: TheaterSeasonAnalysis;
  reliability: RecommendationReliability;
}

const THEATER_PLAN_UNATTESTED_DEPS: readonly UnattestedLocalDependency[] = [
  { name: 'THEATER_BOSS_INFO', sourceFile: 'src/data/theater-seasons.ts' },
  { name: 'THEATER_DIFFICULTIES', sourceFile: 'src/data/theater-seasons.ts' },
];

const THEATER_BORROW_UNATTESTED_DEPS: readonly UnattestedLocalDependency[] = [
  { name: 'THEATER_BOSS_INFO', sourceFile: 'src/data/theater-seasons.ts' },
];

function isCustomTheaterSeason(season: TheaterSeasonConfig): boolean {
  return season.id === 'custom-theater-sandbox' || season.id.startsWith('custom-');
}

/**
 * Evaluates Theater reliability at the public engine boundary.
 * - Custom Theater seasons use `sandbox_simulation` mode with the dedicated provisional
 *   `'custom-theater-sandbox'` marker and `'characters_v7_2_batch7'`, without reusing
 *   Abyss's `'custom-sandbox'`, without a canonical schedule object, and without synthetic
 *   `custom-*` season IDs.
 * - Canonical Theater seasons resolve mode via `evaluateScheduledEngineReliability()`.
 * - Unknown non-custom season IDs remain unregistered and resolve to `unsupported`.
 * - Unattested local static tables (`THEATER_BOSS_INFO`, and `THEATER_DIFFICULTIES` for
 *   draft/season analysis) are declared so active-season recommendations remain `qualified`
 *   and non-actionable until those tables receive provenance attestation.
 */
function evaluateTheaterReliability(
  season: TheaterSeasonConfig,
  unattestedLocalDependencies: readonly UnattestedLocalDependency[],
  executionContext?: RecommendationExecutionContext,
): RecommendationReliability {
  if (isCustomTheaterSeason(season)) {
    return evaluateEngineBoundaryReliability({
      mode: 'sandbox_simulation',
      requiredDatasetIds: ['characters_v7_2_batch7', 'custom-theater-sandbox'],
      unattestedLocalDependencies,
      executionContext,
    });
  }

  return evaluateScheduledEngineReliability({
    schedule: { type: 'theater', entityId: season.id },
    entityVersion: season.version,
    requiredDatasetIds: ['characters_v7_2_batch7', season.id],
    unattestedLocalDependencies,
    executionContext,
  });
}

/**
 * Internal season-plan computation without reliability evaluation so `autoDraftTheaterSchedule`
 * evaluates reliability once and guarantees identical reliability metadata on both
 * `TheaterScheduleResult` and `TheaterSeasonAnalysis`.
 */
function computeTheaterSeasonPlanInternal(
  acts: TheaterActPlan[],
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
): Omit<TheaterSeasonAnalysis, 'reliability'> {
  const diffConfig = THEATER_DIFFICULTIES[difficulty];
  const bossActs = [...diffConfig.bossActs].sort((a, b) => a - b);
  const apexBossAct = bossActs[bossActs.length - 1];
  const apexActPlan = acts.find((a) => a.actNumber === apexBossAct);
  const apexBossName = apexActPlan?.bossName ?? (apexBossAct ? season.bosses[apexBossAct] : undefined);
  const apexBossInfo = apexBossName ? THEATER_BOSS_INFO[apexBossName] : undefined;

  const apexRating = apexActPlan?.bossMatchup?.rating;
  const apexBossReadiness: 'Ready' | 'Needs Preparation' | 'At Risk' =
    !apexActPlan || apexActPlan.team.length < 4 || apexRating === 'C'
      ? 'At Risk'
      : apexRating === 'S' || apexRating === 'A'
        ? 'Ready'
        : 'Needs Preparation';

  const apexBossSummary = apexBossName
    ? apexBossReadiness === 'Ready'
      ? `Act ${apexBossAct} (${apexBossName}) is covered (${apexRating}-Rank): ${apexActPlan?.bossMatchup?.counterHighlights.slice(0, 3).join(', ') || 'balanced carry core'}.`
      : `Act ${apexBossAct} (${apexBossName}) needs attention: ${apexBossInfo?.preservationNote ?? apexBossInfo?.weakness ?? 'Reserve your top carry and sustain.'}`
    : 'No apex boss configured for this season.';

  // 1. Recommended archetypes derived from boss requirements + season elements
  const archetypeSet = new Set<string>();
  for (const bAct of bossActs) {
    const bName = season.bosses[bAct];
    const bInfo = bName ? THEATER_BOSS_INFO[bName] : undefined;
    for (const arch of bInfo?.recommendedArchetypes ?? []) {
      archetypeSet.add(arch);
    }
  }
  const elSet = new Set(season.elements);
  if (elSet.has('Hydro') && elSet.has('Electro')) archetypeSet.add('Electro-Charged / Lunar-Charged');
  if (elSet.has('Hydro') && elSet.has('Pyro')) archetypeSet.add('Vaporize');
  if (elSet.has('Hydro') && elSet.has('Dendro')) archetypeSet.add('Bloom / Hyperbloom');
  if (elSet.has('Electro') && elSet.has('Dendro')) archetypeSet.add('Quicken / Aggravate');
  if (elSet.has('Geo')) archetypeSet.add('Crystallize / Lunar-Crystallize');

  // 2. Roster weakness audit
  const rosterWeaknesses: string[] = [];
  const carries = eligible.filter((c) => c.roles.includes('On-Field DPS'));
  const sustains = eligible.filter((c) => c.roles.includes('Sustain'));
  const buffers = eligible.filter((c) => c.roles.includes('Buffer/Shred'));

  if (carries.length < bossActs.length) {
    rosterWeaknesses.push(
      `Low Carry Depth: Only ${carries.length} On-Field DPS for ${bossActs.length} boss acts (risk of vigor exhaustion).`,
    );
  }
  const minSustains = difficulty === 'Visionary' ? 3 : 2;
  if (sustains.length < minSustains) {
    rosterWeaknesses.push(
      `Thin Sustain Pool: Only ${sustains.length} Sustain unit(s) available; defensive chambers and climax bosses may be punishing.`,
    );
  }
  if (buffers.length < 2) {
    rosterWeaknesses.push('Limited Buff/Shred Support: Consider borrowing a premier buffer from Support Cast.');
  }

  for (const bAct of bossActs) {
    const bName = season.bosses[bAct];
    const bInfo = bName ? THEATER_BOSS_INFO[bName] : undefined;
    if (!bInfo) continue;

    if (bInfo.immuneElements && bInfo.immuneElements.length > 0) {
      const nonImmuneCarries = carries.filter((c) => !bInfo.immuneElements!.includes(c.element));
      if (nonImmuneCarries.length === 0) {
        rosterWeaknesses.push(
          `Act ${bAct} (${bName}): No non-${bInfo.immuneElements.join('/')} On-Field DPS in eligible pool.`,
        );
      }
    }
    if (bInfo.requiresNightsoul && !eligible.some((c) => isNightsoulCharacter(c))) {
      rosterWeaknesses.push(
        `Act ${bAct} (${bName}): No Natlan Nightsoul unit in pool; pillar phase will clear slower.`,
      );
    }
    if (bInfo.counterElements && bInfo.counterElements.length > 0) {
      const hasCounter = eligible.some((c) => bInfo.counterElements!.includes(c.element));
      if (!hasCounter) {
        rosterWeaknesses.push(
          `Act ${bAct} (${bName}): Missing ${bInfo.counterElements.join('/')} counter element.`,
        );
      }
    }
  }

  // 3. Preservation plan: map characters drafted into mid/late boss acts (Act 6+)
  const preservationMap = new Map<string, TheaterPreservationEntry>();
  const lateBossActs = acts.filter((a) => a.type === 'Boss' && a.actNumber >= 6);

  for (const act of lateBossActs) {
    const bInfo = act.bossName ? THEATER_BOSS_INFO[act.bossName] : undefined;
    for (const member of act.team) {
      const isApex = act.actNumber === apexBossAct;
      const isKeyRole =
        member.roles.includes('On-Field DPS') ||
        member.roles.includes('Buffer/Shred') ||
        (bInfo?.counterElements?.includes(member.element) ?? false) ||
        (Boolean(bInfo?.requiresNightsoul) && isNightsoulCharacter(member));

      if (!isKeyRole && !isApex) continue;

      const existing = preservationMap.get(member.id);
      if (existing) {
        if (!existing.reservedForActs.includes(act.actNumber)) {
          existing.reservedForActs.push(act.actNumber);
        }
        if (isApex) existing.priority = 'Critical';
      } else {
        const priority: 'Critical' | 'High' | 'Flexible' = isApex
          ? 'Critical'
          : member.roles.includes('On-Field DPS')
            ? 'High'
            : 'Flexible';
        const roleTag = member.roles[0] ?? 'Flex';
        preservationMap.set(member.id, {
          characterId: member.id,
          characterName: member.name,
          element: member.element,
          reservedForActs: [act.actNumber],
          reason: `Reserve ${roleTag} vigor for Act ${act.actNumber}${act.bossName ? ` (${act.bossName})` : ''}${bInfo?.preservationNote ? ` — ${bInfo.preservationNote}` : ''}`,
          priority,
        });
      }
    }
  }

  const priorityRank = { Critical: 0, High: 1, Flexible: 2 };
  const preservationPlan = Array.from(preservationMap.values())
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .slice(0, 8);

  // 4. Phased practical draft plan
  const draftPlan: TheaterDraftStep[] = [];
  const openingNames = season.openingCastIds.slice(0, 6);

  draftPlan.push({
    phase: 'Opening',
    targetActs: [1],
    guidance:
      'Start with your 6 Opening Cast units. Spend Fantasia Flowers on Character Companion invites before Act 3 so you expand your roster without burning late-boss vigor.',
    recommendedRecruits: openingNames,
    preserveCharacterIds: preservationPlan
      .filter((p) => p.priority === 'Critical')
      .map((p) => p.characterId),
  });

  const act3 = acts.find((a) => a.actNumber === 3);
  draftPlan.push({
    phase: 'Early Acts (1–3)',
    targetActs: [1, 2, 3],
    guidance: `Use Opening Cast + lower-investment flex units on Acts 1–2. Deploy ${act3?.team.map((m) => m.name).join(', ') || 'your Act 3 squad'} against ${act3?.bossName ?? 'Act 3 Boss'}.`,
    recommendedRecruits: (act3?.team ?? []).map((m) => m.name),
    preserveCharacterIds: preservationPlan
      .filter((p) => p.reservedForActs.some((n) => n >= 6))
      .map((p) => p.characterId),
  });

  const act6 = acts.find((a) => a.actNumber === 6);
  if (diffConfig.acts >= 6) {
    draftPlan.push({
      phase: 'Mid Acts (4–6)',
      targetActs: [4, 5, 6],
      guidance: `Prioritize recruiting counters for ${act6?.bossName ?? 'Act 6 Boss'} and pick up Tier 1–2 Brilliant Blessings matching ${season.elements.join('/')} reactions.`,
      recommendedRecruits: (act6?.team ?? []).map((m) => m.name),
      preserveCharacterIds: preservationPlan
        .filter((p) => p.reservedForActs.some((n) => n >= 8))
        .map((p) => p.characterId),
    });
  }

  const act8 = acts.find((a) => a.actNumber === 8);
  if (diffConfig.acts >= 8) {
    draftPlan.push({
      phase: 'Late Acts (7–8)',
      targetActs: [7, 8],
      guidance: `Clear Act 7 with remaining flex supports and deploy ${act8?.team.map((m) => m.name).join(', ') || 'your Act 8 boss counter squad'} for ${act8?.bossName ?? 'Act 8 Boss'} while keeping Act 10 vigor intact.`,
      recommendedRecruits: (act8?.team ?? []).map((m) => m.name),
      preserveCharacterIds: preservationPlan
        .filter((p) => p.reservedForActs.includes(10))
        .map((p) => p.characterId),
    });
  }

  const act10 = acts.find((a) => a.actNumber === 10);
  if (diffConfig.acts >= 10) {
    draftPlan.push({
      phase: 'Climax (9–10)',
      targetActs: [9, 10],
      guidance: `Spend leftover vigor on Act 9, then unleash your preserved climax team (${act10?.team.map((m) => m.name).join(', ') || 'apex squad'}) with max reaction blessings against ${act10?.bossName ?? 'Act 10 Boss'}.`,
      recommendedRecruits: (act10?.team ?? []).map((m) => m.name),
      preserveCharacterIds: [],
    });
  }

  return {
    seasonId: season.id,
    apexBossName,
    apexBossAct,
    apexBossReadiness,
    apexBossSummary,
    recommendedArchetypes: Array.from(archetypeSet).slice(0, 6),
    rosterWeaknesses,
    preservationPlan,
    draftPlan,
  };
}

/**
 * Builds an actionable preservation plan, apex boss readiness audit, roster weakness list,
 * recommended archetypes, and phased draft plan for the current Theater schedule.
 */
export function analyzeTheaterSeasonPlan(
  acts: TheaterActPlan[],
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
  executionContext?: RecommendationExecutionContext,
): TheaterSeasonAnalysis {
  const analysis = computeTheaterSeasonPlanInternal(acts, eligible, difficulty, season);
  const reliability = evaluateTheaterReliability(
    season,
    THEATER_PLAN_UNATTESTED_DEPS,
    executionContext,
  );
  return { ...analysis, reliability };
}

/**
 * Auto-drafts an optimal Theater act schedule respecting:
 * 1. Strict 2-Vigor constraint (no character can appear in > 2 acts).
 * 2. Boss Act allocation: Acts 3, 6, 8, 10 prioritize premier carries & buffers tailored to boss mechanics.
 * 3. Shortfall detection with specific character unlock recommendations when roster is deficient.
 * 4. Diversity heuristics preventing identical 4-character team clones across acts.
 * 5. Season analysis including preservation plan, apex boss readiness, weaknesses, and phased draft plan.
 */
export function autoDraftTheaterSchedule(
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
  userLocks?: Record<number, string[]>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  executionContext?: RecommendationExecutionContext,
): TheaterScheduleResult {
  const reliability = evaluateTheaterReliability(
    season,
    THEATER_PLAN_UNATTESTED_DEPS,
    executionContext,
  );
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

  const charMap = new Map<string, Character>();
  for (const c of eligible) {
    charMap.set(c.id, c);
  }

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

  const vigor: Record<string, number> = {};
  for (const id of charMap.keys()) {
    vigor[id] = 2;
  }

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
      strategyNote: bossInfo?.preservationNote,
    });
  }

  // 1. Process user locks (flag vigor overflow explicitly)
  if (userLocks) {
    for (const [actStr, lockedIds] of Object.entries(userLocks)) {
      const actNum = parseInt(actStr, 10);
      const act = acts.find((a) => a.actNumber === actNum);
      if (act) {
        for (const id of lockedIds) {
          const char = charMap.get(id);
          if (!char) continue;
          if ((vigor[id] ?? 0) <= 0) {
            validationErrors.push(
              `Lock Conflict: ${char.name} has 0 vigor left and could not be locked into Act ${actNum}.`,
            );
            continue;
          }
          if (
            act.team.length < 4 &&
            !act.team.some((m) => isSameCharacterOrTraveler(m, char))
          ) {
            act.team.push(char);
            deductCharacterVigor(vigor, id);
            act.isLocked = true;
          }
        }
      }
    }
  }

  const scoreBase = (c: Character): number => {
    let score = c.rarity === 5 ? 100 : 50;
    if (c.roles.includes('On-Field DPS')) score += 30;
    if (c.roles.includes('Buffer/Shred')) score += 25;
    if (c.roles.includes('Off-Field DPS')) score += 20;
    return score;
  };

  const candidates = [...eligible].sort((a, b) => scoreBase(b) - scoreBase(a));
  const usedPairCounts = new Map<string, number>();
  const bossCarriesAssigned = new Set<string>();
  const openingSet = new Set(season.openingCastIds);

  const maxPlayableActs = Math.min(totalActs, Math.floor((eligible.length * 2) / 4));
  const playableActs = acts.filter((a) => a.actNumber <= maxPlayableActs);

  if (eligible.length < requiredCount) {
    const act1 = playableActs.find((a) => a.actNumber === 1);
    if (act1 && !act1.isLocked && act1.team.length < 4) {
      const openingCandidates = candidates.filter((c) => openingSet.has(c.id));
      const remActs = playableActs.filter((a) => a.team.length < 4).length;
      fillActTeam(
        act1,
        openingCandidates.length >= 4 ? openingCandidates : candidates,
        vigor,
        false,
        usedPairCounts,
        bossCarriesAssigned,
        rosterProfiles,
        remActs,
      );
      if (act1.team.length < 4) {
        fillActTeam(
          act1,
          candidates,
          vigor,
          false,
          usedPairCounts,
          bossCarriesAssigned,
          rosterProfiles,
          playableActs.filter((a) => a.team.length < 4).length,
        );
      }
    }

    const bossActsToSchedule = playableActs
      .filter((a) => a.type === 'Boss' && a.actNumber !== 1)
      .sort((a, b) => b.actNumber - a.actNumber);
    for (const act of bossActsToSchedule) {
      const remActs = playableActs.filter((a) => a.team.length < 4).length;
      fillActTeam(act, candidates, vigor, true, usedPairCounts, bossCarriesAssigned, rosterProfiles, remActs);
    }

    const regularActsToSchedule = playableActs
      .filter((a) => a.type !== 'Boss' && a.actNumber !== 1)
      .sort((a, b) => b.actNumber - a.actNumber);
    for (const act of regularActsToSchedule) {
      const remActs = playableActs.filter((a) => a.team.length < 4).length;
      fillActTeam(act, candidates, vigor, false, usedPairCounts, bossCarriesAssigned, rosterProfiles, remActs);
    }
  } else {
    // 1. Draft Boss Acts descending (Acts 10 -> 8 -> 6 -> 3) to preserve apex boss counters
    const bossActsToSchedule = acts
      .filter((a) => a.type === 'Boss')
      .sort((a, b) => b.actNumber - a.actNumber);
    for (const act of bossActsToSchedule) {
      const remActs = acts.filter((a) => a.team.length < 4).length;
      fillActTeam(act, candidates, vigor, true, usedPairCounts, bossCarriesAssigned, rosterProfiles, remActs);
    }

    // 2. Draft Act 1 from Opening Cast
    const act1 = acts.find((a) => a.actNumber === 1);
    if (act1 && !act1.isLocked && act1.team.length < 4) {
      const openingCandidates = candidates.filter((c) => openingSet.has(c.id));
      const remActs = acts.filter((a) => a.team.length < 4).length;
      fillActTeam(act1, openingCandidates, vigor, false, usedPairCounts, bossCarriesAssigned, rosterProfiles, remActs);
      if (act1.team.length < 4) {
        fillActTeam(
          act1,
          candidates,
          vigor,
          false,
          usedPairCounts,
          bossCarriesAssigned,
          rosterProfiles,
          acts.filter((a) => a.team.length < 4).length,
        );
      }
    }

    // 3. Draft Regular Acts descending
    const regularActsToSchedule = acts
      .filter((a) => a.type !== 'Boss' && a.actNumber !== 1)
      .sort((a, b) => b.actNumber - a.actNumber);
    for (const act of regularActsToSchedule) {
      const remActs = acts.filter((a) => a.team.length < 4).length;
      fillActTeam(act, candidates, vigor, false, usedPairCounts, bossCarriesAssigned, rosterProfiles, remActs);
    }
  }

  // 4. Anti-cloning safeguard
  if (eligible.length >= 8) {
    for (let i = 0; i < acts.length; i++) {
      if (acts[i].team.length < 4) continue;
      for (let j = 0; j < i; j++) {
        if (acts[j].team.length < 4) continue;
        const setJ = new Set(acts[j].team.map((m) => m.id));
        const isClone = acts[i].team.every((m) => setJ.has(m.id));
        if (isClone) {
          if (acts[i].isLocked && acts[j].isLocked) continue;

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
            restoreCharacterVigor(vigor, oldChar.id);
            deductCharacterVigor(vigor, replacement.id);
          }
        }
      }
    }
  }

  // Attach boss matchup rating and preserved-carry markers
  for (const act of acts) {
    if (act.bossName) {
      act.bossMatchup = evaluateBossActMatchup(act.team, act.bossName);
      if (act.actNumber >= 6) {
        act.preservedCarriesUsed = act.team
          .filter((m) => m.roles.includes('On-Field DPS') || m.roles.includes('Buffer/Shred'))
          .map((m) => m.id);
      }
    }
  }

  const seasonAnalysis: TheaterSeasonAnalysis = {
    ...computeTheaterSeasonPlanInternal(acts, eligible, difficulty, season),
    reliability,
  };

  return {
    acts,
    vigorState: vigor,
    validationErrors,
    shortfallSuggestions,
    seasonAnalysis,
    reliability,
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
  remainingUnfilledActs?: number,
): number {
  let score = c.rarity === 5 ? 80 : 40;

  if (
    remainingUnfilledActs !== undefined &&
    remainingUnfilledActs > 0 &&
    currentVigor >= remainingUnfilledActs
  ) {
    score += 5000 * (currentVigor - remainingUnfilledActs + 1);
  }

  if (rosterProfiles && rosterProfiles[c.id]) {
    const prof = rosterProfiles[c.id];
    score += Math.round((prof.level / 90) * 15);
    score += prof.constellation * (c.rarity === 4 ? 4 : 5);
    if (prof.weapon) {
      score += Math.round((prof.weapon.level / 90) * 10);
      score += prof.weapon.refinement * 2;
    }
    if (isBoss || act.actNumber >= 7) {
      if (prof.constellation >= 2 || prof.level >= 85) {
        score += 25;
      }
    }
  }

  if (roleSlot === 'Carry') {
    if (c.roles.includes('On-Field DPS')) score += 55;
    else score -= 40;
    if (isBoss && bossCarriesAssigned.has(c.id)) {
      score -= 65;
    }
  } else if (roleSlot === 'Buffer') {
    if (c.roles.includes('Buffer/Shred')) score += 45;
    else if (
      c.tags.includes('VV') ||
      c.tags.includes('Cinder-City') ||
      c.tags.includes('Universal-Buffer')
    ) {
      score += 35;
    } else if (c.roles.includes('Off-Field DPS')) {
      score += 20;
    }
  } else if (roleSlot === 'Sustain') {
    if (c.roles.includes('Sustain')) score += 50;
    else score -= 15;
  } else {
    if (c.roles.includes('Off-Field DPS')) score += 30;
    if (c.roles.includes('Buffer/Shred')) score += 20;
    if (c.roles.includes('Sustain')) score += 15;
  }

  // Boss-specific structured mechanic scoring
  if (isBoss && act.bossName) {
    const bossInfo = THEATER_BOSS_INFO[act.bossName];
    if (bossInfo) {
      for (const arch of bossInfo.recommendedArchetypes) {
        if (
          c.tags.some(
            (t) =>
              t.toLowerCase() === arch.toLowerCase() ||
              arch.toLowerCase().includes(t.toLowerCase()),
          )
        ) {
          score += 35;
        }
      }

      if (bossInfo.immuneElements?.includes(c.element)) {
        score -= roleSlot === 'Carry' ? 140 : 75;
      } else if (bossInfo.resistedElements?.includes(c.element)) {
        score -= roleSlot === 'Carry' ? 75 : 40;
      }

      if (bossInfo.counterElements?.includes(c.element)) {
        score += 35;
      }

      if (bossInfo.requiresNightsoul && isNightsoulCharacter(c)) {
        score += 55;
      }

      if (bossInfo.requiresMultiElement) {
        const existingElements = new Set(alreadyInAct.map((m) => m.element));
        if (!existingElements.has(c.element)) {
          score += 30;
        } else if (existingElements.size < 3) {
          score -= 20;
        }
      }

      if (bossInfo.requiresSustain && roleSlot === 'Sustain' && c.roles.includes('Sustain')) {
        score += 25;
      }
    }
  }

  if (!isBoss && currentVigor === 2) {
    score += 25;
  }

  for (const member of alreadyInAct) {
    const pairKey = [member.id, c.id].sort().join(':');
    const priorShared = usedPairCounts.get(pairKey) || 0;
    if (priorShared > 0) {
      score -= priorShared * 30;
    }
  }

  return score;
}

function deductCharacterVigor(vigor: Record<string, number>, charId: string) {
  if (vigor[charId] === undefined) {
    vigor[charId] = 2;
  }
  for (const vId of Object.keys(vigor)) {
    if (isSameCharacterOrTraveler(vId, charId)) {
      vigor[vId] = Math.max(0, (vigor[vId] ?? 2) - 1);
    }
  }
}

function restoreCharacterVigor(vigor: Record<string, number>, charId: string) {
  if (vigor[charId] === undefined) {
    vigor[charId] = 1;
  }
  for (const vId of Object.keys(vigor)) {
    if (isSameCharacterOrTraveler(vId, charId)) {
      vigor[vId] = Math.min(2, (vigor[vId] ?? 0) + 1);
    }
  }
}

function fillActTeam(
  act: TheaterActPlan,
  candidates: Character[],
  vigor: Record<string, number>,
  isBoss: boolean,
  usedPairCounts: Map<string, number>,
  bossCarriesAssigned: Set<string>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  remainingUnfilledActs?: number,
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
      if (act.team.some((m) => isSameCharacterOrTraveler(m, c))) continue;
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
        remainingUnfilledActs,
      );

      if (score > bestScore) {
        bestScore = score;
        bestChar = c;
      }
    }

    return bestChar;
  };

  if (needsCarry && act.team.length < 4) {
    const carry = pickBest('Carry') || pickBest('Flex');
    if (carry) {
      act.team.push(carry);
      currentIds.add(carry.id);
      deductCharacterVigor(vigor, carry.id);
      if (isBoss) bossCarriesAssigned.add(carry.id);
    }
  }

  if (needsBuffer && act.team.length < 4) {
    const buffer = pickBest('Buffer') || pickBest('Flex');
    if (buffer) {
      act.team.push(buffer);
      currentIds.add(buffer.id);
      deductCharacterVigor(vigor, buffer.id);
    }
  }

  if (needsSustain && act.team.length < 4) {
    const sustain = pickBest('Sustain') || pickBest('Flex');
    if (sustain) {
      act.team.push(sustain);
      currentIds.add(sustain.id);
      deductCharacterVigor(vigor, sustain.id);
    }
  }

  while (act.team.length < 4) {
    const flex = pickBest('Flex');
    if (!flex) break;
    act.team.push(flex);
    currentIds.add(flex.id);
    deductCharacterVigor(vigor, flex.id);
  }

  for (let i = 0; i < act.team.length; i++) {
    for (let j = i + 1; j < act.team.length; j++) {
      const pairKey = [act.team[i].id, act.team[j].id].sort().join(':');
      usedPairCounts.set(pairKey, (usedPairCounts.get(pairKey) || 0) + 1);
    }
  }
}

/**
 * Manually swaps or adds a character in an act and refreshes boss matchup rating.
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
  const otherMembers = oldCharId ? act.team.filter((m) => m.id !== oldCharId) : act.team;

  if (otherMembers.some((m) => isSameCharacterOrTraveler(m, newCharId))) {
    return {
      acts: currentActs,
      vigorState,
      error: `Character (or Traveler configuration) is already in Act ${actNumber}.`,
    };
  }

  const isReplacingSameCharacter = isSameCharacterOrTraveler(oldCharId, newCharId);
  const availableVigor = isReplacingSameCharacter ? 1 : (vigorState[newCharId] ?? 2);

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
      const updatedTeam = [...a.team, newChar];
      return {
        ...a,
        team: updatedTeam,
        bossMatchup: a.bossName ? evaluateBossActMatchup(updatedTeam, a.bossName) : a.bossMatchup,
      };
    });

    const updatedVigor = { ...vigorState };
    deductCharacterVigor(updatedVigor, newCharId);

    return {
      acts: updatedActs,
      vigorState: updatedVigor,
    };
  }

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
    return {
      ...a,
      team: updatedTeam,
      bossMatchup: a.bossName ? evaluateBossActMatchup(updatedTeam, a.bossName) : a.bossMatchup,
    };
  });

  const updatedVigor = { ...vigorState };
  restoreCharacterVigor(updatedVigor, oldCharId);
  deductCharacterVigor(updatedVigor, newCharId);

  return {
    acts: updatedActs,
    vigorState: updatedVigor,
  };
}

/**
 * Removes a character from an act, restores 1 vigor, and refreshes boss matchup rating.
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
    const updatedTeam = a.team.filter((m) => m.id !== charId);
    return {
      ...a,
      team: updatedTeam,
      bossMatchup: a.bossName ? evaluateBossActMatchup(updatedTeam, a.bossName) : a.bossMatchup,
    };
  });

  const updatedVigor = { ...vigorState };
  restoreCharacterVigor(updatedVigor, charId);

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
  let score = 30;
  const highlights: string[] = [];

  const roles = new Set(team.flatMap((m) => m.roles));
  const elements = new Set(team.map((m) => m.element));
  const memberTags = new Set(team.flatMap((m) => m.tags));

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

  if (bossInfo) {
    for (const arch of bossInfo.recommendedArchetypes) {
      if (memberTags.has(arch)) {
        score += 10;
        highlights.push(`${arch} Archetype Match`);
      }
    }
  }

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
    const hasQuickenOrElectro = elements.has('Electro');
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
      highlights.push('Forward Reaction Trigger (Vape/Bloom/EC)');
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
 * Excludes owned units AND Opening Cast units (already granted free as Lv. 80 trials).
 */
export function recommendSupportCastBorrow(
  eligible: Character[],
  season: TheaterSeasonConfig,
  ownedIds?: string[],
  executionContext?: RecommendationExecutionContext,
): RecommendationCollection<Character> {
  const reliability = evaluateTheaterReliability(
    season,
    THEATER_BORROW_UNATTESTED_DEPS,
    executionContext,
  );
  const ownedSet = new Set(ownedIds ?? eligible.map((c) => c.id));
  const seasonElements = new Set(season.elements);
  const guestSet = new Set(season.specialGuestIds);
  const openingSet = new Set(season.openingCastIds);

  let candidates = CHARACTERS.filter((c) => {
    if (ownedSet.has(c.id)) return false;
    if (openingSet.has(c.id)) return false;
    return seasonElements.has(c.element) || guestSet.has(c.id);
  });

  if (candidates.length === 0) {
    candidates = CHARACTERS.filter((c) => {
      if (ownedSet.has(c.id)) return false;
      return seasonElements.has(c.element) || guestSet.has(c.id) || openingSet.has(c.id);
    });
  }

  if (candidates.length === 0) return { items: [], reliability };

  const bossActs = Object.keys(season.bosses)
    .map(Number)
    .sort((a, b) => b - a);
  const apexBossAct = bossActs[0];
  const apexBossName = apexBossAct ? season.bosses[apexBossAct] : undefined;
  const apexBossInfo = apexBossName ? THEATER_BOSS_INFO[apexBossName] : undefined;

  const scoredCandidates = candidates.map((char) => {
    let value = 0;

    if (char.rarity === 5) value += 30;
    if (char.roles.includes('On-Field DPS')) value += 30;
    if (char.roles.includes('Buffer/Shred')) value += 35;
    if (char.roles.includes('Sustain')) value += 20;

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

    if (apexBossInfo) {
      if (apexBossInfo.immuneElements?.includes(char.element)) {
        value -= 80;
      } else if (apexBossInfo.resistedElements?.includes(char.element)) {
        value -= 35;
      }
      if (apexBossInfo.counterElements?.includes(char.element)) {
        value += 30;
      }
      if (apexBossInfo.requiresNightsoul && isNightsoulCharacter(char)) {
        value += 45;
      }
      for (const arch of apexBossInfo.recommendedArchetypes) {
        if (char.tags.includes(arch)) value += 15;
      }
    }

    return { char, value };
  });

  scoredCandidates.sort((a, b) => b.value - a.value);
  return { items: scoredCandidates.slice(0, 3).map((item) => item.char), reliability };
}
