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
  sanitizePullBudget,
  DEFAULT_PULL_BUDGET_VALUES,
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
} from './storage-migration';

export {
  migrateStorageIfNeeded,
  getStorageSchemaVersion,
  createSafetySnapshot,
  rollbackToBackup,
  sanitizePullBudget,
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

// Dedicated namespace keys for Demo Mode (complete isolation across all 8 account domains)
const DEMO_ROSTER_KEY = 'celestia_v2_demo_roster';
const DEMO_PROFILES_KEY = 'celestia_v2_demo_profiles';
const DEMO_WEAPONS_KEY = 'celestia_v2_demo_weapons';
const DEMO_ARTIFACTS_KEY = 'celestia_v2_demo_artifacts';
const DEMO_UID_KEY = 'celestia_v2_demo_uid';
const DEMO_PULL_BUDGET_KEY = 'celestia_v2_demo_pull_budget';
const DEMO_ABYSS_CYCLE_ID_KEY = 'celestia_v2_demo_abyss_cycle_id';
const DEMO_CUSTOM_ABYSS_KEY = 'celestia_v2_demo_custom_abyss';

export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'QUOTA_EXCEEDED'
  | 'MALFORMED_JSON'
  | 'UNKNOWN';

export interface StorageErrorInfo {
  code: StorageErrorCode;
  operation: 'read' | 'write' | 'remove' | 'probe';
  key?: string;
  message: string;
  timestamp: string;
}

export interface StorageWriteResult {
  ok: boolean;
  error?: StorageErrorInfo;
}

let lastStorageError: string | null = null;
let lastStorageErrorInfo: StorageErrorInfo | null = null;

export function classifyStorageError(err: unknown): StorageErrorCode {
  if (!err || typeof err !== 'object') return 'UNKNOWN';
  const e = err as { name?: string; code?: number; message?: string };
  const name = e.name || '';
  const msg = (e.message || '').toLowerCase();

  if (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    msg.includes('quota')
  ) {
    return 'QUOTA_EXCEEDED';
  }
  if (name === 'SecurityError' || msg.includes('security') || msg.includes('denied') || msg.includes('unavailable')) {
    return 'STORAGE_UNAVAILABLE';
  }
  if (name === 'SyntaxError' || msg.includes('json') || msg.includes('syntax')) {
    return 'MALFORMED_JSON';
  }
  return 'UNKNOWN';
}

export function recordStorageError(
  operation: StorageErrorInfo['operation'],
  key: string | undefined,
  err: unknown,
  fallbackMessage: string,
  overrideCode?: StorageErrorCode,
): StorageErrorInfo {
  const code = overrideCode ?? classifyStorageError(err);
  const rawMessage =
    err instanceof Error && err.message
      ? err.message
      : fallbackMessage;
  const info: StorageErrorInfo = {
    code,
    operation,
    key,
    message: rawMessage,
    timestamp: new Date().toISOString(),
  };
  lastStorageError = rawMessage;
  lastStorageErrorInfo = info;
  return info;
}

export function clearLastStorageError(): void {
  lastStorageError = null;
  lastStorageErrorInfo = null;
}

export function getLastStorageError(): string | null {
  return lastStorageError;
}

export function getLastStorageErrorInfo(): StorageErrorInfo | null {
  return lastStorageErrorInfo;
}

export function isStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      recordStorageError('probe', undefined, null, 'Browser localStorage is unavailable', 'STORAGE_UNAVAILABLE');
      return false;
    }
    const testKey = '__celestia_probe__';
    localStorage.setItem(testKey, '1');
    const readBack = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    return readBack === '1';
  } catch (e) {
    recordStorageError('probe', '__celestia_probe__', e, 'Browser storage is unavailable or blocked');
    return false;
  }
}

function activeKey(realKey: string, demoKey: string): string {
  return isDemoModeEnabled() ? demoKey : realKey;
}

export const DEFAULT_PULL_BUDGET: PullBudgetState = { ...DEFAULT_PULL_BUDGET_VALUES };

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
  } catch (e) {
    recordStorageError('read', DEMO_MODE_KEY, e, 'Failed to read demo mode state');
    return false;
  }
}

export function setDemoModeEnabled(enabled: boolean): boolean {
  try {
    if (typeof localStorage === 'undefined') {
      recordStorageError('write', DEMO_MODE_KEY, null, 'localStorage is unavailable', 'STORAGE_UNAVAILABLE');
      return false;
    }
    localStorage.setItem(DEMO_MODE_KEY, enabled ? 'true' : 'false');
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', DEMO_MODE_KEY, e, 'Failed to save demo mode state');
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

/**
 * Reads authentic (non-demo) account identity metadata regardless of whether Demo Mode is currently active.
 * Used by backup conflict detection to prevent one user's backup from overwriting another's local profile.
 */
export function getAuthenticAccountSummary(): {
  uid: string;
  rosterIds: string[];
  characterCount: number;
} {
  try {
    if (typeof localStorage === 'undefined') {
      return { uid: '', rosterIds: [], characterCount: 0 };
    }
    const uid = (localStorage.getItem(UID_KEY) || '').trim();
    const rosterRaw = localStorage.getItem(ROSTER_KEY);
    const profilesRaw = localStorage.getItem(PROFILES_KEY);

    const idSet = new Set<string>();
    if (rosterRaw) {
      try {
        const parsedRoster = JSON.parse(rosterRaw);
        if (Array.isArray(parsedRoster)) {
          for (const id of parsedRoster) {
            if (typeof id === 'string' && id.trim()) idSet.add(id);
          }
        }
      } catch {
        // ignore parse error in summary
      }
    }
    if (profilesRaw) {
      try {
        const parsedProfiles = JSON.parse(profilesRaw);
        if (parsedProfiles && typeof parsedProfiles === 'object' && !Array.isArray(parsedProfiles)) {
          for (const id of Object.keys(parsedProfiles)) {
            if (id !== '__proto__' && id !== 'constructor' && id !== 'prototype') {
              idSet.add(id);
            }
          }
        }
      } catch {
        // ignore parse error in summary
      }
    }

    const rosterIds = Array.from(idSet);
    return {
      uid,
      rosterIds,
      characterCount: rosterIds.length,
    };
  } catch {
    return { uid: '', rosterIds: [], characterCount: 0 };
  }
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

    // Also clean up all demo namespace records if present
    localStorage.removeItem(DEMO_ROSTER_KEY);
    localStorage.removeItem(DEMO_PROFILES_KEY);
    localStorage.removeItem(DEMO_WEAPONS_KEY);
    localStorage.removeItem(DEMO_ARTIFACTS_KEY);
    localStorage.removeItem(DEMO_UID_KEY);
    localStorage.removeItem(DEMO_PULL_BUDGET_KEY);
    localStorage.removeItem(DEMO_ABYSS_CYCLE_ID_KEY);
    localStorage.removeItem(DEMO_CUSTOM_ABYSS_KEY);
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('remove', undefined, e, 'Failed to reset account data');
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
  } catch (e) {
    recordStorageError('read', isDemoModeEnabled() ? DEMO_ROSTER_KEY : ROSTER_KEY, e, 'Malformed roster JSON in localStorage', 'MALFORMED_JSON');
    return isDemoModeEnabled() ? DEMO_ROSTER : DEFAULT_ROSTER;
  }
}

export function saveRoster(ids: string[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = isDemoModeEnabled() ? DEMO_ROSTER_KEY : ROSTER_KEY;
    localStorage.setItem(key, JSON.stringify(ids));
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', isDemoModeEnabled() ? DEMO_ROSTER_KEY : ROSTER_KEY, e, 'Failed to save roster');
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
          for (const [charId, prof] of Object.entries(profiles)) {
            if (charId === '__proto__' || charId === 'constructor' || charId === 'prototype') continue;
            if (prof?.weapon) {
              const rawKey = prof.weapon.key || (prof.weapon as any).weaponKey;
              const alias = resolveWeaponAlias(rawKey) || resolveWeaponAlias(prof.weapon.name);
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
    recordStorageError('read', isDemoModeEnabled() ? DEMO_PROFILES_KEY : PROFILES_KEY, e, 'Malformed character profiles JSON in localStorage', 'MALFORMED_JSON');
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
    if (rosterSaved) {
      clearLastStorageError();
    }
    return rosterSaved;
  } catch (e: any) {
    recordStorageError('write', isDemoModeEnabled() ? DEMO_PROFILES_KEY : PROFILES_KEY, e, 'Failed to save profiles to localStorage');
    console.error('Failed to save profiles to localStorage:', e);
    return false;
  }
}

export function getSavedArtifacts(): any[] {
  try {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY;
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    recordStorageError('read', isDemoModeEnabled() ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY, e, 'Malformed artifacts JSON in localStorage', 'MALFORMED_JSON');
    return [];
  }
}

export function seedDemoArtifacts(): boolean {
  if (typeof localStorage === 'undefined') return false;
  try {
    localStorage.setItem(DEMO_ARTIFACTS_KEY, JSON.stringify(DEFAULT_DEMO_ARTIFACTS));
    clearLastStorageError();
    return true;
  } catch (e) {
    recordStorageError('write', DEMO_ARTIFACTS_KEY, e, 'Failed to seed demo artifacts');
    return false;
  }
}

export function saveArtifacts(artifacts: any[]): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const isDemo = isDemoModeEnabled();
    const key = isDemo ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY;
    localStorage.setItem(key, JSON.stringify(artifacts));
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', isDemoModeEnabled() ? DEMO_ARTIFACTS_KEY : ARTIFACTS_KEY, e, 'Failed to save artifacts (quota exceeded)');
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
            const rawKey = w.key || (w as any).weaponKey;
            const alias = resolveWeaponAlias(rawKey) || resolveWeaponAlias(w.name);
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
    recordStorageError('read', isDemoModeEnabled() ? DEMO_WEAPONS_KEY : WEAPONS_KEY, e, 'Malformed weapons JSON in localStorage', 'MALFORMED_JSON');
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
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', isDemoModeEnabled() ? DEMO_WEAPONS_KEY : WEAPONS_KEY, e, 'Failed to save weapons (quota exceeded)');
    console.warn('Failed to save weapons to localStorage:', e);
    return false;
  }
}

export function getSavedUid(): string {
  try {
    if (typeof localStorage === 'undefined') return '';
    const key = activeKey(UID_KEY, DEMO_UID_KEY);
    return localStorage.getItem(key) || '';
  } catch (e) {
    recordStorageError('read', activeKey(UID_KEY, DEMO_UID_KEY), e, 'Failed to read UID from storage');
    return '';
  }
}

export function saveUid(uid: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = activeKey(UID_KEY, DEMO_UID_KEY);
    localStorage.setItem(key, uid);
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', activeKey(UID_KEY, DEMO_UID_KEY), e, 'Failed to save UID');
    console.error('Failed to save uid to localStorage:', e);
    return false;
  }
}

export function getSavedPullBudget(): PullBudgetState {
  try {
    if (typeof localStorage === 'undefined') return { ...DEFAULT_PULL_BUDGET };
    const key = activeKey(PULL_BUDGET_KEY, DEMO_PULL_BUDGET_KEY);
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULT_PULL_BUDGET };
    const parsed = JSON.parse(raw);
    return sanitizePullBudget(parsed);
  } catch (e) {
    recordStorageError('read', activeKey(PULL_BUDGET_KEY, DEMO_PULL_BUDGET_KEY), e, 'Malformed pull budget JSON in localStorage', 'MALFORMED_JSON');
    return { ...DEFAULT_PULL_BUDGET };
  }
}

export function savePullBudget(budget: PullBudgetState): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = activeKey(PULL_BUDGET_KEY, DEMO_PULL_BUDGET_KEY);
    const sanitized = sanitizePullBudget(budget);
    localStorage.setItem(key, JSON.stringify(sanitized));
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', activeKey(PULL_BUDGET_KEY, DEMO_PULL_BUDGET_KEY), e, 'Failed to save pull budget');
    console.error('Failed to save pull budget to localStorage:', e);
    return false;
  }
}

export function getSavedAbyssCycleId(): string {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
    const key = activeKey(ABYSS_CYCLE_ID_KEY, DEMO_ABYSS_CYCLE_ID_KEY);
    const saved = localStorage.getItem(key);
    const validIds = new Set(['cycle-7-2', 'cycle-7-1', 'cycle-5-3', 'cycle-5-2', 'cycle-5-1', 'custom-sandbox']);
    return saved && validIds.has(saved) ? saved : DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
  } catch (e) {
    recordStorageError('read', activeKey(ABYSS_CYCLE_ID_KEY, DEMO_ABYSS_CYCLE_ID_KEY), e, 'Failed to read abyss cycle id');
    return DEFAULT_ACTIVE_ABYSS_CYCLE_ID;
  }
}

export function saveAbyssCycleId(id: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = activeKey(ABYSS_CYCLE_ID_KEY, DEMO_ABYSS_CYCLE_ID_KEY);
    localStorage.setItem(key, id);
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', activeKey(ABYSS_CYCLE_ID_KEY, DEMO_ABYSS_CYCLE_ID_KEY), e, 'Failed to save abyss cycle id');
    console.error('Failed to save abyss cycle id to localStorage:', e);
    return false;
  }
}

export function getSavedCustomAbyss(): AbyssCycleConfig {
  try {
    if (typeof localStorage === 'undefined') return createCustomSandboxCycle();
    const key = activeKey(CUSTOM_ABYSS_KEY, DEMO_CUSTOM_ABYSS_KEY);
    const raw = localStorage.getItem(key);
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
  } catch (e) {
    recordStorageError('read', activeKey(CUSTOM_ABYSS_KEY, DEMO_CUSTOM_ABYSS_KEY), e, 'Malformed custom abyss JSON in localStorage', 'MALFORMED_JSON');
    return createCustomSandboxCycle();
  }
}

export function saveCustomAbyss(cycle: AbyssCycleConfig): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = activeKey(CUSTOM_ABYSS_KEY, DEMO_CUSTOM_ABYSS_KEY);
    localStorage.setItem(key, JSON.stringify(cycle));
    clearLastStorageError();
    return true;
  } catch (e: any) {
    recordStorageError('write', activeKey(CUSTOM_ABYSS_KEY, DEMO_CUSTOM_ABYSS_KEY), e, 'Failed to save custom abyss');
    console.error('Failed to save custom abyss to localStorage:', e);
    return false;
  }
}

// Auto-run non-destructive migration on initialization
migrateStorageIfNeeded();
