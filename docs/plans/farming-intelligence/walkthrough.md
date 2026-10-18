# Farming routes and resin estimates

The owner's follow-up request authorized the missing route and efficiency work.
The new Planner panel implements bounded coordinate routing and approximate
domain-work projections with visible assumptions. It remains local and does not
claim all-region, terrain-aware or guaranteed-loot planning.

## Delivered behavior

- Exact joins connect 48 current weekday domain families to four difficulty
  profiles from a pinned community drop table. The player explicitly chooses a
  difficulty; the app does not guess their level or ability to clear it.
- The pure calculator reserves lower-tier demand, credits recorded stock once,
  crafts surplus upward three-to-one, and finds whole 20-resin reward sets that
  satisfy the mean-yield scenario. Comparisons expose each difficulty's modeled
  resin cost. Unknown required stock stays unknown.
- A calendar uses each family's open weekdays and one shared daily budget,
  starting at the next server reset. Totals and dates are explicitly partial when
  families or materials lack a model. An all-unestimated set never displays zero
  days as if work were finished. The panel refreshes at the supplied reset.
- Sixteen enemy families and 32 specialties have 6,176 actual source stops and
  247 teleport starts from a historical coordinate snapshot. The player chooses
  material, teleport and up to 5/10/12/20 nearby stops. Deterministic nearest-
  neighbor and bounded 2-opt ordering improve planar distance. A schematic and
  numbered coordinate list expose the resulting route.
- The optional panel is in Planner's Goals & materials tab, with a Today shortcut.
  Difficulty and route choices are ephemeral. Same-session previous results keep
  controls mounted during refetch, with busy/status text; route-size/teleport
  changes retain focus. No streak, completion, spending or inventory write occurs.

## Architecture and evidence

The new Genshin intelligence folder separates calculator, explainer, service,
repository, schema, controller and routes. The repository adapts coherent,
authenticated existing plan/material reads and rejects revision/period races.
Platform never imports the new game implementation. The shared V1 contract and
TanStack Query client retain session/owner checks. No migration or new dependency
was added; all fourteen inherited migrations and prior evidence stay intact.

The [API contract](../../api/farming-intelligence.md), [sources/REA record](sources.md)
and [actual browser observations](browser-observations.md) distinguish code/data
Seen directly, explicit model assumptions, and unknown game facts. MIT notices
for Paimon.moe and canvas-genshin-maps are retained. Upstream code is not executed.

REA 6.5.0 was actually attempted after the owner added its skill. Two static
analysis attempts failed its file-integrity check on independently matching
copies. No integrity override was used, and no successful extraction is claimed.
Direct pinned-source inspection supports the table semantics. The owner-added
skill file remains unchanged.

## Validation

[Final validation](validation-results.json) records a passing full guarded entry
point after the focus correction: **1,080 tests / 61 files / 145 actual PostgreSQL
cases**, no failed/skipped tests, plus types, lint, builds, format, schema checks,
dump/restore fidelity and authenticated reads. The first
full run already passed 1,080 tests/61 files/145 actual PostgreSQL cases; the final
run was repeated because actual browser use exposed the control-focus issue.
The verifier's unchanged six-file classifier is reported separately from all
eight PostgreSQL integration files.

The 37 focused tests cover directional crafting and lower-tier reservation,
unknown inventory/difficulty, numeric bounds, monotonicity, shared-budget weekday
pacing, Sunday rollover, horizon bounds, route determinism/uniqueness/distance,
source fingerprints/immutability, exact joins and bounded read consistency.
Five new actual DB/HTTP cases cover all four servers, owner isolation, SELECT-only
advice, strict inputs and absent-state preservation. Existing integration floors,
test discovery and disposable guards were not changed.

Browser checks demonstrated the seven-set/140-resin scenario and eight-day pace,
five-stop route selection, teleport changes, focus retention, full coordinate
diagram and source details. Tested document width 1265 had no horizontal overflow.
Actual menu zoom, a new 320px check, OS motion and screen-reader use were not
performed; no human acceptance or general owner walkthrough was inferred.

[Cleanup](cleanup.json) and [preservation](preservation-check.json) establish owned
resource removal, ordinary build restoration, empty browser inventory, unchanged
master/HEAD/index and protected/inherited file hashes. No staging, commit, push,
ordinary DB write, production deployment or participant contact occurred.

## Remaining limits

Coordinate coverage ends at early Sumeru; newer-area materials remain unmatched.
No navigation mesh, live spawns, elevation/unlock verification, walking time or
enemy drop-yield model is available. A planar polyline is stop ordering, not an
assertion that every line is traversable. Some source landmarks retain their
original Chinese names.

Domain averages have no supplied sample size, variance or capture patch. Applying
them to newer domains is an explicit scenario. Projected reward sets/dates are
not guarantees, probability bounds or exact expected stopping times. Bosses,
Mora/EXP farming, crafting Mora and passive/event bonuses are outside this model.
Prior exceptional-target and actual release/operator/accessibility evidence gaps
remain separate. This follow-up stops with the implemented feature and records;
it does not automatically open another acceptance or expansion phase.
