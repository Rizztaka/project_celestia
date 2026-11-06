# Endgame Assignment & Mode Planning Evidence (Milestone 4)

Implemented and verified locally on 2026-11-06 for Milestone 4 (M4) of the [Autonomous Companion Roadmap](implementation_plan.md).

## Executive Summary

Milestone 4 delivers autonomous companion intelligence for Genshin Impact's three premiere endgame modes:

1. **Spiral Abyss**: Joint dual-half optimization ($T_1 \cap T_2 = \emptyset$) maximizing harmonic mean throughput $\text{JointScore}(T_1, T_2) = 2 \cdot \frac{S_1 \cdot S_2}{S_1 + S_2}$ with elemental shield breaking, wave geometry adaptation, and resistance counter-scaling. Eliminates the greedy bottleneck where Half 1 starves Half 2 of critical supports, proving a **+102.7%** harmonic gain in benchmark tests.
2. **Stygian Onslaught**: Consecutive 3-boss clearance optimizer enforcing strict 12-character exclusivity ($T_1 \cap T_2 \cap T_3 = \emptyset$) and matching boss mechanic counters (Corrosion $\to$ sustained healing, Heavy Stagger $\to$ Geo/Blunt interruption, Flying/Mobile $\to$ ranged tracking anti-air).
3. **Imaginarium Theater**: Dynamic Act and Vigor scheduler with backward-chaining boss reserves. Preserves premiere carries for climactic Boss Acts (Acts 3, 6, 8, 10 in Visionary) while simulating forward vigor degradation (2 Vigor/character) to guarantee full 10-Act clearance without early exhaustion.

All engines strictly adhere to ADR-0001 (Modular Monolith), ADR-0011 (Calculator/Explainer separation), and ADR-0012 (Zero mutable calculation state).

---

## Architectural Implementation

### 1. Contracts & Fixtures (`packages/api-contracts` & `apps/api`)

- Defined Zod schemas in `packages/api-contracts/src/genshin/endgame-planning.ts`:
  - `abyssJointRequestSchema` / `abyssJointResponseSchema` (includes `isCurrentCycle`, `isExpired`, `expirationNote`).
  - `onslaughtJointRequestSchema` / `onslaughtJointResponseSchema` (includes `isCurrentCycle`, `isExpired`, `expirationNote`, `hasMechanicGaps`, `unsupportedMechanics`, `gapNotes`).
  - `theaterActPlanRequestSchema` / `theaterActPlanResponseSchema` (includes `isCurrentSeason`, `isExpired`, `expirationNote`, `ineligibleCastExcluded`).
  - Canonical candidate team schemas with character keys, primary elements, and member gear instance IDs.
- Versioned static encounter fixture: `apps/api/src/games/genshin/static/endgame-encounters.json` (version `5.2-1`, non-expired, verified against Floor 12, 3 Onslaught bosses, and Season 2026-11-01 Theater configuration).

### 2. Pure Calculation Engines & Explainers (ADR-0011)

- **Spiral Abyss**:
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/abyss-joint.calculator.ts`
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/abyss-joint.explainer.ts`
  - Enforces canonical Traveler key normalization (`Traveler` across all elements), gear instance exclusivity (`weaponInstanceId`, `artifactInstanceIds`), encounter expiration validation (`evaluateEncounterPackStatus`), and harmonic mean scoring.
- **Stygian Onslaught**:
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.calculator.ts`
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/onslaught-joint.explainer.ts`
  - Generates 3-team disjoint partitions and evaluates 6 assignment permutations per triplet with 3-way harmonic mean scoring. Identifies unmodeled boss mechanics and flags `hasMechanicGaps` with detailed gap notes.
- **Imaginarium Theater**:
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.calculator.ts`
  - `apps/api/src/games/genshin/intelligence/endgame-intelligence/theater-act-planner.explainer.ts`
  - Implements backward-chaining reservation for Boss Acts 3, 6, 8, and 10 and forward greedy act simulation with vigor constraints. Verifies season cast eligibility against allowed elements, opening keys, and guest keys, explaining special guest and borrowed invites.

### 3. Service, Controller & HTTP Routing

- Mounted under `/api/v1/games/genshin/intelligence/endgame/*`:
  - `POST /abyss-joint`
  - `POST /onslaught-joint`
  - `POST /theater-plan`
- Controller enforces `requireAuth`, authenticates user context, and transforms internal Zod validation errors to standardized 400 responses.

### 4. Frontend Modernization & Interactive Views (`apps/web`)

- `apps/web/src/components/endgame/AbyssJointRecommendationView.tsx`: Dual-card side-by-side view with shield counter tags, geometry notes, greedy comparison advantage delta, active vs archived cycle banner, and dynamic candidate team generation from owned roster (`buildCandidateTeamsFromRoster`) with benchmark presets toggle.
- `apps/web/src/components/endgame/OnslaughtMatrixView.tsx`: 3-card horizontal stage matrix with boss mechanics, recommended elements, 12-character exclusivity guarantee, mechanic gap warnings, and dynamic 3-team candidate construction from owned roster with presets toggle.
- `apps/web/src/components/endgame/TheaterActPlannerView.tsx`: 10-Act timeline, live Vigor tracker (2/2, 1/2, 0/2), boss reserve lock indicators, season expiration alerts, special guest/borrow badges, and dynamic qualified cast derived from player's Level 70+ roster characters.
- Updated `apps/web/src/pages/EndgamePage.tsx` with top-level tabs for all three modes and sub-view toggles for intelligence planning vs legacy run logging.

---

## Verification Evidence

### 1. Unit & HTTP Integration Tests

Ran `vitest run src/games/genshin/intelligence/endgame-intelligence`:

- `abyss-joint.test.ts`: **13/13 passed** (shield breaking multipliers, geometry handling, resistance profile adaptation, harmonic mean vs arithmetic mean, strict disjoint gear exclusivity, Traveler normalization, greedy comparison delta, encounter expiration handling).
- `onslaught-joint.test.ts`: **10/10 passed** (3-boss partition, corrosion healer counter, heavy stagger Geo counter, flying anti-air counter, 3-way disjointness, failure on insufficient candidates, unsupported mechanic gap notes).
- `theater-act-planner.test.ts`: **8/8 passed** (10-act Visionary simulation, boss carry reservation, dynamic vigor depletion, vigor exhaustion risk detection, season element verification, historical season draft mode).
- `endgame-intelligence.http.test.ts`: **9/9 passed** (Supertest authenticated HTTP roundtrips, 200 OK responses, 401 Unauthorized guards, 400 validation error formatting).

### 2. End-to-End Benchmarks (`m4-benchmarks.integration.test.js`)

Ran `vitest run tooling/m4-benchmarks.integration.test.js`:

- **Benchmark 1**: Abyss joint solver proves joint pair beats greedy selection (+102.7% throughput advantage).
- **Benchmark 2**: Strict zero character/gear collisions across joint halves.
- **Benchmark 3**: Onslaught 3-boss allocation satisfies strict 12-character exclusivity ($T_1 \cap T_2 \cap T_3 = \emptyset$) and counters all 3 bosses.
- **Benchmark 4**: Theater Act Planner completes 10-Act Visionary draft with zero character exceeding 2 vigor uses.
- **Benchmark 5**: Versioned encounter pack fixture integrity (`5.2-1`, non-expired, Floor 12 chambers, 3 Onslaught stages, 10 Theater acts, active vs expired cycle status verification).
- **Total**: **5/5 benchmarks passed**.

### 3. Combined Endgame Test Suite Summary

- **45/45 tests passed** across 5 test files in 6.41s.
- Zero flaky tests, zero timing dependencies, zero network calls.

### 4. Static Analysis, Types & Production Builds

- `@celestia/api`:
  - `pnpm --filter @celestia/api check-types`: **0 errors**
  - `pnpm --filter @celestia/api lint`: **0 warnings / 0 errors**
  - `pnpm --filter @celestia/api build`: **Succeeded** (TypeScript compilation + tsc-alias + static fixtures copied).
- `@celestia/web`:
  - `pnpm --filter @celestia/web check-types`: **0 errors**
  - `pnpm --filter @celestia/web lint`: **0 warnings / 0 errors**
  - `pnpm --filter @celestia/web build`: **Succeeded** (Vite production bundle built in 1.05s).
- `@celestia/api-contracts`:
  - `pnpm --filter @celestia/api-contracts build`: **Succeeded**.
