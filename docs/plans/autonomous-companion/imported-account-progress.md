# M1 Subphase 2 — authenticated imported-account adapter

Implemented locally on 2026-10-26 in the canonical checkout. Verification results
are recorded below. Subphase 1's official-source provenance remains unresolved;
its earlier `verified` report labels are not independent approval.

## Integration and contract

`GET /api/v1/games/genshin/import/context` returns the existing success envelope
with `{ context, evidence }`, validated by `importedAccountContextSchema`.
`context` uses the shared `AccountContext` contract. The endpoint requires the
existing bearer-token **and live owner/session** checks, sets `Cache-Control:
no-store`, and performs no writes or account initialization.

Optional `?accountId=<stored account id>` selects the expected account. Persistence
currently permits one Genshin account per owner. Reads use the existing bounded,
repeatable-read `GenshinImportRepository.readSnapshot(owner)`; the selected ID
must match that owner's account. Other-owner and nonexistent selections return
the same 404. UID/userId overrides, repeated account IDs, and unknown query fields
are rejected. No private import route is mounted under public UID access.

The existing platform account-data endpoint is a password-confirmed export/delete
flow, not a routine game-context read. A small protected importer read avoids
changing that export contract or duplicating its storage queries.

### Evidence boundaries

- GOOD imports do not set a UID. Shared context now permits a null UID for the
  private account scope; public context still requires a valid UID.
- Original character row IDs, opaque character keys, equipment instance IDs,
  assignments, progression, raw talent convention, and available database dates
  remain in `evidence`. Missing values are null; absent equipment remains absent.
  Artifact main-stat values and character total stats are not calculated/defaulted.
- Equipment and character rows remain separately dated fragments. A partial
  character import can preserve older equipment, but this adapter never presents
  that combination as a newly observed whole build or fills from old snapshots.
- Section receipts preserve exporter labels, receipt timestamps, entry counts,
  and merge/replacement scope. `importedAt` is **receipt time**, and row dates are
  **database write times**. Neither becomes `observedAt`; freshness stays unknown.
  `mixedObservationTimes: false` means no known game observation times were found,
  not that these fragments came from one synchronized export.
- A latest merged-character receipt does not identify which retained rows it
  covered. Existing storage also lacks individual import/manual/hypothetical
  origin and explicit ownership declarations. Characters therefore use
  `sources: ['stored_account']`, `ownership: unknown`, and `buildState: stored`
  (or `conflicted`). `good_import` identifies available section receipts only.
  This avoids promoting an optimizer scenario or legacy row into confirmed or
  observed ownership. Explicit hypothetical/public evidence cannot be relabeled
  as this private source; no public or hypothetical data is queried or merged.
- Nonempty stored rosters or character receipts produce `partial`; no roster
  evidence produces `unknown`. Even an empty import is not proof of an empty
  complete account. GOOD's accepted schema has no supported full-roster claim.
  Absent ownership is always unknown; completeness evidence remains null.
- Exact local catalog keys provide an avatar ID only. No imported skill depot
  is stored, so depots remain unknown. Generic `Traveler*` keys cannot establish
  Aether versus Lumine: their original keys/rows survive with an unresolved
  identity issue instead of being collapsed into a male/default elemental form.
  Explicit Aether/Lumine keys retain separate avatar identities. This is a
  hash-identified **local mapping**, not release or mechanics verification.
- Duplicate form claims, shared weapon claims, duplicate artifact slots, and
  dangling assignments remain visible. Affected known characters are conflicted,
  with no selected build fingerprint. Equipment exclusivity stays unverified.
- Canonical SHA-256 fingerprints cover projected character/equipment evidence,
  instance identities, assignments, receipts, issues, account scope, and the local
  identity mapping revision. Repository ordering and JSON property order do not
  change them; relevant evidence changes do. Unrelated inventory/material imports
  and nickname/account-update churn do not invalidate build evidence.

## Files

- `packages/api-contracts/src/genshin/account-context.ts`: private scope, stored
  evidence state/source, guarded provenance invariants, validated response schema.
- `apps/api/src/games/genshin/importer/imported-account.{calculator,identity,service}.ts`:
  deterministic projection, conservative local identity join, authenticated selection.
- Existing `importer.controller.ts` / `importer.routes.ts`: protected read wiring.
- `imported-account.fixtures.ts`, `.test.ts`, `.http.test.ts`, and
  `.integration.test.ts`: synthetic projection and real HTTP/database regressions.

## Verification

Initial HTTP tests failed against the absent endpoint (seven expected 404 failures).
Adapter regressions were written before its implementation. A final-review test
also reproduced a schema loophole that allowed stored provenance to be relabeled
as a dated owned observation; the shared schema now rejects that promotion.

- Shared contracts build, type check, and lint: passed.
- API type check, full lint, and production build: passed. Initial lint found
  import-order issues in new files; those were corrected and full API lint reran
  successfully.
- Web type check: passed against the extended shared contract.
- Changed-file Prettier check and `git diff --check`: passed. Git emitted its
  existing LF/CRLF conversion notices, not whitespace errors.
- Guarded real PostgreSQL verification passed after the earlier skipped run. A
  fresh loopback-only synthetic cluster and per-run database were initialized
  through the existing recovery fixture safeguards; Prisma migrations ran against
  that database, then the actual authenticated HTTP integration ran with no test
  database mocking. `importer.integration.test.ts`: **16 passed**;
  `imported-account.integration.test.ts`: **6 passed**; **22 passed, 0 skipped**.
  The cluster, database, role and private credentials were cleaned up; the port
  was closed afterward.
- The focused adapter/HTTP run passed **27 adapter tests and 8 mocked HTTP tests**.
  The repository-wide command without an explicit disposable URL correctly reports
  its database suites as skipped; that result was not used as database evidence.

### Requirement review

Reviewed the final route/controller/service/calculator/schema and both storage
read paths against the requested scope. Authentication/selected-account checks,
no public UID join, explicit unknown ownership/completeness, preserved instance
identity, independent date categories, missing-field preservation, conflict
retention, and evidence-sensitive deterministic fingerprints are covered by the
regressions. The shared-provenance promotion defect found during review was fixed
with a failing regression first. Unknown imported form/provenance fields are
documented rather than inferred from the disputed release coverage report.
An additional read-only reviewer inspected the scoped implementation and its
storage/authentication dependencies and reported no concrete blocking defects;
acceptance is now supported by the guarded database verification above.

## Remaining work

Source-format limits above remain explicit unknowns, not silently repaired data.
Establishing ownership, exact imported depots, observation timestamps, or complete
roster declarations requires new explicit evidence and persistence support in a
later scoped phase. Ownership-confirmation UI, expanded preferences, readiness,
and team ranking are deferred as requested. Subphase 2 is complete; M1 and
Subphase 1 remain open.

No commit, push, deployment, AI provider, dependency, or schema migration is part
of this adapter change. Existing uncommitted work remains in the canonical tree.
