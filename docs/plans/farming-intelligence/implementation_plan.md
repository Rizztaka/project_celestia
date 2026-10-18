# Farming routes and yield estimates — 2026-10-17

Completed locally. [Walkthrough](walkthrough.md), [final validation](validation-results.json),
[actual browser observations](browser-observations.md) and [cleanup](cleanup.json)
record the delivered scope, final passing checks and remaining source limits.

The owner explicitly requested the remaining coordinate routes and statistical
resin estimates after the functional-core expansion. Work stays in the existing
dirty master checkout. Baseline: private
`C:/Users/inuzu/AppData/Local/Temp/celestia-farming-8JXUDN/starting-state.json`,
991 files, SHA-256
`63A36372D4C753878CF4829D305D08E3FF95E42C1DA5353BF86BB12D0DE812A2`.
No staging, commit, deployment, ordinary database changes or human walkthrough.

## Implementation

1. Pin and normalize MIT coordinate and yield snapshots, retain notices and raw
   hashes. Coordinates are from canvas-genshin-maps revision
   `2154df87e9e4ac8a0733c7603120603cc1d489b6`; yield means from Paimon.moe revision
   `105d0ebd1d551de96668b805d88c2c9a0590177a`. Never execute downloaded code.
2. Extend the Genshin intelligence domain with pure calculator/explainer/service
   separation and strict authenticated read-only request validation. Reuse the
   coherent owned plan/material read; no independent inventory or goal state.
3. Estimate whole 20-resin reward sets from selected domain difficulty, attributed
   mean drops, known required stock and directional three-to-one crafting. Show
   lower difficulties' inefficiency, total resin and shared-budget calendar
   pacing using each domain's weekdays. Never call a mean-yield projection a
   guaranteed run count or exact expected stopping time. No default player level.
4. Match supported material families to actual enemy/gathering coordinates. Let
   the player select a nearby teleport and bounded stop count. Use deterministic
   nearest-neighbor ordering plus bounded 2-opt improvement; display a schematic,
   numbered stops and coordinate references. Optimize planar distance only; do
   not claim terrain-aware navigation, spawn confirmation or guaranteed loot.
5. Integrate an optional farming panel in Planner and link Today to it. Keep draft
   choices ephemeral, errors explicit and unknown stock unchanged. Test numerical
   edge cases, owner isolation, schedules, route invariants and real browser use;
   finish with the guarded full verification/recovery and preservation audit.

## Evidence boundaries

The coordinate source is an older community snapshot covering Mondstadt, Liyue,
Inazuma and early Sumeru, not a current-patch map. Newer or unmatched materials
must say no coordinate coverage. No map artwork is copied or remotely loaded.
Enemy material-family mappings are explicit, reviewed joins, not fuzzy matches.
Yield arrays are community planning averages with no sample counts or confidence
intervals. Their capture patch is unknown; the UI must preserve that limitation.
No boss/event/multiplayer bonus/passive yield is invented. Crafting Mora is not
included. Missing stock for required materials blocks that family's estimate.

Follow `.agents/skills/build-intelligence-engine/SKILL.md`: calculations are pure,
explanations separate, and missing inputs remain unavailable. Use the existing
domain architecture and TanStack Query; no new runtime dependencies or migration.
