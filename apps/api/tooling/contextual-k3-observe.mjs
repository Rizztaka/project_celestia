// Actual guarded API metadata observation; synthetic login tokens stay in memory.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { contextualReleaseMetadataSchema } from '@celestia/api-contracts';

import { isolatedEnvironment, requireSafe } from './recovery/policy.mjs';
import { repoRoot } from './recovery/process.mjs';

isolatedEnvironment(process.env);
const [run, phase] = process.argv.slice(2);
requireSafe(
  [run, phase].every((value) => /^[a-z][a-z0-9-]{0,45}$/.test(value ?? '')),
  'INVALID_OBSERVATION_LABEL',
);
const folder = join(repoRoot, 'docs/plans/contextual-guide-knowledge');
const state = JSON.parse(readFileSync(join(folder, `k3-browser-state-${run}.json`), 'utf8'));
requireSafe(state.stage === 'browser-ready' && !state.finishedAt, 'TEST_HARNESS_NOT_RUNNING');
process.kill(state.harnessPid, 0);
const request = async (path, init = {}) => {
  const response = await fetch('http://127.0.0.1:45448/api/v1' + path, {
    ...init,
    signal: AbortSignal.timeout(10_000),
    redirect: 'error',
    headers: {
      Origin: 'http://127.0.0.1:45449',
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  return result.data;
};
const login = await request('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'k2-a@test.invalid', password: 'K2-synthetic-only!' }),
});
const metadata = contextualReleaseMetadataSchema.parse(
  await request('/games/genshin/guide-knowledge/release', {
    headers: { Authorization: `Bearer ${login.token}` },
  }),
);
const pointer = JSON.parse(readFileSync(join(state.root, 'knowledge-store/active.json'), 'utf8'));
const record = {
  phase,
  observedAt: new Date().toISOString(),
  processRelease: metadata.release,
  selectedPointer: { id: pointer.id, digest: pointer.digest },
  startupSnapshotMatchesLastStart:
    metadata.release.digest === state.apiStarts.at(-1).metadata.release.digest,
};
assert.equal(record.startupSnapshotMatchesLastStart, true);
writeFileSync(
  join(folder, 'k3-evidence', `resume-api-${phase}.json.raw`),
  JSON.stringify(record, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(record));
