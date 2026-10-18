// Historical one-run reconciliation for C5g F5UFOp only. Not a reusable cleanup command.
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  assertClosedPort,
  assertExclusiveFixture,
  assertProcess,
  assertQuiescent,
  binary,
  cleanResources,
  connectTarget,
  planTargets,
} from '../../../apps/api/tooling/recovery/fixture.mjs';
import {
  containedPath,
  isolatedEnvironment,
  requireSafe,
} from '../../../apps/api/tooling/recovery/policy.mjs';
import { run } from '../../../apps/api/tooling/recovery/process.mjs';

const base = isolatedEnvironment(process.env);
const fixture = JSON.parse(
  readFileSync(new URL('../c5c-request-safety/review-fixture.json', import.meta.url)),
);
const root = 'C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-F5UFOp';
const id = 'f507cef30d100e0c';
const lease = join(fixture.dataDir, 'celestia-recovery.lock');
requireSafe(readFileSync(lease, 'utf8') === id, 'INTERRUPTED_LEASE_MISMATCH');
for (const port of [55448, 45448, 45449]) await assertClosedPort(port);
const prior = readFileSync(join(fixture.dataDir, 'postmaster.pid'), 'utf8').split(/\r?\n/);
requireSafe(
  prior[0] === '32040' &&
    resolve(prior[1]).toLowerCase() === resolve(fixture.dataDir).toLowerCase() &&
    prior[2] === '1792154967' &&
    prior[3] === '55448' &&
    prior[5] === '127.0.0.1',
  'INTERRUPTED_PROCESS_RECORD_MISMATCH',
);
for (const pid of [32040, 37000, 37144]) {
  let absent = false;
  try {
    process.kill(pid, 0);
  } catch (error) {
    if (error.code === 'ESRCH') absent = true;
    else throw error;
  }
  requireSafe(absent, 'PRIOR_PROCESS_STILL_EXISTS');
}
const owner = run(
  'powershell.exe',
  [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    '(Get-Acl -LiteralPath $env:CELESTIA_FIXTURE_PATH).Owner',
  ],
  { ...base, CELESTIA_FIXTURE_PATH: fixture.dataDir },
)
  .trim()
  .toLowerCase();
requireSafe(
  owner === fixture.osOwner.toLowerCase() &&
    owner === run('whoami.exe', [], base).trim().toLowerCase(),
  'FIXTURE_OWNER_MISMATCH',
);
const control = run(binary(fixture, 'pg_controldata'), ['-D', fixture.dataDir], base);
requireSafe(
  /Database system identifier:\s+(\d+)/.exec(control)?.[1] === fixture.systemIdentifier,
  'CONTROL_IDENTITY_MISMATCH',
);
const targets = planTargets(fixture, base, id);
const target = targets.source;
target.directory = containedPath(root, join(root, target.database));
const versionDirs = readdirSync(target.directory).filter((name) => name.startsWith('PG_18_'));
requireSafe(versionDirs.length === 1, 'TABLESPACE_VERSION_AMBIGUOUS');
const oidDirs = readdirSync(join(target.directory, versionDirs[0])).filter((name) =>
  /^\d+$/.test(name),
);
requireSafe(oidDirs.length === 1, 'TABLESPACE_DATABASE_AMBIGUOUS');
target.oid = Number(oidDirs[0]);
// Ordinary WAL recovery of this exact interrupted synthetic cluster. No PID-file
// deletion, catalog repair, force drop, guard edit or recursive filesystem removal.
run(
  binary(fixture, 'pg_ctl'),
  [
    'start',
    '-D',
    fixture.dataDir,
    '-l',
    join(root, 'c5g-resume-postgresql.log'),
    '-o',
    `-h 127.0.0.1 -p ${fixture.port}`,
    '-w',
  ],
  base,
  { backgroundLauncher: true, timeout: 30000 },
);
const pid = assertProcess(fixture, base);
let admin;
let remaining;
try {
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
  await assertQuiescent(admin, [target]);
  target.databaseCreated = target.tablespaceCreated = target.roleCreated = true;
  await cleanResources(admin, [target], root, new Set([target]), fixture);
  remaining = (
    await admin.query(
      'SELECT 1 FROM pg_database WHERE datname=$1 UNION ALL SELECT 1 FROM pg_roles WHERE rolname=$1 UNION ALL SELECT 1 FROM pg_tablespace WHERE spcname=$1',
      [target.database],
    )
  ).rowCount;
  requireSafe(remaining === 0, 'OWNED_RESOURCE_REMAINS');
} finally {
  await admin?.end();
  requireSafe(assertProcess(fixture, base) === pid, 'CLEANUP_PROCESS_CHANGED');
  run(binary(fixture, 'pg_ctl'), ['stop', '-D', fixture.dataDir, '-m', 'fast', '-w'], base);
  await assertClosedPort(fixture.port);
}
requireSafe(readFileSync(lease, 'utf8') === id, 'LEASE_CHANGED');
unlinkSync(lease);
const result = {
  checkedAt: new Date().toISOString(),
  interruptedRun: root,
  id,
  priorProcessIdsAbsent: [32040, 37000, 37144],
  systemIdentifier: fixture.systemIdentifier,
  database: target.database,
  oid: target.oid,
  resourcesRemaining: remaining,
  resourcesRemoved: true,
  stoppedOwnedProcess: true,
  leaseRemoved: true,
  ordinaryWebBuildRestored: false,
  note: 'Normal web output will be restored by the subsequent guarded browser/full verification run.',
};
writeFileSync(
  new URL('./interrupted-cleanup.json', import.meta.url),
  JSON.stringify(result, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(result));
