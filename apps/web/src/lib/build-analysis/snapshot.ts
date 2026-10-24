import type { ShowcaseCharacter } from '@celestia/api-contracts';

import type { CharacterObservation } from '../observed-roster';
import { setIdentityForItem, weaponIdentity } from './equipment';
import type {
  ArtifactSlot,
  NormalizedArtifact,
  NormalizedCharacter,
  NormalizedTalent,
  NormalizedWeapon,
} from './types';
import { normalizeCombatStat, normalizeEquipmentStat } from './units';

/**
 * Normalise one retained public observation into an immutable analysis input.
 *
 * The result is a pure function of the observation: no clock, no network, no storage.
 * Missing information stays missing — an omitted equipment list is not an empty loadout,
 * a null talent bonus is not a verified zero, and an unresolved set label is not an
 * identity.
 */

const slots = new Set<string>(['Flower', 'Plume', 'Sands', 'Goblet', 'Circlet']);

/** Weapons are not in the reviewed set table; resolve a stable key from the reference index. */

function normalizeArtifacts(character: ShowcaseCharacter): NormalizedArtifact[] {
  return character.artifacts.map((artifact) => {
    const mainStat = artifact.mainStat ? normalizeEquipmentStat(artifact.mainStat) : null;
    // The contract repeats the main stat as the first entry of `stats`; it is dropped by
    // identity, never by position, so a reordered payload cannot promote a substat.
    const substats = artifact.stats
      .filter((stat) => !(mainStat && stat.id === mainStat.id && stat.value === mainStat.raw))
      .map(normalizeEquipmentStat);
    return {
      itemId: artifact.id,
      slot: artifact.slot && slots.has(artifact.slot) ? (artifact.slot as ArtifactSlot) : null,
      setNameLabel: artifact.setName,
      set: setIdentityForItem(artifact.id),
      rarity: artifact.rarity,
      level: artifact.level,
      mainStat,
      substats,
    };
  });
}

function normalizeWeapon(character: ShowcaseCharacter): NormalizedWeapon | null {
  if (!character.weapon) return null;
  return {
    itemId: character.weapon.id,
    name: character.weapon.name,
    rarity: character.weapon.rarity,
    level: character.weapon.level,
    ascension: character.weapon.ascension,
    refinement: character.weapon.refinement,
    referenceKey: weaponIdentity(character.weapon.id)?.referenceKey ?? null,
    stats: character.weapon.stats.map(normalizeEquipmentStat),
  };
}

function normalizeTalents(character: ShowcaseCharacter): NormalizedTalent[] {
  return character.talents.map((talent) => ({
    id: talent.id,
    label: talent.label,
    kind: talent.kind,
    baseLevel: talent.baseLevel,
    // A missing bonus is unknown, never a verified zero.
    bonusLevel: talent.bonusLevel,
  }));
}

export function normalizeObservation(observation: CharacterObservation): NormalizedCharacter {
  const character = observation.character;
  return {
    uid: observation.uid,
    key: character.key,
    avatarId: character.id,
    skillDepotId: character.skillDepotId,
    name: character.name,
    element: character.element,
    weaponType: character.weaponType,
    rarity: character.rarity,
    level: character.level,
    ascension: character.ascension,
    constellation: character.constellation,
    metadataAvailable: character.metadataAvailable,
    equipmentAvailable: character.equipmentAvailable,
    observedAt: observation.observedAt,
    talents: normalizeTalents(character),
    weapon: normalizeWeapon(character),
    artifacts: normalizeArtifacts(character),
    stats: character.stats.map(normalizeCombatStat),
  };
}

/** Total talent level, or null when the bonus is unverified. */
export function talentTotal(talent: NormalizedTalent): number | null {
  return talent.bonusLevel === null ? null : talent.baseLevel + talent.bonusLevel;
}

/** Base talent level only; always known when the talent row exists. */
export function talentBase(talent: NormalizedTalent): number {
  return talent.baseLevel;
}

export function talentByKind(character: NormalizedCharacter, kind: NormalizedTalent['kind']) {
  return character.talents.find((talent) => talent.kind === kind) ?? null;
}

export function artifactInSlot(character: NormalizedCharacter, slot: ArtifactSlot) {
  const entries = character.artifacts.filter((artifact) => artifact.slot === slot);
  return entries.length === 1 ? entries[0] : null;
}

/** Count of artifacts whose resolved set identity matches a reviewed reference key. */
export function setPieceCount(character: NormalizedCharacter, referenceKey: string) {
  return character.artifacts.filter(
    (artifact) =>
      artifact.slot !== null &&
      character.artifacts.filter((a) => a.slot === artifact.slot).length === 1 &&
      artifact.set?.referenceKey === referenceKey,
  ).length;
}

export function observedStat(character: NormalizedCharacter, statId: string) {
  return character.stats.find((stat) => stat.id === statId) ?? null;
}
