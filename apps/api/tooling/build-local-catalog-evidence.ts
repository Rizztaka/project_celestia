// Offline evidence for the owner's explicitly selected local data. No scraping or new game IDs.
import { readFileSync, writeFileSync } from 'node:fs';

import {
  catalogInput,
  GenshinCatalogTrust,
  stableFingerprint,
} from '../src/games/genshin/companion/catalog-trust.js';

const root = new URL('../src/games/genshin/static/', import.meta.url);
const read = (name: string) => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const manifest = read('catalog-evidence.json').filter(
  (claim: { materialReferences?: string }) => claim.materialReferences !== 'local_keys',
);
const trust = new GenshinCatalogTrust(catalogInput);
for (const [targetKey, raw] of Object.entries(
  catalogInput.characters as Record<
    string,
    {
      materials: Record<string, string>;
      talent: { bossWeekly: string };
    }
  >,
)) {
  if (!trust.hasTarget('CHARACTER_ASCENSION', targetKey)) continue;
  for (const goalType of ['CHARACTER_TALENT', 'CHARACTER_ASCENSION']) {
    const from = goalType === 'CHARACTER_TALENT' ? 1 : 0;
    const to = goalType === 'CHARACTER_TALENT' ? 10 : 6;
    const projection = trust.project(targetKey, goalType, from, to, 'local_keys');
    const fields =
      goalType === 'CHARACTER_TALENT'
        ? [
            'talent.book',
            'talent.costs[tier=2..10]',
            ...(projection.references.some((ref) => ref.key === raw.talent.bossWeekly)
              ? ['talent.bossWeekly']
              : []),
            ...['commonT1', 'commonT2', 'commonT3']
              .filter((field) =>
                projection.references.some((ref) => ref.key === raw.materials[field]),
              )
              .map((field) => `materials.${field}`),
            'material-references[consumed keys]',
          ]
        : [
            'ascension[phase=1..6]',
            ...['gem', 'boss', 'local', 'commonT1', 'commonT2', 'commonT3'].map(
              (field) => `materials.${field}`,
            ),
            'material-references[consumed keys]',
          ];
    manifest.push({
      targetKey,
      goalType,
      from,
      to,
      materialReferences: 'local_keys',
      fields,
      fingerprint: stableFingerprint(projection),
      sources: [
        {
          authority: 'owner',
          reference: 'Section 1 — Game Data & Multi-Server Engine implementation directive',
          localEvidence: 'apps/api/src/games/genshin/static/character-materials.json',
          verifier: 'Owner-selected local catalog; offline schema and range validation',
          reviewedOn: '2026-10-18',
          observedOn: null,
          gameVersion: null,
        },
      ],
      conflicts: [],
      routeFingerprint: null,
      routeSources: [],
    });
  }
}
writeFileSync(new URL('catalog-evidence.json', root), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Recorded ${manifest.length} cost claims; existing primary evidence retained.`);
