# ADR-010: Product Scope Update — Artifact Intelligence & Team-Aware Artifact Optimizer

- **Status:** Accepted
- **Date:** 2026-11-27
- **Milestone:** M9 (Scope Reconciliation for M7 / M13)
- **Continuity Note:** Supersedes the legacy v1 product-scope exclusion of artifact optimization that pre-dated Celestia v2 (`v1-legacy` / `v1-archive`). Continues ADR numbering after ADR-009 ([`0004-m9-data-trust-and-recommendation-reliability.md`](0004-m9-data-trust-and-recommendation-reliability.md)).

## Context

Earlier v1 project planning excluded full artifact optimization to keep initial companion scope bounded. Since initializing Celestia v2:
1. Milestone M7 ([ADR-007](0007-artifact-and-build-intelligence.md)) delivered single-character artifact roll valuation, set-bonus ESR normalization, 2pc+2pc pairing, and universal stop-farming guidance (`ArtifactStopView`).
2. Milestone M9 ([ADR-009](0004-m9-data-trust-and-recommendation-reliability.md)) established centralized provenance tracking, freshness policies, and fail-closed reliability disclosure across all analytical engines and UI surfaces.
3. The Consolidated Development Roadmap sets Project Celestia's destination as **team-aware progression and build intelligence**, culminating in the **Team-Aware Artifact Optimizer** (Milestone M13) using **Balanced** (`0.55D + 0.25R + 0.15B + 0.05A`) as its default optimization objective.

## Decision

1. **Supersede the Artifact-Optimization Exclusion**:
   - Single-character artifact evaluation and stop-farming intelligence (M7) and joint four-character team-aware artifact optimization (M13) are formally **in scope** for Project Celestia.
   - Artifact optimization must reuse existing M7/M9 foundations (`artifact-probability.ts`, `artifact-validator.ts`, `artifact-set-effects.ts`, `team-rules.ts`, `recommendation-reliability.ts`) rather than building parallel disconnected calculators.
2. **Preserve Strict Safety & Discipline Boundaries**:
   - **No Automatic In-Game / Inventory Mutations**: Automatic artifact deletion/disposal and automatic equipment changes remain **excluded**.
   - **No Mechanical Truth from AI Chat**: AI chat as a source of game-mechanical truth remains **excluded**.
   - **No Unqualified Pull Verdicts**: Unqualified `MUST_PULL` verdicts remain **excluded**.
   - **Deferred Scope**: Leaderboards/social competition, multi-game expansion, multi-account expansion, exhaustive unsourced data coverage, and paid infrastructure without measured need remain **deferred**.
3. **Sequencing Gate**:
   - M13 work must not begin until M9 (data trust & accuracy foundation), M10 (reliability, account safety & recovery), M11 (performance & responsiveness), and M12 (end-to-end verification) are complete.

## Consequences

- `docs/ROADMAP.md` and `docs/plans/CURRENT_HANDOFF.md` treat M13.1–M13.8 as the planned primary product expansion following M10–M12.
- All future M13 outputs must surface M9 `RecommendationReliability` disclosures and never present unverified/estimated mechanics as exact verified calculations.
