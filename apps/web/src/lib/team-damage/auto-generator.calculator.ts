import {
  defaultTeamSearchPreferences,
  type TeamSearchPreferences,
  teamSearchPreferencesSchema,
} from '@celestia/api-contracts';

import { formIdentity } from '../build-analysis/identity';
import type { SavedUidTeam } from '../build-analysis/teams-storage';
import type { CharacterObservation } from '../observed-roster';
import { benchmarkSettings, defaultRotation } from './benchmark.calculator';
import { damageInput, engineCharacter } from './calculator';
import {
  calculateTeamComfort,
  type TeamComfortScore,
  validateGearExclusivity,
} from './team-comfort.calculator';

export interface AutoTeamCandidate {
  id: string;
  team: SavedUidTeam;
  config: string;
  favoriteCount: number;
  comfort: TeamComfortScore;
}

export interface AutoTeamPool {
  driver: CharacterObservation | null;
  candidates: AutoTeamCandidate[];
  eligibleTeammates: CharacterObservation[];
  excludedCharacterKeys: string[];
  preferenceExcludedCount: number;
  maxFavoriteCount: number;
  issues: (
    | 'missing_driver'
    | 'driver_excluded'
    | 'required_unavailable'
    | 'required_form_conflict'
    | 'required_slots_exceeded'
  )[];
  missingRequiredKeys: string[];
}

function combinations<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  function visit(start: number, current: T[]) {
    if (current.length === size) {
      result.push([...current]);
      return;
    }
    for (let index = start; index <= items.length - (size - current.length); index += 1) {
      current.push(items[index]);
      visit(index + 1, current);
      current.pop();
    }
  }
  visit(0, []);
  return result;
}

function newestFormRecords(uid: string, records: CharacterObservation[], requiredForms: string[]) {
  const selected = new Map<string, CharacterObservation>();
  for (const record of records.filter((entry) => entry.uid === uid)) {
    const identity = formIdentity({ avatarId: record.character.id });
    const previous = selected.get(identity);
    if (
      !previous ||
      (requiredForms.includes(record.character.key) &&
        !requiredForms.includes(previous.character.key)) ||
      (requiredForms.includes(record.character.key) ===
        requiredForms.includes(previous.character.key) &&
        (Date.parse(record.observedAt) > Date.parse(previous.observedAt) ||
          (Date.parse(record.observedAt) === Date.parse(previous.observedAt) &&
            record.character.key.localeCompare(previous.character.key, 'en') < 0)))
    )
      selected.set(identity, record);
  }
  return [...selected.values()].sort(
    (a, b) =>
      a.character.name.localeCompare(b.character.name) ||
      a.character.key.localeCompare(b.character.key),
  );
}

function transientTeam(uid: string, id: string, members: CharacterObservation[]) {
  return {
    version: 1 as const,
    uid,
    id,
    name: 'Generated team',
    members: members.map((record) => ({
      characterKey: record.character.key,
      roleId: 'unspecified',
    })),
  } satisfies SavedUidTeam;
}

/** Build every supported three-teammate combination for one observed DPS. */
export function buildAutoTeamPool(
  uid: string,
  driverKey: string,
  records: CharacterObservation[],
  preferences: TeamSearchPreferences = defaultTeamSearchPreferences(uid),
): AutoTeamPool {
  const prefs = teamSearchPreferencesSchema.parse(preferences);
  if (prefs.uid !== uid) throw new Error('PREFERENCES_UID_MISMATCH');
  const empty = (
    issues: AutoTeamPool['issues'],
    driver: CharacterObservation | null = null,
    missingRequiredKeys: string[] = [],
  ): AutoTeamPool => ({
    driver,
    candidates: [],
    eligibleTeammates: [],
    excludedCharacterKeys: [],
    preferenceExcludedCount: 0,
    maxFavoriteCount: 0,
    issues,
    missingRequiredKeys,
  });
  // A deliberately chosen Traveler form must not disappear because another form is newer.
  const driver =
    records
      .filter((record) => record.uid === uid && record.character.key === driverKey)
      .sort((a, b) => Date.parse(b.observedAt) - Date.parse(a.observedAt))[0] ?? null;
  if (!driver) return empty(['missing_driver']);
  const identity = formIdentity({ avatarId: driver.character.id });
  if (prefs.excludedCharacters.includes(identity)) return empty(['driver_excluded'], driver);
  if (
    prefs.requiredForms.some(
      (key) =>
        key !== driverKey && formIdentity({ avatarId: Number(key.split(':')[0]) }) === identity,
    )
  )
    return empty(['required_form_conflict'], driver);
  if (prefs.requiredForms.filter((key) => key !== driverKey).length > 3)
    return empty(['required_slots_exceeded'], driver);
  const roster = newestFormRecords(uid, records, prefs.requiredForms).filter(
    (record) => formIdentity({ avatarId: record.character.id }) !== identity,
  );

  const preferenceExcludedCount = roster.filter((record) =>
    prefs.excludedCharacters.includes(formIdentity({ avatarId: record.character.id })),
  ).length;
  const allowedRoster = roster.filter(
    (record) => !prefs.excludedCharacters.includes(formIdentity({ avatarId: record.character.id })),
  );
  const eligibleTeammates = allowedRoster.filter(
    (record) => record.character.key !== driverKey && !!engineCharacter(record.character.key),
  );
  const excludedCharacterKeys = allowedRoster
    .filter(
      (record) => record.character.key !== driverKey && !engineCharacter(record.character.key),
    )
    .map((record) => record.character.key);
  const missingRequiredKeys = prefs.requiredForms.filter(
    (key) => key !== driverKey && !eligibleTeammates.some((record) => record.character.key === key),
  );
  if (missingRequiredKeys.length)
    return empty(['required_unavailable'], driver, missingRequiredKeys);
  const candidates: AutoTeamCandidate[] = [];
  const fixed = eligibleTeammates.filter((record) =>
    prefs.requiredForms.includes(record.character.key),
  );
  const flexible = eligibleTeammates.filter(
    (record) => !prefs.requiredForms.includes(record.character.key),
  );
  for (const choices of combinations(flexible, 3 - fixed.length)) {
    const selectedKeys = new Set([...fixed, ...choices].map((record) => record.character.key));
    // Preserve the same setup order as the unconstrained search for comparable rotations.
    const group = eligibleTeammates.filter((record) => selectedKeys.has(record.character.key));
    const members = [driver, ...group];
    if (prefs.requiredForms.some((key) => !members.some((record) => record.character.key === key)))
      continue;

    // Enforce gear exclusivity: no duplicate weapon or artifact piece across the lineup
    const exclusivity = validateGearExclusivity(
      members.map((m) => ({
        character: { key: m.character.key },
        weapon: m.character.weapon
          ? {
              id: m.character.weapon.id,
              instanceId: (m.character.weapon as { instanceId?: string | null }).instanceId,
            }
          : undefined,
        artifacts: Array.isArray(m.character.artifacts)
          ? m.character.artifacts.map((a) => ({
              id: a.id,
              instanceId: (a as { instanceId?: string | null }).instanceId,
            }))
          : [],
      })),
    );
    if (!exclusivity.valid) continue;

    const team = transientTeam(uid, String(candidates.length), members);
    const settings = benchmarkSettings(defaultRotation(team, driverKey));
    const input = damageInput(uid, team, [driver, ...roster], settings);
    if (!input.config) continue;
    candidates.push({
      id: String(candidates.length),
      team,
      config: input.config,
      favoriteCount: members.filter((record) =>
        prefs.favoriteCharacters.includes(formIdentity({ avatarId: record.character.id })),
      ).length,
      comfort: calculateTeamComfort(members.map((m) => m.character.key)),
    });
  }
  const maxFavoriteCount = candidates.reduce(
    (max, candidate) => Math.max(max, candidate.favoriteCount),
    0,
  );
  return {
    driver,
    candidates:
      prefs.priority === 'favorites'
        ? candidates.filter((candidate) => candidate.favoriteCount === maxFavoriteCount)
        : candidates,
    eligibleTeammates,
    excludedCharacterKeys,
    preferenceExcludedCount,
    maxFavoriteCount,
    issues: [],
    missingRequiredKeys: [],
  };
}
