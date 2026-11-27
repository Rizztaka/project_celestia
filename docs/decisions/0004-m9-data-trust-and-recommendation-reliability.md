# ADR-009: Data Trust & Recommendation Reliability Architecture (Milestone M9 Phase 2)

> **Continuity Note**: This Architecture Decision Record documents Milestone M9 Phase 2 (ADR-009). The file path `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md` preserves direct succession and evolution from [ADR-004: 7-Axis Game Data Integrity, Version SSOT & Substantive Provenance Architecture](0004-data-accuracy-and-provenance-gate.md) and incorporates the foundation established in M9 Phase 1.

- **Status:** Accepted (M9 Completed — Phases 1–4 Implemented)
- **Date:** 2026-11-27
- **Milestone:** M9 — Current-State Audit, Data Trust & Recommendation Reliability Architecture (Phases 1–4)

## Context

Project Celestia features five analytical recommendation engines:
1. **Team Generator**: Synthesizes optimal elemental synergies, hyper-carries, and rotation schedules across 128 characters.
2. **Spiral Abyss Dual-Team Solver**: Partitions character rosters and 256 weapons across Floor 12 chambers against cycle-specific enemy lineups, shields, and buffs.
3. **Imaginarium Theater Solver**: Solves opening cast selections, off-element guest allocations, and 10-act combat stamina distributions under seasonal element restrictions.
4. **Artifact & Build Intelligence**: Evaluates substat efficiency, diminishing returns, and farming stop thresholds across 37 combat sets.
5. **Pull Advisor**: Delivers mathematical ROI recommendations, Primogem budgets, and exact pull distributions across active and upcoming banners.

Following the initial data provenance foundation in ADR-004 and the contract decoupling completed in M9 Phase 1, recommendation trust and dataset freshness faced remaining architectural challenges:
1. **Disparate Expiration and Staleness Paths**: Expiration checks for time-boxed schedules were performed in multiple disparate locations (`isScheduleExpired` in `src/services/data-freshness.ts`, schedule filters in solvers, and inline date checks), risking divergent freshness assessments across components.
2. **Lingering Deprecated Metadata (`DataProvenance.effectiveEndDate`)**: While Phase 1 marked `effectiveEndDate` as `@deprecated` and froze it to 17 canonical entries, the field continued to duplicate canonical schedule entities (`BANNER_PHASES`, `ABYSS_CYCLES`, `THEATER_SEASONS`), maintaining redundant state in `src/data/provenance-registry.ts`.
3. **Unclassified Freshness Policies**: Different data categories require distinct freshness semantics: time-boxed schedules expire at schedule boundaries, version-anchored catalogs update per game patch, meta heuristics undergo review cycles, and user sandboxes should never age out. Without formal policy classifications, generic 42-day cadence thresholds were applied inappropriately to static SSOT catalogs or schedules.
4. **Future-Version Provenance Ambiguity**: Provenance records specifying future game versions (beyond `CURRENT_GAME_VERSION = "7.2"`) risked being treated as currently active or actionable in live recommendations, or improperly classified as historical archives in simulation modes.
5. **Lack of Central Evaluator SSOT**: Analytical engines lacked a centralized, unified evaluator that could consume arbitrary execution contexts, evaluate multiple data dependencies with differing risk tiers, resolve temporal states, guard against compromised archive data, and synthesize a single deterministic `RecommendationReliability` contract.

## Decision Drivers

- **Central Evaluator Single Source of Truth (SSOT)**: Establish a single canonical evaluation engine (`src/services/recommendation-reliability.ts`) for all freshness and reliability decisions across Project Celestia.
- **Single-Policy Freshness Architecture**: Unify all dataset freshness logic so `src/services/data-freshness.ts` delegates directly to the central evaluator, ensuring zero divergence between UI freshness badges and solver reliability ratings.
- **Complete Elimination of Redundant State**: Permanently delete `DataProvenance.effectiveEndDate` and purge all legacy entries from `src/data/provenance-registry.ts`, leaving canonical schedule entities as the exclusive source of truth for dates.
- **Deterministic Multi-Dependency Evaluation**: Evaluate compound solver inputs across high-risk and low-risk dependencies, ordering dependencies and warnings deterministically by Unicode code-unit sorting (`compareCodeUnit`).
- **Conservative Future-Version Provenance Handling**: Strict quarantine of future-version provenance records, blocking them from live-game actionability in `current` mode and from historical categorization in `archive_simulation` mode, while permitting non-actionable preview in `planning_preview` mode.
- **Canonical Temporal Resolution Alignment**: Honor canonical domain entity boundary semantics (inclusive `[start, end]` for banners and Abyss; half-open `[start, end)` for Theater monthly resets).
- **Zero Runtime or Type Regressions**: Maintain 100% test pass rate across the full 661-test repository suite and strict compliance with the 7-Axis Data Integrity Audit.

## Considered Options

### Option 1: Ad-hoc Reliability Implementation per Engine
- **Approach**: Allow each solver (`team-generator`, `abyss-solver`, `theater-solver`, `artifact-probability`, `pull-advisor`) to implement its own reliability matrix and date checks locally.
- **Rejected**: Guarantees divergent reliability behavior, code duplication, uncoordinated future-version handling, inconsistent warning formatting, and testing nightmares.

### Option 2: Keep `effectiveEndDate` in Provenance and Add Sync Scripts
- **Approach**: Retain `effectiveEndDate` in `DataProvenance` and add automated audit scripts to ensure it synchronizes with `BANNER_PHASES`, `ABYSS_CYCLES`, and `THEATER_SEASONS`.
- **Rejected**: Violates SSOT fundamentals. Caching schedule dates on provenance records creates a redundant secondary source of truth that requires ongoing validation and invites drift.

### Option 3 (Chosen): Central Evaluator SSOT with Single-Policy Freshness & Purged Legacy Fields
- **Approach**:
  - Implement `src/services/recommendation-reliability.ts` as the central evaluator SSOT.
  - Implement 4 formal freshness policies (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`).
  - Refactor `src/services/data-freshness.ts` into a lightweight facade delegating exclusively to `evaluateDatasetFreshness()`.
  - Delete `DataProvenance.effectiveEndDate` completely from `src/types/genshin.ts` and purge all 17 legacy entries from `src/data/provenance-registry.ts`.
  - Enforce compile-time type-level assertions and Axis 6 audit checks forbidding schedule date fields on provenance records.
  - Implement conservative future-version provenance policies and deterministic code-unit sorted dependency reporting.

## Decision

### 1. Central Recommendation Reliability Evaluator (`src/services/recommendation-reliability.ts`)

A centralized evaluation service was implemented, exposing three authoritative functions:
1. `evaluateRecommendationReliability(context: ReliabilityEvaluationContext, options?: ReliabilityEvaluationOptions): RecommendationReliability`:
   Synthesizes multidimensional evaluation context (`mode`, `datasetIds`, `requiredDatasetIds`, `schedule`, `evaluatedAt`) into a strongly-typed `RecommendationReliability` payload.
2. `evaluateDatasetFreshness(record: DataProvenance, evaluatedDate: ParsedUtcDate | null, thresholdDaysOverride?: number): DatasetFreshnessResult`:
   Authoritative freshness evaluation mapping a provenance record and evaluated date to staleness, expiry, temporal state, policy classification, and specific stale reasons.
3. `resolveScheduleTemporalState(window: CanonicalScheduleWindow | undefined, evaluatedDateStr: string): TemporalState`:
   Evaluates schedule boundary applicability against UTC date strings (`YYYY-MM-DD`).

### 2. Single-Policy Freshness Architecture (`src/services/data-freshness.ts`)

`src/services/data-freshness.ts` was refactored into a single-policy facade where:
- `isScheduleExpired(provenance, referenceDate)` delegates directly to `evaluateDatasetFreshness(provenance, refUtc).isExpired`.
- `isDatasetStale(provenance, thresholdDays, referenceDate)` delegates directly to `evaluateDatasetFreshness(provenance, refUtc, thresholdDays).isStale`.
- `getFreshnessInfo(provenanceOrId, referenceDate, thresholdDays)` calls `evaluateDatasetFreshness()` and populates UI badge labels (`FreshnessInfo`) from the exact same evaluation result used by solvers.

This guarantees that UI badges (`DataFreshnessBadge.tsx`) and recommendation solvers can never disagree on dataset staleness, expiration, or temporal state.

### 3. The 4 Freshness Policies & Risk Tiers

Every registered dataset is classified into one of four deterministic freshness policies:

| Policy Kind | Scope / Dataset Prefixes | Risk Tier | Expiration / Staleness Criterion | Actionability When Stale / Provisional |
| :--- | :--- | :--- | :--- | :--- |
| `schedule_window` | `banner_*`, `cycle-*`, `season-*` | High | Governed strictly by canonical schedule start/end dates and game version. Never expires via 42-day cadence. | Non-actionable (`false`) |
| `version_bound` | `gacha_rules_*`, `characters_*`, `weapons_*`, `artifacts_*`, `talent_scaling_*`, `enka_id_map_*` | High | Governed strictly by active `version === CURRENT_GAME_VERSION`. Never expires via 42-day cadence. | Non-actionable (`false`) |
| `patch_cadence` | `artifact_weights_*`, `rotations_*`, `team_archetypes_*` | Low | Reviewed on 42-day patch cadence (`PATCH_CYCLE_DAYS`). Stale if `ageDays > 42` or prior version. | Actionable with warning (`true` in `current` mode) |
| `sandbox` | `custom-sandbox`, `custom-*`, `*sandbox*` | Low | User-defined scenario. Always provisional, never ages out. | Never live-actionable (`false`) |

Unclassified dataset IDs default safely to conservative high-risk `patch_cadence` requiring strict verification.

### 4. Canonical Schedule Temporal Resolution

Schedule boundaries resolve directly from canonical domain entities without intermediate caching:
- **Banner Phases (`BANNER_PHASES`)**: Inclusive calendar dates `[startDate, endDate]`.
- **Spiral Abyss Cycles (`ABYSS_CYCLES`)**: Inclusive calendar dates `[effectiveStartDate, effectiveEndDate]`.
- **Imaginarium Theater Seasons (`THEATER_SEASONS`)**: Half-open interval `[effectiveStartDate, effectiveEndDate)` matching `getActiveTheaterSeason()` so monthly resets on day 1 transition cleanly to the new season at 00:00 UTC without overlap.

### 5. Complete Removal of `DataProvenance.effectiveEndDate`

1. **Type Definition**: Permanently removed `effectiveEndDate?: string` from `DataProvenance` in `src/types/genshin.ts`.
2. **Registry Purge**: Purged all 17 legacy `effectiveEndDate` entries from `src/data/provenance-registry.ts`.
3. **Compile-Time Assertions**: Enforced type-level exactness via `AssertEqual`:
   ```typescript
   const hasEffectiveEndDate: AssertEqual<
     'effectiveEndDate' extends keyof DataProvenance ? true : false,
     false
   > = true;
   ```
4. **Runtime Assertions**: `src/data/data-integrity.test.ts` iterates over all 35 records in `getAllProvenances()`, asserting that `effectiveEndDate`, `effectiveStartDate`, `startDate`, and `endDate` do not exist.
5. **Axis 6 Audit Guardrail**: `scripts/audit-game-data.mjs` (Axis 6) executes regex check `/^\s*(?:effectiveEndDate|effectiveStartDate|startDate|endDate)\s*:/m` against every provenance block in `src/data/provenance-registry.ts`.

### 6. Conservative Future-Version Provenance Policy

To protect recommendation integrity against premature or unverified future game updates:
- When `compareGameVersions(record.version, CURRENT_GAME_VERSION) > 0`, `evaluateDatasetFreshness()` flags `isFutureVersion: true`.
- Verification state for future-version records is clamped to `provisional` with reason `'future_version'`.
- **In `current` mode**: Live actionability is blocked (`isActionable: false`), status is downgraded to `qualified`, and an explicit warning is attached:
  `"Dataset <id> targets future version <ver> (active: <CURRENT_GAME_VERSION>). Recommendations cannot be marked actionable in live game."`
- **In `archive_simulation` mode**: Future versions cannot be classified as historical data. They are rejected from valid archive admission, returning `status: 'unsupported'` and `isActionable: false`.
- **In `planning_preview` mode**: Future-version data is permitted as `qualified` and `isActionable: false`, enabling forward-looking simulation while preventing false live-actionability claims.

### 7. Archive Compromise Guard & Historical Simulation

In `archive_simulation` mode, historical records must be authentic archives, not compromised or broken data:
- Prior-version canonical schedules and substantive historical datasets are admissible (`status: 'historical'`).
- Datasets with evidence indicating invalidation or compromise (matching `\b(compromised|corrupted|invalidated|unverified|retracted|do not use|broken)\b` or lacking substantive verification metadata) are rejected with `status: 'unsupported'`, `verification: 'stale'`, and `isActionable: false`.

### 8. Deterministic Code-Unit Ordering

To guarantee deterministic, replayable outputs across environments and test runs:
- `provenanceIds` and `dependencies` arrays are sorted strictly by Unicode code-unit comparison (`compareCodeUnit`).
- Dependency details are structured as plain data objects (`ReliabilityDependencyDetail`) including `datasetId`, `required`, `verification`, `policy`, `riskTier`, and optional version/reason.
- Warnings are deduplicated and ordered consistently.

### 9. Actionability Semantics (`isActionable`)

The semantics of `RecommendationReliability.isActionable` remain strictly locked to live-game execution:
- **`true`**: Only when `mode === 'current'`, `status === 'reliable'` or (`status === 'qualified'` with low-risk advisory data), schedule is `active` (or `not_applicable`), no required dataset is unverified/stale/future, and no high-risk dependency is stale.
- **`false`**: All `planning_preview` runs, all `archive_simulation` runs, all `sandbox_simulation` runs, all `unsupported` results, any recommendation backed by an `upcoming` or `expired` schedule, and any recommendation containing future-version or missing dependencies.

## Contract Specification

```typescript
// Core Multi-Axis Unions
export type VerificationState = 'verified' | 'provisional' | 'stale' | 'unregistered';
export type TemporalState = 'upcoming' | 'active' | 'expired' | 'not_applicable';
export type RecommendationMode = 'current' | 'planning_preview' | 'archive_simulation' | 'sandbox_simulation';
export type ReliabilityStatus = 'reliable' | 'qualified' | 'historical' | 'unsupported';
export type ReliabilityScheduleType = 'banner' | 'abyss' | 'theater';
export type FreshnessPolicyKind = 'schedule_window' | 'version_bound' | 'patch_cadence' | 'sandbox';
export type DependencyRiskTier = 'high' | 'low';

// Compound Contracts
export interface ReliabilityScheduleRef {
  type: ReliabilityScheduleType;
  entityId: string;
}

export interface ReliabilityEvaluationContext {
  mode: RecommendationMode;
  datasetIds: string[];
  requiredDatasetIds: string[];
  schedule?: ReliabilityScheduleRef;
  evaluatedAt: string; // ISO-8601 calendar date YYYY-MM-DD or timestamp
}

export interface ReliabilityDependencyDetail {
  datasetId: string;
  required: boolean;
  verification: VerificationState;
  policy: FreshnessPolicyKind;
  riskTier: DependencyRiskTier;
  version?: string;
  verifiedAt?: string;
  reason?: string;
}

export interface RecommendationReliability {
  status: ReliabilityStatus;
  mode: RecommendationMode;
  isActionable: boolean;
  verification: VerificationState;
  temporalState: TemporalState;
  provenanceIds: string[];
  warnings: string[];
  dependencies?: ReliabilityDependencyDetail[];
  evaluatedAt?: string;
}

export interface DataProvenance {
  datasetId: string;
  version: string;
  verifiedAt: string; // YYYY-MM-DD
  sourceUrl?: string; // HTTPS when present; omitted for in_game_verification & custom-sandbox
  evidence: string;
  status: ProvenanceStatus; // Exclude<VerificationState, 'unregistered'>
  verificationMethod?: VerificationMethod;
  verifiedFields?: string[];
}
```

## Consequences

### Positive
- **Single Source of Truth**: All staleness and reliability decisions originate from `recommendation-reliability.ts`.
- **Zero Redundant State**: `effectiveEndDate` is eliminated from `DataProvenance`, removing 17 duplicate fields.
- **Unified Freshness Behavior**: `src/services/data-freshness.ts` delegates directly to the central evaluator, eliminating cross-component divergence.
- **Strict Future-Version Isolation**: Future game updates are safely quarantined from live actionability while remaining accessible for planning previews.
- **Full Determinism**: Code-unit sorting guarantees identical test and runtime output across all platforms.
- **Robust Multi-Risk Model**: Differentiates between critical game data (high-risk) and advisory meta heuristics (low-risk 42-day review cadence).
- **Comprehensive Test Verification**: 92 focused tests and 661 repository-wide tests pass with 100% compliance.

### Completed in Phases 3 & 4 (M9 Closure)
- **Engine Boundary Integration (Phase 3)**: All 10 analytical engine endpoints (`generateBestTeams`, `rankWeaponsForCharacter`, `evaluateComprehensivePullROI`, `solveAbyssDualTeams`, `swapAbyssDualHalves`, `analyzeEndgameReadiness`, `autoDraftTheaterSchedule`, `analyzeTheaterSeasonPlan`, `recommendSupportCastBorrow`, `analyzeArtifactBuild`, `estimateBuildFromSliders`) emit `RecommendationReliability` via `src/services/engine-reliability.ts`, with Web Worker parity in `src/workers/solver-worker.ts` and `src/services/solver-dispatcher.ts`. Unattested local heuristic tables (`SIGNATURE_WEAPONS`, `CONSTELLATION_SPIKES`, `C0_ROI_HEURISTICS`, `THEATER_BOSS_INFO`, `THEATER_DIFFICULTIES`, `BORROW_PREMIER_RANKINGS`, `DOMAIN_CONSTANTS`, `DOMAIN_PAIRS_REGISTRY`, `STRONGBOX_SETS_SET`, and probability/transmuter/set-bonus constants) remain fail-closed (`qualified`, `isActionable: false`).
- **UI Presentation & Accessibility Disclosure (Phase 4)**: All 9 UI surfaces (`TeamGeneratorView` Best Teams & Quick Swap modal, `CharacterDetailModal`, `PullAdvisorView`, `AbyssDualTeamView`, `EndgameView` Chamber Reference Guide, `ImaginariumTheaterView` Schedule Auto-Draft & Support Cast Borrow Advisor, and `ArtifactStopView`) render `RecommendationReliabilityBadge`, `RecommendationReliabilityBanner`, and `ReliabilityDetailsPanel` formatted strictly via `src/services/reliability-presentation.ts`, keeping interactive buttons outside `role="status"` and `role="alert"` live regions.
- **6-State Data Confidence Crosswalk**: Maps M9's runtime contract and UI error states cleanly to the Consolidated Roadmap's six data states:
  - **Verified** → `status: 'reliable'` (`conceptualDataState: 'Verified'`)
  - **Estimated** → `status: 'qualified'` (`conceptualDataState: 'Estimated'`, covering provisional datasets, planning previews, sandboxes, and unattested local heuristic tables)
  - **Unknown** → `status: 'unsupported'` with `verification: 'unregistered'` (`conceptualDataState: 'Unknown'`)
  - **Expired** → `status: 'historical'` or `status: 'unsupported'` with `temporalState: 'expired'` (`conceptualDataState: 'Expired'`)
  - **Unsupported** → `status: 'unsupported'` for future-version/invalid-clock/unsupported mechanics (`conceptualDataState: 'Unsupported'`)
  - **Unavailable** → Explicit UI-level runtime/worker/network/storage error alerts (`solverError` + Retry recovery, `enka.ts` fetch errors, `storage.ts` availability checks), slated for unified M10 hardening.

## Verification & Test Matrix

The complete M9 architecture (Phases 1–4) is verified across unit, engine integration, component SSR, data-audit, bundle-budget, and 4-browser Playwright E2E suites (`pnpm run verify:all`).

1. **Central Evaluator & Freshness Suites (`recommendation-reliability.test.ts`, `data-freshness.test.ts`)**: Policy classification across all 36 registered datasets, schedule boundary semantics, future-version quarantine, archive compromise guard, and single-policy delegation.
2. **Data Integrity & 7-Axis Audit (`data-integrity.test.ts`, `scripts/audit-game-data.mjs`)**: Exact-union compile checks, absence of `effectiveEndDate`, and 100% pass across all 7 axes.
3. **Engine Reliability & Worker Parity (`engine-reliability.integration.test.ts`, `solver-dispatcher.test.ts`)**: All 10 public endpoints, strict `evaluatedAt` validation, unattested local dependency fail-closed checks, and `structuredClone` worker parity.
4. **Presentation, Component SSR & E2E Journeys (`reliability-presentation.test.ts`, `RecommendationReliabilityUI.test.tsx`, per-view component tests, and Playwright E2E journeys `13`–`19`)**: Zero nested buttons, zero buttons inside `role="status"`/`role="alert"`, valid `aria-controls`, mobile 320px/390px overflow safety, and Axe WCAG 2.1 AA checks.
