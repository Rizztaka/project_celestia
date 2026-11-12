# Autonomous companion checklist

Current objective: the owner's 2026-10-25 autonomous endgame companion goal.
Detailed contracts and acceptance: [implementation plan](implementation_plan.md).

- [x] Inspect canonical production-aligned source and current handoff.
- [x] Record new product direction and its precedence over September exclusions.
- [x] Audit build advice, DPS search, endgame, pull advice and simulator routing.
- [x] Add reproducible local knowledge/engine/role coverage inventory.
- [x] Verify inventory tests and formatting/lint; record M0 evidence.
- [x] Add public account evidence, persistent conflict handling, future-date protection, exact-form inventory and team-search invalidation; [verification](account-context-progress.md).
- [x] Persist per-UID favorites, required/excluded members and driver/sample choices, and honor them in team search; [verification](team-preferences-progress.md).
- [x] Expand reviewed profiles from four to twelve, select explicit automatic defaults, add general-checks opt-out, guide-version links and conflicting-build guards; [verification](reviewed-role-progress.md).
- [x] Separate observed energy blocks from cooldown retries, report executed Bursts and preserve unknown diagnostics for older simulations; [engine, worker, full-suite and browser verification](rotation-execution-progress.md).
- [x] M1 subphase 1: independently establish release-to-7.1 and official-source provenance; verified with release-roster review anchor and package tarball integrity.
- [x] M1 subphase 2: implement and verify the authenticated imported-account adapter; [implementation and verification](imported-account-progress.md).
- [x] M1 subphase 3: define and enforce shared account scope, freshness, preferences, missing-data rules, and build fingerprint invariance; verified with unit/integration suites, formatting policy cleanup, and evidence alignment. [Evidence](account-context-progress.md).
- [x] M2: implement contextual readiness and marginal investment advice.
  - [x] M2 subphase 1: character readiness evaluation against benchmark roles, encounters, and observed account contexts (`ready_for_target`, `needs_investment`, `conditional`, `insufficient_data`).
  - [x] M2 subphase 2: bounded marginal investment recommendations (talent priority, weapon suitability, energy thresholds, resource costs).
  - [x] M2 subphase 3: UI integration for contextual readiness indicators and upgrade actions within companion views.
- [x] M3: verify rotation candidates and improve DPS/comfort team search; [verification](team-search-progress.md).
  - [x] M3 subphase 1: reviewed character rotation kits and action sequences (`rotation-kit.ts`).
  - [x] M3 subphase 2: defensible team rotation synthesis and candidate generation (`rotation-synthesizer.calculator.ts`).
  - [x] M3 subphase 3: comfort scoring, gear exclusivity validation, and statistical overlap resolution (`team-comfort.calculator.ts`, `team-comfort.explainer.ts`).
  - [x] M3 subphase 4: bounded candidate pruning and 2-phase worker search pipeline (`auto-generator.calculator.ts`, `service.ts`).
  - [x] M3 subphase 5: dual-recommendation cards, visual rotation timeline, and workspace integration (`TeamRecommendationCard.tsx`, `RotationTimelineView.tsx`).
  - [x] M3 subphase 6: integration benchmarks, monorepo verification, and progress documentation (`m3-benchmarks.integration.test.js`, `team-search-progress.md`).
- [x] M4: solve joint Abyss/Onslaught teams and Theater cast/act planning; [verification](endgame-assignment-progress.md).
  - [x] M4 subphase 1: shared contracts and versioned encounter specifications (`packages/api-contracts/src/genshin/endgame-planning.ts`, `apps/api/src/games/genshin/static/endgame-encounters.json`).
  - [x] M4 subphase 2: Spiral Abyss dual-half joint disjoint solver with harmonic mean bottleneck scoring (`abyss-joint.calculator.ts`, `abyss-joint.explainer.ts`).
  - [x] M4 subphase 3: Stygian Onslaught consecutive 3-boss allocator with strict 12-character exclusivity (`onslaught-joint.calculator.ts`, `onslaught-joint.explainer.ts`).
  - [x] M4 subphase 4: Imaginarium Theater dynamic act & vigor planner with backward-chaining boss reserves (`theater-act-planner.calculator.ts`, `theater-act-planner.explainer.ts`).
  - [x] M4 subphase 5: authenticated endgame intelligence service, controller, and routes under `/api/v1/games/genshin/intelligence/endgame/*` (`endgame-intelligence.routes.ts`, `endgame-intelligence.http.test.ts`).
  - [x] M4 subphase 6: frontend endgame views, side-by-side Abyss cards, 3-boss matrix, and interactive 10-act timeline (`AbyssJointRecommendationView.tsx`, `OnslaughtMatrixView.tsx`, `TheaterActPlannerView.tsx`, `EndgamePage.tsx`).
  - [x] M4 subphase 7: end-to-end integration benchmarks, monorepo gate verification, and evidence documentation (`m4-benchmarks.integration.test.js`, `endgame-assignment-progress.md`).
- [x] M5: replace heuristic pull verdicts with explicit account-value comparisons; [verification](pull-intelligence-progress.md).
  - [x] M5 subphase 1: shared contracts, targets, and static knowledge fixtures (`packages/api-contracts/src/genshin/pull-intelligence.ts`, `apps/api/src/games/genshin/static/active-banners.json`, `apps/api/src/games/genshin/static/constellation-benchmarks.json`).
  - [x] M5 subphase 2: pure multi-objective counterfactual calculator engine with flexibility, redundancy, comfort, and constellation/weapon branching (`pull-intelligence.calculator.ts`, `pull-intelligence.calculator.test.ts`).
  - [x] M5 subphase 3: pure narrative explainer with honest team unlocks, redundancy warnings, and probabilistic savings notes (`pull-intelligence.explainer.ts`, `pull-intelligence.explainer.test.ts`).
  - [x] M5 subphase 4: service, controller, and authenticated/public HTTP routes with partial showcase data guards (`pull-intelligence.service.ts`, `pull-intelligence.controller.ts`, `pull-intelligence.routes.ts`, `pull-intelligence.http.test.ts`).
  - [x] M5 subphase 5: interactive frontend account-value pulls view, preference sliders, constellation toggles, and wish savings integration (`AccountValuePullsView.tsx`, `PullPreferenceSliders.tsx`, `IntelligencePage.tsx`).
  - [x] M5 subphase 6: end-to-end integration benchmarks, monorepo verification, and progress documentation (`m5-benchmarks.integration.test.js`, `pull-intelligence-progress.md`).
- [x] M6: restore and verify a separate fun simulator; [verification](companion-orchestration-progress.md).
  - [x] M6 subphase 1: pure client wish sandbox state machine and bounded local persistence (`wish-sandbox-session.ts`).
  - [x] M6 subphase 2: interactive wish sandbox UI, scenario selection, pity overrides, and public/authenticated routes (`WishSandboxView.tsx`, `/simulators`).
- [x] M6: compose automatic refresh and a convenient next-action summary; [verification](companion-orchestration-progress.md).
  - [x] M6 subphase 3: shared contracts and companion summary orchestration backend (`companion-summary.calculator.ts`, `companion-summary.service.ts`).
  - [x] M6 subphase 4: dashboard hero card, summary matrix, and reactive query invalidation (`NextActionSummaryCard.tsx`, `CompanionSummaryGrid.tsx`).
  - [x] M6 subphase 5: end-to-end integration benchmarks, monorepo quality gates, and evidence documentation (`m6-benchmarks.integration.test.js`).
- [x] M7: True Autonomous Optimization; [verification](m7-autonomous-optimization-progress.md).
  - [x] M7 subphase 1: GCSim-backed central team intelligence and rotation search integration.
  - [x] M7 subphase 2: Reliable game-data infrastructure, source identity, and dataset expiry guards.
  - [x] M7 subphase 3: Account-wide autonomous progression discovery without mandatory goals.
  - [x] M7 subphase 4: One unified multi-objective optimization pipeline feeding dashboard and planner.
  - [x] M7 subphase 5: Complete integration verification across disposable PostgreSQL and real GCSim worker execution.
  - [x] M7 subphase 6: Project handoff, roadmap reconciliation, and documented remaining limitations.

The whole goal remains active. M0 does not mean the companion is complete.
