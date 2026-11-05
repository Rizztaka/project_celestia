import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

// This is a local key-to-avatar mapping, not an official release/mechanics certification.
const bytes = readFileSync(new URL('../static/character-profiles.json', import.meta.url));
const catalog: Record<string, { gameId?: number }> = JSON.parse(bytes.toString('utf8'));
export const importedIdentitySource = {
  kind: 'local_catalog' as const,
  sha256: createHash('sha256').update(bytes).digest('hex'),
};

export function importedCharacterIdentity(key: string) {
  // GOOD's elemental Traveler keys do not identify Aether vs Lumine. The catalog's
  // male representative must not silently manufacture an imported avatar/form.
  if (key.startsWith('Traveler') || !Object.hasOwn(catalog, key)) return null;
  const avatarId = catalog[key]?.gameId;
  if (!avatarId || !Number.isSafeInteger(avatarId) || avatarId <= 0) return null;
  // GOOD/persistence retain no skill depot. Never derive one from avatar digits,
  // an engine default or whichever public showcase happens to have this UID.
  return { avatarId, skillDepotId: null, formKey: `${avatarId}:unknown` };
}
