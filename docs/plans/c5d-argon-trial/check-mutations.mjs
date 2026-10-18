import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const api = path.join(root, 'apps/api');
const source = path.join(api, 'src/core/middleware/request-admission.ts');
const baseline = fs.readFileSync(source);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const directory = path.join(root, 'docs/plans/c5d-argon-trial');
const cases = [
  {
    name: 'abort-leaks-owner-permit',
    from: 'workDone = true;',
    to: 'workDone = !req.aborted;',
    expected: 'partial-body test fails',
  },
  {
    name: 'response-close-releases-running-work',
    from: 'if (!workDone || (options.responseMs && !responseDone)) return;',
    to: 'if (options.responseMs && !responseDone) return;',
    expected: 'deadline test fails',
  },
  {
    name: 'deadline-callback-does-not-close',
    from: 'setTimeout(() => res.destroy(), options.responseMs)',
    to: 'setTimeout(() => {}, options.responseMs)',
    expected: 'deadline test times out; runner must exit cleanly',
  },
  {
    name: 'shared-auth-permit-never-released',
    from: 'sharedRelease?.();',
    to: '// Mutation: omit shared permit release.',
    expected: 'potential blind spot: both tests may still pass with one shared slot leaked',
  },
  {
    name: 'shared-auth-leak-only-after-abort',
    from: 'sharedRelease?.();',
    to: 'if (!req.aborted) sharedRelease?.();',
    expected: 'check single shared-slot leak on partial-body abort',
  },
  {
    name: 'shared-auth-leak-only-after-destroy',
    from: 'sharedRelease?.();',
    to: 'if (!res.destroyed) sharedRelease?.();',
    expected: 'check single shared-slot leak on destroyed response',
  },
];
const results = [];
const followup = process.argv.includes('--followup');
for (const item of followup ? cases.slice(4) : cases.slice(0, 4)) {
  if (!fs.readFileSync(source).equals(baseline))
    throw new Error('Source changed outside this runner.');
  const text = baseline.toString('utf8');
  if (text.split(item.from).length !== 2)
    throw new Error(`Mutation target is not unique: ${item.name}`);
  const mutated = Buffer.from(text.replace(item.from, item.to));
  let result;
  try {
    fs.writeFileSync(source, mutated);
    result = spawnSync(
      process.execPath,
      [
        path.join(api, 'node_modules/vitest/vitest.mjs'),
        'run',
        'src/platform/account-data/account-data.http.test.ts',
        '-t',
        'aborted partial JSON|30s response deadline',
        '--no-file-parallelism',
      ],
      {
        cwd: api,
        encoding: 'utf8',
        timeout: 35_000,
        env: { ...process.env, NODE_ENV: 'test', DOTENV_CONFIG_PATH: 'NUL', NO_COLOR: '1' },
      },
    );
  } finally {
    if (!fs.readFileSync(source).equals(mutated))
      throw new Error('Unexpected concurrent edit; refusing to overwrite it.');
    fs.writeFileSync(source, baseline);
  }
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  fs.writeFileSync(path.join(directory, `mutation-${item.name}.log`), output, { flag: 'wx' });
  const record = {
    name: item.name,
    expected: item.expected,
    exitCode: result.status,
    signal: result.signal,
    error: result.error?.message ?? null,
    sourceRestored: fs.readFileSync(source).equals(baseline),
    summary: output
      .split('\n')
      .filter((line) =>
        /Test Files|Tests |FAIL |Error:|AssertionError|expected|Received:/.test(line),
      ),
  };
  results.push(record);
  console.log(JSON.stringify(record));
}
fs.writeFileSync(
  path.join(directory, followup ? 'mutation-followup-results.json' : 'mutation-results.json'),
  JSON.stringify(
    { baselineSha256: hash(baseline), finalSha256: hash(fs.readFileSync(source)), results },
    null,
    2,
  ) + '\n',
  { flag: 'wx' },
);
