# C5a implementation plan

Owner-authorized local execution, 2026-10-10. Only the verified D: checkout is used.
HEAD is `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, branch master, index empty.
[Starting state](starting-state.json) records the dirty status, 721 source/evidence
hashes and all 26 protected/migration/formatter group entries; all match C5.
Inherited C1–C5 changes remain intact. No agents, branch changes, staging,
dependency changes, remote CI, deployment or normal database operations.

## Scope and ordering

1. Reproduce R1 using the existing guard and R2 against the unchanged compiled
   Express app, with isolated synthetic environment and no database connection.
2. Add a direct verification entry point under `apps/api/tooling`, regression
   tests, a root `verify` command and replace CI's fragmented Turbo path.
   Validate the source disposable guard before any subprocess; require matching
   URLs, test mode and the platform null dotenv file. Supply synthetic secrets.
   Build contracts, wait for isolated PostgreSQL, generate Prisma, deploy existing
   migrations, validate/diff schema, run the complete serial Vitest suite, verify
   real JSON results, then API/shared/web types, lint/build and formatting.
   Require all discovered suites plus six named integration minima (28/28/12/13/16/9),
   no non-passing cases, and no shrinking below the inherited baseline. Additions
   are allowed. Reject missing/duplicate/partial evidence and failed subprocesses.
3. Check formatting across relevant repository files with only the five exact,
   hash-verified inherited exceptions; preserve historical evidence bytes. No
   whole-tree formatting or additional blanket exclusions.
4. Add focused CORS configuration and middleware modules and actual-app HTTP tests;
   replace only the app's CORS wiring. Preserve `env.ts`, `.env.example`, API manifest,
   migrations, schemas, client/session behavior and all product contracts.
5. Exercise the entry point end to end on the verified owned PostgreSQL 18 fixture,
   plus a failing unsafe invocation. Smoke-test real login, Today, import preview
   and authenticated read in the browser through the actual origin middleware.
6. Persist walkthrough, results, runbook, sanitized logs and final preservation;
   update current handoff/readiness links while retaining historical C5 artifacts.
   Restore ordinary web build/browser state and close only owned fixture processes.

## Exact origin contract

`CORS_ALLOWED_ORIGINS` is a comma-separated nonempty list of HTTP(S) origins.
Configuration replaces defaults. Production requires it; missing/blank/malformed
production configuration stops startup. Malformed supplied configuration also
stops development/test startup. Development/test defaults: HTTP localhost and
127.0.0.1 at ports 5173 and 4173, plus HTTP 127.0.0.1:45449 for the owned fixture.
No other localhost ports, subdomains or preview tenants are implicitly trusted.
Normalize scheme/hostname case and default ports; reject wildcards, credentials,
opaque null, non-HTTP(S), any slash after authority (including `/`), query/fragment,
whitespace within entries, backslashes and noncanonical numeric-IP spellings.
Entries may have surrounding whitespace for comma-list readability.
Request origins use the same parser without trimming. Absent Origin is permitted
for non-browser/health clients and still requires route authentication.
Disallowed/malformed origins receive 403 `CORS_ORIGIN_DENIED` in the API envelope,
no reflected allow-origin and no internal-error log. All responses vary on Origin.
Allow preflight GET/HEAD/POST/PUT/PATCH/DELETE/OPTIONS and Authorization/Content-Type.
Remove allow-credentials: the current client sends explicit bearer headers and
does not request cross-origin cookies. CORS does not replace auth/ownership,
CSRF protection or request limits. Real production/preview origins remain an
operator prerequisite; none are guessed or configured externally.

## Acceptance cases

- Safe verification reaches readiness/migration/full-suite/check commands; absent,
  mismatched, non-loopback, ordinary-name, wrong-mode or enabled-dotenv inputs
  launch no database-capable subprocess. Missing/skipped evidence fails closed.
- Actual HTTP allowed/custom/local/default-port origins, ordinary denied origins,
  attacker localhost/127.0.0.1/vercel lookalikes, arbitrary previews, wrong scheme/
  port, null/malformed/absent origins, valid/denied preflight and Vary behavior.
- Allowed origin cannot read/write protected routes with missing/invalid bearer;
  existing ownership tests remain in the complete suite. Production invalid
  configuration and required-secret validation remain effective without real DB.
- Complete inherited 708/44/106 coverage plus new regressions; meaningful package
  types/lint/build/format, guarded schema checks and diff check. Record Windows
  local evidence separately from unexecuted Linux/GitHub CI and beta readiness.

Potential scope additions must be explained here. Browser fixture changes, if
needed, must route through the production policy rather than masking preflight.

## Reconciled during execution

The first full run passed 794/46/106, then the repository format check found seven
unformatted raw C5 JSON captures beyond the five inherited source/document
exceptions. Reformatting them would rewrite historical evidence. The seven exact
paths and original hashes are therefore recorded in `apps/api/tooling/raw-evidence.json`;
verification parses their JSON and enforces byte integrity, while Prettier checks
all other relevant files. No historical directory or source tree is excluded,
and the five original exceptions remain unchanged. The failed first run is kept.
This is an explicit preservation policy for captured data, not a claim that those
raw files passed Prettier. Also set NODE_ENV=production only for the Vite build;
all database-capable commands and the complete suite remain in test mode.

Byte inspection found CRLF in the original Sonnet submission and raw C5 starting
state. Add exact-path `.gitattributes` entries for the five exceptions and seven
raw captures to disable Git newline conversion. Validate clean-filter identity
without staging: this preserves the recorded hashes in a later authorized Linux
checkout instead of weakening the integrity check or editing historical bytes.
