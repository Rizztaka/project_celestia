import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
const original = 'D:/Genshin Personal/project-celestia';
const git = (...args) =>
  execFileSync('git', ['-C', original, ...args], {
    encoding: 'utf8',
    env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' },
  }).trim();
const output = new URL('preservation-before.json', import.meta.url);
const sha = (file) =>
  existsSync(path.join(original, file))
    ? createHash('sha256')
        .update(readFileSync(path.join(original, file)))
        .digest('hex')
    : null;
if (process.argv.includes('--check')) {
  const before = JSON.parse(readFileSync(output, 'utf8'));
  const changed = Object.entries(before.files)
    .filter(([f, h]) => sha(f) !== h)
    .map(([f]) => f);
  const result = {
    checkedAt: new Date().toISOString(),
    checkedPaths: Object.keys(before.files).length,
    changed,
    headUnchanged: git('rev-parse', 'HEAD') === before.head,
    branchUnchanged: git('branch', '--show-current') === before.branch,
    indexUnchanged: git('diff', '--cached', '--binary') === before.index,
  };
  result.passed =
    !changed.length && result.headUnchanged && result.branchUnchanged && result.indexUnchanged;
  writeFileSync(
    new URL('preservation-after.json', import.meta.url),
    JSON.stringify(result, null, 2) + '\n',
  );
  console.log(JSON.stringify(result));
} else {
  const files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z')
    .split('\0')
    .filter(Boolean);
  const result = {
    at: new Date().toISOString(),
    original,
    head: git('rev-parse', 'HEAD'),
    branch: git('branch', '--show-current'),
    index: git('diff', '--cached', '--binary'),
    files: Object.fromEntries(files.map((f) => [f, sha(f)])),
  };
  writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
  console.log(JSON.stringify({ paths: files.length, head: result.head, branch: result.branch }));
}
