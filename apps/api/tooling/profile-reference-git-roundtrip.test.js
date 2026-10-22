import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { ProfileReferenceService } from '../src/games/genshin/characters/profile-reference.service.ts';

const project = fileURLToPath(new URL('../../../', import.meta.url));
const catalog = 'apps/api/src/games/genshin/static/profile-reference';
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
// Keep all Git writes and configuration in disposable repositories. Discard inherited
// Git overrides, including alternate indexes, worktrees, attributes and hooks config.
const env = {
  ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key))),
  GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null',
  GIT_CONFIG_NOSYSTEM: '1',
};
const git = (cwd, args) =>
  execFileSync('git', args, { cwd, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
function removeOwnedDirectory(temp, parent) {
  const owned = resolve(temp);
  if (
    dirname(owned) !== parent ||
    !owned.startsWith(join(parent, 'celestia-profile-roundtrip-')) ||
    realpathSync(owned) !== owned
  )
    throw Error('Refuse cleanup outside the exact task-owned temporary directory');
  rmSync(owned, { recursive: true });
}

describe('profile reference real Git checkout byte preservation', () => {
  it.each([false, true])(
    'retains the reviewed catalog and production reads with core.autocrlf=%s',
    (autocrlf) => {
      const parent = realpathSync(tmpdir());
      const temp = mkdtempSync(join(parent, 'celestia-profile-roundtrip-'));
      try {
        const source = join(temp, 'source');
        const checkout = join(temp, 'checkout');
        mkdirSync(join(source, catalog), { recursive: true });
        copyFileSync(join(project, '.gitattributes'), join(source, '.gitattributes'));
        const files = readdirSync(join(project, catalog));
        const original = new Map();
        for (const file of files) {
          const bytes = readFileSync(join(project, catalog, file));
          original.set(file, digest(bytes));
          copyFileSync(join(project, catalog, file), join(source, catalog, file));
        }
        // Proves the attributes do not turn off conversion for ordinary source files.
        const ordinary = 'ordinary-source.txt';
        const ordinaryLf = 'Ordinary source retains the configured checkout line endings.\n';
        writeFileSync(join(source, ordinary), ordinaryLf);
        git(source, ['init', '--quiet', '--template=']);
        git(source, ['config', 'core.autocrlf', 'false']);
        git(source, ['add', '--', '.gitattributes', catalog, ordinary]);
        git(source, [
          '-c',
          'user.name=Profile Regression',
          '-c',
          'user.email=profile-regression@test.invalid',
          '-c',
          'commit.gpgsign=false',
          'commit',
          '--quiet',
          '-m',
          'Disposable catalog fixture',
        ]);
        git(temp, [
          'clone',
          '--quiet',
          '--no-local',
          '--config',
          `core.autocrlf=${autocrlf}`,
          source,
          checkout,
        ]);
        expect(git(checkout, ['config', '--get', 'core.autocrlf']).toString().trim()).toBe(
          String(autocrlf),
        );
        for (const file of files)
          expect(digest(readFileSync(join(checkout, catalog, file))), file).toBe(
            original.get(file),
          );
        for (const file of ['index.json', 'LICENSE', 'characters-Fischl.json'])
          expect(
            git(checkout, ['check-attr', 'text', '--', `${catalog}/${file}`])
              .toString()
              .trim(),
          ).toBe(`${catalog}/${file}: text: unset`);
        const index = JSON.parse(readFileSync(join(checkout, catalog, 'index.json'), 'utf8'));
        const service = new ProfileReferenceService(join(checkout, catalog));
        const methods = { characters: 'character', weapons: 'weapon', artifacts: 'artifact' };
        const counts = {};
        for (const [kind, method] of Object.entries(methods)) {
          counts[kind] = Object.keys(index[kind]).length;
          for (const [key, entry] of Object.entries(index[kind])) {
            expect(digest(readFileSync(join(checkout, catalog, entry.file))), key).toBe(
              entry.sha256,
            );
            expect(service[method](key).key).toBe(key);
          }
        }
        expect(counts).toEqual({ characters: 129, weapons: 252, artifacts: 63 });
        expect(files).toHaveLength(446);
        expect(git(checkout, ['check-attr', 'text', '--', ordinary]).toString().trim()).toBe(
          `${ordinary}: text: unspecified`,
        );
        expect(readFileSync(join(checkout, ordinary), 'utf8')).toBe(
          autocrlf ? ordinaryLf.replace(/\n/g, '\r\n') : ordinaryLf,
        );
      } finally {
        removeOwnedDirectory(temp, parent);
      }
    },
    30000,
  );
});
