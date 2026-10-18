import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { emptyDatabase, planTargets, privateDirectory, privateWrite } from './recovery/fixture.mjs';
import {
  assertEqualSnapshots,
  containedPath,
  isolatedEnvironment,
  ownedTarget,
  RecoveryError,
  safeFailure,
  sha256,
  targetEnvironment,
  validatePair,
  validateTarget,
  validateVersions,
} from './recovery/policy.mjs';
import { run, strictRun } from './recovery/process.mjs';
import {
  dumpOwnedArchive,
  parseArguments,
  recoveryRun,
  restoreOwnedArchive,
} from './recovery/rehearse.mjs';

const input = {
  NODE_ENV: 'test',
  DOTENV_CONFIG_PATH: process.platform === 'win32' ? 'NUL' : '/dev/null',
};
const base = isolatedEnvironment(input);
const fixture = {
  version: 1,
  syntheticOnly: true,
  exclusive: true,
  host: '127.0.0.1',
  port: 55448,
  adminDatabase: 'celestia_test_admin',
  adminRole: 'celestia_test',
  pgBin: '/synthetic/tools',
};
const targets = () => planTargets(fixture, base, '0123456789abcdef');
const directories = [];
const temporary = () => {
  const root = mkdtempSync(join(tmpdir(), 'celestia-recovery-unit-'));
  directories.push(root);
  return root;
};
afterEach(() => {
  // Only exact files in directories allocated by this test are removed; no recursive deletion.
  for (const root of directories.splice(0)) {
    for (const name of ['application.dump', 'pgpass', 'test.json']) {
      if (existsSync(join(root, name))) unlinkSync(containedPath(root, join(root, name)));
    }
    rmdirSync(root);
  }
});

describe('C5b preconnection recovery gates', () => {
  it.each([
    ['missing mode', {}],
    ['wrong mode', { ...input, NODE_ENV: 'production' }],
    ['dotenv enabled', { ...input, DOTENV_CONFIG_PATH: '.env' }],
    [
      'wrong null device',
      { ...input, DOTENV_CONFIG_PATH: process.platform === 'win32' ? '/dev/null' : 'NUL' },
    ],
    ...[
      'PGHOST',
      'PGHOSTADDR',
      'PGPORT',
      'PGDATABASE',
      'PGUSER',
      'PGPASSWORD',
      'PGSERVICE',
      'PGSERVICEFILE',
      'PGPASSFILE',
      'PGOPTIONS',
      'PGSSLMODE',
      'PGDATA',
      'pgservice',
      'DATABASE_URL',
      'CELESTIA_TEST_DATABASE_URL',
      'NODE_OPTIONS',
      'PRISMA_CONFIG',
      'DOTENV_CONFIG_OVERRIDE',
    ].map((key) => [key, { ...input, [key]: 'untrusted-value' }]),
  ])('rejects %s before any fixture or database-capable operation', async (_label, env) => {
    const inspect = vi.fn(),
      directory = vi.fn(),
      closedPort = vi.fn();
    await expect(
      recoveryRun({ fixture }, env, { inspect, directory, closedPort }),
    ).rejects.toThrow();
    expect(inspect).not.toHaveBeenCalled();
    expect(directory).not.toHaveBeenCalled();
    expect(closedPort).not.toHaveBeenCalled();
  });
  it('whitelists child environment and does not inherit app secrets or settings', () => {
    const env = isolatedEnvironment({
      ...input,
      JWT_SECRET: 'ordinary',
      OPENROUTER_API_KEY: 'ordinary',
      CORS_ALLOWED_ORIGINS: 'ordinary',
      VITE_API_URL: 'ordinary',
      OTHER_SECRET: 'ordinary',
      NODE_PATH: 'pnpm-supplied-module-path',
      PATH: 'path',
    });
    expect(env.JWT_SECRET).toContain('synthetic');
    expect(env.OPENROUTER_API_KEY).toContain('synthetic');
    expect(env).not.toHaveProperty('CORS_ALLOWED_ORIGINS');
    expect(env).not.toHaveProperty('OTHER_SECRET');
    expect(env).not.toHaveProperty('VITE_API_URL');
    expect(env).not.toHaveProperty('NODE_PATH');
    expect(env.PATH).toBe('path');
  });
  it.each([
    'missing',
    'mismatched',
    'remote',
    'ordinary',
    'query',
    'fragment',
    'no-port',
    'mode',
    'dotenv',
  ])('rejects %s target using unchanged disposable guard', (kind) => {
    const { source } = targets();
    const env = { ...source.env };
    const value = new URL(env.DATABASE_URL);
    if (kind === 'missing') delete env.CELESTIA_TEST_DATABASE_URL;
    if (kind === 'mismatched') env.DATABASE_URL += '_other';
    if (kind === 'remote') value.hostname = 'db.example';
    if (kind === 'ordinary') value.pathname = '/ordinary';
    if (kind === 'query') value.search = '?host=remote';
    if (kind === 'fragment') value.hash = '#fragment';
    if (kind === 'no-port') value.port = '';
    if (kind === 'mode') env.NODE_ENV = 'production';
    if (kind === 'dotenv') env.DOTENV_CONFIG_PATH = '.env';
    if (['remote', 'ordinary', 'query', 'fragment', 'no-port'].includes(kind))
      env.DATABASE_URL = env.CELESTIA_TEST_DATABASE_URL = value.href;
    expect(() => validateTarget(env)).toThrow();
  });
  it.each(['127.0.0.1', 'localhost', '[::1]'])(
    'rejects the same database through loopback alias %s and different credentials',
    (host) => {
      const { source } = targets();
      const other = targetEnvironment(base, {
        ...source,
        host,
        role: 'another_role',
        password: 'different-synthetic',
      });
      expect(() => validatePair(source.env, other)).toThrow('SAME_DATABASE_REJECTED');
    },
  );
  it('rejects distinct endpoints, unowned identity and endpoint mismatch', () => {
    const { source, restore } = targets();
    expect(() =>
      validatePair(source.env, targetEnvironment(base, { ...restore, port: 55449 })),
    ).toThrow('ONE_FIXTURE_ENDPOINT_REQUIRED');
    expect(() => ownedTarget(source, fixture, new Set())).toThrow('UNOWNED_DATABASE');
    expect(() => ownedTarget({ ...source, port: 55449 }, fixture, new Set())).toThrow(
      'TARGET_RECORD_ENVIRONMENT_MISMATCH',
    );
  });
  it.each(['syntheticOnly', 'exclusive', 'host', 'adminDatabase', 'adminRole'])(
    'rejects fixture declaration %s before inspection',
    async (key) => {
      const inspect = vi.fn();
      await expect(
        recoveryRun({ fixture: { ...fixture, [key]: false } }, input, { inspect }),
      ).rejects.toThrow();
      expect(inspect).not.toHaveBeenCalled();
    },
  );
  it.each(['--output', '--archive', '--source', '--destination', '--clean', '--create'])(
    'rejects unsupported path/target/override option %s',
    (arg) => {
      expect(() => parseArguments(['--fixture', 'test.json', arg, 'anything'])).toThrow();
    },
  );
  it('requires fixture and rejects unsafe output before operation', async () => {
    expect(() => parseArguments([])).toThrow();
    const inspect = vi.fn();
    await expect(
      recoveryRun({ fixture, output: '../existing' }, input, { inspect }),
    ).rejects.toThrow('UNSUPPORTED_RECOVERY_INPUT');
    expect(inspect).not.toHaveBeenCalled();
    const root = temporary();
    expect(() => containedPath(root, join(root, '../elsewhere'), false)).toThrow(
      'UNSAFE_OUTPUT_PATH',
    );
    expect(() => containedPath(root, root)).toThrow('UNSAFE_OUTPUT_PATH');
    privateWrite(root, 'test.json', '{}');
    expect(() => privateWrite(root, 'test.json', 'overwrite')).toThrow();
    expect(readFileSync(join(root, 'test.json'), 'utf8')).toBe('{}');
  });
  it('failed permission setup removes its newly allocated empty directory', () => {
    let allocated;
    expect(() =>
      privateDirectory(base, (root) => {
        allocated = root;
        throw new RecoveryError('PRIVATE_ACL_NOT_ESTABLISHED');
      }),
    ).toThrow('PRIVATE_ACL_NOT_ESTABLISHED');
    expect(existsSync(allocated)).toBe(false);
  });
  it('requires installed matching tool/server majors', () => {
    const versions = Object.fromEntries(
      ['pg_dump', 'pg_restore', 'postgres', 'pg_ctl'].map((key) => [
        key,
        `${key} (PostgreSQL) 18.4`,
      ]),
    );
    expect(validateVersions(versions)).toBe(18);
    expect(() => validateVersions({ ...versions, pg_dump: 'pg_dump (PostgreSQL) 17.9' })).toThrow(
      'INCOMPATIBLE_POSTGRES_TOOLS',
    );
    expect(() => validateVersions({ ...versions, postgres: 'unknown' })).toThrow();
    expect(() => validateVersions({})).toThrow();
    expect(() => run(join(temporary(), 'missing-tool'), ['--version'], base)).toThrow(
      'SUBPROCESS_FAILED',
    );
  });
});

describe('C5b dump/restore cannot become partial green evidence', () => {
  const context = () => {
    const { source, restore } = targets();
    source.oid = 1;
    restore.oid = 2;
    return {
      root: temporary(),
      source,
      restore,
      fixture,
      base,
      owned: new Set([source, restore]),
      archives: new Set(),
      passfile: 'private-passfile',
    };
  };
  const fakeClient = (count = 0) => ({
    query: vi.fn().mockResolvedValue({
      rows: [
        { relations: count, routines: 0, types: 0, schemas: 0, extensions: 0, largeobjects: 0 },
      ],
    }),
    end: vi.fn(),
  });
  const archiveFor = (ctx) => {
    const path = privateWrite(ctx.root, 'application.dump', 'synthetic test bytes');
    const archive = { path, sha256: sha256(readFileSync(path)) };
    ctx.archives.add(archive);
    return archive;
  };
  it('failed dump never registers an archive or creates success', async () => {
    const ctx = context(),
      invoke = vi.fn().mockRejectedValue(new RecoveryError('SUBPROCESS_FAILED'));
    await expect(dumpOwnedArchive(ctx, { invoke })).rejects.toThrow('SUBPROCESS_FAILED');
    expect(ctx.archives.size).toBe(0);
    expect(existsSync(join(ctx.root, 'success.json'))).toBe(false);
  });
  it('complete dump uses no filters, URLs or password arguments and registers only its own file', async () => {
    const ctx = context();
    const invoke = vi.fn(async (_executable, args, env) => {
      expect(args).toContain('--format=custom');
      expect(args.join(' ')).not.toMatch(/postgresql:|password=|--(table|schema|exclude)/);
      expect(env.PGPASSFILE).toBe(ctx.passfile);
      writeFileSync(args[args.indexOf('--file') + 1], 'complete synthetic archive');
    });
    const archive = await dumpOwnedArchive(ctx, { invoke });
    expect(ctx.archives.has(archive)).toBe(true);
    expect(archive.bytes).toBeGreaterThan(0);
    expect(archive.sha256).toHaveLength(64);
  });
  it('nonempty destination stops before pg_restore and always closes inspection connection', async () => {
    const ctx = context(),
      archive = archiveFor(ctx),
      client = fakeClient(1),
      invoke = vi.fn();
    await expect(
      restoreOwnedArchive(ctx, ctx.restore, archive, { connect: async () => client, invoke }),
    ).rejects.toThrow('NONEMPTY_RESTORE_TARGET');
    expect(invoke).not.toHaveBeenCalled();
    expect(client.end).toHaveBeenCalledOnce();
  });
  it.each(['relations', 'routines', 'types', 'schemas', 'extensions', 'largeobjects'])(
    'empty validation includes %s',
    async (field) => {
      const client = { query: async () => ({ rows: [{ [field]: 1 }] }) };
      await expect(emptyDatabase(client)).rejects.toThrow('NONEMPTY_RESTORE_TARGET');
    },
  );
  it('unowned archive and changed archive never connect', async () => {
    const ctx = context(),
      archive = archiveFor(ctx),
      connect = vi.fn();
    await expect(
      restoreOwnedArchive(ctx, ctx.restore, { ...archive }, { connect }),
    ).rejects.toThrow('ARCHIVE_NOT_PRODUCED_BY_RUN');
    writeFileSync(archive.path, 'changed');
    await expect(restoreOwnedArchive(ctx, ctx.restore, archive, { connect })).rejects.toThrow(
      'ARCHIVE_CHANGED',
    );
    expect(connect).not.toHaveBeenCalled();
  });
  it('same or unowned destination cannot connect', async () => {
    const ctx = context(),
      archive = archiveFor(ctx),
      connect = vi.fn();
    await expect(restoreOwnedArchive(ctx, ctx.source, archive, { connect })).rejects.toThrow(
      'SAME_DATABASE_REJECTED',
    );
    ctx.owned.delete(ctx.restore);
    await expect(restoreOwnedArchive(ctx, ctx.restore, archive, { connect })).rejects.toThrow(
      'UNOWNED_DATABASE',
    );
    expect(connect).not.toHaveBeenCalled();
  });
  it.each(['database', 'role', 'password', 'port', 'host'])(
    'target record/env mismatch %s launches no connection',
    async (field) => {
      const ctx = context(),
        archive = archiveFor(ctx),
        connect = vi.fn();
      ctx.restore[field] = field === 'port' ? 55449 : 'different';
      await expect(restoreOwnedArchive(ctx, ctx.restore, archive, { connect })).rejects.toThrow(
        'TARGET_RECORD_ENVIRONMENT_MISMATCH',
      );
      expect(connect).not.toHaveBeenCalled();
    },
  );
  it('background launch uses no captured stdout handles', () => {
    expect(
      run(process.execPath, ['-e', 'process.stdout.write("private launcher output")'], base, {
        backgroundLauncher: true,
      }),
    ).toBe('');
  });
  it('failed restore propagates failure with atomic, no-owner, no-clean flags', async () => {
    const ctx = context(),
      archive = archiveFor(ctx),
      client = fakeClient();
    const invoke = vi.fn(async (_exe, args) => {
      expect(args).toEqual(
        expect.arrayContaining([
          '--single-transaction',
          '--exit-on-error',
          '--no-owner',
          '--no-acl',
          '--no-tablespaces',
        ]),
      );
      expect(args).not.toContain('--clean');
      expect(args).not.toContain('--create');
      throw new RecoveryError('SUBPROCESS_FAILED');
    });
    await expect(
      restoreOwnedArchive(ctx, ctx.restore, archive, { connect: async () => client, invoke }),
    ).rejects.toThrow('SUBPROCESS_FAILED');
    expect(existsSync(join(ctx.root, 'success.json'))).toBe(false);
  });
  it('a nonzero subprocess and zero-exit stderr diagnostics both fail closed', async () => {
    await expect(strictRun(process.execPath, ['-e', 'process.exit(7)'], base)).rejects.toThrow(
      'SUBPROCESS_FAILED',
    );
    await expect(
      strictRun(process.execPath, ['-e', 'process.stderr.write("warning: missing data")'], base),
    ).rejects.toThrow('SUBPROCESS_DIAGNOSTICS_REJECTED');
  });
  it.each([
    [{ id: 'one' }, { id: 'two' }],
    [{ value: null }, { value: 0 }],
    [{ value: null }, {}],
    [{ revision: 7 }, { revision: 6 }],
    [{ date: '00:00:00.001' }, { date: '00:00:00.000' }],
    [
      { sequence: { last: '9007199254740993', called: true } },
      { sequence: { last: '9007199254740992', called: true } },
    ],
  ])('does not normalize away complete-value mismatch case %#', (a, b) => {
    expect(() => assertEqualSnapshots(a, b)).toThrow('DATA_FIDELITY_MISMATCH');
  });
  it('redaction never serializes arbitrary process, SQL, URL, token or password data', () => {
    const error = Object.assign(
      new Error('postgresql://secret:password@127.0.0.1/db Bearer token password hash'),
      { stdout: 'raw table', stderr: 'password=leak', code: 'also-untrusted' },
    );
    expect(safeFailure(error)).toEqual({ code: 'UNEXPECTED_FAILURE_DETAILS_WITHHELD' });
    expect(safeFailure(new RecoveryError('DATA_FIDELITY_MISMATCH'))).toEqual({
      code: 'DATA_FIDELITY_MISMATCH',
    });
  });
});
