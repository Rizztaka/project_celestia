# C5c bounded request controls — completed locally

2026-10-12. Implemented in the inherited dirty master checkout with an empty index;
HEAD remains `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`. Nothing is staged,
committed, pushed, deployed or released. C6/C7 have not started.

## Result

The global 50 MB parser is replaced by inclusive limits: 8 KiB login/register,
64 KiB ordinary JSON, and 4 MiB only for authenticated GOOD preview/commit.
Parser failures use safe JSON 400/413/415 responses without logging submitted
body/password diagnostics. Unknown downstream errors retain the internal-error
contract. CORS/preflight, health and existing auth/ownership semantics remain.

Login allows burst 10, then one token every 6 seconds; registration burst 3, then
one every 300 seconds. Both use normalized direct socket identity and share 4
concurrent slots globally / 2 per peer. GOOD preview and commit share burst 6,
one token every 10 seconds, and 2 concurrent slots globally / 1 per verified owner.
429 includes positive integer Retry-After and seconds in the JSON message.
The existing UI preserves input/review and requires explicit retry; no frontend
or CORS-exposure changes were necessary.

Proxy trust stays false. Forwarded/client identity headers cannot alter buckets.
Verified token subjects alone identify import owners. Mapped IP spellings normalize;
unknown addresses share one bucket. Fixed SHA256 identity keys, lazy full-refill
expiry and fail-closed saturation cap rate maps at 5,120 entries. Churn cannot evict
active penalties. No queue or cleanup timer exists. Permits include parsing and
remain held until already-running password/transaction work settles after disconnect.

GOOD guards run before schema cloning, fingerprints or repository work, including
unselected sections/unknown fields. Support ceilings: 512 characters, 3,000 weapons,
5,000 artifacts, 5,000 material keys and 10,000 total entries. These are application
limits, not game maxima. Stored snapshots fetch ceiling-plus-one sentinels and
reject overflow without returning partial inventory; resulting merged character
counts are bounded too. Omission/empty replacement, opaque valid keys, relationships,
confirmations, ownership and independent receipts remain intact.

See [exact matrix](endpoint-policy.md) and [runbook](runbook.md) for text/depth/node
ceilings, error mapping, upload drain behavior, commands and deployment limits.

## Actual validation

The unchanged C5b command with `--verify` passed using fresh separate source,
restore and verification databases. [Recovery results](recovery-results.json)
record 322,320 ms total. All 20 application tables, thirteen migration receipts and
214 constraints matched; 30 recovery HTTP requests, 27 checks and 39 read-only
queries passed. Source/restored state stayed unchanged. Fresh DBs/roles/tablespaces
were removed and the exact owned server stopped.

[Full verification](entrypoint-results.json) passed **950 tests / 51 files**, no
failures/skips, plus shared/API/web types/builds, API/web lint, guarded schema
validation/diff, formatting/integrity and diff checks. The unchanged verifier's
`postgresCases: 106` reports its six preserved floor suites. Seven new actual
PostgreSQL C5c cases make **113 database cases**; [safe summary](test-results-summary.json)
records both without rewriting that classifier or raw results.

New tests prove byte boundaries, actual chunked transfer, malformed/media/encoding
errors, authentication before large parsing, refill/capacity, spoof resistance,
separate auth/shared import budgets, owner isolation and abort/error permit release.
Arbitrary downstream parser-looking fields still produce 500. Tests use fresh apps,
not disabled controls or increased legacy-test budgets.

Database rejection checks compare exact canonical rows across all twenty tables,
including goals/history, focus, routines, preferences, dismissals, equipment and
receipts. Rejected registration invokes neither bcrypt hash nor DB access; rejected
first imports create no account. A valid throttled commit retries successfully.
A **9,500-item / 1,056,750-byte** synthetic request previews/commits and preserves
intent. Repeated roster growth and oversized inherited state reject intact.
Actual login/register, foreign ownership, no-import setup, NIKKE account and retained
endgame writes pass.

[Browser acceptance](acceptance.md) covers actual UI login/registration, 429 with
retained input, explicit retry, GOOD preview/rejected commit with exact all-table
preservation, manual resin saving without import, and owner switching while a real
PostgreSQL row lock held a commit. No old-owner draft/success reached the new owner.
Only admission time was controlled; no real countdown, accessibility or remote
deployment evidence is claimed.

## Resolved failures and preservation

First focused run: 94/95. Immediate declared-size rejection raced a large upload
and produced ECONNRESET. The installed reader's bounded length check/drain fixed
the response; the next focused run passed 106/106. First full recovery passed
restore/read checks but failed two legacy auth tests sharing registration debt.
Fresh app instances preserve their original credential/conflict assertions; all
22 focused security cases and the final whole suite pass. [Execution attempts](execution-attempts.json)
retain failures and their successful cleanup.

[Preservation](preservation-check.json) reconciles 809 starting files, 26 protected/
migration/formatter entries, seven raw captures and older C5a/C5b manifests.
Only nine inherited API implementation/test files plus dated handoff/roadmap notes
changed. C5b tooling, schema/contracts/dependencies, environment, OpenRouter, lockfile
and historical evidence stay byte-identical. [Changed files](changed-files.json)
describes the C5c delta separately from the much larger inherited Git diff.

[Cleanup](cleanup.json) records closed owned API/web/PostgreSQL listeners, fresh
resources removed, private artifacts retained outside Git, and normal web output
restored. No ordinary database/environment, remote service or participant was used.

## Remaining boundary

This is local single-process protection. Restart resets counters; separate workers
multiply budgets. Shared NAT/proxy peers share auth buckets. Slow uploads can hold
slots until connection timeout. Provider/network/socket controls and actual proxy
topology remain deployment gates. Account-data procedures, production operator,
backup/retention/cadence/RPO/RTO/representative restore, remote CI/deployed origins,
accessibility, source upkeep and voluntary beta feedback remain open in the
[readiness assessment](beta-readiness.md). Stop at C5c.
