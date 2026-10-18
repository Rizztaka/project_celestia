# C3b implementation review and next-phase handoff

Reviewed 2026-10-05 in the existing `D:\Genshin Personal\project-celestia` checkout under the owner's authorization for review, corrective fixes and validation. The [October 4 walkthrough](walkthrough.md) remains the historical implementation record. No C4 application implementation or release action was performed.

**Result:** bounded C3b meets its implementation contract after the corrections below. No remaining blocking defect was found in the reviewed paths. This is evidence from source review, automated tests and targeted browser acceptance, not a guarantee that every possible defect is absent or an approval to deploy.

## Findings and corrections

### P2 — legacy priority changes were not independently reachable in the UI — fixed

The API permits priority-only changes to active/paused legacy goals with an invalid stored range or talent slot. `GoalManager` exposed only the combined range/priority editor, whose numeric constraints and service intent validation prevented changing priority without repairing historical intent.

Added `GoalPriorityForm` and **Edit priority only** on active/paused goals. It submits the existing V3 `priority` command with the displayed expected revision, omitting target/range/slot fields. It reuses originating-session guards, confirmed-response merging, conflict refresh and invalidation. Its stable editor key retains the draft during refresh.

Evidence: actual client command-body/form regression, strengthened PostgreSQL legacy test proving target/slot/range/status preservation, and the browser save/failure/refresh checks below. No API contract, schema or migration change was required.

### P2 — fixed legacy talent slots could display a valid substitute — fixed

The form had only three valid talent options. An unsupported stored string had no matching option; a null/missing slot defaulted to `normal`. The server retained identity, but the form could misrepresent it.

Fixed legacy talent forms now explicitly select an unsupported option, displaying `(missing)` for absent slots. New goal creation retains its normal default. Three render regressions cover unsupported strings, null and absent values while retaining malformed ranges. Browser acceptance verifies the selected `invalid` slot.

## Review coverage

| Area                    | Inspection and result                                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persistence/migration   | Additive SQL/schema, neutral defaults, constraints, retained IDs/values/timestamps, no invented focus/completion history, populated legacy and fresh-chain migration tests.                       |
| Ownership/concurrency   | Owner-row locks, expected revisions, create request uniqueness, unique successor chain, rollback, import interleavings and foreign-ID behavior.                                                   |
| Lifecycle/compatibility | Strict versioned transition commands, completion metadata retained through archive, successor history, old unversioned create/owned DELETE failing closed, preserved malformed/duplicate intent.  |
| Planning consumers      | GoalService materials/Today and direct PlannerIntelligence reads/calculator use active, unambiguous demand and user priority with stable ties. Focus stays independent.                           |
| Trust/progress          | Separate cost/route gates, Mora, coherent stock receipts, partial/unknown deficits, no automatic progress/completion, talent-convention inference or weapon-copy inference.                       |
| Client/session          | Forms, manager, focus/detail/roster, token pinning, session generation, cancellation, confirmed revisions and cross-namespace invalidation; old-owner responses cannot overwrite the new session. |
| Existing acceptance     | October 4 desktop/mobile lifecycle, import, empty-account, conflict and owner-switch evidence reviewed. This review adds focused browser checks for its corrections.                              |

Broader C3 examples remain deliberately bounded by the executed prompt. Artifact targets, higher talents, presets, snapshots and manual equipment editing are explicit deferrals. The roadmap's focused-character/re-import/known-progress criterion is met by the existing C3a/C3b implementation and recorded acceptance.

## Validation executed for this review

Final direct Vitest passed **601 tests / 39 files / zero failures or skips**. All **78 actual PostgreSQL cases** ran: 16 importer, 12 routine, 9 catalog advice, 13 equipment and 28 focus/goal lifecycle. Client goal regressions now total 14. The existing legacy integration case additionally asserts that priority-only mutation retains the malformed goal's target, slot, range and active status.

Commands ran package-locally in the D: checkout. All database execution explicitly targeted `postgresql://celestia_test@127.0.0.1:55446/celestia_test_c3b`, with `NODE_ENV=test`, `DOTENV_CONFIG_PATH=NUL`, both database variables and dummy JWT/OpenRouter values. Guards reject unsafe destinations before connecting. No normal or production database was migrated.

```powershell
# apps/api, with the guarded disposable environment above
node node_modules/vitest/vitest.mjs run --no-file-parallelism
pnpm lint
pnpm check-types
pnpm exec prisma validate
pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code

# apps/web
pnpm lint
pnpm build

# checkout root; explicit touched-file list only
$files = Get-Content docs/plans/c3b-focus-goals/touched-files.json | ConvertFrom-Json
pnpm exec prettier --check @files
git diff --check
```

API/web lint, API type checking, web type checking/build, schema validation and disposable schema diff pass. The final web build uses normal configuration after the browser-only loopback override. Shared contracts/API production code did not change in this review; their earlier build evidence remains in the October 4 walkthrough. No dependency update was installed.

An initial correction run passed 599 tests. After extending slot coverage to null/missing values, one invocation omitted dummy credentials: eight suites failed at environment setup while 493 tests passed. Correcting only that invocation's environment produced the final 601/39 result above. Final log: `%TEMP%/celestia-c3b-review-final-tests.log` (14:13:33 start, 181.09 seconds). The existing `pg` overlapping-query warning remains visible in concurrency cases; no dependency update or suppression was introduced. CI has not run for this unpushed local tree.

## Targeted browser evidence

Used the built web app on loopback 45447 and the test-only API fixture on 45446, with a synthetic owner and malformed legacy goal (`LegacyReviewTarget`, slot `invalid`, range -8→99). Used the available in-app browser after Chrome automation was unavailable; no extension setting was changed.

- Priority-only saves changed persisted priority 3→1, then 1→2, advancing revisions while preserving active status, target, slot and range. Reopening showed confirmed priority 2/revision 2. [Verified result](browser-review-legacy-priority.jpg).
- Controlled 503 retained draft priority 5 and confirmed priority 1. Explicit refresh retained the draft and showed the refreshed-state message. Removing the fixture failure allowed a deliberate successful save. [Failure state](browser-review-priority-failure.jpg).
- The range editor explicitly selected **Unsupported stored slot: invalid**, retaining -8 and 99. [Stored slot](browser-review-legacy-slot.jpg). Null/missing variants have render regressions; they are not claimed as additional browser runs.

The confirmed priority screenshot was visually inspected. An earlier pending capture was replaced with the confirmed result and is not counted as successful-save evidence. All fixture values are synthetic application data, not new game evidence.

## Preservation, limits and next phase

The [starting record](review-starting-state.json) and [final preservation record](review-preservation-check.json) verify unchanged HEAD, an empty index and all eight inherited protected hashes. The five unrelated formatter exceptions remain. No earlier work was reset, cleaned, staged or committed. Review changes are limited to the priority editor, legacy-slot display, their regressions and handoff/evidence documents.

Owned API/preview processes and the disposable PostgreSQL cluster are stopped. Ports 45446, 45447 and 55446 were confirmed closed; the review tab was closed. No deployment, push or production migration occurred.

**Next: C4 Today and weekly plan.** The [execution prompt](../c4-today-weekly-plan/implementation-prompt.md) defines a useful manual home, user choices, deterministic budget accounting and reset/session-safe persistence. All production farming routes remain unavailable; synthetic allocation tests must not be promoted into catalog evidence. C4 still requires the owner's explicit request to execute its prompt. Release remains a separately authorized coordinated migration/API/web cutover.

## C4 execution follow-up — 2026-10-06

The original review above remains historical. The authorized [C4 implementation](../c4-today-weekly-plan/walkthrough.md) rechecked ownership, replay/conflict handling, duplicate/malformed preservation, active consumers, re-import continuity and originating-session guards. The inherited full 601/39/78-PostgreSQL baseline passed. Browser acceptance again changed a malformed goal's priority without repairing its invalid slot or -8→99 range; pause/resume and exact goal links retained history. No lifecycle correction was needed. C4 found and corrected naive UTC receipt serialization in reused material/equipment reads, with a failing-then-passing exact-timestamp database regression. See the C4 walkthrough for the new 691-test result and boundaries; it does not replace the historical review counts above.
