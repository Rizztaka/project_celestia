import { randomBytes } from 'node:crypto';
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

import {
  containedPath,
  ownedTarget,
  quote,
  RecoveryError,
  requireSafe,
  targetEnvironment,
  validatePair,
  validateTarget,
  validateTargetRecord,
  validateVersions,
} from './policy.mjs';
import { repoRoot, run } from './process.mjs';

const secret = () => randomBytes(32).toString('hex');
const suffix = process.platform === 'win32' ? '.exe' : '';
const ps = (script, env) =>
  run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], env).trim();
const normalize = (path) =>
  process.platform === 'win32' ? resolve(path).toLowerCase() : resolve(path);
export const binary = (fixture, name) => join(fixture.pgBin, name + suffix);

export function planTargets(fixture, base, id) {
  requireSafe(
    fixture.version === 1 &&
      fixture.syntheticOnly === true &&
      fixture.exclusive === true &&
      fixture.host === '127.0.0.1' &&
      Number.isInteger(fixture.port) &&
      fixture.port >= 1024 &&
      fixture.port <= 65535 &&
      /^celestia_test_[a-z0-9_]+$/.test(fixture.adminDatabase) &&
      /^celestia_test[a-z0-9_]*$/.test(fixture.adminRole) &&
      /^[a-f0-9]{16}$/.test(id),
    'OWNED_FIXTURE_DECLARATION_REQUIRED',
  );
  const make = (database, role) => {
    const target = { host: fixture.host, port: fixture.port, database, role, password: secret() };
    target.env = targetEnvironment(base, target);
    validateTarget(target.env);
    return target;
  };
  const admin = make(fixture.adminDatabase, fixture.adminRole);
  const targets = Object.fromEntries(
    ['source', 'restore', 'verify'].map((kind) => {
      const name = `celestia_test_${id}_${kind}`;
      return [kind, make(name, name)];
    }),
  );
  validatePair(targets.source.env, targets.restore.env);
  for (const target of Object.values(targets)) validatePair(admin.env, target.env);
  return { admin, ...targets };
}

export async function assertClosedPort(port) {
  await new Promise((resolveReady, reject) => {
    const server = createServer();
    server.once('error', () => reject(new RecoveryError('FIXTURE_PORT_OCCUPIED')));
    server.listen({ host: '127.0.0.1', port, exclusive: true }, () => server.close(resolveReady));
  });
}
export function inspectFixture(fixture, env) {
  for (const path of [fixture.dataDir, fixture.pgBin]) {
    requireSafe(
      typeof path === 'string' &&
        isAbsolute(path) &&
        !lstatSync(path).isSymbolicLink() &&
        normalize(realpathSync(path)) === normalize(path),
      'FIXTURE_PATH_INVALID',
    );
  }
  requireSafe(
    /^docs\/plans\/[a-z0-9/-]+\.md$/.test(fixture.provenance),
    'FIXTURE_PROVENANCE_REQUIRED',
  );
  const provenance = readFileSync(
    containedPath(repoRoot, join(repoRoot, fixture.provenance)),
    'utf8',
  )
    .replaceAll('\\', '/')
    .toLowerCase();
  requireSafe(
    provenance.includes(fixture.dataDir.replaceAll('\\', '/').toLowerCase()),
    'FIXTURE_PROVENANCE_MISMATCH',
  );
  let owner;
  if (process.platform === 'win32') {
    owner = ps('(Get-Acl -LiteralPath $env:CELESTIA_FIXTURE_PATH).Owner', {
      ...env,
      CELESTIA_FIXTURE_PATH: fixture.dataDir,
    });
    requireSafe(
      owner.toLowerCase() === run('whoami.exe', [], env).trim().toLowerCase(),
      'FIXTURE_NOT_CURRENT_OS_OWNER',
    );
  } else {
    owner = String(statSync(fixture.dataDir).uid);
    requireSafe(statSync(fixture.dataDir).uid === process.getuid(), 'FIXTURE_NOT_CURRENT_OS_OWNER');
  }
  requireSafe(
    owner.toLowerCase() === String(fixture.osOwner).toLowerCase(),
    'FIXTURE_OWNER_MISMATCH',
  );
  const versions = {};
  for (const name of ['pg_dump', 'pg_restore', 'postgres', 'pg_ctl']) {
    try {
      versions[name] = run(binary(fixture, name), ['--version'], env).trim();
    } catch {
      throw new RecoveryError('POSTGRES_TOOL_UNAVAILABLE');
    }
  }
  const major = validateVersions(versions);
  requireSafe(
    Number(readFileSync(join(fixture.dataDir, 'PG_VERSION'), 'utf8').trim()) === major,
    'DATA_TOOL_MAJOR_MISMATCH',
  );
  const control = run(binary(fixture, 'pg_controldata'), ['-D', fixture.dataDir], env);
  requireSafe(
    /Database system identifier:\s+(\d+)/.exec(control)?.[1] === fixture.systemIdentifier &&
      /Database cluster state:\s+shut down\s/.test(control),
    'FIXTURE_CONTROL_IDENTITY_OR_STATE_MISMATCH',
  );
  requireSafe(!existsSync(join(fixture.dataDir, 'postmaster.pid')), 'FIXTURE_ALREADY_RUNNING');
  const opts = readFileSync(join(fixture.dataDir, 'postmaster.opts'), 'utf8').replaceAll('\\', '/');
  requireSafe(
    opts.includes(fixture.dataDir.replaceAll('\\', '/')) &&
      opts.includes('127.0.0.1') &&
      opts.includes(String(fixture.port)),
    'FIXTURE_PRIOR_PROCESS_MISMATCH',
  );
  return { versions, owner, major, systemIdentifier: fixture.systemIdentifier };
}

export function privateDirectory(env, protect) {
  const parent = realpathSync(tmpdir());
  requireSafe(
    normalize(parent) !== normalize(repoRoot) &&
      !normalize(parent).startsWith(normalize(repoRoot) + '\\') &&
      !normalize(parent).startsWith(normalize(repoRoot) + '/'),
    'TEMP_DIRECTORY_INSIDE_REPOSITORY',
  );
  const root = mkdtempSync(join(parent, 'celestia-recovery-'));
  try {
    return { root, permissions: (protect ?? restrictDirectory)(root, env) };
  } catch (error) {
    // No file/database work precedes the permissions check. Remove only this
    // newly allocated, still-empty directory (never recursively).
    try {
      rmdirSync(root);
    } catch {
      const failure = new RecoveryError('PRIVATE_DIRECTORY_SETUP_FAILED_RETAINED');
      failure.ownedDirectoryRetained = root;
      throw failure;
    }
    throw error;
  }
}
function restrictDirectory(root, env) {
  let permissions;
  if (process.platform === 'win32') {
    const sid = ps('[System.Security.Principal.WindowsIdentity]::GetCurrent().User.Value', env);
    run('icacls.exe', [root, '/inheritance:r', '/grant:r', `*${sid}:(OI)(CI)F`], env);
    const acl = JSON.parse(
      ps(
        '$a = Get-Acl -LiteralPath $env:CELESTIA_PRIVATE_PATH; [pscustomobject]@{ protected=$a.AreAccessRulesProtected; sids=@($a.Access | ForEach-Object { $_.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value }) } | ConvertTo-Json -Compress',
        { ...env, CELESTIA_PRIVATE_PATH: root },
      ),
    );
    requireSafe(
      acl.protected && acl.sids.length > 0 && acl.sids.every((value) => value === sid),
      'PRIVATE_ACL_NOT_ESTABLISHED',
    );
    permissions = { mechanism: 'Windows protected ACL', currentUserOnly: true, verified: true };
  } else {
    requireSafe((statSync(root).mode & 0o777) === 0o700, 'PRIVATE_MODE_NOT_ESTABLISHED');
    permissions = { mechanism: 'POSIX 0700', currentUserOnly: true, verified: true };
  }
  return permissions;
}
export function privateWrite(root, name, bytes) {
  const path = containedPath(root, join(root, name), false);
  writeFileSync(path, bytes, { flag: 'wx', mode: 0o600 });
  return path;
}

export function assertProcess(fixture, env) {
  const lines = readFileSync(join(fixture.dataDir, 'postmaster.pid'), 'utf8').trim().split(/\r?\n/);
  const pid = Number(lines[0]);
  requireSafe(
    Number.isInteger(pid) &&
      pid > 0 &&
      normalize(lines[1]) === normalize(fixture.dataDir) &&
      Number(lines[3]) === fixture.port &&
      lines[5] === '127.0.0.1',
    'POSTMASTER_IDENTITY_MISMATCH',
  );
  if (process.platform === 'win32') {
    const processInfo = JSON.parse(
      ps(
        '$p=Get-CimInstance Win32_Process -Filter ("ProcessId=" + $env:CELESTIA_POSTMASTER_PID); $p | Select-Object ExecutablePath,CommandLine | ConvertTo-Json -Compress',
        { ...env, CELESTIA_POSTMASTER_PID: String(pid) },
      ),
    );
    requireSafe(
      processInfo &&
        typeof processInfo.ExecutablePath === 'string' &&
        typeof processInfo.CommandLine === 'string' &&
        normalize(processInfo.ExecutablePath) === normalize(binary(fixture, 'postgres')) &&
        processInfo.CommandLine.replaceAll('\\', '/').includes(
          fixture.dataDir.replaceAll('\\', '/'),
        ) &&
        processInfo.CommandLine.includes(String(fixture.port)),
      'OS_PROCESS_IDENTITY_MISMATCH',
    );
  } else {
    const command = run('ps', ['-p', String(pid), '-o', 'args='], env);
    requireSafe(
      command.includes(fixture.dataDir) && command.includes(String(fixture.port)),
      'OS_PROCESS_IDENTITY_MISMATCH',
    );
  }
  return pid;
}

export async function connectTarget(target, fixture, base) {
  validateTargetRecord(target);
  assertProcess(fixture, base);
  const { Client } = await import('pg');
  const client = new Client({
    host: target.host,
    port: target.port,
    database: target.database,
    user: target.role,
    password: target.password,
    ssl: false,
    connectionTimeoutMillis: 5000,
    application_name: 'celestia-recovery',
    options: '-c timezone=UTC -c datestyle=ISO,YMD -c extra_float_digits=3',
  });
  try {
    await client.connect();
    const {
      rows: [identity],
    } = await client.query(
      'SELECT current_database() AS db, current_user AS role, host(inet_server_addr()) AS host, inet_server_port() AS port, (SELECT oid::int FROM pg_database WHERE datname=current_database()) AS oid',
    );
    requireSafe(
      identity.db === target.database &&
        identity.role === target.role &&
        identity.host === target.host &&
        identity.port === target.port &&
        (!target.oid || identity.oid === target.oid),
      'DATABASE_IDENTITY_MISMATCH',
    );
    return client;
  } catch (error) {
    await client.end();
    throw error;
  }
}

export async function emptyDatabase(client) {
  // Include tables/views/sequences/types/functions/extensions/schemas, not just rows.
  const {
    rows: [row],
  } = await client.query(`SELECT
    (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema')::int AS relations,
    (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema')::int AS routines,
    (SELECT count(*) FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname !~ '^pg_' AND n.nspname <> 'information_schema')::int AS types,
    (SELECT count(*) FROM pg_namespace WHERE nspname !~ '^pg_' AND nspname NOT IN ('public','information_schema'))::int AS schemas,
    (SELECT count(*) FROM pg_extension WHERE extname <> 'plpgsql')::int AS extensions,
    (SELECT count(*) FROM pg_largeobject_metadata)::int AS largeobjects`);
  requireSafe(
    Object.values(row).every((count) => count === 0),
    'NONEMPTY_RESTORE_TARGET',
  );
}

export async function createResources(admin, target, fixture, root, owned) {
  validateTargetRecord(target);
  requireSafe(!owned.has(target), 'RESOURCE_ALREADY_REGISTERED');
  const conflict = await admin.query(
    'SELECT 1 FROM pg_database WHERE datname=$1 UNION ALL SELECT 1 FROM pg_roles WHERE rolname=$1 UNION ALL SELECT 1 FROM pg_tablespace WHERE spcname=$1',
    [target.database],
  );
  requireSafe(conflict.rowCount === 0, 'PREEXISTING_RESOURCE_REJECTED');
  const directory = containedPath(root, join(root, target.database), false);
  mkdirSync(directory, { mode: 0o700 });
  target.directory = directory;
  // All identifiers are generated internally; passwords are hex, never arguments/logs.
  requireSafe(/^[a-f0-9]{64}$/.test(target.password), 'GENERATED_SECRET_REQUIRED');
  await admin.query(
    `CREATE ROLE ${quote(target.role)} LOGIN PASSWORD '${target.password}' NOSUPERUSER NOCREATEDB NOCREATEROLE`,
  );
  target.roleCreated = true;
  await admin.query(
    `CREATE TABLESPACE ${quote(target.database)} OWNER ${quote(target.role)} LOCATION '${directory.replaceAll('\\', '/').replaceAll("'", "''")}'`,
  );
  target.tablespaceCreated = true;
  await admin.query(
    `CREATE DATABASE ${quote(target.database)} OWNER ${quote(target.role)} TEMPLATE template0 TABLESPACE ${quote(target.database)}`,
  );
  target.databaseCreated = true;
  const {
    rows: [identity],
  } = await admin.query('SELECT oid::int FROM pg_database WHERE datname=$1', [target.database]);
  target.oid = identity.oid;
  owned.add(target);
  await admin.query(`REVOKE CONNECT ON DATABASE ${quote(target.database)} FROM PUBLIC`);
  ownedTarget(target, fixture, owned);
}

export function acquireLease(fixture, id) {
  const path = join(fixture.dataDir, 'celestia-recovery.lock');
  let fd;
  try {
    fd = openSync(path, 'wx', 0o600);
  } catch {
    throw new RecoveryError('FIXTURE_LEASE_UNAVAILABLE');
  }
  writeFileSync(fd, id);
  closeSync(fd);
  return () => {
    requireSafe(readFileSync(path, 'utf8') === id, 'LEASE_OWNERSHIP_LOST');
    unlinkSync(path);
  };
}

export async function assertQuiescent(admin, targets) {
  const { rows } = await admin.query(
    'SELECT datname FROM pg_stat_activity WHERE datname = ANY($1::text[]) AND pid <> pg_backend_pid()',
    [targets.map((t) => t.database)],
  );
  requireSafe(rows.length === 0, 'UNEXPECTED_FIXTURE_SESSION');
}
export async function assertExclusiveFixture(admin) {
  const { rows } = await admin.query(
    "SELECT pid FROM pg_stat_activity WHERE backend_type='client backend' AND pid <> pg_backend_pid()",
  );
  requireSafe(rows.length === 0, 'UNEXPECTED_FIXTURE_CLIENT');
}

export async function cleanResources(admin, targets, root, owned, fixture) {
  for (const target of [...targets].reverse()) {
    containedPath(
      root,
      target.directory ?? join(root, target.database),
      !target.directory ? false : true,
    );
    if (target.databaseCreated) {
      ownedTarget(target, fixture, owned);
      const {
        rows: [row],
      } = await admin.query(
        'SELECT oid::int, pg_get_userbyid(datdba) AS owner FROM pg_database WHERE datname=$1',
        [target.database],
      );
      requireSafe(
        row?.oid === target.oid && row.owner === target.role,
        'CLEANUP_DATABASE_OWNERSHIP_CHANGED',
      );
      await admin.query(`DROP DATABASE ${quote(target.database)}`); // No FORCE: never kill unknown sessions.
      target.databaseCreated = false;
    }
    if (target.tablespaceCreated) {
      const {
        rows: [row],
      } = await admin.query(
        'SELECT pg_tablespace_location(oid) AS path, pg_get_userbyid(spcowner) AS owner FROM pg_tablespace WHERE spcname=$1',
        [target.database],
      );
      requireSafe(
        row && normalize(row.path) === normalize(target.directory) && row.owner === target.role,
        'CLEANUP_TABLESPACE_OWNERSHIP_CHANGED',
      );
      await admin.query(`DROP TABLESPACE ${quote(target.database)}`);
      target.tablespaceCreated = false;
    }
    if (target.roleCreated) {
      await admin.query(`DROP ROLE ${quote(target.role)}`);
      target.roleCreated = false;
    }
  }
}
