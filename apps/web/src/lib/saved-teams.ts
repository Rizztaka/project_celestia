import { characterMetadata } from './artwork';

export interface SavedTeam {
  id: string;
  name: string;
  characterKeys: string[];
}
const KEY = 'celestia_saved_teams';
interface TeamFile {
  version: 1;
  teams: SavedTeam[];
}
interface TeamStorage {
  version: 1;
  accounts: { ownerId: string; teams: SavedTeam[] }[];
}

function validTeam(value: unknown): value is SavedTeam {
  if (!value || typeof value !== 'object') return false;
  const team = value as SavedTeam;
  return (
    typeof team.id === 'string' &&
    team.id.length > 0 &&
    team.id.length <= 80 &&
    typeof team.name === 'string' &&
    team.name.trim().length > 0 &&
    team.name.length <= 80 &&
    Array.isArray(team.characterKeys) &&
    team.characterKeys.length === 4 &&
    new Set(team.characterKeys).size === 4 &&
    team.characterKeys.every(
      (key) => typeof key === 'string' && Object.hasOwn(characterMetadata, key),
    )
  );
}
export function parseTeamFile(raw: string): SavedTeam[] {
  if (raw.length > 200_000) throw new Error('Team file exceeds 200 KB.');
  const value = JSON.parse(raw) as TeamFile;
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.teams) ||
    value.teams.length > 100 ||
    !value.teams.every(validTeam) ||
    new Set(value.teams.map((team) => team.id)).size !== value.teams.length
  )
    throw new Error(
      'Use a version 1 team export with up to 100 unique teams of four known characters.',
    );
  return value.teams.map((team) => ({
    id: team.id,
    name: team.name.trim(),
    characterKeys: [...team.characterKeys],
  }));
}
function readStorage(): TeamStorage {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { version: 1, accounts: [] };
  const value = JSON.parse(raw) as TeamStorage;
  if (
    !value ||
    value.version !== 1 ||
    !Array.isArray(value.accounts) ||
    value.accounts.some(
      (account) =>
        !account ||
        typeof account.ownerId !== 'string' ||
        !Array.isArray(account.teams) ||
        !account.teams.every(validTeam),
    )
  )
    throw new Error(
      'Saved team storage could not be read. Export or repair your browser data before saving.',
    );
  return value;
}
export function loadSavedTeams(ownerId: string): { teams: SavedTeam[]; error: string } {
  try {
    return {
      teams: readStorage().accounts.find((account) => account.ownerId === ownerId)?.teams ?? [],
      error: '',
    };
  } catch {
    return {
      teams: [],
      error: 'Saved team storage is unavailable or damaged. Existing data has been preserved.',
    };
  }
}
export function saveTeams(ownerId: string, teams: SavedTeam[]) {
  const storage = readStorage();
  const safe = parseTeamFile(JSON.stringify({ version: 1, teams }));
  const accounts = storage.accounts.filter((account) => account.ownerId !== ownerId);
  localStorage.setItem(
    KEY,
    JSON.stringify({ version: 1, accounts: [...accounts, { ownerId, teams: safe }] }),
  );
}
export function exportTeams(teams: SavedTeam[]) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ version: 1, teams }, null, 2)], { type: 'application/json' }),
  );
  const anchor = document.createElement('a');
  try {
    anchor.href = url;
    anchor.download = 'celestia-saved-teams.json';
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
