import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, statSync, unlinkSync } from 'node:fs';
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
  emptyDatabase,
  inspectFixture,
  planTargets,
  privateDirectory,
  privateWrite,
} from './fixture.mjs';
import {
  assertEqualSnapshots,
  containedPath,
  isolatedEnvironment,
  ownedTarget,
  quote,
  RecoveryError,
  requireSafe,
  safeFailure,
  sha256,
  validatePair,
  validateTarget,
} from './policy.mjs';
import { apiRoot, installedPnpm, packageRun, repoRoot, run, strictRun } from './process.mjs';
import { seed } from './seed.mjs';
import { migrationCompatibility, snapshot } from './snapshot.mjs';

export function parseArguments(args) {
  const options = { verify: false, fault: null };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--fixture' && !options.fixturePath && args[i + 1])
      options.fixturePath = resolve(args[++i]);
    else if (args[i] === '--verify' && !options.verify) options.verify = true;
    else if (
      args[i] === '--fault' &&
      !options.fault &&
      ['nonempty', 'truncated'].includes(args[i + 1])
    )
      options.fault = args[++i];
    else throw new RecoveryError('UNSUPPORTED_ARGUMENT_NO_EXTERNAL_TARGET_ARCHIVE_OR_OUTPUT');
  }
  requireSafe(
    !!options.fixturePath && !(options.verify && options.fault),
    'FIXTURE_ARGUMENT_REQUIRED_OR_CONFLICT',
  );
  return options;
}

const connectionArgs = (target) => [
  '--host',
  target.host,
  '--port',
  String(target.port),
  '--username',
  target.role,
  '--dbname',
  target.database,
  '--no-password',
];

export async function dumpOwnedArchive(context, dependencies = {}) {
  const { source, fixture, owned, root, base, passfile, archives } = context;
  ownedTarget(source, fixture, owned);
  const path = containedPath(root, join(root, 'application.dump'), false);
  requireSafe(!existsSync(path), 'ARCHIVE_ALREADY_EXISTS');
  await (dependencies.invoke ?? strictRun)(
    binary(fixture, 'pg_dump'),
    [
      '--format=custom',
      '--no-acl',
      '--no-tablespaces',
      '--lock-wait-timeout=5000',
      '--file',
      path,
      ...connectionArgs(source),
    ],
    { ...base, PGPASSFILE: passfile, PGCONNECT_TIMEOUT: '5', PGSSLMODE: 'disable' },
  );
  const descriptor = { path, sha256: sha256(readFileSync(path)), bytes: statSync(path).size };
  requireSafe(descriptor.bytes > 0, 'EMPTY_ARCHIVE');
  archives.add(descriptor);
  return descriptor;
}

export async function restoreOwnedArchive(context, target, archive, dependencies = {}) {
  const { fixture, source, root, owned, archives, base, passfile } = context;
  validatePair(source.env, target.env);
  ownedTarget(target, fixture, owned);
  requireSafe(archives.has(archive), 'ARCHIVE_NOT_PRODUCED_BY_RUN');
  containedPath(root, archive.path);
  requireSafe(sha256(readFileSync(archive.path)) === archive.sha256, 'ARCHIVE_CHANGED');
  const connect = dependencies.connect ?? (() => connectTarget(target, fixture, base));
  const client = await connect();
  try {
    await emptyDatabase(client);
  } finally {
    await client.end();
  }
  const invoke = dependencies.invoke ?? strictRun;
  await invoke(
    binary(fixture, 'pg_restore'),
    [
      '--single-transaction',
      '--exit-on-error',
      '--no-owner',
      '--no-acl',
      '--no-tablespaces',
      ...connectionArgs(target),
      archive.path,
    ],
    { ...base, PGPASSFILE: passfile, PGCONNECT_TIMEOUT: '5', PGSSLMODE: 'disable' },
  );
}

export async function recoveryRun(options, input, dependencies = {}) {
  // Configuration gates must run before prerequisite tools, fixture inspection or
  // dynamic database imports. No ambient .env or ordinary database fallback.
  const base = isolatedEnvironment(input);
  requireSafe(
    !options.output &&
      !options.archive &&
      !options.source &&
      !options.destination &&
      [null, undefined, 'nonempty', 'truncated'].includes(options.fault),
    'UNSUPPORTED_RECOVERY_INPUT',
  );
  const id = randomBytes(8).toString('hex');
  const fixture = options.fixture ?? JSON.parse(readFileSync(options.fixturePath, 'utf8'));
  const targets = planTargets(fixture, base, id);
  const inspect = dependencies.inspect ?? inspectFixture;
  const inspected = inspect(fixture, base);
  await (dependencies.closedPort ?? assertClosedPort)(fixture.port);
  const { root, permissions } = (dependencies.directory ?? privateDirectory)(base);
  const record = {
    version: 1,
    id,
    startedAt: new Date().toISOString(),
    platform: process.platform,
    node: process.version,
    fixture: {
      dataDir: fixture.dataDir,
      host: fixture.host,
      port: fixture.port,
      adminDatabase: fixture.adminDatabase,
      provenance: fixture.provenance,
      ...inspected,
    },
    permissions,
    fault: options.fault ?? null,
    stages: [],
    result: 'running',
  };
  const started = performance.now();
  let startAttempted = false;
  let stage = 'fixture-start',
    admin,
    release,
    startedServer = false,
    ownedPid,
    passfile,
    failure;
  const owned = new Set(),
    archives = new Set();
  const resources = [targets.source, targets.restore, ...(options.verify ? [targets.verify] : [])];
  const step = async (name, action) => {
    stage = name;
    const time = performance.now();
    console.log(`RECOVERY ${name}`);
    try {
      const value = await action();
      record.stages.push({
        stage: name,
        result: 'passed',
        elapsedMs: Math.round(performance.now() - time),
      });
      return value;
    } catch (error) {
      record.stages.push({
        stage: name,
        result: 'failed',
        elapsedMs: Math.round(performance.now() - time),
        ...safeFailure(error),
      });
      throw error;
    }
  };
  const withClient = async (target, callback) => {
    ownedTarget(target, fixture, owned);
    const client = await connectTarget(target, fixture, base);
    try {
      return await callback(client);
    } finally {
      await client.end();
    }
  };
  console.log(`Recovery evidence directory: ${root}`);
  try {
    await step('fixture-start', async () => {
      release = acquireLease(fixture, id);
      // The only started process is the stopped, provenance-verified fixture.
      startAttempted = true;
      run(
        binary(fixture, 'pg_ctl'),
        [
          'start',
          '-D',
          fixture.dataDir,
          '-l',
          join(root, 'postgresql.log'),
          '-o',
          `-h 127.0.0.1 -p ${fixture.port}`,
          '-w',
        ],
        base,
        { backgroundLauncher: true, timeout: 30000 },
      );
      startedServer = true;
      ownedPid = assertProcess(fixture, base);
      record.fixture.pid = ownedPid;
      admin = await connectTarget(targets.admin, fixture, base);
      const {
        rows: [identity],
      } = await admin.query(
        "SELECT current_setting('data_directory') AS path, current_setting('server_version') AS version, system_identifier::text AS system FROM pg_control_system()",
      );
      requireSafe(
        resolve(identity.path).toLowerCase() === resolve(fixture.dataDir).toLowerCase() &&
          identity.system === fixture.systemIdentifier &&
          Number(identity.version.split('.')[0]) === inspected.major,
        'SERVER_IDENTITY_MISMATCH',
      );
      record.fixture.serverVersion = identity.version;
      const {
        rows: [locked],
      } = await admin.query('SELECT pg_try_advisory_lock(5305001) AS locked');
      requireSafe(locked.locked, 'DATABASE_FIXTURE_LEASE_UNAVAILABLE');
    });
    await step('fresh-resources', async () => {
      await assertExclusiveFixture(admin);
      for (const target of resources) await createResources(admin, target, fixture, root, owned);
      passfile = privateWrite(
        root,
        'pgpass',
        resources
          .map((t) => `${t.host}:${t.port}:${t.database}:${t.role}:${t.password}\n`)
          .join(''),
      );
      record.databaseFiles =
        'New databases use per-run private tablespaces; reused fixture WAL/catalogs remain at the recorded owned dataDir.';
    });
    await step('source-migrations', async () => {
      validateTarget(targets.source.env);
      await withClient(targets.source, emptyDatabase);
      packageRun(
        'typescript',
        'tsc',
        ['-p', join(repoRoot, 'packages/api-contracts/tsconfig.json')],
        targets.source.env,
      );
      packageRun('prisma', 'prisma', ['generate'], targets.source.env);
      packageRun('prisma', 'prisma', ['migrate', 'deploy'], targets.source.env);
    });
    await step('synthetic-seed', () =>
      withClient(targets.source, (client) => seed(client, base.CELESTIA_RECOVERY_LOGIN_PASSWORD)),
    );
    await step('freeze-source', async () => {
      await assertQuiescent(admin, resources);
      await admin.query(
        `ALTER DATABASE ${quote(targets.source.database)} SET default_transaction_read_only=on`,
      );
    });
    const before = await step('source-snapshot', () => withClient(targets.source, snapshot));
    record.coverage = before.summary;
    record.migrations = await withClient(targets.source, migrationCompatibility);
    const archive = await step('dump', async () => {
      await assertQuiescent(admin, resources);
      const descriptor = await dumpOwnedArchive({
        source: targets.source,
        fixture,
        owned,
        root,
        base,
        passfile,
        archives,
      });
      record.archive = {
        file: 'application.dump',
        bytes: descriptor.bytes,
        sha256: descriptor.sha256,
        format: 'PostgreSQL custom',
      };
      return descriptor;
    });
    const afterDump = await withClient(targets.source, snapshot);
    assertEqualSnapshots(before.canonical, afterDump.canonical);
    if (options.fault === 'nonempty')
      await step('inject-nonempty', () =>
        withClient(targets.restore, (client) =>
          client.query(
            'CREATE TABLE recovery_rejection_sentinel (value integer NOT NULL); INSERT INTO recovery_rejection_sentinel VALUES (42)',
          ),
        ),
      );
    let selectedArchive = archive;
    if (options.fault === 'truncated') {
      const bytes = readFileSync(archive.path);
      const path = privateWrite(root, 'truncated.dump', bytes.subarray(0, bytes.length - 128));
      selectedArchive = { path, bytes: statSync(path).size, sha256: sha256(readFileSync(path)) };
      archives.add(selectedArchive); // Only the run can create/register this negative-test archive.
      record.corruptedArchive = {
        file: 'truncated.dump',
        bytes: selectedArchive.bytes,
        sha256: selectedArchive.sha256,
      };
    }
    await step('restore', async () => {
      await assertQuiescent(admin, resources);
      try {
        await restoreOwnedArchive(
          { fixture, source: targets.source, root, owned, archives, base, passfile },
          targets.restore,
          selectedArchive,
        );
      } catch (error) {
        if (options.fault === 'truncated') {
          requireSafe(
            error instanceof RecoveryError && error.code === 'SUBPROCESS_FAILED',
            'UNEXPECTED_NEGATIVE_TEST_FAILURE',
          );
          await withClient(targets.restore, emptyDatabase);
          record.negativeVerification = {
            truncatedRestoreRejected: true,
            destinationEmptyAfterFailure: true,
          };
        }
        if (options.fault === 'nonempty') {
          requireSafe(
            error instanceof RecoveryError && error.code === 'NONEMPTY_RESTORE_TARGET',
            'UNEXPECTED_NEGATIVE_TEST_FAILURE',
          );
          const sentinel = await withClient(
            targets.restore,
            async (client) =>
              (await client.query('SELECT value FROM recovery_rejection_sentinel')).rows,
          );
          requireSafe(
            sentinel.length === 1 && sentinel[0].value === 42,
            'NONEMPTY_SENTINEL_CHANGED',
          );
          record.negativeVerification = { nonemptyRejected: true, originalSentinelUnchanged: true };
        }
        throw error;
      }
      requireSafe(!options.fault, 'EXPECTED_FAILURE_DID_NOT_OCCUR');
    });
    await step('restored-fidelity', async () => {
      const restored = await withClient(targets.restore, snapshot);
      assertEqualSnapshots(before.canonical, restored.canonical);
      record.restored = restored.summary;
      record.migrations = await withClient(targets.restore, migrationCompatibility);
      record.sourceAfterDumpUnchanged = true;
      await withClient(targets.restore, async (client) => {
        const {
          rows: [row],
        } = await client.query(
          "SELECT count(*)::int AS wrong FROM pg_class c JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' AND pg_get_userbyid(c.relowner) <> current_user",
        );
        requireSafe(row.wrong === 0, 'RESTORED_OBJECT_OWNER_MISMATCH');
      });
      record.rolePortability = {
        distinctSourceRestoreRoles: true,
        allRestoredRelationsOwnedByDestinationRole: true,
        sourceACLsRestored: false,
      };
    });
    await step('restored-schema', async () => {
      validateTarget(targets.restore.env);
      packageRun(
        'prisma',
        'prisma',
        [
          'migrate',
          'diff',
          '--from-config-datasource',
          '--to-schema',
          'prisma/schema.prisma',
          '--exit-code',
        ],
        targets.restore.env,
      );
      await admin.query(
        `ALTER DATABASE ${quote(targets.restore.database)} SET default_transaction_read_only=on`,
      );
    });
    await step('restored-application-reads', async () => {
      const target = targets.restore;
      const ticket = privateWrite(
        root,
        'probe-ticket.json',
        JSON.stringify({
          root,
          fixture,
          target: {
            host: target.host,
            port: target.port,
            database: target.database,
            role: target.role,
            oid: target.oid,
          },
        }),
      );
      try {
        packageRun('tsx', 'tsx', [join(apiRoot, 'tooling/recovery/probe.mjs')], {
          ...target.env,
          CELESTIA_RECOVERY_TICKET: ticket,
        });
      } catch (error) {
        const path = join(root, 'application-read-failure.json');
        if (existsSync(path)) record.applicationFailure = JSON.parse(readFileSync(path, 'utf8'));
        throw error;
      }
      record.application = JSON.parse(
        readFileSync(join(root, 'application-read-results.json'), 'utf8'),
      );
      requireSafe(
        record.application.passed && record.application.onlySelect,
        'APPLICATION_READS_INCOMPLETE',
      );
    });
    await step('post-read-fidelity', async () => {
      await assertQuiescent(admin, resources);
      assertEqualSnapshots(
        before.canonical,
        (await withClient(targets.restore, snapshot)).canonical,
      );
      assertEqualSnapshots(
        before.canonical,
        (await withClient(targets.source, snapshot)).canonical,
      );
      record.restoredReadsDidNotWrite = true;
      record.sourceAfterValidationUnchanged = true;
    });
    if (options.verify)
      await step('full-verification', async () => {
        validateTarget(targets.verify.env);
        const output = run(
          process.execPath,
          [installedPnpm(base), 'run', 'verify'],
          targets.verify.env,
          { timeout: 600000, cwd: repoRoot },
        );
        const directory = [...output.matchAll(/Verification evidence: ([^\r\n]+)/g)].at(-1)?.[1];
        requireSafe(
          !!directory &&
            resolve(directory).startsWith(resolve(process.env.TEMP || process.env.TMP || '/tmp')),
          'VERIFICATION_EVIDENCE_MISSING',
        );
        record.verification = JSON.parse(
          readFileSync(join(directory, 'verification.json'), 'utf8'),
        );
        record.verificationEvidence = directory;
        record.verificationCommand = 'pnpm run verify';
        assertEqualSnapshots(
          before.canonical,
          (await withClient(targets.source, snapshot)).canonical,
        );
        assertEqualSnapshots(
          before.canonical,
          (await withClient(targets.restore, snapshot)).canonical,
        );
        record.recoveryDatabasesUnchangedByVerificationSuite = true;
        // The full suite's historical test names contain synthetic URLs. Keep raw
        // reports outside this milestone's persisted safe evidence.
      });
    record.result = 'passed';
  } catch (error) {
    failure = error;
    record.result = 'failed';
    record.failure = { stage, ...safeFailure(error) };
  } finally {
    const cleanup = {
      databasesAndRolesRemoved: false,
      stoppedOwnedProcess: false,
      privateFilesRetained: true,
      credentialsRemoved: false,
    };
    if (startAttempted && !startedServer && existsSync(join(fixture.dataDir, 'postmaster.pid'))) {
      try {
        ownedPid = assertProcess(fixture, base);
        const startedAt = Number(
          readFileSync(join(fixture.dataDir, 'postmaster.pid'), 'utf8').split(/\r?\n/)[2],
        );
        requireSafe(
          startedAt >= Math.floor(Date.parse(record.startedAt) / 1000) - 2,
          'START_FAILURE_PROCESS_NOT_OWNED',
        );
        startedServer = true;
        record.fixture.pid = ownedPid;
      } catch (error) {
        cleanup.unverifiedProcessRetained = true;
        cleanup.processError = safeFailure(error);
        failure ??= error;
      }
    }
    try {
      if (admin) {
        await assertExclusiveFixture(admin);
        await assertQuiescent(admin, resources);
        await cleanResources(admin, resources, root, owned, fixture);
        cleanup.databasesAndRolesRemoved = true;
      }
    } catch (error) {
      cleanup.resourceError = safeFailure(error);
      failure ??= error;
    }
    try {
      await admin?.end();
    } catch (error) {
      cleanup.connectionError = safeFailure(error);
      failure ??= error;
    }
    try {
      if (startedServer && !cleanup.resourceError) {
        requireSafe(assertProcess(fixture, base) === ownedPid, 'CLEANUP_PROCESS_CHANGED');
        run(binary(fixture, 'pg_ctl'), ['stop', '-D', fixture.dataDir, '-m', 'fast', '-w'], base);
        await assertClosedPort(fixture.port);
        cleanup.stoppedOwnedProcess = true;
      }
      if ((!startedServer && !cleanup.unverifiedProcessRetained) || cleanup.stoppedOwnedProcess)
        release?.();
      else cleanup.ownedProcessRetainedForInspection = true;
    } catch (error) {
      cleanup.processError = safeFailure(error);
      failure ??= error;
    }
    try {
      if (passfile) unlinkSync(containedPath(root, passfile));
      cleanup.credentialsRemoved = true;
    } catch (error) {
      cleanup.credentialError = safeFailure(error);
      failure ??= error;
    }
    record.cleanup = cleanup;
    record.resources = resources.map((t) => ({
      database: t.database,
      role: t.role,
      oid: t.oid ?? null,
      directory: t.directory ?? null,
      databaseRemaining: !!t.databaseCreated,
      tablespaceRemaining: !!t.tablespaceCreated,
      roleRemaining: !!t.roleCreated,
    }));
    record.elapsedMs = Math.round(performance.now() - started);
    record.finishedAt = new Date().toISOString();
    if (failure) {
      record.result = 'failed';
      record.failure ??= { stage: 'cleanup', ...safeFailure(failure) };
    }
    privateWrite(root, 'result.json', JSON.stringify(record, null, 2) + '\n');
    if (!failure)
      privateWrite(
        root,
        'success.json',
        JSON.stringify({ id, result: 'passed', evidence: 'result.json' }, null, 2) + '\n',
      );
  }
  console.log(`Recovery ${record.result}: ${root}`);
  return { exitCode: failure ? 1 : 0, root, record };
}
