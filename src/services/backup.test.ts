import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  exportAccountBackup,
  validateBackupData,
  importAccountBackup,
  rollbackPreRestoreBackup,
  getLastBackupMeta,
  recordLastBackupMeta,
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
  isDemoModeEnabled,
  setDemoModeEnabled,
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

    // 5. Rejects non-finite numbers (NaN, Infinity)
    const nanBudgetPayload = {
      ...invalidBudgetPayload,
      pullBudget: {
        primogems: NaN,
        fates: Infinity,
        characterPity: 0,
        characterGuaranteed: false,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
    };
    expect(validateBackupData(nanBudgetPayload).valid).toBe(false);

    // 6. Rejects unauthorized or hallucinated character IDs
    const fakeCharPayload = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: ['UnauthorizedCharacter_XYZ'],
      profiles: {},
      rawWeapons: [],
      rawArtifacts: [],
      pullBudget: {
        primogems: 0,
        fates: 0,
        characterPity: 0,
        characterGuaranteed: false,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
      demoMode: false,
    };
    const fakeCharResult = validateBackupData(fakeCharPayload);
    expect(fakeCharResult.valid).toBe(false);
    expect(fakeCharResult.errors.some((e) => e.includes('Unauthorized or invalid character ID'))).toBe(true);

    // 7. Rejects unauthorized character profile keys
    const fakeProfilePayload = {
      ...fakeCharPayload,
      roster: ['Mavuika'],
      profiles: {
        FakeHero123: { id: 'FakeHero123', level: 90, constellation: 0 },
      },
    };
    const fakeProfileResult = validateBackupData(fakeProfilePayload);
    expect(fakeProfileResult.valid).toBe(false);
    expect(fakeProfileResult.errors.some((e) => e.includes('Unauthorized or invalid character profile key'))).toBe(true);
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

  it('preserves roster characters that do not have custom profile entries during import', () => {
    // A backup where roster has 3 characters, but only 1 has an entry in profiles
    const partialProfilesBackup: CelestiaBackupData = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: ['Mavuika', 'Furina', 'Bennett'],
      profiles: {
        Mavuika: { id: 'Mavuika', level: 90, constellation: 2 },
      },
      rawWeapons: [],
      rawArtifacts: [],
      pullBudget: {
        primogems: 0,
        fates: 0,
        characterPity: 0,
        characterGuaranteed: false,
        consecutiveLossCount: 0,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
      demoMode: false,
    };

    const importResult = importAccountBackup(partialProfilesBackup);
    expect(importResult.success).toBe(true);

    // All 3 roster members must be preserved, not wiped by saveProfiles
    const restoredRoster = getSavedRoster();
    expect(restoredRoster).toContain('Mavuika');
    expect(restoredRoster).toContain('Furina');
    expect(restoredRoster).toContain('Bennett');
    expect(restoredRoster).toHaveLength(3);
  });

  it('cleanses custom abyss sandbox when importing backup without custom abyss config', () => {
    localStorage.setItem('celestia_v2_custom_abyss', JSON.stringify({ customFloor: true }));

    const simpleBackup: CelestiaBackupData = {
      format: 'celestia_native',
      version: 2,
      gameVersion: '7.2',
      exportedAt: new Date().toISOString(),
      roster: ['Furina'],
      profiles: { Furina: { id: 'Furina', level: 90, constellation: 0 } },
      rawWeapons: [],
      rawArtifacts: [],
      pullBudget: {
        primogems: 0,
        fates: 0,
        characterPity: 0,
        characterGuaranteed: false,
        consecutiveLossCount: 0,
        weaponPity: 0,
        weaponFatePoints: 0,
      },
      demoMode: false,
    };

    const res = importAccountBackup(simpleBackup);
    expect(res.success).toBe(true);
    expect(localStorage.getItem('celestia_v2_custom_abyss')).toBeNull();
  });

  describe('M1: Atomic Restore Guarantees & Automatic Rollback', () => {
    it('automatically rolls back and leaves pre-restore data intact if a storage failure occurs during restore', () => {
      // 1. Establish pre-existing user data
      saveRoster(['Nefer', 'Xilonen']);
      saveProfiles({
        Nefer: { id: 'Nefer', level: 90, constellation: 0 },
        Xilonen: { id: 'Xilonen', level: 90, constellation: 2 },
      });

      // 2. Prepare backup to restore
      const incomingBackup: CelestiaBackupData = {
        format: 'celestia_native',
        version: 2,
        gameVersion: '7.2',
        exportedAt: new Date().toISOString(),
        roster: ['Mavuika'],
        profiles: { Mavuika: { id: 'Mavuika', level: 90, constellation: 6 } },
        rawWeapons: [],
        rawArtifacts: [],
        pullBudget: {
          primogems: 5000,
          fates: 20,
          characterPity: 10,
          characterGuaranteed: true,
          consecutiveLossCount: 0,
          weaponPity: 0,
          weaponFatePoints: 0,
        },
        demoMode: false,
      };

      // 3. Spy on localStorage.setItem: simulate a write failure specifically during restore of weapons
      const originalSetItem = localStorage.setItem;
      let injectQuotaError = true;
      localStorage.setItem = vi.fn((key: string, value: string) => {
        // Fail on the weapons write during restore
        if (injectQuotaError && key === 'celestia_v2_raw_weapons') {
          // Disable error for subsequent rollback write operations
          injectQuotaError = false;
          const err = new Error('QuotaExceededError');
          err.name = 'QuotaExceededError';
          throw err;
        }
        return originalSetItem(key, value);
      });

      // 4. Execute restore — should detect failure and automatically rollback
      const res = importAccountBackup(incomingBackup);
      expect(res.success).toBe(false);
      expect(res.rolledBack).toBe(true);
      expect(res.error).toBeDefined();

      // Restore original setItem
      localStorage.setItem = originalSetItem;

      // 5. Pre-restore account data must be completely preserved!
      const finalRoster = getSavedRoster();
      expect(finalRoster).toContain('Nefer');
      expect(finalRoster).toContain('Xilonen');
      expect(finalRoster).not.toContain('Mavuika');

      const finalProfiles = getSavedProfiles();
      expect(finalProfiles.Nefer).toBeDefined();
      expect(finalProfiles.Xilonen).toBeDefined();
      expect(finalProfiles.Mavuika).toBeUndefined();
    });

    it('rejects backup with invalid custom Abyss configuration', () => {
      const invalidAbyssBackup: any = {
        format: 'celestia_native',
        version: 2,
        gameVersion: '7.2',
        exportedAt: new Date().toISOString(),
        roster: ['Furina'],
        profiles: { Furina: { id: 'Furina', level: 90, constellation: 0 } },
        rawWeapons: [],
        rawArtifacts: [],
        pullBudget: {
          primogems: 0,
          fates: 0,
          characterPity: 0,
          characterGuaranteed: false,
          consecutiveLossCount: 0,
          weaponPity: 0,
          weaponFatePoints: 0,
        },
        customAbyssConfig: { chambers: [1] }, // Invalid: must have 3 chambers
        demoMode: false,
      };

      const val = validateBackupData(invalidAbyssBackup);
      expect(val.valid).toBe(false);
      expect(val.errors.some((e) => e.includes('exactly 3 chambers'))).toBe(true);
    });

    it('tracks and retrieves last backup metadata accurately', () => {
      recordLastBackupMeta({
        exportedAt: '2026-11-18T20:00:00.000Z',
        characterCount: 15,
        weaponCount: 25,
        artifactCount: 100,
      });
      const meta = getLastBackupMeta();
      expect(meta).not.toBeNull();
      expect(meta?.exportedAt).toBe('2026-11-18T20:00:00.000Z');
      expect(meta?.characterCount).toBe(15);
      expect(meta?.weaponCount).toBe(25);
      expect(meta?.artifactCount).toBe(100);
    });

    it('correctly restores authentic account when importAccountBackup is triggered while Demo Mode is active', () => {
      // 1. User is currently exploring Demo Mode
      setDemoModeEnabled(true);
      expect(isDemoModeEnabled()).toBe(true);

      // 2. User imports authentic backup
      const authenticBackup: any = {
        format: 'celestia_native',
        version: 2,
        gameVersion: '7.2',
        exportedAt: new Date().toISOString(),
        roster: ['RaidenShogun'],
        profiles: { RaidenShogun: { id: 'RaidenShogun', level: 90, constellation: 3 } },
        rawWeapons: [{ id: 'w_engulfing', weaponKey: 'EngulfingLightning', name: 'Engulfing Lightning', level: 90, refinement: 1, rarity: 5, location: 'RaidenShogun' }],
        rawArtifacts: [],
        pullBudget: {
          primogems: 16000,
          fates: 20,
          characterPity: 50,
          characterGuaranteed: true,
          consecutiveLossCount: 0,
          weaponPity: 0,
          weaponFatePoints: 0,
        },
        demoMode: false,
      };

      const result = importAccountBackup(authenticBackup);
      expect(result.success).toBe(true);
      expect(isDemoModeEnabled()).toBe(false);

      // 3. Verify authentic storage keys have the restored profile and weapons
      const rawProfiles = localStorage.getItem('celestia_v2_roster_profiles');
      expect(rawProfiles).not.toBeNull();
      expect(JSON.parse(rawProfiles!).RaidenShogun).toBeDefined();

      const activeProfiles = getSavedProfiles();
      expect(activeProfiles.RaidenShogun).toBeDefined();
    });

    it('rejects backup with non-integer level or constellation, or invalid abyssCycleId', () => {
      const base: any = {
        format: 'celestia_native',
        version: 2,
        gameVersion: '7.2',
        exportedAt: new Date().toISOString(),
        roster: ['Furina'],
        profiles: { Furina: { id: 'Furina', level: 89.5, constellation: 2 } }, // Non-integer level
        rawWeapons: [],
        rawArtifacts: [],
        pullBudget: {
          primogems: 0,
          fates: 0,
          characterPity: 0,
          characterGuaranteed: false,
          consecutiveLossCount: 0,
          weaponPity: 0,
          weaponFatePoints: 0,
        },
        demoMode: false,
      };

      const v1 = validateBackupData(base);
      expect(v1.valid).toBe(false);
      expect(v1.errors.some((e) => e.includes('integer'))).toBe(true);

      // Non-integer constellation
      base.profiles.Furina.level = 90;
      base.profiles.Furina.constellation = 1.5;
      const v2 = validateBackupData(base);
      expect(v2.valid).toBe(false);
      expect(v2.errors.some((e) => e.includes('integer'))).toBe(true);

      // Invalid abyssCycleId type
      base.profiles.Furina.constellation = 2;
      base.abyssCycleId = 12345;
      const v3 = validateBackupData(base);
      expect(v3.valid).toBe(false);
      expect(v3.errors.some((e) => e.includes('Abyss cycle ID'))).toBe(true);
    });
  });
});
