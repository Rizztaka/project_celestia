# C5 companion journey — implementation contract

Prepared 2026-10-07 before application edits, under the owner's execution prompt. Work only in the dirty D: checkout, HEAD `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`. No agents, release actions, dependencies, schema/contract changes or C6/C7.

## Reconciled baseline

Read repository instructions/architecture, current handoff, C4 plan/review/walkthrough/contracts/evidence and C3a/C3b preservation/import/lifecycle guarantees. C4 is the implemented boundary; older product examples are not extra scope. Direct baseline passed **691 tests / 43 files / 106 PostgreSQL cases / zero skipped or failed**, 39.07 seconds. Owned C4 OS-temp cluster was verified by owner, directory, postmaster options and closed port before restart. Existing disposable guard ran before connections; the database identifies itself as `celestia_test_c4`, role `celestia_test`, loopback port 55448. Raw baseline log is `%TEMP%/celestia-c5-baseline.log`.

`starting-state.json` captures HEAD/index/status, source hashes, eight protected files, all thirteen migrations (twelve historical plus C4), and the five formatter exceptions. All inherited protected hashes matched. No normal database or .env contents are needed.

## Route/caller matrix and navigation decisions

| Route                           | Existing callers/data                                                                                      | C5 responsibility                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `/`                             | Dashboard → TodayPlan → plan V1/advice, routine V2; exact goal/detail links                                | Primary **Today**; optional manual setup, visible choices entry, quiet states                                        |
| `/roster`                       | Home/nav/import; roster + focus; encoded detail links                                                      | Primary **Characters**, searchable recorded roster, focus filter, retained-data retry                                |
| `/roster/:characterKey`         | Roster/Today/GoalManager; equipment V1 + goals/focus/import status                                         | Characters remains active; natural key preserved; equipment and exact goal entry                                     |
| `/planner?tab=…`                | Home/detail/legacy intelligence; daily/weekly/farming/events, `goal`, `target`, `status`, `newType`, `key` | Primary **Planner**; preserve every parameter and history; local section buttons expose selected state               |
| `/import`                       | Roster/inventory/detail/home/secondary prerequisites                                                       | Always-visible supporting **Import**; preview/scope/clear confirmations unchanged; return to Today                   |
| `/profile`                      | Home; `/auth/me`                                                                                           | Supporting **Settings & profile**; links to existing server/routine/choices forms, profile load/error/retained state |
| `/inventory`                    | Home/roster/detail/import/nav                                                                              | Supporting **Inventory**; responsive records; no assigned/empty inference                                            |
| `/intelligence`                 | Home/simulator; seven legacy panels including AES/pull scores                                              | Explicit **Other tools** disclosure, compatibility algorithms retained, visible legacy limits                        |
| `/simulators`                   | Home; simulator API/sessions                                                                               | Other tools, retained simulation route/data, assumptions qualified                                                   |
| `/endgame`                      | Home/simulator; journals/roster/legacy evaluations                                                         | Other tools, retained records; rotation/scoring limits qualified                                                     |
| `/nikke/roster`                 | Home; existing NIKKE roster API                                                                            | Other tools, retained route/data; loading/failure separated from empty                                               |
| `/login`, `/register`, fallback | Public auth; ProtectedRoute; fallback to Today                                                             | Preserve auth/router semantics and token-keyed QueryClient remount                                                   |

Use a small protected `CompanionLayout` with shared header/navigation and Outlet. Pages retain exactly one main region, assigned a consistent skip target. No router/state rewrite. Primary links always visible and wrap on narrow screens; Import/Inventory/Settings remain visible supporting links. Secondary disclosure is ordinary navigation, not an ARIA application menu: native buttons/links, Escape/outside dismissal and focus return, route-change closing. Suspense keeps navigation available and supplies a loading main; pathname changes focus the new content, query-only changes preserve form focus. Hash links open targeted details and reach existing forms.

## State/interaction map

| State                               | Presentation and transition                                                                                                                       |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| First use/unselected server         | Inline no-import guidance → supported Asia selector; other servers explicitly unavailable; manual resin/Transformer independent                   |
| Optional routines / quiet account   | Discoverable plan choices, default off; zero ceiling distinct from blank; no obligation or score                                                  |
| Loading / no records / filtered out | Distinct status, optional next action, clear-filter action; failed query never shown as zero inventory                                            |
| Confirmed observations              | Imported records/section receipts distinct from live game observations; raw talents/unknown equipment remain qualified                            |
| Failed refresh                      | Retain labeled previous data, visible deliberate retry; do not clear typed values or imply current data                                           |
| Save/conflict/reset                 | Existing expected revisions/server-period checks and atomic response; retained draft, no retry; explicit recovery                                 |
| Logout/login or delayed completion  | Existing token generation, originating session checks, cancellation and account QueryClient boundary retained                                     |
| Goals / focus / import              | Focus independent; pause controls demand, dismissal controls visibility; completion explicit; partial import preserves all intent/history/choices |

## Proposed changes and verification

Files: new shared navigation/layout and focused companion stylesheet; App route wrapper; Dashboard/Roster/CharacterDetail/Planner/Import/Profile/Inventory and minimal secondary navigation/qualification changes; TodayPlan discoverability and RoutinePanel server help; API-client cancellation signatures only if callers require them. Existing goal/forms/cache/plan state remain unchanged unless a concrete journey defect is found. New meaningful client regressions target changed navigation/query/session behavior. Test-only C5 fixture may inject failures/delays/server time and seed synthetic owners; it never enters production startup. No game data or backend business rules change.

Acceptance matrix (fresh actual browser, plus retained current-run integration evidence):

1. New owner, no import: choose Asia, enable and record a routine; unsupported guidance.
2. Returning owner: preview/save import, focus, equipment, goal management, Today and exact links.
3. Partial re-import: observations/UTC receipt advance; omitted equipment, focus, declared goal/history/choices/dismissals remain.
4. Unknown stock/equipment and unavailable farming/events remain honest; no inferred completion.
5. Daily/weekly boundary saves: existing exact post-lock integration cases plus controlled-time affected browser path.
6. Pause/resume changes demand; unfocus does not pause; dismiss/restore retains demand.
7. Failed save/conflict/advice refresh retains drafts/confirmed data; manual recording and deliberate recovery.
8. Delayed read/write across two owners: originating-session isolation including drafts/messages.
9. Quiet account; zero/unset ceiling and unknown/zero weekly claims.
10. Every route, direct reload, back/forward, encoded links; desktop 1440×1000/mobile 390×844/narrow reflow; keyboard/contrast/reduced motion/touch/overflow.

Run direct full Vitest with matching guarded database variables, test environment, dotenv disabled and dummy secrets; API lint/build, shared tsc, web lint/build; guarded Prisma validation/schema diff; focused Prettier and git diff --check. Keep warnings visible. Capture fresh before/after views and actual failures, restore viewport/ordinary build, stop only owned services and verify closed ports.

Read-only readiness assessment will distinguish implemented code from verified operations for backup/restore, abuse controls, account export/deletion, data upkeep, cutover and deployed SHA. Persist voluntary human task script and blank observations; no invented participants, feedback or readiness. Update checkpoint banners with separate local acceptance and beta/release gates.
