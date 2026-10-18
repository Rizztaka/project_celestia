# Section 1 — Game data catalog and multi-server engine

Implemented locally in the existing checkout on 2026-10-18.

- All four existing server policies and the shared `RoutinePanel` selector are
  retained on Today and Planner. Tests cover the exact reset boundary at
  America 09:00 UTC, Europe 03:00 UTC, and Asia/TW/HK/MO 20:00 UTC, including
  fixed offsets across summer/winter.
- Removed the hardcoded target and talent-6 ceiling from catalog trust. All 16
  local character keys support talent 1–10 and ascension 0–6 calculations,
  including weekly materials, crowns and upper tiers. Fingerprinted owner
  claims supplement the historical primary slice; invalid rows, conflicts,
  missing evidence, ambiguity and drift still reject affected advice.
- Selected upgrade steps implement cumulative target cost minus cumulative
  current cost. Existing canonical progression data keeps runtime precedence;
  local-only targets use explicitly attributed local evidence.
- Materials and Today share one deterministic stock allocator. It reserves
  direct lower/intermediate demand across goals before converting surplus at
  3:1, spends stock once, rounds to whole conversions and preserves unknown
  inventory. It never downgrades higher tiers or writes inventory.
- Regenerated the stale domain schedule offline from the already pinned
  catalog. API routes and the browser schedule agree on all 48 material
  families. Today defaults to the selected server day and shows talent books
  and weapon ascension materials, including all families on Sunday, without
  requiring known stock or a resin budget.
- Reviewed the requested reference projects; Seelie's shipped bundle was
  analyzed using the prescribed isolated REA runtime. See [sources](sources.md)
  for exact provenance, hashes, source observations and limits.

The requested `pnpm run verify` passed through the existing guarded disposable
PostgreSQL workflow: **1,121 tests across 63 files, zero failed or skipped**,
including 145 actual PostgreSQL cases across eight integration files. Shared
contracts, schema/migration checks, API/web lint, types, builds, repository
formatting and diff checks all passed. The first full run exercised an
in-progress intermediate-tier reservation fix; its dedicated regression test
and the final full run pass.

[Validation results](validation-results.json) retain the final evidence paths
and hashes. The workflow removed its databases, roles and credentials and
stopped its owned PostgreSQL process. No deployment, commit, push, ordinary
database write or human acceptance is implied.
