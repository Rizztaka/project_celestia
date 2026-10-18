// Fetch inert data only. Resolve every folder from one pinned commit, never independent trees.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cache = process.argv[2];
const commit = process.argv[3] ?? '49a6544a6c6ae36089cb42fa591fc46f01de8bcf';
if (!cache) throw new Error('Supply an explicit source-cache directory.');
if (!/^[a-f0-9]{40}$/.test(commit)) throw new Error('Supply a full pinned commit SHA.');
const revisionCache = resolve(cache, commit);
mkdirSync(revisionCache, { recursive: true });
const sha = (text) => createHash('sha256').update(text).digest('hex');
const gitBlob = (bytes) =>
  createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
async function request(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Source retrieval failed: ${url} (${response.status})`);
  return response;
}
async function tree(ref) {
  const path = resolve(revisionCache, `tree-${ref}.json`);
  const listing = existsSync(path)
    ? JSON.parse(readFileSync(path, 'utf8'))
    : await (
        await request(`https://api.github.com/repos/theBowja/genshin-db/git/trees/${ref}`)
      ).json();
  if (listing.truncated || !Array.isArray(listing.tree))
    throw new Error('Incomplete source index.');
  const bytes = Buffer.concat(
    listing.tree.map((entry) =>
      Buffer.concat([
        Buffer.from(`${entry.mode.replace(/^0/, '')} ${entry.path}\0`),
        Buffer.from(entry.sha, 'hex'),
      ]),
    ),
  );
  const actual = createHash('sha1').update(`tree ${bytes.length}\0`).update(bytes).digest('hex');
  if (actual !== listing.sha || actual !== ref)
    throw new Error(`Source tree integrity mismatch: ${ref}`);
  writeFileSync(path, JSON.stringify(listing));
  return listing.tree;
}
async function download(path, expectedBlob) {
  const destination = resolve(revisionCache, path.replaceAll('/', '__'));
  const bytes = existsSync(destination)
    ? readFileSync(destination)
    : Buffer.from(
        await (
          await request(`https://raw.githubusercontent.com/theBowja/genshin-db/${commit}/${path}`)
        ).arrayBuffer(),
      );
  if (gitBlob(bytes) !== expectedBlob) throw new Error(`Source blob integrity mismatch: ${path}`);
  writeFileSync(destination, bytes);
  return bytes.toString('utf8');
}
const revision = await (
  await request(`https://api.github.com/repos/theBowja/genshin-db/git/commits/${commit}`)
).json();
if (revision.sha !== commit) throw new Error('Source revision mismatch.');
let entries = await tree(revision.tree.sha);
const rootEntries = entries;
for (const folder of ['src', 'data', 'English']) {
  const entry = entries.find((entry) => entry.type === 'tree' && entry.path === folder);
  if (!entry) throw new Error(`Missing source folder ${folder}`);
  entries = await tree(entry.sha);
}
const collected = {};
for (const folder of [
  'characters',
  'talents',
  'weapons',
  'materials',
  'domains',
  'enemies',
  'artifacts',
  'crafts',
]) {
  const folderEntry = entries.find((entry) => entry.path === folder && entry.type === 'tree');
  if (!folderEntry) throw new Error(`Missing source folder ${folder}`);
  const paths = (await tree(folderEntry.sha)).filter(
    (entry) => entry.type === 'blob' && entry.path.endsWith('.json'),
  );
  const records = [];
  let cursor = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (cursor < paths.length) {
        const entry = paths[cursor++];
        const sourcePath = `src/data/English/${folder}/${entry.path}`;
        const text = await download(sourcePath, entry.sha);
        records.push({
          file: entry.path,
          sourcePath,
          sourceHash: sha(text),
          data: JSON.parse(text),
        });
      }
    }),
  );
  collected[folder] = records.sort((a, b) => a.file.localeCompare(b.file, 'en'));
  console.log(`${folder}: ${records.length} verified source files`);
}
const licenseEntry = rootEntries.find((entry) => entry.path === 'LICENSE');
const license = await download('LICENSE', licenseEntry.sha);
writeFileSync(resolve(cache, 'source-data.json'), JSON.stringify({ commit, collected }));
writeFileSync(resolve(cache, 'LICENSE'), license);
console.log(`Source data cached at ${resolve(cache, 'source-data.json')}`);
