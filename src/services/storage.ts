const ROSTER_KEY = 'celestia_v2_owned_roster';
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
