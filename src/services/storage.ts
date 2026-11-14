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
    if (!raw) return DEFAULT_ROSTER;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_ROSTER;
    const valid = parsed.filter((id): id is string => typeof id === 'string' && id.trim().length > 0);
    return valid.length > 0 ? valid : DEFAULT_ROSTER;
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
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed as Record<string, OwnedCharacterProfile>;
      }
    }
  } catch (e) {
    console.error('Failed to read profiles from localStorage:', e);
  }

  // Fallback: Build initial profiles from saved roster IDs
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

export function saveArtifacts(artifacts: any[]): void {
  try {
    localStorage.setItem(ARTIFACTS_KEY, JSON.stringify(artifacts));
  } catch (e) {
    console.error('Failed to save artifacts to localStorage:', e);
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
