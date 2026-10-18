# C5b follow-up review and next-step decision

Reviewed 2026-10-11 in the existing dirty D: checkout at HEAD
`2d8820a48db83d7c62feebd849f2f1c2d3488bb6`, master, with an empty index.

**No new blocking finding was identified in the reviewed C5b implementation.
The local checkpoint is suitable for the next bounded engineering milestone.
The application is not yet cleared for production release or beta invitations.**

## Scope and evidence

Reviewed the recovery target/environment guards, fixture provenance and process
checks, resource ownership/cleanup, dump/restore orchestration, private files,
canonical snapshots, all-table synthetic seed, restored production-read probe,
failure handling, focused tests and saved success/failure reports. Reconciled the
C1–C5b roadmap, companion scope, latest handoff and remaining readiness gates.
This is a follow-up code/evidence review plus fresh whole-suite regression
verification. It is not a new line-by-line audit of every inherited feature,
an external security assessment, independent human usability research or
production recovery certification.

Before review, all **34 C5b manifest entries**, **26 preservation entries**
(eight protected files, thirteen migrations, five formatter exceptions) and
**seven historical raw-evidence entries** matched their saved hashes.
[Starting checks](review-starting-state.json) preserve these observations before
the new handoff/roadmap notes. No application or tooling code was changed.

A fresh real Windows rehearsal used the documented command with `--verify` and
newly generated source, restore and verification databases. It exited **0**:

- Full `pnpm run verify`: **875 tests / 47 files / 106 PostgreSQL cases**,
  zero failed or skipped. All 76 recovery tooling tests remain discovered.
- All 20 application tables (46 rows), thirteen migration receipts, exact row
  values/metadata and 214 constraints matched after restore. Zero sequences is
  the current schema's actual inventory, not an omitted check.
- Thirty HTTP requests, 27 application checks and 39 SELECTs passed. Authenticated
  ownership/foreign-owner/unauthenticated behavior and saved-period checks passed.
  Source and restored snapshots stayed unchanged after reads and the full suite.
- Shared/API/web types/builds, API/web lint, guarded migrations/schema checks,
  repository formatting/integrity and diff checks passed through the unchanged
  verification entry point. Recovery and suite databases were separate.
- Fresh owned databases, roles and tablespaces were removed; the exact owned
  server stopped, passfile and lease removed, and loopback port 55448 was verified
  available by an exclusive bind. Private synthetic archives/logs remain outside
  the repository under the run's verified current-user Windows ACL.

See [fresh recovery stages/timings](review-recovery-results.json),
[full entrypoint results](review-entrypoint-results.json),
[safe test counters](review-test-results-summary.json) and
[final review validation/preservation](review-validation.json).
The raw Vitest report remains outside Git because inherited test names include
synthetic database URLs; its SHA256 is recorded without copying those names.

The previously executed nonempty and truncated-archive cases were re-read and
reconciled against unchanged implementation evidence, not rerun in this review.
They record the expected failure codes, unchanged sentinel/empty rolled-back
destination, no success marker and successful cleanup. Earlier implementation
failures and manual startup reconciliation remain unchanged historical records.
No new browser/accessibility test, POSIX execution, remote CI or deployed-origin
check is claimed.

## Next bounded gap: C5c request safety

The remaining abuse-controls gate has concrete support in current source:

- `apps/api/src/app.ts:31` runs a global 50 MB JSON parser before route-level
  authentication, so a large body allowance is available even on small auth or
  unauthenticated requests.
- The global error handler maps neither parser syntax nor body-size failures;
  those errors reach its generic 500 branch. Expected request rejection needs
  deliberate status/envelope handling without raw body-bearing error logs.
- Auth registration/login and GOOD preview/commit routes have no application
  admission throttling; costly hashing, parsing and import work are unbounded by
  a request-rate/concurrency policy. Import arrays also lack an overall resource
  policy. Provider protection/proxy configuration has not been observed.

These are pre-existing, explicitly open C5 readiness gaps, not C5b regressions.
They justify **C5c: bounded API request and abuse controls**, with measured body
ceilings, safe parser errors, identity-aware admission, bounded memory/concurrency
and actual preservation tests. The [complete execution prompt](../c5c-request-safety/implementation-prompt.md)
is prepared for owner execution; C5c implementation has not started.

The prompt preserves authentication/CORS/domain semantics and avoids Redis, new
dependencies, provider configuration and account lockout systems. Single-process
limits do not prove distributed/provider protection. Deployment proxy trust,
multi-instance/restart behavior and operational policy remain explicit gates.

## Product boundary and settings

The existing product direction remains useful: manual-first routines, optional
safe imports, character focus, durable goals and a short Today plan. C6 saved
teams/journal and C7 events/savings remain optional later directions requiring
real-use feedback. There is a concrete next engineering phase; this checkpoint
does not require inventing a new product direction or expanding game coverage.

Production operator/retention/access/provider/cadence/recovery objectives and a
representative production restore remain unresolved. Account-data procedures,
accessibility, source upkeep, actual remote CI/deployed origins and voluntary
human beta evidence remain separately scoped. The [readiness assessment](beta-readiness.md)
continues to describe those limits.

Recommend **GPT-6 Astra with Extra high (`xhigh`)** for implementation, as already
shown in the supplied screenshot. This is a quality-first judgment for security
middleware ordering and data-preservation requirements, consistent with
[official model-selection guidance](https://developers.openai.com/api/docs/guides/model-selection)
checked 2026-10-11. Use This computer, local implementation mode, one agent and
the same D: checkout; set New worktree off. A new chat in that directory can
start with the complete prompt. No custom environment setup or permission
escalation is required merely to improve answer quality; no setting was changed.

Clarification of older worktree advice: current
[official worktree documentation](https://learn.chatgpt.com/docs/environments/git-worktrees)
says selected-branch local changes can be applied to a new managed worktree.
Therefore “worktrees never carry uncommitted changes” would be too broad.
Keeping this work local preserves the verified directory, installed dependencies
and fixture context without introducing a transfer or setup step.

All review work is local documentation/evidence only, uncommitted and unpushed.
No release, remote operation, next-phase implementation or C6/C7 work occurred.
