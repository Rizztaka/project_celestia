import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  apiRoot,
  integrationMinimums,
  repoRoot,
  runVerification,
  validateTestReport,
  verificationEnvironment,
  verifyFormatExceptions,
  verifyRawEvidence,
  waitForDatabase,
} from './verification.mjs';

const url = 'postgresql://synthetic:synthetic@127.0.0.1:55448/celestia_test_verification';
const safe = {
  DATABASE_URL: url,
  CELESTIA_TEST_DATABASE_URL: url,
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: process.platform === 'win32' ? 'NUL' : '/dev/null',
};
function evidence() {
  const counts = { ...integrationMinimums };
  for (let i = 0; i < 38; i++) counts[`src/unit-${i}.test.ts`] = i === 0 ? 565 : 1;
  const report = {
    success: true,
    numFailedTests: 0,
    numFailedTestSuites: 0,
    numPendingTests: 0,
    numTodoTests: 0,
    numPendingTestSuites: 0,
    numTotalTests: 708,
    numPassedTests: 708,
    testResults: Object.entries(counts).map(([path, count]) => ({
      name: join(apiRoot, path),
      status: 'passed',
      assertionResults: Array.from({ length: count }, () => ({ status: 'passed' })),
    })),
  };
  return { report, expected: Object.keys(counts) };
}
function harness() {
  const { report, expected } = evidence();
  const events = [];
  const deps = {
    run: vi.fn((step) => events.push(step.id)),
    ready: vi.fn(async () => events.push('ready')),
    discover: () => expected,
    exceptions: () => ['!exact-preserved-file'],
    readReport: () => report,
    copyStatic: vi.fn(),
    output: () => 'synthetic-output',
    save: vi.fn(),
  };
  return { deps, events, report, expected };
}

describe('Guarded verification orchestration', () => {
  it('safe input reaches ordered readiness, migration, full-suite and package checks', async () => {
    const { deps, events } = harness();
    const result = await runVerification(safe, deps);
    expect(result.tests).toMatchObject({ passed: 708, files: 44, postgresCases: 106, skipped: 0 });
    expect(events).toEqual([
      'shared-types-and-build',
      'ready',
      'prisma-generate',
      'disposable-migrations',
      'prisma-validate',
      'schema-diff',
      'full-suite',
      'api-lint',
      'api-types-and-build',
      'api-aliases',
      'web-lint',
      'web-types',
      'web-build',
      'repository-format',
      'diff-check',
    ]);
    const suite = deps.run.mock.calls.find(([step]) => step.id === 'full-suite')[0];
    expect(suite.args.slice(0, 4)).toEqual([
      'run',
      '--no-file-parallelism',
      '--reporter=default',
      '--reporter=json',
    ]);
    expect(suite.args).toHaveLength(5); // No filename filter can omit future suites.
    expect(deps.copyStatic).toHaveBeenCalledOnce();
    expect(deps.run.mock.calls.find(([step]) => step.id === 'web-build')[1].NODE_ENV).toBe(
      'production',
    );
    expect(deps.run.mock.calls.find(([step]) => step.id === 'full-suite')[1].NODE_ENV).toBe('test');
    expect(deps.save).toHaveBeenCalledOnce();
    expect(deps.run.mock.calls[0][1].JWT_SECRET).toContain('synthetic');
  });
  it.each([
    { CELESTIA_TEST_DATABASE_URL: undefined },
    { DATABASE_URL: undefined },
    { DATABASE_URL: `${url}_other` },
    { CELESTIA_TEST_DATABASE_URL: 'not a URL' },
    {
      DATABASE_URL: url.replace('127.0.0.1', 'db.example'),
      CELESTIA_TEST_DATABASE_URL: url.replace('127.0.0.1', 'db.example'),
    },
    {
      DATABASE_URL: url.replace(':55448', ''),
      CELESTIA_TEST_DATABASE_URL: url.replace(':55448', ''),
    },
    {
      DATABASE_URL: url.replace('celestia_test_verification', 'ordinary'),
      CELESTIA_TEST_DATABASE_URL: url.replace('celestia_test_verification', 'ordinary'),
    },
    { NODE_ENV: 'production' },
    { DOTENV_CONFIG_PATH: undefined },
    { DOTENV_CONFIG_PATH: '.env' },
    { DOTENV_CONFIG_PATH: process.platform === 'win32' ? '/dev/null' : 'NUL' },
  ])('unsafe configuration launches no subprocess or connection: %j', async (change) => {
    const { deps } = harness();
    await expect(runVerification({ ...safe, ...change }, deps)).rejects.toThrow();
    expect(deps.run).not.toHaveBeenCalled();
    expect(deps.ready).not.toHaveBeenCalled();
    expect(deps.save).not.toHaveBeenCalled();
  });
  it('requires the Linux null device when validating Linux configuration', () => {
    expect(
      verificationEnvironment({ ...safe, DOTENV_CONFIG_PATH: '/dev/null' }, 'linux').NODE_ENV,
    ).toBe('test');
    expect(() =>
      verificationEnvironment({ ...safe, DOTENV_CONFIG_PATH: 'NUL' }, 'linux'),
    ).toThrow();
  });
  it('readiness itself guards before even an injected connection', async () => {
    const connect = vi.fn();
    await expect(waitForDatabase({ ...safe, DATABASE_URL: 'unsafe' }, connect)).rejects.toThrow();
    expect(connect).not.toHaveBeenCalled();
    await waitForDatabase(safe, connect);
    expect(connect).toHaveBeenCalledOnce();
  });
  it('stops at an unavailable fixture before migrations', async () => {
    const { deps } = harness();
    deps.ready.mockRejectedValue(new Error('unavailable'));
    await expect(runVerification(safe, deps)).rejects.toThrow('unavailable');
    expect(deps.run.mock.calls.map(([step]) => step.id)).toEqual(['shared-types-and-build']);
  });
  it('propagates migration failures without running the suite or reporting green', async () => {
    const { deps } = harness();
    deps.run.mockImplementation((step) => {
      if (step.id === 'disposable-migrations') throw new Error('migration failed');
    });
    await expect(runVerification(safe, deps)).rejects.toThrow('migration failed');
    expect(deps.run.mock.calls.at(-1)[0].id).toBe('disposable-migrations');
    expect(deps.save).not.toHaveBeenCalled();
  });
  it('rejects actual skipped report evidence before downstream green checks', async () => {
    const { deps, report } = harness();
    report.testResults[0].assertionResults[0].status = 'pending';
    await expect(runVerification(safe, deps)).rejects.toThrow();
    expect(deps.run.mock.calls.at(-1)[0].id).toBe('full-suite');
    expect(deps.save).not.toHaveBeenCalled();
  });
});

describe('Complete result evidence, not reported exit status alone', () => {
  it.each([
    'missing-file',
    'missing-integration',
    'duplicate',
    'skipped',
    'todo',
    'failed',
    'empty',
    'counter-mismatch',
    'top-level-failure',
    'new-undiscovered-suite',
  ])('rejects %s evidence', (failure) => {
    const { report, expected } = evidence();
    if (failure === 'missing-file') report.testResults.pop();
    if (failure === 'missing-integration') {
      report.testResults.shift();
      expected.shift();
    }
    if (failure === 'duplicate') report.testResults.push(report.testResults[0]);
    if (failure === 'skipped') report.numPendingTests = 1;
    if (failure === 'todo') report.testResults[0].assertionResults[0].status = 'todo';
    if (failure === 'failed') report.testResults[0].status = 'failed';
    if (failure === 'empty') report.testResults[0].assertionResults = [];
    if (failure === 'counter-mismatch') report.numPassedTests--;
    if (failure === 'top-level-failure') report.success = false;
    if (failure === 'new-undiscovered-suite') expected.push('src/new.test.ts');
    expect(() => validateTestReport(report, expected)).toThrow();
  });
  it('enforces every integration floor even when total counts remain high', () => {
    const { report, expected } = evidence();
    report.testResults[0].assertionResults.pop();
    report.testResults.at(-1).assertionResults.push({ status: 'passed' });
    expect(() => validateTestReport(report, expected)).toThrow('PostgreSQL coverage missing');
  });
  it('permits new tests and files above the baseline', () => {
    const { report, expected } = evidence();
    expected.push('tooling/addition.test.js');
    report.testResults.push({
      name: join(apiRoot, expected.at(-1)),
      status: 'passed',
      assertionResults: [{ status: 'passed' }],
    });
    report.numPassedTests++;
    report.numTotalTests++;
    expect(validateTestReport(report, expected)).toMatchObject({ passed: 709, files: 45 });
  });
});

describe('Narrow formatting preservation', () => {
  it('parses and hash-checks only the seven exact immutable C5 JSON captures', () => {
    const paths = verifyRawEvidence();
    expect(paths).toHaveLength(7);
    expect(
      paths.every(
        (path) => path.startsWith('!docs/plans/c5-companion-beta/') && path.endsWith('.json'),
      ),
    ).toBe(true);
  });
  it('fails closed if a captured evidence file changes', () => {
    expect(() =>
      verifyRawEvidence((path) =>
        path.endsWith('/primary-reflow.json')
          ? Buffer.from('{}')
          : readFileSync(join(repoRoot, path)),
      ),
    ).toThrow('Historical raw evidence changed');
  });
  it('checks the five real exception hashes and only returns those paths', () => {
    expect(verifyFormatExceptions()).toEqual([
      '!apps/api/src/core/ai/openrouter.ts',
      '!docs/plans/c2a-clock-task-reliability/sonnet-walkthrough-submitted.md',
      '!apps/web/index.html',
      '!apps/web/src/App.css',
      '!apps/web/src/index.css',
    ]);
  });
  it('rejects changed exception bytes without changing the real file', () => {
    expect(() =>
      verifyFormatExceptions((path) =>
        path === 'apps/web/index.html'
          ? Buffer.from('changed')
          : readFileSync(join(repoRoot, path)),
      ),
    ).toThrow('Formatting exception changed');
  });
});
