import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import { createCustomSandboxCycle, DEFAULT_ACTIVE_ABYSS_CYCLE_ID } from '../data/abyss-schedules';
import { getWeaponByKey } from '../data/weapons';

const ROSTER_KEY = 'celestia_v2_owned_roster';
const PROFILES_KEY = 'celestia_v2_roster_profiles';
const ARTIFACTS_KEY = 'celestia_v2_raw_artifacts';
const WEAPONS_KEY = 'celestia_v2_raw_weapons';
const UID_KEY = 'celestia_v2_active_uid';
const PULL_BUDGET_KEY = 'celestia_v2_pull_budget';
const ABYSS_CYCLE_ID_KEY = 'celestia_v2_abyss_cycle_id';
const CUSTOM_ABYSS_KEY = 'celestia_v2_custom_abyss';

export const DEFAULT_PULL_BUDGET: PullBudgetState = {
  primogems: 0,
  fates: 0,
  characterPity: 0,
  characterGuaranteed: false,
  weaponPity: 0,
  weaponFatePoints: 0,
};

// Default starter roster so new users have an instant rich experience
export const DEFAULT_ROSTER = [
  'Nefer',
  'Xilonen',
  'Mavuika',
  'Furina',
  'Bennett',
  'Xiangling',
  'Xingqiu',
  'Fischl',
  'Sucrose',
  'KukiShinobu',
  'Diona',
];

export function getSavedRoster(): string[] {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_ROSTER;
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw === null) return DEFAULT_ROSTER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ROSTER;
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return DEFAULT_ROSTER;
  }
}

export function saveRoster(ids: string[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ROSTER_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save roster to localStorage:', e);
  }
}

export function getSavedProfiles(): Record<string, OwnedCharacterProfile> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const profiles = parsed as Record<string, OwnedCharacterProfile>;
          for (const prof of Object.values(profiles)) {
            if (prof?.weapon) {
              const canonical = getWeaponByKey(prof.weapon.key) || getWeaponByKey(prof.weapon.name);
              if (canonical) {
                prof.weapon.key = canonical.key;
                prof.weapon.name = canonical.name;
                prof.weapon.rarity = canonical.rarity;
              }
            }
          }
          return profiles;
        }
      }
    }
  } catch (e) {
    console.error('Failed to read profiles from localStorage:', e);
  }

  // Fallback for first-time uninitialized visits: build baseline from saved/default roster
  const fallbackIds = getSavedRoster();
  const baseline: Record<string, OwnedCharacterProfile> = {};
  for (const id of fallbackIds) {
    baseline[id] = {
      id,
      level: 90,
      constellation: 0,
    };
  }
  return baseline;
}

export function saveProfiles(profiles: Record<string, OwnedCharacterProfile>): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    // Keep legacy owned roster in sync
    saveRoster(Object.keys(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage:', e);
  }
}

export function getSavedArtifacts(): any[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(ARTIFACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArtifacts(artifacts: any[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
    return true;
  } catch (e) {
    console.warn('Failed to save artifacts to localStorage (quota exceeded):', e);
    return false;
  }
}

export const DEFAULT_WEAPONS: OwnedWeapon[] = [
  {
    id: 'starter_prototype_rancour',
    key: 'PrototypeRancour',
    name: 'Prototype Rancour',
    level: 90,
    refinement: 1,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_favonius_sword',
    key: 'FavoniusSword',
    name: 'Favonius Sword',
    level: 90,
    refinement: 3,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_favonius_warbow',
    key: 'FavoniusWarbow',
    name: 'Favonius Warbow',
    level: 90,
    refinement: 1,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_the_catch',
    key: 'TheCatch',
    name: '"The Catch"',
    level: 90,
    refinement: 5,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_dragons_bane',
    key: 'DragonsBane',
    name: "Dragon's Bane",
    level: 90,
    refinement: 3,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_favonius_lance',
    key: 'FavoniusLance',
    name: 'Favonius Lance',
    level: 90,
    refinement: 3,
    rarity: 4,
    location: '',
  },
  {
    id: 'starter_thrilling_tales',
    key: 'ThrillingTalesOfDragonSlayers',
    name: 'Thrilling Tales of Dragon Slayers',
    level: 90,
    refinement: 5,
    rarity: 3,
    location: '',
  },
  {
    id: 'starter_sacrificial_fragments',
    key: 'SacrificialFragments',
    name: 'Sacrificial Fragments',
    level: 90,
    refinement: 3,
    rarity: 4,
    location: '',
  },
];

export function getSavedWeapons(): OwnedWeapon[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(WEAPONS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return (parsed as OwnedWeapon[]).map((w) => {
            const canonical = getWeaponByKey(w.key) || getWeaponByKey(w.name);
            if (!canonical) return w;
            return {
              ...w,
              key: canonical.key,
              name: canonical.name,
              rarity: canonical.rarity,
            };
          });
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read weapons from localStorage:', e);
  }

  // Fallback 1: Extract equipped weapons from saved profiles
  const profiles = getSavedProfiles();
  const extractedWeapons: OwnedWeapon[] = [];
  let index = 0;
  for (const prof of Object.values(profiles)) {
    if (prof.weapon && prof.weapon.key) {
      index++;
      const canonical = getWeaponByKey(prof.weapon.key) || getWeaponByKey(prof.weapon.name);
      extractedWeapons.push({
        id: `${prof.weapon.key}_${prof.id}_${index}`,
        key: canonical?.key || prof.weapon.key,
        name: canonical?.name || prof.weapon.name,
        level: prof.weapon.level,
        refinement: prof.weapon.refinement,
        rarity: canonical?.rarity || prof.weapon.rarity,
        ascension: prof.weapon.ascension,
        location: prof.id,
        lock: true,
      });
    }
  }

  if (extractedWeapons.length > 0) {
    return extractedWeapons;
  }

  // Fallback 2: Default starter weapons
  return DEFAULT_WEAPONS;
}

export function saveWeapons(weapons: OwnedWeapon[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(WEAPONS_KEY, JSON.stringify(weapons));
    return true;
  } catch (e) {
    console.warn('Failed to save weapons to localStorage:', e);
    return false;
  }
}

export function getSavedUid(): string {
  try {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem(UID_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUid(uid: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(UID_KEY, uid);
  } catch (e) {
    console.error('Failed to save uid to localStorage:', e);
  }
}

export function getSavedPullBudget(): PullBudgetState {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_PULL_BUDGET };
    const raw = localStorage.getItem(PULL_BUDGET_KEY);
    if (!raw) return { ...DEFAULT_PULL_BUDGET };
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_PULL_BUDGET };
    }

    const primogems =
      typeof parsed.primogems === 'number' && !isNaN(parsed.primogems)
        ? Math.max(0, Math.floor(parsed.primogems))
        : DEFAULT_PULL_BUDGET.primogems;

    const fates =
      typeof parsed.fates === 'number' && !isNaN(parsed.fates)
        ? Math.max(0, Math.floor(parsed.fates))
        : DEFAULT_PULL_BUDGET.fates;

    const characterPity =
      typeof parsed.characterPity === 'number' && !isNaN(parsed.characterPity)
        ? Math.max(0, Math.min(89, Math.floor(parsed.characterPity)))
        : DEFAULT_PULL_BUDGET.characterPity;

    const characterGuaranteed =
      typeof parsed.characterGuaranteed === 'boolean'
        ? parsed.characterGuaranteed
        : DEFAULT_PULL_BUDGET.characterGuaranteed;

    const weaponPity =
      typeof parsed.weaponPity === 'number' && !isNaN(parsed.weaponPity)
        ? Math.max(0, Math.min(79, Math.floor(parsed.weaponPity)))
        : DEFAULT_PULL_BUDGET.weaponPity;

    const weaponFatePoints =
      typeof parsed.weaponFatePoints === 'number' && !isNaN(parsed.weaponFatePoints)
        ? Math.max(0, Math.min(1, Math.floor(parsed.weaponFatePoints)))
        : DEFAULT_PULL_BUDGET.weaponFatePoints;

    return {
      primogems,
      fates,
      characterPity,
      characterGuaranteed,
      weaponPity,
      weaponFatePoints,
    };
  } catch {
    return { ...DEFAULT_PULL_BUDGET };
  }
}

export function savePullBudget(budget: PullBudgetState): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(PULL_BUDGET_KEY, JSON.stringify(budget));
  } catch (e) {
    console.error('Failed to save pull budget to localStorage:', e);
  }
}

export function getSavedAbyssCycleId(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
    const saved = localStorage.getItem(ABYSS_CYCLE_ID_KEY);
    const validIds = new Set(['cycle-7-2', 'cycle-7-1', 'cycle-5-3', 'cycle-5-2', 'cycle-5-1', 'custom-sandbox']);
    return saved && validIds.has(saved) ? saved : DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
  } catch {
    return DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
  }
}

export function saveAbyssCycleId(id: string): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(ABYSS_CYCLE_ID_KEY, id);
  } catch (e) {
    console.error('Failed to save abyss cycle id to localStorage:', e);
  }
}

export function getSavedCustomAbyss(): AbyssCycleConfig {
  try {
    if (typeof localStorage === 'undefined') return createCustomSandboxCycle();
    const raw = localStorage.getItem(CUSTOM_ABYSS_KEY);
    if (!raw) return createCustomSandboxCycle();
    const parsed = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.chambers) ||
      parsed.chambers.length !== 3
    ) {
      return createCustomSandboxCycle();
    }
    return parsed as AbyssCycleConfig;
  } catch {
    return createCustomSandboxCycle();
  }
}

export function saveCustomAbyss(cycle: AbyssCycleConfig): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(CUSTOM_ABYSS_KEY, JSON.stringify(cycle));
  } catch (e) {
    console.error('Failed to save custom abyss to localStorage:', e);
  }
}

/**
 * Synchronizes the weapon armory when a character's profile changes.
 * Guarantees:
 * - When a character unequips their weapon (profile.weapon is falsy), any weapon with location === updated.id is unequipped into bag.
 * - Any old weapon on updated.id that is NOT the updated weapon is unequipped into bag.
 * - Reuses the existing instance if this character ALREADY has this weapon equipped.
 * - Otherwise, reuses the FIRST unequipped instance in inventory (never touches subsequent unequipped copies).
 * - Only creates a new weapon instance if no unequipped copy is available in the armory.
 */
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
  };
  return [newOwned, ...unequippedOld];
}


