import type { PullBudgetState } from '../types/genshin';
import { resolveWeaponAlias } from '../data/weapon-aliases';

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
  'celestia_v2_demo_roster',
  'celestia_v2_demo_profiles',
  'celestia_v2_demo_weapons',
  'celestia_v2_demo_artifacts',
  'celestia_v2_demo_uid',
  'celestia_v2_demo_pull_budget',
  'celestia_v2_demo_abyss_cycle_id',
  'celestia_v2_demo_custom_abyss',
  'celestia_last_backup_meta',
] as const;

export const DEFAULT_PULL_BUDGET_VALUES: PullBudgetState = {
  primogems: 0,
  fates: 0,
  characterPity: 0,
  characterGuaranteed: false,
  consecutiveLossCount: 0,
  weaponPity: 0,
  weaponGuaranteed: false,
  weaponFatePoints: 0,
  chronicledPity: 0,
  chronicledFatePoints: 0,
  includeCashback: false,
};

/**
 * Sanitizes and clamps any raw pull budget object (v1 or v2) without dropping M8 fields.
 */
export function sanitizePullBudget(raw: unknown): PullBudgetState {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_PULL_BUDGET_VALUES };
  }
  const parsed = raw as Record<string, unknown>;

  const clampInt = (val: unknown, min: number, max: number, fallback: number): number =>
    typeof val === 'number' && Number.isFinite(val)
      ? Math.max(min, Math.min(max, Math.floor(val)))
      : fallback;

  const toBool = (val: unknown, fallback: boolean): boolean =>
    typeof val === 'boolean' ? val : fallback;

  return {
    primogems: clampInt(parsed.primogems, 0, Number.MAX_SAFE_INTEGER, DEFAULT_PULL_BUDGET_VALUES.primogems),
    fates: clampInt(parsed.fates, 0, Number.MAX_SAFE_INTEGER, DEFAULT_PULL_BUDGET_VALUES.fates),
    characterPity: clampInt(parsed.characterPity, 0, 89, DEFAULT_PULL_BUDGET_VALUES.characterPity),
    characterGuaranteed: toBool(parsed.characterGuaranteed, DEFAULT_PULL_BUDGET_VALUES.characterGuaranteed),
    consecutiveLossCount: clampInt(
      parsed.consecutiveLossCount,
      0,
      5,
      DEFAULT_PULL_BUDGET_VALUES.consecutiveLossCount ?? 0,
    ),
    weaponPity: clampInt(parsed.weaponPity, 0, 79, DEFAULT_PULL_BUDGET_VALUES.weaponPity),
    weaponGuaranteed: toBool(parsed.weaponGuaranteed, DEFAULT_PULL_BUDGET_VALUES.weaponGuaranteed ?? false),
    weaponFatePoints: clampInt(parsed.weaponFatePoints, 0, 1, DEFAULT_PULL_BUDGET_VALUES.weaponFatePoints),
    chronicledPity: clampInt(parsed.chronicledPity, 0, 89, DEFAULT_PULL_BUDGET_VALUES.chronicledPity ?? 0),
    chronicledFatePoints: clampInt(
      parsed.chronicledFatePoints,
      0,
      1,
      DEFAULT_PULL_BUDGET_VALUES.chronicledFatePoints ?? 0,
    ),
    includeCashback: toBool(parsed.includeCashback, DEFAULT_PULL_BUDGET_VALUES.includeCashback ?? false),
  };
}

export function getStorageSchemaVersion(): number {
  try {
    if (typeof localStorage === 'undefined') return CURRENT_SCHEMA_VERSION;
    const raw = localStorage.getItem(SCHEMA_VERSION_KEY);
    if (!raw) return 0;
    const parsed = parseInt(raw, 10);
    return Number.isNaN(parsed) ? 0 : parsed;
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
      if (key && (key.startsWith('celestia_') || (KNOWN_STORAGE_KEYS as readonly string[]).includes(key))) {
        // Do not nest snapshots inside snapshots or allow prototype pollution keys
        if (
          key === snapshotKey ||
          key.startsWith('celestia_backup_') ||
          key === '__proto__' ||
          key === 'constructor' ||
          key === 'prototype'
        ) {
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
      if (key && (key.startsWith('celestia_') || (KNOWN_STORAGE_KEYS as readonly string[]).includes(key))) {
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
  error?: string;
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

    // Step 1: Create immutable safety snapshot before migrating v1 data.
    // Abort without mutating existing records if snapshot cannot be persisted.
    const snapshotOk = createSafetySnapshot('celestia_backup_v1');
    if (!snapshotOk) {
      return {
        migrated: false,
        fromVersion: currentVersion === 0 ? 1 : currentVersion,
        toVersion: CURRENT_SCHEMA_VERSION,
        error: 'Unable to create pre-migration safety snapshot. Migration aborted safely without modifying data.',
      };
    }

    // Step 2: Normalize raw weapons in celestia_v2_raw_weapons
    const rawWeaponsJson = localStorage.getItem('celestia_v2_raw_weapons');
    if (rawWeaponsJson) {
      try {
        const parsedWeapons = JSON.parse(rawWeaponsJson);
        if (Array.isArray(parsedWeapons)) {
          const normalizedWeapons = parsedWeapons.map((w: any) => {
            if (!w || typeof w !== 'object') return w;
            const rawKey = w.key || w.weaponKey;
            const canonical = resolveWeaponAlias(rawKey) || resolveWeaponAlias(w.name);
            return {
              ...w,
              key: canonical?.key || rawKey,
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
          for (const [charId, prof] of Object.entries(parsedProfiles) as [string, any][]) {
            if (charId === '__proto__' || charId === 'constructor' || charId === 'prototype') continue;
            if (prof?.weapon) {
              const rawKey = prof.weapon.key || prof.weapon.weaponKey;
              const canonical = resolveWeaponAlias(rawKey) || resolveWeaponAlias(prof.weapon.name);
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

    // Step 4: Sanitize and clamp pull budget in celestia_v2_pull_budget (preserving all M8 fields)
    const rawBudgetJson = localStorage.getItem('celestia_v2_pull_budget');
    if (rawBudgetJson) {
      try {
        const parsed = JSON.parse(rawBudgetJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          const sanitizedBudget = sanitizePullBudget(parsed);
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
  } catch (e: any) {
    console.error('Storage migration failed:', e);
    rollbackToBackup('celestia_backup_v1');
    return {
      migrated: false,
      fromVersion: 0,
      toVersion: CURRENT_SCHEMA_VERSION,
      error: e?.message || 'Storage migration failed and was rolled back.',
    };
  }
}
