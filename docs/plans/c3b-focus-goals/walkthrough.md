# C3b focus and durable goals — local acceptance

> **2026-10-05 review:** [Implementation review](implementation_review.md) records corrected legacy priority/slot UI gaps and fresh validation: 601 tests / 39 files, all 78 PostgreSQL cases. The October 4 counts and broad browser acceptance below remain historical. The [C4 execution prompt](../c4-today-weekly-plan/implementation-prompt.md) is prepared; C4 is not implemented.

Completed 2026-10-04 in the existing `D:\Genshin Personal\project-celestia` checkout, following explicit owner authorization. Work remains on the dirty `master` checkout at baseline `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`. Earlier tracked and untracked milestones were preserved. No staging, commit, push, deployment, normal-development/production migration or C4 work occurred.

The [starting record](starting-state.json), [implementation contract](implementation_plan.md), [checklist](task.md), [focused C3a review](../c3a-character-equipment/implementation_review.md) and [API contract](../../api/focus-goals.md) describe the scope and decisions. The plan and review were written before application edits.

## Delivered behavior

Owned characters, including opaque imported keys, can be focused on roster/detail. The roster has a focus-only filter and an honest empty state. Membership uses account plus character natural key, has no arbitrary maximum, and is independent of goal priority/status. Unfocus retains a false row and its revision so a stale request cannot reset membership history.

Existing user-owned goals now support explicit active, paused, completed and archived states; priority 1–5 (1 first, default 3); and revisioned edits. Active/paused edits retain the ID and target identity. Completion records the user's achieved/good-enough decision independently of stock or imported values. Archive retains completion metadata. Reopen/restore creates one active successor with an explicit range and priority, preserving the closed target/history. Further lifecycle changes continue through the successor.

Ascension phases remain 0–6; declared base talents remain 1–6 with exact normal/skill/burst slots and integer `from < to`. The service validates strict shared schemas, not just form inputs. New catalog-key intent is allowed before import; owned opaque character/weapon keys can also be stored without advice coverage. Weapon targets use a type key, never a physical-copy UUID. Invalid/unknown legacy intent remains visible with limitations and can still be prioritized or closed without silent repair.

Current intent is owner/type/key/nullable slot. New creation and successors serialize on the stable owner row, reject a current active/paused duplicate, and validate inside the transaction. Create request UUIDs reject replay even after closure. Expected revisions and conditional updates reject stale target/status/priority writes. A unique predecessor guarantees at most one child. No blind mutation retries occur. All surviving goal writes enforce the same policy; unversioned POST and owned DELETE fail closed with 409, while foreign/missing IDs return 404.

Legacy duplicates are retained and labeled for review. Every active/paused member of a duplicate group is marked; all active members are excluded from demand until the user explicitly resolves the group. Merely pausing an extra row does not make the identity unambiguous. Material totals, Today relevance and the direct Planner service/calculator all apply this rule and active-only filtering. User priority and createdAt/ID ties replace weighted-score precedence. The explainer no longer invents equal priority or a three-day event deadline.

Goal management uses status/target/goal URL filters and links from character detail. Failed/stale saves retain the draft and last confirmed state. Refresh updates the revision snapshot and planning views without overwriting typed values. Confirmed cache merges reject lower revisions. Session generation plus pinned tokens protect pre-dispatch, response handling and callbacks, including token reuse after logout. Import, focus and goal success invalidate both companion and Genshin namespaces. Touched routine/event/import callbacks also guard their originating session.

Declared range, stored progression and lifecycle remain separate facts. Detail can place stored character ascension beside an ascension target. Raw talents remain convention-unknown; weapon-type intent cannot establish individual-copy progress. Costs remain labeled as the declared range after import; no automatic range advancement/completion occurs. Independent equipment receipts, all five slots, absent main-stat amounts, C2b exact field/range/fingerprint gates, Mora and nullable unknown stock remain intact. Manual C2a routines remain available without eligible goals/routes.

## Migration and preservation

Only new migration `20261003180000_add_focus_goal_lifecycle` was added for this slice. It adds the status enum; goal priority/revision and nullable completion/request/predecessor fields; and a natural-key focus table. Old goals receive active, priority 3 and revision 0. Original IDs, owners, types, keys, ranges, slots, createdAt and updatedAt are unchanged. No accounts, focus records or completion history are backfilled.

The old nullable-slot unique index is dropped to allow closed talent history. Unique owner/request ID and predecessor indexes protect replay/successor identity. SQL checks cover priority, revision and completion metadata. Old invalid ranges and null-slot duplicates are deliberately accepted by the migration and remain available for explicit review. Application owner locking provides current-intent serialization without a new index that would destroy or reject legacy duplicates. The focus FK references the owned account/character natural key.

The fresh full chain of 12 migrations was deployed to the guarded disposable PostgreSQL 18.4 fixture. The populated-upgrade regression builds a pre-C3b schema, inserts two owners, a no-account owner, null-slot duplicates, valid talents, unsupported keys/ranges, an owned equipped character/weapon, import receipt and routine row, then applies C3b. It proves exact old-column/row preservation, neutral defaults, no fabricated focus/account records and retained closed talent history. The schema is transaction-local and rolled back. Final Prisma validation passed and migration diff reported **No difference detected**.

## Validation

Final direct suite on October 4, start 23:24:34 local time, duration 77.54 seconds: **597 passed / 39 files / zero failed or skipped**. No Turbo was used. The 78 real PostgreSQL cases all executed:

| Area                 | Executed database cases |
| -------------------- | ----------------------: |
| Importer             |                      16 |
| Routine              |                      12 |
| Catalog advice       |                       9 |
| Character equipment  |                      13 |
| Goal lifecycle/focus |                      28 |
| Total                |                      78 |

Count change from C3a's 535/37: seven old goal-service unit cases were replaced by 31 strict contract/service cases (+24); 28 actual database cases and ten client/cache cases were added (+38), yielding 597/39. Successful creation/ownership checks now have stronger actual-database coverage rather than substituting mocks for database guarantees. Existing C1/C2/C3a database cases remain present and executed.

The new database file covers concurrent null-slot creates and first focus writes, replayed creation, every allowed/invalid lifecycle transition, explicit completion reasons, stale range/status/priority, concurrent field updates and successors, one-child history, ownership/auth/retired writers, rollback after child creation, legacy duplicates/invalid intent, stable ties, active filtering in every consumer, full import preservation and lock interleaving, untouched receipts/routines, and SELECT-only direct/indirect/missing-account reads. The client suite covers versioned payloads, encoded keys, pinned tokens, session generation, delayed dispatch/success/failure, no retry, retained state, prefix invalidation, canceled queries, monotonic confirmed merges and bounded rendered form controls.

Commands were package-local in this D: checkout. Database commands explicitly used `NODE_ENV=test`, `DOTENV_CONFIG_PATH=NUL`, `DATABASE_URL` and `CELESTIA_TEST_DATABASE_URL` pointing to `postgresql://celestia_test@127.0.0.1:55446/celestia_test_c3b`, plus disposable dummy JWT/OpenRouter values. Integration guards reject non-loopback or non-`celestia_test_*` destinations and never use a normal `.env` database.

```powershell
# apps/api, with the guarded environment described above
node node_modules/vitest/vitest.mjs run --no-file-parallelism
pnpm lint
pnpm check-types
pnpm build
pnpm exec prisma validate
pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code

# packages/api-contracts
pnpm build

# apps/web
pnpm lint
pnpm build

# checkout root; only the explicit touched-file list
$files = Get-Content docs/plans/c3b-focus-goals/touched-files.json | ConvertFrom-Json
pnpm exec prettier --check @files
git diff --check
```

API/web lint, shared/API/web types/builds, focused formatting, schema validation/diff and whitespace checks passed. The browser build used a temporary loopback API override; the final web build passed with normal configuration. Dependencies and protected package/lock files were unchanged. [Preservation record](preservation-check.json) verifies all eight hashes, the empty index and no tracked historical migration edits. The same five unrelated formatter exceptions remain: OpenRouter, original Sonnet submission and baseline web index/App.css/index.css. Formatting was limited to the listed touched files.

An initial resumed run found the overnight disposable database process stopped, producing connection failures plus obsolete goal-test expectations. After restarting only the guarded fixture and updating meaningful regressions, the direct suite passed 596 cases, then the final 597 after adding the monotonic-cache case and strengthening the populated migration fixture. Only the final run above is completion evidence. The existing pg warning about overlapping queries on a client remains visible in concurrency/import cases; no dependency update or suppression was made. Prisma also offered a version update; none was installed. CI has not run for this local unpushed tree.

## Actual browser acceptance

Chrome used the built web app on loopback port 45447 and the test-only API fixture on 45446. Synthetic owners A/B had deliberately different data; a third owner had no imported account. Fixture values are application test data, not evidence of legal in-game builds or new catalog facts. Desktop and a 390×844 mobile viewport were exercised; the override was reset afterward.

| Flow                        | Observed result/evidence                                                                                                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focus/unfocus/filter        | Focused HuTao appeared alone in the filter; removing focus yielded the empty-focus message while goals remained; refocusing survived re-import.                                                                                                                                                                                                                                                                                               |
| Create/edit/priority        | Created normal talent 1→3 at priority 2; edited to 1→4 at priority 1; form and confirmed cards matched. [Desktop capture](browser-goal-desktop.jpg).                                                                                                                                                                                                                                                                                          |
| Pause/resume                | Pausing produced the no-active state and removed demand; resuming restored eligibility. Routine remained reachable.                                                                                                                                                                                                                                                                                                                           |
| Conflict/failed save        | Second tab paused the same goal; stale range/priority save returned a visible 409 while draft 1→4/priority 1 remained. Refresh updated confirmed revision and retained typed values. Synthetic failed save retained the same draft and confirmed row. The initial failure surfaced as a network error before the fixture's CORS error header was corrected. [Conflict](browser-stale-conflict.jpg), [failure](browser-failed-save-draft.jpg). |
| Complete/archive/reopen     | Good-enough completion retained time/reason through archive; explicit 4→6 successor appeared active beside archived 1→4 history. [History](browser-lifecycle-history.jpg).                                                                                                                                                                                                                                                                    |
| Partial import/weapon swap  | Imported HuTao ascension 6 and a different weapon type. Focus, archived history and active declared 5→6 target remained; stored ascension 6 appeared beside it without automatic completion. StaffOfHoma goal remained type-level despite the new assignment. Artifacts/material receipt stayed independent. [Detail](browser-reimport-detail.jpg).                                                                                           |
| Truthful unavailable states | Raw 9/12/15 talents stayed convention-unknown; missing ascension/weapon costs and all routes remained unavailable; supported talent costs included Mora and unknown-stock deficits.                                                                                                                                                                                                                                                           |
| Mobile/keyboard             | Detail and goal form/cards fit without horizontal document overflow; all five artifact slots remained visible. Tab moved from declared-from to the labeled target input; Enter on Cancel closed the editor. [Detail](browser-mobile-detail.jpg), [form](browser-mobile-goal-form.jpg).                                                                                                                                                        |
| Owner isolation             | B displayed its own level-20 character, no equipment/focus/goals from A. A save was delayed by the fixture; B signed in and entered an OtherPilot 2→6 draft before it completed. The API log confirmed A's PATCH arrived after B's reads; B's draft and empty goal list stayed unchanged. [Retained draft](browser-account-switch-draft.jpg). An earlier attempt navigated before sign-in completed and was repeated correctly.               |
| No import                   | Empty roster was honest; the no-account owner could create a catalog HuTao base-talent goal without focus or an imported account. [Pre-import goal](browser-preimport-goal.jpg).                                                                                                                                                                                                                                                              |

Saved detail/form screenshots were visually inspected; desktop/mobile DOM state and overflow checks supplemented them. A final optional duplicate capture was interrupted after the acceptance evidence had already been saved; it is not counted as evidence. The retained screenshots above are the verified captures.

## Exit criterion, limits and cleanup

The roadmap exit criterion is met: a focused character's goal survives re-import and shows known stored ascension alongside its declared target without a universal score. C3a equipment visibility and bounded C3b intent/lifecycle are complete locally. This does not complete every example in the wider feature specification.

Artifact targets, talent levels above 6, inferred effective/base talent conversion, role/build labels or presets, manual equipment editing, snapshots, optimizer/AES work, catalog expansion, new routes, broader Today composition and C4 remain deferred. Current verified costs remain only HuTao's three declared base talents 1–6; every farming route remains unavailable. Manual management works independently of that coverage.

Temporary API/preview processes and the disposable PostgreSQL cluster were stopped. Ports 45446, 45447 and 55446 were confirmed closed. Test-only files/logs remain under the temporary directory for inspection; no fixture service persists. No normal or production database was accessed for migration. A release requires separate authorization, independent review and a coordinated migration/API/web cutover; old writers must not run against the new lifecycle contract.
