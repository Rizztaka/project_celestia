import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { writeCatalogJson } from './catalog-json.mjs';
const root = new URL('../../web/src/lib/build-analysis/', import.meta.url);
const sources = [];
for (const name of ['furina', 'sucrose', 'skirk', 'xilonen']) {
  const url = `https://keqingmains.com/q/${name}-quickguide/`;
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error' });
  if (!response.ok) throw new Error(`Could not acquire ${name}: ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length > 4_000_000) throw new Error('Guide exceeds bound.');
  const html = new TextDecoder().decode(bytes);
  if (!html.includes('Talent') || !html.includes('Artifact'))
    throw new Error('Guide content missing.');
  sources.push({
    id: `kqm-${name}`,
    url,
    title: `${name[0].toUpperCase()}${name.slice(1)} quick guide`,
    sha256: createHash('sha256').update(bytes).digest('hex'),
    reviewedAt: '2026-10-24',
    attribution:
      'KQM; linked reference, independently written summaries. No guide prose reproduced.',
    scope:
      'Selected role main stats, talent priorities and modeled team prerequisites, not a complete kit/rotation model.',
  });
}
const reference = new URL('../src/games/genshin/static/profile-reference/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', reference)));
const relics = JSON.parse(
  readFileSync(new URL('../src/games/genshin/static/enka/relic-items.json', import.meta.url)),
);
const sets = {};
for (const [key, entry] of Object.entries(index.artifacts)) {
  const item = JSON.parse(readFileSync(new URL(entry.file, reference)));
  sets[item.gameId] = { name: item.name, reference: key };
}
for (const id of Object.keys(relics.sets)) sets[id] ??= { name: null, reference: null };
const weapons = {};
for (const [key, entry] of Object.entries(index.weapons)) {
  const item = JSON.parse(readFileSync(new URL(entry.file, reference)));
  weapons[item.gameId] = { referenceKey: key, weaponType: item.weaponType, name: item.name };
}
await writeCatalogJson(new URL('equipment-identity.json', root), {
  schemaVersion: 1,
  items: relics.items,
  sets,
  weapons,
  source: relics.source,
});
await writeCatalogJson(new URL('sources.json', root), {
  version: 'public-build-analysis-1',
  sources,
});
// Acquisition does not update reviewed-hashes.json. Review source changes first.
console.log('Generated four guide fingerprints and stable equipment identities.');
