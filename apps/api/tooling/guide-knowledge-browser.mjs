// Guarded synthetic K1 acceptance only. No production module imports this harness.
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

const base = isolatedEnvironment(process.env);
const fixture = JSON.parse(
  readFileSync(join(repoRoot, 'docs/plans/contextual-guide-knowledge/k1-fixture.json'), 'utf8'),
);
inspectFixture(fixture, base);
for (const port of [fixture.port, 45448, 45449]) await assertClosedPort(port);
const targets = planTargets(fixture, base, randomBytes(8).toString('hex'));
const target = targets.source;
const { root } = privateDirectory(base);
const owned = new Set();
const record = {
  kind: 'K1 synthetic browser harness',
  root,
  startedAt: new Date().toISOString(),
  commands: [],
};
const webRoot = join(repoRoot, 'apps/web');
const webRequire = createRequire(join(webRoot, 'package.json'));
const vite = resolve(dirname(webRequire.resolve('vite/package.json')), 'bin/vite.js');
let release,
  admin,
  db,
  server,
  web,
  pid,
  started = false;
let fail = false,
  delay = 0;
console.log(`K1 browser evidence: ${root}`);
try {
  release = acquireLease(fixture, 'k1-browser');
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
  packageRun('prisma', 'prisma', ['migrate', 'deploy'], target.env);
  Object.assign(process.env, target.env, { CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:45449' });
  const [{ PrismaClient }, { PrismaPg }, { default: express }] = await Promise.all([
    import('@prisma/client'),
    import('@prisma/adapter-pg'),
    import('express'),
  ]);
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target.env.DATABASE_URL }) });
  globalThis.prisma = db;
  const [{ AuthService }, { GenshinImportService }, { createApp }, { logger }] = await Promise.all([
    import('../src/platform/auth/auth.service.ts'),
    import('../src/games/genshin/importer/importer.service.ts'),
    import('../src/app.ts'),
    import('../src/core/logger/logger.ts'),
  ]);
  logger.level = 'silent';
  const auth = new AuthService(),
    importer = new GenshinImportService();
  const users = {};
  const commit = async (userId, refinement) => {
    const input = {
      requestVersion: 1,
      sections: refinement ? ['characters', 'weapons'] : ['characters'],
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'K1 synthetic browser import',
        characters: ['Keqing', 'HuTao'].map((key) => ({
          key,
          level: 80,
          ascension: 6,
          constellation: 0,
          talent: { auto: 6, skill: 6, burst: 6 },
        })),
        ...(refinement
          ? {
              weapons: [
                {
                  key: 'HarbingerOfDawn',
                  level: 80,
                  ascension: 6,
                  refinement,
                  location: 'Keqing',
                  lock: false,
                },
              ],
            }
          : {}),
      },
    };
    const preview = await importer.preview(userId, input);
    await importer.importAccount(userId, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  for (const name of ['a', 'b']) {
    const result = await auth.register({
      email: `k1-${name}@test.invalid`,
      username: `k1-${name}`,
      password: 'K1-synthetic-only!',
    });
    users[name] = result.user.id;
    await commit(result.user.id, name === 'a' ? 1 : null);
  }
  const wrapper = express();
  wrapper.use(async (req, res, next) => {
    if (req.path.endsWith('/guide-advice')) {
      if (delay) await new Promise((done) => setTimeout(done, delay));
      if (fail)
        return res.status(503).json({
          success: false,
          error: { code: 'SYNTHETIC_FAILURE', message: 'Synthetic K1 guide refresh failure.' },
        });
    }
    next();
  });
  wrapper.use(createApp());
  server = await new Promise((done) => {
    const instance = wrapper.listen(45448, '127.0.0.1', () => done(instance));
  });
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
  console.log(
    'K1_BROWSER_READY synthetic login k1-a@test.invalid / k1-b@test.invalid; password K1-synthetic-only!',
  );
  const lines = createInterface({ input: process.stdin });
  for await (const command of lines) {
    const name = command.trim();
    if (name === 'quit') {
      lines.close();
      break;
    }
    if (name === 'fail') fail = true;
    else if (name === 'normal') {
      fail = false;
      delay = 0;
    } else if (name === 'delay') delay = 3000;
    else if (name === 'import-r5') await commit(users.a, 5);
    else if (name === 'focused')
      console.log(
        packageRun(
          'vitest',
          'vitest',
          [
            'run',
            '--no-file-parallelism',
            'src/games/genshin/intelligence/guide-knowledge',
            'tooling/guide-knowledge-client.test.js',
          ],
          target.env,
        ),
      );
    else {
      console.log('UNSUPPORTED_COMMAND');
      continue;
    }
    record.commands.push({ name, at: new Date().toISOString() });
    console.log(`K1_COMMAND_COMPLETE ${name}`);
  }
} catch (error) {
  record.failure = safeFailure(error);
  process.exitCode = 1;
} finally {
  try {
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
    run(process.execPath, [vite, 'build'], { ...base, NODE_ENV: 'production' }, { cwd: webRoot });
    record.ordinaryWebBuildRestored = true;
    for (const port of [45448, 45449]) await assertClosedPort(port);
    record.browserPortsClosed = true;
  } catch (error) {
    record.cleanupFailure = safeFailure(error);
    process.exitCode = 1;
  }
  record.finishedAt = new Date().toISOString();
  privateWrite(root, 'k1-browser-result.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record));
}
