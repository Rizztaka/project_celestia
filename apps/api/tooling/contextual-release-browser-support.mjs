import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  activateRelease,
  activeIdentity,
  loadSelectedRelease,
  publishCandidate,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
import { baselineId, migrateApprovedBaseline } from './contextual-baseline.mjs';
import { assertClosedPort } from './recovery/fixture.mjs';
import { requireSafe } from './recovery/policy.mjs';
import { apiRoot } from './recovery/process.mjs';

export async function* fileCommands(path) {
  let seen = 0;
  const end = Date.now() + 3_600_000;
  while (Date.now() < end) {
    if (existsSync(path)) {
      const command = JSON.parse(readFileSync(path, 'utf8'));
      requireSafe(
        Number.isInteger(command.id) && typeof command.name === 'string',
        'INVALID_LOCAL_CONTROL',
      );
      if (command.id > seen) {
        seen = command.id;
        yield command.name;
      }
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  yield 'quit';
}
export function releaseBrowserSupport(root, env, record) {
  const actor = process.env.CELESTIA_CONTEXTUAL_OPERATOR ?? 'Local K3 harness operator';
  const store = join(root, 'knowledge-store');
  mkdirSync(store);
  writeFileSync(join(store, 'fixture.json'), JSON.stringify('isolated-synthetic-knowledge'));
  migrateApprovedBaseline(store);
  const baseline = activateRelease(store, baselineId, null, actor);
  record.releaseEvents = [baseline];
  record.apiStarts = [];
  let child;
  const stop = async () => {
    if (child && child.exitCode === null) {
      const exited = new Promise((done) => child.once('exit', done));
      child.kill();
      await exited;
    }
    await assertClosedPort(45450);
    child = undefined;
  };
  const start = async () => {
    await assertClosedPort(45450);
    child = spawn(process.execPath, ['--import', 'tsx', 'tooling/contextual-release-server.mjs'], {
      cwd: apiRoot,
      env: { ...env, CELESTIA_CONTEXTUAL_RELEASE_ROOT: store },
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((done, reject) => {
      let text = '';
      const timeout = setTimeout(() => reject(Error('K3_CHILD_START_TIMEOUT')), 15000);
      child.stdout.on('data', (chunk) => {
        text += chunk;
        for (const line of text.split(/\r?\n/)) {
          if (!line.startsWith('{"ready":true')) continue;
          const info = JSON.parse(line);
          record.apiStarts.push({ at: new Date().toISOString(), ...info });
          clearTimeout(timeout);
          done();
          return;
        }
      });
      child.once('exit', () => {
        clearTimeout(timeout);
        reject(Error('K3_CHILD_START_FAILED'));
      });
    });
  };
  return {
    store,
    start,
    stop,
    command: async (name) => {
      if (name === 'activate-fixture') {
        const base = loadSelectedRelease(store);
        const candidate = {
          schemaVersion: 1,
          base: activeIdentity(store),
          registry: base.registry,
          pack: base.pack,
          tracking: base.tracking,
          evidence: base.evidence,
          notices: base.notices,
          decisions: [],
        };
        const next = publishCandidate(store, 'k3-browser-fixture-identity', candidate, 'fixture');
        record.releaseEvents.push(activateRelease(store, next.id, activeIdentity(store), actor));
      } else if (name === 'rollback')
        record.releaseEvents.push(
          activateRelease(store, baselineId, activeIdentity(store), actor, 'rollback'),
        );
      else if (name === 'restart-api') {
        await stop();
        await start();
      } else return false;
      return true;
    },
    proxy: async (req, res, delay, fail) => {
      const guidance = req.path.endsWith('/guide-advice/v3');
      if (guidance && fail) {
        if (delay) await new Promise((done) => setTimeout(done, delay));
        res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:45449');
        return res.status(503).json({
          success: false,
          error: { code: 'SYNTHETIC_FAILURE', message: 'Synthetic guidance transport failure.' },
        });
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        requireSafe(size <= 4_194_304, 'TEST_PROXY_BODY_LIMIT');
        chunks.push(chunk);
      }
      const headers = { ...req.headers };
      delete headers.host;
      delete headers.connection;
      delete headers['content-length'];
      const response = await fetch('http://127.0.0.1:45450' + req.originalUrl, {
        method: req.method,
        headers,
        ...(size ? { body: Buffer.concat(chunks) } : {}),
        redirect: 'manual',
      });
      const bytes = Buffer.from(await response.arrayBuffer());
      // Delay captured old-process bytes, not a fetch after restart; this tests the real race.
      if (guidance && delay) await new Promise((done) => setTimeout(done, delay));
      for (const [name, value] of response.headers)
        if (
          !['connection', 'transfer-encoding', 'content-encoding', 'content-length'].includes(name)
        )
          res.setHeader(name, value);
      res.status(response.status).send(bytes);
    },
    close: async () => {
      if (activeIdentity(store)?.id !== baselineId)
        record.releaseEvents.push(
          activateRelease(store, baselineId, activeIdentity(store), actor, 'rollback'),
        );
      record.approvedBaselineRestored = loadSelectedRelease(store).descriptor.id === baselineId;
      await stop();
    },
  };
}
