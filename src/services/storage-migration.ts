import { getWeaponByKey } from '../data/weapons';
import type { PullBudgetState } from '../types/genshin';

export const SCHEMA_VERSION_KEY = 'celestia_schema_version';
export const CURRENT_SCHEMA_VERSION = 2;

export const KNOWN_STORAGE_KEYS = [
  'celestia_v2_owned_roster',
  'celestia_v2_roster_profiles',
  'celestia_v2_raw_artifacts',
  'celestia_v2_raw_weapons',
  'celestia_v2_active_uid',
  'celestia_v2_pull_budget',
  'celestia_v2_abyss_cycle_id',
  'celestia_v2_custom_abyss',
  'celestia_v2_demo_mode',
] as const;

export function getStorageSchemaVersion(): number {
  try {
    if (typeof localStorage === 'undefined') return CURRENT_SCHEMA_VERSION;
    const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch {
    return 0;
  }
}

export function createSafetySnapshot(snapshotKey: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const snapshot: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('celestia_') || KNOWN_STORAGE_KEYS.includes(key as any))) {
        // Do not nest snapshots inside snapshots or allow prototype pollution keys
        if (key === snapshotKey || key.startsWith('celestia_backup_') || key === '__proto__' || key === 'constructor' || key === 'prototype') {
          continue;
        }
        const val = localStorage.getItem(key);
        if (val !== null) {
          snapshot[key] = val;
        }
      }
    }
    localStorage.setItem(snapshotKey, JSON.stringify(snapshot));
    return true;
  } catch (e) {
    console.warn(`Failed to create safety snapshot at ${snapshotKey}:`, e);
    return false;
  }
}

export function rollbackToBackup(backupKey: string): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    const raw = localStorage.getItem(backupKey);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return false;

    // 1. Collect all current celestia keys in localStorage before mutation
    const currentKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('celestia_') || KNOWN_STORAGE_KEYS.includes(key as any))) {
        if (!key.startsWith('celestia_backup_')) {
          currentKeys.push(key);
        }
      }
    }

    // 2. Remove keys that were added after the snapshot was taken
    for (const key of currentKeys) {
      if (!Object.prototype.hasOwnProperty.call(parsed, key)) {
        localStorage.removeItem(key);
      }
    }

    // 3. Restore each key-value pair from the snapshot
    for (const [key, value] of Object.entries(parsed)) {
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
      if (typeof value === 'string') {
        localStorage.setItem(key, value);
      }
    }
    return true;
  } catch (e) {
    console.error(`Failed to rollback to backup ${backupKey}:`, e);
    return false;
  }
}

export interface MigrationResult {
  migrated: boolean;
  fromVersion: number;
  toVersion: number;
}

export function migrateStorageIfNeeded(): MigrationResult {
  try {
    if (typeof localStorage === 'undefined') {
      return { migrated: false, fromVersion: CURRENT_SCHEMA_VERSION, toVersion: CURRENT_SCHEMA_VERSION };
    }

    const currentVersion = getStorageSchemaVersion();
    if (currentVersion >= CURRENT_SCHEMA_VERSION) {
      return { migrated: false, fromVersion: currentVersion, toVersion: currentVersion };
    }

    // Check if there is existing data in localStorage
    const hasLegacyData = KNOWN_STORAGE_KEYS.some((key) => localStorage.getItem(key) !== null);

    if (!hasLegacyData) {
      // Fresh user: stamp version 2
      localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));
      return { migrated: true, fromVersion: 0, toVersion: CURRENT_SCHEMA_VERSION };
    }

    // Step 1: Create immutable safety snapshot before migrating v1 data
    createSafetySnapshot('celestia_backup_v1');

    // Step 2: Normalize raw weapons in celestia_v2_raw_weapons
    const rawWeaponsJson = localStorage.getItem('celestia_v2_raw_weapons');
    if (rawWeaponsJson) {
      try {
        const parsedWeapons = JSON.parse(rawWeaponsJson);
        if (Array.isArray(parsedWeapons)) {
          const normalizedWeapons = parsedWeapons.map((w: any) => {
            if (!w || typeof w !== 'object') return w;
            const canonical = getWeaponByKey(w.key) || getWeaponByKey(w.name);
            return {
              ...w,
              key: canonical?.key || w.key,
              name: canonical?.name || w.name,
              rarity: canonical?.rarity || w.rarity || 4,
            };
          });
          localStorage.setItem('celestia_v2_raw_weapons', JSON.stringify(normalizedWeapons));
        }
      } catch (err) {
        console.warn('Failed parsing raw weapons during migration:', err);
      }
    }

    // Step 3: Normalize character profiles in celestia_v2_roster_profiles
    const rawProfilesJson = localStorage.getItem('celestia_v2_roster_profiles');
    if (rawProfilesJson) {
      try {
        const parsedProfiles = JSON.parse(rawProfilesJson);
        if (parsedProfiles && typeof parsedProfiles === 'object' && !Array.isArray(parsedProfiles)) {
          for (const prof of Object.values(parsedProfiles) as any[]) {
            if (prof?.weapon) {
              const canonical = getWeaponByKey(prof.weapon.key) || getWeaponByKey(prof.weapon.name);
              if (canonical) {
                prof.weapon.key = canonical.key;
                prof.weapon.name = canonical.name;
                prof.weapon.rarity = canonical.rarity;
              }
            }
          }
          localStorage.setItem('celestia_v2_roster_profiles', JSON.stringify(parsedProfiles));
        }
      } catch (err) {
        console.warn('Failed parsing profiles during migration:', err);
      }
    }

    // Step 4: Sanitize and clamp pull budget in celestia_v2_pull_budget
    const rawBudgetJson = localStorage.getItem('celestia_v2_pull_budget');
    if (rawBudgetJson) {
      try {
        const parsed = JSON.parse(rawBudgetJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const primogems = typeof parsed.primogems === 'number' && !isNaN(parsed.primogems)
            ? Math.max(0, Math.floor(parsed.primogems))
            : 0;
          const fates = typeof parsed.fates === 'number' && !isNaN(parsed.fates)
            ? Math.max(0, Math.floor(parsed.fates))
            : 0;
          const characterPity = typeof parsed.characterPity === 'number' && !isNaN(parsed.characterPity)
            ? Math.max(0, Math.min(89, Math.floor(parsed.characterPity)))
            : 0;
          const characterGuaranteed = typeof parsed.characterGuaranteed === 'boolean'
            ? parsed.characterGuaranteed
            : false;
          const consecutiveLossCount = typeof parsed.consecutiveLossCount === 'number' && !isNaN(parsed.consecutiveLossCount)
            ? Math.max(0, Math.min(5, Math.floor(parsed.consecutiveLossCount)))
            : 0;
          const weaponPity = typeof parsed.weaponPity === 'number' && !isNaN(parsed.weaponPity)
            ? Math.max(0, Math.min(79, Math.floor(parsed.weaponPity)))
            : 0;
          const weaponFatePoints = typeof parsed.weaponFatePoints === 'number' && !isNaN(parsed.weaponFatePoints)
            ? Math.max(0, Math.min(1, Math.floor(parsed.weaponFatePoints)))
            : 0;

          const sanitizedBudget: PullBudgetState = {
            primogems,
            fates,
            characterPity,
            characterGuaranteed,
            consecutiveLossCount,
            weaponPity,
            weaponFatePoints,
          };
          localStorage.setItem('celestia_v2_pull_budget', JSON.stringify(sanitizedBudget));
        }
      } catch (err) {
        console.warn('Failed parsing pull budget during migration:', err);
      }
    }

    // Step 5: Mark schema version as 2
    const fromVersion = currentVersion === 0 ? 1 : currentVersion;
    localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA_VERSION));

    return {
      migrated: true,
      fromVersion,
      toVersion: CURRENT_SCHEMA_VERSION,
    };
  } catch (e) {
    console.error('Storage migration failed:', e);
    // Safely attempt rollback if snapshot exists
    rollbackToBackup('celestia_backup_v1');
    return {
      migrated: false,
      fromVersion: 0,
      toVersion: CURRENT_SCHEMA_VERSION,
    };
  }
}
