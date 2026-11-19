import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import { DEFAULT_ACTIVE_ABYSS_CYCLE_ID } from '../data/abyss-schedules';
import { CANONICAL_CHARACTER_IDS } from '../data/character-ids';
import { CURRENT_GAME_VERSION } from '../data/game-version';
import {
  getSavedRoster,
  getSavedProfiles,
  getSavedWeapons,
  getSavedArtifacts,
  getSavedPullBudget,
  getSavedAbyssCycleId,
  getSavedCustomAbyss,
  isDemoModeEnabled,
  saveRoster,
  saveProfiles,
  saveWeapons,
  saveArtifacts,
  savePullBudget,
  saveAbyssCycleId,
  saveCustomAbyss,
  setDemoModeEnabled,
  createSafetySnapshot,
  rollbackToBackup,
  CURRENT_SCHEMA_VERSION,
} from './storage';


export interface CelestiaBackupData {
  format: 'celestia_native';
  version: number;
  gameVersion: string;
  exportedAt: string;
  roster: string[];
  profiles: Record<string, OwnedCharacterProfile>;
  rawWeapons: OwnedWeapon[];
  rawArtifacts: any[];
  pullBudget: PullBudgetState;
  abyssCycleId?: string;
  customAbyssConfig?: AbyssCycleConfig | null;
  demoMode: boolean;
}

export interface ValidationSummary {
  characterCount: number;
  weaponCount: number;
  artifactCount: number;
  exportedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  summary?: ValidationSummary;
}

export const LAST_BACKUP_META_KEY = 'celestia_last_backup_meta';

export interface LastBackupMetadata {
  exportedAt: string;
  characterCount: number;
  weaponCount: number;
  artifactCount: number;
}

export function recordLastBackupMeta(meta: LastBackupMetadata): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(LAST_BACKUP_META_KEY, JSON.stringify(meta));
    return true;
  } catch {
    return false;
  }
}

export function getLastBackupMeta(): LastBackupMetadata | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(LAST_BACKUP_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function exportAccountBackup(): CelestiaBackupData {
  const backup: CelestiaBackupData = {
    format: 'celestia_native',
    version: CURRENT_SCHEMA_VERSION,
    gameVersion: CURRENT_GAME_VERSION,
    exportedAt: new Date().toISOString(),
    roster: getSavedRoster(),
    profiles: getSavedProfiles(),
    rawWeapons: getSavedWeapons(),
    rawArtifacts: getSavedArtifacts(),
    pullBudget: getSavedPullBudget(),
    abyssCycleId: getSavedAbyssCycleId(),
    customAbyssConfig: getSavedCustomAbyss(),
    demoMode: isDemoModeEnabled(),
  };

  recordLastBackupMeta({
    exportedAt: backup.exportedAt,
    characterCount: Array.isArray(backup.roster) ? backup.roster.length : 0,
    weaponCount: Array.isArray(backup.rawWeapons) ? backup.rawWeapons.length : 0,
    artifactCount: Array.isArray(backup.rawArtifacts) ? backup.rawArtifacts.length : 0,
  });

  return backup;
}

export function validateBackupData(data: unknown): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: ['Backup data must be a valid JSON object.'] };
  }

  const payload = data as Record<string, any>;

  if (payload.format !== 'celestia_native') {
    errors.push('Unrecognized backup format. Expected "celestia_native".');
  }

  if (
    typeof payload.version !== 'number' ||
    !Number.isInteger(payload.version) ||
    payload.version < 1 ||
    payload.version > CURRENT_SCHEMA_VERSION
  ) {
    errors.push(`Unsupported schema version: ${payload.version}. Max supported version is ${CURRENT_SCHEMA_VERSION}.`);
  }

  if (!Array.isArray(payload.roster)) {
    errors.push('Roster must be an array of character IDs.');
  } else {
    for (const id of payload.roster) {
      if (typeof id !== 'string' || !CANONICAL_CHARACTER_IDS.has(id)) {
        errors.push(`Unauthorized or invalid character ID in roster: "${id}".`);
        break;
      }
    }
  }

  if (!payload.profiles || typeof payload.profiles !== 'object' || Array.isArray(payload.profiles)) {
    errors.push('Profiles must be a dictionary of character profiles.');
  } else {
    for (const [charId, prof] of Object.entries(payload.profiles)) {
      if (charId === '__proto__' || charId === 'constructor' || charId === 'prototype') continue;
      if (!CANONICAL_CHARACTER_IDS.has(charId)) {
        errors.push(`Unauthorized or invalid character profile key: "${charId}".`);
        break;
      }
      if (!prof || typeof prof !== 'object' || Array.isArray(prof)) {
        errors.push(`Profile for "${charId}" must be a valid profile object.`);
        break;
      }
      const p = prof as any;
      if (
        p.level !== undefined &&
        (!Number.isFinite(p.level) || !Number.isInteger(p.level) || p.level < 1 || p.level > 90)
      ) {
        errors.push(`Character "${charId}" level must be an integer between 1 and 90.`);
      }
      if (
        p.constellation !== undefined &&
        (!Number.isFinite(p.constellation) ||
          !Number.isInteger(p.constellation) ||
          p.constellation < 0 ||
          p.constellation > 6)
      ) {
        errors.push(`Character "${charId}" constellation must be an integer between 0 and 6.`);
      }
    }
  }

  if (!Array.isArray(payload.rawWeapons)) {
    errors.push('Weapons must be an array of weapon objects.');
  } else {
    for (const w of payload.rawWeapons) {
      if (!w || typeof w !== 'object' || Array.isArray(w)) {
        errors.push('Each weapon in weapons armory must be a valid object.');
        break;
      }
    }
  }

  if (!Array.isArray(payload.rawArtifacts)) {
    errors.push('Artifacts must be an array.');
  }

  if (!payload.pullBudget || typeof payload.pullBudget !== 'object' || Array.isArray(payload.pullBudget)) {
    errors.push('Pull budget configuration is missing or invalid.');
  } else {
    const pb = payload.pullBudget;
    if (typeof pb.primogems !== 'number' || !Number.isFinite(pb.primogems) || pb.primogems < 0) {
      errors.push('Primogems must be a non-negative finite number.');
    }
    if (typeof pb.fates !== 'number' || !Number.isFinite(pb.fates) || pb.fates < 0) {
      errors.push('Fates must be a non-negative finite number.');
    }
    if (
      typeof pb.characterPity !== 'number' ||
      !Number.isFinite(pb.characterPity) ||
      pb.characterPity < 0 ||
      pb.characterPity > 89
    ) {
      errors.push(`Character pity must be between 0 and 89 (received ${pb.characterPity}).`);
    }
    if (
      typeof pb.weaponPity !== 'number' ||
      !Number.isFinite(pb.weaponPity) ||
      pb.weaponPity < 0 ||
      pb.weaponPity > 79
    ) {
      errors.push(`Weapon pity must be between 0 and 79 (received ${pb.weaponPity}).`);
    }
    if (
      typeof pb.weaponFatePoints !== 'number' ||
      !Number.isFinite(pb.weaponFatePoints) ||
      (pb.weaponFatePoints !== 0 && pb.weaponFatePoints !== 1)
    ) {
      errors.push(`Weapon Fate Points must be 0 or 1 (received ${pb.weaponFatePoints}).`);
    }
    if (pb.consecutiveLossCount !== undefined) {
      if (
        typeof pb.consecutiveLossCount !== 'number' ||
        !Number.isFinite(pb.consecutiveLossCount) ||
        pb.consecutiveLossCount < 0 ||
        pb.consecutiveLossCount > 5
      ) {
        errors.push(`Consecutive loss count must be between 0 and 5.`);
      }
    }
  }

  if (payload.customAbyssConfig !== undefined && payload.customAbyssConfig !== null) {
    if (typeof payload.customAbyssConfig !== 'object' || Array.isArray(payload.customAbyssConfig)) {
      errors.push('Custom Abyss configuration must be an object.');
    } else {
      const ca = payload.customAbyssConfig;
      if (!Array.isArray(ca.chambers) || ca.chambers.length !== 3) {
        errors.push('Custom Abyss configuration must have exactly 3 chambers.');
      }
    }
  }

  if (payload.abyssCycleId !== undefined && payload.abyssCycleId !== null) {
    if (typeof payload.abyssCycleId !== 'string' || payload.abyssCycleId.trim() === '') {
      errors.push('Abyss cycle ID must be a valid non-empty string.');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    summary: {
      characterCount: Array.isArray(payload.roster) ? payload.roster.length : Object.keys(payload.profiles || {}).length,
      weaponCount: Array.isArray(payload.rawWeapons) ? payload.rawWeapons.length : 0,
      artifactCount: Array.isArray(payload.rawArtifacts) ? payload.rawArtifacts.length : 0,
      exportedAt: typeof payload.exportedAt === 'string' ? payload.exportedAt : new Date().toISOString(),
    },
  };
}

export function importAccountBackup(backup: CelestiaBackupData): {
  success: boolean;
  error?: string;
  rolledBack?: boolean;
} {
  try {
    const validation = validateBackupData(backup);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Safety: snapshot current state before overwriting
    const snapshotOk = createSafetySnapshot('celestia_backup_pre_restore');
    if (!snapshotOk) {
      return {
        success: false,
        error: 'Failed to create safety snapshot prior to restore. Storage may be unavailable.',
      };
    }

    // Set target namespace before writing so restored data routes into the correct storage keys
    setDemoModeEnabled(Boolean(backup.demoMode));

    // Overwrite stored state and track write outcomes
    const results = [
      saveProfiles(backup.profiles || {}),
      saveRoster(backup.roster || Object.keys(backup.profiles || {})),
      saveWeapons(backup.rawWeapons || []),
      saveArtifacts(backup.rawArtifacts || []),
      savePullBudget(backup.pullBudget),
    ];

    if (backup.abyssCycleId) {
      results.push(saveAbyssCycleId(backup.abyssCycleId));
    } else {
      results.push(saveAbyssCycleId(DEFAULT_ACTIVE_ABYSS_CYCLE_ID));
    }

    if (backup.customAbyssConfig) {
      results.push(saveCustomAbyss(backup.customAbyssConfig));
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('celestia_v2_custom_abyss');
    }

    if (results.some((res) => res === false)) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'One or more storage writes failed during restore (storage quota exceeded or unavailable). All modifications were automatically rolled back.',
        rolledBack: true,
      };
    }

    // Post-restore verification: confirm records were written accurately
    const verifiedProfiles = getSavedProfiles();
    const expectedKeys = Object.keys(backup.profiles || {});
    if (expectedKeys.length > 0 && !expectedKeys.every((k) => verifiedProfiles[k] !== undefined)) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Post-restore verification failed: profiles did not persist accurately. All modifications were automatically rolled back.',
        rolledBack: true,
      };
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('celestia_schema_version', String(CURRENT_SCHEMA_VERSION));
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to import account backup:', e);
    rollbackPreRestoreBackup();
    return {
      success: false,
      error: `Restore failed unexpectedly: ${e?.message || 'Unknown error'}. All modifications were automatically rolled back.`,
      rolledBack: true,
    };
  }
}

export function rollbackPreRestoreBackup(): boolean {
  return rollbackToBackup('celestia_backup_pre_restore');
}

export function downloadBackupFile(backupData?: CelestiaBackupData): void {
  const data = backupData ?? exportAccountBackup();
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `celestia-backup-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
