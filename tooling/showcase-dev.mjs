import { randomBytes } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const api = path.join(root, 'apps/api');
const web = path.join(root, 'apps/web');
const contracts = path.join(root, 'packages/api-contracts');
const environment = Object.fromEntries(
  Object.entries(process.env).filter(([key]) =>
    ['path', 'systemroot', 'windir', 'temp', 'tmp', 'comspec', 'pathext'].includes(
      key.toLowerCase(),
    ),
  ),
);
Object.assign(environment, {
  NODE_ENV: 'development',
  DOTENV_CONFIG_PATH: process.platform === 'win32' ? 'NUL' : '/dev/null',
  DATABASE_URL: 'postgresql://synthetic:synthetic@127.0.0.1:1/never_connect',
  JWT_SECRET: randomBytes(32).toString('hex'),
  TRUST_PROXY: 'false',
  PORT: '45750',
  WEB_ORIGIN: 'http://127.0.0.1:45751',
  API_ORIGIN: 'http://127.0.0.1:45750',
  CORS_ALLOWED_ORIGINS: 'http://127.0.0.1:45751',
  VITE_API_URL: 'http://127.0.0.1:45750/api/v1',
});
if (!existsSync(path.join(api, 'node_modules/tsx/dist/cli.mjs'))) {
  console.error('Run pnpm install --frozen-lockfile in this worktree first.');
  process.exit(1);
}
for (const [cwd, args] of [
  [contracts, [path.join(contracts, 'node_modules/typescript/bin/tsc')]],
  [api, [path.join(api, 'node_modules/prisma/build/index.js'), 'generate']],
]) {
  const result = spawnSync(process.execPath, args, { cwd, env: environment, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
const children = [];
let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  children.forEach((child) => child.kill('SIGTERM'));
  process.exitCode = code;
}
const launches = [
  [api, ['--import', 'tsx', 'tooling/showcase-server.mjs']],
  [
    web,
    [
      path.join(web, 'node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '45751',
      '--strictPort',
    ],
  ],
];
for (const [cwd, args] of launches) {
  const child = spawn(process.execPath, args, { cwd, env: environment, stdio: 'inherit' });
  children.push(child);
  child.on('error', () => stop(1));
  child.on('exit', (code) => {
    if (!stopping) stop(code ?? 1);
  });
}
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
console.log('\nProject Celestia: http://127.0.0.1:45751/');
console.log('Public viewer only. No database or credentials configured. Press Ctrl+C to stop.\n');
