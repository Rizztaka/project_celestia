// Actual HTTP/compiled-API lifecycle, explicitly NOT mounted-browser acceptance.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  contextualReleaseAdviceSchema,
  contextualReleaseMetadataSchema,
} from '@celestia/api-contracts';

import { isolatedEnvironment } from './recovery/policy.mjs';
import { repoRoot } from './recovery/process.mjs';

isolatedEnvironment(process.env);
const label = process.argv[2] ?? '';
if (label && !/^[a-z][a-z0-9-]{0,30}$/.test(label)) throw Error('Invalid run label.');
const folder = join(repoRoot, 'docs/plans/contextual-guide-knowledge');
const json = (file) => JSON.parse(readFileSync(join(folder, file), 'utf8'));
assert.equal(json('k3-browser-state.json').stage, 'browser-ready');
const events = [],
  origin = 'http://127.0.0.1:45449',
  url = 'http://127.0.0.1:45448/api/v1';
async function request(path, token, options = {}) {
  const response = await fetch(url + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Origin: origin,
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  return result.data;
}
async function command(name) {
  const id = json('k3-browser-control.json').id + 1;
  const count = json('k3-browser-state.json').commands.length;
  writeFileSync(join(folder, 'k3-browser-control.json'), JSON.stringify({ id, name }));
  for (let attempt = 0; attempt < 150; attempt++) {
    const state = json('k3-browser-state.json');
    if (state.commands.length > count && state.commands.at(-1).name === name) {
      events.push({
        command: name,
        at: new Date().toISOString(),
        apiStarts: state.apiStarts.map((start) => ({
          pid: start.pid,
          release: start.metadata.release,
        })),
      });
      return;
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  throw Error('CONTROL_COMMAND_TIMEOUT');
}
const login = async (name) =>
  (
    await request('/auth/login', null, {
      method: 'POST',
      body: JSON.stringify({ email: `k2-${name}@test.invalid`, password: 'K2-synthetic-only!' }),
    })
  ).token;
const a = await login('a'),
  b = await login('b'); // Tokens stay in memory only.
const metadata = async () =>
  contextualReleaseMetadataSchema.parse(await request('/games/genshin/guide-knowledge/release', a));
const advice = async (token = a) =>
  contextualReleaseAdviceSchema.parse(
    await request('/games/genshin/characters/Keqing/guide-advice/v3?contractVersion=2', token),
  );
const equipment = (token) => request('/games/genshin/characters/Keqing/equipment', token);
const initial = await metadata(),
  initialAdvice = await advice(),
  aBefore = await equipment(a),
  bBefore = await equipment(b);
assert.deepEqual(initial.release, initialAdvice.release);
assert.equal(initial.release.id, 'k3-approved-k2-baseline');
await command('delay');
const pending = advice();
await new Promise((done) => setTimeout(done, 400));
await command('activate-fixture');
assert.deepEqual((await metadata()).release, initial.release); // pointer alone does NOT reload a process
await command('restart-api');
const second = await metadata();
assert.equal(second.release.id, 'k3-browser-fixture-identity');
const delayed = await pending;
assert.deepEqual(delayed.release, initial.release);
await command('normal');
assert.deepEqual((await advice()).release, second.release);
assert.deepEqual(await equipment(a), aBefore);
assert.deepEqual(await equipment(b), bBefore);
await command('import-partial');
const changed = await advice();
assert.notEqual(changed.advice.observationFingerprint, initialAdvice.advice.observationFingerprint);
const partial = await equipment(a);
await command('slow-fail');
const failed = await fetch(
  url + '/games/genshin/characters/Keqing/guide-advice/v3?contractVersion=2',
  { headers: { Authorization: 'Bearer ' + a, Origin: origin }, signal: AbortSignal.timeout(15000) },
);
assert.equal(failed.status, 503);
await command('normal');
assert.deepEqual((await advice(b)).release, second.release);
assert.deepEqual(await equipment(b), bBefore);
await command('rollback');
assert.deepEqual((await metadata()).release, second.release); // rollback also needs restart
await command('restart-api');
const rolledBack = await metadata();
assert.deepEqual(rolledBack.release, initial.release);
assert.deepEqual((await advice()).release, initial.release);
assert.deepEqual(await equipment(a), partial);
assert.deepEqual(await equipment(b), bBefore);
const result = {
  at: new Date().toISOString(),
  kind: 'Actual authenticated HTTP and compiled API processes, not mounted-browser acceptance',
  initial: initial.release,
  second: second.release,
  rollback: rolledBack.release,
  delayedResponse: delayed.release,
  pointerActivationRequiresRestartObserved: true,
  pointerRollbackRequiresRestartObserved: true,
  observationsChangedOnlyByExplicitFixtureImport: true,
  transport503Observed: true,
  accountIsolation: true,
  accountEquipmentUnchangedByReleaseSwitch: true,
  events,
};
writeFileSync(
  join(folder, `k3-evidence/http-lifecycle${label ? '-' + label : ''}.json`),
  JSON.stringify(result, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(result));
