import { createHash, randomBytes } from 'node:crypto';
import { lstatSync, realpathSync } from 'node:fs';
import { isAbsolute, relative, resolve, sep } from 'node:path';

import { disposableTestDatabase } from '../../src/core/db/disposable-test-database.ts';

export class RecoveryError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
export function requireSafe(condition, code) {
  if (!condition) throw new RecoveryError(code);
}
// Deliberately discard arbitrary exception messages/stdout/stderr: these can contain
// SQL values, credentials, URLs, tokens or binary archive contents.
export function safeFailure(error) {
  return {
    code: error instanceof RecoveryError ? error.code : 'UNEXPECTED_FAILURE_DETAILS_WITHHELD',
    ...(error instanceof RecoveryError && error.tool ? { tool: error.tool, exit: error.exit } : {}),
    ...(error instanceof RecoveryError && error.ownedDirectoryRetained
      ? { ownedDirectoryRetained: error.ownedDirectoryRetained }
      : {}),
  };
}
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const quote = (name) => '"' + name.replaceAll('"', '""') + '"';

export function isolatedEnvironment(input, platform = process.platform) {
  requireSafe(input.NODE_ENV === 'test', 'TEST_MODE_REQUIRED');
  requireSafe(
    input.DOTENV_CONFIG_PATH === (platform === 'win32' ? 'NUL' : '/dev/null'),
    'NULL_DOTENV_REQUIRED',
  );
  requireSafe(
    !Object.keys(input).some(
      (key) =>
        /^PG/i.test(key) ||
        /^(DATABASE_URL|CELESTIA_TEST_DATABASE_URL|NODE_OPTIONS|PRISMA_CONFIG)$/i.test(key) ||
        (/^DOTENV_/i.test(key) && key !== 'DOTENV_CONFIG_PATH'),
    ),
    'INHERITED_CONNECTION_OR_LOADER_SETTING',
  );
  const env = {};
  for (const [key, value] of Object.entries(input)) {
    if (
      /^(path|systemroot|windir|comspec|pathext|temp|tmp|home|userprofile|appdata|localappdata|username|userdomain)$/i.test(
        key,
      )
    )
      env[key] = value;
  }
  return {
    ...env,
    NODE_ENV: 'test',
    DOTENV_CONFIG_PATH: platform === 'win32' ? 'NUL' : '/dev/null',
    JWT_SECRET: 'c5b-synthetic-' + randomBytes(32).toString('hex'),
    JWT_EXPIRY: '1h',
    OPENROUTER_API_KEY: 'c5b-synthetic-unused-' + randomBytes(16).toString('hex'),
    CELESTIA_RECOVERY_LOGIN_PASSWORD: randomBytes(32).toString('hex'),
    TZ: 'UTC',
    LC_ALL: 'C',
  };
}

export function targetEnvironment(base, target) {
  const url = new URL('postgresql://127.0.0.1');
  url.hostname = target.host;
  url.port = String(target.port);
  url.pathname = '/' + target.database;
  url.username = target.role;
  url.password = target.password;
  return { ...base, DATABASE_URL: url.href, CELESTIA_TEST_DATABASE_URL: url.href };
}
export function validateTarget(env, platform = process.platform) {
  try {
    requireSafe(!!disposableTestDatabase(env), 'TARGET_REQUIRED');
    requireSafe(
      env.DOTENV_CONFIG_PATH === (platform === 'win32' ? 'NUL' : '/dev/null'),
      'NULL_DOTENV_REQUIRED',
    );
    const url = new URL(env.DATABASE_URL);
    requireSafe(!!url.username && !!url.password, 'SYNTHETIC_CREDENTIALS_REQUIRED');
    return { database: url.pathname.slice(1), port: Number(url.port), host: url.hostname };
  } catch (error) {
    if (error instanceof RecoveryError) throw error;
    throw new RecoveryError('UNSAFE_DATABASE_TARGET');
  }
}
export function validatePair(source, destination) {
  const a = validateTarget(source),
    b = validateTarget(destination);
  requireSafe(a.port === b.port, 'ONE_FIXTURE_ENDPOINT_REQUIRED');
  // All accepted loopback spellings refer to the single verified fixture.
  requireSafe(a.database !== b.database, 'SAME_DATABASE_REJECTED');
}
export function ownedTarget(target, fixture, owned) {
  validateTargetRecord(target);
  requireSafe(
    target.host === '127.0.0.1' && target.port === fixture.port,
    'FIXTURE_ENDPOINT_MISMATCH',
  );
  requireSafe(owned.has(target) && Number.isInteger(target.oid), 'UNOWNED_DATABASE');
}
export function validateTargetRecord(target) {
  const value = validateTarget(target.env);
  const url = new URL(target.env.DATABASE_URL);
  requireSafe(
    value.database === target.database &&
      value.host === target.host &&
      value.port === target.port &&
      decodeURIComponent(url.username) === target.role &&
      decodeURIComponent(url.password) === target.password,
    'TARGET_RECORD_ENVIRONMENT_MISMATCH',
  );
}
export function containedPath(root, path, mustExist = true) {
  const base = realpathSync(root);
  const full = resolve(path);
  const rel = relative(base, full);
  requireSafe(
    rel !== '' && !rel.startsWith('..' + sep) && rel !== '..' && !isAbsolute(rel),
    'UNSAFE_OUTPUT_PATH',
  );
  let current = base;
  for (const part of rel.split(sep)) {
    current = resolve(current, part);
    if (current === full && !mustExist) break;
    requireSafe(!lstatSync(current).isSymbolicLink(), 'LINK_PATH_REJECTED');
  }
  return full;
}
export function validateVersions(versions) {
  const majors = Object.values(versions).map((v) => Number(/PostgreSQL\)?\s+(\d+)\./.exec(v)?.[1]));
  requireSafe(
    majors.length >= 4 && majors.every((v) => Number.isInteger(v) && v >= 18 && v === majors[0]),
    'INCOMPATIBLE_POSTGRES_TOOLS',
  );
  return majors[0];
}
export function assertEqualSnapshots(expected, actual) {
  requireSafe(JSON.stringify(expected) === JSON.stringify(actual), 'DATA_FIDELITY_MISMATCH');
}
