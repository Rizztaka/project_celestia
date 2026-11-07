# Account-Value Pulls & Counterfactual Comparisons Evidence (Milestone 5)

Implemented and verified locally on 2026-11-07 for Milestone 5 (M5) of the [Autonomous Companion Roadmap](file:///d:/Genshin%20Personal/project-celestia/docs/ROADMAP.md).

## Executive Summary

Milestone 5 delivers autonomous companion intelligence for wish spending and banner investments. It comprehensively replaces the legacy Milestone 4E heuristic pull engine (which used dogmatic `MUST_PULL`, `GOOD_VALUE`, `SKIP` labels, suffered from a binary ownership penalty setting the score to 0 for owned characters, and treated unobserved characters in showcases as unowned) with an explainable multi-objective counterfactual comparison engine:

1. **Counterfactual Simulation Engine**: Evaluates an account before and after acquiring a candidate target ($A$ vs. $A \cup \{T\}$), quantifying true marginal account impact $\Delta_{\text{endgame}}$, archetype flexibility $V_{\text{flex}}$, elemental redundancy $R_{\text{redundancy}}$, execution comfort $\Delta_{\text{comfort}}$, and favorite synergy.
2. **Constellation & Signature Weapon Progression**: Evaluates incremental progression ($C_0 \to C_1 \dots C_6$ and $W_1$) using curated k-factor benchmarks and zero leveling investment friction for owned units, replacing the old "owned $\implies$ score 0" flaw.
3. **Absorbing Markov Chain Wish Budget Integration**: Evaluates current wish reserves (Primogems, Intertwined Fates, pity counter, and 50/50 guarantee) using absorbing Markov chain state transitions to derive exact acquisition probabilities, median pulls needed, and risk-aware savings advice (`SAVE_RECOMMENDED` when budget is insufficient to pull with acceptable confidence).
4. **Honest Partial-Data Guards**: Explicitly flags public Enka/showcase accounts (`isPartialAccount = true`) with `CONDITIONAL_DATA_GAP` and actionable missing data caveats rather than falsely assuming unobserved characters are unowned.
5. **Interactive Weight Sliders & Custom Simulation**: Allows travelers to personalize their priority weighting across Endgame Coverage, Support Flexibility, Execution Comfort, and Favorite Synergy, as well as test hypothetical counterfactual scenarios on any unowned or constellation pull.

All engines strictly adhere to ADR-0001 (Modular Monolith), ADR-0011 (Pure Calculator & Explainer separation), and ADR-0012 (Zero mutable calculation state).

---

## Architectural Implementation

### 1. Contracts & Fixtures (`packages/api-contracts` & `apps/api`)

- Defined Zod schemas in `packages/api-contracts/src/genshin/pull-intelligence.ts`:
  - `pullTargetModeSchema`: `'c0_unlock' | 'constellation' | 'signature_weapon'`.
  - `pullUserWeightsSchema`: normalized weights for Endgame, Flexibility, Comfort, and Favorites.
  - `pullBudgetInputSchema`: Primogems, Fates, current Pity (0–89), Guaranteed flag.
  - `accountValueBreakdownSchema`: mathematical sub-scores including $\Delta_{\text{endgame}}$, $V_{\text{flex}}$, $R_{\text{redundancy}}$, $\Delta_{\text{comfort}}$, favorite synergy, and investment friction.
  - `strategicRecommendationSchema`: `'HIGH_ACCOUNT_VALUE' | 'MODERATE_UPGRADE' | 'NICHE_OR_REDUNDANT' | 'SAVE_RECOMMENDED' | 'CONDITIONAL_DATA_GAP'`.
  - `pullBudgetForecastSchema`: acquisition probability, median pulls needed, hard pity, and savings advice.
  - `pullRecommendationSchema`: complete target breakdown, banner info, and explanation strings.
  - `pullIntelligenceResponseSchema`: authenticated active recommendations.
  - `pullCompareRequestSchema` / `pullCompareResponseSchema`: arbitrary hypothetical comparison input and result.
- Static data fixtures:
  - `apps/api/src/games/genshin/static/active-banners.json`: unexpired banner scenarios (Mavuika, Citlali, Xilonen, and Signature Weapon banners).
  - `apps/api/src/games/genshin/static/constellation-benchmarks.json`: curated constellation multipliers (Hu Tao C1, Furina C1–C2, Raiden C2, Nahida C2, Neuvillette C1, Yelan C1–C2, Kazuha C2, Zhongli C2, Xilonen C2).
  - `apps/api/src/games/genshin/static/team-templates.json`: updated candidate pools with Xilonen, Mavuika, and Citlali across relevant archetypes.

### 2. Pure Calculation Engines & Explainers (ADR-0011)

- **Pure Calculator** (`apps/api/src/games/genshin/intelligence/pull-intelligence/pull-intelligence.calculator.ts`):
  - `calculatePullProbability(pulls, pity, guaranteed, isWeapon)`: Markov chain binomial distribution approximation with soft-pity scaling (starting at pull 74 for characters, 63 for weapons) and hard-pity absorption (90/180 or 80/160).
  - `calculateArchetypeFlexibility(targetKey, templates)`: counts unique viable archetypes (Vaporize, Melt, Quicken, Hyperbloom, Freeze, Electrocharged, Overload, Swirl, Geo) unlocked or supported by target ($V_{\text{flex}} = \min(100, N_{\text{archetypes}} \times 25)$).
  - `calculateRedundancyPenalty(targetKey, roster, templates, elements)`: detects on-field DPS overlap within the same element, penalizing 20 points per already-built same-element carry ($R_{\text{redundancy}} \le 40$), while supports and off-field sub-DPS incur 0 redundancy.
  - `estimateComfortImpact(targetKey, targetType, mode, constellationComfortBoost)`: integrates shielding, interruption resistance, sustained party healing, and stamina reduction multipliers into a 0–100 comfort score.
  - `calculateFavoriteSynergy(targetKey, favorites, templates, topInvestedKeys)`: assesses synergy with user favorites or top-invested characters sharing high-compatibility roles.
  - `evaluateCounterfactualAddition(params)`: full counterfactual evaluator synthesizing all sub-scores, subtracting marginal investment friction (0 for constellations, 6 for weapons, 14 for new characters), and computing the final `accountValueScore` and `strategicRecommendation`.
- **Pure Explainer** (`apps/api/src/games/genshin/intelligence/pull-intelligence/pull-intelligence.explainer.ts`):
  - Produces human-readable, educational narratives detailing exact reasons for the verdict, unlocked archetypes, redundant carries with character names, comfort benefits, constellation milestones, and wish budget risks.

### 3. Service, Controller & HTTP Routing

- `pull-intelligence.service.ts`:
  - `getRecommendations(userId, options)`: fetches user roster, team preferences, and Character Intelligence rankings, then evaluates all active banners.
  - `getPublicShowcaseRecommendations(uid, options)`: resolves public showcase snapshot via `ShowcaseService.lookup(uid)`, flags partial data, and evaluates active banners with explicit gap caveats.
  - `compareCustomHypothetical(userId, request)`: simulates any custom hypothetical character, constellation, or weapon.
- `pull-intelligence.controller.ts`: validates requests with Zod schemas and returns standard `{ success: true, data: { ... } }` envelopes.
- `pull-intelligence.routes.ts`:
  - `GET /api/v1/games/genshin/intelligence/pulls` (authenticated user recommendations)
  - `POST /api/v1/games/genshin/intelligence/pulls/compare` (custom counterfactual comparison)
  - `GET /api/v1/games/genshin/public/uid/:uid/intelligence/pulls` (public showcase evaluation)

### 4. Frontend UI Views (`apps/web`)

- `apps/web/src/lib/api.ts`: API clients with error handling and typing.
- `apps/web/src/components/pulls/PullPreferenceSliders.tsx`:
  - Interactive slider controls for Endgame Coverage, Support Flexibility, Execution Comfort, and Favorite Synergy with presets.
  - Wish budget inputs (Primogems, Intertwined Fates, Pity counter, Guaranteed 50/50 checkbox).
- `apps/web/src/components/pulls/AccountValuePullsView.tsx`:
  - Strategic verdict badges (`HIGH_ACCOUNT_VALUE`, `MODERATE_UPGRADE`, `NICHE_OR_REDUNDANT`, `SAVE_RECOMMENDED`, `CONDITIONAL_DATA_GAP`).
  - Account value score meter (0–100) with dynamic element-colored gradients.
  - Dimension breakdown pills ($\Delta_{\text{endgame}}$, $V_{\text{flex}}$, $R_{\text{redundancy}}$, $\Delta_{\text{comfort}}$, $I_{\text{friction}}$).
  - Redundancy warnings naming existing on-field carries.
  - Wish budget forecast pill showing acquisition probability and savings advice.
  - Interactive per-card mode switcher (C0 Unlock vs Constellation C1–C6 vs Signature Weapon) triggering real-time counterfactual comparisons via `compareHypotheticalPull`.
  - Expandable/collapsible pure explainer narratives.
  - Interactive "Simulate Custom Counterfactual Pull" workbench testing arbitrary characters or weapons.
- `apps/web/src/pages/IntelligencePage.tsx`: Integrated via `AccessibleTabs` switcher between "Character Development" (M2) and "Account-Value Pulls" (M5).
- `apps/web/src/pages/UidPullsPage.tsx`, `UidWorkspace.tsx`, `DashboardWelcome.tsx`: Public UID showcase navigation (`/u/:uid/pulls`) with verified partial-account badges.

---

## Verification Evidence

### 1. Unit & HTTP Integration Tests (`apps/api`)

Ran `vitest run src/games/genshin/intelligence/pull-intelligence`:

- `pull-intelligence.calculator.test.ts`: **7/7 passed** (probability accuracy, archetype flexibility scoring, redundant on-field carry penalty, constellation non-zero value, versatile support over redundant DPS, weapon signature scoring, comfort impact).
- `pull-intelligence.service.test.ts`: **4/4 passed** (full recommendations flow, user custom weight application, public showcase partial data flagging, custom hypothetical counterfactual evaluation).
- `pull-intelligence.http.test.ts`: **6/6 passed** (Supertest HTTP roundtrips, 200 OK responses, 401 Unauthorized protection on private routes, 400 validation error handling, public showcase route without auth).
- **Total**: **17/17 tests passed**.

### 2. End-to-End Benchmarks (`tooling/m5-benchmarks.integration.test.js`)

Ran `vitest run tooling/m5-benchmarks.integration.test.js`:

- **Benchmark 1**: Flexible universal support (Xilonen) strictly outranks redundant on-field DPS (Yoimiya) on an account with built Pyro carries (Hu Tao, Arlecchino). Redundancy penalty correctly identifies existing carries and assigns `NICHE_OR_REDUNDANT`.
- **Benchmark 2**: Constellation progression (Hu Tao C1) evaluates positive incremental value ($\ge 40$) with 0 leveling friction, replacing the legacy 0 / SKIP flaw.
- **Benchmark 3**: User priority weights visibly alter rankings (Zhongli comfort-weighted score strictly beats DPS-weighted score).
- **Benchmark 4**: Partial public showcase account produces `CONDITIONAL_DATA_GAP` with explicit missing data notes and caveats.
- **Benchmark 5**: Budget and pity integration accurately advises `SAVE_RECOMMENDED` on low-budget, low-probability scenarios.
- **Total**: **5/5 benchmarks passed in 6ms**.

### 3. Full Monorepo Type Check, Lint & Build Gates

- `@celestia/api-contracts`: build exit code 0.
- `@celestia/api`:
  - `pnpm --filter @celestia/api check-types`: **0 errors** (exit code 0).
  - `pnpm --filter @celestia/api lint`: **0 warnings, 0 errors** (exit code 0).
- `@celestia/web`:
  - `pnpm --filter @celestia/web check-types`: **0 errors** (exit code 0).
  - `pnpm --filter @celestia/web lint`: **0 warnings, 0 errors** (exit code 0).
  - `pnpm --filter @celestia/web build`: **built production bundle in 569ms** (exit code 0).
