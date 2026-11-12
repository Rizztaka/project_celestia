# True Autonomous Optimization Evidence (Milestone 7)

Implemented and verified locally on 2026-11-12 for Milestone 7 (M7) of the [Autonomous Endgame Companion Roadmap](file:///d:/Genshin%20Personal/project-celestia/docs/ROADMAP.md).

## Executive Summary

Milestone 7 elevates Project Celestia's autonomous companion architecture from disconnected advisory heuristics into a unified, deterministic, simulation-backed optimization engine. Across six focused implementation subphases, M7 accomplishes five foundational pillars:

1. **Pillar 1: GCSim-Backed Central Team Intelligence & Rotation Search**
   - Replaces static heuristic multipliers in the primary recommendation loop with real GCSim worker execution.
   - Synthesizes executable rotation scripts with action sequences, cooldowns, and energy mechanics via `TeamSimulationService`.
   - Returns real tested DPS with statistical confidence intervals, error margins, and energy diagnostics.
   - Features graceful degradation to deterministic heuristics (`HEURISTIC_FALLBACK`) with explicit caveat reporting whenever units lack executable simulation kits or encounter worker faults.

2. **Pillar 2: Reliable Game-Data Infrastructure & Expiry Guards**
   - Establishes independently verified release-to-7.1 roster provenance (`release-roster-7.1.json`) anchored against official HoYoverse update notices and package tarball integrity.
   - Implements temporal expiry guards across active banner windows, encounter definitions, and rotating domains: expired or unverified datasets degrade confidence transparently into visible caveats rather than producing erroneous claims.

3. **Pillar 3: Account-Wide Autonomous Progression Discovery**
   - Eliminates the mandatory goal requirement from the planner and companion services: accounts with zero manual goals receive comprehensive, high-ROI progression recommendations directly from their verified roster.
   - Evaluates roster readiness gaps (`status !== 'ready_for_target'`) and marginal investment returns across 3 prioritized tiers: Core Team Units (Priority 1), Endgame Bottleneck Roles (Priority 2), and General Utility Roster (Priority 3).
   - Maps required talent/weapon progression materials to server weekday drop schedules (`domainSchedule.json`).

4. **Pillar 4: One Unified Multi-Objective Optimization Pipeline**
   - Harmonizes the central dashboard (`CompanionSummaryService`) and the farming planner (`PlannerIntelligenceService`) into a unified multi-objective optimization engine.
   - Ensures `CompanionSummaryResponse.primaryAction` perfectly mirrors Task #1 of `PlannerIntelligenceResponse.optimization.allocatedPlan`.
   - Prioritizes `FARMING_AVAILABLE` when high-deficit material domains are open today, `BUILD_INVESTMENT` on off-schedule days, `ENDGAME_READINESS` on encounter bottlenecks, and `PULL_STRATEGY` on high-value active banners.

5. **Pillar 5: Disposable PostgreSQL & Real Worker Integration Verification**
   - Validated against ephemeral PostgreSQL databases and real Node worker threads executing pinned WASM GCSim binaries.
   - Passing all 5 comprehensive integration benchmarks in `apps/api/tooling/m7-benchmarks.integration.test.js` without mocks or simulated database bypasses.

---

## Architectural Implementation

### 1. GCSim Central Simulation Integration (`team-intelligence`)

- **Simulation Service (`apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts`)**:
  - Implements `simulateTeam(members, options)` interfacing with the background worker runner (`apps/api/tooling/runtime-runner.mjs`).
  - Synthesizes full GCSim configuration files incorporating:
    - Character forms, levels, constellations, weapons, and artifact stat distributions.
    - Deterministic action sequences and rotation priority lists from `rotation-kit.ts`.
    - Custom target encounter definitions (resistances, HP pools, mob counts).
  - Extracts and returns verified performance metrics:
    - `simulatedDps`: Mean simulated DPS across Monte Carlo iterations.
    - `errorMargin`: Confidence interval at 95% threshold.
    - `actionsExecuted`: Count and breakdown of normal, skill, burst, and swap actions.
    - `energyDiagnostics`: Observed energy starvation events and cooldown retry stalls.
  - Graceful fallback: when unmodeled characters (e.g. Alyosha, Illuga, unmodeled Traveler forms) or invalid gear combinations are detected, returns a typed fallback (`HEURISTIC_FALLBACK`) with transparent diagnostic caveats rather than failing the recommendation request.

- **Team Intelligence Service Enhancement (`team-intelligence.service.ts`)**:
  - Automatically simulates top candidate rosters passing comfort and resonance filters.
  - Decorates recommendations with both tested simulation DPS and comfort ratings, providing players with clear performance vs. execution-comfort trade-offs.

### 2. Game-Data Trust & Release-to-7.1 Provenance (`data-trust`)

- **Release Roster Reconciliation (`apps/api/src/games/genshin/static/release-roster-7.1.json`)**:
  - Complete release-to-7.1 roster reference matching official HoYoverse notices.
  - Separates catalog metadata, playable character forms, reviewed build profiles, and executable simulation capabilities.
  - Reconciles M1 subphase 1 provenance requirements, validating package tarball integrity and local source checksums.

- **Temporal Expiry Guards**:
  - `CompanionSummaryService` & `PullIntelligenceService` enforce strict validation on active banners and endgame seasons (`active-banners.json`, `endgame-encounters.json`).
  - Stale or expired definitions emit explicit caveats and downgrade recommendation confidence, preventing outdated advice from being displayed to travelers.

### 3. Autonomous Progression Discovery (`planner-intelligence`)

- **Autonomous Calculator (`apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.calculator.ts`)**:
  - Implements `discoverAutonomousProgression(params)`:
    - Scans `verifiedRoster` for characters not yet at target readiness (`status !== 'ready_for_target'`).
    - Calculates marginal upgrade ROI based on ascension milestones, talent ceilings, and signature weapon suitability.
    - Classifies candidates into 3 priority tiers:
      - **Priority 1 (Core Team Member)**: Active member of the player's highest-DPS simulated team.
      - **Priority 2 (Endgame Bottleneck)**: Solves an active weakness in Abyss, Onslaught, or Theater cast reserves.
      - **Priority 3 (General Utility)**: Broad roster utility unit with cost-effective marginal stat returns.
    - Cross-references material requirements with `domainSchedule.json` and `character-materials.json`.

- **Autonomous Explainer (`apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.explainer.ts`)**:
  - Generates clear, actionable narrative rationales for every discovered candidate (e.g., explaining why ascending a support's Burst talent unblocks an Abyss Floor 12 DPS check).

- **Planner Intelligence Service Integration (`planner-intelligence.service.ts`)**:
  - Removes the legacy HTTP 422 `UnprocessableError` when zero manual goals exist.
  - Automatically invokes autonomous discovery to generate candidate inputs when no manual goals are defined.
  - Blends manual goals and autonomous candidates when remaining daily resin/time budget permits, ensuring no user resin is wasted.

### 4. One Unified Multi-Objective Optimization Pipeline (`companion-summary`)

- **Unified Allocation Engine**:
  - Connects `CompanionSummaryService` directly with `PlannerIntelligenceService` and `optimizePlannerSchedule`.
  - Queries `GenshinRecordedStockRepository` to incorporate actual account material deficits.
  - Maps player's server weekday to active rotating domains and runs multi-objective knapsack scheduling over available resin and time constraints.

- **Primary Action Synchronization**:
  - Sets `CompanionSummaryResponse.primaryAction` to mirror Task #1 of `PlannerIntelligenceResponse.optimization.allocatedPlan`:
    - `FARMING_AVAILABLE`: Material domain open today with active deficit and positive resin efficiency.
    - `BUILD_INVESTMENT`: Boss ascension or talent upgrade when domain materials are off-schedule.
    - `ENDGAME_READINESS`: Key character upgrade unblocking an Abyss or Onslaught clear.
    - `PULL_STRATEGY`: High account-value banner currently active.

### 5. Integration Verification Harness (`tooling`)

- **Disposable PostgreSQL Integration (`apps/api/tooling/m7-benchmarks.integration.test.js`)**:
  - Leverages `disposableTestDatabase()` for full database schema creation, migrations, and clean teardown.
  - Imports real GOOD payloads, verifying table persistence across accounts, characters, weapons, artifacts, and routine states.
  - Executes real GCSim Node worker threads to benchmark runtime latency and numerical accuracy.
  - Validates zero-goal autonomous progression, dashboard-planner synchronization, and dataset expiry handling.

---

## Verification & Quality Gates

### 1. Milestone 7 Benchmark Suite (`tooling/m7-benchmarks.integration.test.js`)

All 5 integration benchmarks passed on disposable PostgreSQL:

```
✓ tooling/m7-benchmarks.integration.test.js (5 tests) 867ms
  ✓ Milestone 7 Complete Integration Verification Benchmarks
    ✓ Benchmark 1 (Import Persistence & Context Resolution): imports valid GOOD payload into PostgreSQL, verifies table persistence across characters, weapons, artifacts, and routine states; confirms AccountContextProvider resolves accurate roster and freshness.
    ✓ Benchmark 2 (Real GCSim Worker Execution & Tested Damage): executes real GCSim worker thread simulation asserting tested DPS, confidence error margin, actions, and energy diagnostics (625ms).
    ✓ Benchmark 3 (Account-Wide Autonomous Discovery): evaluates roster with 0 manual goals; verifies high-ROI progression candidates are discovered across under-invested units without throwing 422.
    ✓ Benchmark 4 (Unified Optimization Pipeline): proves that CompanionSummaryResponse.primaryAction exactly mirrors Task #1 of PlannerIntelligenceResponse.optimization.allocatedPlan.
    ✓ Benchmark 5 (Dataset Reliability & Expiry): asserts that expired encounter definitions or unverified banners degrade confidence and produce transparent caveats.

Test Files: 1 passed (1)
Tests:      5 passed (5)
Duration:   3.39s
```

### 2. Unit & Service Test Suites

- **Team Intelligence (`team-intelligence/`)**:
  - `team-composition.test.ts`: 20/20 passed.
  - `team-intelligence.service.test.ts`: 24/24 passed.
  - `team-simulation.service.test.ts`: 3/3 passed (GCSim execution, graceful fallback, DPS attachment).
  - Total: **47 passed (47)**.

- **Planner Intelligence (`planner-intelligence/`)**:
  - `planner-optimization.calculator.test.ts`: 6/6 passed.
  - `planner-intelligence.service.test.ts`: 9/9 passed.
  - `autonomous-progression.test.ts`: 4/4 passed (0-goal discovery, priority assignment, candidate shape, manual goal coexistence).
  - Total: **19 passed (19)**.

- **Companion Summary & Unified Pipeline (`companion-summary/`)**:
  - `companion-summary.calculator.test.ts`: 8/8 passed.
  - `companion-summary.service.test.ts`: 5/5 passed.
  - `companion-summary.http.test.ts`: 4/4 passed.
  - `unified-pipeline.test.ts`: 4/4 passed (multi-objective execution, primaryAction synchronization, domain schedule elevation, 0-goal coherence).
  - Total: **21 passed (21)**.

- **Grand Total**: **92 passed tests** directly exercising M7 functionality across unit, service, and integration suites.

---

## Documented Remaining Limitations

In accordance with Project Celestia architecture and operational boundaries, the following limitations are explicitly documented:

1. **Private Account Web Scraping Out-of-Scope**:
   - Live credential-based scraping or network-sniffing of private HoYoverse accounts is strictly out of scope.
   - Account state ingestion relies exclusively on explicit player GOOD imports or public Enka showcase queries.

2. **Mobile Browser Worker Execution Bounds**:
   - The browser-side GCSim WebWorker is memory-bounded to $\le 50$ Monte Carlo iterations to guarantee mobile responsiveness and prevent WebWorker terminations under memory-constrained mobile environments.
   - Server-side background simulations run full convergence iterations.

3. **Unmodeled Characters & Simulation Form Coverage**:
   - Characters lacking executable simulation form models (e.g. unreleased units or Traveler forms lacking custom action scripts) degrade gracefully to deterministic heuristic models (`HEURISTIC_FALLBACK`) with transparent diagnostic caveats.

4. **Static Dataset Cadence**:
   - Celestia intentionally uses locally pinned, validated static files (`domainSchedule.json`, `endgame-encounters.json`, `active-banners.json`).
   - Content cycle rotations require versioned repository updates rather than unverified runtime network scraping.
