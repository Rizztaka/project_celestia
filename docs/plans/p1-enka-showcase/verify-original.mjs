import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const original = 'D:/Genshin Personal/project-celestia';
const baseline = JSON.parse(
  readFileSync(
    path.join(original, 'docs/plans/p1-hybrid-feasibility/preservation-before.json'),
    'utf8',
  ),
);
const changed = Object.entries(baseline.files)
  .filter(([file, previous]) => {
    const absolute = path.join(original, file);
    if (existsSync(absolute) !== previous.exists) return true;
    if (!previous.exists || !previous.sha256) return false;
    return createHash('sha256').update(readFileSync(absolute)).digest('hex') !== previous.sha256;
  })
  .map(([file]) => file);
const git = (...args) =>
  execFileSync('git', ['-C', original, ...args], {
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
    encoding: 'utf8',
  }).trim();
const result = {
  checkedAt: new Date().toISOString(),
  original,
  reference: 'Prior investigation baseline; all 1722 pre-existing uncommitted paths checked again.',
  checkedPaths: Object.keys(baseline.files).length,
  changed,
  originalHead: git('rev-parse', 'HEAD'),
  originalBranch: git('branch', '--show-current'),
  stagedDiffEmpty: git('diff', '--cached', '--name-only') === '',
};
result.passed =
  changed.length === 0 &&
  result.originalHead === baseline.head &&
  result.originalBranch === baseline.branch &&
  result.stagedDiffEmpty;
writeFileSync(
  new URL('original-preservation.json', import.meta.url),
  JSON.stringify(result, null, 2) + '\n',
);
console.log(JSON.stringify(result));
if (!result.passed) process.exitCode = 1;
