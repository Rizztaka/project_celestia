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
- [ ] M1 subphase 1: independently establish release-to-7.1 and official-source provenance; earlier `verified` labels do not close the outstanding concerns. [Status correction](account-context-progress.md).
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
- [ ] M4: solve joint Abyss/Onslaught teams and Theater cast/act planning.
- [ ] M5: replace heuristic pull verdicts with explicit account-value comparisons.
- [ ] M6: restore and verify a separate fun simulator.
- [ ] M6: compose automatic refresh and a convenient next-action summary.

The whole goal remains active. M0 does not mean the companion is complete.
