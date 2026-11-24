import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import React from 'react';

// Storage & Backup APIs
import {
  getSavedRoster,
  saveRoster,
  getSavedProfiles,
  saveProfiles,
  getSavedWeapons,
  getSavedPullBudget,
  savePullBudget,
  isDemoModeEnabled,
  setDemoModeEnabled,
  resetAccountData,
  DEMO_ROSTER,
  DEMO_WEAPONS,
  DEFAULT_ROSTER,
  DEFAULT_WEAPONS,
} from '../services/storage';
import { equipWeaponToCharacter } from '../services/armory-operations';
import {
  exportAccountBackup,
  importAccountBackup,
  rollbackPreRestoreBackup,
  validateBackupData,
} from '../services/backup';

// Engines & Data
import { generateBestTeams } from '../engines/team-generator';
import { solveAbyssDualTeams } from '../engines/abyss-solver';
import { filterEligibleTheaterRoster } from '../engines/theater-solver';
import { calculateRadianceWinRate, calculateTotalPulls } from '../engines/gacha-math';
import { THEATER_SEASONS } from '../data/theater-seasons';
import { ErrorBoundary } from '../components/ErrorBoundary';

describe('Celestia v2 — End-to-End User Journeys (Audit Simulation)', () => {
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

  // Journey 1: Truthful Onboarding & Demo Toggle
  it('Journey 1: Onboarding defaults to authentic 0 count and cleanly toggles demo state', () => {
    // 1. Fresh visitor starts with authentic empty state
    expect(getSavedRoster()).toEqual(DEFAULT_ROSTER);
    expect(getSavedWeapons()).toEqual(DEFAULT_WEAPONS);
    expect(getSavedProfiles()).toEqual({});
    expect(isDemoModeEnabled()).toBe(false);

    // 2. User activates Demo Mode
    setDemoModeEnabled(true);
    expect(isDemoModeEnabled()).toBe(true);

    const demoRoster = getSavedRoster();
    expect(demoRoster).toHaveLength(11);
    expect(demoRoster).toEqual(DEMO_ROSTER);

    const demoWeapons = getSavedWeapons();
    expect(demoWeapons).toHaveLength(8);
    expect(demoWeapons).toEqual(DEMO_WEAPONS);

    // 3. User deactivates Demo Mode
    setDemoModeEnabled(false);
    expect(isDemoModeEnabled()).toBe(false);
    expect(getSavedRoster()).toEqual([]);
    expect(getSavedWeapons()).toEqual([]);
    expect(getSavedProfiles()).toEqual({});
  });

  // Journey 2: Character Profile Customization & Roster Persistence
  it('Journey 2: Customizes character profile, persists to storage, and supports clean reset', () => {
    // 1. User adds Mavuika to their authentic roster
    saveRoster(['Mavuika']);
    expect(getSavedRoster()).toEqual(['Mavuika']);

    // 2. User configures Mavuika profile: C2, level 90, weapon equipped
    saveProfiles({
      Mavuika: {
        id: 'Mavuika',
        level: 90,
        constellation: 2,
        weapon: {
          key: 'AThousandBlazingSuns',
          name: 'A Thousand Blazing Suns',
          level: 90,
          refinement: 1,
          rarity: 5,
        },
      },
    });

    // 3. Simulating page reload / re-fetch
    const reloadedProfiles = getSavedProfiles();
    expect(reloadedProfiles.Mavuika).toBeDefined();
    expect(reloadedProfiles.Mavuika.constellation).toBe(2);
    expect(reloadedProfiles.Mavuika.weapon?.key).toBe('AThousandBlazingSuns');

    // 4. Reset account data
    resetAccountData();
    expect(getSavedRoster()).toEqual([]);
    expect(getSavedProfiles()).toEqual({});
  });

  // Journey 3: Atomic Cross-Character Weapon Swapping
  it('Journey 3: Transfers weapon atomically without duplicating and rejects incompatible weapon types', () => {
    const catchWeapon = {
      id: 'weapon_catch_1',
      key: 'TheCatch',
      name: '"The Catch"',
      level: 90,
      refinement: 5,
      rarity: 4,
      location: 'Xiangling',
    };

    const warbowWeapon = {
      id: 'weapon_fav_bow_1',
      key: 'FavoniusWarbow',
      name: 'Favonius Warbow',
      level: 90,
      refinement: 3,
      rarity: 4,
      location: '',
    };

    const initialWeapons = [catchWeapon, warbowWeapon];
    const initialProfiles = {
      Xiangling: {
        id: 'Xiangling',
        level: 90,
        constellation: 6,
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

    // 1. Equip "The Catch" onto Raiden Shogun (transferred from Xiangling)
    const result = equipWeaponToCharacter(
      'weapon_catch_1',
      'RaidenShogun',
      initialWeapons,
      initialProfiles,
    );

    expect(result.transferredFrom).toBe('Xiangling');
    const equippedCatch = result.updatedWeapons.find((w) => w.id === 'weapon_catch_1');
    expect(equippedCatch?.location).toBe('RaidenShogun');

    // Xiangling's profile weapon must now be undefined
    expect(result.updatedProfiles.Xiangling.weapon).toBeUndefined();
    // Raiden's profile weapon must now be The Catch
    expect(result.updatedProfiles.RaidenShogun.weapon?.key).toBe('TheCatch');
    // Total weapon inventory length must remain strictly invariant (no duplication)
    expect(result.updatedWeapons).toHaveLength(2);

    // 2. Attempt to equip Favonius Warbow (Bow) onto Raiden Shogun (Polearm)
    const incompatibleResult = equipWeaponToCharacter(
      'weapon_fav_bow_1',
      'RaidenShogun',
      result.updatedWeapons,
      result.updatedProfiles,
    );

    // Operation must be safely rejected without state mutation
    expect(incompatibleResult.updatedProfiles.RaidenShogun.weapon?.key).toBe('TheCatch');
  });

  // Journey 4: Pull Budget & Markov Gacha Simulator
  it('Journey 4: Configures pull budget and correctly steps up Capturing Radiance probability', () => {
    // 1. Calculate pulls from primogems + fates
    const pulls = calculateTotalPulls(16000, 20); // 100 + 20 = 120 pulls
    expect(pulls).toBe(120);

    // 2. Configure pull budget state
    const budget = {
      primogems: 16000,
      fates: 20,
      characterPity: 50,
      characterGuaranteed: false,
      consecutiveLossCount: 0,
      weaponPity: 15,
      weaponFatePoints: 0,
    };
    savePullBudget(budget);
    expect(getSavedPullBudget().primogems).toBe(16000);

    // 3. Capturing Radiance 4-state step-up verification (v7.2 baseline): 0 losses -> 50%, 1 loss -> 50%, 2 losses -> 8/11 (~72.7%), 3+ losses -> 100%
    expect(calculateRadianceWinRate(0)).toBe(0.50);
    expect(calculateRadianceWinRate(1)).toBe(0.50);
    expect(calculateRadianceWinRate(2)).toBeCloseTo(8 / 11, 3);
    expect(calculateRadianceWinRate(3)).toBe(1.0);
  });

  // Journey 5: Multi-Factor Team Generator
  it('Journey 5: Recommends teams using strictly owned characters without unowned leak or dual-Travelers', () => {
    const ownedRoster = ['HuTao', 'Xingqiu', 'Yelan', 'Zhongli', 'Furina', 'Bennett', 'Xiangling'];

    const teams = generateBestTeams(ownedRoster, 'HuTao').items;
    expect(teams.length).toBeGreaterThan(0);

    const ownedSet = new Set(ownedRoster);
    for (const team of teams) {
      // 1. Every character in the recommended team must be owned
      for (const member of team.members) {
        expect(ownedSet.has(member.id), `Team contains unowned character: ${member.id}`).toBe(true);
      }

      // 2. Verify no dual-Traveler configurations
      const travelerCount = team.members.filter((m) => m.id.startsWith('Traveler')).length;
      expect(travelerCount).toBeLessThanOrEqual(1);

      // 3. Verify compositionCompatibilityScore is exposed
      expect(team.compositionCompatibilityScore).toBeDefined();
      expect(team.compositionCompatibilityScore).toBeGreaterThanOrEqual(0);
    }
  });

  // Journey 6: Imaginarium Theater & Abyss Dual-Team Drafting
  it('Journey 6: Filters eligible cast for Theater and drafts non-overlapping dual teams for Abyss', () => {
    // 1. Theater eligibility check for active season
    const activeSeason = THEATER_SEASONS[0]; // Hydro / Electro / Geo
    const candidateRoster = [
      'Furina', // Hydro (eligible)
      'Clorinde', // Electro (eligible)
      'Zhongli', // Geo (eligible)
      'Mavuika', // Special Guest (eligible)
      'KamisatoAyaka', // Cryo (ineligible)
      'HuTao', // Pyro (ineligible)
    ];

    const theaterResult = filterEligibleTheaterRoster(candidateRoster, activeSeason);
    const eligibleIds = new Set(theaterResult.eligible.map((c) => c.id));

    expect(eligibleIds.has('Furina')).toBe(true);
    expect(eligibleIds.has('Clorinde')).toBe(true);
    expect(eligibleIds.has('Zhongli')).toBe(true);
    expect(eligibleIds.has('Mavuika')).toBe(true);
    expect(eligibleIds.has('KamisatoAyaka')).toBe(false);
    expect(eligibleIds.has('HuTao')).toBe(false);

    // 2. Abyss dual-team drafting: must produce 0 duplicate characters between halves
    const comprehensiveRoster = [
      'Nefer', 'Furina', 'Nahida', 'KukiShinobu',
      'Mavuika', 'Yelan', 'KaedeharaKazuha', 'Bennett',
      'Xilonen', 'Citlali', 'Chasca', 'Arlecchino',
      'RaidenShogun', 'Xingqiu', 'Zhongli',
    ];

    const abyssPlan = solveAbyssDualTeams(comprehensiveRoster);
    expect(abyssPlan.firstHalfTeam.members).toHaveLength(4);
    expect(abyssPlan.secondHalfTeam.members).toHaveLength(4);

    const firstHalfIds = new Set(abyssPlan.firstHalfTeam.members.map((c) => c.id));
    for (const member of abyssPlan.secondHalfTeam.members) {
      expect(firstHalfIds.has(member.id), `Character ${member.id} duplicated across Abyss halves!`).toBe(false);
    }
  });

  // Journey 7: Error Recovery & Tab Navigation
  it('Journey 7: ErrorBoundary catches unhandled errors and allows clean retry recovery', () => {
    const onRetry = vi.fn();
    const boundary = new ErrorBoundary({
      children: React.createElement('div', null, 'Active View'),
      fallbackTitle: 'Failed to load asset chunk',
      onRetry,
    });

    // Simulate an unexpected runtime exception in a view component
    boundary.state = {
      hasError: true,
      error: new Error('Failed to load asset chunk'),
    };

    const rendered = boundary.render();
    const html = renderToString(rendered as React.ReactElement);

    expect(html).toContain('role="alert"');
    expect(html).toContain('Failed to load asset chunk');
    expect(html).toContain('Try Again');

    // Simulate clicking Try Again
    let updatedState: any = null;
    boundary.setState = ((updater: any) => {
      updatedState = typeof updater === 'function' ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...updatedState };
    }) as any;

    (boundary as any).handleRetry();
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(updatedState.hasError).toBe(false);
  });

  // Journey 8: Account Backup Export, Migration & Restore
  it('Journey 8: Complete cycle of backup export, mutation, valid restore, and rollback', () => {
    // 1. Initial user setup
    saveRoster(['Mavuika', 'Furina']);
    saveProfiles({
      Mavuika: { id: 'Mavuika', level: 90, constellation: 2 },
      Furina: { id: 'Furina', level: 90, constellation: 0 },
    });
    savePullBudget({
      primogems: 25000,
      fates: 15,
      characterPity: 30,
      characterGuaranteed: true,
      consecutiveLossCount: 0,
      weaponPity: 0,
      weaponFatePoints: 0,
    });

    // 2. Export backup
    const backup = exportAccountBackup();
    expect(backup.format).toBe('celestia_native');
    expect(backup.version).toBe(2);
    expect(backup.roster).toEqual(['Mavuika', 'Furina']);

    const validation = validateBackupData(backup);
    expect(validation.valid).toBe(true);

    // 3. User mutates data (e.g. accidental roster deletion)
    saveRoster([]);
    saveProfiles({});
    expect(getSavedRoster()).toEqual([]);

    // 4. Restore from backup
    const importRes = importAccountBackup(backup);
    expect(importRes.success).toBe(true);
    expect(getSavedRoster()).toEqual(['Mavuika', 'Furina']);
    expect(getSavedProfiles().Mavuika.constellation).toBe(2);

    // 5. Pre-restore snapshot exists and can be rolled back to empty state
    expect(localStorage.getItem('celestia_backup_pre_restore')).not.toBeNull();
    const rollbackRes = rollbackPreRestoreBackup();
    expect(rollbackRes).toBe(true);
    expect(getSavedRoster()).toEqual([]);
  });
});
