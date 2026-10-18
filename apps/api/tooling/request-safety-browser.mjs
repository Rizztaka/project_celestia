// Explicit local synthetic acceptance harness. No production entry point imports this file.
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { createInterface } from 'node:readline';

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
import { ids, seed } from './recovery/seed.mjs';
import { snapshot } from './recovery/snapshot.mjs';

const base = isolatedEnvironment(process.env);
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'docs/plans/c5b-recovery-foundation/local-fixture.json'), 'utf8'),
);
const id = randomBytes(8).toString('hex');
const targets = planTargets(fixture, base, id);
const target = targets.source;
inspectFixture(fixture, base);
for (const port of [fixture.port, 45448, 45449]) await assertClosedPort(port);
const { root, permissions } = privateDirectory(base);
const record = {
  kind: 'C5c browser acceptance',
  controlledRateClock: true,
  root,
  permissions,
  commands: [],
  startedAt: new Date().toISOString(),
};
const owned = new Set();
let admin,
  db,
  server,
  web,
  release,
  ownedPid,
  lock,
  startAttempted = false,
  stopped = false;
const webRoot = join(repoRoot, 'apps/web');
const webRequire = createRequire(join(webRoot, 'package.json'));
const vite = resolve(dirname(webRequire.resolve('vite/package.json')), 'bin/vite.js');
const ordinaryWebBuild = () =>
  run(process.execPath, [vite, 'build'], { ...base, NODE_ENV: 'production' }, { cwd: webRoot });
console.log(`C5c browser private evidence: ${root}`);
try {
  release = acquireLease(fixture, id);
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
  ownedPid = assertProcess(fixture, base);
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
  packageRun('prisma', 'prisma', ['migrate', 'deploy'], target.env);
  const seedClient = await connectTarget(target, fixture, base);
  await seed(seedClient, 'C5c-synthetic-only!');
  await seedClient.end();
  Object.assign(process.env, target.env, { CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:45449' });
  const [{ PrismaClient }, { PrismaPg }, { default: supertest }, { default: jwt }] =
    await Promise.all([
      import('@prisma/client'),
      import('@prisma/adapter-pg'),
      import('supertest'),
      import('jsonwebtoken'),
    ]);
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target.env.DATABASE_URL }) });
  globalThis.prisma = db;
  const { createApp } = await import('../src/app.ts');
  const { logger } = await import('../src/core/logger/logger.ts');
  logger.level = 'silent';
  let now = 0;
  const app = createApp({ clock: () => now });
  server = await new Promise((resolveServer, reject) => {
    const value = app.listen(45448, '127.0.0.1', () => resolveServer(value));
    value.on('error', reject);
  });
  const api = supertest('http://127.0.0.1:45448');
  const access = jwt.sign({}, target.env.JWT_SECRET, { subject: ids.a });
  run(
    process.execPath,
    [vite, 'build'],
    { ...base, NODE_ENV: 'production', VITE_API_URL: 'http://127.0.0.1:45448/api/v1' },
    { cwd: webRoot },
  );
  web = spawn(
    process.execPath,
    [vite, 'preview', '--host', '127.0.0.1', '--port', '45449', '--strictPort'],
    { cwd: webRoot, env: { ...base, NODE_ENV: 'production' }, windowsHide: true, stdio: 'ignore' },
  );
  console.log('C5C_BROWSER_READY');
  const lines = createInterface({ input: process.stdin });
  for await (const command of lines) {
    const name = command.trim();
    if (name === 'quit') {
      lines.close();
      break;
    }
    const entry = { name, rateClock: now };
    if (name === 'advance') now += 900_000;
    else if (name === 'exhaust-login') {
      entry.statuses = [];
      for (let i = 0; i < 11; i++)
        entry.statuses.push((await api.post('/api/v1/auth/login').send({})).status);
    } else if (name === 'exhaust-import') {
      entry.statuses = [];
      for (let i = 0; i < 7; i++)
        entry.statuses.push(
          (
            await api
              .post('/api/v1/games/genshin/import/preview')
              .auth(access, { type: 'bearer' })
              .send({})
          ).status,
        );
    } else if (name === 'lock-owner') {
      requireSafe(!lock, 'OWNER_ALREADY_LOCKED');
      lock = await connectTarget(target, fixture, base);
      await lock.query('BEGIN');
      await lock.query('SELECT id FROM users WHERE id=$1 FOR UPDATE', [ids.a]);
    } else if (name === 'release-owner') {
      requireSafe(!!lock, 'NO_OWNER_LOCK');
      await lock.query('ROLLBACK');
      await lock.end();
      lock = undefined;
    } else if (name === 'snapshot') {
      const client = await connectTarget(target, fixture, base);
      entry.snapshot = (await snapshot(client)).summary;
      await client.end();
    } else {
      console.log('UNSUPPORTED_COMMAND');
      continue;
    }
    record.commands.push(entry);
    console.log(JSON.stringify({ command: name, completed: true, statuses: entry.statuses }));
  }
} catch (error) {
  record.failure = safeFailure(error);
  process.exitCode = 1;
} finally {
  try {
    if (lock) {
      await lock.query('ROLLBACK');
      await lock.end();
    }
    if (server) {
      server.closeAllConnections();
      await new Promise((done) => server.close(done));
    }
    if (web && web.exitCode === null) {
      const exited = new Promise((done) => web.once('exit', done));
      web.kill();
      await exited;
    }
    await db?.$disconnect();
    if (admin) {
      await assertExclusiveFixture(admin);
      await assertQuiescent(admin, [target]);
      await cleanResources(admin, [target], root, owned, fixture);
      await admin.end();
      admin = undefined;
      record.resourcesRemoved = true;
    }
    if (!ownedPid && startAttempted && existsSync(join(fixture.dataDir, 'postmaster.pid'))) {
      ownedPid = assertProcess(fixture, base);
      requireSafe(
        Number(readFileSync(join(fixture.dataDir, 'postmaster.pid'), 'utf8').split(/\r?\n/)[2]) >=
          Math.floor(Date.parse(record.startedAt) / 1000) - 2,
        'START_FAILURE_PROCESS_NOT_OWNED',
      );
    }
    if (ownedPid) {
      requireSafe(assertProcess(fixture, base) === ownedPid, 'CLEANUP_PROCESS_CHANGED');
      run(binary(fixture, 'pg_ctl'), ['stop', '-D', fixture.dataDir, '-m', 'fast', '-w'], base);
      await assertClosedPort(fixture.port);
      stopped = true;
    }
    if (!startAttempted || stopped || !existsSync(join(fixture.dataDir, 'postmaster.pid')))
      release?.();
    record.stoppedOwnedProcess = stopped;
    ordinaryWebBuild();
    record.ordinaryWebBuildRestored = true;
    for (const port of [45448, 45449]) await assertClosedPort(port);
    record.browserPortsClosed = true;
  } catch (error) {
    record.cleanupFailure = safeFailure(error);
    process.exitCode = 1;
  }
  record.finishedAt = new Date().toISOString();
  privateWrite(root, 'c5c-browser-result.json', JSON.stringify(record, null, 2) + '\n');
  console.log(
    JSON.stringify({
      result: process.exitCode ? 'failed' : 'passed',
      root,
      cleanup: {
        resourcesRemoved: record.resourcesRemoved,
        stoppedOwnedProcess: record.stoppedOwnedProcess,
        ordinaryWebBuildRestored: record.ordinaryWebBuildRestored,
        browserPortsClosed: record.browserPortsClosed,
      },
      failure: record.failure,
      cleanupFailure: record.cleanupFailure,
    }),
  );
}
