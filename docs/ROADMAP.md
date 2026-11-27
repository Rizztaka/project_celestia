# Project Celestia — Consolidated Development Roadmap

**Vision:** Team-aware progression and build intelligence for Genshin Impact (Version 7.2+ baseline), answering four connected player questions:
1. What should I work on next?
2. How well does my current team actually perform?
3. What stats and artifacts would improve the entire team?
4. When should I stop investing and move to another upgrade?

## Core Principles

- Correct calculations before confident recommendations.
- Team-wide performance before isolated character scores.
- Practical builds before unrealistic theoretical perfection.
- Explainable results before opaque optimization scores.
- Reuse existing functionality before adding parallel systems.

## Milestone Baseline & Exact Development Sequence

| Milestone | Scope | Status | Reference |
| :--- | :--- | :--- | :--- |
| **M0 – M3** | Baseline Audit, Atomic Storage & Rollback, CI & Playwright Gates, Lazy Bundle Isolation | **Completed** | [ADR-000](decisions/0000-technical-baseline-and-architecture-map.md) – [ADR-003](decisions/0003-performance-and-bundle-optimization.md) |
| **M4 – M6** | 7-Axis Game Data Integrity, Explainable Team Engine, Abyss & Theater Endgame Solvers | **Completed** | [ADR-004](decisions/0004-data-accuracy-and-provenance-gate.md) – [ADR-006](decisions/0006-endgame-solvers-abyss-and-theater.md) |
| **M7** | Single-Character Artifact Intelligence & Stop-Farming Advisor | **Completed** | [ADR-007](decisions/0007-artifact-and-build-intelligence.md) |
| **M8** | Pull Advisor & Independent Wish Mathematics Verification | **Completed** | [ADR-008](decisions/0008-pull-advisor-and-wish-mathematics.md) |
| **M9** | **Current-State Audit & Accuracy Foundation (Phases 1–4)** | **Completed** | [ADR-009](decisions/0004-m9-data-trust-and-recommendation-reliability.md) |
| **M10** | **Reliability, Account Safety and Recovery** | **Next** | — |
| **M11** | **Performance and Responsiveness** | Planned | — |
| **M12** | **End-to-End Verification** | Planned | — |
| **M13** | **Team-Aware Artifact Optimizer (M13.1 – M13.8)** | Planned | [ADR-010](decisions/0010-team-aware-artifact-optimizer-scope.md) |
| **M14** | **Product Polish and Controlled Beta** | Planned | — |

> **Scope Note:** The historical v1 scope exclusion of artifact optimization is formally superseded by [ADR-010](decisions/0010-team-aware-artifact-optimizer-scope.md). M7 delivered single-character artifact evaluation and stop-farming intelligence; M13 expands that foundation into the joint four-character **Team-Aware Artifact Optimizer** using **Balanced** as its default optimization objective.

---

## Upcoming Milestones (M10 – M14)

### M10 — Reliability, Account Safety and Recovery
- Harden imports (`GOOD`, `Enka`), account isolation, session/storage error recovery, API failures, and async worker/fallback error states (including explicit `Unavailable` boundary handling) so failed operations preserve valid data and never leave screens permanently loading.

### M11 — Performance and Responsiveness
- Measure before optimizing: audit large game-data bundles, lazy loading, Web Worker calculations vs. main-thread fallbacks, artifact search & team simulation hotspots, unnecessary rerenders, and mobile responsiveness.

### M12 — End-to-End Verification
- Verify full user journeys end-to-end across isolated storage/fixtures, desktop and mobile browsers, failure recovery flows, and account data controls with zero unresolved critical data-loss or safety defects.

### M13 — Team-Aware Artifact Optimizer (M13.1 – M13.8)
Default objective:
$$S_B = 0.55D + 0.25R + 0.15B + 0.05A$$
Where $D$ = team damage (55%), $R$ = combat reliability (25%), $B$ = build efficiency (15%), $A$ = account efficiency (5%), gated by hard feasibility checks for energy, rotation, core mechanics, and data confidence.

1. **M13.1 — Team Build Resolver**: Complete 4-character build snapshot.
2. **M13.2 — Mechanical Effects Registry**: Numerical effects from talents, passives, constellations, weapons, and artifact sets with recipient, timing, stacking, cooldown, snapshot, and provenance tracking.
3. **M13.3 — Team Combat and Rotation Evaluator**: Rotation damage, reactions, energy, buff uptime, enemy resistance, and timing (reusing validated deterministic math/integrations where appropriate).
4. **M13.4 — Balanced Optimization Objective**: Feasibility gates + calibrated $S_B$ ranking.
5. **M13.5 — Team-Optimized Stat Targets**: Joint minimum requirement, balanced target, and diminishing-return region separating unbuffed vs. temporary combat stats.
6. **M13.6 — Joint Artifact Candidate Optimizer**: 4pc, 2pc+2pc, rainbow, main stats, and substats across equipped & eligible candidates, distinguishing exhaustive vs. bounded searches.
7. **M13.7 — Resin ROI and Stop-Farming Advisor**: Expected team upgrades, resin estimates, domain/Strongbox/crafting alternatives, and stop-farming recommendations.
8. **M13.8 — Optimizer Interface and Explanations**: Unified report of team rotation DPS, energy reliability, stat targets, current vs. recommended builds, buff/reaction breakdowns, resin estimates, and confidence limits.

**M13 Validation Targets:**
- Core deterministic damage formulas: within 0.5% of verified references.
- Supported full rotations: within 2% of verified deterministic references.
- Supported deterministic energy cases: exact agreement with reference calculations.
- Buff timing: zero buffs applied outside valid windows.
- Artifact search: best candidate within declared search space; deterministic repeatability.

### M14 — Product Polish and Controlled Beta
- Replace misleading legacy artifact-quality scores with team-aware presentation, polish explanations and empty/loading/error states, verify desktop/mobile usability, confirm deployment parity, test rollback/recovery, and run a controlled voluntary beta.

---

## Out of Scope / Deferred

| Feature | Decision |
| :--- | :--- |
| Leaderboards and social competition | Deferred |
| Multi-game expansion | Deferred |
| Multi-account expansion | Deferred |
| AI chat as a source of game-mechanical truth | Excluded |
| Automatic artifact deletion or disposal | Excluded |
| Automatic equipment changes | Not part of this optimizer |
| Unqualified `MUST_PULL` verdicts | Excluded |
| Exhaustive game-data coverage without sustainable sources | Deferred |
| New paid infrastructure without measured need | Avoid |
