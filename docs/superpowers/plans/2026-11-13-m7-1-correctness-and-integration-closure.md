# M7.1 — Correctness and Integration Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the four core integration and correctness gaps identified in the M7 Independent Review: make GCSim simulations account-build specific with multi-candidate ranking; harden game-data provenance and expiry checks; feed validated teams and endgame bottlenecks into autonomous progression discovery; and prove the entire end-to-end journey in PostgreSQL.

**Architecture:** Extend Project Celestia's Modular Monolith and ADR-0011 (Calculator/Explainer separation). `TeamSimulationService` translates imported character levels, talents, weapons, and artifact set bonuses/stats into deterministic GCSim configurations and kit-appropriate rotations; `TeamIntelligenceService` ranks multiple buildable candidates by simulated DPS; `PlannerIntelligenceService` wires validated team members and endgame bottlenecks into autonomous progression discovery while preserving unknown inventory status; static data loaders enforce patch scope and fail closed on unverified sources; and an end-to-end PostgreSQL integration test proves the full journey from raw GOOD import to synchronized dashboard hero recommendation.

**Tech Stack:** TypeScript 5, Node.js 24 (`worker_threads`), Express 5, Prisma 7, PostgreSQL (disposable loopback), Vitest 3, React 19, TanStack Query, Tailwind CSS, Zod 3, gcsim v2.47.2 (WASM).

**Spec:** [M7 Independent Review Findings & M7.1 Closure Guidance](file:///d:/Genshin%20Personal/project-celestia/docs/plans/autonomous-companion/implementation_plan.md)

## Global Constraints

- **Modular Monolith**: Game intelligence logic lives strictly under `apps/api/src/games/genshin/intelligence/`. Platform auth/users never hold Genshin kit logic.
- **ADR-0011 Strictness**: Separate pure calculations (zero prose, deterministic math) from explainers (pure formatting/translation, zero business decisions).
- **Truth in Simulation**: Simulation metrics (`simulatedDps`, `errorMargin`, `simulationStatus: 'VERIFIED_SIMULATION'`) must represent actual account-build GCSim runs. Never conflate heuristic scores (25..100) with simulated DPS.
- **Fail-Closed Data Trust**: Encounters and banners without current patch scope or genuine live provenance must be marked historical (`isExpired: true`, `historical: true`) or return empty, emitting explicit `CONDITIONAL_DATA_GAP` / `HISTORICAL_CYCLE` caveats.
- **Non-Destructive Roster Autonomy**: Autonomous progression discovery suggests improvements across the account without overwriting existing player goals or mutating stored equipment records.
- **Backward Compatibility**: All existing HTTP routes (`GET /intelligence/summary`, `GET /intelligence/planner`, `GET /teams`) retain valid contract shapes and schemas.

## Review Focus

1. **Account-Build GCSim Simulation**: Ensure equipped weapons (key, refinement, level) and equipped artifacts (set bonus, main stats, substats) are translated into GCSim config lines rather than generic starter weapons and blank stats.
2. **Multi-Candidate Simulation & Simulated DPS Ranking**: Ensure `TeamIntelligenceService` simulates multiple candidate buildable lineups and ranks them by `simulatedDps` rather than choosing candidates solely by static template scores.
3. **Data Trust Expiry & Patch Scope Guards**: Encounters with past expiry or mismatched patch scope and banners with synthetic future dates must not pass as verified live schedules.
4. **Autonomous Progression Bottleneck Integration**: Ensure `discoverAutonomousProgression` receives `teamMemberKeys` and `bottleneckCharacterKeys` so Tier 1 (Core Team) and Tier 2 (Bottleneck) candidates are prioritized over general utility.
5. **Unknown vs Zero Inventory Distinction**: Missing or failed inventory fetch must preserve `undefined` / `unknown` status rather than defaulting to empty `{}` and assuming confirmed 0 materials.

---

### Task 1: Account-Build Translation & Multi-Candidate Simulation in Team Intelligence

**Files:**
- Modify: `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts`
- Modify: `apps/api/src/games/genshin/intelligence/team-intelligence/team-intelligence.service.ts`
- Modify: `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`
- Modify: `apps/api/src/games/genshin/intelligence/team-intelligence/team-intelligence.service.test.ts`

**Interfaces:**
- Consumes: `CharacterWithWeapon`, `Artifact` from `apps/api/src/games/genshin/account-data/account-context-provider.service.ts`.
- Produces: `SimulationMemberInput` supporting `equippedWeapon` and `equippedArtifacts`; deterministic GCSim config generation with actual weapon names, refinement, artifact set bonuses, and stats; multi-candidate simulation and DPS-based ranking in `getSimulatedRecommendationsForRoster`.

- [x] **Step 1: Write failing tests for real-build translation and multi-candidate simulation**
  In `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`:
  - Test that `generateConfig` includes weapon line with equipped weapon name, refinement, and level (e.g., `staffofhoma refine=1 lvl=90/90`).
  - Test that `generateConfig` includes artifact set lines (e.g., `add set="crimsonwitchofflames" count=4;`) and aggregated stats (e.g., `add stats hp=... atk=... cr=... cd=...;`).
  - Test that `getSimulatedRecommendationsForRoster` simulates top N candidates (e.g. 3) and ranks recommendations by `simulatedDps` descending.
  - Test that `buildCandidateEndgameTeams` assigns real simulated base DPS to simulated teams, and marks unsimulated disjoint teams with explicit fallback status without mixing scales.

- [x] **Step 2: Run tests to verify failure**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`
  Expected: FAIL (starter weapon used instead of equipped weapon, artifact stats not emitted).

- [x] **Step 3: Implement account-build translation in `team-simulation.service.ts`**
  - Update `SimulationMemberInput` interface:
    ```ts
    export interface SimulationArtifactInput {
      setKey: string;
      slotKey?: string;
      mainStatKey?: string;
      level?: number;
      rarity?: number;
      subStats?: ReadonlyArray<{ key: string; value: number }>;
    }

    export interface SimulationMemberInput {
      characterKey: string;
      level?: number;
      constellation?: number;
      talentNormal?: number;
      talentSkill?: number;
      talentBurst?: number;
      equippedWeapon?: { weaponKey: string; level?: number; refinement?: number } | null;
      equippedArtifacts?: ReadonlyArray<SimulationArtifactInput>;
      customStats?: Record<string, number>;
    }
    ```
  - In `generateConfig`:
    - Resolve weapon: clean `weaponKey` to alphanumeric lowercase. If `parsed.equippedWeapon?.weaponKey` is provided, emit:
      `${gcsimKey} add weapon="${normalizedWeaponKey}" refine=${parsed.equippedWeapon.refinement ?? 1} lvl=${parsed.equippedWeapon.level ?? 90}/${parsed.equippedWeapon.level ?? 90};`
      Fallback to starter weapon only if no equipped weapon is specified.
    - Resolve artifacts: group by `setKey` to count 2-piece and 4-piece sets. Emit `${gcsimKey} add set="${normalizedSetKey}" count=${count};` (count 2 or 4).
    - Aggregate artifact mainStats and subStats (mapping GOOD keys like `critRate_` -> `cr`, `critDMG_` -> `cd`, `enerRech_` -> `er`, `eleMas` -> `em`, `atk_` -> `atk%`, `hp_` -> `hp%`, `pyro_dmg_` -> `pyro%`, etc.).
    - Emit `${gcsimKey} add stats ...;` if stats are non-zero.
    - Kit-aware rotation: support archetype sequencing (aura/support skill/burst -> subDPS burst/skill -> on-field DPS burst/attack).

- [x] **Step 4: Implement multi-candidate simulation and ranking in `team-intelligence.service.ts`**
  - Update `getSimulatedRecommendationsForRoster`:
    - Accept `simulateTopN?: number` (default to 3 or limit).
    - For top `toSimulate` buildable candidate recommendations, gather member inputs including their equipped weapons and artifacts from the roster/artifacts pool.
    - Run simulation on each candidate team.
    - Re-rank the recommendations by `simulatedDps` descending. If simulations fail or are tied within CI, use template score as secondary tie-breaker.
  - In `buildCandidateEndgameTeams`:
    - When `simulatedDps` is present, use `Math.round(simulatedDps)`.
    - If unsimulated, assign baseline score scaled to DPS range (or clearly flag `simulationStatus: 'HEURISTIC_FALLBACK'`) so endgame solvers do not compare 85 with 60,000.

- [x] **Step 5: Run tests to verify pass**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/team-intelligence/`
  Expected: PASS.

- [x] **Step 6: Commit**
  ```bash
  git add apps/api/src/games/genshin/intelligence/team-intelligence/
  git commit -m "feat(team-intelligence): simulate real account builds and rank candidate teams by simulated DPS"
  ```

---

### Task 2: Game-Data Trust, Version Reconciliation & Provenance Hardening

**Files:**
- Modify: `apps/api/src/games/genshin/static/endgame-encounters.json`
- Modify: `apps/api/src/games/genshin/static/active-banners.json`
- Modify: `apps/api/src/games/genshin/intelligence/pull-intelligence/pull-intelligence.service.ts`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/abyss-joint.calculator.ts`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.calculator.ts`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.calculator.ts`
- Modify: `apps/api/tooling/release-source-provenance.mjs`
- Test: `apps/api/src/games/genshin/static/data-trust.test.ts`

**Interfaces:**
- Consumes: Dataset files `endgame-encounters.json`, `active-banners.json`, and `release-roster.json`.
- Produces: Verified patch scope checks, honest historical labeling for simulator scenario fixtures, fail-closed live banner verification, and explicit provenance caveats.

- [x] **Step 1: Write failing tests for data trust and patch scope validation**
  In `apps/api/src/games/genshin/static/data-trust.test.ts`:
  - Test that `endgame-encounters.json` verifies patch scope against current engine version and marks `isExpired: true` if expired or outside active patch scope.
  - Test that `active-banners.json` entries marked with historical notes or simulator scenarios are classified as `historical: true`, and `getVerifiedActiveBanners` rejects them from passing as current live banners.
  - Test that `pull-intelligence.service.ts` degrades gracefully with `CONDITIONAL_DATA_GAP` when no verified live schedule exists.

- [x] **Step 2: Run tests to verify failure**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/static/data-trust.test.ts`
  Expected: FAIL.

- [x] **Step 3: Update static datasets and provenance checkers**
  - In `active-banners.json`:
    - Remove artificial `endDate: "2029-12-31"` from simulator fixtures. Mark them honestly with `historical: true` and `simulation: true`.
  - In `endgame-encounters.json`:
    - Align `patchScope` and ensure `isExpired` is evaluated against both temporal date and current patch version.
  - In `pull-intelligence.service.ts`:
    - Ensure `getVerifiedActiveBanners` checks for authentic live schedule provenance; historical simulation fixtures return `[]` for live schedules, triggering `CONDITIONAL_DATA_GAP` with explicit caveats.
  - In `release-source-provenance.mjs`:
    - Ensure verification distinguishes code integrity pins from independent third-party audit status without fabricated claims.

- [x] **Step 4: Run tests to verify pass**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/static/data-trust.test.ts`
  Run: `pnpm companion:status`
  Expected: PASS.

- [x] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/static/ apps/api/src/games/genshin/intelligence/pull-intelligence/ apps/api/tooling/
  git commit -m "fix(data-trust): reconcile patch scope, mark simulator fixtures historical, and enforce fail-closed banner verification"
  ```

---

### Task 3: Shared Optimizer & Autonomous Progression Priority Alignment

**Files:**
- Modify: `apps/api/src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.ts`
- Modify: `apps/api/src/games/genshin/intelligence/planner-intelligence/planner-optimization.calculator.ts`
- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.service.ts`
- Test: `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.calculator.test.ts`
- Test: `apps/api/src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.test.ts`

**Interfaces:**
- Consumes: Top validated team members from `TeamIntelligenceService` and bottleneck characters from endgame calculators.
- Produces: Discovery parameters `{ teamMemberKeys, bottleneckCharacterKeys }` passed into `discoverAutonomousProgression`; inventory state preserving `unknown` vs zero inventory; synchronized hero recommendation in `CompanionSummaryService`.

- [x] **Step 1: Write failing tests for autonomous progression priority and inventory status**
  In `apps/api/src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.test.ts`:
  - Test that `getOptimizedPlan` passes core team keys and bottleneck keys into autonomous discovery, resulting in Tier 1 and Tier 2 candidate prioritization.
  - Test that when stock repository returns no record, inventory status is preserved as `unknown` rather than assuming 0 materials owned.
  - In `companion-summary.service.test.ts`, test that the dashboard's hero team and primary action align with the simulated team and autonomous plan.

- [x] **Step 2: Run tests to verify failure**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.test.ts`
  Expected: FAIL (teamMemberKeys not passed, inventory defaulted to `{}`).

- [x] **Step 3: Update `planner-intelligence.service.ts` and `planner-optimization.calculator.ts`**
  - In `planner-intelligence.service.ts`:
    - Derive `teamMemberKeys` from the top team recommendation.
    - Derive `bottleneckCharacterKeys` from active endgame evaluation.
    - Pass both to `discoverAutonomousProgression({ rawRoster, artifacts, teamMemberKeys, bottleneckCharacterKeys, manualGoals: goals })`.
    - Replace `recordedInventory = {}` catch fallback with `recordedInventory = undefined` (or flag `isInventoryKnown: boolean`).
  - In `planner-optimization.calculator.ts`:
    - Accept `recordedInventory?: Record<string, number>`.
    - If `recordedInventory` is undefined, mark material requirements with `inventoryStatus: 'unknown'` rather than zero-stock deficit.
  - In `companion-summary.service.ts`:
    - Ensure `getAuthenticatedCompanionSummary` derives the primary action directly from `plannerService.getOptimizedPlan` with shared context.

- [x] **Step 4: Run tests to verify pass**
  Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/planner-intelligence/ src/games/genshin/intelligence/companion-summary/`
  Expected: PASS.

- [x] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/intelligence/planner-intelligence/ apps/api/src/games/genshin/intelligence/companion-summary/
  git commit -m "feat(planner): feed validated teams and endgame bottlenecks into autonomous discovery and distinguish unknown inventory"
  ```

---

### Task 4: Complete Real-Account Journey PostgreSQL Integration Test

**Files:**
- Create: `apps/api/tooling/m7-1-real-journey.integration.test.js`
- Modify: `apps/api/tooling/m7-benchmarks.integration.test.js`

**Interfaces:**
- Consumes: Disposable loopback PostgreSQL database (`CELESTIA_TEST_DATABASE_URL`), real GOOD export fixture.
- Produces: End-to-end verified pipeline: import GOOD -> PostgreSQL persistence -> account context resolution -> real-build GCSim simulation -> autonomous plan generation -> companion summary synchronization.

- [x] **Step 1: Write the end-to-end real journey integration test**
  In `apps/api/tooling/m7-1-real-journey.integration.test.js`:
  - Connect to PostgreSQL and apply migrations if needed.
  - Create a user and POST a valid GOOD payload containing 4 characters (e.g. HuTao, Xingqiu, Yelan, Zhongli) with equipped weapons (StaffOfHoma, SacrificialSword, FavoniusWarbow, BlackTassel) and full 5-star artifact sets with real substats.
  - Resolve user account context using `AccountContextProvider`. Assert `scope === 'private_authenticated'` and observed characters have their equipped weapons and artifacts attached.
  - Call `TeamIntelligenceService.getSimulatedRecommendationsForRoster` using the imported roster and artifacts. Assert that `simulatedDps > 0`, `simulationStatus === 'VERIFIED_SIMULATION'`, and the config generated includes StaffOfHoma and Crimson Witch / Emblem artifacts.
  - Call `PlannerIntelligenceService.getOptimizedPlan` for this user with 0 manual goals. Assert that autonomous progression candidates are discovered, prioritizing the core team members.
  - Call `CompanionSummaryService.getAuthenticatedCompanionSummary`. Assert that `summary.todayPlan.primaryAction` matches the first step of the optimized plan and `summary.teamSuggestion.simulatedDps` matches the simulated team.

- [x] **Step 2: Run the end-to-end integration test**
  Run: `pnpm --filter @celestia/api exec vitest run tooling/m7-1-real-journey.integration.test.js`
  Expected: PASS.

- [x] **Step 3: Run full M7 benchmark suite**
  Run: `pnpm --filter @celestia/api exec vitest run tooling/m7-benchmarks.integration.test.js`
  Expected: PASS (all 5 benchmarks pass alongside the real journey test).

- [x] **Step 4: Commit**
  ```bash
  git add apps/api/tooling/m7-1-real-journey.integration.test.js apps/api/tooling/m7-benchmarks.integration.test.js
  git commit -m "test(m7-1): add complete end-to-end real account journey integration test in PostgreSQL"
  ```

---

### Task 5: Documentation Reconciliation & Handoff Tracking

**Files:**
- Modify: `docs/plans/CURRENT_HANDOFF.md`
- Modify: `docs/plans/autonomous-companion/task.md`
- Modify: `docs/superpowers/plans/2026-11-12-m7-autonomous-optimization.md`
- Create: `docs/plans/autonomous-companion/m7-1-closure-progress.md`

**Interfaces:**
- Consumes: Test results and implementation records from Tasks 1–4.
- Produces: Reconciled canonical handoff in `CURRENT_HANDOFF.md`, verified task checklist, and consistent progress documentation.

- [x] **Step 1: Update `docs/plans/CURRENT_HANDOFF.md`**
  - Add the canonical M7 / M7.1 completion entry at the top of `CURRENT_HANDOFF.md`.
  - Record the verified GCSim real-build simulation, data trust provenance, autonomous progression with bottleneck prioritization, unknown inventory handling, and the complete real-account PostgreSQL journey.
  - Archive or contextualize the older November 6 M3 header.

- [x] **Step 2: Reconcile checklist and task files**
  - Check off all completed tasks in `docs/superpowers/plans/2026-11-12-m7-autonomous-optimization.md` and `docs/superpowers/plans/2026-11-13-m7-1-correctness-and-integration-closure.md`.
  - Fix any filename references (e.g., ensure `release-roster.json` is referenced accurately).
  - Create `docs/plans/autonomous-companion/m7-1-closure-progress.md` recording Vitest test counts, CI run evidence, and architectural guarantees.

- [x] **Step 3: Run full monorepo verification**
  Run:
  - `pnpm --filter @celestia/api exec vitest run`
  - `pnpm lint`
  - `pnpm typecheck`
  - `pnpm companion:status`
  Expected: All checks pass with 0 errors.

- [x] **Step 4: Commit**
  ```bash
  git add docs/
  git commit -m "docs(handoff): record M7.1 correctness closure and update canonical handoff"
  ```
