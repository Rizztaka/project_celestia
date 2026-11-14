import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getSavedProfiles,
  saveProfiles,
  getSavedRoster,
  saveRoster,
  getSavedArtifacts,
  saveArtifacts,
  DEFAULT_ROSTER,
} from './storage';

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
});
