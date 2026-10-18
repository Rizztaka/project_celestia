# Document review and product findings

**Reviewed:** 2026-09-24–25  
**Code baseline:** `2d8820a48db83d7c62feebd849f2f1c2d3488bb6`  
**Scope:** every existing Markdown file in `docs/`, repository agent guidance, and frontend README. Installed third-party skill reference manuals are tooling documentation, not product specifications, and were not rewritten.

This is a document and representative code review, not a fresh test run or full correctness/security audit. Earlier CI/deployment evidence is carried forward as user-supplied verification. No current game-patch data was certified.

## Main conclusion

Celestia already has enough supporting modules to build a useful companion. The immediate product need is continuity and trustworthy presentation across those modules, not another scoring engine. The chosen next loop is **focus → plan → play → record → resume**.

## Code-backed findings and dispositions

| Finding                                                                                | Evidence                                                              | Implication / planned action                                                                  |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| App already routes to planner, inventory, intelligence, endgame, simulator, NIKKE      | `apps/web/src/App.tsx`                                                | Reuse foundations; no “build everything from scratch” roadmap                                 |
| All major intelligence routers are mounted                                             | `apps/api/src/games/genshin/genshin.routes.ts`                        | Existing APIs need caller migration, not silent deletion                                      |
| Materials already import and persist                                                   | `importer.schema.ts`, `importer.service.ts`, `GenshinMaterial` schema | Old farming Option A/B question is historical                                                 |
| Missing equipment/material sections default empty before unconditional replacement     | Genshin importer schema/service                                       | C1 must protect absent sections and make replacement scope explicit                           |
| Account creation precedes inventory transaction                                        | `GenshinImportService.importAccount`                                  | Historical “all DB work atomic” claim is too broad                                            |
| Equipment IDs regenerated; location map built from incoming characters                 | Genshin importer service                                              | Durable goals/history cannot point at those UUIDs; existing-character assignment needs review |
| Daily and weekly GETs write initialization/reset state                                 | platform companion daily/weekly services                              | Historical safe-GET contradiction; C2 introduces explicit writes                              |
| Daily/weekly use Asia reset constants; goal service shifts time for server weekday     | companion services                                                    | Centralize supported clock; do not claim all-server support                                   |
| Task booleans share a daily reset; weekly tracks defeats                               | companion services/schema                                             | Verify cadence per task and distinguish reward claims from defeats                            |
| Goal validation shares ascension-like phase ranges with talent goals                   | `goal.service.ts`                                                     | Type-specific targets before broader build-goal UX                                            |
| AES uses static weights, main-stat bonus, missing-slot zeros, threshold, top-five      | artifact intelligence calculator/service                              | Cannot serve as complete equipment view or universal quality verdict                          |
| UI says profiled builds above 60 have excellent gear and surfaces MUST_PULL            | `IntelligencePage.tsx`                                                | Migrate presentation and ranking behavior, not just feature names                             |
| Events and weekly-boss JSON are marked PLACEHOLDER; profiles reference old patch scope | Genshin static JSON files                                             | Data trust gate before live deadlines or tailored advice                                      |
| Half-chamber Abyss rows each carry stars                                               | Prisma `SpiralAbyssRun`                                               | Review scoring aggregation before claiming endgame totals                                     |
| Existing user-owned companion tables and Genshin provider coexist                      | schema, companion services, provider                                  | Preserve contracts; add new Genshin rules in domain/provider incrementally                    |
| Root lint has no executable API lint task                                              | Existing 3A evidence                                                  | Lint stays first; no product changes inside its patch                                         |

Paths abbreviated in this table are under `apps/api/src/games/genshin/` or `apps/api/src/platform/companion/` as indicated. These observations are not assertions that every adjacent behavior has been audited.

## Document-by-document disposition

| Existing document                           | Review outcome                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| PROJECT_VISION                              | Rewritten around daily play, chosen goals, equipment, and trust; optimization excluded                            |
| ROADMAP                                     | Replaced generic phases with dependency-aware 3A/C1–C7 queue and explicit deferrals                               |
| FEATURE_SPECIFICATIONS                      | Retained template; added data, status, continuity, and user-control requirements                                  |
| ARCHITECTURE                                | Added actual-versus-target ownership and data/time contracts; retained monolith                                   |
| DEVELOPMENT_GUIDE                           | Added bounded delivery/testing handoff and consistent Wednesday/Sunday cadence                                    |
| UI_UX_GUIDELINES                            | Added calm Today, equipment context, freshness, pause controls, and qualified advice                              |
| DECISIONS                                   | Added DEC-009 and explicit scope/delegation context; old decisions retained                                       |
| api/authentication                          | Preserved security evidence; clarified three-path lint sample versus full baseline                                |
| FEATURE_AUTH                                | Keep completed auth/security; scope notice prevents reimplementation                                              |
| FEATURE_GENSHIN_ROSTER                      | Keep persistence and ownership; scope notice defers multi-account                                                 |
| FEATURE_GENSHIN_IMPORTER                    | Reuse existing importer; scope notice supersedes unsafe omission assumptions                                      |
| FEATURE_GENSHIN_ROSTER_UI                   | Reuse import HTTP/UI; C1 reliability additions                                                                    |
| FEATURE_GENSHIN_ROSTER_UI_READ              | Reuse roster; C3 adds focus and equipment details                                                                 |
| FEATURE_GENSHIN_INVENTORY_UI                | Keep full inventory; correct equipment relationship assumption in scope notice                                    |
| FEATURE_DAILY_COMPANION                     | Keep purpose; flag conflicting reset times/cadences and ownership claim; C2/C4 replacement                        |
| FEATURE_FARMING_PLANNER                     | Keep goals; mark materials decision resolved and game examples unverified                                         |
| FEATURE_EVENT_PLANNER                       | Optional; placeholder/current-data distinction and upkeep gate                                                    |
| FEATURE_WEEKLY_BOSS_PLANNER                 | Keep tracking; flag incorrect/unverified examples, write-on-GET claim, and defeat/claim ambiguity                 |
| FEATURE_CHARACTER_INTELLIGENCE              | Adapt to user targets; no default meta-led roster ranking                                                         |
| FEATURE_ARTIFACT_INTELLIGENCE               | Product role superseded by Equipment & Build Progress                                                             |
| FEATURE_PLANNER_INTELLIGENCE                | Replace score inversion with explicit goal priority and budget                                                    |
| FEATURE_PULL_INTELLIGENCE                   | Retire verdict role; optional savings plan later                                                                  |
| FEATURE_KNOWLEDGE_INTELLIGENCE              | Secondary factual insights only; no artifact-age/performance inference                                            |
| FEATURE_ENDGAME_CENTER                      | Preserve records; defer advanced drafting and verify scoring before analytics                                     |
| ADR 0001                                    | Retained architecture/stack decision; future aspirations are not delivery promises                                |
| ADR 0002                                    | Retained historical auth decision; current authentication doc is the implementation reference                     |
| ADR 0003                                    | Retained error-handling decision; no runtime rewrite in this pass                                                 |
| ADR 0004                                    | Retained state-management split; no auth-storage migration                                                        |
| ADR 0005                                    | Retained static/dynamic separation; multi-account remains deferred                                                |
| ADR 0006                                    | Added explicit C1 amendment for import scope, rollback limits, and identity                                       |
| ADR 0007                                    | Retained route and service validation design; no blanket serialization refactor                                   |
| ADR 0008                                    | Retained; its deep-link exception applies to Today destinations                                                   |
| ADR 0009                                    | Added C2 amendment for future safe read projections                                                               |
| ADR 0010                                    | Added C2 amendment retiring legacy reset exception; no GET writes justified by idempotency                        |
| ADR 0011                                    | Retained calculator/explainer separation; clarified reduced product scope                                         |
| plans/3a-backend-lint/implementation_plan   | Read and preserved byte-for-byte; still immediate work                                                            |
| plans/3a-backend-lint/task                  | Read and preserved byte-for-byte                                                                                  |
| .agents/AGENTS and architectural/role rules | Read; architecture retained; owner's schedule and delegated task take precedence. Protected agent files unchanged |
| apps/web/README                             | Replaced starter-template guidance with current project navigation and local scripts                              |

Scope notices preserve earlier milestone contracts and examples as historical material. They do not certify their old game facts or mark existing code as newly tested. No checked acceptance criteria were fabricated.

## Prioritization rationale

- **Imports before history:** replacement semantics otherwise erase or misidentify the very progress the companion promises to remember.
- **Clock/data before recommendations:** wrong reset boundaries, placeholder drops, or unknown stock can turn attractive advice into wasted effort.
- **Focus before rankings:** the player should decide which characters matter.
- **Equipment before scores:** seeing what is equipped is useful even without predicting optimal combat performance.
- **Today before expansion:** a complete daily journey is more valuable than more disconnected modules.
- **Events conditional:** upkeep is part of the feature, not a task postponed indefinitely.
- **Keep existing code:** the product transition needs compatibility and data preservation; deferral alone does not justify deletion.

## External references checked

The [Genshin Optimizer repository](https://github.com/frzyc/genshin-optimizer) describes an artifact optimization tool and GOOD interfaces. This supports complementing an existing optimizer rather than reproducing its scope.

[Enka's API documentation repository](https://github.com/EnkaNetwork/API-docs) was inspected only as a future integration reference. No availability, full-account coverage, privacy, or automatic sync guarantee is made. Verify its current contract if that separate feature is selected.

These sources support tool boundaries, not current Genshin mechanics. Game-data verification remains a scoped C2b task.

## Changes and validation

Documentation only. New central specification, ADR, review, plan, checklist, and documentation index; updated vision/roadmap and relevant guidance; historical feature notices added. No package/script/config/source/schema change, no test rerun, no push, and no deployment.

Validation for this pass: format changed documents, check their local Markdown link targets, scan for contradictory active scope, and compare Git status and the preserved Turbo test-log hash. Existing lint-plan files remain outside formatting scope.

### Verification result

All 35 changed/new Markdown documents passed Prettier checking, and all 83 local Markdown link targets checked resolved. The original Turbo test-log SHA256 still matches. Additional concurrent local changes appeared in API configuration/dependencies and a new core/ai directory; they were excluded from this documentation work and their observed hashes remained unchanged during validation. Application tests were not rerun for this documentation-only change.
