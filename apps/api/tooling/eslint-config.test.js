import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import config from '../eslint.config.js';

const apiRoot = fileURLToPath(new URL('../', import.meta.url));

describe('API lint configuration', () => {
  const apiLint = new ESLint({ cwd: apiRoot });
  let fixtureRoot;
  let fixtureLint;

  beforeAll(async () => {
    fixtureRoot = await mkdtemp(path.join(os.tmpdir(), 'celestia-boundaries-'));
    for (const domain of [
      'platform/users',
      'core/errors',
      'games/genshin/accounts',
      'games/hsr/accounts',
      'games/nikke/accounts',
    ]) {
      const directory = path.join(fixtureRoot, 'src', domain);
      await mkdir(directory, { recursive: true });
      await writeFile(path.join(directory, 'target.ts'), 'export const value = 1;');
    }
    await writeFile(
      path.join(fixtureRoot, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { paths: { '@/*': ['./src/*'] } },
        include: ['src/**/*'],
      }),
    );
    fixtureLint = new ESLint({
      cwd: fixtureRoot,
      overrideConfigFile: true,
      overrideConfig: [
        ...config,
        {
          settings: {
            'boundaries/root-path': fixtureRoot,
            'import/resolver': { typescript: { project: path.join(fixtureRoot, 'tsconfig.json') } },
          },
        },
      ],
    });
  });

  afterAll(async () => {
    if (fixtureRoot) await rm(fixtureRoot, { recursive: true, force: true });
  });

  it.each([
    '../../games/genshin/importer/importer.service.js',
    '@/games/genshin/importer/importer.service.js',
  ])('resolves actual API source import %s', async (source) => {
    const [result] = await apiLint.lintText(`import '${source}';`, {
      filePath: path.join(apiRoot, 'src/platform/users/probe.ts'),
    });
    expect(result.messages.map(({ ruleId }) => ruleId)).toEqual(['boundaries/dependencies']);
  });

  it.each([
    ['platform/users', 'games/genshin/accounts', true],
    ['platform/users', 'games/hsr/accounts', true],
    ['platform/users', 'games/nikke/accounts', true],
    ['games/genshin/accounts', 'games/hsr/accounts', true],
    ['games/hsr/accounts', 'games/genshin/accounts', true],
    ['platform/users', 'core/errors', false],
    ['games/genshin/accounts', 'platform/users', false],
  ])('checks %s → %s (forbidden: %s)', async (from, to, forbidden) => {
    const [result] = await fixtureLint.lintText(`import '@/${to}/target.js';`, {
      filePath: path.join(fixtureRoot, 'src', from, 'probe.ts'),
    });
    expect(result.messages.map(({ ruleId }) => ruleId)).toEqual(
      forbidden ? ['boundaries/dependencies'] : [],
    );
  });

  it('excludes generated output but includes maintained source', async () => {
    expect(await apiLint.isPathIgnored(path.join(apiRoot, 'dist/index.js'))).toBe(true);
    expect(await apiLint.isPathIgnored(path.join(apiRoot, 'src/index.ts'))).toBe(false);
  });
});
