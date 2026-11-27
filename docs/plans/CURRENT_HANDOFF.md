# Project Celestia — Current Handoff (Post-M9 Closure)

- **Date:** 2026-11-27
- **Active Branch:** `master`
- **Active Game Version Baseline:** `7.2` (`src/data/game-version.ts`)
- **Completed Milestones:** M0 – M9 (Phases 1–4)
- **Next Milestone:** **M10 — Reliability, Account Safety and Recovery**

---

## 1. What M9 Completed

1. **Centralized Data Trust & Freshness Evaluator (Phases 1–2)**:
   - Decoupled 5-axis reliability contract (`VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, `RecommendationReliability`) in `src/types/genshin.ts`.
   - Single-policy central evaluator SSOT in `src/services/recommendation-reliability.ts` (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`), unified `src/services/data-freshness.ts`, purged deprecated `effectiveEndDate`, future-version quarantine, and archive compromise guards.
   - 36 canonical dataset records audited in `src/data/provenance-registry.ts` (passes 7-Axis Audit via `pnpm run audit:data`).
2. **Full Analytical Engine Integration & Worker Parity (Phase 3)**:
   - All 10 public recommendation endpoints emit `RecommendationReliability` via `src/services/engine-reliability.ts`, with Web Worker `structuredClone` parity in `src/workers/solver-worker.ts` and `src/services/solver-dispatcher.ts`.
   - Unattested local heuristic tables (`SIGNATURE_WEAPONS`, `CONSTELLATION_SPIKES`, `C0_ROI_HEURISTICS`, `THEATER_BOSS_INFO`, `THEATER_DIFFICULTIES`, `BORROW_PREMIER_RANKINGS`, `DOMAIN_CONSTANTS`, `DOMAIN_PAIRS_REGISTRY`, `STRONGBOX_SETS_SET`, and artifact probability/transmuter/set-bonus constants) remain fail-closed (`qualified`, `isActionable: false`).
3. **Full UI Reliability Disclosure Across All 9 Surfaces (Phase 4)**:
   - Pure 7-predicate provenance matcher & presentation formatter in `src/services/reliability-presentation.ts` with explicit 6-state mapping (`Verified`, `Estimated`, `Unknown`, `Expired`, `Unsupported`, plus UI-level `Unavailable` error handling).
   - Shared UI components (`RecommendationReliabilityBadge`, `RecommendationReliabilityBanner`, `ReliabilityDetailsPanel`) integrated across:
     1. `TeamGeneratorView` (Main Best Teams)
     2. `TeamGeneratorView` (Quick Swap Weapon Modal)
     3. `CharacterDetailModal` (Weapon Suitability)
     4. `PullAdvisorView` (Banner & Sandbox Advisor)
     5. `AbyssDualTeamView` (Floor 12 Dual-Half & Swap Halves)
     6. `EndgameView` (Abyss Chamber Reference Guide — synced with `customCycle` & `abyssEvaluatedAt`)
     7. `ImaginariumTheaterView` (Schedule Auto-Draft & Season Analysis — date-aware default season + async reducer)
     8. `ImaginariumTheaterView` (Support Cast Borrow Advisor)
     9. `ArtifactStopView` (Resin ROI & Stop-Farming)
   - Split text-only `role="status"` / `role="alert"` regions from interactive `<button>` controls across all views.
4. **Documentation & Scope Reconciliation**:
   - Reconciled `docs/ROADMAP.md`, `docs/decisions/0010-team-aware-artifact-optimizer-scope.md` (superseding the old v1 artifact-optimization exclusion), `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md` (ADR-009), `tasks/plan.md`, `tasks/todo.md`, `docs/knowledge/celestia-reference.md`, and `GEMINI.md`.

---

## 2. Verification & Deployment Baseline

- **CI Quality Gate (`.github/workflows/quality-gate.yml`)**: `pnpm run verify:all` (`lint`, `typecheck`, `test`, `audit:data`, `verify:ssot`, `build`, `check:budget`, `test:e2e` across Desktop Chromium, Desktop Firefox, Mobile Chromium Pixel 5, Mobile WebKit iPhone 13).
- **Deployment Parity Procedure**: No `vercel.json` or `.vercel/` directory is checked into this client-first Vite repo; after pushing the verified release commit to `origin/master`, confirm the live Vercel deployment commit SHA matches `git rev-parse HEAD` via the Vercel dashboard or CLI outside the commit itself (avoiding circular commit-hash edits).

---

## 3. Next Up: M10 — Reliability, Account Safety and Recovery

Proceed strictly in roadmap order (`M10 → M11 → M12 → M13.1–M13.8 → M14`):
1. Harden `GOOD` / `Enka` import validation and partial-failure preservation.
2. Standardize explicit `Unavailable` UI recovery across network, storage, and worker+fallback failure paths.
3. Expand account-isolation, backup/restore rollback, and recovery test coverage before M11 performance profiling.
