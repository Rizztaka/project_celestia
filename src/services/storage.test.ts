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
} from './storage';
import type { OwnedWeapon, PullBudgetState } from '../types/genshin';

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
        location: 'HuTao',
      },
      {
        id: 'w_2',
        key: 'FavoniusLance',
        name: 'Favonius Lance',
        level: 80,
        refinement: 3,
        location: '',
      },
    ];

    expect(saveWeapons(testBag)).toBe(true);
    const loaded = getSavedWeapons();
    expect(loaded).toEqual(testBag);
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
