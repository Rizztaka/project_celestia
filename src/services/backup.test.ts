import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportAccountBackup,
  validateBackupData,
  importAccountBackup,
  rollbackPreRestoreBackup,
  type CelestiaBackupData,
} from './backup';
import {
  saveRoster,
  saveProfiles,
  saveWeapons,
  savePullBudget,
  getSavedRoster,
  getSavedProfiles,
  getSavedPullBudget,
} from './storage';

describe('Account Backup & Restore Service', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    const mockLocalStorage = {
      getItem: vi.fn((key: string) => store[key] ?? null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((idx: number) => Object.keys(store)[idx] ?? null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('exports complete CelestiaBackupData with format celestia_native and gameVersion 7.2', () => {
    saveRoster(['Mavuika', 'Furina']);
    saveProfiles({
      Mavuika: { id: 'Mavuika', level: 90, constellation: 2 },
      Furina: { id: 'Furina', level: 90, constellation: 1 },
    });
    saveWeapons([
      {
        id: 'w_1',
        key: 'AThousandBlazingSuns',
        name: 'A Thousand Blazing Suns',
        level: 90,
        refinement: 1,
        rarity: 5,
        location: 'Mavuika',
      },
    ]);
    savePullBudget({
      primogems: 12800,
      fates: 20,
      characterPity: 45,
      characterGuaranteed: true,
      consecutiveLossCount: 1,
      weaponPity: 10,
      weaponFatePoints: 0,
    });

    const backup = exportAccountBackup();

    expect(backup.format).toBe('celestia_native');
    expect(backup.version).toBe(2);
    expect(backup.gameVersion).toBe('7.2');
    expect(backup.roster).toEqual(['Mavuika', 'Furina']);
    expect(backup.profiles.Mavuika.constellation).toBe(2);
    expect(backup.rawWeapons.length).toBe(1);
    expect(backup.pullBudget.primogems).toBe(12800);
    expect(backup.pullBudget.consecutiveLossCount).toBe(1);
    expect(new Date(backup.exportedAt).getTime()).not.toBeNaN();
  });

  it('validates authentic backup payloads successfully and extracts summary metadata', () => {
    const validPayload: CelestiaBackupData = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: ['Xilonen'],
      profiles: {
        Xilonen: { id: 'Xilonen', level: 90, constellation: 0 },
      },
      rawWeapons: [
        {
          id: 'w_xilonen',
          key: 'PeakPatrolSong',
          name: 'Peak Patrol Song',
          level: 90,
          refinement: 1,
          rarity: 5,
          location: 'Xilonen',
        },
      ],
      rawArtifacts: [],
      pullBudget: {
        primogems: 3200,
        fates: 5,
        characterPity: 20,
        characterGuaranteed: false,
        consecutiveLossCount: 0,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
      demoMode: false,
    };

    const validation = validateBackupData(validPayload);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.summary).toBeDefined();
    expect(validation.summary?.characterCount).toBe(1);
    expect(validation.summary?.weaponCount).toBe(1);
    expect(validation.summary?.artifactCount).toBe(0);
  });

  it('rejects corrupted, malformed, or malicious backup payloads gracefully without throwing', () => {
    // 1. Not an object
    expect(validateBackupData(null).valid).toBe(false);
    expect(validateBackupData('not-an-object').valid).toBe(false);

    // 2. Wrong format identifier
    expect(validateBackupData({ format: 'random_format', version: 2 }).valid).toBe(false);

    // 3. Unsupported future schema version
    expect(
      validateBackupData({
        format: 'celestia_native',
        version: 999,
        gameVersion: '7.2',
        roster: [],
        profiles: {},
        rawWeapons: [],
        rawArtifacts: [],
        pullBudget: {},
      }).valid,
    ).toBe(false);

    // 4. Invalid pull budget numbers (negative primogems, pity > 89)
    const invalidBudgetPayload = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: [],
      profiles: {},
      rawWeapons: [],
      rawArtifacts: [],
      pullBudget: {
        primogems: -500, // Negative primogems illegal
        fates: 0,
        characterPity: 95, // Character pity > 89 illegal
        characterGuaranteed: false,
        consecutiveLossCount: 0,
        weaponPity: 100, // Weapon pity > 79 illegal
        weaponFatePoints: 5, // Fate points > 1 illegal
      },
      demoMode: false,
    };

    const result = validateBackupData(invalidBudgetPayload);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('imports valid backup, stores celestia_backup_pre_restore safety snapshot, and allows rollback', () => {
    // Initial state
    saveRoster(['Bennett']);
    saveProfiles({ Bennett: { id: 'Bennett', level: 80, constellation: 5 } });

    const newBackup: CelestiaBackupData = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: ['Skirk'],
      profiles: {
        Skirk: { id: 'Skirk', level: 90, constellation: 6 },
      },
      rawWeapons: [],
      rawArtifacts: [],
      pullBudget: {
        primogems: 50000,
        fates: 100,
        characterPity: 0,
        characterGuaranteed: true,
        consecutiveLossCount: 0,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
      demoMode: false,
    };

    const importResult = importAccountBackup(newBackup);
    expect(importResult.success).toBe(true);

    // Verify current state is updated
    expect(getSavedRoster()).toEqual(['Skirk']);
    expect(getSavedProfiles()['Skirk'].constellation).toBe(6);
    expect(getSavedProfiles()['Bennett']).toBeUndefined();
    expect(getSavedPullBudget().primogems).toBe(50000);

    // Verify pre-restore snapshot was created
    expect(localStorage.getItem('celestia_backup_pre_restore')).not.toBeNull();

    // Rollback to pre-restore snapshot
    const rollbackSuccess = rollbackPreRestoreBackup();
    expect(rollbackSuccess).toBe(true);

    // Verify Bennett is restored and Skirk is gone
    expect(getSavedRoster()).toEqual(['Bennett']);
    expect(getSavedProfiles()['Bennett'].constellation).toBe(5);
    expect(getSavedProfiles()['Skirk']).toBeUndefined();
  });
});
