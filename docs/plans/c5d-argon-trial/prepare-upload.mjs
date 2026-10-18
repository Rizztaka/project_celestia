import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const root = fs.realpathSync(process.cwd());
const destination = path.resolve(root, '../celestia-argon-review-2026-10-14');
if (fs.existsSync(destination))
  throw new Error('Destination already exists; refusing to overwrite.');
const git = (...args) => execFileSync('git', args, { cwd: root, encoding: 'utf8' });
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const candidates = new Set(
  git('ls-files', '-z', '--cached', '--others', '--exclude-standard').split('\0').filter(Boolean),
);
for (const name of [
  '.agents/AGENTS.md',
  '.agents/rules/architecture.md',
  '.agents/rules/gemini-architect.md',
  '.agents/rules/claude-implementer.md',
  '.agents/skills/scaffold-domain-feature/SKILL.md',
  '.agents/skills/build-intelligence-engine/SKILL.md',
])
  candidates.add(name);

const safeEvidence = new Set([
  'changed-files.json',
  'preservation-check.json',
  'validation-results.json',
  'cleanup.json',
]);
const textExtensions = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.yaml',
  '.yml',
  '.sql',
  '.prisma',
  '.html',
  '.css',
  '.scss',
  '.txt',
  '.toml',
  '.svg',
  '.sh',
  '.ps1',
]);
function exclusion(name) {
  const parts = name.split('/');
  const base = parts.at(-1);
  if (parts.some((part) => /^\.env(?:\.|$)/i.test(part))) return 'environment file';
  if (
    parts.some((part) =>
      [
        '.git',
        'node_modules',
        '.turbo',
        '.next',
        'dist',
        'coverage',
        'generated',
        'screenshots',
        'logs',
      ].includes(part),
    )
  )
    return 'generated/dependency/evidence directory';
  if (/\.(log|pem|key|p12|pfx|dump|bak|sqlite|db|zip|jpg|jpeg|png|webp|mp4|pdf)$/i.test(base))
    return 'log, binary, credentials or private-data format';
  if (/^(\.npmrc|\.netrc|\.pypirc|credentials.*|id_rsa.*|id_ed25519.*)$/i.test(base))
    return 'credential configuration';
  if (name.startsWith('docs/plans/c5d-argon-trial/') && base !== 'prompt.md')
    return 'local trial tooling/evaluation';
  if (
    name.startsWith('docs/plans/') &&
    path.extname(base) === '.json' &&
    !(name.startsWith('docs/plans/c5d-account-data/') && safeEvidence.has(base))
  )
    return 'historical raw evidence/manifest';
  if (
    !textExtensions.has(path.extname(base)) &&
    ![
      '.gitignore',
      '.gitattributes',
      '.prettierignore',
      '.prettierrc',
      'Dockerfile',
      '.dockerignore',
      'LICENSE',
    ].includes(base)
  )
    return 'outside source-text allowlist';
  return null;
}

const excluded = [];
const selected = [];
const suspicious = [];
const secretPatterns = [
  /AIza[0-9A-Za-z_-]{35}/,
  /AKIA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /sk-(?:proj-|live-)?[A-Za-z0-9_-]{40,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const name of [...candidates].sort()) {
  const reason = exclusion(name);
  if (reason) {
    excluded.push({ path: name, reason });
    continue;
  }
  const source = path.resolve(root, name);
  const relative = path.relative(root, source);
  if (relative.startsWith('..') || path.isAbsolute(relative))
    throw new Error(`Unsafe source path: ${name}`);
  if (!fs.existsSync(source)) {
    excluded.push({ path: name, reason: 'deleted in working tree' });
    continue;
  }
  const realRelative = path.relative(root, fs.realpathSync(source));
  if (
    realRelative.startsWith('..') ||
    path.isAbsolute(realRelative) ||
    fs.lstatSync(source).isSymbolicLink()
  )
    throw new Error(`Symlink/outside source: ${name}`);
  const bytes = fs.readFileSync(source);
  if (bytes.includes(0)) throw new Error(`Unexpected binary: ${name}`);
  if (secretPatterns.some((pattern) => pattern.test(bytes.toString('utf8')))) suspicious.push(name);
  selected.push({ path: name, bytes: bytes.length, sha256: hash(bytes), content: bytes });
}
if (suspicious.length)
  throw new Error(
    `Potential credentials require inspection (values withheld): ${suspicious.join(', ')}`,
  );
const head = git('rev-parse', 'HEAD').trim();
const branch = git('branch', '--show-current').trim();
const createdAt = new Date().toISOString();
const snapshotId = hash(
  JSON.stringify(selected.map(({ path: name, sha256 }) => ({ path: name, sha256 }))),
);
fs.mkdirSync(destination);
for (const file of selected) {
  const target = path.join(destination, file.path);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, file.content, { flag: 'wx' });
}
const prompt = fs.readFileSync(path.join(root, 'docs/plans/c5d-argon-trial/prompt.md'));
fs.writeFileSync(path.join(destination, 'ARGON_PROMPT.md'), prompt, { flag: 'wx' });
const info = `# Project Celestia — Argon trial snapshot\n\nPrepared ${createdAt}.\n\nSnapshot identity: ${snapshotId}\n\nSource HEAD: ${head}; branch: ${branch}. This is a copy of the CURRENT WORKING TREE, including uncommitted source, not a clean checkout of HEAD.\n\nRead ARGON_PROMPT.md for the current task. Historical documents describe prior tasks and roles.\n\nThis folder is a static source review bundle. Environment files (including examples), Git metadata, dependencies, generated output, logs, binary media and historical raw JSON evidence are omitted. Selected C5d validation summaries are retained as prior evidence only. Omitted files can still be referenced by historical manifests; consult UPLOAD_MANIFEST.json. The bundle is not a complete execution environment.\n\nSource files are copied byte-for-byte. UPLOAD_MANIFEST.json records their hashes and omissions. A limited scan found no matches for common API-key/private-key patterns; this is not a guarantee that arbitrary secrets are absent. Test fixtures contain synthetic credentials by design.\n\nDo not claim to have run local tests unless you actually execute them. Provide the proposed test diff for local validation. No files have been uploaded automatically.\n`;
fs.writeFileSync(path.join(destination, 'SNAPSHOT_INFO.md'), info, { flag: 'wx' });
const manifest = {
  createdAt,
  snapshotId,
  head,
  branch,
  sourceKind: 'current working tree including uncommitted files',
  sourceFiles: selected.map(({ content, ...entry }) => entry),
  generatedFiles: ['ARGON_PROMPT.md', 'SNAPSHOT_INFO.md'].map((name) => {
    const bytes = fs.readFileSync(path.join(destination, name));
    return { path: name, bytes: bytes.length, sha256: hash(bytes) };
  }),
  excluded,
  secretScan:
    'No common API-key or private-key signature matches in selected source text; limited pattern scan only. Environment files were excluded before reading.',
};
fs.writeFileSync(
  path.join(destination, 'UPLOAD_MANIFEST.json'),
  JSON.stringify(manifest, null, 2) + '\n',
  { flag: 'wx' },
);
for (const file of selected) {
  if (
    hash(fs.readFileSync(path.join(root, file.path))) !== file.sha256 ||
    hash(fs.readFileSync(path.join(destination, file.path))) !== file.sha256
  )
    throw new Error(`Source/copy changed: ${file.path}`);
}
const receipt = {
  createdAt,
  destination,
  snapshotId,
  head,
  branch,
  sourceFileCount: selected.length,
  totalFileCount: selected.length + 3,
  sourceBytes: selected.reduce((sum, file) => sum + file.bytes, 0),
  excludedCount: excluded.length,
  sourceAndCopyHashesVerified: true,
  uploaded: false,
};
fs.writeFileSync(
  path.join(root, 'docs/plans/c5d-argon-trial/upload-receipt.json'),
  JSON.stringify(receipt, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(receipt, null, 2));
