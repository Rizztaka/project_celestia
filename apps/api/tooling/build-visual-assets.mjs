// Inert pinned indexes only; artwork remains externally hosted by its owners.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { writeCatalogJson } from './catalog-json.mjs';

const root = resolve(import.meta.dirname, '../../..');
const cache = process.argv[2];
const indexDirectory = process.argv[3];
if (!cache || !indexDirectory)
  throw new Error('Supply progression cache and image-index directory.');
const { commit, collected } = JSON.parse(readFileSync(resolve(cache, 'source-data.json')));
const catalog = JSON.parse(
  readFileSync(resolve(root, 'apps/api/src/games/genshin/static/progression-catalog.json')),
);
if (commit !== catalog.source.commit) throw new Error('Artwork source revision mismatch.');
const hashes = {};
const images = {};
for (const kind of ['characters', 'weapons', 'materials', 'artifacts', 'enemies', 'domains']) {
  const bytes = readFileSync(resolve(indexDirectory, `celestia-visual-${kind}.json`));
  hashes[kind] = createHash('sha256').update(bytes).digest('hex');
  images[kind] = JSON.parse(bytes);
}
const keyOf = (name) =>
  name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f'’"“”]/g, '')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join('');
const output = {
  source: { commit, hashes },
  characters: {},
  weapons: {},
  materials: {},
  artifacts: {},
  bosses: {},
  domains: {},
};
for (const { file, data } of collected.characters) {
  const image = images.characters[file.replace('.json', '')];
  output.characters[keyOf(data.name)] = {
    name: data.name,
    file: image?.filename_gachaSplash ?? null,
  };
}
for (const { file, data } of collected.weapons) {
  const image = images.weapons[file.replace('.json', '')];
  output.weapons[keyOf(data.name)] = {
    name: data.name,
    rarity: data.rarity,
    weaponType: data.weaponText,
    file: image.filename_icon,
    secondary: image.mihoyo_icon,
  };
}
for (const reference of Object.values(catalog.materials)) {
  const source = collected.materials.find((entry) => entry.data.id === reference.gameItemId);
  const image = images.materials[source.file.replace('.json', '')];
  output.materials[reference.key] = {
    name: reference.name,
    rarity: source.data.rarity ?? null,
    gameItemId: reference.gameItemId,
    file: image?.filename_icon ?? null,
  };
}
for (const { file, data } of collected.artifacts) {
  const image = images.artifacts[file.replace('.json', '')];
  output.artifacts[keyOf(data.name)] = {
    name: data.name,
    rarity: Math.max(...data.rarityList),
    slots: Object.fromEntries(
      ['flower', 'plume', 'sands', 'goblet', 'circlet']
        .filter((slot) => image?.[`filename_${slot}`])
        .map((slot) => [
          slot,
          { file: image[`filename_${slot}`], secondary: image[`mihoyo_${slot}`] ?? null },
        ]),
    ),
  };
}
for (const file of ['weekly-bosses.json', 'world-bosses.json']) {
  const { bosses } = JSON.parse(
    readFileSync(resolve(root, 'apps/api/src/games/genshin/static', file)),
  );
  for (const boss of bosses) {
    const entry = collected.enemies.find((entry) => entry.data.name === boss.name);
    output.bosses[boss.key] = {
      name: boss.name,
      file: images.enemies[entry.file.replace('.json', '')]?.filename_icon ?? null,
      kind: file === 'weekly-bosses.json' ? 'weekly' : 'world',
      dropKeys: boss.dropKeys,
      location: boss.location ?? null,
    };
  }
}
for (const domain of Object.values(catalog.domains)) {
  const material = collected.materials.find(
    (entry) => entry.data.id === catalog.materials[domain.dropKeys[0]].gameItemId,
  );
  const entry = collected.domains.find((entry) => entry.data.id === material.data.dropDomainId);
  output.domains[domain.domainKey] = {
    name: entry.data.entranceName,
    region: entry.data.regionName,
    file: images.domains[entry.file.replace('.json', '')]?.filename_image ?? null,
  };
}
await writeCatalogJson(resolve(root, 'apps/web/src/lib/visual-assets.json'), output);
console.log(
  JSON.stringify(
    Object.fromEntries(
      Object.entries(output)
        .filter(([kind]) => kind !== 'source')
        .map(([kind, data]) => [kind, Object.keys(data).length]),
    ),
  ),
);
