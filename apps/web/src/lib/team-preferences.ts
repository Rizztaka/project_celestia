import {
  defaultTeamSearchPreferences,
  type TeamSearchPreferences,
  teamSearchPreferencesSchema,
} from '@celestia/api-contracts';

export const inaccessiblePreferences = Symbol('inaccessible-preferences');
export type TeamPreferencesRaw = string | null | typeof inaccessiblePreferences;
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export type TeamPreferenceScope = Pick<TeamSearchPreferences, 'ownerId' | 'accountId'>;
export const teamPreferencesEvent = 'celestia-team-preferences-changed';
export const teamPreferencesKey = (uid: string | null, scope?: Partial<TeamPreferenceScope>) =>
  scope?.ownerId
    ? `celestia.team-search.v1:${scope.ownerId}:${scope.accountId ?? `uid-${uid}`}`
    : `celestia.team-search.v1:${uid}`;
const normalizedScope = (scope?: Partial<TeamPreferenceScope>): TeamPreferenceScope => ({
  ownerId: scope?.ownerId ?? null,
  accountId: scope?.accountId ?? null,
});
function storage(): StorageLike {
  return typeof window === 'undefined' ? globalThis.localStorage : window.localStorage;
}
export function readTeamPreferencesRaw(
  uid: string | null,
  target?: StorageLike,
  scope?: Partial<TeamPreferenceScope>,
): TeamPreferencesRaw {
  try {
    return (target ?? storage()).getItem(teamPreferencesKey(uid, scope));
  } catch {
    return inaccessiblePreferences;
  }
}
export function parseTeamPreferences(
  uid: string | null,
  raw: string | null | typeof inaccessiblePreferences,
  scope?: Partial<TeamPreferenceScope>,
) {
  const expectedScope = normalizedScope(scope);
  const fallback = defaultTeamSearchPreferences(uid, expectedScope);
  if (raw === inaccessiblePreferences)
    return { preferences: fallback, state: 'unavailable' as const };
  if (raw === null) return { preferences: fallback, state: 'empty' as const };
  try {
    if (new TextEncoder().encode(raw).byteLength > 16000) throw new Error('PREFERENCES_TOO_LARGE');
    const preferences = teamSearchPreferencesSchema.parse(JSON.parse(raw));
    if (
      preferences.uid !== uid ||
      preferences.ownerId !== expectedScope.ownerId ||
      preferences.accountId !== expectedScope.accountId
    )
      throw new Error('PREFERENCE_SCOPE_MISMATCH');
    return { preferences, state: 'saved' as const };
  } catch {
    return { preferences: fallback, state: 'invalid' as const };
  }
}
export function writeTeamPreferences(
  uid: string,
  preferences: TeamSearchPreferences,
  expectedRaw: string | null | typeof inaccessiblePreferences,
  target?: StorageLike,
  scope?: Partial<TeamPreferenceScope>,
) {
  const safe = teamSearchPreferencesSchema.parse(preferences);
  if (safe.uid !== uid) throw new Error('Preferences belong to another UID or account.');
  const expectedScope = normalizedScope(scope);
  if (safe.ownerId !== expectedScope.ownerId || safe.accountId !== expectedScope.accountId)
    throw new Error('Preferences belong to another owner or account.');
  let selectedStorage: StorageLike;
  try {
    selectedStorage = target ?? storage();
  } catch {
    throw new Error('Preferences could not be saved. Your changes still apply for this visit.');
  }
  const currentRaw = readTeamPreferencesRaw(uid, selectedStorage, expectedScope);
  if (currentRaw === inaccessiblePreferences)
    throw new Error('Preferences could not be saved. Your changes still apply for this visit.');
  if (parseTeamPreferences(uid, currentRaw, expectedScope).state === 'invalid')
    throw new Error(
      'Saved preferences are unreadable and were preserved. Your changes apply for this visit.',
    );
  if (currentRaw !== expectedRaw)
    throw new Error('Saved preferences changed in another tab. Load them before saving again.');
  try {
    selectedStorage.setItem(teamPreferencesKey(uid, expectedScope), JSON.stringify(safe));
  } catch {
    throw new Error('Preferences could not be saved. Your changes still apply for this visit.');
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(teamPreferencesEvent));
}
