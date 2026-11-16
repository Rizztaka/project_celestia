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
  getSavedPullBudget,
  savePullBudget,
  DEFAULT_PULL_BUDGET,
  getSavedAbyssCycleId,
  saveAbyssCycleId,
  getSavedCustomAbyss,
  saveCustomAbyss,
  syncArmoryOnProfileUpdate,
} from './storage';
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

  it('returns DEFAULT_ROSTER on brand-new uninitialized visit', () => {
    expect(localStorage.getItem('celestia_v2_owned_roster')).toBeNull();
    expect(localStorage.getItem('celestia_v2_roster_profiles')).toBeNull();

    const roster = getSavedRoster();
    expect(roster).toEqual(DEFAULT_ROSTER);

    const profiles = getSavedProfiles();
    expect(Object.keys(profiles)).toEqual(DEFAULT_ROSTER);
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

  it('returns DEFAULT_WEAPONS when localStorage and profiles have no weapons', () => {
    const weapons = getSavedWeapons();
    expect(weapons.length).toBeGreaterThan(0);
    expect(weapons).toEqual(DEFAULT_WEAPONS);
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

    it('saves and restores pull budget correctly', () => {
      const budget: PullBudgetState = {
        primogems: 16000,
        fates: 25,
        characterPity: 45,
        characterGuaranteed: true,
        weaponPity: 20,
        weaponFatePoints: 1,
      };

      savePullBudget(budget);
      expect(localStorage.getItem('celestia_v2_pull_budget')).not.toBeNull();

      const restored = getSavedPullBudget();
      expect(restored).toEqual(budget);
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
          weaponPity: -5,
          weaponFatePoints: 3, // max is 1
        }),
      );

      const sanitized = getSavedPullBudget();
      expect(sanitized.primogems).toBe(0);
      expect(sanitized.fates).toBe(0);
      expect(sanitized.characterPity).toBe(89);
      expect(sanitized.characterGuaranteed).toBe(false);
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
});
