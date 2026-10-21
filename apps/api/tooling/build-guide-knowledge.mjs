import { randomUUID } from 'node:crypto';
import { readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validatePack } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
export function retainedSources() {
  const base = resolve(root, 'docs/plans/contextual-guide-knowledge/evidence');
  return {
    'genshin-db-harbinger': readFileSync(
      resolve(base, 'theBowja--genshin-db/src/data/English/weapons/harbingerofdawn.json'),
    ),
    'optimizer-harbinger': readFileSync(
      resolve(
        base,
        'frzyc--genshin-optimizer/libs/gi/sheets/src/Weapons/Sword/HarbingerOfDawn/index.tsx',
      ),
    ),
  };
}
export function writeValidatedPack(candidate, destination, bytes = retainedSources()) {
  // Fully validate before opening an output; failure retains the last valid pack.
  const pack = validatePack(candidate, bytes);
  const temporary = `${destination}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temporary, JSON.stringify(pack, null, 2) + '\n', { flag: 'wx' });
    renameSync(temporary, destination);
  } finally {
    try {
      unlinkSync(temporary);
    } catch {
      /* rename already consumed it */
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [candidate, destination] = process.argv.slice(2);
  if (!candidate || !destination)
    throw new Error('Usage: tsx tooling/build-guide-knowledge.mjs candidate.json destination.json');
  writeValidatedPack(JSON.parse(readFileSync(candidate, 'utf8')), destination);
  console.log('Validated local K1 pack written. No upstream code executed.');
}
