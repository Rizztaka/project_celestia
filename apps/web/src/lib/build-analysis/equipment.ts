import identity from './equipment-identity.json';
import type { SetIdentity } from './types';

/**
 * Stable set identity.
 *
 * The public showcase contract reports an artifact's numeric item ID and a localised
 * `setName` *label*. That label can be an unresolved fallback such as `Set 1774578891`,
 * so it is never used as an identity. Instead the item ID is resolved through a reviewed
 * table generated from pinned metadata. Unreviewed IDs stay unresolved — unknown, not
 * guessed from a name.
 */

interface IdentityFile {
  schemaVersion: number;
  items: Record<string, number>;
  sets: Record<string, { name: string | null; reference: string | null }>;
  weapons: Record<string, { referenceKey: string; weaponType: string; name: string }>;
}

const data = identity as IdentityFile;
const items = new Map<number, number>(
  Object.entries(data.items).map(([itemId, setId]) => [Number(itemId), setId]),
);
const sets = new Map<number, { name: string | null; reference: string | null }>(
  Object.entries(data.sets).map(([setId, set]) => [Number(setId), set]),
);

/** Resolve an artifact item ID to a reviewed set identity, or null when unreviewed. */
export function setIdentityForItem(itemId: number | null | undefined): SetIdentity | null {
  if (itemId === null || itemId === undefined || !Number.isInteger(itemId)) return null;
  const setId = items.get(itemId);
  if (setId === undefined) return null;
  const set = sets.get(setId);
  if (!set) return null;
  return { setId, name: set.name, referenceKey: set.reference };
}

export function setIdentityForSetId(setId: number): SetIdentity | null {
  const set = sets.get(setId);
  return set ? { setId, name: set.name, referenceKey: set.reference } : null;
}

export function equipmentIdentitySize() {
  return { items: items.size, sets: sets.size };
}

export function weaponIdentity(itemId: number) {
  return data.weapons[String(itemId)] ?? null;
}
