# C5b local recovery rehearsal

Implemented on 2026-10-11 in the existing dirty D: master checkout under the
owner's supplied execution prompt. This closes the bounded local synthetic
recovery milestone for review. It does not close production recovery, beta
invitation, release, C6 or C7 gates.

## Result and review entry points

`pnpm run recovery:rehearse --fixture <owned-fixture.json>` now creates new
source/restore databases, migrates and seeds the source, performs an actual
PostgreSQL custom-format dump/transactional restore, compares full data and
schema metadata, exercises restored production services/routes, and records
cleanup before reporting success. `--verify` also runs the unchanged
`pnpm run verify` on a third new disposable database.

Start with the [runbook and exact Windows commands](runbook.md),
[validation results](validation-results.json), [execution attempts](execution-attempts.json),
[cleanup reconciliation](cleanup.json), [preservation](preservation-check.json)
and [changed-file manifest](changed-files.json). The
[starting manifest](starting-state.json) records 770 inherited files before edits.
The [implementation plan](implementation_plan.md) and [checklist](task.md)
were persisted before code. C5a records and the original proposed prompt remain
unchanged historical evidence; the new handoff/roadmap banners supersede their
then-current status without rewriting it.

## Fidelity and application behavior

Every one of the 20 persisted application tables has representative rows, including
retained legacy/endgame and NIKKE data. The thirteenth migration is unchanged;
all thirteen actual migration receipts/checksums are included. Full canonical
values, IDs, relations, revisions, timestamps, nullable fields and column/constraint
metadata match exactly. The current UUID schema has zero sequences; that inventory
is explicit. Large sequence-value mismatches are modeled in pure comparator tests;
no actual sequence was exercised by this schema's restore.
The compared metadata includes 214 constraints. Per-table counts and SHA256 digests
are persisted; raw rows, password hashes and queries are not.

Synthetic coverage includes two owners sharing game keys, a third owner without
account data, assigned and unassigned equipment, opaque character data, independent
section receipts and missing versus zero receipts, positive and zero materials,
focus revisions, all goal lifecycle states and successor history, malformed legacy
intent, routine observations, zero/null preferences and saved day/week dismissals.
See the plan's coverage matrix and each run's table inventory for exact scope.

The restored probe uses actual bcrypt login, bearer authentication, production
routes and existing account/companion services: 30 HTTP requests, 27 checks and
39 SELECT statements in each successful run. Foreign-owner and unauthenticated
access are denied. A forbidden foreign goal deletion also performs no write.
Saved-period checks use existing service clock injection; HTTP reads use the
actual clock. Source and restored canonical snapshots remain unchanged after
application reads and after the separately scoped full verification suite.
No stored goal is completed, routine progress synthesized or history normalized.

## Real execution and corrections

Independent successful runs use different names, roles, directories, OIDs and
archives. Nonempty and truncated-archive runs exit 1 with no success artifact.
Nonempty rejection preserves sentinel 42. Truncated restore rolls back all user
objects. Each safe result includes stage durations, archive bytes/hash, PostgreSQL
18.4 versions, ACL verification and exact cleanup/resource outcomes. These are
small local Windows timings, not production recovery objectives.

Early implementation failures are retained honestly in the attempt ledger:

- pnpm injects `NODE_PATH`; the environment allowlist now discards it while still
  rejecting actual connection/runtime override variables before operations.
- Windows `icacls` requires the numeric SID to have a `*` prefix. Two empty setup
  directories were removed after exact-path/empty-directory checks. The helper now
  removes a newly allocated empty directory if permission setup fails.
- Captured handles inherited by the background PostgreSQL launcher caused a
  startup timeout. Startup now uses ignored handles with a private server logfile.
  The original owned PID was inspected and stopped explicitly, and its lease was
  removed after confirming shutdown. The failed original result remains unchanged;
  cleanup reconciliation records that later action separately. Failed launches now
  reconcile process identity/start time before cleanup.
- PostgreSQL `inet::text` included `/32`; identity comparison now uses
  `host(inet_server_addr())`, retaining exact loopback/port/role/database checks.
- The first application probe expected an array instead of the actual
  `{ characters, total }` roster DTO. The probe was corrected; application behavior
  and contracts were preserved. That run had already passed restore/fidelity/schema.

## Verification and preservation

The final `pnpm run verify` passes **875 tests / 47 files / 106 PostgreSQL cases**,
zero failed or skipped. Totals and stage outcomes are in
[validation-results.json](validation-results.json). The third fresh successful
rehearsal took 178,495 ms including full verification; dump took 609 ms and restore
1,429 ms, producing a 57,559-byte archive. The first two successes took 26,176 ms
and 158,464 ms respectively, the latter including verification. Per-stage timings
and archive digests are in the immutable copied run records.

The earlier complete run passed 874 tests / 47 files, including all 106 PostgreSQL
cases, before the last empty-directory cleanup regression test was added. The
final focused run passes 76 recovery tests. Full verification retains every C5a
check and integration floor, package lint/types/build, schema checks, exact formatter
exceptions and historical raw-evidence hashes. No test-discovery, CI or production
source adjustment was needed. The separate rehearsal command provides real restore
evidence; ordinary verification alone does not.

Only root package command registration, new local tooling/tests/artifacts and
dated handoff/roadmap updates are within this milestone. Inherited schema, source
guard, authentication/CORS, contracts, dependencies, lockfile, all thirteen migrations,
eight protected files, five formatter exceptions and seven raw-evidence files
remain byte-identical. Only three inherited paths intentionally change: root
`package.json`, `docs/plans/CURRENT_HANDOFF.md` and `docs/ROADMAP.md`.

All run-owned databases/roles/tablespaces were removed, the exact owned fixture
process stopped, and passfiles removed. Private synthetic archives/logs remain
outside the repository for inspection with verified current-user Windows ACLs.
The existing owned server's global catalogs/WAL remain in its original data
directory; new database relation files use private per-run tablespaces. No
recursive filesystem deletion, ordinary database connection, remote CI dispatch,
dependency installation, Turbo, staging, commit, push or deployment occurred.

## Limits and stop point

Only Windows was exercised; POSIX code paths are documented, not certified.
The reused synthetic fixture has loopback trust authentication and assumes
exclusive trusted local use. This is database-level schema/data recovery, not
global role/ACL, external asset/secret, provider, PITR, cross-version or capacity
recovery. Archives contain synthetic data and remain sensitive.

The [new readiness assessment](beta-readiness.md) leaves the accountable operator,
retention/access, provider/location, actual backup cadence, acceptable loss/time
and authorized representative production restore unresolved. Abuse/data controls,
accessibility, source upkeep, remote CI/deployed origins and voluntary human beta
feedback remain separately scoped. Stop after local C5b; all work is uncommitted
and unpushed.
