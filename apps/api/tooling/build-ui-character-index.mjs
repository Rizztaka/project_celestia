// Generate the small public character index from the already-pinned profile catalog.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('../src/games/genshin/static/profile-reference/', import.meta.url);
const index = JSON.parse(readFileSync(new URL('index.json', root), 'utf8'));
const characters = {};
for (const [key, entry] of Object.entries(index.characters)) {
  if (!/^characters-[A-Za-z0-9]+\.json$/.test(entry.file)) throw Error('Invalid catalog filename');
  const bytes = readFileSync(new URL(entry.file, root));
  if (createHash('sha256').update(bytes).digest('hex') !== entry.sha256)
    throw Error('Catalog integrity mismatch');
  const ref = JSON.parse(bytes.toString('utf8'));
  if (ref.key !== key) throw Error('Catalog identity mismatch');
  characters[key] = {
    name: ref.name,
    rarity: ref.rarity,
    element: ref.element,
    weapon: ref.weaponType,
  };
}
writeFileSync(
  new URL('../../web/src/lib/character-reference-index.json', import.meta.url),
  JSON.stringify(characters, null, 2) + '\n',
);
console.log(`Generated ${Object.keys(characters).length} canonical character references.`);
