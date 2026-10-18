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
import {
  isolatedEnvironment,
  quote,
  requireSafe,
  safeFailure,
  sha256,
} from './recovery/policy.mjs';
import { packageRun, repoRoot, run } from './recovery/process.mjs';
import { applicationTables, ids, seed } from './recovery/seed.mjs';

const base = isolatedEnvironment(process.env);
const args = process.argv.slice(2);
requireSafe(args.length === 2 && args[0] === '--fixture', 'EXPLICIT_FIXTURE_REQUIRED');
const fixture = JSON.parse(readFileSync(resolve(args[1]), 'utf8'));
const id = randomBytes(8).toString('hex');
const targets = planTargets(fixture, base, id);
const target = targets.source;
inspectFixture(fixture, base);
for (const port of [fixture.port, 45448, 45449]) await assertClosedPort(port);
const { root, permissions } = privateDirectory(base);
const record = {
  kind: 'C5d browser acceptance',
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
  pendingResponse = null,
  startAttempted = false,
  stopped = false;
const webRoot = join(repoRoot, 'apps/web');
const webRequire = createRequire(join(webRoot, 'package.json'));
const vite = resolve(dirname(webRequire.resolve('vite/package.json')), 'bin/vite.js');
const ordinaryWebBuild = () =>
  run(process.execPath, [vite, 'build'], { ...base, NODE_ENV: 'production' }, { cwd: webRoot });
console.log(`C5d browser private evidence: ${root}`);
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
  await seed(seedClient, 'C5d-synthetic-only!');
  await seedClient.end();
  Object.assign(process.env, target.env, { CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:45449' });
  const [{ PrismaClient, Prisma }, { PrismaPg }, { default: supertest }, { default: jwt }] =
    await Promise.all([
      import('@prisma/client'),
      import('@prisma/adapter-pg'),
      import('supertest'),
      import('jsonwebtoken'),
    ]);
  db = new PrismaClient({ adapter: new PrismaPg({ connectionString: target.env.DATABASE_URL }) });
  globalThis.prisma = db;
  const { createApp } = await import('../src/app.ts');
  const { AccountDataRepository } =
    await import('../src/platform/account-data/account-data.repository.ts');
  for (const method of ['export', 'delete']) {
    const original = AccountDataRepository.prototype[method];
    AccountDataRepository.prototype[method] = async function (...values) {
      const result = await original.apply(this, values);
      if (pendingResponse?.method === method && values[0] === ids.a) {
        const gate = pendingResponse;
        gate.started = true;
        console.log('C5D_RESPONSE_HELD');
        await gate.promise;
      }
      return result;
    };
  }
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
  console.log('C5D_BROWSER_READY');
  const lines = createInterface({ input: process.stdin });
  for await (const command of lines) {
    const name = command.trim();
    if (name === 'quit') {
      lines.close();
      break;
    }
    const entry = { name, rateClock: now };
    if (name === 'advance') now += 900_000;
    else if (name === 'hold-export' || name === 'hold-delete') {
      requireSafe(!pendingResponse, 'RESPONSE_ALREADY_HELD');
      let resolveResponse;
      const promise = new Promise((done) => {
        resolveResponse = done;
      });
      pendingResponse = {
        method: name === 'hold-export' ? 'export' : 'delete',
        promise,
        resolveResponse,
        started: false,
      };
    } else if (name === 'release-response') {
      requireSafe(!!pendingResponse, 'NO_RESPONSE_HELD');
      pendingResponse.resolveResponse();
      entry.started = pendingResponse.started;
      pendingResponse = null;
    } else if (name === 'exhaust-account') {
      entry.statuses = [];
      for (let i = 0; i < 4; i++)
        entry.statuses.push(
          (await api.post('/api/v1/users/me/export').auth(access, { type: 'bearer' }).send({}))
            .status,
        );
    } else if (name === 'verify-download') {
      const exported = JSON.parse(readFileSync(join(root, 'browser-export.json'), 'utf8'));
      const client = await connectTarget(target, fixture, base);
      await client.query("SET timezone='UTC'");
      await client.query('SET extra_float_digits=3');
      const { genshinAccountData } =
        await import('../src/games/genshin/account-data/genshin-account-data.ts');
      const { nikkeAccountData } =
        await import('../src/games/nikke/account-data/nikke-account-data.ts');
      const repository = new AccountDataRepository([genshinAccountData, nikkeAccountData]);
      requireSafe(
        exported.exportVersion === 1 && Object.keys(exported.tables).length === 20,
        'DOWNLOAD_SCHEMA_MISMATCH',
      );
      entry.tables = [];
      for (const table of repository.tables) {
        const where = table.ownerWhere(ids.a);
        const rows = await db.$queryRaw(
          Prisma.sql`SELECT ${Prisma.join(table.fields.map((field) => Prisma.raw(`${quote(field)}::text AS ${quote(field)}`)))} FROM ${Prisma.raw(quote(table.table))} WHERE ${where}`,
        );
        const canonical = (values) =>
          JSON.stringify(values.map((row) => JSON.stringify(row)).sort());
        requireSafe(
          canonical(rows) === canonical(exported.tables[table.table]),
          'DOWNLOAD_ROWS_MISMATCH',
        );
        entry.tables.push({
          table: table.table,
          rows: rows.length,
          sha256: sha256(canonical(rows)),
        });
      }
      await client.end();
      entry.complete = true;
      entry.bytes = Buffer.byteLength(readFileSync(join(root, 'browser-export.json')));
    } else if (name === 'measure-substantial') {
      const { GenshinImportService } =
        await import('../src/games/genshin/importer/importer.service.ts');
      const importer = new GenshinImportService();
      const input = {
        requestVersion: 1,
        sections: ['characters', 'weapons', 'artifacts', 'materials'],
        payload: {
          format: 'GOOD',
          version: 2,
          characters: Array.from({ length: 250 }, (_, i) => ({
            key: `Opaque${i}`,
            level: 1,
            ascension: 0,
            constellation: 0,
            talent: { auto: 1, skill: 1, burst: 1 },
          })),
          weapons: Array.from({ length: 2500 }, () => ({
            key: 'OpaqueWeapon',
            level: 1,
            ascension: 0,
            refinement: 1,
            location: '',
            lock: false,
          })),
          artifacts: Array.from({ length: 4750 }, () => ({
            setKey: 'OpaqueSet',
            slotKey: 'flower',
            level: 0,
            rarity: 5,
            mainStatKey: 'hp',
            substats: [],
            location: '',
            lock: false,
          })),
          materials: Object.fromEntries(
            Array.from({ length: 2000 }, (_, i) => [`OpaqueMaterial${i}`, 1]),
          ),
        },
      };
      const preview = await importer.preview(ids.a, input);
      await importer.importAccount(ids.a, {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: preview.clearSections,
      });
      now += 900_000;
      const started = performance.now();
      const response = await api
        .post('/api/v1/users/me/export')
        .auth(access, { type: 'bearer' })
        .send({ requestVersion: 1, password: 'C5d-synthetic-only!' });
      requireSafe(response.status === 200, 'SUBSTANTIAL_EXPORT_FAILED');
      entry.measurement = {
        inputItems: 9500,
        outputBytes: Buffer.byteLength(response.text),
        rows: Object.values(response.body.data.tables).reduce((n, rows) => n + rows.length, 0),
        elapsedMs: Math.round(performance.now() - started),
        sha256: sha256(response.text),
      };
      console.log(JSON.stringify(entry.measurement));
    } else if (name === 'save-export') {
      const response = await api
        .post('/api/v1/users/me/export')
        .auth(access, { type: 'bearer' })
        .send({ requestVersion: 1, password: 'C5d-synthetic-only!' });
      requireSafe(
        response.status === 200 && response.body.data.exportVersion === 1,
        'EXPORT_NOT_CONFIRMED',
      );
      privateWrite(root, 'synthetic-account-export.json', JSON.stringify(response.body.data));
      entry.tables = Object.fromEntries(
        Object.entries(response.body.data.tables).map(([name, rows]) => [name, rows.length]),
      );
      entry.bytes = Buffer.byteLength(response.text);
    } else if (name === 'exhaust-login') {
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
      entry.snapshot = [];
      for (const table of [...applicationTables, '_prisma_migrations']) {
        const columns = (
          await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position",
            [table],
          )
        ).rows;
        const rows = (
          await client.query(
            `SELECT ${columns.map(({ column_name }) => `${quote(column_name)}::text`).join(',')} FROM ${quote(table)}`,
          )
        ).rows;
        entry.snapshot.push({
          table,
          rows: rows.length,
          sha256: sha256(JSON.stringify(rows.map((row) => JSON.stringify(row)).sort())),
        });
      }
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
    pendingResponse?.resolveResponse();
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
  privateWrite(root, 'c5d-browser-result.json', JSON.stringify(record, null, 2) + '\n');
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
