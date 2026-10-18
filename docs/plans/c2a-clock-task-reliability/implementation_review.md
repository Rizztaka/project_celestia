# C2a Sonnet implementation review

Date: 2026-09-27. Reviewer: Codex. **Disposition: changes required; partial implementation, not accepted.** This review does not implement fixes, change databases, or authorize a release.

Reviewed the owner's pasted Sonnet walkthrough, current source/diff, original C2a plan/checklist, and source gates. The submitted walkthrough is preserved in [sonnet-walkthrough-submitted.md](sonnet-walkthrough-submitted.md). Findings below concern the new C2a work, not the earlier lint/import milestones.

## Findings, in repair order

### R1 — P1: API initialization fails before routes can serve requests

`apps/api/src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.ts:78` resolves the provider inside its constructor. Its controller is constructed while the Genshin route module is imported. `app.ts` registers the provider only after those imports evaluate. Consequently importing the application throws `CompanionProvider for gameId "genshin" is not registered.`

This was reproduced in both `security.http.test.ts` and `importer.http.test.ts`: neither suite can collect tests. It is an application bootstrap regression, not merely a missing test mock. Resolve dependencies after registration, or inject them from an explicit composition step. Do not pre-register only in tests to hide the runtime ordering bug. Require both existing HTTP suites and a real app-import smoke check to pass.

### R2 — P1: Current frontend is stranded on rejected endpoints

`apps/api/src/platform/companion/companion.routes.ts:63-67` now sends every old routine request to a 409 handler. But `apps/web/src/lib/api.ts:239,251-255,427,434` still uses those endpoints and the old types. PlannerPage is unchanged. The current frontend therefore cannot load daily/weekly state or save routine changes after the API bootstrap is repaired. Reloading serves the same incompatible client.

The walkthrough's claim that frontend work is a separate milestone contradicts the agreed C2a plan. Finish the shared V2 client, server selection, unknown resin display, manual Transformer record, weekly claim total editor, period/revision submission, visible conflict recovery, reset/focus refresh, response-order guards, and secondary-panel error handling within C2a. Preserve the existing auth-session QueryClient isolation. Do not restore unsafe V1 writes as a shortcut.

The `/routine/*` namespace also differs from the specified versioned existing paths. Either restore the planned V2 adapters/aliases, or explicitly document the new route contract and migrate all callers in the same milestone. A new namespace alone is not the functional blocker; an incompatible current client is.

### R3 — P1: Partial daily saves resurrect a previous day's completion

`apps/api/src/platform/companion/routine.service.ts:177-180` changes `dailyPeriodStart` to the current day while updating only submitted flags. It never resets the other stored flag. Example: yesterday's row has both flags true; after reset, submit only `commissionsDone:false` with the current period and revision. The stored `teapotChecked:true` survives, is now stamped as today's, and the returned projection reports Teapot complete today.

GET's false projection cannot fix this because the mutation reads the raw stored row. Normalize the effective current-period state inside the owner-locked transaction before applying the delta. Add tests for both directions, true and false inputs, a reset crossed without prior GET, and preservation of siblings within the same period. Normalize expired weekly state as specified without touching manual Transformer/resin observations.

### R4 — P2: Unknown resin and unselected-server states still produce advice

`planner-intelligence.service.ts:100-102` explicitly maps unknown resin to zero. That manufactures a resource amount and cap ETA; it also bypasses the planned actionable 422 response. Its weekday helper uses Asia regardless of the user's selection. `goal.service.ts:363-364` likewise applies Asia unconditionally without reading selected-server availability.

Use the public routine/provider projection to reject unavailable clock inputs and unknown resin with actionable 422 errors. A known zero must remain valid. Pass one injected/snapshot instant through resin, weekday, and response metadata. The current Planner Intelligence `new Date()` plus RoutineService's own clock are two distinct samples, despite comments claiming one. Use the existing projected cap instant rather than recomputing an ETA that discards the partial tick. Keep recommendation algorithms otherwise unchanged.

### R5 — P2: Platform imports bypass the intended provider boundary

`routine.service.ts:46-51` directly imports Genshin projection and clock helpers; `goal.service.ts:8` directly imports the Genshin clock. These are three confirmed ESLint boundary violations. The new provider `getServerWeekday` method does not fix the boundary if callers bypass it.

Expose the required projection/period/normalization operations through the core companion interface and Genshin provider, then use that contract from platform orchestration. Do not suppress or weaken boundary lint. Keep Genshin constants out of new platform code. Fix the five import-order errors in the same touched files.

### R6 — P2: The unresolved clock source gate is only a comment

`routine-policy.ts:193-214` returns active period metadata whenever serverId is Asia. Settings accepts Asia, and daily/weekly mutations then accept its candidate periods. No runtime unavailable gate prevents unverified clock-dependent actions. The source document still records missing primary evidence.

Close the narrow Asia source gate with evidence, or return an explicit unavailable-clock state and reject clock-dependent mutations until it is closed. Apply the same decision to Today/Planner callers. A `CANDIDATE POLICY` comment does not enforce this behavior. Keep pure candidate fixtures if helpful. The explicit unavailable weekly discount estimates are appropriate and should remain unavailable until verified.

### R7 — P2: Daily actions are accepted without any selected server

`packages/api-contracts/src/genshin/companion.ts:174-203` permits `setDaily` with both serverId and dailyPeriodId null. `routine.service.ts:161-180` then skips period validation and writes daily flags with a null period. The request reports success and advances revision even though projection immediately shows those flags false. This must be rejected before writing; only resin/manual Transformer actions may work without a selected server.

Use strict discriminated action schemas. The current objects strip unknown keys instead of rejecting them, and Transformer actions accept irrelevant daily flags that the service silently ignores. Reject mixed actions, legacy fields, client timestamps, and empty/nonmatching period IDs. Keep validation in the service boundary as required by the existing architecture, rather than trusting typed internal callers. Add HTTP tests proving the rejection has no side effects. This finding is established by source inspection, not the failed supplemental tsx probe described below.

## Fresh verification

| Check                                                       | Result                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct full API Vitest, no database variable                | **353 passed, 10 failed, 16 skipped; 3 files failed, 25 passed, 1 skipped.** Two failed files are HTTP-suite collection failures and do not contribute individual failed-test counts.                                                                   |
| Routine service tests                                       | All ten fail at `routine.service.test.ts:56`: CommonJS `require('./routine.repository.js')` cannot resolve the TypeScript module. They do not currently verify their described cases. Use a normal Vitest-compatible import/injected mocked dependency. |
| Existing security/import HTTP suites, targeted confirmation | Both fail during app initialization because the provider is not registered. No assertions execute.                                                                                                                                                      |
| Focused ESLint over changed companion production paths      | **8 errors**: 3 architecture-boundary violations and 5 import-order errors. No autofix performed. This was a focused check, not whole-root lint.                                                                                                        |
| API `node node_modules/typescript/bin/tsc --noEmit`         | Passes. Typechecking alone does not detect the startup or period bugs.                                                                                                                                                                                  |
| Native PostgreSQL C2a tests                                 | No new C2a integration test file present. No database tests or migrations run by this review. Existing 16 importer integration tests skipped.                                                                                                           |
| Frontend/browser/root build                                 | Not rerun in this review; frontend incompatibility established from routes and actual callers.                                                                                                                                                          |
| Protected Turbo log                                         | SHA256 remains `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`.                                                                                                                                                                      |

The pure clock/projection tests passing is useful but does not substantiate atomicity, HTTP compatibility, migration safety, or the walkthrough's verified service edge cases. A supplemental schema probe using tsx could not start because the sandbox's `os.userInfo` lookup returned `uv_os_get_passwd`/ENOMEM; no conclusion depends on that probe.

Commands used from `apps/api`: `node node_modules/vitest/vitest.mjs run` with `CELESTIA_TEST_DATABASE_URL` explicitly unset; targeted direct Vitest for the two failing HTTP files; direct installed ESLint over touched companion paths; direct installed TypeScript compiler with `--noEmit`. No Turbo test run, installs, autofixes, or source edits.

## Migration and handoff evidence still required

The SQL is additive on inspection and keeps the old companion tables intact. However, the walkthrough says it was applied to a “development database”; the plan authorized testing on an explicit disposable loopback `celestia_test_*` database. That wording does not establish which database was touched. Sonnet must supply the exact migration command and sanitized target host/port/database, explain whether it was disposable, and record the applied migration. Do not expose passwords, inspect production, or run another migration to manufacture evidence. If the target was not disposable, report that deviation; do not automatically undo it.

Before acceptance, add real PostgreSQL tests for first/existing concurrent writes, stale lock-wait across reset, rollback, read-only GETs (including indirect callers), fresh migration chain/legacy upgrade preservation, and import/routine isolation. Include C2a integration in the explicit CI integration step. Verify the versioned routes and owner isolation through HTTP. Run the complete local validation sequence and browser scenarios in the plan.

The repo had no saved C2a walkthrough and still described C2a as unimplemented when this review began. The submitted text is now saved separately as implementer claims, and CURRENT_HANDOFF records this review's partial/changes-required status. A narrow ADR/API note and accurate completed checklist remain part of Sonnet's finishing work.

See [Sonnet repair handoff](sonnet-review-followup.md). No implementation fixes were made by Codex.
