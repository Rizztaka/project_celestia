# C2a continuation walkthrough — 2026-10-02

**Implementers:** Sonnet 4.6 began C2a; Codex continued the interrupted implementation at the owner's explicit request on September 29–October 2.  
**Status:** C2a implementation and local acceptance complete; selected Asia clock activated October 2. Independent review and release remain separate. No commit, push, deployment, or production migration. Earlier dated checks below describe the state at their time; the October 2 section records final activation.

## Result

The current tree fixes the defects recorded in the September 27 review: startup remains lazy with respect to provider registration; all Planner daily/weekly callers use V2; strict schemas are enforced at the service boundary; expired sibling flags are normalized before partial saves; the clock gate is enforced; unknown resin does not become zero in Planner guidance; platform production code uses the provider contract.

The original [Sonnet submission](sonnet-walkthrough-submitted.md) remains unchanged as historical evidence. The prior [review](implementation_review.md) and [repair instructions](sonnet-review-followup.md) describe the state before this continuation. Do not interpret their old failures as current test results.

## Implementation details

- `RoutineService` now has a single owner-locked transaction path for settings, checklist, resin, and weekly saves. It validates revision, selected server, and applicable period IDs against one time sampled after the owner lock and row read. First creation uses the same lock. It normalizes expired daily/weekly state before applying an action, preserves same-period siblings, increments one shared revision, and constructs the response within the transaction. No automatic mutation retry.
- The repository accepts an injected Prisma client; legacy reads can share the transaction. This permits real isolated PostgreSQL tests and rolls back writes when response construction fails.
- Shared strict V2 schemas reject caller-owned identity, client timestamps, empty daily actions, unrelated action fields, unsupported servers, invalid amounts, and invalid revision bounds. The dedicated `/routine/*` route namespace is documented; former paths deliberately return 409 rather than silently accepting old clients.
- Snapshots include server time even while the clock is unavailable, explicit clock status, original resin checkpoint/policy values, and discriminated unknown/known resin. Invalid or future checkpoints remain unknown. Production registration enables verified Asia; tests retain explicit unavailable-policy coverage.
- `RoutinePanel` replaces the retired daily/weekly frontend paths. It uses one authoritative query, one shared pending-save gate, full confirmed responses, cancellation of in-flight queries before writes, revision/time ordering, and no optimistic rollback or mutation retry. Original checkpoint arithmetic preserves partial regeneration ticks. Monotonic elapsed time drives local ticks; boundaries, focus, visibility, and reconnect trigger refreshes. Failed/expired reads disable saves while retaining labeled cached values. Existing per-session QueryClient isolation remains in place.
- Daily and weekly controls enable only selected Asia and explain unavailable clocks otherwise. Resin begins unknown, including for legacy users. Transformer is a manual last-use record. Weekly input is a nullable aggregate reward-claim total, with no per-boss cost/drop advice, automatic resin debit, or material credit. Legacy records are shown separately without conversion.
- Today Domains and Planner Intelligence use the selected provider clock. Unavailable clock/unknown resin produces actionable 422 responses. The UI shows these errors independently and hides stale domain advice after a failed refresh. Recommendation algorithms were not expanded.
- Added ADR 0013, the API contract guide, current handoff/checklist updates, and narrow feature/ADR status notices. CI's explicit integration step now names both importer and routine integration suites. CI itself has not run.

## Validation actually performed

| Check                                                               | Result                                                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Direct full Vitest, September 30, with explicit disposable database | **475 passed, 33 files, 0 skipped, 0 failed**                        |
| PostgreSQL cases included in that count                             | 16 importer + 12 routine cases                                       |
| Candidate clock/projection suite under `TZ=America/Los_Angeles`     | 55 passed                                                            |
| Same suite under `TZ=Asia/Tokyo`                                    | 55 passed                                                            |
| API ESLint, all files, no cache, max warnings 0                     | Passed                                                               |
| Web ESLint, all files, no cache, max warnings 0                     | Passed                                                               |
| Shared-contract TypeScript build                                    | Passed                                                               |
| API TypeScript build, alias rewrite, static-data copy               | Passed                                                               |
| Web TypeScript project build and Vite production build              | Passed                                                               |
| Preservation checks against continuation-start hashes               | All 8 passed; see [preservation-check.json](preservation-check.json) |

The full suite includes real-app HTTP startup/authentication/strict-contract/compatibility tests, direct service validation, provider-gated indirect consumers, pure clock/resin tests, client time/response-ordering helpers, existing auth-session isolation tests, and the earlier lint/import/security coverage.

The PostgreSQL routine tests prove:

- One concurrent first save succeeds and one conflicts; existing different-field writes sharing a revision also have exactly one winner.
- A request actually waiting on a PostgreSQL owner-row lock across the candidate reset boundary rejects its old period after acquiring the lock.
- A direct partial daily save without a prior GET clears expired sibling/weekly state while retaining manual Transformer time; same-period partial saves retain their sibling.
- Zero weekly claims is known; null is unknown; neither affects resin.
- Stale revision/server/day/week requests do not alter state. Forced post-write response failure rolls back both creation and updates.
- Database checks enforce server/revision/checkpoint pair/ranges. Direct and indirect HTTP GETs are instrumented as SELECT-only.
- A populated C1b schema upgrades without changing legacy companion, user/account, materials, provenance, or goal values, and without creating routine rows. The fixture schema is transaction-local and rolled back.
- First and replacement imports preserve routine state; routine saves preserve inventory, provenance, and legacy rows.

An early migration-fixture test had an incorrect relative path to the migration directory. It was corrected and the upgrade test passed; the final full suite above includes the corrected test. A PostgreSQL driver deprecation warning about overlapping client queries remains in the combined import exercise; it is not a test failure and this pass did not change unrelated importer internals.

### Exact command forms

From `apps/api`, with the test URL explicitly set for the full suite:

```powershell
$env:CELESTIA_TEST_DATABASE_URL='postgresql://celestia_test@127.0.0.1:55440/celestia_test_c2a'
node node_modules/vitest/vitest.mjs run
node node_modules/eslint/bin/eslint.js . --max-warnings 0
node node_modules/typescript/bin/tsc
node node_modules/tsc-alias/dist/bin/index.js
node -e "require('fs').cpSync('src/games/genshin/static', 'dist/games/genshin/static', {recursive:true, force:true})"
```

From root: `node apps/api/node_modules/typescript/bin/tsc -p packages/api-contracts/tsconfig.json`.

From `apps/web`: `node node_modules/eslint/bin/eslint.js . --max-warnings 0`, `node node_modules/typescript/bin/tsc -b`, and `node node_modules/vite/bin/vite.js build`.

Candidate timezone checks used the same direct Vitest executable and the two files `src/games/genshin/companion/server-clock.test.ts` and `routine-policy.test.ts`, with the two process-local TZ values above. No machine timezone setting was changed.

No Turbo tests ran. Final test output was captured outside the repository at `%TEMP%/celestia-c2a-full-tests.log`; the preserved Turbo log was not used as fresh evidence.

### Disposable database and browser

Native PostgreSQL 18.4 binaries at `D:/PostgreSQL/bin` initialized `%TEMP%/celestia-c2a-pg-20260929`, loopback-only `127.0.0.1:55440`, database `celestia_test_c2a`, test role `celestia_test`. Sandbox restrictions prevented native restricted-token startup; the explicit disposable-cluster startup escalation succeeded. All 11 migrations were applied to the empty test database via the direct Prisma CLI, with `DATABASE_URL` explicitly set to that test URL. No existing development or production database was used.

The cluster and local preview servers stopped between sessions and were restarted on September 30. PostgreSQL recovered its test data successfully. A brief browser dynamic-import error while the preview server was stopped cleared after restart/reload; it was not an application startup regression.

Browser checks used only the synthetic `c2a-browser@test.invalid` account in this disposable database, an API bound to `127.0.0.1:45440`, and Vite bound to `127.0.0.1:45441`. Real `.env` loading was disabled for the API preview and test-only auth/AI values were supplied; no AI request was made.

Observed in the actual browser:

- New user: unknown resin, unselected server, disabled reset-dependent controls.
- Explicit zero save: `0 / 200`, with all routine controls disabled during the pending save.
- Asia selection: preserved selection and explicit unverified-clock message; no daily or weekly actions enabled.
- Manual Transformer use: server-confirmed last-use timestamp; no cooldown claim.
- Weekly view: unknown total, disabled editor, no discount estimate.
- Second API client updated resin; a stale browser save produced a visible conflict, fetched the other client's value, and retained unsaved input instead of silently overwriting it. This was a second-client scenario, not a claim of two automated browser tabs.
- Legacy amount 55 remained a separate read-only record while current V2 resin came from its own checkpoint.
- Today Domains prerequisite error appeared independently of routine/manual controls.
- At 390px viewport width, tab and manual-action buttons wrapped inside the document. The clipped-tab issue found during this check was fixed; viewport override was reset afterward.
- With the fixture API stopped, Refresh showed a visible fetch error, retained cached resin, and disabled saves. Restart plus Refresh cleared the error and re-enabled manual controls.
- Reloading the fixture on the next day projected the old checkpoint to cap. Candidate boundary and device-clock-jump behavior is covered by automated helpers/service tests; the initial pass did not exercise an enabled-clock browser reset. The isolated October 1 test below now covers that UI behavior.

The saved [browser capture](browser-check.png) shows the local V2 surface. The API and Vite preview services were stopped on September 30. The final PostgreSQL stop request did not execute because automatic approval review could not complete after the usage limit was reached. On October 1, a read-only `pg_ctl status` check reported no server running, and the fixture ports had no listeners. No cleanup action remains blocked. The disposable data directory is retained, not deleted.

## October 1 finishing pass

Rechecked the final fetch/save error messages and offline loading state. Fixed the boundary timer to invalidate Today Domains and Planner Intelligence as well as the routine, and added a fresh monotonic expiry check at submission so a delayed background-tab tick cannot submit an expired displayed snapshot. Rechecked web lint, types, build, and the client helper tests after these edits; the September 30 full PostgreSQL-backed suite remains the backend evidence because no backend code changed in this pass.

A focused official-source search still did not establish the complete required reset policy. Community guides and web-event schedules were not accepted as replacements. C2a remains partial; a next-phase implementation prompt has not been issued.

## Formatting and preservation

Changed implementation/docs files were formatted and checked. The earlier format check reported two deliberately preserved files: unrelated `apps/api/src/core/ai/openrouter.ts` and the original `sonnet-walkthrough-submitted.md` evidence copy. The October 2 final whole-tree check reports five exceptions, detailed below. No formatter exclusion or unrelated formatting repair was added to hide them. The raw Sonnet submission remains byte-for-byte unchanged.

The protected Turbo log remains SHA256 `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`. AI/env files, API package manifest/OpenAI dependency, lockfile, the original submission, and the existing C2a SQL migration match the continuation-start hashes. Earlier committed migrations have no diff. No broad staging, reset, clean, or commit occurred.

## Remaining gates and release limits

1. Asia timing evidence was accepted October 2; see [sources.md](sources.md) for the distinction between official text, weekly screenshot, and owner-reported daily observation. Passing fixtures are not additional game evidence.
2. Production-default activation and controlled-time browser boundary checks passed October 2. No independently timed live game/server rollover is claimed. Discount/cooldown evidence remains separate.
3. Independent reviewer acceptance remains appropriate. C2b/C3, catalogs, optimizer, and broader navigation/goal redesign were not started.
4. Any release requires new authorization: backup, additive migration before the new API, coordinated V2 frontend/API cutover, and no old/new writer overlap. Preserve the additive table on rollback; do not copy claims into defeats or restore write-on-GET behavior.
5. Sonnet's original unspecified “development database” migration target has not been verified. This continuation makes no claim about it or about deployed state.

The next session should start at [CURRENT_HANDOFF](../CURRENT_HANDOFF.md), not the older changes-required review.

## October 1 enabled-clock acceptance continuation

The owner explicitly requested completing the remaining work. Added `apps/api/tooling/routine-browser-fixture.mjs`, an isolated harness using the real RoutineService/repository and disposable PostgreSQL database, with a provider injected as verified and a tester-controlled clock file. It does not change the production provider flag, add an application clock endpoint, or load a real environment file. It refuses non-loopback databases or names outside `celestia_test_*` and binds only to 127.0.0.1:45440. Other routes delegate to the existing app; indirect clock consumers therefore remain gated in this fixture.

Observed in the real local Planner UI on the synthetic account:

- Saved commissions, then Teapot; both confirmed flags remained checked.
- Saved weekly total zero, cleared it to unknown, then saved three.
- Advanced the fixture to ten seconds before the Sunday 20:00 UTC boundary and refreshed once. Without another click, the browser timer refreshed the snapshot after the boundary: weekly total became unknown and its countdown advanced to 168 hours.
- Returning to Daily showed both flags false and a 24-hour countdown. Resin remained at its projected cap and the manual Transformer timestamp was unchanged.
- The checkbox automation initially reported failure because the confirmed-response UI temporarily disabled the checkbox; the next observation showed the successful persisted checked state. No retry was sent.

[Enabled-clock test capture](enabled-clock-test.png) is fixture evidence, not an observation of Genshin's actual clock or proof that production activation is approved. The 60 clock/projection/client-helper tests passed again; the fixture lint and API build passed. The previous full-suite result remains 475 because the harness adds no unit cases.

Reproduction after building the API and starting the disposable database:

```powershell
# From apps/api; clock file contains an ISO UTC instant and advances monotonically from each change.
$env:CELESTIA_TEST_DATABASE_URL='postgresql://celestia_test@127.0.0.1:55440/celestia_test_c2a'
$env:CELESTIA_TEST_CLOCK_FILE=Join-Path $env:TEMP 'celestia-c2a-browser-clock.txt'
Set-Content -LiteralPath $env:CELESTIA_TEST_CLOCK_FILE -Value '2026-10-04T19:59:50.000Z'
node tooling/routine-browser-fixture.mjs
```

The official-site browser request was denied, then rejected again by a saved permission setting after the owner explicitly allowed it and reported updating the setting. No raw HTTP, alternate-browser, or proxy workaround was attempted after this denial. Current evidence still does not establish the whole required daily/weekly/timezone rule. C2a remains partial pending primary evidence and default-provider activation/acceptance; the isolated test removes the outstanding candidate-clock UI uncertainty, not the source gate.

After this fixture pass, both preview listeners and the disposable PostgreSQL cluster were stopped successfully. All eight preservation hashes still match the continuation baseline. No application verification flag, production database, deployment, or Git commit was changed.

## October 2 final activation and acceptance

The owner explicitly confirmed Asia's daily reset at 04:00 UTC+8 / 01:30 IST from an overnight play session in which daily Welkin availability and the Handbook refreshed together. This attributable retrospective report closes the remaining daily timing gap alongside official timezone/daily-mechanic text and screenshot 1121's exact weekly rule. Its original session date/build and exact capture times were not supplied; the evidence record does not invent them. No extra Welkin feature is added.

Set `ASIA_CLOCK_GATE_CLOSED=true`. The application still registers `new GenshinCompanionProvider()` with no request/environment override. Only Asia is supported. Updated the browser harness and integration/consumer tests to use the same production default. Unverified service tests explicitly inject false, preserving unavailable-path checks independently of production state.

The real-app HTTP activation test now verifies selected Asia periods, confirmed daily and partial sibling saves, explicit zero weekly claims, manual Transformer use with a current period, read-only complete snapshots, and rejection of an older null-period client with 409. Added a default-provider read test. The activated PostgreSQL GET test supplies known resin and an existing goal so Today Domains and Planner both succeed, then checks every executed query is SELECT and storage remains byte-for-value unchanged.

Final full direct Vitest: **476 passed, 33 files, 0 skipped, 0 failed**, including 16 importer and 12 routine PostgreSQL cases. API/web ESLint passed with maximum warnings zero. API TypeScript, alias rewrite and static copy, plus web TypeScript/Vite build passed. All eight protected hashes match the continuation baseline. Final formatting/preservation results are recorded below. Tests were run against the existing guarded loopback `celestia_test_c2a` database only, not a real environment database. Test log: `%TEMP%/celestia-c2a-activation-tests.log`.

Actual browser checks against `tooling/routine-browser-fixture.mjs` with `new GenshinCompanionProvider()` and only an injected acceptance time:

- Partial commission uncheck retained the Teapot flag; subsequent confirmed saves persisted both flags.
- Weekly totals changed through explicit zero, unknown, and three, with cost/discount estimates still unavailable.
- At the controlled Sunday-to-Monday boundary, automatic refresh changed weekly three to unknown and daily flags to false. Resin remained capped from its existing checkpoint and the manual Transformer timestamp remained unchanged.
- At the following daily-only boundary, automatic refresh changed daily flags to false while retaining weekly three. No second click was used to trigger either rollover.

Captures: [activated daily reset](activated-daily-reset.png), [activated weekly reset](activated-weekly-reset.png), [weekly total retained after daily-only reset](activated-daily-only-weekly.png). These are Celestia application fixtures, not game-source evidence. Both exact boundaries were exercised with controlled time; this pass did not keep the app running overnight against elapsed wall-clock time.

C2b's bounded plan and implementation prompt are prepared in `../c2b-data-trust/`. C2b is not implemented; clock acceptance does not validate domain locations, material keys/costs, legacy ranking assumptions, events, or weekly drops. Independent review and any release remain separately authorized.

Final cleanup and preservation: API ESLint passed again after the last fixture/test edit and formatting. Explicitly formatted C2a code and documentation pass formatting. The whole-tree formatter still reports five existing exceptions: protected OpenRouter code and the raw Sonnet submission, plus unchanged baseline `apps/web/index.html`, `apps/web/src/App.css`, and `apps/web/src/index.css` (no Git changes in those three). No unrelated formatting repair was made. `git diff --check` passed; Git's LF/CRLF notices are informational. All eight protected SHA256 hashes still match. The fixture API, Vite preview, and disposable PostgreSQL were stopped successfully; no listeners remain on ports 45440, 45441, or 55440. Test data and logs remain available locally. No staging, commit, push, deployment, production migration, or destructive cleanup occurred.
