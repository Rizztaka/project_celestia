# C5c local request safety

Implemented 2026-10-11–12 in the existing D: checkout. This is an in-process
application safeguard. No production/provider/proxy configuration was observed or
changed. No release, invitation, remote CI, account-data procedure or C6/C7 action.

## Policy and ordering

[Endpoint matrix](endpoint-policy.md) is the exact default policy. Values live in
`apps/api/src/core/config/request-safety.ts`; no new environment variables or
dependencies were introduced. The protected environment module is unchanged.
The production export remains `app`. `createApp({ policy, clock })` creates fresh
validated state for deterministic tests; production never branches on test mode
to disable admission. The normal clock is monotonic `performance.now()`.

The login burst leaves room for ordinary corrections; the smaller registration
budget limits repeated cost-12 hashing/account creation. Six import requests allow
three preview/commit pairs before requiring refill. Four auth and two import slots
are deliberately conservative local bounds. These are engineering defaults for
this checkpoint, not measured production capacity or an operator-approved policy.

Helmet and exact-origin CORS run first. Allowed preflight exits there. Health
responds without body parsing or rate admission. Exact auth POST handlers admit
the direct socket identity before parsing or calling auth services. Exact GOOD
POST handlers verify the existing bearer token, then admit the verified subject
before parsing. Preview/commit share both rate and concurrency state. All retained
domain routes receive the ordinary parser, including NIKKE/endgame. Status/me GETs
remain authenticated and use the ordinary parser if a client supplies a body.
Query strings, case and optional trailing slashes match the same controlled route;
prefixes, suffixes and other methods cannot access the large parser or POST service.

Only uncompressed UTF-8 `application/json` is supported for nonempty bodies.
Optional quoted/unquoted `charset=utf-8` and case differences are accepted.
Missing/wrong media type, other charset and gzip/br/deflate/unknown compression
receive 415. Malformed JSON receives 400; bytes above the inclusive limit receive 413. Native HTTP framing failures rejected by Node before Express are outside this
JSON middleware contract. Empty bodies retain existing route validation behavior.

The installed Express 5.2.1 / body-parser 2.3.0 reader checks declared length before
buffering and counts streamed bytes. It drains a rejected upload before delivering
its callback and 413; it does not buffer beyond the ceiling or inflate compressed
content. A peer that stops sending can hold an admitted body-read slot until its
connection closes or the server request timeout fires. The policy bounds admitted
heavy work, not total sockets, ordinary requests, network bandwidth or slow clients.
Deployment still needs explicit HTTP timeouts, connection limits and provider
controls. No unbounded queue is introduced. Rate/capacity checks are bounded linear
scans of at most the configured entries.

Only errors from our parser callback are classified as parser errors. Raw parser
exceptions, submitted body and parser diagnostics never reach logs/responses.
Unexpected parser failures become a safe generic error; arbitrary downstream
`type`/`status` fields cannot masquerade as parser failures. Other unexpected service
errors retain existing internal-error behavior. Request logs retain method only,
omitting attacker-supplied URLs/query strings as well as bodies/headers.

## Identity, memory, concurrency and retry

`trust proxy` is explicitly false. Identity reads `req.socket.remoteAddress`, never
Forwarded, X-Forwarded-For, X-Real-IP, body identity or email. IPv4-mapped IPv6 folds
to IPv4; IPv6 spelling canonicalizes and OS scope suffixes are removed. Unknown or
invalid peer addresses share one bucket. Login and register counters are separate,
but their work pool is shared. Account/email lockouts are not implemented.
Import owner identity comes exclusively from verified JWT `sub`; token generation,
verification and ownership rules are unchanged.

Only fixed 64-character SHA256 identity keys and numeric refill deadlines are
retained: at most 2,048 login + 2,048 registration + 1,024 import entries per app.
No emails, passwords, raw addresses, JWTs, import rows or unbounded identity strings
are stored in rate state/logs. Fully refilled entries expire lazily on the next
admission; idle expired entries may remain allocated within that fixed cap. No
cleanup timer is needed. New identities at capacity receive 429 until the earliest
full refill; active debt is never evicted. Denied depleted attempts do not prolong
the debt. Available tokens are consumed even when parsing/validation/service or
concurrency admission subsequently fails. No refunds on failure.

Auth admits 4 in flight globally and 2 per socket, across login/registration.
Imports admit 2 globally and 1 per owner, across preview/commit. Parsing owns a
permit too. A disconnected parse releases and never starts the service. Once a
password operation/transaction starts, its promise must settle before release,
even if the response finishes/closes. Release is idempotent. Existing transactions
may finish after a client disconnect; an uncertain write outcome still requires a
fresh preview in the UI. There is no automatic replay or partial success response.

429 uses `RATE_LIMITED` for debt/capacity or `REQUEST_BUSY` for concurrent work.
`Retry-After` is a positive whole second: time to the next token, earliest expiry
at capacity, or 1 second for a busy pool. Busy guidance is an estimate, not a
reservation. The safe JSON message includes the seconds, so existing browser UI
shows guidance without changing CORS exposed headers. 429 never logs the user out.
Import input, chosen scope, confirmations and preview remain available for an
explicit retry. Session guards discard an old owner's response after a switch.

Counters reset on process restart. Every worker/process/instance has independent
budgets; do not multiply instances and describe this as distributed enforcement.
A shared NAT or reverse proxy groups auth clients by socket peer. Proxy-aware
identity is an explicit deployment gate: identify actual ingress, validate a
bounded trust configuration and test spoof resistance before changing this policy.
Never set `trust proxy=true` or guess a hop count.

## GOOD support limits

The matrix documents inclusive section/combined, text, nesting and node limits.
They apply to selected and unselected sections and unknown exporter fields before
Zod cloning, fingerprints, repository reads or mutations. Known key/source strings
above 128 produce existing `VALIDATION_ERROR`; generic text/depth/item overflow
produces `IMPORT_RESOURCE_LIMIT`. Nonfinite numbers are rejected. Section omission,
explicit empty replacements, opaque keys within limits and independent receipts
retain their contracts. No truncation or silent partial import is performed.

The repository fetches at most each inventory ceiling plus one sentinel. If a
legacy stored section or combined state exceeds the limit, preview/commit rejects
before returning that snapshot; the sentinel is never used as a partial inventory.
Character merge also checks resulting union/overall counts, so repeated imports
cannot accumulate an unlimited roster. An oversized legacy account requires a
separately reviewed support/recovery procedure; this milestone does not silently
delete or repair it. Current fixtures and the 9,500-item measured export fit.

## Exact local validation

From the repository root, with installed dependencies and tools. Never invoke
Turbo, load normal `.env`, or connect a normal database. Start from a shell without
DATABASE_URL, CELESTIA_TEST_DATABASE_URL, PG*, NODE_OPTIONS, Prisma or extra dotenv
overrides; do not print their values. The unchanged C5b command verifies stopped
fixture provenance/OS/process identity and creates fresh source, restore and suite
databases, generating private credentials internally.

```powershell
Set-Location 'D:\Genshin Personal\project-celestia'
$env:NODE_ENV = 'test'
$env:DOTENV_CONFIG_PATH = 'NUL'
pnpm run recovery:rehearse --fixture 'D:\Genshin Personal\project-celestia\docs\plans\c5b-recovery-foundation\local-fixture.json' --verify
```

This runs the complete unchanged `pnpm run verify`, all existing discovery/floors,
package lint/types/builds, thirteen migrations, guarded schema validation/diff,
format/integrity and diff checks. The new integration suite additionally reuses
the synthetic 20-table seed in the separate verification DB, compares exact
canonical rows privately and retains only safe hashes/counts in evidence. Nothing
is reset or mutated in the recovery source/restore DB by those tests.

Focused database-free checks, not a replacement for the entry point:

```powershell
pnpm --filter @celestia/api exec vitest run src/core/middleware/request-admission.test.ts src/core/middleware/request-safety.http.test.ts src/games/genshin/importer/importer.limits.test.ts src/games/genshin/importer/importer.http.test.ts src/games/genshin/importer/importer.service.test.ts src/platform/security.http.test.ts --no-file-parallelism
```

## Reproduce synthetic browser acceptance

Run this only while the same owned fixture is stopped and ports 55448, 45448 and
45449 are free, using the isolated shell above:

```powershell
pnpm --filter @celestia/api exec tsx tooling/request-safety-browser.mjs
```

The helper reuses unchanged C5b guards, private ACL directory, generated resource
ownership and cleanup. It creates a fresh disposable database/role/tablespace,
applies existing migrations and synthetic seed, then serves the real application
on 127.0.0.1:45448 and web on 127.0.0.1:45449. It temporarily builds web for this API.
Use synthetic `c5b-a@test.invalid` or `c5b-b@test.invalid` with
`C5c-synthetic-only!`; these are disposable fixture credentials, never real accounts.

The rate clock is injected and stationary; wall time, JWT expiry and database
transactions are real. Default budgets are unchanged. Console commands:

- `exhaust-login`: malformed local requests consume the login budget; no bcrypt.
- `exhaust-import`: malformed authenticated owner-A previews consume shared budget.
- `advance`: advance only the admission clock by 900,000 ms; permits are unaffected.
- `snapshot`: retain safe all-table counts/hashes, never raw rows.
- `lock-owner` / `release-owner`: acquire/release an actual owner-A PostgreSQL row
  lock to hold a commit while switching UI accounts. Release within the existing
  transaction timeout. Never hold an ordinary database lock.
- `quit`: close owned listeners, disconnect clients, remove verified fresh
  DB/role/tablespace, stop the exact owned PostgreSQL process, release the lease,
  rebuild normal web without the Vite override, and verify ports are closed.

Close/sign out the created browser tab before quitting. The helper's private
`c5c-browser-result.json` records cleanup and safe snapshots. If cleanup fails,
inspect that record and verify exact ownership; never stop an unknown process or
delete a computed directory recursively. Private archives/logs remain retained
outside the repository for inspection, not under a production retention policy.
