import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import { DEFAULT_ACTIVE_ABYSS_CYCLE_ID } from '../data/abyss-schedules';
import { CANONICAL_CHARACTER_IDS } from '../data/character-ids';
import { CURRENT_GAME_VERSION } from '../data/game-version';
import { resolveWeaponAlias } from '../data/weapon-aliases';
import {
  getSavedRoster,
  getSavedProfiles,
  getSavedWeapons,
  getSavedArtifacts,
  getSavedPullBudget,
  getSavedUid,
  getSavedAbyssCycleId,
  getSavedCustomAbyss,
  getAuthenticAccountSummary,
  isDemoModeEnabled,
  saveRoster,
  saveProfiles,
  saveWeapons,
  saveArtifacts,
  savePullBudget,
  saveUid,
  saveAbyssCycleId,
  saveCustomAbyss,
  setDemoModeEnabled,
  createSafetySnapshot,
  rollbackToBackup,
  sanitizePullBudget,
  CURRENT_SCHEMA_VERSION,
} from './storage';

export interface CelestiaBackupData {
  format: 'celestia_native';
  version: number;
  gameVersion: string;
  exportedAt: string;
  uid?: string;
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
  uid?: string;
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

export interface AccountConflictResult {
  hasConflict: boolean;
  reason?: 'uid_mismatch' | 'existing_account_overwrite';
  currentUid: string;
  incomingUid: string;
  currentCharacterCount: number;
  incomingCharacterCount: number;
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
    uid: getSavedUid(),
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

/**
 * Detects if restoring this backup would overwrite an existing, different account.
 */
export function detectAccountConflict(incoming: CelestiaBackupData): AccountConflictResult {
  const authentic = getAuthenticAccountSummary();
  const currentUid = authentic.uid;
  const incomingUid = (incoming.uid || '').trim();
  const currentCharacterCount = authentic.characterCount;
  const incomingCharacterCount = Array.isArray(incoming.roster)
    ? incoming.roster.length
    : Object.keys(incoming.profiles || {}).length;

  // Conflict 1: Explicit UID mismatch between active account and backup
  if (currentUid && incomingUid && currentUid !== incomingUid) {
    return {
      hasConflict: true,
      reason: 'uid_mismatch',
      currentUid,
      incomingUid,
      currentCharacterCount,
      incomingCharacterCount,
    };
  }

  // Conflict 2: Active account has existing populated data (chars > 0 or UID set)
  // and incoming backup has a different or newly introduced UID
  if (currentCharacterCount > 0 && incomingUid && !currentUid) {
    return {
      hasConflict: true,
      reason: 'existing_account_overwrite',
      currentUid: '(unassigned)',
      incomingUid,
      currentCharacterCount,
      incomingCharacterCount,
    };
  }

  return {
    hasConflict: false,
    currentUid,
    incomingUid,
    currentCharacterCount,
    incomingCharacterCount,
  };
}

/**
 * Normalizes legacy v1 backup structures, aliased weapon keys, and legacy pull budgets to v2 standards.
 */
export function normalizeBackupPayload(backup: CelestiaBackupData): CelestiaBackupData {
  const normalizedProfiles: Record<string, OwnedCharacterProfile> = {};
  if (backup.profiles && typeof backup.profiles === 'object' && !Array.isArray(backup.profiles)) {
    for (const [charId, prof] of Object.entries(backup.profiles)) {
      if (charId === '__proto__' || charId === 'constructor' || charId === 'prototype') continue;
      const copy: OwnedCharacterProfile = { ...prof };
      if (copy.weapon) {
        const rawKey = copy.weapon.key || (copy.weapon as any).weaponKey;
        const alias = resolveWeaponAlias(rawKey) || resolveWeaponAlias(copy.weapon.name);
        if (alias) {
          copy.weapon = {
            ...copy.weapon,
            key: alias.key,
            name: alias.name,
            rarity: alias.rarity,
          };
        }
      }
      normalizedProfiles[charId] = copy;
    }
  }

  const normalizedWeapons: OwnedWeapon[] = Array.isArray(backup.rawWeapons)
    ? backup.rawWeapons.map((w: any) => {
        if (!w || typeof w !== 'object') return w;
        const rawKey = w.key || w.weaponKey;
        const alias = resolveWeaponAlias(rawKey) || resolveWeaponAlias(w.name);
        return {
          ...w,
          key: alias?.key || rawKey,
          name: alias?.name || w.name,
          rarity: alias?.rarity || w.rarity || 4,
        };
      })
    : [];

  return {
    ...backup,
    version: CURRENT_SCHEMA_VERSION,
    profiles: normalizedProfiles,
    rawWeapons: normalizedWeapons,
    pullBudget: sanitizePullBudget(backup.pullBudget),
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

  if (
    typeof payload.version !== 'number' ||
    !Number.isInteger(payload.version) ||
    payload.version < 1 ||
    payload.version > CURRENT_SCHEMA_VERSION
  ) {
    errors.push(`Unsupported schema version: ${payload.version}. Max supported version is ${CURRENT_SCHEMA_VERSION}.`);
  }

  // Validate UID if present
  if (payload.uid !== undefined && payload.uid !== null && payload.uid !== '') {
    if (typeof payload.uid !== 'string' || !/^\d{9,10}$/.test(payload.uid.trim())) {
      errors.push(`Invalid account UID format in backup: "${payload.uid}". Expected 9 or 10 digits.`);
    }
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
      if (
        p.ascension !== undefined &&
        (!Number.isFinite(p.ascension) ||
          !Number.isInteger(p.ascension) ||
          p.ascension < 0 ||
          p.ascension > 6)
      ) {
        errors.push(`Character "${charId}" ascension must be an integer between 0 and 6.`);
      }
      if (p.talents !== undefined && p.talents !== null) {
        if (typeof p.talents !== 'object' || Array.isArray(p.talents)) {
          errors.push(`Character "${charId}" talents must be an object.`);
        } else {
          for (const talentKey of ['auto', 'skill', 'burst'] as const) {
            const tVal = p.talents[talentKey];
            if (
              tVal !== undefined &&
              (!Number.isFinite(tVal) || !Number.isInteger(tVal) || tVal < 1 || tVal > 15)
            ) {
              errors.push(`Character "${charId}" talent ${talentKey} must be an integer between 1 and 15.`);
            }
          }
        }
      }
      if (p.weapon !== undefined && p.weapon !== null) {
        if (typeof p.weapon !== 'object' || Array.isArray(p.weapon)) {
          errors.push(`Character "${charId}" weapon must be a valid weapon object.`);
        } else {
          const wKey = p.weapon.key || p.weapon.weaponKey;
          if (typeof wKey !== 'string' || !wKey.trim()) {
            errors.push(`Character "${charId}" weapon must have a valid key string.`);
          }
          if (
            p.weapon.level !== undefined &&
            (!Number.isFinite(p.weapon.level) || !Number.isInteger(p.weapon.level) || p.weapon.level < 1 || p.weapon.level > 90)
          ) {
            errors.push(`Character "${charId}" weapon level must be an integer between 1 and 90.`);
          }
          if (
            p.weapon.refinement !== undefined &&
            (!Number.isFinite(p.weapon.refinement) || !Number.isInteger(p.weapon.refinement) || p.weapon.refinement < 1 || p.weapon.refinement > 5)
          ) {
            errors.push(`Character "${charId}" weapon refinement must be an integer between 1 and 5.`);
          }
        }
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
      const wKey = w.key || w.weaponKey;
      if (typeof wKey !== 'string' || !wKey.trim()) {
        errors.push('Each weapon must have a valid key string.');
        break;
      }
      if (
        w.level !== undefined &&
        (!Number.isFinite(w.level) || !Number.isInteger(w.level) || w.level < 1 || w.level > 90)
      ) {
        errors.push(`Weapon "${w.name || wKey}" level must be an integer between 1 and 90.`);
        break;
      }
      if (
        w.refinement !== undefined &&
        (!Number.isFinite(w.refinement) || !Number.isInteger(w.refinement) || w.refinement < 1 || w.refinement > 5)
      ) {
        errors.push(`Weapon "${w.name || wKey}" refinement must be an integer between 1 and 5.`);
        break;
      }
      if (w.location && typeof w.location === 'string' && w.location.trim().length > 0) {
        if (!CANONICAL_CHARACTER_IDS.has(w.location)) {
          errors.push(`Weapon equipped location references invalid character: "${w.location}".`);
          break;
        }
      }
    }
  }

  if (!Array.isArray(payload.rawArtifacts)) {
    errors.push('Artifacts must be an array.');
  } else {
    for (const art of payload.rawArtifacts) {
      if (!art || typeof art !== 'object' || Array.isArray(art)) {
        errors.push('Each artifact in rawArtifacts must be a valid object.');
        break;
      }
    }
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
        errors.push('Consecutive loss count must be between 0 and 5.');
      }
    }
    if (pb.chronicledPity !== undefined) {
      if (
        typeof pb.chronicledPity !== 'number' ||
        !Number.isFinite(pb.chronicledPity) ||
        pb.chronicledPity < 0 ||
        pb.chronicledPity > 89
      ) {
        errors.push(`Chronicled pity must be between 0 and 89 (received ${pb.chronicledPity}).`);
      }
    }
    if (pb.chronicledFatePoints !== undefined) {
      if (
        typeof pb.chronicledFatePoints !== 'number' ||
        !Number.isFinite(pb.chronicledFatePoints) ||
        (pb.chronicledFatePoints !== 0 && pb.chronicledFatePoints !== 1)
      ) {
        errors.push(`Chronicled Fate Points must be 0 or 1 (received ${pb.chronicledFatePoints}).`);
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
      } else {
        for (let idx = 0; idx < 3; idx++) {
          const ch = ca.chambers[idx];
          if (!ch || typeof ch !== 'object' || !ch.firstHalf || !ch.secondHalf) {
            errors.push(`Custom Abyss chamber ${idx + 1} must configure both firstHalf and secondHalf.`);
            break;
          }
        }
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
      uid: typeof payload.uid === 'string' ? payload.uid.trim() : undefined,
    },
  };
}

export function importAccountBackup(
  backup: CelestiaBackupData,
  options?: { forceOverwrite?: boolean },
): {
  success: boolean;
  error?: string;
  rolledBack?: boolean;
  conflict?: boolean;
} {
  try {
    const validation = validateBackupData(backup);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }

    // Safety: check cross-account conflict unless forceOverwrite is confirmed
    if (!options?.forceOverwrite) {
      const conflict = detectAccountConflict(backup);
      if (conflict.hasConflict) {
        const errorMsg =
          conflict.reason === 'uid_mismatch'
            ? `Account identity mismatch: Active account is UID ${conflict.currentUid} (${conflict.currentCharacterCount} characters), but backup is for UID ${conflict.incomingUid} (${conflict.incomingCharacterCount} characters). Check overwrite confirmation to proceed.`
            : `Active account has ${conflict.currentCharacterCount} saved characters. Restoring this backup will replace existing data. Check overwrite confirmation to proceed.`;
        return {
          success: false,
          conflict: true,
          error: errorMsg,
        };
      }
    }

    // Safety: snapshot current state before overwriting
    const snapshotOk = createSafetySnapshot('celestia_backup_pre_restore');
    if (!snapshotOk) {
      return {
        success: false,
        error: 'Failed to create safety snapshot prior to restore. Storage may be unavailable or quota exceeded.',
      };
    }

    const normalized = normalizeBackupPayload(backup);

    // Set target namespace before writing so restored data routes into the correct storage keys
    const demoOk = setDemoModeEnabled(Boolean(normalized.demoMode));
    if (!demoOk) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Failed to configure target storage namespace.',
        rolledBack: true,
      };
    }

    // Overwrite stored state and track write outcomes across all domains
    const results = [
      saveProfiles(normalized.profiles || {}),
      saveRoster(normalized.roster || Object.keys(normalized.profiles || {})),
      saveWeapons(normalized.rawWeapons || []),
      saveArtifacts(normalized.rawArtifacts || []),
      savePullBudget(normalized.pullBudget),
      saveUid(normalized.uid || ''),
    ];

    if (normalized.abyssCycleId) {
      results.push(saveAbyssCycleId(normalized.abyssCycleId));
    } else {
      results.push(saveAbyssCycleId(DEFAULT_ACTIVE_ABYSS_CYCLE_ID));
    }

    if (normalized.customAbyssConfig) {
      results.push(saveCustomAbyss(normalized.customAbyssConfig));
    } else if (typeof localStorage !== 'undefined') {
      const abyssKey = isDemoModeEnabled() ? 'celestia_v2_demo_custom_abyss' : 'celestia_v2_custom_abyss';
      localStorage.removeItem(abyssKey);
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
    const expectedProfileKeys = Object.keys(normalized.profiles || {});
    if (expectedProfileKeys.length > 0 && !expectedProfileKeys.every((k) => verifiedProfiles[k] !== undefined)) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Post-restore verification failed: profiles did not persist accurately. All modifications were automatically rolled back.',
        rolledBack: true,
      };
    }

    const verifiedWeapons = getSavedWeapons();
    const expectedWeaponCount = (normalized.rawWeapons || []).length;
    if (expectedWeaponCount > 0 && verifiedWeapons.length !== expectedWeaponCount) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Post-restore verification failed: weapons armory count mismatch. All modifications were automatically rolled back.',
        rolledBack: true,
      };
    }

    const verifiedBudget = getSavedPullBudget();
    if (verifiedBudget.primogems !== normalized.pullBudget.primogems || verifiedBudget.fates !== normalized.pullBudget.fates) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Post-restore verification failed: pull budget did not persist accurately. All modifications were automatically rolled back.',
        rolledBack: true,
      };
    }

    if (normalized.uid && getSavedUid() !== normalized.uid) {
      rollbackPreRestoreBackup();
      return {
        success: false,
        error: 'Post-restore verification failed: UID did not persist accurately. All modifications were automatically rolled back.',
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
