import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { RecoveryError } from './policy.mjs';

export const apiRoot = fileURLToPath(new URL('../../', import.meta.url));
export const repoRoot = resolve(apiRoot, '../..');
export function run(
  executable,
  args,
  env,
  { backgroundLauncher = false, timeout = 180000, input, cwd = apiRoot } = {},
) {
  let result;
  try {
    result = execFileSync(executable, args, {
      env,
      cwd,
      input,
      encoding: 'utf8',
      windowsHide: true,
      stdio: backgroundLauncher ? 'ignore' : ['pipe', 'pipe', 'pipe'],
      timeout,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    const failure = new RecoveryError('SUBPROCESS_FAILED');
    const name = basename(executable).replace(/\.exe$/i, '');
    if (
      [
        'powershell',
        'whoami',
        'icacls',
        'pg_dump',
        'pg_restore',
        'postgres',
        'pg_ctl',
        'pg_controldata',
        'node',
      ].includes(name)
    )
      failure.tool = name;
    failure.exit = Number.isInteger(error.status) ? error.status : null;
    throw failure;
  }
  // Server launchers must not give the background postmaster captured handles.
  // Dump/restore use strictRun, which always captures and rejects diagnostics.
  return result ?? '';
}
export async function strictRun(executable, args, env, timeout = 180000) {
  const { execFile } = await import('node:child_process');
  return new Promise((resolveResult, reject) => {
    execFile(
      executable,
      args,
      { env, cwd: apiRoot, windowsHide: true, timeout, maxBuffer: 32 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error || stderr.trim())
          return reject(
            new RecoveryError(error ? 'SUBPROCESS_FAILED' : 'SUBPROCESS_DIAGNOSTICS_REJECTED'),
          );
        resolveResult(stdout);
      },
    );
  });
}
export function packageCli(pkg, name) {
  const require = createRequire(new URL('../../package.json', import.meta.url));
  const manifest = require.resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifest, 'utf8'));
  return resolve(dirname(manifest), typeof bin === 'string' ? bin : bin[name]);
}
export const packageRun = (pkg, name, args, env, options) =>
  run(process.execPath, [packageCli(pkg, name), ...args], env, options);

export function installedPnpm(env) {
  const pathValue = Object.entries(env).find(([key]) => key.toLowerCase() === 'path')?.[1] ?? '';
  for (const directory of pathValue.split(delimiter)) {
    if (!directory) continue;
    for (const file of ['pnpm.mjs', 'pnpm.cjs']) {
      for (const path of [
        join(directory, 'node_modules/pnpm/bin', file),
        resolve(directory, '../lib/node_modules/pnpm/bin', file),
      ]) {
        if (existsSync(path)) return path;
      }
    }
  }
  throw new RecoveryError('INSTALLED_PNPM_ENTRYPOINT_UNAVAILABLE');
}
