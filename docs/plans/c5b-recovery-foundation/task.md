# C5b execution checklist

- [x] Read/reconcile instructions, contracts, C5a evidence and actual schema/tooling.
- [x] Verify D: checkout, expected HEAD, empty index; save inherited hash manifest.
- [x] Persist implementation plan before code; discover installed PostgreSQL 18.4.
- [x] Implement guarded fixture/resource lifecycle, backup/restore and fidelity.
- [x] Seed every persisted application table and verify actual restored reads.
- [x] Add meaningful pure guard/orchestration/failure tests in existing discovery.
- [x] Run real success twice, nonempty rejection and truncated archive rejection.
- [x] Run complete guarded verification on a separate disposable database.
- [x] Finish lint/types/build/schema/format/diff and preservation reconciliation.
- [x] Record cleanup, walkthrough, runbook, readiness, handoff and roadmap.
- [x] Leave uncommitted/unpushed; stop at C5b with production/C6/C7 gates open.

Completed 2026-10-11: three real successful recoveries, two expected real failure
cases, 76 focused tooling tests and final full verification of 875 tests / 47 files /
106 PostgreSQL cases, zero failed/skipped. See [walkthrough](walkthrough.md),
[validation](validation-results.json), [finalization checks](finalization-checks.json),
[cleanup](cleanup.json) and [preservation](preservation-check.json).
