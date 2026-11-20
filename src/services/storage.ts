import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import { createCustomSandboxCycle, DEFAULT_ACTIVE_ABYSS_CYCLE_ID } from '../data/abyss-schedules';
import { resolveWeaponAlias } from '../data/weapon-aliases';
import { DEFAULT_DEMO_ARTIFACTS } from '../data/demo-artifacts';
import {
  migrateStorageIfNeeded,
  getStorageSchemaVersion,
  createSafetySnapshot,
  rollbackToBackup,
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from './storage-migration';

export {
  migrateStorageIfNeeded,
  getStorageSchemaVersion,
  createSafetySnapshot,
  rollbackToBackup,
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
  DEFAULT_DEMO_ARTIFACTS,
};

const ROSTER_KEY = 'celestia_v2_owned_roster';
const PROFILES_KEY = 'celestia_v2_roster_profiles';
const ARTIFACTS_KEY = 'celestia_v2_raw_artifacts';
const WEAPONS_KEY = 'celestia_v2_raw_weapons';
const UID_KEY = 'celestia_v2_active_uid';
const PULL_BUDGET_KEY = 'celestia_v2_pull_budget';
const ABYSS_CYCLE_ID_KEY = 'celestia_v2_abyss_cycle_id';
const CUSTOM_ABYSS_KEY = 'celestia_v2_custom_abyss';
const DEMO_MODE_KEY = 'celestia_v2_demo_mode';

// Dedicated namespace keys for Demo Mode (prevents overwriting real user account data)
const DEMO_ROSTER_KEY = 'celestia_v2_demo_roster';
const DEMO_PROFILES_KEY = 'celestia_v2_demo_profiles';
const DEMO_WEAPONS_KEY = 'celestia_v2_demo_weapons';
const DEMO_ARTIFACTS_KEY = 'celestia_v2_demo_artifacts';

let lastStorageError: string | null = null;

export function getLastStorageError(): string | null {
  return lastStorageError;
}

export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__celestia_probe__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export const DEFAULT_PULL_BUDGET: PullBudgetState = {
  primogems: 0,
  fates: 0,
  characterPity: 0,
  characterGuaranteed: false,
  consecutiveLossCount: 0,
  weaponPity: 0,
  weaponFatePoints: 0,
};

// Calibrated demo starter roster for testing and exploration
export const DEMO_ROSTER = [
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

// Truthful accounts: first-time users start with an authentic empty roster (0 characters)
export const DEFAULT_ROSTER: string[] = [];

export function isDemoModeEnabled(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(DEMO_MODE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setDemoModeEnabled(enabled: boolean): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save demo mode state';
    console.error('Failed to save demo mode state:', e);
    return false;
  }
}

export function getDemoProfiles(): Record<string, OwnedCharacterProfile> {
  const baseline: Record<string, OwnedCharacterProfile> = {};
  for (const id of DEMO_ROSTER) {
    baseline[id] = {
      id,
      level: 90,
      constellation: 0,
    };
  }
  return baseline;
}

export function resetAccountData(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    // Wipe all real account data completely
    localStorage.removeItem(ROSTER_KEY);
    localStorage.removeItem(PROFILES_KEY);
    localStorage.removeItem(WEAPONS_KEY);
    localStorage.removeItem(ARTIFACTS_KEY);
    localStorage.removeItem(UID_KEY);
    localStorage.removeItem(PULL_BUDGET_KEY);
    localStorage.removeItem(ABYSS_CYCLE_ID_KEY);
    localStorage.removeItem(CUSTOM_ABYSS_KEY);
    localStorage.setItem(DEMO_MODE_KEY, 'false');

    // Also clean up demo namespace caches if present
    localStorage.removeItem(DEMO_ROSTER_KEY);
    localStorage.removeItem(DEMO_PROFILES_KEY);
    localStorage.removeItem(DEMO_WEAPONS_KEY);
    localStorage.removeItem(DEMO_ARTIFACTS_KEY);
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to reset account data';
    console.error('Failed to reset account data:', e);
    return false;
  }
}

export function getSavedRoster(): string[] {
  try {
    if (typeof localStorage === 'undefined') {
      return isDemoModeEnabled() ? DEMO_ROSTER : DEFAULT_ROSTER;
    }
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_ROSTER_KEY : ROSTER_KEY;
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return isDemo ? DEMO_ROSTER : DEFAULT_ROSTER;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return isDemo ? DEMO_ROSTER : DEFAULT_ROSTER;
    }
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return isDemoModeEnabled() ? DEMO_ROSTER : DEFAULT_ROSTER;
  }
}

export function saveRoster(ids: string[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = isDemoModeEnabled() ? DEMO_ROSTER_KEY : ROSTER_KEY;
    localStorage.setItem(key, JSON.stringify(ids));
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save roster';
    console.error('Failed to save roster to localStorage:', e);
    return false;
  }
}

export function getSavedProfiles(): Record<string, OwnedCharacterProfile> {
  try {
    if (typeof localStorage !== 'undefined') {
      const isDemo = isDemoModeEnabled();
      const key = isDemo ? DEMO_PROFILES_KEY : PROFILES_KEY;
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const profiles = parsed as Record<string, OwnedCharacterProfile>;
          for (const prof of Object.values(profiles)) {
            if (prof?.weapon) {
              const alias = resolveWeaponAlias(prof.weapon.key) || resolveWeaponAlias(prof.weapon.name);
              if (alias) {
                prof.weapon.key = alias.key;
                prof.weapon.name = alias.name;
                prof.weapon.rarity = alias.rarity;
              }
            }
          }
          return profiles;
        }
      }
      if (isDemo) {
        return getDemoProfiles();
      }
    }
  } catch (e) {
    console.error('Failed to read profiles from localStorage:', e);
  }

  // Fallback for first-time uninitialized visits
  if (isDemoModeEnabled()) {
    return getDemoProfiles();
  }
  return {};
}

export function saveProfiles(profiles: Record<string, OwnedCharacterProfile>): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_PROFILES_KEY : PROFILES_KEY;
    localStorage.setItem(key, JSON.stringify(profiles));
    // Keep owned roster in sync within the corresponding namespace
    const rosterSaved = saveRoster(Object.keys(profiles));
    return rosterSaved;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save profiles to localStorage';
    console.error('Failed to save profiles to localStorage:', e);
    return false;
  }
}

export function getSavedArtifacts(): any[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function seedDemoArtifacts(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(DEMO_ARTIFACTS_KEY, JSON.stringify(DEFAULT_DEMO_ARTIFACTS));
    return true;
  } catch {
    return false;
  }
}

export function saveArtifacts(artifacts: any[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY;
    localStorage.setItem(key, JSON.stringify(artifacts));
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save artifacts (quota exceeded)';
    console.warn('Failed to save artifacts to localStorage (quota exceeded):', e);
    return false;
  }
}

export const DEMO_WEAPONS: OwnedWeapon[] = [
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

export const DEFAULT_WEAPONS: OwnedWeapon[] = [];

export function getSavedWeapons(): OwnedWeapon[] {
  try {
    if (typeof localStorage !== 'undefined') {
      const isDemo = isDemoModeEnabled();
      const key = isDemo ? DEMO_WEAPONS_KEY : WEAPONS_KEY;
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return (parsed as OwnedWeapon[]).map((w) => {
            const alias = resolveWeaponAlias(w.key) || resolveWeaponAlias(w.name);
            if (!alias) return w;
            return {
              ...w,
              key: alias.key,
              name: alias.name,
              rarity: alias.rarity,
            };
          });
        }
      }
    }
  } catch (e) {
    console.warn('Failed to read weapons from localStorage:', e);
  }

  // Fallback 1: Extract equipped weapons from saved profiles in the active namespace
  const profiles = getSavedProfiles();
  const extractedWeapons: OwnedWeapon[] = [];
  let index = 0;
  for (const prof of Object.values(profiles)) {
    if (prof.weapon && prof.weapon.key) {
      index++;
      extractedWeapons.push({
        id: `${prof.weapon.key}_${prof.id}_${index}`,
        key: prof.weapon.key,
        name: prof.weapon.name || prof.weapon.key,
        level: prof.weapon.level,
        refinement: prof.weapon.refinement,
        rarity: prof.weapon.rarity || 4,
        ascension: prof.weapon.ascension,
        location: prof.id,
        lock: true,
      });
    }
  }

  if (extractedWeapons.length > 0) {
    return extractedWeapons;
  }

  // Fallback 2: If Demo Mode is enabled, return starter weapons
  if (isDemoModeEnabled()) {
    return DEMO_WEAPONS;
  }

  // Otherwise return authentic empty armory
  return DEFAULT_WEAPONS;
}


export function saveWeapons(weapons: OwnedWeapon[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_WEAPONS_KEY : WEAPONS_KEY;
    localStorage.setItem(key, JSON.stringify(weapons));
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save weapons (quota exceeded)';
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

export function saveUid(uid: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(UID_KEY, uid);
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save UID';
    console.error('Failed to save uid to localStorage:', e);
    return false;
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

    const consecutiveLossCount =
      typeof parsed.consecutiveLossCount === 'number' && !isNaN(parsed.consecutiveLossCount)
        ? Math.max(0, Math.min(5, Math.floor(parsed.consecutiveLossCount)))
        : DEFAULT_PULL_BUDGET.consecutiveLossCount ?? 0;

    const result: PullBudgetState = {
      primogems,
      fates,
      characterPity,
      characterGuaranteed,
      consecutiveLossCount,
      weaponPity,
      weaponFatePoints,
    };

    return result;
  } catch {
    return { ...DEFAULT_PULL_BUDGET };
  }
}

export function savePullBudget(budget: PullBudgetState): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(PULL_BUDGET_KEY, JSON.stringify(budget));
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save pull budget';
    console.error('Failed to save pull budget to localStorage:', e);
    return false;
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

export function saveAbyssCycleId(id: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(ABYSS_CYCLE_ID_KEY, id);
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save abyss cycle id';
    console.error('Failed to save abyss cycle id to localStorage:', e);
    return false;
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

export function saveCustomAbyss(cycle: AbyssCycleConfig): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(CUSTOM_ABYSS_KEY, JSON.stringify(cycle));
    return true;
  } catch (e: any) {
    lastStorageError = e?.message || 'Failed to save custom abyss';
    console.error('Failed to save custom abyss to localStorage:', e);
    return false;
  }
}

// Auto-run non-destructive migration on initialization
migrateStorageIfNeeded();



