import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const directory = path.join(root, 'docs/plans/c5d-argon-trial');
const attachment =
  'C:/Users/inuzu/.codex/attachments/8c06a13d-3d31-42a9-a06c-7822fbfe6e53/Pasted text.txt';
const original = fs.readFileSync(attachment);
fs.writeFileSync(path.join(directory, 'argon-response.txt'), original, { flag: 'wx' });
const patch =
  original
    .toString('utf8')
    .match(/```diff\r?\n([\s\S]*?)\r?\n```/)[1]
    .replace(/\r\n/g, '\n') + '\n';
fs.writeFileSync(path.join(directory, 'argon-original.patch'), patch, { flag: 'wx' });
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(
  fs.readFileSync(
    'D:/Genshin Personal/celestia-argon-review-2026-10-14/UPLOAD_MANIFEST.json',
    'utf8',
  ),
);
const changed = manifest.sourceFiles
  .filter(
    (entry) => !fs.existsSync(entry.path) || sha256(fs.readFileSync(entry.path)) !== entry.sha256,
  )
  .map((entry) => entry.path);
const missingFromPreparedFolder = manifest.sourceFiles
  .filter(
    (entry) =>
      !fs.existsSync(path.join('D:/Genshin Personal/celestia-argon-review-2026-10-14', entry.path)),
  )
  .map((entry) => entry.path);
const check = spawnSync('git', ['apply', '--check', path.join(directory, 'argon-original.patch')], {
  encoding: 'utf8',
});
const lines = patch.trimEnd().split('\n').slice(3);
const counts = {
  old: lines.filter((line) => /^[ -]/.test(line)).length,
  new: lines.filter((line) => /^[ +]/.test(line)).length,
};
const result = {
  receivedAt: new Date().toISOString(),
  responseSha256: sha256(original),
  snapshotId: manifest.snapshotId,
  changedSourceFiles: changed,
  missingFromPreparedFolder,
  originalPatchCheck: { exitCode: check.status, stdout: check.stdout, stderr: check.stderr },
  actualHunkCounts: counts,
  originalHunkHeader: patch.split('\n')[2],
};
fs.writeFileSync(
  path.join(directory, 'initial-evaluation.json'),
  JSON.stringify(result, null, 2) + '\n',
  { flag: 'wx' },
);
console.log(JSON.stringify(result, null, 2));
