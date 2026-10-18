// Fetch data only, never execute upstream code. Pin every source URL to one commit.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const commit = '49a6544a6c6ae36089cb42fa591fc46f01de8bcf';
const cache = process.argv[2];
if (!cache) throw new Error('Supply an explicit source-cache directory.');
mkdirSync(cache, { recursive: true });
const sha = (text) => createHash('sha256').update(text).digest('hex');
async function download(path) {
  const destination = resolve(cache, path.replaceAll('/', '__'));
  if (existsSync(destination)) return readFileSync(destination, 'utf8');
  const url = `https://raw.githubusercontent.com/theBowja/genshin-db/${commit}/${path}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source retrieval failed: ${path} (${response.status})`);
  const text = await response.text();
  writeFileSync(destination, text);
  return text;
}
const trees = {
  characters: 'd528e0998d5f4a8707f68af64238f358cf3fc3ae',
  talents: 'b7c8db4ff8805da3bf07674fa29df9ccfc6b641f',
  weapons: 'e99fa8d3a12d3fd019f9518f6492d33c171d1b3e',
  materials: '8366578888b395b725d2f73d635fbad0f1e75379',
  domains: 'dedb7deb57d00e2d92b5dd2eedbbb37f7ea306f5',
};
const collected = {};
for (const [folder, tree] of Object.entries(trees)) {
  const treeCache = resolve(cache, `${folder}-tree.json`);
  let listing;
  if (existsSync(treeCache)) listing = JSON.parse(readFileSync(treeCache, 'utf8'));
  else {
    const response = await fetch(
      `https://api.github.com/repos/theBowja/genshin-db/git/trees/${tree}`,
    );
    if (!response.ok) throw new Error(`Source index failed (${response.status})`);
    listing = await response.json();
    writeFileSync(treeCache, JSON.stringify(listing));
  }
  if (listing.truncated) throw new Error('Incomplete source index.');
  const paths = listing.tree.filter(
    (entry) => entry.type === 'blob' && entry.path.endsWith('.json'),
  );
  const entries = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (cursor < paths.length) {
        const entry = paths[cursor++];
        const path = `src/data/English/${folder}/${entry.path}`;
        const text = await download(path);
        entries.push({
          file: entry.path,
          sourcePath: path,
          sourceHash: sha(text),
          data: JSON.parse(text),
        });
      }
    }),
  );
  collected[folder] = entries.sort((a, b) => a.file.localeCompare(b.file, 'en'));
  console.log(`${folder}: ${entries.length} pinned source files`);
}
const license = await download('LICENSE');
writeFileSync(resolve(cache, 'source-data.json'), JSON.stringify({ commit, collected }));
writeFileSync(resolve(cache, 'LICENSE'), license);
console.log(`Source data cached at ${resolve(cache, 'source-data.json')}`);
