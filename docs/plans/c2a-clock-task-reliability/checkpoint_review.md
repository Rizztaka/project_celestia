# C2a checkpoint review

Date: 2026-09-27. Role: Codex architect/reviewer; Antigravity Sonnet 4.6 implements. This review changes documentation only.

## Checkpoint disposition

HEAD remains `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`. The 3A lint, C1a import, and C1b provenance/cache work is local and uncommitted. Reviewed their walkthroughs, relevant working diffs, importer transaction/token implementation, provenance migration, cache isolation, and current companion callers. No material regression was identified in those inspected milestone paths. This is a focused review, not certification of every changed file or deployed behavior.

| Milestone | Review evidence and limits                                                                                                                                                                                                                                                                                 |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3A        | API lint is wired into root tasks; boundary fixtures exercise aliases and extensions. Companion edits in this milestone only remove unused imports; the reset problems below predate it. No new root lint/build run in this review.                                                                        |
| C1a       | Optional sections survive validation; commit rechecks the preview snapshot under an owner lock in a serializable transaction. Existing owned characters participate in assignment resolution. Fresh service/HTTP tests passed. Database rollback/concurrency evidence remains the prior walkthrough's run. |
| C1b       | Selected-section metadata is written in the import transaction; the additive migration intentionally has no backfill. Auth-token changes isolate QueryClients. Five cache regressions passed again. No new database migration or browser exercise.                                                         |

Fresh verification: from `apps/api`, `node node_modules/vitest/vitest.mjs run`, with `CELESTIA_TEST_DATABASE_URL` unset in the child shell: **330 passed, 16 skipped; 25 files passed, one skipped**. Includes 22 security HTTP, 28 importer service, 10 importer HTTP, five cache, and ten lint-configuration tests. The skipped file contains the 16 native PostgreSQL tests. The earlier **346/26** result remains prior evidence, not today's database result.

The initial `pnpm --filter @celestia/api exec vitest run` attempt could not resolve the Vitest executable through the available pnpm shim. Direct invocation of the installed Vitest entry point succeeded; no install or dependency change was made.

Preserve the known pre-existing formatting failure in `apps/api/src/core/ai/openrouter.ts`. CI runs formatting before tests, so the recorded whole-tree format failure remains a release/CI limitation until separately addressed by its owner. No CI, deployment, or Render SHA was verified here.

## Findings for C2a

These are existing reliability defects or migration hazards, not regressions attributed to C1.

| Priority | Evidence                                                                                                                                                                                      | Required result                                                                                                                      |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| P1       | `companion.service.ts:75-86` initializes/resets on GET; `weekly-boss.service.ts:110-116` does the same. Planner Intelligence calls the daily getter at `planner-intelligence.service.ts:105`. | All these reads must become projections. Include indirect GET callers and absent-row cases in database verification.                 |
| P1       | `companion.service.ts:128` writes flags without normalizing their period. A first write after reset can retain yesterday's other flags and later be cleared by GET.                           | Normalize the current period and apply the submitted delta in the same transaction, without relying on a previous read.              |
| P1       | `weekly-boss.service.ts:183-201` reads and replaces a complete key array without locking or a revision predicate. Two different boss saves can overwrite each other.                          | Serialize per owner, compare revision, and return a recoverable conflict to the loser.                                               |
| P1       | `weekly-boss.service.ts:135-137` and `PlannerPage.tsx:570-575` derive discounts from defeats.                                                                                                 | Preserve defeats as historical user records; establish a separate explicit reward-claim input.                                       |
| P2       | Daily schema defaults manufacture a resin checkpoint. `resin.ts:25-28` and PlannerPage's duplicate projection can produce negative values for a future checkpoint.                            | Unknown must remain unknown; one deterministic projection with a supplied time and invalid/future handling.                          |
| P2       | All three checklist flags reset daily, although the Transformer UI says “Weekly cooldown”; legacy rows have no actual use timestamp.                                                          | Explicit per-task cadence, no inferred Transformer use time, no guessed countdown.                                                   |
| P2       | Goal service shifts UTC by four hours at `goal.service.ts:64`, but Planner Intelligence uses UTC weekday at `planner-intelligence.service.ts:72-75,132`.                                      | One supported-server day function for both touched callers. Under the legacy Asia policy, Sunday 20:00 UTC must mean Monday in both. |
| P2       | No selected server is persisted. Weekly data is explicitly `PLACEHOLDER`; several names/domain/drop combinations cannot substantiate advice.                                                  | Explicit Asia-only selection, unsupported/unselected states, and no catalog expansion or placeholder reward advice in C2a.           |

`planner-intelligence.service.test.ts` currently exercises calculator functions, despite its name; it does not prove that the actual service GET is read-only or uses the correct clock. Add service/HTTP coverage for that adapter during C2a.

## Preservation

The protected Turbo log matches SHA256 `790D929247252D64703A67C561419E28206DA7A37D2A49F6253CFEEB3ECB0AED`. Existing changed-file hashes were recorded before planning edits, including unrelated AI/environment files and the lockfile. Do not reset, clean, broadly format, stage, or commit the mixed tree. No push, deployment, or production database work is authorized.

Final preservation check compared all 117 pre-existing changed/untracked files in the recorded baseline: only the intentionally updated `CURRENT_HANDOFF.md` and `sunday-sonnet-prompt.md` changed. Four new C2a planning documents were added. All six planning documents pass Prettier, and checked relative links resolve. Whole-tree `git diff --check` reports pre-existing trailing whitespace in the protected Turbo log; its bytes were preserved rather than reformatted.

Continue with [the concrete plan](implementation_plan.md) and [checklist](task.md). Game-rule evidence and its remaining verification gates are recorded in [clock/task sources](sources.md).
