# ADR-009: Data Trust & Recommendation Reliability Architecture (Milestone M9 Phase 1)

> **Continuity Note**: This Architecture Decision Record documents Milestone M9 Phase 1 (ADR-009). The file path `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md` preserves direct succession and evolution from [ADR-004: 7-Axis Game Data Integrity, Version SSOT & Substantive Provenance Architecture](0004-data-accuracy-and-provenance-gate.md).

- **Status:** Accepted
- **Date:** 2026-11-23
- **Milestone:** M9 Phase 1 — Data Trust & Recommendation Reliability

## Context

Project Celestia features five analytical recommendation engines:
1. **Team Generator**: Synthesizes optimal elemental synergies, hyper-carries, and rotation schedules across 128 characters.
2. **Spiral Abyss Dual-Team Solver**: Partitions character rosters and 256 weapons across Floor 12 chambers against cycle-specific enemy lineups, shields, and buffs.
3. **Imaginarium Theater Solver**: Solves opening cast selections, off-element guest allocations, and 10-act combat stamina distributions under seasonal element restrictions.
4. **Artifact & Build Intelligence**: Evaluates substat efficiency, diminishing returns, and farming stop thresholds across 37 combat sets.
5. **Pull Advisor**: Delivers mathematical ROI recommendations, Primogem budgets, and exact pull distributions across active and upcoming banners.

Following the initial data provenance foundation established in ADR-004, data provenance and recommendation confidence exhibited several architectural limitations:
1. **Coupled Verification and Lifecycle Semantics**: The legacy `ProvenanceStatus` type (`'verified' | 'provisional' | 'stale'`) overloaded data verification state with temporal schedule status. A dataset that was thoroughly verified in-game or via official notices would be classified as `'stale'` simply because its schedule expired, confounding dataset authenticity with time relevance.
2. **Missing Provenance Representation**: When a dataset or entity lacked a registered provenance entry, the system lacked a formal representation for unregistered data, risking runtime errors or ad-hoc fallback values.
3. **Fabricated Provenance Metadata**: The user-customizable sandbox dataset (`custom-sandbox`) contained a fabricated HTTPS notice URL (`https://genshin.hoyoverse.com/en/news`) and an invalid verification method (`sandbox_simulation`), misrepresenting client-side hypothetical scenarios as externally verified game records.
4. **Duplicated Schedule Entities and Redundant Registry Entries**: Three duplicate registry entries (`abyss_floor_12_v7_2`, `theater_season_7_2_nov`, `theater_season_7_2_dec`) coexisted alongside their canonical counterparts (`cycle-7-2`, `season-7-2-hydro-electro-geo`, `season-7-2-dec-pyro-hydro-geo`), inflating the registry from 35 canonical datasets to 38 and risking reference divergence.
5. **Schedule Expiry Duplication (SSOT Violation)**: Schedule expiration dates were duplicated into `DataProvenance.effectiveEndDate` rather than resolving directly from canonical schedule entities (`BannerPhase`, `AbyssCycleConfig`, `TheaterSeasonConfig`), creating redundant state that required manual synchronization.
6. **Absence of Unified Recommendation Reliability Contracts**: Downstream engines produced recommendations with varying levels of qualification, lacking a standardized contract to communicate recommendation reliability, execution mode, live-game actionability, temporal freshness, and user-facing warnings to the UI.

## Decision Drivers

- **Separation of Concerns**: Decouple data verification authenticity from schedule temporal lifecycles and solver execution modes.
- **Truthful Metadata (Zero Fabrication)**: Provenance records must reflect authentic verification. Datasets verified via direct in-game observation or local sandbox simulations must not require fabricated URLs.
- **Single Source of Truth (SSOT)**: Schedule dates must reside strictly in canonical domain entities (`BANNER_PHASES`, `ABYSS_CYCLES`, `THEATER_SEASONS`).
- **Standardized Reliability Contract**: Provide a strongly-typed, JSON-serializable reliability contract (`RecommendationReliability`) that all recommendation engines can implement.
- **Explicit Actionability Semantics**: Unambiguously define whether a recommendation can be acted upon in the live game right now (`isActionable`).
- **Phased Evolution**: Ensure 100% backward compatibility for existing view components during Phase 1 while establishing strict compile-time boundaries and an automated migration path for Phase 2.

## Considered Options

### Option 1: Ad-hoc Reliability Flags per View Component
- **Approach**: Leave `DataProvenance` as-is and allow each solver or view (`AbyssDualTeamView`, `ImaginariumTheaterView`, `PullAdvisorView`, `TeamGeneratorView`) to compute custom freshness and reliability badges ad-hoc.
- **Rejected**: Results in fragmented UI behavior, divergent reliability definitions, duplicate expiration calculations, and zero type safety across engine boundaries.

### Option 2: Overload `DataProvenance` with Schedule and Execution State
- **Approach**: Add fields like `startDate`, `endDate`, `simulationMode`, and `isActionable` directly to `DataProvenance`.
- **Rejected**: Violates SSOT principles by conflating static data provenance with dynamic runtime engine execution modes. Provenance describes *where data originated*, not *how an engine evaluated a recommendation*.

### Option 3 (Chosen): Decoupled 5-Axis Reliability Architecture with Phased Deprecation
- **Approach**:
  - Define formal, disjoint reliability contracts in `src/types/genshin.ts`: `VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, and `RecommendationReliability`.
  - Re-align `ProvenanceStatus` as a strict subset of `VerificationState` (`Exclude<VerificationState, 'unregistered'>`).
  - Purge redundant registry records and eliminate fabricated metadata.
  - Make `DataProvenance.sourceUrl` optional with strict HTTPS enforcement when present.
  - Freeze `DataProvenance.effectiveEndDate` as `@deprecated` legacy-only in Phase 1, backed by compile-time and runtime guardrails, scheduled for removal in Phase 2.

## Decision

### 1. Core Reliability Contracts (`src/types/genshin.ts`)
Introduced five decoupled types establishing an unambiguous vocabulary for data trust and recommendation evaluation:

```typescript
export type VerificationState =
  | 'verified'
  | 'provisional'
  | 'stale'
  | 'unregistered';

export type TemporalState =
  | 'upcoming'
  | 'active'
  | 'expired'
  | 'not_applicable';

export type RecommendationMode =
  | 'current'
  | 'planning_preview'
  | 'archive_simulation'
  | 'sandbox_simulation';

export type ReliabilityStatus =
  | 'reliable'
  | 'qualified'
  | 'historical'
  | 'unsupported';

export interface RecommendationReliability {
  status: ReliabilityStatus;
  mode: RecommendationMode;
  isActionable: boolean;
  verification: VerificationState;
  temporalState: TemporalState;
  provenanceIds: string[];
  warnings: string[];
}
```

### 2. Actionability Semantics (`isActionable`)
Documented and locked the semantics of `RecommendationReliability.isActionable`:
- **Definition**: Represents whether the recommendation is actionable in the live game *right now*.
- **`true`**: Strictly applies to currently actionable (`current`) advice backed by supported, non-upcoming, non-expired data (e.g. optimizing teams for the active Abyss cycle or active character banners).
- **`false`**: Applies to forward-looking previews (`planning_preview` / upcoming banners or schedules), historical archives (`archive_simulation`), sandbox configurations (`sandbox_simulation`), and unsupported results (`unsupported`).

### 3. Provenance Status Alignment & Verification Methods
- Aligned `ProvenanceStatus` as `Exclude<VerificationState, 'unregistered'>`, guaranteeing that registered datasets represent authentic states (`'verified'`, `'provisional'`, or `'stale'`), while missing datasets resolve to `'unregistered'` without fabricating dummy registry entries.
- Refined `VerificationMethod` to `'official_notice' | 'in_game_verification' | 'theorycraft_consensus'`. Removed `'sandbox_simulation'` as simulation is an execution mode, not a verification method.

### 4. Optional `sourceUrl` with HTTPS Guardrails
- Made `DataProvenance.sourceUrl?: string` optional in `src/types/genshin.ts`.
- In `scripts/audit-game-data.mjs` (Axis 6) and `src/data/data-integrity.test.ts`:
  - When `sourceUrl` is present, it **must** begin with `https://`.
  - When `sourceUrl` is omitted, it is permitted **only** for `custom-sandbox` or entries with `verificationMethod: 'in_game_verification'`.
  - Removed fabricated `sourceUrl` and invalid `verificationMethod` from `custom-sandbox` in `src/data/provenance-registry.ts`.

### 5. Registry Consolidation (35 Canonical Datasets)
Pruned three redundant records from `src/data/provenance-registry.ts`:
- Removed `abyss_floor_12_v7_2` (canonical: `cycle-7-2`).
- Removed `theater_season_7_2_nov` (canonical: `season-7-2-hydro-electro-geo`).
- Removed `theater_season_7_2_dec` (canonical: `season-7-2-dec-pyro-hydro-geo`).
The registry is now consolidated at exactly **35 canonical datasets**, eliminating duplication.

### 6. Legacy Expiry Compatibility Boundary (`effectiveEndDate`)
- Marked `DataProvenance.effectiveEndDate?: string` as `@deprecated` legacy-only in `src/types/genshin.ts`.
- Frozen at exactly 17 entries mirroring canonical schedule entities (`BANNER_PHASES`, `ABYSS_CYCLES`, `THEATER_SEASONS`).
- Prohibited addition of new date fields (`startDate`, `endDate`, `effectiveStartDate`) to `DataProvenance`.
- Verified at compile time (via TypeScript utility types) and at runtime (via Vitest assertions) that no non-schedule dataset declares `effectiveEndDate`.

## Contract Specification

| Contract | Type | Domain Values | Description |
| :--- | :--- | :--- | :--- |
| `VerificationState` | Union | `'verified'`, `'provisional'`, `'stale'`, `'unregistered'` | Authenticity and audit state of the underlying game data. |
| `TemporalState` | Union | `'upcoming'`, `'active'`, `'expired'`, `'not_applicable'` | Schedule lifecycle state relative to the current real-world timestamp. |
| `RecommendationMode` | Union | `'current'`, `'planning_preview'`, `'archive_simulation'`, `'sandbox_simulation'` | Context in which the user invoked the solver. |
| `ReliabilityStatus` | Union | `'reliable'`, `'qualified'`, `'historical'`, `'unsupported'` | Consolidated confidence rating synthesized across verification, temporal, and mode dimensions. |
| `RecommendationReliability` | Interface | `{ status, mode, isActionable, verification, temporalState, provenanceIds, warnings }` | Standardized serializable payload emitted by analytical solvers. |
| `ProvenanceStatus` | Union | `'verified'`, `'provisional'`, `'stale'` | Restricted subset for registered entries (`Exclude<VerificationState, 'unregistered'>`). |
| `VerificationMethod` | Union | `'official_notice'`, `'in_game_verification'`, `'theorycraft_consensus'` | Rigor level of the data verification source. |

## Consequences

### Positive
- **Architectural Clarity**: Verification status, schedule temporal state, and engine execution modes are completely decoupled.
- **Zero Fabrication**: No fake URLs or invalid verification methods in the codebase; in-game and sandbox datasets are truthfully represented.
- **Exact Single Source of Truth**: Removed duplicate registry records, reducing total datasets to 35 canonical entries.
- **Type Safety & Regression Resistance**: Type-level exact-union assertions (`AssertEqual`) guarantee that enum unions cannot drift or widen unnoticed.
- **Seamless Phase 1 Compatibility**: All 623 existing Vitest tests and all 7 audit gate axes pass without disrupting running view components.

### Negative & Technical Debt
- **Temporary Legacy Field**: `DataProvenance.effectiveEndDate` remains in Phase 1 to maintain backward compatibility with `src/services/data-freshness.ts`.
- **Solver Adoption Deferred**: Full integration of `RecommendationReliability` into solver return types and UI badges is deferred to Phase 2.

## Phase 2 Migration Roadmap

Phase 2 will complete the reliability architecture across the following sequential milestones:

1. **Migrate Expiry Resolution to Canonical Entities**:
   - Refactor `src/services/data-freshness.ts` (`isScheduleExpired`, `getFreshnessInfo`) to resolve start/end dates directly from `BANNER_PHASES`, `ABYSS_CYCLES`, and `THEATER_SEASONS` rather than `DataProvenance.effectiveEndDate`.
2. **Purge Deprecated `effectiveEndDate`**:
   - Delete `effectiveEndDate?: string` from `DataProvenance` in `src/types/genshin.ts`.
   - Remove the 17 legacy `effectiveEndDate` entries from `src/data/provenance-registry.ts`.
   - Update Axis 6 in `scripts/audit-game-data.mjs` and remove the legacy-boundary test from `src/data/data-integrity.test.ts`.
3. **Implement Universal Reliability Evaluator**:
   - Create `src/services/recommendation-reliability.ts` exposing `evaluateRecommendationReliability()`.
   - Implement deterministic matrix mapping `(VerificationState, TemporalState, RecommendationMode) -> (ReliabilityStatus, isActionable, warnings)`.
4. **Solver & UI Integration**:
   - Update `team-generator.ts`, `abyss-solver.ts`, `theater-solver.ts`, `artifact-probability.ts`, and `pull-advisor.ts` to return `reliability: RecommendationReliability`.
   - Upgrade `DataFreshnessBadge.tsx` and view components to surface reliability statuses (`reliable`, `qualified`, `historical`, `unsupported`) and actionable badges.
