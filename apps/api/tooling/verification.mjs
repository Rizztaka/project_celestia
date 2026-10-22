import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';

export const apiRoot = fileURLToPath(new URL('../', import.meta.url));
export const repoRoot = resolve(apiRoot, '../..');
const webRoot = resolve(repoRoot, 'apps/web');
export const integrationMinimums = {
  'src/platform/companion/plan.integration.test.ts': 28,
  'src/platform/companion/goal-lifecycle.integration.test.ts': 28,
  'src/platform/companion/routine.integration.test.ts': 12,
  'src/games/genshin/characters/character-equipment.integration.test.ts': 13,
  'src/games/genshin/importer/importer.integration.test.ts': 16,
  'src/platform/companion/catalog-advice.integration.test.ts': 9,
};

export function verificationEnvironment(input, platform = process.platform) {
  // This source guard has no dotenv/application/database imports. Never replace it with a fallback.
  if (!disposableTestDatabase(input)) throw new Error('CELESTIA_TEST_DATABASE_URL is required.');
  if (input.DOTENV_CONFIG_PATH !== (platform === 'win32' ? 'NUL' : '/dev/null'))
    throw new Error('DOTENV_CONFIG_PATH must be the platform null device.');
  const env = {
    ...input,
    JWT_SECRET: 'c5a-synthetic-verification-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
    OPENROUTER_API_KEY: 'c5a-synthetic-unused-key',
  };
  // Verification always exercises the documented local policy; deployment config is separate.
  delete env.CORS_ALLOWED_ORIGINS;
  return env;
}

export function discoverTests() {
  function walk(dir) {
    return readdirSync(join(apiRoot, dir), { withFileTypes: true }).flatMap((entry) => {
      const path = `${dir}/${entry.name}`;
      return entry.isDirectory() ? walk(path) : [path];
    });
  }
  return [
    ...walk('src').filter((p) => p.endsWith('.test.ts')),
    ...walk('tooling').filter((p) => p.endsWith('.test.js')),
  ].sort();
}

export function validateTestReport(report, expectedFiles) {
  if (
    report.success !== true ||
    report.numFailedTests !== 0 ||
    report.numFailedTestSuites !== 0 ||
    report.numPendingTests !== 0 ||
    (report.numTodoTests ?? 0) !== 0 ||
    (report.numPendingTestSuites ?? 0) !== 0 ||
    !Array.isArray(report.testResults)
  )
    throw new Error('Full-suite result is unsuccessful, skipped or incomplete.');
  const files = new Map();
  let passed = 0;
  for (const result of report.testResults) {
    const name = relative(apiRoot, result.name).replaceAll('\\', '/');
    if (
      files.has(name) ||
      result.status !== 'passed' ||
      !result.assertionResults?.length ||
      result.assertionResults.some((test) => test.status !== 'passed')
    )
      throw new Error('Duplicate, empty, skipped or failing test file evidence.');
    files.set(name, result.assertionResults.length);
    passed += result.assertionResults.length;
  }
  if (
    files.size !== expectedFiles.length ||
    expectedFiles.some((name) => !files.has(name)) ||
    files.size < 44 ||
    passed < 708 ||
    report.numTotalTests !== passed ||
    report.numPassedTests !== passed
  )
    throw new Error('Full-suite discovery or accumulated baseline evidence is missing.');
  const integration = {};
  for (const [name, minimum] of Object.entries(integrationMinimums)) {
    if ((files.get(name) ?? 0) < minimum)
      throw new Error(`Required PostgreSQL coverage missing: ${name}`);
    integration[name] = files.get(name);
  }
  return {
    passed,
    files: files.size,
    failed: 0,
    skipped: 0,
    postgresCases: Object.values(integration).reduce((a, b) => a + b, 0),
    integration,
  };
}

export function verifyFormatExceptions(read = (path) => readFileSync(join(repoRoot, path))) {
  const record = JSON.parse(read('docs/plans/c5-companion-beta/preservation-check.json'));
  const inherited = Object.entries(record.formatterExceptions);
  if (inherited.length !== 5) throw new Error('Expected five inherited formatting exceptions.');
  // Retired AI/starter files and modernized UI source no longer inherit an
  // unchanged-file exception. Keep checking the original historical document.
  const modernized = new Set([
    'apps/api/src/core/ai/openrouter.ts',
    'apps/web/index.html',
    'apps/web/src/App.css',
    'apps/web/src/index.css',
  ]);
  const exceptions = inherited.filter(([path]) => !modernized.has(path));
  for (const [path, { sha256 }] of exceptions) {
    const actual = createHash('sha256').update(read(path)).digest('hex').toUpperCase();
    if (actual !== sha256) throw new Error(`Formatting exception changed: ${path}`);
  }
  return exceptions.map(([path]) => `!${path}`);
}

export function verifyRawEvidence(read = (path) => readFileSync(join(repoRoot, path))) {
  const { files } = JSON.parse(read('apps/api/tooling/raw-evidence.json'));
  return Object.entries(files).map(([path, hash]) => {
    if (!/^docs\/plans\/c5-companion-beta\/[a-z-]+\.json$/.test(path))
      throw new Error('Raw evidence integrity policy cannot exclude source or directories.');
    const bytes = read(path);
    if (createHash('sha256').update(bytes).digest('hex').toUpperCase() !== hash)
      throw new Error(`Historical raw evidence changed: ${path}`);
    JSON.parse(bytes);
    return `!${path}`;
  });
}

function cli(pkg, name, cwd) {
  const require = createRequire(join(cwd, 'package.json'));
  const manifest = require.resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8'));
  return resolve(dirname(manifest), typeof bin === 'string' ? bin : bin[name]);
}

export function runStep(step, env) {
  console.log(`CHECK ${step.id}`);
  const executable = step.pkg ? process.execPath : step.executable;
  const args = step.pkg ? [cli(step.pkg, step.bin, step.cwd), ...step.args] : step.args;
  // No shell interpolation, no dotenv loader, no URL/secret in command arguments.
  execFileSync(executable, args, { cwd: step.cwd, env, stdio: 'inherit' });
}

export async function waitForDatabase(env, connect) {
  verificationEnvironment(env);
  if (!connect) {
    const { Client } = await import('pg');
    connect = async () => {
      const client = new Client({
        connectionString: env.DATABASE_URL,
        connectionTimeoutMillis: 1000,
      });
      try {
        await client.connect();
        await client.query('SELECT 1');
      } finally {
        await client.end();
      }
    };
  }
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      await connect();
      return;
    } catch {
      if (attempt === 15) throw new Error('Disposable PostgreSQL was not ready after 15 attempts.');
      await new Promise((done) => setTimeout(done, 1000));
    }
  }
}

export async function runVerification(input, dependencies = {}) {
  const env = verificationEnvironment(input); // Must precede even prerequisite subprocesses.
  const {
    run = runStep,
    ready = waitForDatabase,
    discover = discoverTests,
    exceptions = verifyFormatExceptions,
    rawEvidence = verifyRawEvidence,
    readReport = (path) => JSON.parse(readFileSync(path, 'utf8')),
    copyStatic = () =>
      cpSync(
        join(apiRoot, 'src/games/genshin/static'),
        join(apiRoot, 'dist/games/genshin/static'),
        { recursive: true },
      ),
    output = () => mkdtempSync(join(env.RUNNER_TEMP || tmpdir(), 'celestia-verification-')),
    save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n'),
  } = dependencies;
  const excluded = [...exceptions(), ...rawEvidence()];
  const expectedFiles = discover();
  const directory = output();
  console.log(`Verification evidence directory: ${directory}`);
  const reportPath = join(directory, 'vitest.json');
  const steps = [];
  const check = (id, pkg, bin, args, cwd = apiRoot, commandEnv = env) => {
    run({ id, pkg, bin, args, cwd }, commandEnv);
    steps.push({
      id,
      package: pkg,
      binary: bin,
      arguments: args,
      cwd: relative(repoRoot, cwd) || '.',
      nodeEnv: commandEnv.NODE_ENV,
      exit: 0,
    });
  };
  check('shared-types-and-build', 'typescript', 'tsc', [
    '-p',
    join(repoRoot, 'packages/api-contracts/tsconfig.json'),
  ]);
  console.log('CHECK disposable-postgres-ready');
  await ready(env);
  steps.push({ id: 'disposable-postgres-ready', exit: 0 });
  check('prisma-generate', 'prisma', 'prisma', ['generate']);
  check('disposable-migrations', 'prisma', 'prisma', ['migrate', 'deploy']);
  check('prisma-validate', 'prisma', 'prisma', ['validate']);
  check('schema-diff', 'prisma', 'prisma', [
    'migrate',
    'diff',
    '--from-config-datasource',
    '--to-schema',
    'prisma/schema.prisma',
    '--exit-code',
  ]);
  check('full-suite', 'vitest', 'vitest', [
    'run',
    '--no-file-parallelism',
    '--reporter=default',
    '--reporter=json',
    `--outputFile.json=${reportPath}`,
  ]);
  const tests = validateTestReport(readReport(reportPath), expectedFiles);
  console.log(`VERIFIED ${JSON.stringify(tests)}`);
  check('api-lint', 'eslint', 'eslint', ['.', '--max-warnings', '0']);
  check('api-types-and-build', 'typescript', 'tsc', []);
  check('api-aliases', 'tsc-alias', 'tsc-alias', []);
  copyStatic();
  check('web-lint', 'eslint', 'eslint', ['.'], webRoot);
  check('web-types', 'typescript', 'tsc', ['-b'], webRoot);
  check('web-build', 'vite', 'vite', ['build'], webRoot, { ...env, NODE_ENV: 'production' });
  check(
    'repository-format',
    'prettier',
    'prettier',
    ['--check', '**/*.{ts,tsx,js,jsx,mjs,cjs,json,md,yml,yaml,css,html}', ...excluded],
    repoRoot,
  );
  run({ id: 'diff-check', executable: 'git', args: ['diff', '--check'], cwd: repoRoot }, env);
  steps.push({ id: 'diff-check', exit: 0 });
  const result = { tests, steps, platform: process.platform, remoteCIObserved: false };
  save(join(directory, 'verification.json'), result);
  console.log(`Verification evidence: ${directory}`);
  return result;
}
