# Progression catalog advice

2026-10-17 farming follow-up: the separate authenticated [farming intelligence
endpoint](farming-intelligence.md) adds approximate selected-difficulty resin
estimates and bounded historical coordinate-stop ordering. Its source/model
limitations remain distinct from exact upgrade costs and recorded inventory.

2026-10-17 expansion: the production provider uses a pinned, attributed community snapshot covering 122 character ascensions, 120 talent tables through level 10, 252 weapon ascensions and 48 weekday material sources. [Provenance, exceptions and rebuilding](../plans/production-readiness/sources.md) distinguish this from the original primary Hu Tao evidence. Historical C2b catalogs and receipts remain unchanged. Missing stock remains unknown; source coverage never implies observed inventory or goal completion.

Local and uncommitted. Original C2b acceptance: 2026-10-02; focused corrections: October 3; C3b lifecycle integration: October 4. Authentication and goal/import ownership are unchanged. C2b added no persistence migration; [C3b](focus-goals.md) adds durable intent fields.

C4 follow-up, 2026-10-06: [Today plan V1](today-plan.md) shares the pure full-demand/material projection with `GoalService`; collapsed or dismissed goals remain in active totals and stock is subtracted once. The material receipt's UTC database timestamp is now serialized with an explicit timezone before Date parsing, fixing a local-time shift on non-UTC hosts. A real PostgreSQL regression compares the exact stored ISO time through Materials, plan advice and character equipment. This changes no source verification or receipt semantics.

`GET /companion/goals/materials` now returns `contractVersion: 2` and the existing `needed`, `inventory`, and `delta` maps. **Breaking numeric change:** a `delta` value is `number | null`; null means absent stock evidence. Every repository caller is migrated, including `MaterialRow` and Planner's sorting/display. Do not coalesce null to zero. Positive imported quantities can give a numeric deficit, including zero when they cover demand. They are recorded import quantities, not live observations.

The response also includes per-goal `goals` availability/reasons, `neededComplete` (all selected goals have verified costs), source attribution and `stockBasis` with receipt/source/scope/supplied entry count. Totals aggregate only eligible goals and include Mora. Known totals do not require known deficits. An empty replacement import or an entry count of zero does not certify zero inventory. Unsupported goals and opaque imported keys remain stored.

Focused review correction, 2026-10-03: the game-owned provider reads positive stock quantities and the material-section receipt in one parameterized SELECT, so replacement imports cannot mix stock with a different receipt. Exact source field/range coverage is enforced before dependency fingerprints enable costs. Coverage and response semantics above remain unchanged; see [review/resolutions](../plans/c2b-data-trust/implementation_review.md).

`GET /companion/goals/today` returns the selected `serverId`, server day/domains and general/per-goal availability. A source is shown only when costs and source/location/weekday/resin metadata pass the typed provider boundary. Supported talent and weapon materials can expose multiple `routes`, alongside the compatible single `route`. Missing route evidence does not disable material totals. All four supported servers use their own game day.

`GET /games/genshin/intelligence/planner` retains its existing account/clock/manual-resin prerequisites and requires an active goal. It exposes per-goal routing availability and `allocationBasis: resin_budget`. The calculator receives the typed provider; there is no direct raw JSON route. User priority (1 first, default 3), creation time and ID determine eligible allocation order; legacy character ranking scores cannot override it. Open material domains can receive whole 20-resin reward-set allocations. Allocations describe a budget, never expected drops or upgrade completion.

C3b applies the same active-only and duplicate-exclusion policy to materials, Today and the direct Planner service/calculator. Active/paused duplicates are visible for review and all active members are excluded until explicitly resolved. Paused/completed/archived history contributes no demand. Totals retain their declared-range basis after re-import; known stock or progression never implies lifecycle completion. Manual routine tracking remains available without active or eligible goals.

`GET /companion/events` includes `availability`; the placeholder catalog returns no events and an unavailable reason. Its numeric compatibility total of zero is a sum over an empty eligible list, not a claim of rewards collected. Frontend hides the patch/reward summary while unavailable. Placeholder or expired event tier writes fail with 404 and do not erase progress. Weekly V1 endpoints still return C2a's 409; manual V2 aggregate weekly claims remain usable.

Exact current coverage and exclusions are in [production sources](../plans/production-readiness/sources.md). The [C2b sources](../plans/c2b-data-trust/sources.md) retain historical primary response records. Current-patch completeness, events, optimized enemy walking routes and statistical yield/finish-time estimates are not claimed.
