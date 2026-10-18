// One-run reconciliation, not a general cleanup command. Never force-drop or repair catalogs.
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
import { isolatedEnvironment, requireSafe } from '../../../apps/api/tooling/recovery/policy.mjs';
import { run } from '../../../apps/api/tooling/recovery/process.mjs';

const base = isolatedEnvironment(process.env);
const fixture = JSON.parse(
  readFileSync(new URL('../c5c-request-safety/review-fixture.json', import.meta.url)),
);
const root = 'C:/Users/inuzu/AppData/Local/Temp/celestia-recovery-Y4qSIJ';
const id = '7bfbf079533db907';
const lease = join(fixture.dataDir, 'celestia-recovery.lock');
requireSafe(readFileSync(lease, 'utf8') === id, 'INTERRUPTED_LEASE_MISMATCH');
for (const port of [55448, 45448, 45449]) await assertClosedPort(port);
const oldPid = Number(
  readFileSync(join(fixture.dataDir, 'postmaster.pid'), 'utf8').split(/\r?\n/)[0],
);
let alive = true;
try {
  process.kill(oldPid, 0);
} catch (error) {
  if (error.code === 'ESRCH') alive = false;
  else throw error;
}
requireSafe(!alive, 'OLD_PROCESS_STILL_EXISTS');
const control = run(binary(fixture, 'pg_controldata'), ['-D', fixture.dataDir], base);
requireSafe(control.includes(fixture.systemIdentifier), 'CONTROL_IDENTITY_MISMATCH');
// The exact interrupted synthetic server may perform ordinary WAL crash recovery.
// Do not delete its PID file or change its data/guards.
run(
  binary(fixture, 'pg_ctl'),
  [
    'start',
    '-D',
    fixture.dataDir,
    '-l',
    join(root, 'resume-postgresql.log'),
    '-o',
    `-h 127.0.0.1 -p ${fixture.port}`,
    '-w',
  ],
  base,
  { backgroundLauncher: true, timeout: 30000 },
);
const pid = assertProcess(fixture, base);
const targets = planTargets(fixture, base, id);
const target = targets.source;
const admin = await connectTarget(targets.admin, fixture, base);
try {
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
  await assertExclusiveFixture(admin);
  await assertQuiescent(admin, [target]);
  target.directory = join(root, target.database);
  const versionDirs = readdirSync(target.directory).filter((name) => name.startsWith('PG_18_'));
  requireSafe(versionDirs.length === 1, 'TABLESPACE_VERSION_AMBIGUOUS');
  const oidDirs = readdirSync(join(target.directory, versionDirs[0])).filter((name) =>
    /^\d+$/.test(name),
  );
  requireSafe(oidDirs.length === 1, 'TABLESPACE_DATABASE_AMBIGUOUS');
  target.oid = Number(oidDirs[0]);
  target.databaseCreated = target.tablespaceCreated = target.roleCreated = true;
  const owned = new Set([target]);
  await cleanResources(admin, [target], root, owned, fixture);
} finally {
  await admin.end();
  requireSafe(assertProcess(fixture, base) === pid, 'CLEANUP_PROCESS_CHANGED');
  run(binary(fixture, 'pg_ctl'), ['stop', '-D', fixture.dataDir, '-m', 'fast', '-w'], base);
  await assertClosedPort(fixture.port);
}
requireSafe(readFileSync(lease, 'utf8') === id, 'LEASE_CHANGED');
unlinkSync(lease);
const result = {
  interruptedRun: root,
  id,
  priorProcessAbsent: true,
  systemIdentifier: fixture.systemIdentifier,
  resourcesRemoved: true,
  stoppedOwnedProcess: true,
  leaseRemoved: true,
  ordinaryWebBuildRestored: false,
};
writeFileSync(
  new URL('./interrupted-cleanup.json', import.meta.url),
  JSON.stringify(result, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(result));
