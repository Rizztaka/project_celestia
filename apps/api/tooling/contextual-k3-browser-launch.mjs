// Current-session test process only (bounded to one hour by fileCommands), not an automation.
import { spawn } from 'node:child_process';
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { isolatedEnvironment } from './recovery/policy.mjs';
import { apiRoot, repoRoot } from './recovery/process.mjs';

const env = isolatedEnvironment(process.env);
const label = process.argv[2] ?? '';
if (label && !/^[a-z][a-z0-9-]{0,30}$/.test(label)) throw Error('Invalid run label.');
const suffix = label ? '-' + label : '';
const folder = join(repoRoot, 'docs/plans/contextual-guide-knowledge');
const log = join(folder, `k3-evidence/browser-harness${suffix}.log.raw`);
const fd = openSync(log, 'wx');
const child = spawn(
  process.execPath,
  ['--import', 'tsx', 'tooling/contextual-browser.mjs', '--k3'],
  {
    cwd: apiRoot,
    env: {
      ...env,
      CELESTIA_CONTEXTUAL_BROWSER_RUN: label,
      CELESTIA_CONTEXTUAL_OPERATOR: 'Codex (GPT-6), K3 completion implementor',
    },
    detached: true,
    windowsHide: true,
    stdio: ['ignore', fd, fd],
  },
);
closeSync(fd);
child.unref();
const record = {
  at: new Date().toISOString(),
  pid: child.pid,
  cwd: apiRoot,
  args: ['--import', 'tsx', 'tooling/contextual-browser.mjs', '--k3'],
  log,
  control: `docs/plans/contextual-guide-knowledge/k3-browser-control${suffix}.json`,
};
writeFileSync(
  join(folder, `k3-evidence/browser-launch${suffix}.json`),
  JSON.stringify(record, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(record));
