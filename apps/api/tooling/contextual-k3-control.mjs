// Explicit commands for the current guarded test harness. Never loaded by the app.
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isolatedEnvironment, requireSafe } from './recovery/policy.mjs';
import { repoRoot } from './recovery/process.mjs';

isolatedEnvironment(process.env);
const [label, ...commands] = process.argv.slice(2);
requireSafe(
  /^[a-z][a-z0-9-]{0,30}$/.test(label ?? '') && commands.length > 0 && commands.length <= 4,
  'INVALID_TEST_CONTROL',
);
const allowed = [
  'normal',
  'delay',
  'fail',
  'slow-fail',
  'import-partial',
  'import-r5',
  'activate-fixture',
  'rollback',
  'restart-api',
  'quit',
];
requireSafe(
  commands.every((command) => allowed.includes(command)),
  'INVALID_TEST_COMMAND',
);
const folder = join(repoRoot, 'docs/plans/contextual-guide-knowledge');
const statePath = join(folder, `k3-browser-state-${label}.json`);
const controlPath = join(folder, `k3-browser-control-${label}.json`);
const read = (path) => JSON.parse(readFileSync(path, 'utf8'));
for (const name of commands) {
  const before = read(statePath);
  requireSafe(
    before.stage === 'browser-ready' && !before.finishedAt && Number.isInteger(before.harnessPid),
    'TEST_HARNESS_NOT_RUNNING',
  );
  process.kill(before.harnessPid, 0);
  const id = existsSync(controlPath) ? read(controlPath).id + 1 : 1;
  const temporary = `${controlPath}.${process.pid}.tmp`;
  writeFileSync(temporary, JSON.stringify({ id, name }), { flag: 'wx' });
  renameSync(temporary, controlPath);
  const deadline = Date.now() + 30_000;
  for (;;) {
    const current = read(statePath);
    if (
      (name === 'quit' && current.finishedAt) ||
      (current.commands.length > before.commands.length && current.commands.at(-1).name === name)
    ) {
      console.log(
        JSON.stringify({
          name,
          completedAt: new Date().toISOString(),
          apiStarts: current.apiStarts.map((start) => ({
            pid: start.pid,
            release: start.metadata.release,
          })),
          cleanup: current.resourcesRemoved ?? false,
        }),
      );
      break;
    }
    requireSafe(Date.now() < deadline, 'TEST_CONTROL_TIMEOUT');
    await new Promise((done) => setTimeout(done, 200));
  }
}
