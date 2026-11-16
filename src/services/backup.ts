import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
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

export function exportAccountBackup(): CelestiaBackupData {
  return {
    format: 'celestia_native',
    version: CURRENT_SCHEMA_VERSION,
    gameVersion: '7.2',
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

  if (typeof payload.version !== 'number' || payload.version < 1 || payload.version > CURRENT_SCHEMA_VERSION) {
    errors.push(`Unsupported schema version: ${payload.version}. Max supported version is ${CURRENT_SCHEMA_VERSION}.`);
  }

  if (!Array.isArray(payload.roster)) {
    errors.push('Roster must be an array of character IDs.');
  }

  if (!payload.profiles || typeof payload.profiles !== 'object' || Array.isArray(payload.profiles)) {
    errors.push('Profiles must be a dictionary of character profiles.');
  }

  if (!Array.isArray(payload.rawWeapons)) {
    errors.push('Weapons must be an array of weapon objects.');
  }

  if (!Array.isArray(payload.rawArtifacts)) {
    errors.push('Artifacts must be an array.');
  }

  if (!payload.pullBudget || typeof payload.pullBudget !== 'object' || Array.isArray(payload.pullBudget)) {
    errors.push('Pull budget configuration is missing or invalid.');
  } else {
    const pb = payload.pullBudget;
    if (typeof pb.primogems !== 'number' || pb.primogems < 0) {
      errors.push('Primogems must be a non-negative number.');
    }
    if (typeof pb.fates !== 'number' || pb.fates < 0) {
      errors.push('Fates must be a non-negative number.');
    }
    if (typeof pb.characterPity !== 'number' || pb.characterPity < 0 || pb.characterPity > 89) {
      errors.push(`Character pity must be between 0 and 89 (received ${pb.characterPity}).`);
    }
    if (typeof pb.weaponPity !== 'number' || pb.weaponPity < 0 || pb.weaponPity > 79) {
      errors.push(`Weapon pity must be between 0 and 79 (received ${pb.weaponPity}).`);
    }
    if (typeof pb.weaponFatePoints !== 'number' || pb.weaponFatePoints < 0 || pb.weaponFatePoints > 1) {
      errors.push(`Weapon Fate Points must be 0 or 1 (received ${pb.weaponFatePoints}).`);
    }
    if (pb.consecutiveLossCount !== undefined) {
      if (typeof pb.consecutiveLossCount !== 'number' || pb.consecutiveLossCount < 0 || pb.consecutiveLossCount > 5) {
        errors.push(`Consecutive loss count must be between 0 and 5.`);
      }
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

export function importAccountBackup(backup: CelestiaBackupData): { success: boolean; error?: string } {
  try {
    const validation = validateBackupData(backup);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Safety: snapshot current state before overwriting
    createSafetySnapshot('celestia_backup_pre_restore');

    // Overwrite stored state
    saveRoster(backup.roster || []);
    saveProfiles(backup.profiles || {});
    saveWeapons(backup.rawWeapons || []);
    saveArtifacts(backup.rawArtifacts || []);
    savePullBudget(backup.pullBudget);

    if (backup.abyssCycleId) {
      saveAbyssCycleId(backup.abyssCycleId);
    }
    if (backup.customAbyssConfig) {
      saveCustomAbyss(backup.customAbyssConfig);
    }
    setDemoModeEnabled(Boolean(backup.demoMode));

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('celestia_schema_version', String(CURRENT_SCHEMA_VERSION));
    }

    return { success: true };
  } catch (e: any) {
    console.error('Failed to import account backup:', e);
    return { success: false, error: e?.message || 'Unknown import error' };
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
