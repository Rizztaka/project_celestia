// Preserve exact historical bytes, then remove explicitly named AI-only files.
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const out = join(root, 'docs/plans/deterministic-build-insights/retired');
const source = 'apps/api/src/games/genshin/intelligence/character-knowledge/';
const paths = [
  'apps/api/src/core/ai/openrouter.ts',
  'apps/api/src/core/ai/advisor-provider.ts',
  'apps/api/src/core/ai/advisor-provider.test.ts',
  ...[
    'advisor.service.ts',
    'advisor.controller.ts',
    'advisor.context.ts',
    'advisor.validation.ts',
    'knowledge.retrieval.ts',
    'character-advisor.test.ts',
    'character-advisor.integration.test.ts',
    'batch01.test.ts',
    'all-kqm.test.ts',
    'knowledge.regressions.test.ts',
    'quality-repair.test.ts',
    'conversation-comparison.test.ts',
  ].map((n) => source + n),
  ...[
    'ai-advice.controller.ts',
    'ai-advice.routes.ts',
    'ai-advice.service.ts',
    'ai-advice.service.test.ts',
  ].map((n) => 'apps/api/src/games/genshin/intelligence/' + n),
  'apps/web/src/components/AskCelestia.tsx',
  'apps/web/src/lib/character-advisor.ts',
  'packages/api-contracts/src/genshin/character-advisor.ts',
  ...[
    'advisor-acceptance-dispatch.mjs',
    'advisor-acceptance-dispatch.test.js',
    'advisor-acceptance-ledger.mjs',
    'advisor-acceptance-ledger.test.js',
    'advisor-implementation-identity.mjs',
    'character-advisor-client.test.js',
    'character-advisor-browser.mjs',
    'character-advisor-browser-control.mjs',
    'grounded-repair.test.js',
    'run-advisor-acceptance.mjs',
    'evaluate-all-kqm.mjs',
    'evaluate-character-knowledge-batch.mjs',
    'verify-advisor-connection.mjs',
    'check-advisor-review-fix.mjs',
    'record-advisor-review-fix.mjs',
    'record-grounded-repair.mjs',
    'report-all-kqm.mjs',
  ].map((n) => 'apps/api/tooling/' + n),
];
const manifest = [];
for (const path of paths) {
  const target = resolve(root, path);
  if (!target.startsWith(root + sep)) throw Error('Outside workspace');
  if (!existsSync(target)) continue;
  if (!lstatSync(target).isFile() || lstatSync(target).isSymbolicLink())
    throw Error('Unsafe target');
  const bytes = readFileSync(target),
    archived = join(out, path + '.raw');
  mkdirSync(dirname(archived), { recursive: true });
  writeFileSync(archived, bytes, { flag: 'wx' });
  manifest.push({ path, sha256: createHash('sha256').update(bytes).digest('hex') });
  unlinkSync(target);
}
writeFileSync(
  join(dirname(out), 'retired-manifest.json'),
  JSON.stringify(
    {
      reason:
        'Owner removed generative AI entirely; historical evidence preserved, not runtime code.',
      files: manifest,
    },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify({ retired: manifest.length }));
