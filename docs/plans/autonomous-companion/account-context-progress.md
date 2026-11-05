# Account evidence and exact form coverage — M1 progress

## Current status correction — 2026-10-26

**Subphase 1 remains open:** official-source provenance concerns are unresolved.
The `verified` labels and completion claims in the historical reconciliation
section below describe the earlier implementation/report, not independently
established approval. Subphase 2 adds the authenticated imported-account adapter;
see [implementation, verification, and storage limits](imported-account-progress.md).
The overall M1 milestone remains active.

Implemented and verified locally on 2026-10-25. The whole companion goal and M1
remain active. This advances the account-data foundation and public team generator;
it does not establish full 7.1 mechanics or contextual endgame readiness.

## Runtime changes

The shared `AccountContext` contract distinguishes roster scope, provenance,
historical ownership evidence, missing ownership, observed/hypothetical/conflicting
builds, retrieval times, freshness policy and equipment exclusivity. A source can
claim a complete snapshot only with explicit completeness evidence. Public showcase
and hypothetical data cannot certify a complete real roster. Character sources
must agree with account provenance; hypothetical scenarios stay separate.

The public adapter keeps every UID isolated and chooses the newest **whole** build
for each exact avatar/depot identity. It never fills a missing weapon, level or
stat from an older record. Equal-time conflicting builds are excluded from team
generation. The IndexedDB roster now retains the original build plus one conflicting
payload, exposes a conflict flag without duplicate roster cards, and clears the
conflict only when a newer observation arrives. Cached replays cannot resolve it.
Existing database/version/key paths remain; unmodified records retain their shape.
An older strict reader may skip a newly flagged conflict record, preserving it as
unreadable data rather than deleting it. No migration or account database is used.

The explicit product policy is seven days for a stale-build notice and five minutes
of future clock tolerance. It is not a claim about when equipment actually changes.
Stale builds can still be compared as snapshots. Future-dated refreshes cannot
replace valid retained builds; a valid refresh can repair a previously future-dated
stored record. Unknown depot identities stay unknown. Sources at different times
and unverified shared equipment are visible in the team generator.

The generator resets its search session when the evidence, UID, engine version or
freshness classification changes, cancels the old worker and ignores late results.
Driver/sample preferences survive a roster refresh. Changing samples clears old
rankings before showing a new sample label. Explicit cancellation, unmount and
synchronous engine-start errors recover cleanly. Saving a generated team uses a
stable character-based name instead of retaining a DPS number that can become
stale. Existing saved teams and their names are preserved.

Candidate selection now honors the explicitly selected Traveler form even when
another form is newer; another Traveler form cannot fill a teammate slot. Both
driver and teammates use the selected latest snapshots when building engine input.
Result cards adapt their column count to available width, wrap their Save control
and keep each DPS number on one line.

## Knowledge inventory

`pnpm companion:status` now emits schema version 2. It joins exact depot and element
evidence from the pinned engine, reviewed profiles and explicit Enka variant keys.
An Anemo Traveler engine entry cannot establish Cryo Traveler support. It includes
per-form simulation presence and reviewed role IDs, plus the local projected Enka
metadata revision/digest. That digest identifies the bytes read; it is not an
independent source-integrity approval.

The measured catalog totals remain 131 entries / 123 account identities, 129 intact
description references, 119 entries with an applicable listed simulation form, and
twelve reviewed role profiles. **Ten entries lack a resolved depot identity:**
Alyosha, Illuga, Kachina, Linnea, Lohen, Nefer, Sandrone, Vesna, Vodyanitsa and
Zibai. Other entries can have explicit variant metadata while their simulation
profiles remain absent. Absence of a listed form is not a fabricated depot ID or
a low-value character verdict.

Primary source inspection confirmed the distinction between public showcase data
and a complete account: [Enka's API documentation](https://github.com/EnkaNetwork/API-docs/blob/master/docs/gi/api.md).
The pinned [Vesna data](https://github.com/theBowja/genshin-db/blob/49a6544a6c6ae36089cb42fa591fc46f01de8bcf/src/data/English/characters/vesna.json)
contains identity, descriptive metadata and progression costs, but no character
release-version field. Its presence therefore does not independently certify a
release-to-7.1 roster denominator. The report now keeps this separate from the
Enka identity snapshot and verifies the pinned release manifest independently.

## Release and form reconciliation — earlier 2026-10-26 report (not independent approval)

The coverage report now reconciles the local catalog against an independent
Enka avatar snapshot (revision `a9b583eb4a708dd3db56f6bdef35c3e84e4d213c`)
and checks the Version 7.1 official update notice separately. The independent
identity denominator is **122/122 locally matched**. The local catalog has two
local-only identities, Manekin and Manekina; they remain visible and do not
increase the independent denominator.

The exact `genshin-db` 5.2.14 release manifest contains **124/124 locally
matched identities**, with every release version known and every source record
matching the pinned package version and data hash. The HoYoverse page's official
Nuxt bundle exposes the content endpoint used by article ID `166383`. Its exact
55,735-byte JSON response is stored as `official-7.1-source.json` (SHA-256
`fb270352333af4cfffcc49f5c80fb1bbff36b1daa7e2edbc6309a5961ea9b501`; response
date and payload URL are recorded in `official-7.1-evidence.json`). The bounded
extractor verifies the Version 7.1 title/date and independently extracts the New
Characters section: Vesna (Anemo, Sword) and Vodyanitsa (Hydro, Catalyst).
Stable game IDs remain joined from the independently pinned release roster.
The report therefore emits `identityReconciliation: reconciled`,
`releaseVerification: verified`, `officialReleaseVerification: verified`, and
`releaseCompleteness: verified`.

Each report row now keeps description, progression, mechanics, simulation and
endgame statuses separate. Exact form candidates include element matching,
stable avatar/depot identity, simulation presence and mechanics metadata. The
report records source ID, revision, patch scope, review status and known
exclusions for each knowledge dimension. `partial`, `unknown`, `missing` and
`not_modeled` remain explicit; a listed form is not treated as complete kit or
endgame support.

The earlier implementation reported these as verified release/identity claims;
that is not sufficient to resolve the outstanding official-source provenance
concerns. Subphase 1 remains open. The report also shows ten entries without an
exact resolved form, twelve simulation gaps, and no endgame applicability model.
Broader M1 account-context work remains open.

## Provenance hardening — 2026-10-26

The coverage tool now uses immutable commit revisions for the pinned upstream
references, code-owned byte/hash pins, and explicit local/upstream/projection
integrity fields. Enka raw bytes can be rechecked with `pnpm companion:status
--verify-upstream`; the fresh check matched all three pinned raw sources and the
deterministic core projection. This proves reproducibility, not independent
review. The npm archive retrieval for the genshin-db package timed out, so its
source provenance remains unverified. The release manifest now records the
immutable package revision, registry integrity metadata, retrieval status and
unverified review status.

Official extraction is bounded and fail-closed: it accounts for the complete
New Characters section, recognizes 4/5-star entries, rejects omitted/extra/
duplicate/malformed claims, and emits only name/element/weapon/version claims.
Stable game IDs remain a separate join. The checked-in official payload matches
the fresh HTTPS bytes, but has no independent review anchor and therefore stays
`provenance: unverified`.

Roster reconciliation now requires exact one-to-one identity, release, source,
official-addition and local-catalog joins. Duplicate evidence is retained in
diagnostics, status domains do not promote one another, the known 122-versus-124
denominator mismatch blocks completeness, and `companion:status` exits nonzero
for blocked reconciliation. Adaptive Traveler catalog rows no longer become
exact forms without an explicit element match.

## Verification

### 2026-10-26 provenance-hardening verification

- **121 focused tests across eight files passed**, zero failures/skips: official
  extraction, release-source pins, Enka projection/provenance, hardening
  mutations, roster coverage, public account context, and authenticated imported
  account HTTP/adapter regressions.
- Contracts build/type/lint, API type check/lint/build, web type check/build,
  changed-file formatting, and `git diff --check` passed.
- `pnpm companion:status` exits nonzero with the expected blocked report:
  `releaseCompleteness: unverified`, identity reconciliation `incomplete`,
  release verification `invalid`, official verification `unverified`, ten
  reconciliation issues, 117 exact forms and fourteen unresolved form identities.
- `--verify-upstream` completed against the pinned Enka URLs: all three upstream
  byte hashes and the deterministic core projection matched (`verified`). It
  still exits nonzero because source provenance is `unverified` and the roster
  denominator/reconciliation is blocked. The official fresh HTTPS artifact also
  matched its pinned bytes; no independent review anchor was invented.
- The npm genshin-db archive retrieval timed out during investigation. No package
  provenance pass is claimed; local package/source byte checks remain separate.
- No database test, schema mutation, production read/write, commit, push, or
  deployment was performed.

- **26/26 focused M1 evidence tests across three files passed**, zero failures/skips:
  `account-context`, `team-auto-context-client`, `team-auto-pool`,
  `companion-coverage`, `observed-roster-client`, `uid-teams-client`,
  `uid-workspace-client`, `team-damage`, and `team-benchmark` under
  `apps/api/tooling/`. These cover real IndexedDB semantics through the existing
  test adapter, React interactions, shared schema invariants, snapshot selection,
  conflict persistence/recovery, future-time handling, UID/form isolation, stale
  result invalidation, worker lifecycle and the real pinned WASM engine.
- Contracts build/lint, web production build/types/lint, API types, scoped tooling
  lint and changed-file formatting passed. The first API type check exposed an
  out-of-date generated Prisma client lacking existing NIKKE types. Regenerating
  from the unchanged schema with dotenv disabled and an unreachable synthetic URL
  repaired it; the subsequent API type check passed. No database connection or
  schema mutation was performed.
- CLI report ran successfully with the expected blocked result; JSON output was
  regenerated and parsed in ignored `.local-maintenance/companion-coverage.json`.
  `--verify-upstream` matched pinned Enka bytes/projection and still reported
  overall completeness `unverified` because independent provenance and roster
  reconciliation remain open.
- Actual browser flow: `/u/800000001/teams` → local public showcase API → synthetic
  transport through the real parser → browser retained roster → account adapter →
  real gcsim worker → rendered ranking. The fixture API reported one synthetic
  source request. The browser compared ten complete teams and verified five
  finalists with common three-sample seeds; top illustrative result 16,223 DPS.
  These are synthetic builds under the existing generic rotation, not a player's
  result or proof of optimal combat performance.
- Browser sample changes removed old results, and Cancel search returned the UI
  to an idle state. No browser warning/error logs were recorded. At the observed
  964px viewport, content width was 964px and all five DPS labels occupied one line
  (26.4px measured height). No newly executed 320/390px acceptance is claimed.
- The development server still emits the existing Vite warning about importing
  the gcsim JSON manifest from `public/`. Production bundling and actual worker
  execution passed; this pass does not claim that development warning was fixed.
- Browser screenshot and accessibility observations are in ignored
  `.local-maintenance/m1-browser-ranking.png` and `m1-browser-observations.txt`.
  The temporary tab and isolated preview processes were cleaned up.
- `git diff --check` passed. Generated output stays ignored. No dependency, schema,
  secret-file, production-account or release change is included.

## Still required

M1 still needs independently reconciled release/form/mechanics coverage and explicit
ownership/completeness evidence. The existing generic rotation still limits team
ranking; full contextual readiness, counterfactual upgrade/pull comparisons, joint
endgame teams and the simulator remain outstanding as described in the
[implementation plan](implementation_plan.md).

## M1 Subphase 3 — unified scope, freshness, intent and missing-data policy — 2026-10-27

Subphase 3 is implemented locally. This does **not** close Subphase 1, promote any
release provenance, or claim complete mechanics, ownership, endgame readiness or
release coverage.

### Contract fields and semantics

The shared `AccountContext` contract remains version 1 and now exposes:

- `scope`: `public_uid`, `private_authenticated`, `hypothetical`, or `unknown`.
- `uid` and authenticated `accountId`, never synthesized for a private import.
- `rosterScope`: `complete_snapshot`, `partial`, or `unknown`, with nullable
  `completenessEvidence`. Public showcases, hypothetical data and stored rows cannot
  certify completeness; an empty import remains unknown/partial evidence, never an
  empty complete roster.
- `sources`, `sourceTimestamps`, `oldestObservationAt`, `newestObservationAt`,
  `mixedObservationTimes`, and the unchanged source-specific freshness policy.
- Per character: exact `formKey`/avatar/depot identity, `equipmentInstanceIds`,
  ownership, build state/fingerprint, `observedAt`, independent timestamps
  (`observedAt`, `importedAt`, `databaseUpdatedAt`, `sourceUpdatedAt`, `retrievedAt`),
  freshness and `missingData`.
- Account and character `missingData` entries with a dimension, status and stable
  explanation. Statuses are `unknown`, `unavailable`, `omitted`, `unsupported`,
  `stale`, `conflicted`, `not_owned_confirmed`, and `not_modeled`.

Freshness is `fresh`, `stale`, `future_invalid`, `unavailable`, or `unknown`.
Public observations use a seven-day stale threshold and five-minute future tolerance,
through an injectable clock (`publicAccountContext(..., clock)`). Imports have no
game observation time, so receipt/database dates remain visible but freshness is
unknown. Future observations are quarantined and cannot replace retained valid
evidence. Mixed observation times remain explicit. Evidence/freshness changes remain
inside deterministic fingerprints; unrelated nickname/material churn does not.

### Source and merge policy

The only mergeable families are public showcase alone; private `good_import`,
`stored_account` and manual evidence; and hypothetical evidence alone. Public and
private evidence never silently merge, hypothetical evidence never becomes owned,
and stored receipt/database timestamps never become game observation timestamps.
Equal-time conflicting builds retain the evidence, expose `conflicted`, and have no
selected build fingerprint. Failed/omitted import sections preserve prior sections;
successful empty sections clear only the explicitly selected inventory section.

### Preference policy

The versioned team preference contract retains favorites, exact required forms,
exclusions, driver, sample count and recorded-build policy, and adds bounded
`protectedGear`, `comfort`, `timeBudgetMinutes`, and `{ mode, difficulty, target }`
content intent. Protected gear accepts only explicit `weapon:`/`artifact:` namespaced
identities; raw unscoped IDs are rejected rather than treated as durable. `ownerId`
plus selected `accountId`/UID scope the record; a private account may use a null UID
because `accountId` is primary. Defaults are explicit unknown/null values. The authenticated API is
`GET/PATCH /api/v1/games/genshin/team-preferences`. Writes validate the shared
contract, use owner/account checks, compare `expectedRevision`, atomically advance
the revision and return 409 on stale concurrent writes. The additive
`genshin_team_preferences` migration has no backfill. Existing browser-local public
preferences remain compatible. The authenticated team UI reads/writes server state;
failed saves preserve the draft and stored value. The account-scoped repository keeps
Prisma persistence and atomic revision checks out of the service.

These fields invalidate dependent deterministic search sessions through the existing
preference/evidence session fingerprint. They do not add readiness scores, ranking,
pull advice or endgame optimization in this subphase.

### Verification and remaining unknowns

The new policy regressions cover public partial evidence, future/stale/fresh/unknown
time states, source separation, exact equipment identities, missing dimensions,
owner/account preference scope, authenticated UI persistence, malformed-data
preservation and repository/HTTP revision conflicts. Database verification is now
complete against a disposable loopback PostgreSQL 18 cluster: all sixteen migrations
applied and the nine guarded preference/import cases executed without skips. No
production database was contacted. Subphase 1 official-source provenance, imported
game observation timestamps, explicit imported ownership/full-roster declarations,
unresolved depots/mechanics and complete account coverage remain unknown.

Final focused commands/results for this subphase:

- `pnpm --filter @celestia/api exec vitest run tooling/account-context-policy.test.js tooling/account-context.test.js src/games/genshin/importer/imported-account.test.ts src/games/genshin/importer/imported-account.http.test.ts src/games/genshin/team-preferences.http.test.ts src/games/genshin/team-preferences.repository.test.ts tooling/team-preferences.test.js tooling/uid-teams-client.test.js`: **77 passed, 0 failed**.
- `prisma migrate deploy` plus `pnpm --filter @celestia/api exec vitest run src/games/genshin/importer/imported-account.integration.test.ts src/games/genshin/team-preferences.integration.test.ts` against a disposable loopback `celestia_test_*` database: **16 migrations applied; 9/9 actual PostgreSQL cases passed, 0 skipped**.
- `pnpm --filter @celestia/api exec vitest run --no-file-parallelism tooling/account-data.test.js tooling/team-auto-context-client.test.js tooling/account-data.integration.test.js tooling/request-safety.integration.test.js`: **40 passed, 0 failed**, including export/deletion coverage of the new table and the exact twenty-one-table recovery inventory.
- `pnpm run verify` test stage: **1993/1993 tests passed, 132/132 files, 0 failed, 0 skipped, 118 PostgreSQL cases**; shared contracts, API and web type/lint/build checks pass independently. However, the composed gate wrapper did not emit a final `verification.json` artifact due to unhandled Windows Vitest worker RPC timeouts (`[vitest-worker]: Timeout calling "onTaskUpdate"`) that occur on this host during full-suite tear-down before subsequent wrapper stages complete.
- Gate status: Functional unit, policy, and integration test suites pass completely (including the 32/32 tests in `imported-account.test.ts` with character-scoped build fingerprint invariance, and 35/35 preferences/client tests). The repository-wide Prettier configuration (`endOfLine: lf`) is verified, redundant exceptions duplicating `verifyFormatExceptions` and `verifyRawEvidence` have been purged from `.prettierignore`, and `.kilo/` is preserved. Formal composed-gate artifact generation (`verification.json`) remains a CI-level sign-off gate before M2 merge.
- `pnpm companion:status --json`: ran and retained the expected blocked/unverified
  provenance result; no source was promoted to complete.

### Corrective hardening — 2026-10-29

- Imported character contexts no longer emit a synthetic `undated_observation`
  issue for every stored row; the same absence is already expressed by
  `missingData.observation = unknown`.
- Per-character `importedAt` is now `null` because storage keeps no per-row import
  origin. A later partial import advances only the account-level section receipt and
  never re-dates a preserved character row. `databaseUpdatedAt` still comes from the
  row itself.
- Malformed or dangling equipment now conflicts only the character actually
  affected. Unequipped malformed artifacts and dangling references remain visible in
  evidence issues without erasing unrelated build fingerprints.
- Account-only preference scope now fills a missing UID from the stored account and
  rejects only an explicitly mismatched UID. UID-null accounts remain supported.
- A 409 preference save refreshes the stored revision while preserving the draft, so
  the next save targets the real revision and no side is silently overwritten.
- Public source-level `retrievedAt` now reflects the newest selected retrieval time
  instead of always being null.
- The new `genshin_team_preferences` table is included in account export/deletion
  coverage and the exact recovery/request-safety table inventory.

### Intent scope and follow-ups

`protectedGear`, `comfort`, `timeBudgetMinutes` and `content` are persisted,
validated and part of the search-session fingerprint, but the current team form does
not expose them and candidate selection does not yet act on them. They are contract
groundwork for M2/M3, not current ranking behavior. The authenticated team UI always
selects a UID scope; a private account whose UID is null has no UI path to its
account-scoped preferences yet. That remains explicit follow-up work, not a claim of
complete account-context UX.
