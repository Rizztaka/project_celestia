// Local metadata-only evidence writer. Never reads dotenv, raw archives or export rows.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = fileURLToPath(new URL('.', import.meta.url));
const root = resolve(directory, '../../..');
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase();
const save = (name, data) => {
  const path = join(directory, name);
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n');
  execFileSync(
    process.execPath,
    [join(root, 'node_modules/prettier/bin/prettier.cjs'), '--write', path],
    { cwd: root, stdio: 'pipe' },
  );
};
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
const starting = read(join(directory, 'starting-state.json'));
const expectedChanges = {
  'apps/api/src/app.ts':
    'Compose account-data routes before ordinary parser with game-owned mappings.',
  'apps/api/src/core/middleware/auth.middleware.ts':
    'Preserve JWT validation; add fail-closed uncached subject existence.',
  'apps/api/src/core/middleware/auth.middleware.test.ts':
    'Preserve JWT cases; add missing/failing subject assertions.',
  'apps/api/src/core/middleware/origin.middleware.test.ts':
    'Supply self identity lookup while retaining foreign-origin/no-domain-work assertions.',
  'apps/api/src/core/middleware/request-admission.ts':
    'Account-data budget and response/work lifecycle; import subject check after admission.',
  'apps/api/src/core/middleware/request-safety.http.test.ts':
    'Supply authenticated existing subject to inherited parser/admission tests.',
  'apps/api/src/games/genshin/characters/character-equipment.integration.test.ts':
    'Two additional id-only SELECTs; retain two original domain reads and read-only state assertions.',
  'apps/api/src/games/genshin/importer/importer.http.test.ts':
    'Supply authenticated existing subject to preserved import tests.',
  'apps/api/src/games/genshin/importer/importer.routes.ts':
    'Verify JWT first; existing subject lookup follows import admission.',
  'apps/api/src/platform/auth/auth.repository.ts': 'Minimal id-only subject existence read.',
  'apps/api/src/platform/companion/catalog-advice.integration.test.ts':
    'One additional id-only SELECT; preserve two domain queries and SELECT-only checks.',
  'apps/api/src/platform/companion/routine.http.test.ts':
    'Supply authenticated existing subject to preserved routine tests.',
  'apps/api/src/platform/security.http.test.ts':
    'Retain all 22 cases; require exact self-only identity lookup without target domain access.',
  'apps/web/src/pages/LoginPage.tsx': 'Accurate confirmed deletion result.',
  'apps/web/src/pages/ProfilePage.tsx': 'Add account-data controls to existing Settings.',
  'packages/api-contracts/src/index.ts': 'Export additive V1 account-data contracts.',
  'docs/plans/CURRENT_HANDOFF.md': 'Prepend dated C5d checkpoint; preserve historical checkpoints.',
  'docs/ROADMAP.md': 'Prepend dated C5d checkpoint; preserve historical checkpoints.',
};
const compared = starting.files.map(({ path, sha256 }) => {
  const current = existsSync(join(root, path)) ? hash(join(root, path)) : null;
  return {
    path,
    beforeSha256: sha256,
    afterSha256: current,
    unchanged: current === sha256,
    reason: current === sha256 ? undefined : expectedChanges[path],
  };
});
const changed = compared.filter((entry) => !entry.unchanged);
if (changed.some((entry) => !entry.reason || !entry.afterSha256))
  throw new Error('Unexpected baseline change or missing file.');
const protectedEntries = read(
  join(root, 'docs/plans/c5a-beta-foundation/preservation-check.json'),
).preserved;
const raw = read(join(root, 'apps/api/tooling/raw-evidence.json')).files;
const preserved = [
  ...protectedEntries.map(({ group, path, sha256 }) => ({ group, path, sha256 })),
  ...Object.entries(raw).map(([path, sha256]) => ({ group: 'immutableRawEvidence', path, sha256 })),
].map((entry) => ({ ...entry, unchanged: hash(join(root, entry.path)) === entry.sha256 }));
if (preserved.length !== 33 || preserved.some((entry) => !entry.unchanged))
  throw new Error('Protected evidence mismatch.');
const head = git('rev-parse', 'HEAD'),
  branch = git('branch', '--show-current'),
  index = git('diff', '--cached', '--name-only');
if (head !== starting.head || branch !== starting.branch || index)
  throw new Error('Checkout/index changed.');
const browserRoot = 'C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-4VpGWI';
const browser = read(join(browserRoot, 'c5d-browser-result.json'));
save('browser-results.json', browser);
const attemptRoots = [
  'C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-Lex4RR',
  'C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-bYL7gx',
  ...process.argv.slice(2, 3),
];
save(
  'verification-attempts.json',
  attemptRoots.map((path, i) => {
    const value = read(join(path, 'result.json'));
    return {
      attempt: i + 1,
      privateRoot: path,
      result: value.result,
      startedAt: value.startedAt,
      finishedAt: value.finishedAt,
      stages: value.stages,
      failure: value.failure,
      cleanup: value.cleanup,
      restoreExact: value.coverage?.sha256 === value.restored?.sha256,
      migrations: value.migrations,
      application: value.application,
      explanation:
        i === 0
          ? '1001/1003 tests passed; two legacy SELECT counts needed explicit new subject lookup assertions.'
          : i === 1
            ? '1003/1003 tests passed; wrapper reported a downstream verification failure without child diagnostics. Reproduction found a format error on the new client test; package lint/types passed. Corrected that file.'
            : 'Final unchanged recovery and complete verification.',
    };
  }),
);
if (process.argv[3]) {
  const verification = read(join(process.argv[3], 'verification.json'));
  save('validation-results.json', {
    date: '2026-10-14',
    ...verification,
    actualPostgresCases: { historicalClassifier: 106, c5c: 7, c5d: 20, total: 133 },
    newCases: {
      accountHttp: 24,
      accountSchemaLimits: 3,
      accountClient: 5,
      accountPostgres: 20,
      authSubject: 2,
      total: 54,
    },
    substantialExport: browser.commands.find((entry) => entry.name === 'measure-substantial')
      .measurement,
  });
}
// Hash final formatted artifacts after they have all been written.
const allFiles = git('ls-files', '--cached', '--others', '--exclude-standard').split(/\r?\n/);
const inheritedPaths = new Set(starting.files.map(({ path }) => path));
const generatedManifests = new Set(['changed-files.json', 'preservation-check.json']);
const added = allFiles
  .filter((path) => !inheritedPaths.has(path) && !generatedManifests.has(path.split('/').at(-1)))
  .map((path) => ({ path, sha256: hash(join(root, path)) }));
save('changed-files.json', {
  date: '2026-10-14',
  comparison: 'C5d starting-state, not Git HEAD; inherited dirty work remains.',
  changed,
  added,
  selfReferentialExclusions: [...generatedManifests],
});
save('preservation-check.json', {
  date: '2026-10-14',
  head,
  branch,
  index: [],
  startingFiles: compared.length,
  unchangedFiles: compared.length - changed.length,
  intentionallyChangedFiles: changed.length,
  unexpected: 0,
  preserved,
  historicalEvidenceUnchanged: compared
    .filter((entry) => entry.path.startsWith('docs/plans/') && !expectedChanges[entry.path])
    .every((entry) => entry.unchanged),
  status: git('status', '--short').split(/\r?\n/),
});
console.log(
  JSON.stringify({
    startingFiles: compared.length,
    intentionallyChanged: changed.length,
    added: added.length,
    protectedUnchanged: preserved.length,
    indexEmpty: true,
  }),
);
