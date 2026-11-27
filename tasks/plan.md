# Implementation Plan: M9 — Current-State Audit, Data Trust & Recommendation Reliability (Phases 1–4)

## Overview
Complete Milestone M9 across all analytical engines, provenance registries, presentation layers, and all 9 user-facing recommendation surfaces in Project Celestia v2 (Version 7.2 baseline), establishing trustworthy, fail-closed data confidence before M10–M14.

## Architecture Decisions
- **Central Reliability Evaluator & Single-Policy Freshness**: `src/services/recommendation-reliability.ts` governs all 4 policies (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`), canonical schedule windows, future-version quarantine, and archive compromise guards, with `src/services/data-freshness.ts` delegating directly to it (`ADR-009`).
- **Engine Boundary & Unattested Local Heuristic Guardrails**: All 10 analytical endpoints return `RecommendationReliability` via `src/services/engine-reliability.ts` and preserve `structuredClone` Web Worker parity (`src/workers/solver-worker.ts`, `src/services/solver-dispatcher.ts`). Unattested heuristic tables (`SIGNATURE_WEAPONS`, `CONSTELLATION_SPIKES`, `C0_ROI_HEURISTICS`, `THEATER_BOSS_INFO`, `THEATER_DIFFICULTIES`, `BORROW_PREMIER_RANKINGS`, `DOMAIN_CONSTANTS`, `DOMAIN_PAIRS_REGISTRY`, `STRONGBOX_SETS_SET`, and artifact probability/transmuter/set-bonus constants) remain fail-closed (`qualified`, `isActionable: false`).
- **Pure Presentation & Accessible Live-Region Isolation**: `src/services/reliability-presentation.ts` formats all envelopes with strict 7-predicate provenance matching and 6-state conceptual classification (`Verified`, `Estimated`, `Unknown`, `Expired`, `Unsupported`, plus UI-level `Unavailable` recovery), keeping all interactive `<button>` controls outside `role="status"` / `role="alert"`.
- **Reconciled Scope & Roadmap**: `docs/ROADMAP.md` and `docs/decisions/0010-team-aware-artifact-optimizer-scope.md` supersede the legacy v1 exclusion of artifact optimization and lock in `M10 → M11 → M12 → M13.1–M13.8 → M14`.

## Checkpoints
- [x] M9 Phase 1: Decoupled reliability contracts & registry consolidation
- [x] M9 Phase 2: Central evaluator SSOT, single-policy freshness & `effectiveEndDate` removal
- [x] M9 Phase 3: Engine boundary integration across all 10 endpoints & worker parity
- [x] M9 Phase 4: Shared UI disclosure components & all 9 UI surfaces (`TeamGeneratorView`, Quick Swap, `CharacterDetailModal`, `PullAdvisorView`, `AbyssDualTeamView`, `EndgameView`, `ImaginariumTheaterView` Schedule & Borrow, `ArtifactStopView`)
- [x] Documentation & Scope Reconciliation (`ROADMAP.md`, `ADR-009`, `ADR-010`, `CURRENT_HANDOFF.md`, `celestia-reference.md`, `GEMINI.md`)
- [x] Full verification (`pnpm run verify:all`)
