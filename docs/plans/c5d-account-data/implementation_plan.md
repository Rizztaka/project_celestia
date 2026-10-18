# C5d implementation plan — 2026-10-13

Owner-authorized local implementation in the existing master checkout. HEAD matches
2d8820a48db83d7c62feebd849f2f1c2d3488bb6; index empty. Starting-state.json records
857 existing files. One agent, no environment inspection, dependencies, migration,
staging, commit, deployment, production connection or C6/C7 work.

## Design decided before implementation

Platform account-data orchestrates password reauthentication, bounded snapshots and
atomic deletion. Small core repository interfaces accept explicit game-owned table
descriptors; Genshin and NIKKE supply their own stored-field allowlists. Composition
in app.ts supplies these interfaces without a plugin registry. No live projections.

POST /api/v1/users/me/export accepts exactly {requestVersion:1,password:string}.
DELETE /api/v1/users/me/account additionally requires confirmation:"DELETE MY CELESTIA ACCOUNT".
Unknown fields and query parameters reject. Identity comes only from verified JWT.
Both use the existing 8 KiB parser, one shared owner budget (burst 3, refill one per
60 seconds, capacity 1,024), global 2 / owner 1 permits, and the existing auth pool
for password work. Admission precedes parsing, subject lookup and bcrypt. No queue.
Permits remain held until BOTH operation settlement and response finish/close;
30-second response deadline closes stalled downloads without releasing running work.

Export V1 is a success envelope containing version, snapshot/export time, scope,
omissions, encoding and twenty named table sections. Explicit allowlisted columns
use PostgreSQL text encoding (SQL null stays JSON null; JSON columns are stored JSON
text). This preserves integer/JSON precision, exact stored timestamp precision,
opaque keys and legacy values without interpreting or normalizing them. Empty
arrays mean absent rows; no default row is synthesized. Password is excluded.
The download is JSON, not GOOD and not a supported restore format. Safe fixed
filename celestia-account-v1.json, no-store, no server file or query cache.

Read-only REPEATABLE READ transaction, UTC/ISO settings; cap-plus-one per table,
30,000 total rows, 10,000 rows per table, 256 KiB text per row, 8 MiB aggregate
raw scalar text; 16 MiB actual serialized UTF-8 response. Row text sizes are checked
in PostgreSQL before values reach JS; bounded rows serialize incrementally with
running byte checks. Query 5 seconds, lock 2 seconds, transaction 15 seconds,
acquisition maxWait 2 seconds. Complete-or-reject, never truncate. Verify against
the substantial C5c fixture and over-limit legacy text/history. No working operator
channel is invented for unsupported accounts.

Deletion compares password outside locks, then locks user first, rechecks exact
credential version, locks owned referenced rows, checks cross-owner equipment and
predecessor links, clears owned predecessor links and deletes owned goals followed
by user cascade, atomically. Count ceilings and timeouts also bound deletion.
NoAction links and SET NULL equipment edges are specifically tested. Cross-owner
legacy relationships reject intact. Existing owner-locked imports/routines/goals/
plan/focus writes serialize; NIKKE/endgame/event writes rely on existing ownership
checks and FK locks. They may finish before deletion or fail after it, never create
a user. Every new protected request checks uncached subject existence fail-closed.
In-flight read responses cannot be recalled; no universal session revocation claim.

Settings has separate export and deliberate two-step deletion forms. Current
password required for each; fixed phrase enforced server-side. Passwords clear
after every attempt, cancel, unmount or session change. No auto replay. 429 preserves
safe intent with retry guidance; ambiguous deletion reports uncertainty and offers
explicit sign-in verification. Session-generation guards run before download,
success, or logout. Blob URLs are revoked. Success says download started, never
disk save confirmed. Confirmed deletion clears the originating session and cache.

## Verification sequence

1. Preserve old manifests and twenty-table schema/migration inventory; add coverage
   assertions that fail for new tables or fields without disposition.
2. Deterministic unit/composed HTTP tests: credentials, confirmation, auth, parser,
   spoofing, budgets/capacity/refill, concurrency and response/disconnect lifecycle.
3. Actual guarded PostgreSQL seed: two populated owners plus no-import owner;
   exact private canonical comparisons, coherent concurrent export, large fixture,
   atomic delete/rollback/duplicates/import and other-write races; old-token denial
   across domains and re-registration. Record only safe counts/hashes.
4. Explicit-descriptor C5d browser harness, unchanged C5b guards, private synthetic
   downloads; real forms/errors/cancel/retry/delete and delayed-owner switching.
5. Unchanged recovery:rehearse --fixture review-fixture.json --verify in isolated
   NODE_ENV=test / DOTENV_CONFIG_PATH=NUL environment. Retain actual failed attempts;
   never overwrite old evidence. Report new PostgreSQL cases separately from 106
   historical classifier plus seven C5c cases. Run formatter only on touched files.
6. Walkthrough, limits, acceptance, readiness, exact commands, preservation and
   cleanup; dated handoff/roadmap checkpoint. All work remains local for review.

## Implementation resolution — 2026-10-14

The original plan above is retained. Physical-size checks cannot safely bound
decompression of compressed PostgreSQL values, so export explicitly rejects any
compressed field before text conversion. Exact supported scalar/output limits remain
unchanged. A second count pass after domain locks catches inserts committed during
lock acquisition. The minimal subject lookup is an indexed id-only Prisma read;
repository transaction-local SQL timeouts apply to credential/export/deletion work,
not that earlier lookup. Permits remain held if it stalls after response close.
Actual browser checks found and corrected focus timing after pending/cancel states.
See the final contract, walkthrough and recorded attempts for evidence and limits.
