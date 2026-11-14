import type { OwnedCharacterProfile } from '../types/genshin';

const ROSTER_KEY = 'celestia_v2_owned_roster';
const PROFILES_KEY = 'celestia_v2_roster_profiles';
const ARTIFACTS_KEY = 'celestia_v2_raw_artifacts';
const UID_KEY = 'celestia_v2_active_uid';

// Default starter roster so new users have an instant rich experience
export const DEFAULT_ROSTER = [
  'Nefer',
  'Xilonen',
  'Mavuika',
  'Furina',
  'Bennett',
  'Xiangling',
  'Xingqiu',
  'Fischl',
  'Sucrose',
  'KukiShinobu',
  'Diona',
];

export function getSavedRoster(): string[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (raw === null) return DEFAULT_ROSTER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_ROSTER;
    return parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
  } catch {
    return DEFAULT_ROSTER;
  }
}

export function saveRoster(ids: string[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(ids));
  } catch (e) {
    console.error('Failed to save roster to localStorage:', e);
  }
}

export function getSavedProfiles(): Record<string, OwnedCharacterProfile> {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, OwnedCharacterProfile>;
      }
    }
  } catch (e) {
    console.error('Failed to read profiles from localStorage:', e);
  }

  // Fallback for first-time uninitialized visits: build baseline from saved/default roster
  const fallbackIds = getSavedRoster();
  const baseline: Record<string, OwnedCharacterProfile> = {};
  for (const id of fallbackIds) {
    baseline[id] = {
      id,
      level: 90,
      constellation: 0,
    };
  }
  return baseline;
}

export function saveProfiles(profiles: Record<string, OwnedCharacterProfile>): void {
  try {
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    // Keep legacy owned roster in sync
    saveRoster(Object.keys(profiles));
  } catch (e) {
    console.error('Failed to save profiles to localStorage:', e);
  }
}

export function getSavedArtifacts(): any[] {
  try {
    const raw = localStorage.getItem(ARTIFACTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArtifacts(artifacts: any[]): boolean {
  try {
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
    return true;
  } catch (e) {
    console.warn('Failed to save artifacts to localStorage (quota exceeded):', e);
    return false;
  }
}

export function getSavedUid(): string {
  try {
    return localStorage.getItem(UID_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUid(uid: string): void {
  try {
    localStorage.setItem(UID_KEY, uid);
  } catch (e) {
    console.error('Failed to save uid to localStorage:', e);
  }
}
