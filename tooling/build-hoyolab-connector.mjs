import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
mkdirSync(new URL('../apps/web/public/downloads/', import.meta.url), { recursive: true });
// Python's standard library creates a portable zip without adding a production dependency.
execFileSync(
  'python',
  [
    '-c',
    `import pathlib,zipfile
r=pathlib.Path(${JSON.stringify(root)})
with zipfile.ZipFile(r/'apps/web/public/downloads/celestia-hoyolab-connector.zip','w',zipfile.ZIP_DEFLATED) as z:
 for name in ['manifest.json','policy.js','bridge.js','popup.html','popup.css','popup.js','README.md']:
  data=(r/'extensions/hoyolab-connector'/name).read_text(encoding='utf-8').encode('utf-8')
  info=zipfile.ZipInfo(name,date_time=(2026,1,1,0,0,0))
  z.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED)`,
  ],
  { stdio: 'inherit' },
);
