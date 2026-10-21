import { randomUUID } from 'node:crypto';
import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateContextualPack } from '../src/games/genshin/intelligence/guide-knowledge/contextual.pack.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
export function retainedContextualSources() {
  const folder = resolve(root, 'docs/plans/contextual-guide-knowledge');
  const inputs = JSON.parse(
    readFileSync(resolve(folder, 'k2-reviewed-source-inputs.json'), 'utf8'),
  );
  return Object.fromEntries(
    inputs.map((entry) => [entry.id, readFileSync(resolve(folder, entry.localPath))]),
  );
}
export function writeValidatedContextualPack(
  candidate,
  destination,
  bytes = retainedContextualSources(),
) {
  const pack = validateContextualPack(candidate, bytes);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(pack, null, 2) + '\n', { flag: 'wx' });
    renameSync(temporary, destination);
  } finally {
    try {
      unlinkSync(temporary);
    } catch {
      /* consumed by rename */
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [candidate, destination] = process.argv.slice(2);
  if (!candidate || !destination)
    throw new Error(
      'Usage: tsx tooling/build-contextual-knowledge.mjs reviewed-candidate.json destination.json',
    );
  writeValidatedContextualPack(JSON.parse(readFileSync(candidate, 'utf8')), destination);
  console.log('Validated K2 pack atomically written from local reviewed sources.');
}
