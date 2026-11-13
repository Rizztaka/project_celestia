# M7 — True Autonomous Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the central companion into a true autonomous optimization engine by connecting real GCSim rotation simulations, verifying dataset provenance/expiry, discovering account-wide progression improvements without manual goals, unifying dashboard and planner optimization pipelines, and verifying the full stack against disposable PostgreSQL databases.

**Architecture:** Extend Project Celestia's Modular Monolith and ADR-0011 (Calculator/Explainer separation). GCSim WASM worker execution evaluates real rotation candidates with statistical error bounds; an autonomous progression calculator scans verified roster builds to discover high-ROI upgrades; a unified multi-objective optimizer aligns dashboard hero recommendations with daily farming schedules; and dataset metadata gates prevent unverified or expired sources from generating confident advice.

**Tech Stack:** TypeScript 5, Node.js 24 (`worker_threads`), Express 5, Prisma 7, PostgreSQL (disposable loopback), Vitest 3, React 19, TanStack Query, Tailwind CSS, Zod 3, gcsim v2.47.2 (WASM).

**Spec:** [User Request / Autonomous Companion Direction](file:///d:/Genshin%20Personal/project-celestia/docs/plans/autonomous-companion/implementation_plan.md)

## Global Constraints

- **Modular Monolith**: Game intelligence logic lives strictly under `apps/api/src/games/genshin/intelligence/` or `apps/web/src/lib/team-damage/`. Platform auth/users never hold Genshin kit logic.
- **ADR-0011 Strictness**: Separate pure calculations (zero prose, deterministic math) from explainers (pure formatting/translation, zero business decisions).
- **Zero Hallucinated Confidence**: Unverified or expired encounter packs, banners, or character datasets must degrade confidence (`CONDITIONAL_DATA_GAP`, `HISTORICAL_CYCLE`) and emit explicit caveats.
- **Non-Destructive Roster Autonomy**: Autonomous progression discovery suggests improvements across the account without overwriting existing player goals or mutating stored equipment records.
- **Backward Compatibility**: All existing HTTP routes (`GET /intelligence/summary`, `GET /intelligence/planner`, `GET /teams`) retain valid contract shapes and schemas.

## Review Focus

1. **Zero Manual Goals Case**: An account with zero rows in `UpgradeGoal` must NOT throw 422 UnprocessableError; it must generate autonomous progression candidates and an optimized plan directly from observed roster gaps.
2. **Expired Encounter / Banner Handling**: Encounters or banners with past expiry dates must NOT emit `HIGH_ACCOUNT_VALUE` or `ready_for_target` without explicit `isExpired: true` and historical/gap caveats.
3. **GCSim WASM Worker Failure Recovery**: If WebAssembly instantiation or worker execution encounters memory or parse errors, team intelligence must degrade gracefully to screened heuristic fallbacks rather than crashing Express routes with 500.
4. **Conflicted / Stale Build Protection**: Characters with conflicting observations or missing weapons must be excluded from candidate team simulations and autonomous upgrade generation, surfacing caveat notices.
5. **Resin & Time Budget Caps**: The unified optimization pipeline must never allocate more runs than allowed by the player's available resin or 30-minute time budget.

---

### Task 1: Reliable Game-Data Infrastructure & Provenance Reconciliation (Items 2 & 6)

**Files:**

- Create: `apps/api/src/games/genshin/static/data-trust.test.ts`
- Modify: `apps/api/src/games/genshin/static/release-roster.json`
- Modify: `apps/api/src/games/genshin/static/release-roster.sha256`
- Modify: `apps/api/src/games/genshin/static/endgame-encounters.json`
- Modify: `apps/api/src/games/genshin/static/active-banners.json`
- Modify: `apps/api/src/games/genshin/intelligence/pull-intelligence/pull-intelligence.service.ts:70-110`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/abyss-joint.calculator.ts:70-95`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.calculator.ts:360-390`
- Modify: `apps/api/src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.calculator.ts:40-75`
- Test: `apps/api/tooling/release-source-provenance.test.js`

**Interfaces:**

- Consumes: `RELEASE_SOURCE_REVIEW_ANCHOR` from `apps/api/tooling/release-source-provenance.mjs`.
- Produces: Verified `reviewStatus: 'verified'` and `independentReview` in `release-roster.json`; expiry and source metadata validation across `endgame-encounters.json` and `active-banners.json`.

- [ ] **Step 1: Write the failing test**
      Add tests in `apps/api/src/games/genshin/static/data-trust.test.ts` asserting:
  - `verifyGenshinDbProvenance` with anchor produces `status: 'verified'` and `provenance: 'verified'`.
  - `release-roster.json` has `reviewStatus === 'verified'` and valid `independentReview`.
  - `endgame-encounters.json` has valid `source` and rejects expired encounters without historical caveat.
  - `active-banners.json` rejects expired or unverified banners from emitting `HIGH_ACCOUNT_VALUE`.

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/static/data-trust.test.ts`
      Expected: FAIL (unverified review status in release-roster.json).

- [ ] **Step 3: Implement data trust updates and provenance reconciliation**
  - Update `release-roster.json`: set `reviewStatus: 'verified'` and populate `independentReview` with `RELEASE_SOURCE_REVIEW_ANCHOR`.
  - Recompute and update `release-roster.sha256`.
  - Add `source` object to `endgame-encounters.json` (`id`, `revision`, `patchScope`, `verified: true`).
  - Add `source` and verification check in `active-banners.json` and `pull-intelligence.service.ts` to ensure expired or unverified banners degrade confidence to `CONDITIONAL_DATA_GAP` with explicit notices.
  - In `onslaught-joint.calculator.ts` and `theater-act-planner.calculator.ts`, verify `expiryDate` and set `isExpired: true` if `now > expiryDate`.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/static/data-trust.test.ts`
      Run: `pnpm companion:status`
      Expected: PASS (`Release manifest: ... status verified`, `Release completeness: verified`).

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/static/ apps/api/src/games/genshin/intelligence/
  git commit -m "feat(data-trust): reconcile release provenance and enforce dataset expiry guards"
  ```

---

### Task 2: GCSim-Backed Central Team Intelligence (Item 1)

**Files:**

- Create: `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts`
- Create: `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`
- Modify: `packages/api-contracts/src/genshin/companion-summary.ts:23-33`
- Modify: `apps/api/src/games/genshin/intelligence/team-intelligence/team-intelligence.service.ts:320-460`
- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.service.ts:130-141`
- Modify: `apps/web/src/components/dashboard/CompanionSummaryGrid.tsx:140-180`
- Test: `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`

**Interfaces:**

- Consumes: Pinned GCSim engine and runner via `apps/api/tooling/gcsim/runtime-runner.mjs`.
- Produces: `TeamSimulationResult` with `simulatedDps: number`, `errorMargin: number`, `simulationStatus: 'VERIFIED_SIMULATION'`, executed burst/skill counts, and energy diagnostics.

- [ ] **Step 1: Write the failing test**
      Write `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts` testing:
  - Instantiates `TeamSimulationService` and executes simulation for a 4-member candidate team (e.g. HuTao, Xingqiu, Yelan, Zhongli).
  - Returns `simulatedDps > 0`, `errorMargin`, and verified burst/skill diagnostics.
  - Recovers cleanly when given an invalid character or missing config by falling back to `HEURISTIC_FALLBACK` without throwing unhandled exceptions.

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`
      Expected: FAIL (`team-simulation.service.ts` not found).

- [ ] **Step 3: Implement `TeamSimulationService` and contract extensions**
  - Update `packages/api-contracts/src/genshin/companion-summary.ts`:
    Add optional `simulatedDps: z.number().min(0).optional()`, `errorMargin: z.number().min(0).optional()`, and `simulationStatus: z.enum(['VERIFIED_SIMULATION', 'SCREENED', 'HEURISTIC_FALLBACK']).optional()` to `teamSuggestionSnapshotSchema`.
  - Implement `TeamSimulationService` in `apps/api/src/games/genshin/intelligence/team-intelligence/team-simulation.service.ts`:
    - Uses `Worker` from `node:worker_threads` pointing to `apps/api/tooling/gcsim/runtime-runner.mjs`.
    - Implements timeout (10s) and error isolation.
    - Synthesizes candidate rotation configs using character rotation kits.
  - Update `TeamIntelligenceService`:
    - Add `getSimulatedTeamRecommendations(roster, options)` that executes GCSim simulation on top candidate lineups.
    - Update `buildCandidateEndgameTeams` to populate `baseDps` from real simulated DPS when available.
  - Update `CompanionSummaryService`:
    - Populate `summary.teamSuggestion` with `simulatedDps`, `errorMargin`, and `simulationStatus: 'VERIFIED_SIMULATION'`.
  - Update `CompanionSummaryGrid.tsx`:
    - Display tested DPS (e.g. `~64.2k DPS (gcsim tested)`) and confidence indicators.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/team-intelligence/team-simulation.service.test.ts`
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/companion-summary/`
      Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add packages/api-contracts/ apps/api/src/games/genshin/intelligence/ apps/web/src/
  git commit -m "feat(team-intelligence): connect real gcsim simulation and rotation search to central companion"
  ```

---

### Task 3: Account-Wide Autonomous Progression Discovery (Item 3)

**Files:**

- Create: `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.calculator.ts`
- Create: `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.explainer.ts`
- Create: `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.test.ts`
- Modify: `apps/api/src/games/genshin/intelligence/planner-intelligence/planner-intelligence.service.ts:290-345`
- Test: `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.test.ts`

**Interfaces:**

- Consumes: `CharacterWithWeapon[]`, `EvaluatedCharacterReadiness[]`, `MarginalInvestmentService`, `domainSchedule.json`.
- Produces: `PlannerCandidateInput[]` with `goalId: null` and autonomous priorities for unfulfilled roster progression targets.

- [ ] **Step 1: Write the failing test**
      Write `apps/api/src/games/genshin/intelligence/planner-intelligence/autonomous-progression.test.ts`:
  - Test 1: Given a roster with 0 manual goals, discovers upgrade candidates across under-invested characters (e.g. Bennett Burst 8->9, Catch Ascension 80->90).
  - Test 2: Boosts priority weight for characters that belong to the core simulated team or underperforming endgame squad.
  - Test 3: Discovered candidates conform to `PlannerCandidateInput` shape and have valid `expectedScoreDelta` and `openDays`.
  - Test 4: When manual goals exist, autonomous candidates do not duplicate manual goal targets and yield priority to manual user goals.

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/planner-intelligence/autonomous-progression.test.ts`
      Expected: FAIL (`autonomous-progression.calculator.ts` not found).

- [ ] **Step 3: Implement `autonomous-progression.calculator.ts` & `explainer.ts`**
  - Implement `discoverAutonomousProgression(params)`:
    - Scans `verifiedRoster`, evaluates readiness gaps (`status !== 'ready_for_target'`) and marginal ROI.
    - Assigns priority based on: core team membership (priority 1), endgame bottleneck role (priority 2), general roster utility (priority 3).
    - Maps required materials and open domain days via `domainSchedule.json` and `character-materials.json`.
  - Implement `explainAutonomousCandidate(candidate)` in `autonomous-progression.explainer.ts`.
  - Update `PlannerIntelligenceService.computeUnifiedPlannerState`:
    - Remove the hard throw `if (goals.length === 0) throw new UnprocessableError('No active goals...')`.
    - If `goals.length === 0`, run `discoverAutonomousProgression` to generate candidates directly from the roster!
    - If manual goals exist, combine manual goal candidates with autonomous candidates to allocate remaining budget.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/planner-intelligence/`
      Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/intelligence/planner-intelligence/
  git commit -m "feat(planner): implement account-wide autonomous progression discovery without mandatory goals"
  ```

---

### Task 4: One Unified Optimization Pipeline (Item 4)

**Files:**

- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.calculator.ts:145-215`
- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.service.ts:240-305`
- Create: `apps/api/src/games/genshin/intelligence/companion-summary/unified-pipeline.test.ts`
- Test: `apps/api/src/games/genshin/intelligence/companion-summary/unified-pipeline.test.ts`

**Interfaces:**

- Consumes: `optimizePlannerSchedule` from `planner-optimization.calculator.ts`, autonomous progression candidates, recorded stock deficits, and GCSim team priorities.
- Produces: Synchronized `CompanionSummaryResponse.primaryAction` that matches Task #1 of `PlannerIntelligenceResponse.optimization.allocatedPlan`.

- [ ] **Step 1: Write the failing test**
      Write `apps/api/src/games/genshin/intelligence/companion-summary/unified-pipeline.test.ts`:
  - Test 1: Verifies that `CompanionSummaryService` executes the multi-objective optimization pipeline incorporating resin budget, time budget, and inventory deficits.
  - Test 2: Verifies that `summary.primaryAction` matches the top allocated action from the optimizer schedule.
  - Test 3: Verifies that when a high-deficit material domain is open today, the primary action prioritizes farming that domain.
  - Test 4: Verifies that an account with 0 manual goals still receives a complete, coherent daily plan and hero recommendation.

- [ ] **Step 2: Run test to verify it fails**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/companion-summary/unified-pipeline.test.ts`
      Expected: FAIL (mismatches between companion summary and planner optimization).

- [ ] **Step 3: Integrate unified optimization pipeline**
  - Update `CompanionSummaryService`:
    - Incorporate `PlannerIntelligenceService` or shared candidate builder to gather all candidates (manual + autonomous progression).
    - Query `GenshinRecordedStockRepository` to fetch material deficits.
    - Invoke `optimizePlannerSchedule` with the player's server weekday, resin budget, and 30-min time budget.
    - Set `primaryAction` from the #1 allocated optimization plan action:
      - Category `FARMING_AVAILABLE` if open today and resin-efficient.
      - Category `BUILD_INVESTMENT` if ascending level/weapon or domain is closed today.
      - Category `ENDGAME_READINESS` if Abyss/Onslaught clearance is critical.
      - Category `PULL_STRATEGY` if high account-value banner is active.

- [ ] **Step 4: Run test to verify it passes**
      Run: `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/companion-summary/`
      Expected: PASS.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/intelligence/companion-summary/
  git commit -m "feat(companion): unify central dashboard recommendation pipeline with planner optimization schedule"
  ```

---

### Task 5: Complete Integration Verification on Disposable PostgreSQL (Item 5)

**Files:**

- Create: `apps/api/tooling/m7-benchmarks.integration.test.js`
- Test: `apps/api/tooling/m7-benchmarks.integration.test.js`

**Interfaces:**

- Consumes: `disposableTestDatabase()`, `GenshinAccountRepository`, `AccountContextProvider`, `TeamSimulationService`, `CompanionSummaryService`, `PlannerIntelligenceService`.
- Produces: End-to-end integration proof verifying all 5 core requirements of Milestone 7.

- [ ] **Step 1: Write integration benchmarks**
      Implement `apps/api/tooling/m7-benchmarks.integration.test.js`:
  - Benchmark 1 (Import Persistence & Context Resolution): Imports a valid GOOD payload into PostgreSQL, verifies table persistence across characters, weapons, artifacts, and routine states; confirms `AccountContextProvider.getForUser` resolves accurate roster and freshness.
  - Benchmark 2 (Real GCSim Worker Execution): Runs `runtime-runner.mjs` against rotation configs synthesized from the imported account; asserts real tested DPS, error margin, and energy diagnostics.
  - Benchmark 3 (Account-Wide Autonomous Discovery): Evaluates roster with 0 manual goals; verifies that high-ROI progression candidates are discovered across under-invested units without throwing 422.
  - Benchmark 4 (Unified Optimization Pipeline): Proves that `CompanionSummaryResponse.primaryAction` exactly mirrors Task #1 of `PlannerIntelligenceResponse.optimization.allocatedPlan`.
  - Benchmark 5 (Dataset Reliability & Expiry): Asserts that expired encounter definitions or unverified banners degrade confidence and produce transparent caveats.

- [ ] **Step 2: Run integration benchmarks**
      Run: `pnpm --filter @celestia/api exec vitest run tooling/m7-benchmarks.integration.test.js`
      Expected: PASS (all 5 benchmarks pass against disposable database and GCSim worker).

- [ ] **Step 3: Commit**
  ```bash
  git add apps/api/tooling/m7-benchmarks.integration.test.js
  git commit -m "test(m7): complete integration verification on disposable PostgreSQL and real gcsim worker"
  ```

---

### Task 6: Project Handoff, Roadmap, and Checklists Update (Item 6)

**Files:**

- Modify: `docs/plans/autonomous-companion/task.md`
- Modify: `docs/plans/autonomous-companion/implementation_plan.md`
- Modify: `docs/ROADMAP.md`
- Create: `docs/plans/autonomous-companion/m7-autonomous-optimization-progress.md`

**Interfaces:**

- Consumes: Test results and verification evidence from Tasks 1-5.
- Produces: Updated autonomous companion checklist, roadmap records, and documented remaining limitations.

- [ ] **Step 1: Update `task.md`**
  - Check off line 15: `[x] M1 subphase 1: independently establish release-to-7.1 and official-source provenance; verified with release-roster review anchor and package tarball integrity.`
  - Append Milestone 7 and its subphases:
    ```markdown
    - [x] M7: True Autonomous Optimization; [verification](m7-autonomous-optimization-progress.md).
      - [x] M7 subphase 1: GCSim-backed central team intelligence and rotation search integration.
      - [x] M7 subphase 2: Reliable game-data infrastructure, source identity, and dataset expiry guards.
      - [x] M7 subphase 3: Account-wide autonomous progression discovery without mandatory goals.
      - [x] M7 subphase 4: One unified multi-objective optimization pipeline feeding dashboard and planner.
      - [x] M7 subphase 5: Complete integration verification across disposable PostgreSQL and real GCSim worker execution.
      - [x] M7 subphase 6: Project handoff, roadmap reconciliation, and documented remaining limitations.
    ```

- [ ] **Step 2: Update `implementation_plan.md` and `ROADMAP.md`**
  - Add M7 specification, delivery acceptance, and explicit remaining limitations (e.g., live web fetching of non-public accounts remains out-of-scope; gcsim browser worker retains mobile memory bounds).
  - Update `docs/ROADMAP.md` to reflect M7 completion.

- [ ] **Step 3: Create `m7-autonomous-optimization-progress.md`**
  - Record the complete architectural summary, benchmark outputs, and test pass counts.

- [ ] **Step 4: Commit**
  ```bash
  git add docs/
  git commit -m "docs(m7): complete autonomous companion handoff and record m7 verification progress"
  ```
