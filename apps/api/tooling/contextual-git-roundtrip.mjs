// Real project policy and pinned bytes, exercised only in an owned disposable Git repository.
import { execFileSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateContextualPack } from '../src/games/genshin/intelligence/guide-knowledge/contextual.pack.ts';
import {
  byteHash,
  loadSelectedRelease,
  releaseMetadata,
  safeReleasePath,
} from '../src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
import { validatePack } from '../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.pack.ts';

const project = fileURLToPath(new URL('../../../', import.meta.url));
const docs = 'docs/plans/contextual-guide-knowledge';
const staticPath = 'apps/api/src/games/genshin/static';
const storePath = `${staticPath}/knowledge-releases`;
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const filesUnder = (root) =>
  readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink()) throw Error('Linked round-trip input.');
    return entry.isDirectory() ? filesUnder(path) : [path];
  });

function removeOwnedGitRoot(root, owner) {
  const target = realpathSync(root);
  if (
    lstatSync(root).isSymbolicLink() ||
    resolve(target).toLowerCase() !== resolve(root).toLowerCase() ||
    !/^celestia-k3-git-roundtrip-[^\\/]+$/.test(relative(realpathSync(tmpdir()), target)) ||
    readFileSync(join(target, 'owner'), 'utf8') !== owner
  )
    throw Error('Refusing cleanup outside the owned Git round-trip directory.');
  rmSync(target, { recursive: true, force: true });
}

export function knowledgeGitRoundTrip(autocrlf, retainedPaths = []) {
  if (![true, false].includes(autocrlf)) throw Error('Explicit checkout mode required.');
  const original = loadSelectedRelease(join(project, storePath));
  const k1 = readJson(join(project, staticPath, 'guide-knowledge.json'));
  const k1Paths = {
    'genshin-db-harbinger': `${docs}/evidence/theBowja--genshin-db/src/data/English/weapons/harbingerofdawn.json`,
    'optimizer-harbinger': `${docs}/evidence/frzyc--genshin-optimizer/libs/gi/sheets/src/Weapons/Sword/HarbingerOfDawn/index.tsx`,
  };
  const k2Inputs = readJson(join(project, docs, 'k2-reviewed-source-inputs.json'));
  const inputs = [
    ...k1.sources.map((source) => ({ ...source, path: k1Paths[source.id] })),
    ...k2Inputs.map((entry) => ({ ...entry, path: `${docs}/${entry.localPath}` })),
  ];
  const pinned = new Set([
    ...filesUnder(join(project, storePath)).map((path) =>
      relative(project, path).replaceAll('\\', '/'),
    ),
    ...inputs.map((entry) => entry.path),
    ...['genshin-db', 'optimizer'].flatMap((name) => [
      `${staticPath}/guide-knowledge-${name}-MIT.txt`,
      `${docs}/evidence/${name === 'genshin-db' ? 'theBowja--genshin-db' : 'frzyc--genshin-optimizer'}/LICENSE`,
    ]),
    `${docs}/k2-reviewed-source-inputs.json`,
  ]);
  // Optional historical artifacts are checked by the explicit candidate proof, not test dependencies.
  for (const path of retainedPaths) {
    if (!path.startsWith(`${docs}/`)) throw Error('Retained evidence must be knowledge-owned.');
    safeReleasePath(project, path);
    pinned.add(path);
  }
  for (const input of inputs)
    if (byteHash(readFileSync(safeReleasePath(project, input.path))) !== input.sha256)
      throw Error('Original pinned input changed.');

  const root = mkdtempSync(join(tmpdir(), 'celestia-k3-git-roundtrip-'));
  const owner = randomUUID();
  writeFileSync(join(root, 'owner'), owner, { flag: 'wx' });
  const repository = join(root, 'repository'),
    checkout = join(root, 'checkout');
  mkdirSync(repository);
  mkdirSync(checkout);
  // Never inherit a caller's alternate index/worktree or system/global Git configuration.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)),
  );
  const nullPath = process.platform === 'win32' ? 'NUL' : '/dev/null';
  Object.assign(env, {
    GIT_CONFIG_NOSYSTEM: '1',
    GIT_CONFIG_GLOBAL: nullPath,
    GIT_ATTR_NOSYSTEM: '1',
    GIT_TERMINAL_PROMPT: '0',
  });
  const git = (...args) =>
    execFileSync('git', ['-c', `core.attributesFile=${nullPath}`, ...args], {
      cwd: repository,
      env,
      encoding: 'utf8',
      windowsHide: true,
      timeout: 30000,
      maxBuffer: 16_000_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
  const control = 'apps/api/src/games/genshin/intelligence/guide-knowledge/contextual.release.ts';
  const rawControl = `${docs}/k3-correction-evidence/git-newline-fixture.json.raw`;
  const candidate = [...pinned, control, '.gitignore', '.gitattributes'];
  let result;
  try {
    // Copy applicable nested policy too, should any be introduced later.
    const policies = new Set(['.gitattributes']);
    for (const path of candidate) {
      safeReleasePath(project, path);
      for (let parent = dirname(path); parent !== '.'; parent = dirname(parent)) {
        const attribute = `${parent.replaceAll('\\', '/')}/.gitattributes`;
        if (existsSync(join(project, attribute))) policies.add(attribute);
      }
    }
    for (const path of new Set([...candidate, ...policies])) {
      mkdirSync(dirname(join(repository, path)), { recursive: true });
      cpSync(safeReleasePath(project, path), join(repository, path));
    }
    const ordinaryOriginHasCrlf = readFileSync(join(repository, control), 'utf8').includes('\r\n');
    // Only this unpinned disposable control has a deliberate LF staging input.
    // Pinned bundle/source/notice copies above remain byte-for-byte unchanged.
    writeFileSync(
      join(repository, control),
      readFileSync(join(repository, control), 'utf8').replace(/\r\n/g, '\n'),
    );
    const mixedBytes = Buffer.from('{"fixture":"LF"}\n{"fixture":"CRLF"}\r\n');
    mkdirSync(dirname(join(repository, rawControl)), { recursive: true });
    writeFileSync(join(repository, rawControl), mixedBytes, { flag: 'wx' });
    pinned.add(rawControl);
    const before = Object.fromEntries(
      [...pinned].sort().map((path) => [path, byteHash(readFileSync(join(repository, path)))]),
    );
    git('init', '--quiet', '--template=');
    git('config', '--local', 'core.autocrlf', String(autocrlf));
    git('config', '--local', 'core.eol', 'lf');
    git('config', '--local', 'core.safecrlf', 'false');
    git('add', '--all');
    const indexed = git('ls-files', '-z').split('\0').filter(Boolean);
    if (![...pinned, control, ...policies].every((path) => indexed.includes(path)))
      throw Error('Required candidate input missing from disposable index.');
    git('checkout-index', '--all', `--prefix=${checkout.replaceAll('\\', '/')}/`);
    const after = Object.fromEntries(
      [...pinned].sort().map((path) => [path, byteHash(readFileSync(join(checkout, path)))]),
    );
    let loaded = null,
      failure = null;
    try {
      loaded = releaseMetadata(loadSelectedRelease(join(checkout, storePath)));
      const checkedK1 = Object.fromEntries(
        inputs.slice(0, 2).map((entry) => [entry.id, readFileSync(join(checkout, entry.path))]),
      );
      validatePack(k1, checkedK1);
      validateContextualPack(
        original.pack,
        Object.fromEntries(
          inputs.slice(2).map((entry) => [entry.id, readFileSync(join(checkout, entry.path))]),
        ),
        original.registry,
      );
    } catch (error) {
      failure = error.message;
    }
    result = {
      autocrlf,
      temporary: root,
      realIndexTouched: false,
      policyHashes: Object.fromEntries(
        [...policies].map((path) => [path, byteHash(readFileSync(join(project, path)))]),
      ),
      beforeIdentity: releaseMetadata(original),
      afterIdentity: loaded,
      failure,
      before,
      after,
      mismatches: Object.keys(before).filter((path) => before[path] !== after[path]),
      recordedInputs: inputs.map(({ id, path, sha256 }) => ({
        id,
        path,
        sha256,
        after: after[path],
      })),
      ordinarySourceAttribute: git('check-attr', 'text', '--', control).trim(),
      ordinaryOriginHasCrlf,
      ordinaryStagedHasCrlf: readFileSync(join(repository, control), 'utf8').includes('\r\n'),
      ordinaryCheckoutHasCrlf: readFileSync(join(checkout, control), 'utf8').includes('\r\n'),
      retainedPaths,
    };
  } finally {
    removeOwnedGitRoot(root, owner);
  }
  return { ...result, temporaryRemoved: !existsSync(root) };
}
