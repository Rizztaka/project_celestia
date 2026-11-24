import type {
  Character,
  OwnedWeapon,
  WeaponData,
  WeaponScoreResult,
  TeamWeaponAssignment,
  OwnedCharacterProfile,
  WeaponType,
  RecommendationCollection,
  RecommendationExecutionContext,
} from '../types/genshin';
import { getWeaponByKey, WEAPONS_BY_TYPE } from '../data/weapons';
import { getCharacterStatWeights } from '../data/artifact-weights';
import { DEFAULT_WEAPONS } from '../services/storage';
import { evaluateEngineBoundaryReliability } from '../services/engine-reliability';

/**
 * Calculates theoretical synergy score (0–100+) for a weapon equipped by a specific character.
 */
export function scoreWeaponForCharacter(
  character: Character,
  weapon: OwnedWeapon | WeaponData,
  teamContext?: Character[],
): WeaponScoreResult {
  const dbWeapon =
    getWeaponByKey(weapon.key) ||
    getWeaponByKey(weapon.name) ||
    ('weaponType' in weapon ? (weapon as WeaponData) : undefined);

  const isOwned = 'id' in weapon;
  const location = isOwned ? (weapon as OwnedWeapon).location : undefined;
  const isEquipped =
    isOwned &&
    Boolean(
      location &&
        (location === character.id || location === character.name),
    );
  const equippedOn = location && location.trim().length > 0 ? location.trim() : undefined;

  // 1. Weapon Type Compatibility Check
  if (!dbWeapon || dbWeapon.weaponType !== character.weapon) {
    const resolvedIncompatible: OwnedWeapon | WeaponData =
      isOwned && dbWeapon
        ? {
            ...weapon,
            key: dbWeapon.key || weapon.key,
            name: dbWeapon.name || weapon.name,
            rarity: dbWeapon.rarity,
          }
        : weapon;

    return {
      weapon: resolvedIncompatible,
      score: 0,
      suitabilityScore: 0,
      relativePercentage: 0,
      tier: 'Suboptimal',
      reason: `Incompatible weapon type (requires ${character.weapon}). Estimated Weapon Suitability: 0%.`,
      isOwned,
      isEquipped,
      equippedOn,
    };
  }

  // 2. Curated BiS Tier Check
  let curatedBonus = 0;
  let curatedRank = -1;
  let curatedReason = '';

  if (character.build?.weapons && character.build.weapons.length > 0) {
    const normalize = (s: string) =>
      s
        .trim()
        .replace(/^["'“”«»]+|["'“”«»]+$/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toLowerCase();
    const dbKeyNorm = normalize(dbWeapon.key);
    const dbNameNorm = normalize(dbWeapon.name);

    curatedRank = character.build.weapons.findIndex((cw) => {
      const cwNorm = normalize(cw.name);
      return (
        cwNorm === dbNameNorm ||
        cwNorm === dbKeyNorm ||
        cw.name.toLowerCase() === dbWeapon.name.toLowerCase()
      );
    });

    if (curatedRank === 0) {
      curatedBonus = 50; // Top Signature / BiS
      curatedReason = character.build.weapons[0].reason || 'Curated Best-in-Slot signature weapon.';
    } else if (curatedRank === 1) {
      curatedBonus = 42;
      curatedReason = character.build.weapons[1].reason || 'Curated top alternative option.';
    } else if (curatedRank === 2) {
      curatedBonus = 36;
      curatedReason = character.build.weapons[2].reason || 'Curated strong synergy option.';
    } else if (curatedRank >= 3) {
      curatedBonus = 32;
      curatedReason =
        character.build.weapons[curatedRank].reason || 'Curated viable alternative.';
    }
  }

  if (curatedRank === -1) {
    // Unlisted weapon: base points by rarity
    curatedBonus = dbWeapon.rarity === 5 ? 24 : dbWeapon.rarity === 4 ? 16 : 8;
  }

  // 5★ quality bonus
  const rarityBonus = dbWeapon.rarity === 5 ? 4 : 0;

  // 3. Stat Weight Scaling
  const weightConfig = getCharacterStatWeights(character.id || character.name);
  let statPoints = 0;
  if (dbWeapon.subStatType) {
    const statWeights = (weightConfig.statWeights || {}) as Record<string, number>;
    let w = statWeights[dbWeapon.subStatType];

    const isKokomi =
      character.id === 'SangonomiyaKokomi' ||
      character.name.toLowerCase().includes('kokomi');

    if (isKokomi && (dbWeapon.subStatType === 'critRate_' || dbWeapon.subStatType === 'critDMG_')) {
      w = 0;
    } else if (w === undefined) {
      const sandsStats = character.build?.mainStats?.sands || [];
      const subStats = character.build?.subStats || [];

      if (
        (dbWeapon.subStatType === 'def_' && sandsStats.includes('DEF%')) ||
        (dbWeapon.subStatType === 'hp_' && sandsStats.includes('HP%')) ||
        (dbWeapon.subStatType === 'eleMas' && sandsStats.includes('Elemental Mastery'))
      ) {
        w = 1.0;
      } else if (dbWeapon.subStatType === 'enerRech_' && sandsStats.includes('Energy Recharge')) {
        w = 0.85;
      } else if (
        subStats.some((s) => s.toLowerCase().includes('def') && dbWeapon.subStatType === 'def_') ||
        subStats.some((s) => s.toLowerCase().includes('hp') && dbWeapon.subStatType === 'hp_') ||
        subStats.some((s) => s.toLowerCase().includes('mastery') && dbWeapon.subStatType === 'eleMas')
      ) {
        w = 0.75;
      } else {
        w = 0.2;
      }
    }

    statPoints += w * 26;
  } else {
    statPoints += 6;
  }

  // Base ATK scaling factor (normalized to 674 highest base atk)
  const baseAtkFactor = Math.min(1.0, (dbWeapon.baseAtk || 510) / 674);
  statPoints += baseAtkFactor * 14;

  // 4. Refinement Scaling
  const refinement =
    'refinement' in weapon && typeof weapon.refinement === 'number'
      ? Math.max(1, Math.min(5, weapon.refinement))
      : 1;

  let refinementBonus = (refinement - 1) * 2.5;

  // Key weapon passive refinement weightings
  const keyUpper = (dbWeapon.key || dbWeapon.name).toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (keyUpper.includes('THECATCH')) {
    refinementBonus += refinement * 2.0; // Significant scaling on Burst DMG & CRIT
  } else if (keyUpper.includes('FAVONIUS')) {
    refinementBonus += refinement * 1.5; // Particle consistency
  } else if (keyUpper.includes('THRILLINGTALES')) {
    refinementBonus += refinement * 2.5; // Huge ATK buff scaling (24% -> 48%)
  } else if (keyUpper.includes('DRAGONSBANE')) {
    refinementBonus += refinement * 1.8; // Reaction DMG scaling
  }

  // 5. Team Context Bonus
  let contextBonus = 0;
  let contextNote = '';

  if (teamContext && teamContext.length > 0) {
    // Thrilling Tales buffing an on-field carry
    if (
      keyUpper.includes('THRILLINGTALES') &&
      character.weapon === 'Catalyst' &&
      character.roles.some((r) => r === 'Buffer/Shred' || r === 'Sustain')
    ) {
      const hasCarry = teamContext.some(
        (m) =>
          m.id !== character.id &&
          (m.roles.includes('On-Field DPS') || m.tags.includes('Vaporize')),
      );
      if (hasCarry) {
        contextBonus += 15;
        contextNote = 'Provides massive +48% ATK buff to on-field team carry.';
      }
    }

    // Favonius energy battery buffing high burst cost team
    if (keyUpper.includes('FAVONIUS')) {
      const isSupport = character.roles.some(
        (r) => r === 'Buffer/Shred' || r === 'Sustain' || r === 'Off-Field DPS',
      );
      if (isSupport) {
        contextBonus += 8;
        contextNote = 'Generates clear neutral energy particles for team burst rotations.';
      }
    }
  }

  // 6. Level Scaling
  const level =
    'level' in weapon && typeof weapon.level === 'number'
      ? Math.max(1, Math.min(90, weapon.level))
      : 90;
  const levelFactor = Math.max(0.4, level / 90);

  // Combine raw score
  const rawScore = (curatedBonus + rarityBonus + statPoints + refinementBonus + contextBonus) * levelFactor;

  // Cap at 100+ for exceptional signature synergy
  let score = Math.round(rawScore);

  // Calculate relative percentage (100% = baseline BiS score ~90-95, R5 signatures can reach ~115-125%)
  const bisBase = 90;
  let relativePercentage = Math.min(130, Math.round((rawScore / bisBase) * 100));

  if (curatedRank === 0 && level >= 85) {
    relativePercentage = Math.max(95, relativePercentage);
    score = Math.max(95, score);
  }

  // Determine Tier
  let tier: 'BiS' | 'Optimal' | 'Great' | 'Usable' | 'Suboptimal';
  if (relativePercentage >= 95) {
    tier = 'BiS';
  } else if (relativePercentage >= 85) {
    tier = 'Optimal';
  } else if (relativePercentage >= 75) {
    tier = 'Great';
  } else if (relativePercentage >= 60) {
    tier = 'Usable';
  } else {
    tier = 'Suboptimal';
  }

  // Reason composition
  const reasons: string[] = [];
  if (curatedReason) {
    reasons.push(`${dbWeapon.name}: ${curatedReason}`);
  } else {
    reasons.push(
      `${dbWeapon.name}: ${dbWeapon.rarity}★ ${dbWeapon.weaponType} with ${dbWeapon.subStatType || 'solid'} substat scaling.`,
    );
  }
  if (contextNote) {
    reasons.push(contextNote);
  }
  if (refinement > 1) {
    reasons.push(`Enhanced by Refinement R${refinement}.`);
  }
  if (level < 90) {
    reasons.push(`Current Level: ${level}/90.`);
  }
  reasons.push(`Estimated Weapon Suitability: ${relativePercentage}%.`);

  const resolvedWeapon: OwnedWeapon | WeaponData =
    isOwned && dbWeapon
      ? {
          ...weapon,
          key: dbWeapon.key || weapon.key,
          name: dbWeapon.name || weapon.name,
          rarity: dbWeapon.rarity,
        }
      : weapon;

  return {
    weapon: resolvedWeapon,
    score,
    suitabilityScore: relativePercentage,
    relativePercentage,
    tier,
    reason: reasons.join(' '),
    isOwned,
    isEquipped,
    equippedOn,
  };
}

const WEAPON_SOLVER_REQUIRED_DATASETS = [
  'characters_v7_2_batch7',
  'weapons_v7_2_signatures',
  'artifact_weights_v7_2',
];

/**
 * Ranks all owned weapons compatible with a character from best to worst.
 */
export function rankWeaponsForCharacter(
  character: Character,
  ownedWeapons: OwnedWeapon[],
  teamContext?: Character[],
  executionContext?: RecommendationExecutionContext,
): RecommendationCollection<WeaponScoreResult> {
  const reliability = evaluateEngineBoundaryReliability({
    mode: 'current',
    requiredDatasetIds: WEAPON_SOLVER_REQUIRED_DATASETS,
    executionContext,
  });

  if (!ownedWeapons || ownedWeapons.length === 0) {
    return { items: [], reliability };
  }

  // Filter to matching weapon type only
  const compatible = ownedWeapons.filter((w) => {
    const db =
      getWeaponByKey(w.key) ||
      getWeaponByKey(w.name) ||
      ('weaponType' in w ? (w as unknown as WeaponData) : undefined);
    return db ? db.weaponType === character.weapon : false;
  });

  const scored = compatible.map((w) => scoreWeaponForCharacter(character, w, teamContext));

  // Sort descending by score, tiebreak by level then refinement
  const items = scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const wA = a.weapon as OwnedWeapon;
    const wB = b.weapon as OwnedWeapon;
    if (wB.level !== wA.level) return wB.level - wA.level;
    return wB.refinement - wA.refinement;
  });

  return { items, reliability };
}

/**
 * Assigns optimal, non-conflicting weapons across a 4-slot team composition from the owned weapon bag.
 * Guarantees zero duplicate weapon instance assignments and highlights borrowed weapons.
 */
export function assignOptimalTeamWeapons(
  teamMembers: Character[],
  ownedWeapons: OwnedWeapon[],
  _profiles?: Record<string, OwnedCharacterProfile>,
): TeamWeaponAssignment[] {
  if (!teamMembers || teamMembers.length === 0) return [];

  // If bag is empty, synthesize fallbacks from DEFAULT_WEAPONS or static database
  const bag: OwnedWeapon[] =
    ownedWeapons && ownedWeapons.length > 0 ? [...ownedWeapons] : [...DEFAULT_WEAPONS];

  // Count how many team members need each weapon type
  const membersByType: Record<string, number> = {};
  for (const m of teamMembers) {
    membersByType[m.weapon] = (membersByType[m.weapon] || 0) + 1;
  }

  // Pre-index weapons by weapon type to avoid repeated full-array scans and key resolutions
  const bagByType: Record<string, OwnedWeapon[]> = {};
  for (const w of bag) {
    const db =
      getWeaponByKey(w.key) ||
      getWeaponByKey(w.name) ||
      ('weaponType' in w ? (w as unknown as WeaponData) : undefined);
    if (db) {
      if (!bagByType[db.weaponType]) bagByType[db.weaponType] = [];
      bagByType[db.weaponType].push(w);
    }
  }

  // Ensure bag has enough distinct weapons for each required weapon type
  for (const [wType, needed] of Object.entries(membersByType)) {
    const existingForType = bagByType[wType] || [];
    const deficit = needed - existingForType.length;
    if (deficit > 0) {
      const typeDefaults: WeaponData[] = WEAPONS_BY_TYPE[wType as WeaponType] || [];
      const existingKeys = new Set(bag.map((b) => b.key));
      let fallbackOptions = typeDefaults.filter(
        (tw: WeaponData) => (tw.rarity === 4 || tw.rarity === 3) && !existingKeys.has(tw.key),
      );
      if (fallbackOptions.length === 0) {
        fallbackOptions = typeDefaults.filter(
          (tw: WeaponData) => tw.rarity === 4 || tw.rarity === 3,
        );
      }

      for (let d = 0; d < deficit; d++) {
        const fallbackDb = fallbackOptions[d % fallbackOptions.length];
        const virtualId = `fallback_${wType.toLowerCase()}_${d + 1}_${Date.now()}`;
        const newW: OwnedWeapon = {
          id: virtualId,
          key: fallbackDb ? fallbackDb.key : `Favonius${wType}`,
          name: fallbackDb ? fallbackDb.name : `Favonius ${wType}`,
          level: 90,
          refinement: 1,
          rarity: fallbackDb ? fallbackDb.rarity : 4,
          location: '',
        };
        bag.push(newW);
        if (!bagByType[wType]) bagByType[wType] = [];
        bagByType[wType].push(newW);
      }
    }
  }

  // Helper to ensure each team member has viable candidate weapons
  const candidatesPerMember: Array<{
    member: Character;
    candidates: Array<{ weapon: OwnedWeapon; scoreRes: WeaponScoreResult }>;
  }> = [];

  for (let i = 0; i < teamMembers.length; i++) {
    const member = teamMembers[i];
    const compatible = bagByType[member.weapon] || [];

    // Score all compatible weapons
    const scored = compatible.map((w) => ({
      weapon: w,
      scoreRes: scoreWeaponForCharacter(member, w, teamMembers),
    }));

    // Sort descending by score
    scored.sort((a, b) => b.scoreRes.score - a.scoreRes.score);

    // Keep top candidates: at least as many as members of this type + 3
    const neededForType = membersByType[member.weapon] || 1;
    const topKCount = Math.max(6, neededForType + 3);
    const topK = scored.slice(0, topKCount);

    candidatesPerMember.push({
      member,
      candidates: topK,
    });
  }

  // Backtracking solver to find strictly non-conflicting weapon assignment maximizing total score
  let maxTotalScore = -1;
  let bestAssignment: Array<{
    member: Character;
    weapon: OwnedWeapon;
    scoreRes: WeaponScoreResult;
  }> = [];

  function solve(
    memberIndex: number,
    usedWeaponIds: Set<string>,
    currentScore: number,
    currentAssignment: Array<{
      member: Character;
      weapon: OwnedWeapon;
      scoreRes: WeaponScoreResult;
    }>,
  ) {
    if (memberIndex >= candidatesPerMember.length) {
      if (currentScore > maxTotalScore) {
        maxTotalScore = currentScore;
        bestAssignment = [...currentAssignment];
      }
      return;
    }

    const { member, candidates } = candidatesPerMember[memberIndex];

    for (const cand of candidates) {
      if (!usedWeaponIds.has(cand.weapon.id)) {
        usedWeaponIds.add(cand.weapon.id);
        currentAssignment.push({
          member,
          weapon: cand.weapon,
          scoreRes: cand.scoreRes,
        });

        solve(
          memberIndex + 1,
          usedWeaponIds,
          currentScore + cand.scoreRes.score,
          currentAssignment,
        );

        currentAssignment.pop();
        usedWeaponIds.delete(cand.weapon.id);
      }
    }
  }

  solve(0, new Set<string>(), 0, []);

  // Format final assignments with borrowing flags
  return bestAssignment.map(({ member, weapon, scoreRes }) => {
    let isBorrowed = false;
    let borrowedFrom: string | undefined = undefined;

    if (
      weapon.location &&
      weapon.location !== member.id &&
      weapon.location !== member.name &&
      weapon.location.trim().length > 0
    ) {
      isBorrowed = true;
      borrowedFrom = weapon.location;
    }

    const resolvedWeapon = (scoreRes.weapon as OwnedWeapon) || weapon;

    return {
      characterId: member.id,
      characterName: member.name,
      assignedWeapon: resolvedWeapon,
      scoreResult: scoreRes,
      isBorrowed,
      borrowedFrom,
    };
  });
}
