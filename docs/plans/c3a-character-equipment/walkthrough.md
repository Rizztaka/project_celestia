# C3a character equipment — local implementation and acceptance

Completed 2026-10-03 by Codex in `D:\Genshin Personal\project-celestia`, the existing dirty local checkout, under the owner's explicit review/fix/implementation authorization. The checklist and implementation plan preceded application edits. C2b's focused source/code review found and resolved two defects; see [findings and resolutions](../c2b-data-trust/implementation_review.md). **C3a is complete locally; full C3 is not complete. C3b focus selection, priorities and goal lifecycle remain a separate slice.** CI/release review has not run for this unpushed tree.

## Result

The roster links to `/roster/:characterKey`. The authenticated detail endpoint resolves ownership from the bearer user and the character natural key, so replacing equipment UUIDs does not break navigation. One parameterized SELECT reads progression, owned weapon, all owned assigned artifacts and three section receipts in one PostgreSQL snapshot. It never initializes an account or writes freshness. Missing/foreign characters share the same 404. Defensive checks suppress foreign legacy equipment in both detail and roster responses.

The page shows stored level/ascension/constellation and talents, recorded weapon key/name/level/ascension/refinement, and all five artifact slots. Pieces show stored set/rarity/level/main-stat key and supported substats. Main-stat amounts remain unavailable, malformed legacy substats remain unavailable, and stored zero substats stay zero. Unknown keys have readable raw-key/name/initials fallbacks; failed mapped images fall back to initials. Recorded set counts describe assigned pieces without evaluating set effects or build quality.

Assigned data, unrecorded assignments with section receipts, and unknown provenance are distinct states. An explicit empty replacement is still only an absence in recorded data, not proof of an empty in-game slot. Persistence cannot represent confirmed empty-slot observations or per-value default origin. Talents are not inferred to be base or effective values. Section receipt time/source/entry count is labeled as received/imported and never presented as live equipment, per-item observation, a complete scan or acquisition age. Character receipts date a merge, not each retained character. Character-only imports preserve independent equipment receipts.

Loading, refresh, retry, cached-data refresh errors, 404 and no-recorded-import views are usable on desktop/mobile. Successful imports reuse existing `['genshin']` invalidation; failed imports retain valid cached data. The session query client clears/remounts on token changes and delayed old requests cannot populate the new client's cache. The request propagates cancellation to fetch.

The [API contract](../../api/character-equipment.md) documents all states and errors. Existing `/roster`, `/inventory` and import URLs remain. Inventory retains complete inventory endpoints. Intelligence retains its existing legacy callers, including its artifact panel; broader navigation/intelligence transition is deferred. The new detail page calls complete owned equipment rather than top-five Artifact Intelligence and introduces no score, optimizer, focus persistence, manual equipment write, target expansion or goal lifecycle change. No database migration or dependency change was added.

## Automated verification

Final direct full Vitest execution on **2026-10-03 at 21:01:43 IST** passed **535 tests / 37 files / zero skipped or failed**. All **50 PostgreSQL cases executed**: 16 importer, 12 C2a routine, 9 C2b advice and 13 C3a equipment. Counts reconcile against C2b's historical 509: six new catalog regressions, one new advice database regression, thirteen equipment database cases and six web renderer/cache/client cases.

- The 13 actual equipment database cases cover auth/ownership/no-account creation; unsafe and opaque keys; all five pieces and unadjusted stored talents; legacy provenance; explicit empty versus absent sections; unassigned inventory; foreign legacy relations; omitted-section preservation; replacement/UUID regeneration with goals/routines intact; transaction failure rollback after partial writes; paused concurrent import showing wholly old then wholly new detail/receipt; unsupported substat JSON/slot keys; and instrumented one-SELECT reads with unchanged persistence.
- Six web tests use the actual component renderer, API client and query-cache module. They exercise five-slot/missing-state rendering, empty replacement wording, opaque stats and absent amount/score claims, encoded natural keys and bearer/signal propagation, successful prefix invalidation/failed refresh retention, and delayed old-session query isolation.
- C2b focused execution passed 46 tests: 37 catalog plus nine actual database cases. The added stock/receipt concurrency regression exercises the real importer with a paused replacement and checks query count and both committed snapshots. Existing C2a/import/security cases all ran in the full suite.
- API/web ESLint with zero allowed warnings, shared-contract TypeScript build, API TypeScript/alias/static-copy build, web `tsc -b`/Vite build and focused changed-file Prettier passed. `git diff --check` passed. Whole-tree Prettier retains exactly the five preexisting exceptions listed below.

Vitest runs directly, never through Turbo. The final invocation, from `apps/api`, was:

```powershell
$env:DOTENV_CONFIG_PATH = 'NUL'
$env:NODE_ENV = 'test'
$env:DATABASE_URL = 'postgresql://celestia_test@127.0.0.1:55444/celestia_test_c3a'
$env:CELESTIA_TEST_DATABASE_URL = $env:DATABASE_URL
$env:JWT_SECRET = 'c3a-disposable-validation-secret'
$env:OPENROUTER_API_KEY = 'c3a-disposable-dummy'
node node_modules/vitest/vitest.mjs run --no-file-parallelism
```

Integration guards require a loopback `celestia_test_*` database. A fresh PostgreSQL 18.4 cluster at `%TEMP%/celestia-c3a-pg-20261002` on 127.0.0.1:55444 applied only the eleven existing migrations to `celestia_test_c3a`. The real `.env` database was never loaded or migrated. After interruption the cluster recovered and the same disposable fixture was reused.

An earlier October 2 full run passed 534 tests before the stock/receipt regression was added. The October 3 parallel full attempt passed 530 and failed five import-setup cases with serialization conflicts. PostgreSQL logged read/write dependency pivots during account/receipt writes among overlapping test files. The final command serializes files sharing this database; explicit concurrency/rollback tests within files still execute and no case was skipped, suppressed or retried by a production change. Preserve this invocation for reproducible shared-fixture validation. Existing pg-driver overlapping-query deprecation warnings remain in integration output. Logs are retained at `%TEMP%/celestia-c3a-final-serial-tests.log` and `%TEMP%/celestia-c3a-final-tests.log` (the unsuccessful parallel attempt).

Build/check commands used package-local executables without Turbo: `node node_modules/eslint/bin/eslint.js . --max-warnings 0`; `node node_modules/typescript/bin/tsc` for shared contracts; API `tsc --noEmit`, `tsc`, `tsc-alias` and the package build's static-copy operation; web `tsc -b` and `node node_modules/vite/bin/vite.js build`. Browser preview builds supplied `VITE_API_URL=http://127.0.0.1:45444/api/v1`; the final web build restores normal configuration. Focused formatting includes both new tooling files explicitly.

## Actual browser acceptance

Chrome loaded the built app on 127.0.0.1:45445 against the actual API on 127.0.0.1:45444 and the guarded disposable database. [The test-only fixture](../../../apps/api/tooling/character-equipment-browser-fixture.mjs) registers synthetic users through real authentication and seeds equipment through real preview/commit. Credentials and data are synthetic; these captures are application acceptance evidence, not game observations. The fixture's optional bounded response delay demonstrated loading without altering application code.

| Scenario                                            | Observed result and saved capture                                                                                                                                                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Complete detail from roster, desktop/mobile         | Stored 80/A6/C3, talents 9/12/15, StaffOfHoma, five pieces, opaque keys and zero substat. [Desktop](browser-complete-desktop.jpg), [mobile](browser-complete-mobile.jpg).                                                                               |
| Character-only import through preview/commit        | HuTao level 80→81 at the same URL; old weapon/artifact values and section receipts remain. [Capture](browser-character-only-refresh.jpg).                                                                                                               |
| Weapon-only replacement through preview/commit      | Same URL displays UnknownWeapon level 40/A2/R1; all five existing artifacts remain. Replacement is visible in the refresh-error capture.                                                                                                                |
| Failed refresh and retry                            | Stop only the fixture API, refresh: cached equipment remains with visible error and previous-records label. Restart and retry removes the error. [Capture](browser-refresh-error.jpg).                                                                  |
| Sign out and switch synthetic users at the same URL | Partial user shows its own level 80, one UnknownSet flower, four unrecorded slots and unknown weapon provenance, without previous user's level 81/weapon/five-piece data. [Desktop](browser-partial-desktop.jpg), [mobile](browser-partial-mobile.jpg). |
| Unknown character key from roster                   | UnknownPilot retains readable initials/key and partial-data semantics. [Capture](browser-unknown-key.jpg).                                                                                                                                              |
| Missing character / no-import account               | Owned missing-key 404; third synthetic account at the same HuTao URL shows no-import explanation, without cached prior data. [404](browser-not-found.jpg), [no import](browser-no-import.jpg).                                                          |
| Failed preview                                      | MissingCharacter weapon location rejected through the UI; returning to detail retains previous weapon/artifact records and receipt. [Capture](browser-failed-preview.jpg).                                                                              |
| Failed mapped image                                 | TheCatch's existing invalid asset mapping returns 404; initials/name/key/progression remain readable and no broken image remains. [Capture](browser-failed-image.jpg).                                                                                  |
| Fresh loading                                       | Bounded test transport delay shows loading status and disabled Refreshing button. [Capture](browser-loading.jpg).                                                                                                                                       |

All five slots are visible when scrolling mobile; measured content width equals viewport content width with no horizontal overflow. Captures were visually inspected. The acceptance tab was closed and viewport overrides reset after checking.

## Preservation and finish

All eight [protected SHA256 hashes](preservation-check.json) match C2b/C2a, including the original Turbo log, API env/package/OpenRouter work, lockfile, original Sonnet submission and C2a migration. Existing local milestones and unrelated work remain in the dirty checkout. The five whole-tree formatting exceptions remain: `apps/api/src/core/ai/openrouter.ts`, `docs/plans/c2a-clock-task-reliability/sonnet-walkthrough-submitted.md`, `apps/web/index.html`, `apps/web/src/App.css`, and `apps/web/src/index.css`.

Temporary API/web preview and disposable PostgreSQL services are stopped, with ports 45444/45445/55444 closed. Temporary database and validation logs are retained for inspection. No staging, commits, pushes, deployment, production migration, external message or release action occurred. Missing ascension/candidate/route evidence remains unavailable; C3b is next only under separate authorization.
