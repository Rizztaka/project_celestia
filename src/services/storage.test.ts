import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSavedProfiles,
  saveProfiles,
  getSavedRoster,
  saveRoster,
  getSavedArtifacts,
  saveArtifacts,
  getSavedWeapons,
  saveWeapons,
  DEFAULT_ROSTER,
  DEFAULT_WEAPONS,
  DEMO_ROSTER,
  DEMO_WEAPONS,
  isDemoModeEnabled,
  setDemoModeEnabled,
  getDemoProfiles,
  resetAccountData,
  getSavedPullBudget,
  savePullBudget,
  DEFAULT_PULL_BUDGET,
  getSavedAbyssCycleId,
  saveAbyssCycleId,
  getSavedCustomAbyss,
  saveCustomAbyss,
  getSavedUid,
  saveUid,
  isStorageAvailable,
  getLastStorageError,
} from './storage';
import {
  equipWeaponToCharacter,
  unequipWeaponFromCharacter,
  syncArmoryOnProfileUpdate,
} from './armory-operations';
import type { OwnedCharacterProfile, OwnedWeapon, PullBudgetState } from '../types/genshin';

describe('Storage Service - Persistence and Reset Semantics', () => {
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
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
  });

  it('returns empty collections on brand-new uninitialized visit with demo mode OFF', () => {
    expect(localStorage.getItem('celestia_v2_owned_roster')).toBeNull();
    expect(localStorage.getItem('celestia_v2_roster_profiles')).toBeNull();
    expect(localStorage.getItem('celestia_v2_raw_weapons')).toBeNull();
    expect(isDemoModeEnabled()).toBe(false);

    const roster = getSavedRoster();
    expect(roster).toEqual([]);
    expect(roster).toEqual(DEFAULT_ROSTER);

    const profiles = getSavedProfiles();
    expect(profiles).toEqual({});

    const weapons = getSavedWeapons();
    expect(weapons).toEqual([]);
    expect(weapons).toEqual(DEFAULT_WEAPONS);
  });

  it('activates and restores DEMO_ROSTER and DEMO_WEAPONS when demo mode is enabled', () => {
    setDemoModeEnabled(true);
    expect(isDemoModeEnabled()).toBe(true);

    const roster = getSavedRoster();
    expect(roster.length).toBe(11);
    expect(roster).toEqual(DEMO_ROSTER);

    const profiles = getSavedProfiles();
    expect(Object.keys(profiles).length).toBe(11);
    expect(Object.keys(profiles)).toEqual(DEMO_ROSTER);
    expect(profiles).toEqual(getDemoProfiles());

    const weapons = getSavedWeapons();
    expect(weapons.length).toBe(8);
    expect(weapons).toEqual(DEMO_WEAPONS);

    // Turn demo mode off
    setDemoModeEnabled(false);
    expect(isDemoModeEnabled()).toBe(false);
    expect(getSavedRoster()).toEqual([]);
    expect(getSavedProfiles()).toEqual({});
    expect(getSavedWeapons()).toEqual([]);
  });

  it('resets account data cleanly using resetAccountData', () => {
    setDemoModeEnabled(true);
    saveRoster(['Furina']);
    saveProfiles({ Furina: { id: 'Furina', level: 90, constellation: 2 } });

    resetAccountData();

    expect(isDemoModeEnabled()).toBe(false);
    expect(getSavedRoster()).toEqual([]);
    expect(getSavedProfiles()).toEqual({});
    expect(getSavedWeapons()).toEqual([]);
  });

  it('persists and restores an intentionally cleared empty roster without resurrecting defaults', () => {
    // User clicks "Clear All" -> saves empty map and array
    saveProfiles({});
    saveRoster([]);

    // Raw localStorage should now be stored as '{}' and '[]'
    expect(localStorage.getItem('celestia_v2_roster_profiles')).toBe('{}');
    expect(localStorage.getItem('celestia_v2_owned_roster')).toBe('[]');

    // Re-reading should return empty object / empty array, NOT DEFAULT_ROSTER
    const restoredProfiles = getSavedProfiles();
    expect(restoredProfiles).toEqual({});

    const restoredRoster = getSavedRoster();
    expect(restoredRoster).toEqual([]);
  });

  it('saves and restores raw artifacts, returning boolean status', () => {
    const mockArtifacts = [{ id: 'art_1', setKey: 'GoldenTroupe' }];
    const status = saveArtifacts(mockArtifacts);
    expect(status).toBe(true);

    const loaded = getSavedArtifacts();
    expect(loaded).toEqual(mockArtifacts);
  });

  it('atomic weapon equip moves weapon from Character B to Character A cleanly with no duplicate phantom copies', () => {
    const initialWeapons: OwnedWeapon[] = [
      {
        id: 'starter_the_catch',
        key: 'TheCatch',
        name: '"The Catch"',
        level: 90,
        refinement: 5,
        rarity: 4,
        location: 'Xiangling',
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
    ];

    const initialProfiles: Record<string, OwnedCharacterProfile> = {
      Xiangling: {
        id: 'Xiangling',
        level: 90,
        constellation: 4,
        weapon: {
          key: 'TheCatch',
          name: '"The Catch"',
          level: 90,
          refinement: 5,
          rarity: 4,
        },
      },
      RaidenShogun: {
        id: 'RaidenShogun',
        level: 90,
        constellation: 2,
      },
    };

    const { updatedWeapons, updatedProfiles, transferredFrom } = equipWeaponToCharacter(
      'starter_the_catch',
      'RaidenShogun',
      initialWeapons,
      initialProfiles,
    );

    expect(transferredFrom).toBe('Xiangling');
    expect(updatedWeapons.length).toBe(2); // Zero phantom duplicates created!
    expect(updatedWeapons.find((w) => w.id === 'starter_the_catch')?.location).toBe('RaidenShogun');

    // Xiangling's profile must have its weapon removed
    expect(updatedProfiles['Xiangling']?.weapon).toBeUndefined();

    // Raiden Shogun's profile must receive the weapon
    expect(updatedProfiles['RaidenShogun']?.weapon?.key).toBe('TheCatch');
    expect(updatedProfiles['RaidenShogun']?.weapon?.level).toBe(90);
  });

  it('atomic weapon equip unequips character A previous weapon into bag when equipping a new weapon', () => {
    const initialWeapons: OwnedWeapon[] = [
      {
        id: 'w_old',
        key: 'FavoniusLance',
        name: 'Favonius Lance',
        level: 80,
        refinement: 1,
        rarity: 4,
        location: 'RaidenShogun',
      },
      {
        id: 'w_new',
        key: 'TheCatch',
        name: '"The Catch"',
        level: 90,
        refinement: 5,
        rarity: 4,
        location: '',
      },
    ];

    const initialProfiles: Record<string, OwnedCharacterProfile> = {
      RaidenShogun: {
        id: 'RaidenShogun',
        level: 90,
        constellation: 0,
        weapon: {
          key: 'FavoniusLance',
          name: 'Favonius Lance',
          level: 80,
          refinement: 1,
          rarity: 4,
        },
      },
    };

    const { updatedWeapons, updatedProfiles, transferredFrom } = equipWeaponToCharacter(
      'w_new',
      'RaidenShogun',
      initialWeapons,
      initialProfiles,
    );

    expect(transferredFrom).toBeUndefined();
    expect(updatedWeapons.find((w) => w.id === 'w_new')?.location).toBe('RaidenShogun');
    expect(updatedWeapons.find((w) => w.id === 'w_old')?.location).toBeUndefined(); // Back in bag!
    expect(updatedProfiles['RaidenShogun']?.weapon?.key).toBe('TheCatch');
  });

  it('rejects equipping a weapon when weapon category does not match character class', () => {
    const bowWeapon: OwnedWeapon = {
      id: 'w_bow',
      key: 'FavoniusWarbow',
      name: 'Favonius Warbow',
      level: 90,
      refinement: 1,
      rarity: 4,
      location: undefined,
    };

    const initialProfiles: Record<string, OwnedCharacterProfile> = {
      RaidenShogun: {
        id: 'RaidenShogun',
        level: 90,
        constellation: 0,
      },
    };

    // Raiden is a Polearm user; Favonius Warbow is a Bow
    const { updatedWeapons, updatedProfiles, transferredFrom } = equipWeaponToCharacter(
      'w_bow',
      'RaidenShogun',
      [bowWeapon],
      initialProfiles,
    );

    // Mismatched equip must be rejected; collections remain unmodified
    expect(transferredFrom).toBeUndefined();
    expect(updatedWeapons[0].location).toBeUndefined();
    expect(updatedProfiles['RaidenShogun'].weapon).toBeUndefined();
  });

  it('tags newly synthesized weapons with isCustom: true in syncArmoryOnProfileUpdate', () => {
    const emptyArmory: OwnedWeapon[] = [];
    const profileWithCustomWeapon: OwnedCharacterProfile = {
      id: 'RaidenShogun',
      level: 90,
      constellation: 0,
      weapon: {
        key: 'EngulfingLightning',
        name: 'Engulfing Lightning',
        level: 90,
        refinement: 1,
        rarity: 5,
      },
    };

    const synced = syncArmoryOnProfileUpdate(emptyArmory, profileWithCustomWeapon);
    expect(synced.length).toBe(1);
    expect(synced[0].key).toBe('EngulfingLightning');
    expect(synced[0].location).toBe('RaidenShogun');
    expect(synced[0].isCustom).toBe(true);
  });

  it('unequips character weapon into bag cleanly', () => {
    const initialWeapons: OwnedWeapon[] = [
      {
        id: 'w_1',
        key: 'TheCatch',
        name: '"The Catch"',
        level: 90,
        refinement: 5,
        rarity: 4,
        location: 'RaidenShogun',
      },
    ];

    const initialProfiles: Record<string, OwnedCharacterProfile> = {
      RaidenShogun: {
        id: 'RaidenShogun',
        level: 90,
        constellation: 0,
        weapon: {
          key: 'TheCatch',
          name: '"The Catch"',
          level: 90,
          refinement: 5,
          rarity: 4,
        },
      },
    };

    const { updatedWeapons, updatedProfiles } = unequipWeaponFromCharacter(
      'RaidenShogun',
      initialWeapons,
      initialProfiles,
    );

    expect(updatedWeapons[0].location).toBeUndefined();
    expect(updatedProfiles['RaidenShogun']?.weapon).toBeUndefined();
  });

  it('extracts weapons from profiles when WEAPONS_KEY is empty', () => {
    saveProfiles({
      HuTao: {
        id: 'HuTao',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'StaffOfHoma',
          name: 'Staff of Homa',
          level: 90,
          refinement: 1,
        },
      },
    });

    const weapons = getSavedWeapons();
    expect(weapons.length).toBe(1);
    expect(weapons[0].key).toBe('StaffOfHoma');
    expect(weapons[0].location).toBe('HuTao');
  });

  it('saves and restores weapons inventory from localStorage', () => {
    const testBag: OwnedWeapon[] = [
      {
        id: 'w_1',
        key: 'StaffOfHoma',
        name: 'Staff of Homa',
        level: 90,
        refinement: 1,
        rarity: 5,
        location: 'HuTao',
      },
      {
        id: 'w_2',
        key: 'FavoniusLance',
        name: 'Favonius Lance',
        level: 80,
        refinement: 3,
        rarity: 4,
        location: '',
      },
    ];

    expect(saveWeapons(testBag)).toBe(true);
    const loaded = getSavedWeapons();
    expect(loaded).toEqual(testBag);
  });

  it('normalizes alias records and stale rarity upon localStorage hydration in getSavedWeapons and getSavedProfiles', () => {
    // Stale weapon bag in localStorage with alias keys and outdated 4★ PJWS rarity
    const staleBag: OwnedWeapon[] = [
      {
        id: 'w_stale_pjws',
        key: 'pjws',
        name: 'PJWS',
        level: 90,
        refinement: 1,
        rarity: 4,
        location: 'Xiao',
      },
      {
        id: 'w_stale_catch',
        key: 'thecatch',
        name: 'The Catch',
        level: 90,
        refinement: 5,
        rarity: 4,
        location: '',
      },
    ];

    saveWeapons(staleBag);
    const hydratedWeapons = getSavedWeapons();
    expect(hydratedWeapons.length).toBe(2);

    const pjws = hydratedWeapons.find((w) => w.id === 'w_stale_pjws')!;
    expect(pjws).toBeDefined();
    expect(pjws.key).toBe('PrimordialJadeWingedSpear');
    expect(pjws.name).toBe('Primordial Jade Winged-Spear');
    expect(pjws.rarity).toBe(5); // Outdated 4★ upgraded to canonical 5★

    const theCatch = hydratedWeapons.find((w) => w.id === 'w_stale_catch')!;
    expect(theCatch).toBeDefined();
    expect(theCatch.key).toBe('TheCatch');
    expect(theCatch.name).toBe('"The Catch"');

    // Stale profiles in localStorage with alias weapon keys
    saveProfiles({
      Xiao: {
        id: 'Xiao',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'pjws',
          name: 'PJWS',
          level: 90,
          refinement: 1,
          rarity: 4,
        },
      },
    });

    const hydratedProfiles = getSavedProfiles();
    expect(hydratedProfiles.Xiao).toBeDefined();
    expect(hydratedProfiles.Xiao.weapon?.key).toBe('PrimordialJadeWingedSpear');
    expect(hydratedProfiles.Xiao.weapon?.name).toBe('Primordial Jade Winged-Spear');
    expect(hydratedProfiles.Xiao.weapon?.rarity).toBe(5);

    // Weapon in localStorage missing rarity entirely gets enriched with canonical rarity
    const weaponNoRarity: OwnedWeapon[] = [
      {
        id: 'w_no_rarity_homa',
        key: 'StaffOfHoma',
        name: 'Staff of Homa',
        level: 90,
        refinement: 1,
        location: '',
      },
    ];
    saveWeapons(weaponNoRarity);
    const hydratedNoRarity = getSavedWeapons();
    expect(hydratedNoRarity[0].rarity).toBe(5);
  });

  describe('syncArmoryOnProfileUpdate', () => {
    it('equips only the first unequipped instance when multiple unequipped duplicates exist in bag', () => {
      const bag: OwnedWeapon[] = [
        {
          id: 'fav_1',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 1,
          location: '',
        },
        {
          id: 'fav_2',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 80,
          refinement: 2,
          location: '',
        },
      ];

      const bennettProfile: OwnedCharacterProfile = {
        id: 'Bennett',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 1,
          rarity: 4,
        },
      };

      const synced = syncArmoryOnProfileUpdate(bag, bennettProfile);
      expect(synced.length).toBe(2);

      const fav1 = synced.find((w) => w.id === 'fav_1')!;
      const fav2 = synced.find((w) => w.id === 'fav_2')!;

      // Only fav_1 should be equipped to Bennett; fav_2 MUST remain unequipped!
      expect(fav1.location).toBe('Bennett');
      expect(fav2.location).toBeFalsy();
    });

    it('keeps existing equipped weapon instance intact when character profile is updated with same weapon', () => {
      const bag: OwnedWeapon[] = [
        {
          id: 'fav_equipped',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 80,
          refinement: 1,
          location: 'Bennett',
        },
        {
          id: 'fav_in_bag',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          location: '',
        },
      ];

      const updatedBennett: OwnedCharacterProfile = {
        id: 'Bennett',
        level: 90,
        constellation: 2, // Leveled up constellation/weapon
        weapon: {
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 1,
          rarity: 4,
        },
      };

      const synced = syncArmoryOnProfileUpdate(bag, updatedBennett);
      expect(synced.length).toBe(2);

      const equipped = synced.find((w) => w.id === 'fav_equipped')!;
      const inBag = synced.find((w) => w.id === 'fav_in_bag')!;

      expect(equipped.location).toBe('Bennett');
      expect(equipped.level).toBe(90);
      // In-bag extra copy must NOT be touched or assigned to Bennett!
      expect(inBag.location).toBeFalsy();
    });

    it('unequips old weapon into bag when switching to a different weapon', () => {
      const bag: OwnedWeapon[] = [
        {
          id: 'aquila_old',
          key: 'AquilaFavonia',
          name: 'Aquila Favonia',
          level: 90,
          refinement: 1,
          location: 'Bennett',
        },
        {
          id: 'fav_bag',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          location: '',
        },
      ];

      const switchedBennett: OwnedCharacterProfile = {
        id: 'Bennett',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 5,
          rarity: 4,
        },
      };

      const synced = syncArmoryOnProfileUpdate(bag, switchedBennett);
      expect(synced.length).toBe(2);

      const aquila = synced.find((w) => w.id === 'aquila_old')!;
      const fav = synced.find((w) => w.id === 'fav_bag')!;

      // Aquila must now be unequipped in bag
      expect(aquila.location).toBeUndefined();
      // Favonius Sword must now be equipped on Bennett
      expect(fav.location).toBe('Bennett');
    });

    it('unequips weapon into bag when character weapon is removed (falsy weapon)', () => {
      const bag: OwnedWeapon[] = [
        {
          id: 'fav_1',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 1,
          location: 'Bennett',
        },
      ];

      const unequippedBennett: OwnedCharacterProfile = {
        id: 'Bennett',
        level: 90,
        constellation: 1,
        weapon: undefined,
      };

      const synced = syncArmoryOnProfileUpdate(bag, unequippedBennett);
      expect(synced.length).toBe(1);
      expect(synced[0].location).toBeUndefined();
    });

    it('synthesizes new canonical weapon when equipping a weapon not present in inventory', () => {
      const bag: OwnedWeapon[] = [];

      const xiaoProfile: OwnedCharacterProfile = {
        id: 'Xiao',
        level: 90,
        constellation: 1,
        weapon: {
          key: 'pjws', // alias key
          name: 'PJWS',
          level: 90,
          refinement: 1,
          rarity: 4, // Corrupted 4★ rarity
        },
      };

      const synced = syncArmoryOnProfileUpdate(bag, xiaoProfile);
      expect(synced.length).toBe(1);
      expect(synced[0].key).toBe('PrimordialJadeWingedSpear');
      expect(synced[0].name).toBe('Primordial Jade Winged-Spear');
      expect(synced[0].rarity).toBe(5); // Corrected to canonical 5★
      expect(synced[0].location).toBe('Xiao');
    });

    it('matches alias weapon keys to canonical inventory weapons without creating duplicates', () => {
      const bag: OwnedWeapon[] = [
        {
          id: 'w_catch_canonical',
          key: 'TheCatch',
          name: '"The Catch"',
          level: 90,
          refinement: 5,
          rarity: 4,
          location: '',
        },
      ];

      const raidenProfile: OwnedCharacterProfile = {
        id: 'RaidenShogun',
        level: 90,
        constellation: 0,
        weapon: {
          key: 'thecatch', // Lowercase alias
          name: 'The Catch',
          level: 90,
          refinement: 5,
          rarity: 4,
        },
      };

      const synced = syncArmoryOnProfileUpdate(bag, raidenProfile);
      // Must NOT unshift a duplicate weapon!
      expect(synced.length).toBe(1);
      expect(synced[0].id).toBe('w_catch_canonical');
      expect(synced[0].location).toBe('RaidenShogun');
    });
  });

  describe('Pull Budget Persistence', () => {
    it('returns DEFAULT_PULL_BUDGET when uninitialized', () => {
      expect(localStorage.getItem('celestia_v2_pull_budget')).toBeNull();
      const budget = getSavedPullBudget();
      expect(budget).toEqual(DEFAULT_PULL_BUDGET);
    });

    it('saves and restores pull budget correctly including consecutiveLossCount and M8 fields', () => {
      const budget: PullBudgetState = {
        primogems: 16000,
        fates: 25,
        characterPity: 45,
        characterGuaranteed: false,
        consecutiveLossCount: 2,
        weaponPity: 20,
        weaponGuaranteed: true,
        weaponFatePoints: 1,
        chronicledPity: 30,
        chronicledFatePoints: 1,
        includeCashback: true,
      };

      savePullBudget(budget);
      expect(localStorage.getItem('celestia_v2_pull_budget')).not.toBeNull();

      const restored = getSavedPullBudget();
      expect(restored).toEqual(budget);
    });

    it('non-destructively hydrates legacy pull budget without M8 fields to safe defaults', () => {
      // Legacy budget save without weaponGuaranteed, chronicledPity, chronicledFatePoints, includeCashback
      localStorage.setItem(
        'celestia_v2_pull_budget',
        JSON.stringify({
          primogems: 8000,
          fates: 10,
          characterPity: 20,
          characterGuaranteed: true,
          consecutiveLossCount: 1,
          weaponPity: 15,
          weaponFatePoints: 0,
        }),
      );

      const restored = getSavedPullBudget();
      expect(restored).toEqual({
        primogems: 8000,
        fates: 10,
        characterPity: 20,
        characterGuaranteed: true,
        consecutiveLossCount: 1,
        weaponPity: 15,
        weaponGuaranteed: false,
        weaponFatePoints: 0,
        chronicledPity: 0,
        chronicledFatePoints: 0,
        includeCashback: false,
      });
    });

    it('gracefully handles malformed or out-of-range storage data', () => {
      localStorage.setItem('celestia_v2_pull_budget', 'invalid json{');
      expect(getSavedPullBudget()).toEqual(DEFAULT_PULL_BUDGET);

      // Clamp out-of-range values
      localStorage.setItem(
        'celestia_v2_pull_budget',
        JSON.stringify({
          primogems: -500,
          fates: -10,
          characterPity: 120, // max is 89
          characterGuaranteed: 'yes', // should be boolean
          consecutiveLossCount: 99, // max is 5
          weaponPity: -5,
          weaponFatePoints: 3, // max is 1
        }),
      );

      const sanitized = getSavedPullBudget();
      expect(sanitized.primogems).toBe(0);
      expect(sanitized.fates).toBe(0);
      expect(sanitized.characterPity).toBe(89);
      expect(sanitized.characterGuaranteed).toBe(false);
      expect(sanitized.consecutiveLossCount).toBe(5);
      expect(sanitized.weaponPity).toBe(0);
      expect(sanitized.weaponFatePoints).toBe(1);
    });
  });

  describe('Abyss Cycle & Custom Sandbox Persistence', () => {
    it('returns default active cycle-7-2 when uninitialized', () => {
      expect(getSavedAbyssCycleId()).toBe('cycle-7-2');
    });

    it('persists and restores custom cycle selection', () => {
      saveAbyssCycleId('cycle-5-2');
      expect(getSavedAbyssCycleId()).toBe('cycle-5-2');
    });

    it('saves and restores custom abyss sandbox configuration', () => {
      const customConfig = getSavedCustomAbyss();
      expect(customConfig.isCustom).toBe(true);
      expect(customConfig.chambers).toHaveLength(3);

      customConfig.name = 'My Custom Test Chamber';
      saveCustomAbyss(customConfig);

      const reloaded = getSavedCustomAbyss();
      expect(reloaded.name).toBe('My Custom Test Chamber');
    });

    it('sanitizes invalid or unrecognized abyss cycle IDs to cycle-7-2', () => {
      localStorage.setItem('celestia_v2_abyss_cycle_id', 'unknown-old-cycle-4-2');
      expect(getSavedAbyssCycleId()).toBe('cycle-7-2');
    });

    it('falls back to fresh sandbox if custom abyss in localStorage is corrupted or lacks 3 chambers', () => {
      localStorage.setItem('celestia_v2_custom_abyss', JSON.stringify({ chambers: [] }));
      const fallback = getSavedCustomAbyss();
      expect(fallback.chambers).toHaveLength(3);
    });
  });

  describe('M1: Account Reliability, Storage Namespace Isolation & Quota Safety', () => {
    it('guarantees Demo Mode operates in an isolated namespace and NEVER overwrites real account data', () => {
      // 1. User configures a real account with custom profiles & weapons
      saveRoster(['Mavuika', 'Furina']);
      saveProfiles({
        Mavuika: { id: 'Mavuika', level: 90, constellation: 2 },
        Furina: { id: 'Furina', level: 90, constellation: 1 },
      });
      saveWeapons([
        {
          id: 'custom_claymore_1',
          key: 'AThousandBlazingSuns',
          name: 'A Thousand Blazing Suns',
          level: 90,
          refinement: 1,
          rarity: 5,
          location: 'Mavuika',
          lock: true,
        },
      ]);
      saveUid('800123456');

      // Verify real data is saved
      expect(getSavedRoster()).toEqual(['Mavuika', 'Furina']);
      expect(getSavedProfiles().Mavuika.constellation).toBe(2);
      expect(getSavedWeapons()).toHaveLength(1);
      expect(getSavedUid()).toBe('800123456');

      // 2. User activates Demo Mode
      setDemoModeEnabled(true);
      expect(isDemoModeEnabled()).toBe(true);

      // In Demo Mode, roster and weapons reflect demo starter state
      const demoRoster = getSavedRoster();
      expect(demoRoster).toEqual(DEMO_ROSTER);
      expect(getSavedWeapons()).toEqual(DEMO_WEAPONS);

      // 3. User modifies demo data (e.g., changes a constellation in demo mode)
      saveProfiles({
        ...getSavedProfiles(),
        Bennett: { id: 'Bennett', level: 90, constellation: 6 },
      });

      // 4. User deactivates Demo Mode
      setDemoModeEnabled(false);
      expect(isDemoModeEnabled()).toBe(false);

      // CRITICAL ASSERTION: Real user account data is 100% intact and unchanged!
      const restoredRoster = getSavedRoster();
      expect(restoredRoster).toEqual(['Mavuika', 'Furina']);
      const restoredProfiles = getSavedProfiles();
      expect(restoredProfiles.Mavuika).toBeDefined();
      expect(restoredProfiles.Mavuika.constellation).toBe(2);
      expect(restoredProfiles.Furina).toBeDefined();
      expect(restoredProfiles.Bennett).toBeUndefined(); // Bennett demo change did NOT leak into real data!

      const restoredWeapons = getSavedWeapons();
      expect(restoredWeapons).toHaveLength(1);
      expect(restoredWeapons[0].key).toBe('AThousandBlazingSuns');
      expect(getSavedUid()).toBe('800123456');
    });

    it('resetAccountData completely wipes all account-specific keys including UID and pull budget', () => {
      // Setup dirty account state
      saveRoster(['Nefer']);
      saveProfiles({ Nefer: { id: 'Nefer', level: 90, constellation: 0 } });
      saveWeapons([
        {
          id: 'wep_1',
          key: 'FavoniusSword',
          name: 'Favonius Sword',
          level: 90,
          refinement: 1,
          rarity: 4,
          location: '',
        },
      ]);
      saveUid('700987654');
      savePullBudget({
        primogems: 14400,
        fates: 10,
        characterPity: 50,
        characterGuaranteed: true,
        consecutiveLossCount: 1,
        weaponPity: 20,
        weaponFatePoints: 1,
      });
      saveAbyssCycleId('cycle-7-1');

      // Execute full reset
      const resetResult = resetAccountData();
      expect(resetResult).toBe(true);

      // Verify all keys are purged
      expect(getSavedRoster()).toEqual([]);
      expect(getSavedProfiles()).toEqual({});
      expect(getSavedWeapons()).toEqual([]);
      expect(getSavedUid()).toBe('');
      expect(getSavedPullBudget()).toEqual(DEFAULT_PULL_BUDGET);
      expect(getSavedAbyssCycleId()).toBe('cycle-7-2'); // Reset to default active cycle
      expect(isDemoModeEnabled()).toBe(false);

      // Verify raw storage keys are null
      expect(localStorage.getItem('celestia_v2_active_uid')).toBeNull();
      expect(localStorage.getItem('celestia_v2_pull_budget')).toBeNull();
      expect(localStorage.getItem('celestia_v2_roster_profiles')).toBeNull();
      expect(localStorage.getItem('celestia_v2_raw_weapons')).toBeNull();
      expect(localStorage.getItem('celestia_v2_custom_abyss')).toBeNull();
    });

    it('detects storage availability and handles storage quota exceeded gracefully', () => {
      expect(isStorageAvailable()).toBe(true);

      // Simulate QuotaExceededError on localStorage.setItem
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Writes should catch quota error and return false without throwing
      const profileSaveResult = saveProfiles({ Mavuika: { id: 'Mavuika', level: 90, constellation: 0 } });
      expect(profileSaveResult).toBe(false);

      const weaponSaveResult = saveWeapons([]);
      expect(weaponSaveResult).toBe(false);

      const budgetSaveResult = savePullBudget(DEFAULT_PULL_BUDGET);
      expect(budgetSaveResult).toBe(false);

      expect(getLastStorageError()).toContain('QuotaExceededError');

      // Test saveArtifacts error capture
      const artifactSaveResult = saveArtifacts([{ id: 'art_1' }]);
      expect(artifactSaveResult).toBe(false);
      expect(getLastStorageError()).toContain('QuotaExceededError');

      // Restore setItem
      localStorage.setItem = originalSetItem;
    });

    it('isolates artifact storage namespace between demo mode and authentic accounts', () => {
      // 1. Save authentic user artifacts
      const authenticArtifacts = [{ id: 'real_art_1', setKey: 'GladiatorsFinale', slotKey: 'flower' }];
      saveArtifacts(authenticArtifacts);
      expect(getSavedArtifacts()).toEqual(authenticArtifacts);

      // 2. Enable demo mode
      setDemoModeEnabled(true);
      expect(getSavedArtifacts()).toEqual([]); // Demo namespace is initially empty

      // 3. Save demo artifacts
      const demoArtifacts = [{ id: 'demo_art_1', setKey: 'NoblesseOblige', slotKey: 'plume' }];
      saveArtifacts(demoArtifacts);
      expect(getSavedArtifacts()).toEqual(demoArtifacts);

      // 4. Disable demo mode: authentic artifacts must be preserved intact
      setDemoModeEnabled(false);
      expect(getSavedArtifacts()).toEqual(authenticArtifacts);
    });

    it('propagates saveRoster failure status from saveProfiles', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn((key: string, val: string) => {
        if (key.includes('roster')) {
          const err = new Error('Quota exceeded on roster');
          err.name = 'QuotaExceededError';
          throw err;
        }
        return originalSetItem.call(localStorage, key, val);
      });

      const result = saveProfiles({ Zhongli: { id: 'Zhongli', level: 90, constellation: 0 } });
      expect(result).toBe(false);
      expect(getLastStorageError()).toContain('Quota exceeded');

      localStorage.setItem = originalSetItem;
    });
  });
});
