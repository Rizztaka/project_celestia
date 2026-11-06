# Team Search with Defensible Rotations — Milestone 3 Evidence & Verification

**Document Version:** 1.0.0  
**Phase:** Milestone 3 (Autonomous Companion — Team Search with Defensible Rotations, Comfort Scoring, and Gear Exclusivity)  
**Status:** Implementation, Benchmarking & Verification Complete  
**Date:** 2026-11-06

---

## 1. Architectural Scope & Provenance

Milestone 3 establishes a deterministic, defensible team recommendation engine within Project Celestia's Modular Monolith (`apps/web/src/lib/team-damage` and `apps/web/src/components`), strictly adhering to:

- **ADR-0001 (Modular Monolith)**: Cohesive domain organization under `team-damage` without cross-domain pollution.
- **ADR-0011 (Separation of Calculator and Explainer)**: Pure numeric calculation engines (`team-comfort.calculator.ts`, `rotation-synthesizer.calculator.ts`, `auto-generator.calculator.ts`) strictly separated from presentation and rationale explainers (`team-comfort.explainer.ts`, `RotationTimelineView.tsx`, `TeamRecommendationCard.tsx`).
- **gcsim WASM Invariant**: Rotation execution uses real combat action syntax (`burst`, `skill`, `attack`, `charge`, `dash`) compatible with the WebAssembly simulation worker, replacing naive Skill-only fallbacks.
- **Backward Compatibility**: Preserved legacy 5-step `defaultRotation` fallback for Section 5 Damage Lab client contracts while powering M3 bounded search with `defensibleRotation`.

---

## 2. Core Invariants & Engineering Guarantees

Milestone 3 implements and verifies six core architectural invariants:

### 1. Defensible Character Kit & Role-Ordered Sequencing

- **Reviewed Kits**: Created `rotation-kit.ts` with reviewed action kits for key archetypes:
  - Bennett (`burst`, `skill`, `particle_wait`)
  - Xiangling (`burst`, `skill`)
  - Xingqiu (`burst`, `skill`, `skill` for Sacrificial Sword)
  - Yelan (`burst`, `skill`)
  - Furina (`skill`, `burst`)
  - Kazuha (`burst`, `skill`, `high_plunge`)
  - Nahida (`skill[hold=1]`, `burst`)
  - Raiden (`skill`, `burst`, `driver_combo`)
  - Hu Tao (`skill`, `charge_dash_combo`)
  - Zhongli (`skill[hold=1]`, `burst`)
  - Fischl (`skill`/`burst`)
  - Sucrose (`burst`, `skill`, `skill`)
- **Role Order Assembly**: Sequences actions logically to maximize buff and resistance shred windows:
  $$\text{aura\_setup} \longrightarrow \text{buffer} \longrightarrow \text{debuffer} \longrightarrow \text{sub\_dps} \longrightarrow \text{driver combo} \longrightarrow \text{battery funnel}$$
- **Energy & Battery Funneling**: High-energy off-field DPS (e.g. Xiangling) receive explicit battery particle wait steps from dedicated battery supports (e.g. Bennett).

### 2. Gear Exclusivity (No Duplicate Equipment)

- **Principle**: Real account loadouts cannot equip the same physical weapon or artifact instance on multiple characters simultaneously.
- **Implementation**:
  - `validateGearExclusivity` checks for artifact and weapon conflicts across all 4 team members.
  - Correctly distinguishes between instance UUIDs (`instanceId`, `inst_*`) and catalog IDs, preventing false-positive rejections in synthetic mock fixtures while strictly rejecting true instance collisions in user account rosters.

### 3. Multidimensional Defensive Comfort Scoring

- **Principle**: High DPS means nothing if a team is unplayable or fragile for average human execution.
- **Implementation**:
  - `calculateTeamComfort`: Computes normalized 0–100 scores across 4 dimensions:
    - **Healing (0–35)**: Sustained tick, burst team-wide heal, or hybrid healing.
    - **Shields & Interruption Resistance (0–35)**: Super-armor, stagger immunity, shield uptime.
    - **Execution Simplicity (0–20)**: Straightforward cooldowns, flexible sequencing vs strict micro-frame cancellations.
    - **Elemental Synergy (0–10)**: Resonance bonuses (Hydro HP, Pyro ATK, Cryo Crit, Geo DMG).
  - Categorization into `very_high`, `high`, `moderate`, and `fragile`.
  - `explainTeamComfort`: Generates human-readable badges, summary strings, and bulleted advantage/risk breakdowns.

### 4. Statistical Overlap & Anti-False-Precision

- **Principle**: Minor simulation variance should not falsely assert that Team A is definitively superior to Team B when their confidence intervals overlap.
- **Implementation**:
  - `summarizeRuns`: Computes sample standard deviation ($SD$), standard error of the mean ($SE = \frac{SD}{\sqrt{N}}$), and 95% confidence intervals ($DPS \pm 1.96 \cdot SE$).
  - `resolveStatisticalRankings`: Pre-calculates 95% CI error bounds for all evaluated finalists. Detects overlapping confidence intervals ($lower_i \le upper_{i+1} \land lower_{i+1} \le upper_i$) and marks candidate teams as statistical ties.
  - When player preference selects `favorites`, tied candidate groups are reordered by favorite count descending without falsely inflating raw damage.
  - End-to-end integration: `searchTeamCandidates` in `service.ts` routes multi-sample finalists through `resolveStatisticalRankings` with user priority and favorite counts, annotating each result with `isStatisticallyTied` and forwarding `errorMargin` to the UI.

### 5. Two-Phase Bounded Worker Pipeline

- **Phase 1 (Screening)**: Evaluates the bounded candidate pool (capped at 12–48 viable archetype permutations) with fast 1-iteration screening to eliminate uncompetitive rosters without wasting worker thread cycles.
- **Phase 2 (Multi-Sample Verification)**: Runs rigorous multi-iteration simulations (default 10 iterations) on the top 5 DPS candidates and top 3 comfort candidates (`tier === 'comfort_first'` or comfort score $\ge 70$) to produce accurate mean DPS, standard deviation, error margins, and log traces.
- `TeamAutoGenerator.tsx` propagates `candidate.comfort` to `searchTeamCandidates` so defensive finalists are guaranteed simulation in Phase 2.

### 6. Dual-Recommendation UI & Visual Timeline

- **Components**:
  - `TeamRecommendationCard`: Displays archetype badges, primary tag ("Top Tested Damage" vs "Comfortable Alternative"), statistical tie badge ("Statistical Tie"), mean DPS with $\pm$ margin, comfort rating pill, and advantage breakdown.
  - `RotationTimelineView`: Visual horizontal execution sequence displaying each character's portrait, element badge, action type (`Burst`, `Skill`, `Combo`, `Plunge`), and timing markers.
  - Integrated into `TeamAutoGenerator.tsx` with dedicated responsive styles in `team-workspace.css`.

---

## 3. Verification & Benchmark Record

All M3 test suites pass completely with zero failures:

| Test Suite                                           | Focus / Description                                                                           | Tests |   Status   |
| :--------------------------------------------------- | :-------------------------------------------------------------------------------------------- | :---: | :--------: |
| `apps/api/tooling/rotation-kit.test.js`              | Kit retrieval, burst/skill definitions, and safe fallback generation                          |   3   | **PASSED** |
| `apps/api/tooling/rotation-synthesizer.test.js`      | Role-ordered sequencing, buff placement, and bounded candidate synthesis                      |   3   | **PASSED** |
| `apps/api/tooling/team-benchmark.test.js`            | Defensible rotation integration in team benchmark calculation                                 |   4   | **PASSED** |
| `apps/api/tooling/team-comfort.test.js`              | Comfort scoring, gear exclusivity validation, statistical overlap                             |   4   | **PASSED** |
| `apps/api/tooling/team-search-pipeline.test.js`      | 2-phase search pipeline, gear conflict filtering, error margins & statistical tie ranking     |   3   | **PASSED** |
| `apps/api/tooling/team-auto-pool.test.js`            | Auto-generation candidate filtering, driver pool validation                                   |   2   | **PASSED** |
| `apps/api/tooling/uid-teams-client.test.js`          | Section 5 Damage Lab client integration & 5-step backward compatibility                       |  11   | **PASSED** |
| `apps/api/tooling/team-auto-context-client.test.js`  | Team workspace auto-context, recommendation switching, and UI rendering                       |  10   | **PASSED** |
| `apps/api/tooling/m3-benchmarks.integration.test.js` | End-to-end integration: Raiden National, Hu Tao Double Hydro, gear exclusivity & tie-breaking |   3   | **PASSED** |

**Total Tests Passing:** 43/43 across M3 scope.

### Monorepo Health Checks

- **TypeScript Typecheck**:
  - `pnpm --filter @celestia/api run check-types`: 0 errors.
  - `pnpm --filter @celestia/web run check-types`: 0 errors.
  - `pnpm --filter @celestia/api-contracts run check-types`: 0 errors.
- **ESLint**:
  - `pnpm run lint`: Turbo run across 3 packages passed with 0 errors and 0 warnings.
- **Companion Catalog**:
  - `pnpm companion:status`: Verified 126 release entries, 122 Enka snapshots, 7.1/7.2 artifact verified.
