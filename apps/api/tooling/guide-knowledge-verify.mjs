// Run the existing verifier on a new guarded target without changing recovery's inventory policy.
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

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
import { runVerification } from './verification.mjs';

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
console.log(`K1 verification wrapper evidence: ${root}`);
try {
  release = acquireLease(fixture, 'k1-verification');
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
    const report = join(root, 'k1-focused-vitest.json');
    console.log(
      packageRun(
        'vitest',
        'vitest',
        [
          'run',
          '--no-file-parallelism',
          '--reporter=json',
          `--outputFile=${report}`,
          'src/games/genshin/intelligence/guide-knowledge',
          'tooling/guide-knowledge-client.test.js',
        ],
        target.env,
      ),
    );
    const tests = JSON.parse(readFileSync(report, 'utf8'));
    requireSafe(
      tests.success &&
        tests.numPassedTests === 61 &&
        tests.numFailedTests === 0 &&
        tests.numPendingTests === 0,
      'FOCUSED_REPORT_INCOMPLETE',
    );
    record.focused = {
      passed: tests.numPassedTests,
      files: tests.testResults.length,
      failed: tests.numFailedTests,
      skipped: tests.numPendingTests,
      postgresCases: 16,
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
  privateWrite(root, 'k1-verification-result.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
}
