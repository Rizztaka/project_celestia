// Run the existing verifier on a new guarded target without changing recovery's inventory policy.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import {
  acquireLease,
  assertClosedPort,
  assertExclusiveFixture,
  assertProcess,
  assertQuiescent,
  binary,
  cleanResources,
  connectTarget,
  createResources,
  inspectFixture,
  planTargets,
  privateDirectory,
  privateWrite,
} from './recovery/fixture.mjs';
import { isolatedEnvironment, requireSafe, safeFailure } from './recovery/policy.mjs';
import { packageRun, repoRoot, run } from './recovery/process.mjs';
import { apiRoot, discoverTests, runVerification } from './verification.mjs';

const base = isolatedEnvironment(process.env);
requireSafe(
  process.argv.slice(2).every((arg) => arg === '--focused') && process.argv.length <= 3,
  'UNSUPPORTED_VERIFICATION_ARGUMENT',
);
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'docs/plans/contextual-guide-knowledge/k1-fixture.json'), 'utf8'),
);
inspectFixture(fixture, base);
await assertClosedPort(fixture.port);
const targets = planTargets(fixture, base, randomBytes(8).toString('hex'));
const target = targets.verify;
const { root } = privateDirectory(base);
const record = { root, startedAt: new Date().toISOString() };
const owned = new Set();
let release,
  admin,
  pid,
  started = false;
console.log(`K2 verification wrapper evidence: ${root}`);
try {
  release = acquireLease(fixture, 'k2-verification');
  started = true;
  run(
    binary(fixture, 'pg_ctl'),
    [
      'start',
      '-D',
      fixture.dataDir,
      '-l',
      join(root, 'postgres.log'),
      '-o',
      `-h 127.0.0.1 -p ${fixture.port}`,
      '-w',
    ],
    base,
    { backgroundLauncher: true, timeout: 30000 },
  );
  pid = assertProcess(fixture, base);
  admin = await connectTarget(targets.admin, fixture, base);
  const identity = (
    await admin.query(
      "SELECT current_setting('data_directory') AS path, system_identifier::text AS system FROM pg_control_system()",
    )
  ).rows[0];
  requireSafe(
    resolve(identity.path).toLowerCase() === resolve(fixture.dataDir).toLowerCase() &&
      identity.system === fixture.systemIdentifier,
    'SERVER_IDENTITY_MISMATCH',
  );
  requireSafe(
    (await admin.query('SELECT pg_try_advisory_lock(5305001) AS locked')).rows[0].locked,
    'FIXTURE_LEASE_UNAVAILABLE',
  );
  await assertExclusiveFixture(admin);
  await createResources(admin, target, fixture, root, owned);
  if (process.argv.includes('--focused')) {
    packageRun('prisma', 'prisma', ['migrate', 'deploy'], target.env);
    packageRun(
      'typescript',
      'tsc',
      ['-p', join(repoRoot, 'packages/api-contracts/tsconfig.json')],
      target.env,
    );
    const required = {
      'src/games/genshin/intelligence/guide-knowledge/guide-knowledge.test.ts': 41,
      'src/games/genshin/intelligence/guide-knowledge/guide-knowledge.integration.test.ts': 16,
      'tooling/guide-knowledge-client.test.js': 4,
      'src/games/genshin/intelligence/guide-knowledge/contextual.test.ts': 71,
      'src/games/genshin/intelligence/guide-knowledge/contextual.integration.test.ts': 48,
      'tooling/contextual-pack.test.js': 20,
      'tooling/contextual-client.test.js': 19,
      'tooling/contextual-release.test.js': 31,
      'tooling/contextual-git-roundtrip.test.js': 6,
    };
    const expected = discoverTests().filter(
      (path) =>
        path.includes('/guide-knowledge/') ||
        path === 'tooling/guide-knowledge-client.test.js' ||
        path === 'tooling/contextual-client.test.js' ||
        path === 'tooling/contextual-pack.test.js' ||
        path === 'tooling/contextual-git-roundtrip.test.js' ||
        path === 'tooling/contextual-release.test.js',
    );
    const requiredCases = [
      'keeps team/current ascension coherent while atomic owned updates commit concurrently',
      'uses a single owned SELECT snapshot for all members and never writes hypothetical context',
      'keeps partial assignments as lower/upper bounds, with distinct trigger and unit evidence',
      'cancels outstanding queries and refuses delayed responses across account switches',
      'refuses a session change during asynchronous snapshot hashing',
      'rejects a bad content hash and retains the last valid file on candidate/source failure',
      'retains lower/upper bounds for missing, unrecorded and inconsistent slots',
      ...['MarechausseeHunter', 'GoldenTroupe', 'ViridescentVenerer'].flatMap((setKey) =>
        ['0', '1', '2', '3', '4', '5', 'unknown'].flatMap((count) => [
          `keeps unspecified hypothetical slots bounded for ${setKey}=${count} with complete traces and no mutation`,
          `preserves unspecified slots through the owned API for ${setKey}=${count} without writes`,
        ]),
      ),
      'keeps rejected observation cards hidden through pending, transport, focus and reconnect retries',
      'keeps mismatch disposition across changed/reset assumptions and recovers with coherent parent records',
      'recovers only freshly aligned scenarios within a rejected observation',
      'does not let a pre-mismatch in-flight validation reopen rejected guidance',
      'retains valid panel data on ordinary failures and isolates mismatch disposition on account switch',
      'retains deterministic no-op reports and all inherited review dates',
      'reports exact changed source claims and never redates unrelated reviews',
      'distinguishes timeout, removal, malformed bytes, parser drift and section loss',
      'invalidates decisions after candidate bytes, claim conditions or base change',
      'rejects concurrent writers and stale expected bases without losing the selected release',
      'atomically activates and rolls back exact bytes while a running snapshot stays coherent',
      'rolls back to an intact earlier release even when the selected current payload is corrupt',
      'rejects rollback through an unverified current descriptor and preserves the pointer',
      'preserves exact approved release and pinned builder inputs with core.autocrlf=true',
      'preserves exact approved release and pinned builder inputs with core.autocrlf=false',
      ...[true, false].flatMap((mode) =>
        ['lf', 'crlf'].map(
          (origin) =>
            `preserves pinned knowledge with autocrlf=${mode} and ${origin}-origin ordinary source`,
        ),
      ),
      'quarantines a metadata/advice release race and bounds automatic metadata recovery',
      'partitions activation and exact rollback into fresh epochs and rejects delayed earlier advice',
      'preserves rejected records through release refresh, release switch, failure and scenario reset',
      'authenticates loaded release metadata and keeps its GET SELECT-only without account initialization',
    ];
    requireSafe(
      Object.keys(required).every((path) => expected.includes(path)),
      'FOCUSED_DISCOVERY_MISSING_REQUIRED_FILE',
    );
    const report = join(root, 'k2-focused-vitest.json');
    console.log(
      packageRun(
        'vitest',
        'vitest',
        ['run', '--no-file-parallelism', '--reporter=json', `--outputFile=${report}`, ...expected],
        target.env,
      ),
    );
    const tests = JSON.parse(readFileSync(report, 'utf8'));
    const cases = new Set(
      tests.testResults.flatMap((result) => result.assertionResults.map((test) => test.title)),
    );
    requireSafe(
      requiredCases.every((name) => cases.has(name)),
      'FOCUSED_REQUIRED_CASE_MISSING',
    );
    const files = new Map();
    for (const result of tests.testResults) {
      const name = relative(apiRoot, result.name).replaceAll('\\', '/');
      requireSafe(
        !files.has(name) &&
          result.status === 'passed' &&
          result.assertionResults?.length > 0 &&
          result.assertionResults.every((test) => test.status === 'passed'),
        'FOCUSED_FILE_INCOMPLETE',
      );
      files.set(name, result.assertionResults.length);
    }
    const passed = [...files.values()].reduce((a, b) => a + b, 0);
    requireSafe(
      tests.success &&
        tests.numFailedTests === 0 &&
        tests.numPendingTests === 0 &&
        tests.numTodoTests === 0 &&
        tests.numPassedTests === passed &&
        tests.numTotalTests === passed &&
        files.size === expected.length &&
        expected.every((path) => files.has(path)) &&
        Object.entries(required).every(([path, minimum]) => (files.get(path) ?? 0) >= minimum),
      'FOCUSED_REPORT_INCOMPLETE',
    );
    record.focused = {
      passed,
      files: files.size,
      failed: 0,
      skipped: 0,
      required,
      requiredCases,
      discovered: Object.fromEntries(files),
      postgresCases: [...files]
        .filter(([path]) => path.endsWith('.integration.test.ts'))
        .reduce((sum, [, count]) => sum + count, 0),
      report,
    };
  } else record.verification = await runVerification(target.env);
} catch (error) {
  record.failure = safeFailure(error);
  process.exitCode = 1;
} finally {
  try {
    if (admin) {
      await assertExclusiveFixture(admin);
      await assertQuiescent(admin, [target]);
      await cleanResources(admin, [target], root, owned, fixture);
      await admin.end();
      record.resourcesRemoved = true;
    }
    if (!pid && started && existsSync(join(fixture.dataDir, 'postmaster.pid')))
      pid = assertProcess(fixture, base);
    if (pid) {
      requireSafe(assertProcess(fixture, base) === pid, 'CLEANUP_PROCESS_CHANGED');
      run(binary(fixture, 'pg_ctl'), ['stop', '-D', fixture.dataDir, '-m', 'fast', '-w'], base);
    }
    await assertClosedPort(fixture.port);
    release?.();
    record.stoppedOwnedProcess = true;
  } catch (error) {
    record.cleanupFailure = safeFailure(error);
    process.exitCode = 1;
  }
  record.finishedAt = new Date().toISOString();
  privateWrite(root, 'k2-verification-result.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
}
