// Reviewed stable identities for the public showcase contract, built offline from pinned
// metadata. The showcase response carries a localised set *label* and numeric item IDs;
// only this table turns an item ID into a set identity, so a label fallback such as
// "Set 1774578891" never becomes a rule input.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { writeCatalogJson } from './catalog-json.mjs';

// Pinned official metadata linked from Enka's Genshin API documentation.
const revision = 'a9b583eb4a708dd3db56f6bdef35c3e84e4d213c';
const relicUrl = `https://raw.githubusercontent.com/EnkaNetwork/API-docs/${revision}/store/gi/relics.json`;
const referenceRoot = new URL('../src/games/genshin/static/profile-reference/', import.meta.url);
const enkaRoot = new URL('../src/games/genshin/static/enka/', import.meta.url);
const destination = new URL(
  '../../web/src/lib/build-analysis/equipment-identity.json',
  import.meta.url,
);

const readJson = (url) => JSON.parse(readFileSync(url, 'utf8'));

export function buildEquipmentIdentity({ relics, english, references }) {
  const referencesByGameId = new Map();
  for (const reference of references)
    if (!referencesByGameId.has(reference.gameId)) referencesByGameId.set(reference.gameId, reference);
  const sets = {};
  for (const [setId, set] of Object.entries(relics.Sets)) {
    const name = english[String(set.Name)] ?? null;
    if (!name) continue;
    sets[setId] = { name, reference: referencesByGameId.get(Number(setId))?.key ?? null };
  }
  const items = {};
  for (const [itemId, item] of Object.entries(relics.Items)) {
    const setId = Number(item.SetId);
    // SetId 0 is the no-set bucket used by single-slot oddities; it has no set identity.
    if (!setId || !sets[String(setId)]) continue;
    items[itemId] = setId;
  }
  return { schemaVersion: 1, items, sets };
}

const response = await fetch(relicUrl, {
  headers: { 'User-Agent': 'ProjectCelestia-P1/1.0 (+https://github.com/Rizztaka/project_celestia)' },
  signal: AbortSignal.timeout(20000),
  redirect: 'error',
});
if (!response.ok) throw new Error('Equipment identity acquisition failed.');
const raw = await response.text();
const relics = JSON.parse(raw);
if (!relics?.Items || !relics?.Sets) throw new Error('Unexpected equipment metadata shape.');

const english = readJson(new URL('english.json', enkaRoot));
const referenceIndex = readJson(new URL('index.json', referenceRoot));
const references = Object.entries(referenceIndex.artifacts).map(([key, entry]) => {
  const reference = readJson(new URL(entry.file, referenceRoot));
  if (reference.key !== key) throw new Error('Reference identity mismatch.');
  return { key, gameId: Number(reference.gameId) };
});

const identity = buildEquipmentIdentity({ relics, english, references });
if (Object.keys(identity.items).length < 1000) throw new Error('Equipment identity table too small.');
await writeCatalogJson(destination, {
  ...identity,
  source: {
    url: relicUrl,
    revision,
    documentation: 'https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md',
    upstreamSha256: createHash('sha256').update(raw).digest('hex'),
    license:
      'The pinned metadata store publishes no explicit licence; only numeric relic and set IDs are retained.',
    transformation:
      'Pinned store/gi/relics.json reduced to numeric relic item ID to relic set ID. Set display names come from the already-acquired pinned Enka English map; the reviewed genshin-db reference key is joined by relic set game ID. No prose, icons, stats or account data retained.',
    referenceIndex: {
      file: 'apps/api/src/games/genshin/static/profile-reference/index.json',
      sha256: createHash('sha256')
        .update(readFileSync(new URL('index.json', referenceRoot)))
        .digest('hex'),
    },
  },
});
console.log(
  `Wrote ${Object.keys(identity.items).length} item and ${Object.keys(identity.sets).length} set identities to ${fileURLToPath(destination)}.`,
);
