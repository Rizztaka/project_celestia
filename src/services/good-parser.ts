import type {
  GOODData,
  GOODCharacter,
  GOODWeapon,
  OwnedCharacterProfile,
  EquippedWeapon,
} from '../types/genshin';

// Common prepositions and conjunctions to keep lowercase in Genshin weapon names
const LOWERCASE_WORDS = new Set(['of', 'the', 'in', 'for', 'and', 'to']);

/**
 * Converts a PascalCase weapon key (e.g. StaffOfHoma, SplendorOfTranquilWaters)
 * to a clean, readable display name ("Staff of Homa", "Splendor of Tranquil Waters").
 */
export function formatWeaponKeyToName(key: string): string {
  if (!key) return '';
  // Split on capital letters
  const words = key.replace(/([A-Z])/g, ' $1').trim().split(/\s+/);
  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && LOWERCASE_WORDS.has(lower)) {
        return lower;
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Validates and parses raw JSON string into a structured GOODData payload.
 */
export function parseGOODJSON(jsonString: string): {
  success: boolean;
  data?: GOODData;
  error?: string;
} {
  if (!jsonString || typeof jsonString !== 'string' || !jsonString.trim()) {
    return { success: false, error: 'Empty JSON input.' };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, error: `Invalid JSON syntax: ${msg}` };
  }

  if (!parsed || typeof parsed !== 'object') {
    return { success: false, error: 'Malformed JSON payload (expected an object).' };
  }

  if (typeof parsed.format !== 'string' || parsed.format.toUpperCase() !== 'GOOD') {
    return {
      success: false,
      error: 'Not a recognized GOOD format. Expected "format": "GOOD".',
    };
  }

  if (!Array.isArray(parsed.characters)) {
    return {
      success: false,
      error: 'Missing characters array in GOOD data.',
    };
  }

  return {
    success: true,
    data: parsed as GOODData,
  };
}

export interface GOODMapResult {
  profiles: Record<string, OwnedCharacterProfile>;
  rawArtifacts: any[];
  summary: {
    importedCharacters: number;
    importedWeapons: number;
    importedArtifacts: number;
  };
}

/**
 * Maps a valid GOOD payload to Celestia internal OwnedCharacterProfile records.
 * Attaches equipped weapons and retains raw artifacts for optimizer use.
 */
export function mapGOODToCelestiaProfiles(good: GOODData): GOODMapResult {
  const profiles: Record<string, OwnedCharacterProfile> = {};
  const characters = good.characters || [];
  const weapons = good.weapons || [];
  const rawArtifacts = Array.isArray(good.artifacts) ? good.artifacts : [];

  // Index weapons by location (character key)
  const weaponByLocation = new Map<string, GOODWeapon>();
  for (const w of weapons) {
    if (w.location && typeof w.location === 'string' && w.location.trim().length > 0) {
      weaponByLocation.set(w.location, w);
    }
  }

  let equippedWeaponCount = 0;

  for (const char of characters) {
    if (!char.key || typeof char.key !== 'string') continue;
    const key = char.key.trim();
    if (!key) continue;

    const level = Math.max(1, Math.min(90, Math.floor(Number(char.level) || 1)));
    const constellation = Math.max(0, Math.min(6, Math.floor(Number(char.constellation) || 0)));
    const ascension = char.ascension !== undefined ? Math.max(0, Math.min(6, Math.floor(Number(char.ascension) || 0))) : undefined;

    let weapon: EquippedWeapon | undefined = undefined;
    const equipped = weaponByLocation.get(key);
    if (equipped && equipped.key) {
      equippedWeaponCount++;
      weapon = {
        key: equipped.key,
        name: formatWeaponKeyToName(equipped.key),
        level: Math.max(1, Math.min(90, Math.floor(Number(equipped.level) || 1))),
        refinement: Math.max(1, Math.min(5, Math.floor(Number(equipped.refinement) || 1))),
        ascension: equipped.ascension,
      };
    }

    profiles[key] = {
      id: key,
      level,
      constellation,
      ascension,
      talents: char.talent
        ? {
            auto: Math.max(1, Math.min(10, Math.floor(Number(char.talent.auto) || 1))),
            skill: Math.max(1, Math.min(10, Math.floor(Number(char.talent.skill) || 1))),
            burst: Math.max(1, Math.min(10, Math.floor(Number(char.talent.burst) || 1))),
          }
        : undefined,
      weapon,
    };
  }

  return {
    profiles,
    rawArtifacts,
    summary: {
      importedCharacters: Object.keys(profiles).length,
      importedWeapons: equippedWeaponCount,
      importedArtifacts: rawArtifacts.length,
    },
  };
}

/**
 * Merges imported profiles into existing saved profiles.
 */
export function mergeRosterProfiles(
  existing: Record<string, OwnedCharacterProfile>,
  incoming: Record<string, OwnedCharacterProfile>,
  overwriteAll: boolean,
): Record<string, OwnedCharacterProfile> {
  if (overwriteAll) {
    return { ...incoming };
  }
  return {
    ...existing,
    ...incoming,
  };
}

/**
 * Serializes current roster profiles and preserved artifacts into standard GOOD v2 format.
 */
export function exportToGOODJSON(
  profiles: Record<string, OwnedCharacterProfile>,
  rawArtifacts?: any[],
): string {
  const characters: GOODCharacter[] = [];
  const weapons: GOODWeapon[] = [];

  for (const profile of Object.values(profiles)) {
    characters.push({
      key: profile.id,
      level: profile.level,
      constellation: profile.constellation,
      ascension: profile.ascension,
      talent: profile.talents
        ? {
            auto: profile.talents.auto,
            skill: profile.talents.skill,
            burst: profile.talents.burst,
          }
        : undefined,
    });

    if (profile.weapon && profile.weapon.key) {
      weapons.push({
        key: profile.weapon.key,
        level: profile.weapon.level,
        refinement: profile.weapon.refinement,
        ascension: profile.weapon.ascension,
        location: profile.id,
        lock: true,
      });
    }
  }

  const exportPayload: GOODData = {
    format: 'GOOD',
    version: 2,
    source: 'Celestia',
    characters,
    weapons,
    artifacts: rawArtifacts || [],
  };

  return JSON.stringify(exportPayload, null, 2);
}
