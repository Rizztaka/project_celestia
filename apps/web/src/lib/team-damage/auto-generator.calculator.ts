import { formIdentity } from '../build-analysis/identity';
import type { SavedUidTeam } from '../build-analysis/teams-storage';
import type { CharacterObservation } from '../observed-roster';
import { benchmarkSettings, defaultRotation } from './benchmark.calculator';
import { damageInput, engineCharacter } from './calculator';

export interface AutoTeamCandidate {
  id: string;
  team: SavedUidTeam;
  config: string;
}

export interface AutoTeamPool {
  driver: CharacterObservation | null;
  candidates: AutoTeamCandidate[];
  eligibleTeammates: CharacterObservation[];
  excludedCharacterKeys: string[];
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

function newestFormRecords(uid: string, records: CharacterObservation[]) {
  const selected = new Map<string, CharacterObservation>();
  for (const record of records.filter((entry) => entry.uid === uid)) {
    const identity = formIdentity({ avatarId: record.character.id });
    const previous = selected.get(identity);
    if (!previous || Date.parse(record.observedAt) >= Date.parse(previous.observedAt))
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
): AutoTeamPool {
  const roster = newestFormRecords(uid, records);
  const driver = roster.find((record) => record.character.key === driverKey) ?? null;
  if (!driver)
    return { driver: null, candidates: [], eligibleTeammates: [], excludedCharacterKeys: [] };

  const eligibleTeammates = roster.filter(
    (record) => record.character.key !== driverKey && !!engineCharacter(record.character.key),
  );
  const excludedCharacterKeys = roster
    .filter(
      (record) => record.character.key !== driverKey && !engineCharacter(record.character.key),
    )
    .map((record) => record.character.key);
  const candidates: AutoTeamCandidate[] = [];
  for (const group of combinations(eligibleTeammates, 3)) {
    const members = [driver, ...group];
    const team = transientTeam(uid, String(candidates.length), members);
    const settings = benchmarkSettings(defaultRotation(team, driverKey));
    const input = damageInput(uid, team, records, settings);
    if (!input.config) continue;
    candidates.push({ id: String(candidates.length), team, config: input.config });
  }
  return { driver, candidates, eligibleTeammates, excludedCharacterKeys };
}
