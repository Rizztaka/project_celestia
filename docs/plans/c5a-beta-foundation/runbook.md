# Verification and origin configuration

Use the repository root. `pnpm run verify` is the complete verification contract
used locally and by `.github/workflows/ci.yml`; it never calls Turbo. Installed
Node 22.14.0, pnpm 11.18.0 and the existing lockfile are retained. CI installs with
`pnpm install --frozen-lockfile`; this local milestone does not reinstall packages.

## Disposable database contract

Before running, establish ownership of a disposable PostgreSQL instance: verify
absolute data path, filesystem owner, PostgreSQL version, listening address/port
and process command line. Never reuse an unknown port occupant or normal database.
The URL must use PostgreSQL, an explicit loopback host and port, and a database
named `celestia_test_*`, with no query/fragment. Both variables must match exactly.
The existing source guard executes before any verification subprocess, application
import, connection or migration. The entry point additionally rejects a missing
test URL (the lower-level guard permits null for optional focused unit runs) and
requires the current platform's null device. Never load an ordinary `.env`.

PowerShell, with the owned fixture running and an empty disposable database created:

```powershell
Set-Location 'D:\Genshin Personal\project-celestia'
$env:NODE_ENV = 'test'
$env:DOTENV_CONFIG_PATH = 'NUL'
$env:DATABASE_URL = 'postgresql://celestia_test:celestia_test@127.0.0.1:55448/celestia_test_c5a'
$env:CELESTIA_TEST_DATABASE_URL = $env:DATABASE_URL
pnpm run verify
```

Linux / CI, against the job's isolated PostgreSQL 18 service:

```sh
export NODE_ENV=test DOTENV_CONFIG_PATH=/dev/null
export DATABASE_URL=postgresql://celestia_test:celestia_test@127.0.0.1:5432/celestia_test_ci
export CELESTIA_TEST_DATABASE_URL="$DATABASE_URL"
pnpm run verify
```

Credentials above are synthetic disposable credentials. Verification supplies
synthetic JWT/OpenRouter values to children; no external model request is made.
It clears inherited CORS configuration for deterministic local-policy tests.
Required production secret validation in `env.ts` is unchanged. Do not use this
verification helper as a production migration or deployment tool.

## Commands and evidence

The entry point resolves installed package CLI scripts and invokes Node directly,
without shell interpolation. In order:

1. API-installed `tsc -p packages/api-contracts/tsconfig.json` (absolute config path)
   builds/types-checks shared contracts before their consumers.
2. Guarded `pg` connection retries `SELECT 1` for readiness, at most 15 attempts.
3. From `apps/api`: `prisma generate`, `prisma migrate deploy`, `prisma validate`,
   then `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code`.
   Only the existing thirteen migrations apply to the validated disposable target.
4. From `apps/api`: `vitest run --no-file-parallelism --reporter=default --reporter=json --outputFile.json=<fresh-temp-directory>/vitest.json`.
5. Verify the JSON result: every discovered `src/**/*.test.ts` and
   `tooling/**/*.test.js` file must have passed cases, no duplicates, failures,
   skips or todos; aggregate counters must reconcile. The inherited 708/44 baseline
   and six PostgreSQL floors (plan 28, lifecycle 28, routine 12, equipment 13,
   importer 16, catalog 9) are minimums, not exact caps. New tests/files are allowed.
   Intentional restructuring requires an explicit evidence-contract review.
6. From `apps/api`: `eslint . --max-warnings 0`, `tsc`, `tsc-alias`; copy static game
   files into dist, matching the existing API build script.
7. From `apps/web`: `eslint .`, `tsc -b`, `vite build`. Only the Vite build uses
   `NODE_ENV=production` so the shipped bundle uses production React.
8. Root Prettier check covers TS/TSX/JS/JSX/MJS/CJS/JSON/Markdown/YAML/CSS/HTML,
   honoring existing generated/tooling ignores. Only the five exact inherited
   exception paths are excluded after verifying their SHA256 hashes against the
   historical C5 preservation record. Seven unformatted raw C5 JSON captures
   discovered during this run have a separate byte-integrity/JSON-parse check:
   exact paths/hashes in `apps/api/tooling/raw-evidence.json`. They are retained as
   captured data, not rewritten or claimed to pass Prettier. No source tree or
   historical documentation directory is excluded. Finish with `git diff --check`.

Exact `.gitattributes` entries disable newline conversion for those twelve
preserved files. This matters for the two historical CRLF captures: later
authorized staging/checkouts must retain their recorded bytes across platforms.
No repository-wide line-ending rule is introduced.

Each command's nonzero exit stops verification. Vitest JSON and the successful
verification summary are retained in a fresh `celestia-verification-*` temporary
directory (under RUNNER_TEMP in CI). CI uploads these reports even if a later check fails. Console warnings
remain visible, including the inherited pg overlapping-query deprecation.
Workflow parsing and Windows execution do not prove Linux or remote CI execution.

Focused regressions, without a database (database modules are mocked):

```powershell
pnpm --filter @celestia/api exec vitest run src/core/middleware/origin.middleware.test.ts tooling/verification.test.js --no-file-parallelism
```

This focused command is not a replacement for `pnpm run verify`. Raw `vitest run`
can still skip optional PostgreSQL suites without test configuration; only the
verification entry point establishes complete no-skip evidence. Root legacy
Turbo scripts remain for compatibility and must not be used for this milestone.

## Browser origin policy

Set the non-secret `CORS_ALLOWED_ORIGINS` on API startup to a comma-separated list
of exact trusted frontend origins. Configuration replaces defaults; it does not
extend them. Production requires a nonempty list and aborts startup if missing or
malformed. A malformed supplied list also aborts development/test startup.
No real production/preview domain is assumed or configured by this milestone.

Origins consist of HTTP(S) scheme, canonical host spelling and effective port.
Case and default ports normalize (`HTTPS://EXAMPLE.COM:443` equals
`https://example.com`); numeric explicit ports use URL normalization. Use ASCII
hostnames (explicit punycode where needed). Credentials, wildcard entries, `null`,
non-HTTP(S), backslashes, shorthand/hex IPs, whitespace within an origin, paths
(including a final `/`), queries and fragments are invalid. Comma-separated
configuration entries may have surrounding whitespace; request origins may not.
A trusted domain embedded in a different hostname or URL has no significance.
IPv6 must use its canonical bracketed spelling and must be explicitly listed.

With no configuration, development/test allow only:

- `http://localhost:5173` and `http://127.0.0.1:5173` (Vite development).
- `http://localhost:4173` and `http://127.0.0.1:4173` (ordinary Vite preview).
- `http://127.0.0.1:45449` (owned synthetic browser fixture).

No other local port or Vercel tenant is implicitly trusted. Each deployed preview
must be listed explicitly. Restart the API when its allowlist changes.

Absent Origin is accepted for health checks and non-browser clients. An explicit
invalid/untrusted Origin receives HTTP 403 with the normal API envelope and
`CORS_ORIGIN_DENIED`; it is never reflected or logged as an unexpected 500.
All outcomes, including absent/denied origins, carry `Vary: Origin`. Allowed
preflights return 204 with GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS and explicit
Authorization/Content-Type headers. Other requested methods/headers are not granted.

`Access-Control-Allow-Credentials` is omitted. The inspected frontend uses explicit
Bearer authorization and does not request cross-origin cookies. Auth/ownership
still applies to every protected route, including requests without Origin. CORS
does not supply authentication, CSRF protection, rate limiting or abuse controls.

## Local smoke and deployment prerequisites

After building the API, the guarded `apps/api/tooling/origin-browser-fixture.mjs`
seeds only `c5a-smoke@test.invalid` with synthetic password `Celestia-c5a-only!` in
the disposable database and serves the actual app on 127.0.0.1:45448. It has no
wrapper CORS middleware or preflight bypass. Supply the same isolated environment
plus synthetic required secrets and `CORS_ALLOWED_ORIGINS=http://127.0.0.1:45449`.
Build web with `VITE_API_URL=http://127.0.0.1:45448/api/v1`, then run installed Vite
preview on 127.0.0.1:45449 with `--strictPort`. Test login, Today, import preview
and authenticated profile read. Sign out/close the created tab, stop only the
verified owned services, clear the Vite override and rebuild the ordinary web app.

Before any authorized deployment, the operator must identify and configure exact
frontend production/preview origins and verify the frontend's `VITE_API_URL` points
to the compatible API. Preserve required JWT/OpenRouter/database secrets; this
change does not document or replace their values. Test deployed login/preflight,
protected reads and rejected unrelated origins after coordinated cutover. Missing
production CORS configuration intentionally prevents startup. Do not deploy mixed
old/new clients/writers; backup/recovery and existing migration prerequisites
remain separate gates. No provider configuration, CI dispatch or release action
is authorized by this runbook.
