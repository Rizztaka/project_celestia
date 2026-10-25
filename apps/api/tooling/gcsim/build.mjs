import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const revision = 'caf738dc807a646e2eee7e7b572f225dd6deb510';
const source = resolve(process.argv[2] ?? '');
const go = resolve(process.argv[3] ?? '');
if (!process.argv[2] || !process.argv[3])
  throw new Error('Pass the extracted pinned gcsim source and Go binary paths.');
const here = fileURLToPath(new URL('.', import.meta.url));
const publicRoot = resolve(here, '../../../web/public/vendor/gcsim-v2.47.2');
const metadataRoot = resolve(here, '../../../web/src/lib/team-damage');
const builtWasm = join(source, 'cmd/wasm/celestia.wasm');
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const hashText = (path) =>
  createHash('sha256').update(readFileSync(path, 'utf8').replaceAll('\r\n', '\n')).digest('hex');
function copyFileSync(source, destination) {
  if (existsSync(destination)) chmodSync(destination, 0o644);
  writeFileSync(destination, readFileSync(source));
}
if (
  hash(join(source, 'LICENSE')) !==
  'a100d2f2a4f04058c3986861bcb1b27d1a920e9e7b810714fffc3f66c188f6d4'
)
  throw new Error('Pinned MIT license mismatch; do not build from floating main.');
mkdirSync(publicRoot, { recursive: true });
mkdirSync(metadataRoot, { recursive: true });
copyFileSync(join(here, 'celestia.go'), join(source, 'cmd/wasm/celestia.go'));
const env = { ...process.env, GOOS: 'js', GOARCH: 'wasm', GOTOOLCHAIN: 'local' };
execFileSync(
  go,
  ['-C', source, 'build', '-trimpath', '-ldflags=-s -w', '-o', builtWasm, './cmd/wasm'],
  { env, stdio: 'inherit' },
);
writeFileSync(join(publicRoot, 'engine.wasm.gz'), gzipSync(readFileSync(builtWasm), { level: 9 }));
const goroot = execFileSync(go, ['env', 'GOROOT'], { env, encoding: 'utf8' }).trim();
copyFileSync(join(goroot, 'lib/wasm/wasm_exec.js'), join(publicRoot, 'wasm_exec.js'));
copyFileSync(join(goroot, 'LICENSE'), join(publicRoot, 'LICENSE-Go'));
copyFileSync(join(source, 'LICENSE'), join(publicRoot, 'LICENSE'));
const modules = new Set(
  execFileSync(
    go,
    ['-C', source, 'list', '-deps', '-f', '{{if .Module}}{{.Module.Dir}}{{end}}', './cmd/wasm'],
    { env, encoding: 'utf8' },
  )
    .trim()
    .split(/\r?\n/)
    .filter(Boolean),
);
for (const directory of modules) {
  if (directory === source) continue;
  for (const filename of ['LICENSE', 'LICENSE.md', 'LICENSE.txt', 'COPYING']) {
    const path = join(directory, filename);
    if (existsSync(path))
      copyFileSync(
        path,
        join(
          publicRoot,
          `LICENSE-${basename(directory).replaceAll('@', '-')}-${filename.replaceAll('.', '-')}`,
        ),
      );
  }
}
const readData = (name) =>
  JSON.parse(readFileSync(join(source, `ui/packages/ui/src/Data/${name}.dm.json`))).data;
const actions = JSON.parse(
  readFileSync(join(source, 'ui/packages/docs/src/components/Actions/character.dm.json')),
);
const characters = Object.fromEntries(
  Object.values(readData('character')).map((c) => [
    `${c.id}:${c.sub_id}`,
    {
      key: c.key,
      weaponClass: c.weapon_class,
      actions: (actions[c.key] ?? [])
        .filter((a) => !a.invalid)
        .map((a) => ({ action: a.ability, note: a.note ?? null })),
    },
  ]),
);
const weapons = Object.fromEntries(
  Object.values(readData('weapon')).map((w) => [w.id, { key: w.key, weaponClass: w.weapon_class }]),
);
const sets = Object.fromEntries(Object.values(readData('artifact')).map((a) => [a.id, a.key]));
writeFileSync(
  join(metadataRoot, 'engine-metadata.json'),
  JSON.stringify(
    { version: 'gcsim-2.47.2-celestia-1', revision, characters, weapons, sets },
    null,
    2,
  ) + '\n',
);
const manifest = {
  upstream: 'https://github.com/genshinsim/gcsim',
  revision,
  release: 'v2.47.2',
  license: 'MIT',
  bridge: 'apps/api/tooling/gcsim/celestia.go',
  bridgeSha256: hashText(join(here, 'celestia.go')),
  wasmSha256: hash(builtWasm),
  runtimeSha256: hashText(join(publicRoot, 'wasm_exec.js')),
  goVersion: execFileSync(go, ['version'], { encoding: 'utf8' }).trim(),
};
writeFileSync(join(publicRoot, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('Built pinned, seeded browser simulation engine and identity metadata.');
