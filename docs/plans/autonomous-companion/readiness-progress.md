# Contextual Readiness & Marginal Investment — Milestone 2 Evidence & Verification

**Document Version:** 1.0.0  
**Phase:** Milestone 2 (Autonomous Companion — Contextual Readiness & Marginal Investment Engine)  
**Status:** Verification & Database Hardening Complete  
**Date:** 2026-11-02

---

## 1. Architectural Scope & Provenance

Milestone 2 establishes deterministic intelligence engines and player intent models within Project Celestia's Modular Monolith (`apps/api` and `apps/web`), adhering strictly to:

- **ADR-0001 (Modular Monolith)**: Isolated domain organization under `games/genshin/intelligence`.
- **ADR-0011 (Separation of Calculator and Explainer)**: Pure numeric calculation engines separated from user-facing explanation rationale.
- **Progression Provenance**: Progression costs, ascension steps, and talent thresholds are deterministically computed against pinned snapshot data in `progression-catalog.json`. No unverified guesswork or arbitrary values are generated.

---

## 2. Core Deterministic Mathematical Invariants

The Milestone 2 test suites rigorously enforce five core mathematical and architectural invariants:

### 1. Energy Deficit Invariant (Priority & Hard Cap)

- **Principle**: Energy Recharge (ER) deficit gates elemental burst availability across team rotation cycles. Offense or crit stats cannot compensate for inability to rotate.
- **Implementation**:
  - In `calculateReadiness`: When observed ER is below the encounter/team-adjusted threshold, `hasEnergyDeficit` is set to `true`, the `rotation_energy` dimension is marked `needs_investment` (or `conditional`), and the overall character readiness score is strictly capped at 65.
  - In `calculateMarginalInvestment`: When an ER deficit is detected, resolving the deficit via an ER Sands conversion/upgrade receives top priority and a `2.5x` gap-closure multiplier, superseding raw offensive or crit upgrades.

### 2. Insufficient Data Invariant (No False Positives)

- **Principle**: Missing telemetry or unrecorded equipment must never yield false confidence or optimistic assumptions.
- **Implementation**:
  - Missing weapon data returns `insufficient_data` for the `weapon` dimension, generates structured `missingData` items (`unrecorded_weapon`), and forces overall status to `insufficient_data`.
  - Incomplete artifact sets (< 5 pieces) penalize `main_stats` and `set_activation`. Missing artifact slots are never hallucinated; marginal investment strictly forbids generating upgrades for unverified/missing slots while continuing to provide valid recommendations for verified gear.
  - Omitted or unparsed combat telemetry (e.g., missing ER stat) sets `rotation_energy` to `insufficient_data`.

### 3. Diminishing Returns Invariant

- **Principle**: Characters that already meet or exceed benchmark standards for an encounter should not receive urgent high-cost upgrade recommendations.
- **Implementation**:
  - Ready characters evaluate with `status: 'ready_for_target'`, `score >= 85`, and `recommendedNextAction: null` or low-efficiency optional polish.
  - Explanations explicitly flag diminishing returns warning notices (`diminishing_returns: true`) and categorize status as `Target Met · Maintained`.

### 4. Farming Trap & Crowning Deprioritization

- **Principle**: High-rarity, high-resin investments with marginal DPS impact (such as crowning support normal attacks from Level 9 to 10) constitute progression traps and must be deprioritized relative to essential gap closures.
- **Implementation**:
  - In `calculateMarginalInvestment`, talent upgrades from Level 9 to 10 require `CrownOfInsight` and 700,000 Mora from `progression-catalog.json`.
  - Cost normalization factors penalize high material requirements, placing crown upgrades at the bottom of ranked recommendations unless all other gaps are closed.
  - Upgrades that close benchmark gaps receive an active `2.5x` efficiency multiplier (`closesGap: true`), ranking gap closures strictly above expensive marginal crowning.

### 5. Player Intent Invariant ("Good Enough" Stopping Condition)

- **Principle**: Players must be empowered to mark a character as intentionally "Good Enough", preventing unwanted alerts and stopping recommendation badgering.
- **Implementation**:
  - `packages/api-contracts`: Contract field `goodEnoughCharacters: z.array(teamCharacterIdentitySchema).max(150).default([])` added to `teamSearchPreferencesSchema`.
  - Persistence: Serialized directly in the database payload of `genshin_team_preferences`, protected by atomic revision conflict checks (`TeamPreferencesRevisionConflictError`).
  - Frontend: `ContextualReadinessBadge` renders a distinctive cyan "Target Met · Maintained" status, silencing warning badges.

---

## 3. Test Suite Execution & Verification Record

All tests across Subphase 2.1, 2.2, 2.3, and 2.4 pass with zero errors:

| Test Suite / Harness                              | Scope                                                                                                 | Tests Run | Passed |   Status   |
| :------------------------------------------------ | :---------------------------------------------------------------------------------------------------- | :-------: | :----: | :--------: |
| `readiness-marginal-pipeline.integration.test.ts` | End-to-end integration: Scenario A (Partial Showcase) & Scenario B (Full Imported Account)            |     6     |   6    | **PASSED** |
| `intelligence.http.test.ts`                       | HTTP API boundary: Public unauthenticated access, valid 200 responses, 400 validation error responses |     5     |   5    | **PASSED** |
| `team-preferences.repository.test.ts`             | Repository serialization of `goodEnoughCharacters`, revision increment, P2002 conflict handling       |     4     |   4    | **PASSED** |
| `team-preferences.integration.test.ts`            | PostgreSQL round-trip: persistence, retrieval, revision advance (1 -> 2), array element preservation  |     4     |   4    | **PASSED** |
| `readiness-intelligence.calculator.test.ts`       | Deterministic 6-dimension evaluation, stat normalization, benchmark resolution                        |    13     |   13   | **PASSED** |
| `readiness-intelligence.service.test.ts`          | Orchestration and explanation generation                                                              |     4     |   4    | **PASSED** |
| `marginal-investment.calculator.test.ts`          | Upgrade candidate generation, progression catalog lookup, gap-closure multipliers                     |     9     |   9    | **PASSED** |
| `marginal-investment.service.test.ts`             | Orchestration and ranked upgrade responses                                                            |     4     |   4    | **PASSED** |
| `companion-readiness-client.test.js`              | Web client hooks, UI badge rendering, alert banners, intent round-trip                                |    10     |   10   | **PASSED** |
| `team-preferences.test.js`                        | Web preferences intent state management                                                               |    10     |   10   | **PASSED** |

**Total Invariant & Regression Tests:** **69 / 69 passing**  
**Typecheck (`@celestia/api`, `@celestia/web`, `@celestia/api-contracts`):** **0 errors**  
**Linting (`eslint`):** **0 errors, 0 warnings**

---

## 4. Database Schema & Migration Status

- **Additive Field**: `goodEnoughCharacters` is contained inside the JSON payload of `genshin_team_preferences`.
- **Destructive Migrations Required**: **Zero**. Existing stored preferences parse cleanly with empty array defaults.
- **Concurrency Protection**: Stale `expectedRevision` writes reject with HTTP 409 (`ConflictError`), preventing silent overwrites across multiple tabs.
