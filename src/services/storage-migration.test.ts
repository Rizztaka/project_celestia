import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  CURRENT_SCHEMA_VERSION,
  SCHEMA_VERSION_KEY,
  getStorageSchemaVersion,
  migrateStorageIfNeeded,
  createSafetySnapshot,
  rollbackToBackup,
} from './storage-migration';

describe('Storage Schema Versioning & Non-Destructive Migration Engine', () => {
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

  it('stamps celestia_schema_version = 2 on fresh initialization', () => {
    expect(localStorage.getItem(SCHEMA_VERSION_KEY)).toBeNull();
    const result = migrateStorageIfNeeded();

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe(0);
    expect(result.toVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(getStorageSchemaVersion()).toBe(2);
    expect(localStorage.getItem(SCHEMA_VERSION_KEY)).toBe('2');
  });

  it('migrates legacy unversioned v1 storage and creates celestia_backup_v1', () => {
    // Setup legacy v1 unversioned data with alias weapon key, missing consecutiveLossCount, and missing rarity
    const legacyWeapons = [
      {
        id: 'legacy_pjws',
        key: 'pjws', // alias key
        name: 'Primordial Jade Winged-Spear',
        level: 90,
        refinement: 1,
        location: 'Xiao',
      },
      {
        id: 'legacy_catch',
        key: 'TheCatch',
        name: '"The Catch"',
        level: 90,
        refinement: 5,
        rarity: 4,
        location: 'RaidenShogun',
      },
    ];

    const legacyProfiles = {
      Xiao: {
        id: 'Xiao',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'pjws',
          name: 'Primordial Jade Winged-Spear',
          level: 90,
          refinement: 1,
        },
      },
    };

    const legacyPullBudget = {
      primogems: 16000,
      fates: 10,
      characterPity: 95, // out of range
      characterGuaranteed: true,
      weaponPity: 85, // out of range
      weaponFatePoints: 2, // out of range
      // consecutiveLossCount is missing
    };

    localStorage.setItem('celestia_v2_raw_weapons', JSON.stringify(legacyWeapons));
    localStorage.setItem('celestia_v2_roster_profiles', JSON.stringify(legacyProfiles));
    localStorage.setItem('celestia_v2_pull_budget', JSON.stringify(legacyPullBudget));
    localStorage.setItem('celestia_v2_owned_roster', JSON.stringify(['Xiao', 'RaidenShogun']));

    // Execute migration
    const result = migrateStorageIfNeeded();

    expect(result.migrated).toBe(true);
    expect(result.fromVersion).toBe(1);
    expect(result.toVersion).toBe(2);
    expect(getStorageSchemaVersion()).toBe(2);

    // Verify safety backup was created
    const backupV1Raw = localStorage.getItem('celestia_backup_v1');
    expect(backupV1Raw).not.toBeNull();
    const backupV1 = JSON.parse(backupV1Raw!);
    expect(backupV1['celestia_v2_raw_weapons']).toContain('legacy_pjws');
    expect(backupV1['celestia_v2_roster_profiles']).toContain('Xiao');

    // Verify normalized weapons
    const upgradedWeapons = JSON.parse(localStorage.getItem('celestia_v2_raw_weapons')!);
    const upgradedPjws = upgradedWeapons.find((w: any) => w.id === 'legacy_pjws');
    expect(upgradedPjws).toBeDefined();
    expect(upgradedPjws.key).toBe('PrimordialJadeWingedSpear');
    expect(upgradedPjws.rarity).toBe(5);

    // Verify normalized profiles
    const upgradedProfiles = JSON.parse(localStorage.getItem('celestia_v2_roster_profiles')!);
    expect(upgradedProfiles.Xiao.weapon.key).toBe('PrimordialJadeWingedSpear');
    expect(upgradedProfiles.Xiao.weapon.rarity).toBe(5);

    // Verify clamped pull budget and added consecutiveLossCount
    const upgradedBudget = JSON.parse(localStorage.getItem('celestia_v2_pull_budget')!);
    expect(upgradedBudget.consecutiveLossCount).toBe(0);
    expect(upgradedBudget.characterPity).toBe(89);
    expect(upgradedBudget.weaponPity).toBe(79);
    expect(upgradedBudget.weaponFatePoints).toBe(1);
  });

  it('is strictly idempotent on subsequent invocations', () => {
    localStorage.setItem(SCHEMA_VERSION_KEY, '2');
    localStorage.setItem('celestia_v2_raw_weapons', JSON.stringify([]));

    const result = migrateStorageIfNeeded();
    expect(result.migrated).toBe(false);
    expect(result.fromVersion).toBe(2);
    expect(result.toVersion).toBe(2);

    // Does not overwrite or recreate celestia_backup_v1 if already v2
    expect(localStorage.getItem('celestia_backup_v1')).toBeNull();
  });

  it('creates and restores safety snapshots with rollbackToBackup', () => {
    localStorage.setItem('celestia_v2_active_uid', '800000001');
    localStorage.setItem('celestia_v2_owned_roster', JSON.stringify(['Mavuika']));

    const snapshotOk = createSafetySnapshot('celestia_test_snapshot');
    expect(snapshotOk).toBe(true);
    expect(localStorage.getItem('celestia_test_snapshot')).not.toBeNull();

    // Mutate state and add a new key that was NOT in the snapshot
    localStorage.setItem('celestia_v2_active_uid', '999999999');
    localStorage.setItem('celestia_v2_owned_roster', JSON.stringify(['Furina', 'Bennett']));
    localStorage.setItem('celestia_v2_custom_abyss', JSON.stringify({ custom: true }));

    // Rollback
    const rollbackOk = rollbackToBackup('celestia_test_snapshot');
    expect(rollbackOk).toBe(true);

    expect(localStorage.getItem('celestia_v2_active_uid')).toBe('800000001');
    expect(JSON.parse(localStorage.getItem('celestia_v2_owned_roster')!)).toEqual(['Mavuika']);
    // Newly introduced keys must be completely removed upon rollback
    expect(localStorage.getItem('celestia_v2_custom_abyss')).toBeNull();
  });

  it('rejects prototype pollution attempts during rollback', () => {
    localStorage.setItem(
      'celestia_malicious_snapshot',
      JSON.stringify({
        celestia_v2_active_uid: '123456789',
        __proto__: { polluted: true },
        constructor: { evil: true },
      }),
    );

    const rollbackOk = rollbackToBackup('celestia_malicious_snapshot');
    expect(rollbackOk).toBe(true);
    expect(localStorage.getItem('celestia_v2_active_uid')).toBe('123456789');
    expect((Object.prototype as any).polluted).toBeUndefined();
  });

  it('returns false when attempting to rollback from non-existent backup key', () => {
    const rollbackOk = rollbackToBackup('non_existent_key');
    expect(rollbackOk).toBe(false);
  });
});
