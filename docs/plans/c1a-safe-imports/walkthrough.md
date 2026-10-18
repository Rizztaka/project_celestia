# C1a implementation and validation

Date: 2026-09-26. Implemented locally, uncommitted and unpushed.

Imports now require an explicit section selection and a ten-minute user-bound preview. Missing/unselected inventory is preserved; selected character data merges. Empty replacements require confirmation. Equipment resolves against existing owned characters as well as the selected incoming roster. Ambiguous or unresolved assignments are rejected before writes.

The importer repository performs initialization and replacement in one serializable transaction, locks the stable owner row, compares the full preview snapshot, and advances account updatedAt to invalidate replay. Stale, altered, expired, or competing imports fail safely. No schema migration was needed for C1a. See [API contract](../../api/genshin-import.md) for limitations and the deliberate rejection of legacy raw commit requests.

The web flow now includes section selection, before/incoming/after counts, clearing confirmation, explicit retry through a fresh preview, materials in the result, and invalidation of roster, inventory, intelligence, and material-plan views. No optimizer was added.

## Evidence

- Full API suite with local integration enabled: **335 tests passed in 25 files**, including the existing **22 security HTTP tests**.
- Safe import coverage: 27 service/token/validation tests, eight HTTP tests, and 13 native PostgreSQL transaction tests. The previous 15 importer tests were replaced by tests for the new contract; field mappings and equipment resolution are now verified against the actual database.
- A fresh isolated PostgreSQL **18.4** cluster was initialized in the temporary directory, bound only to `127.0.0.1:55439`. The nine existing migrations were applied only to `celestia_test_import`. Rollback was verified after actual later-stage database errors, and simultaneous commits were verified for both existing and first accounts.
- Uncached root lint: API and web passed. Uncached root build: all three packages passed, including TypeScript compilation for API, contracts, and frontend.
- Browser verified against local API/test database: full import; disabled confirmation until empty-section acknowledgement; material-only preservation; a competing API import causing visible 409 recovery; refreshed preview success; and a 390px-wide preview with a scrollable table.
- Added a CI PostgreSQL service and integration step. CI has not run because nothing was pushed.
- A pg driver deprecation warning appears during transaction execution: overlapping client queries will be unsupported in pg 9. Current pinned pg 8 tests pass. No dependency upgrade was attempted.

Unrelated AI/environment changes and the existing Turbo test log were preserved. The accidental workspace pnpm store from the prior failed install was removed after verifying its exact path; the existing external store was not changed by that cleanup.

Next milestone: section provenance/freshness and account-cache continuity (C1b). Import timestamps must not be presented as game observation timestamps, and old inventory must remain unknown until explicitly imported.
