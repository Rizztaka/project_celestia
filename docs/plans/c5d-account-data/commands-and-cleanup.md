# Local commands and cleanup — 2026-10-14

PowerShell in `D:\Genshin Personal\project-celestia`. Installed tools only. No Turbo,
dotenv inspection, ordinary database URL, dependency change or remote operation.

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json' --verify
```

This unchanged command creates separate source/restore/verification databases,
generates private credentials and runs the complete preserved `pnpm run verify`
implementation. No custom suite discovery/floors, migration set or recovery guard
was changed. The old broken C5b fixture was never repaired or substituted.

```powershell
$env:NODE_ENV='test'
$env:DOTENV_CONFIG_PATH='NUL'
pnpm --filter @celestia/api exec tsx tooling/account-data-browser.mjs --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5c-request-safety\review-fixture.json'
```

Harness stdin supports `snapshot`, `advance`, `exhaust-account`, `verify-download`,
`measure-substantial`, `hold-export`, `hold-delete`, `release-response`, and `quit`.
The verify-download command reads only the private `browser-export.json` copied
from the actual browser download. It does not replace that browser action with an
API response. Post-operation gates exercise account switching after actual work.
The larger measurement uses a real importer and actual composed HTTP export.

Focused final command, from `apps/api`, with the same null-dotenv/test settings:

```powershell
pnpm exec vitest run src/platform/account-data/account-data.http.test.ts tooling/account-data-client.test.js tooling/account-data.test.js src/core/middleware/request-admission.test.ts --no-file-parallelism
```

Result: 51/51 across four files. Earlier focused logs are retained honestly: an eager
auth import initially loaded env in a pure admission test, fixed by deferred import;
a paused loopback-reader test assumed TCP backpressure, replaced by deterministic
Node response completion gating. No controls were disabled to pass tests.

Diagnostics after the second full attempt used package API/web lint, API type check,
direct web `node node_modules/typescript/bin/tsc -b`, and the same whole-repository
Prettier check/exclusions as the verifier. A guessed web `check-types` script does
not exist; direct tsc passed. Format was fixed only on the new client test. No old
formatter exceptions or raw-evidence manifests were rewritten.

The browser-discovered focus correction was rebuilt with Vite using the synthetic
loopback VITE_API_URL and verified after reload. An initial immediate action during
reload reached the old transient page; a fresh DOM inspection and loaded-page retry
passed. Final harness cleanup rebuilt without this override.

The first recovery attempt (`celestia-recovery-Lex4RR`) passed dump/restore and 1,001
of 1,003 tests. Two old query-count assertions needed the intentional new identity
SELECTs; they now explicitly assert id-only SELECT counts while retaining original
domain query and read-only assertions. Second (`celestia-recovery-bYL7gx`) passed
1,003/1,003 tests, then the wrapper reported downstream verification failure without
child diagnostics. Reproduction found one new client-test formatting error; package
lint and types passed. Both attempts cleaned every fresh
database/role/tablespace and credential file and stopped only the owned process.
Final attempt details are in [verification-attempts.json](verification-attempts.json).

Final unchanged command succeeded at `celestia-recovery-ddoi0x`: **1,004/1,004 tests,
55 files, zero failures/skips**, all package/schema/format/integrity/diff steps passed.
The verifier retains its historical classifier of 106; actual database cases are
106 + 7 C5c + 20 C5d = 133. Private full verification report is under
`C:\Users\inuzu\AppData\Local\Temp\celestia-verification-GlXetJ`.
Final test implementation was unchanged after this run; only result/checkpoint and
evidence metadata were finalized, formatted and hash-checked afterward.
Independent port checks and resource results are in [cleanup.json](cleanup.json).

Browser private root: `C:\Users\inuzu\AppData\Local\Temp\celestia-recovery-4VpGWI`.
Private raw archives/logs/export remain outside Git under protected owner-only ACLs;
private PostgreSQL fixture WAL/catalog files remain in the recorded inherited owned
cluster. Fresh databases/roles/tablespaces and generated credential files are removed.
The exact created browser tab is closed and temporary viewport reset. Browser helper
confirms restored ordinary web build and closed ports 45448/45449/55448. No inherited
directory was recursively deleted. Final recovery confirms its own cleanup too.

`record-evidence.mjs [final-recovery-root] [verification-directory]` writes only
metadata, safe counts/hashes and approved baseline comparisons. Run it again after
formatting the evidence to refresh new artifact hashes. Its two manifest outputs
exclude themselves to avoid recursive hashes. Historical files/manifests remain
byte-identical, except the two explicitly dated cumulative handoff/roadmap additions.
