import type { OwnedCharacterProfile, OwnedWeapon } from '../types/genshin';
import { CHARACTERS } from '../data/characters';
import { getWeaponByKey } from '../data/weapons';

export function equipWeaponToCharacter(
  weaponId: string,
  characterId: string,
  currentWeapons: OwnedWeapon[],
  currentProfiles: Record<string, OwnedCharacterProfile>,
): {
  updatedWeapons: OwnedWeapon[];
  updatedProfiles: Record<string, OwnedCharacterProfile>;
  transferredFrom?: string;
} {
  const character = CHARACTERS.find((c) => c.id === characterId);
  const targetWeapon = currentWeapons.find((w) => w.id === weaponId);
  if (!targetWeapon) {
    return {
      updatedWeapons: currentWeapons,
      updatedProfiles: currentProfiles,
    };
  }

  const canonical = getWeaponByKey(targetWeapon.key) || getWeaponByKey(targetWeapon.name);
  if (character && canonical && character.weapon !== canonical.weaponType) {
    console.warn(
      `Cannot equip ${canonical.name} (${canonical.weaponType}) to ${character.name} (${character.weapon}): weapon type mismatch.`,
    );
    return {
      updatedWeapons: currentWeapons,
      updatedProfiles: currentProfiles,
    };
  }

  const transferredFrom =
    targetWeapon.location && targetWeapon.location !== characterId
      ? targetWeapon.location
      : undefined;
  const equippedWeaponData = {
    key: canonical?.key || targetWeapon.key,
    name: canonical?.name || targetWeapon.name,
    level: targetWeapon.level,
    refinement: targetWeapon.refinement,
    rarity: canonical?.rarity || targetWeapon.rarity || 4,
    ascension: targetWeapon.ascension,
  };

  // 1. Update weapons list:
  // - weaponId gets equipped to characterId
  // - Any weapon previously equipped on characterId is unassigned back to bag
  const updatedWeapons = currentWeapons.map((w) => {
    if (w.id === weaponId) {
      return { ...w, location: characterId };
    }
    if (w.location === characterId && w.id !== weaponId) {
      return { ...w, location: undefined };
    }
    return w;
  });

  // 2. Update profiles:
  const updatedProfiles: Record<string, OwnedCharacterProfile> = { ...currentProfiles };

  if (transferredFrom && updatedProfiles[transferredFrom]) {
    updatedProfiles[transferredFrom] = {
      ...updatedProfiles[transferredFrom],
      weapon: undefined,
    };
  }

  const existingProfile = updatedProfiles[characterId] || {
    id: characterId,
    level: 90,
    constellation: 0,
  };
  updatedProfiles[characterId] = {
    ...existingProfile,
    weapon: equippedWeaponData,
  };

  return {
    updatedWeapons,
    updatedProfiles,
    transferredFrom,
  };
}

export function unequipWeaponFromCharacter(
  characterId: string,
  currentWeapons: OwnedWeapon[],
  currentProfiles: Record<string, OwnedCharacterProfile>,
): {
  updatedWeapons: OwnedWeapon[];
  updatedProfiles: Record<string, OwnedCharacterProfile>;
} {
  const updatedWeapons = currentWeapons.map((w) =>
    w.location === characterId ? { ...w, location: undefined } : w,
  );
  const updatedProfiles: Record<string, OwnedCharacterProfile> = { ...currentProfiles };
  if (updatedProfiles[characterId]) {
    updatedProfiles[characterId] = {
      ...updatedProfiles[characterId],
      weapon: undefined,
    };
  }
  return { updatedWeapons, updatedProfiles };
}

export function syncArmoryOnProfileUpdate(
  currentWeapons: OwnedWeapon[],
  updated: OwnedCharacterProfile,
): OwnedWeapon[] {
  if (!updated.weapon) {
    return currentWeapons.map((w) =>
      w.location === updated.id ? { ...w, location: undefined } : w,
    );
  }

  const updatedWeaponCanonical =
    getWeaponByKey(updated.weapon.key) || getWeaponByKey(updated.weapon.name);
  const updatedCanonicalKey = updatedWeaponCanonical?.key || updated.weapon.key;

  // 1. Unequip any weapon currently on updated.id that is not the updated weapon
  const unequippedOld = currentWeapons.map((w) => {
    const wCanonicalKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
    if (w.location === updated.id && wCanonicalKey !== updatedCanonicalKey) {
      return { ...w, location: undefined };
    }
    return w;
  });

  // 2. Check if updated.id ALREADY has an instance of this weapon equipped
  let targetIndex = unequippedOld.findIndex((w) => {
    const wCanonicalKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
    return wCanonicalKey === updatedCanonicalKey && w.location === updated.id;
  });

  // 3. If not, find the FIRST unequipped instance in bag
  if (targetIndex === -1) {
    targetIndex = unequippedOld.findIndex((w) => {
      const wCanonicalKey = (getWeaponByKey(w.key) || getWeaponByKey(w.name))?.key || w.key;
      return wCanonicalKey === updatedCanonicalKey && (!w.location || !w.location.trim());
    });
  }

  // 4. If matched, update ONLY that single weapon instance
  if (targetIndex >= 0) {
    return unequippedOld.map((w, idx) => {
      if (idx === targetIndex) {
        return {
          ...w,
          key: updatedWeaponCanonical?.key || w.key,
          name: updatedWeaponCanonical?.name || w.name,
          rarity: updatedWeaponCanonical?.rarity || w.rarity || 4,
          location: updated.id,
          level: updated.weapon!.level ?? w.level,
          refinement: updated.weapon!.refinement ?? w.refinement,
        };
      }
      return w;
    });
  }

  // 5. No existing or unequipped instance available: synthesize new weapon record
  const newOwned: OwnedWeapon = {
    id: `${updatedCanonicalKey}_${Date.now()}`,
    key: updatedCanonicalKey,
    name: updatedWeaponCanonical?.name || updated.weapon.name,
    level: updated.weapon.level ?? 90,
    refinement: updated.weapon.refinement ?? 1,
    rarity: updatedWeaponCanonical?.rarity || updated.weapon.rarity || 4,
    location: updated.id,
    lock: true,
    isCustom: true,
  };
  return [newOwned, ...unequippedOld];
}
