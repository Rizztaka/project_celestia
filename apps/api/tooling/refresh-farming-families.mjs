// Offline catalog refresh: preserve the independently fingerprinted historical coordinates/yields.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const stable = (value) =>
  Array.isArray(value)
    ? value.map(stable)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.entries(value)
            .sort(([a], [b]) => a.localeCompare(b, 'en'))
            .map(([key, item]) => [key, stable(item)]),
        )
      : value;
const fingerprint = (value) =>
  createHash('sha256')
    .update(JSON.stringify(stable(value)))
    .digest('hex');

export function refreshFarmingFamilies(catalog, collected, root) {
  const file = resolve(root, 'apps/api/src/games/genshin/static/farming-data.json');
  const { contentFingerprint, ...payload } = JSON.parse(readFileSync(file, 'utf8'));
  if (fingerprint(payload) !== contentFingerprint)
    throw new Error('Existing farming fingerprint mismatch.');
  const byId = new Map(collected.materials.map((entry) => [entry.data.id, entry.data]));
  payload.families = Object.values(catalog.domains).map((domain) => {
    const materialKeys = [...domain.dropKeys].sort(
      (a, b) =>
        byId.get(catalog.materials[a].gameItemId).rarity -
        byId.get(catalog.materials[b].gameItemId).rarity,
    );
    if (
      ![3, 4].includes(materialKeys.length) ||
      materialKeys.some((key, i) => byId.get(catalog.materials[key].gameItemId).rarity !== i + 2)
    )
      throw new Error('Non-contiguous farming family tiers.');
    return { domain, kind: materialKeys.length === 3 ? 'talent' : 'weapon', materialKeys };
  });
  if (payload.routes.some((route) => route.materialKeys.some((key) => !catalog.materials[key])))
    throw new Error('Historical coordinate material missing from refreshed catalog.');
  payload.progressionFingerprint = catalog.contentFingerprint;
  payload.contentFingerprint = fingerprint(payload);
  writeFileSync(file, JSON.stringify(payload, null, 2) + '\n');
}
