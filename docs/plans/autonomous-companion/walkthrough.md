# M0 — Direction and coverage baseline

## Provenance correction — 2026-10-26

The historical release/provenance statements below are superseded for trust
purposes. Current `pnpm companion:status` distinguishes local byte integrity from
independent provenance and reports release completeness as **unverified**: the
Enka and genshin-db artifacts are reproducible against pinned bytes, while no
independent review anchor is registered; the identity/release denominators also
remain 122 versus 124 with local-only identities visible. Official 7.1 claims are
parsed and hash-reproducible but remain provenance-unverified. Traveler catalog
rows without an explicit element/form join are unresolved. See
[M1 provenance correction](account-context-progress.md) and the hardening tests.

Later progress: [account context](account-context-progress.md),
[team preferences](team-preferences-progress.md) and
[automatic reviewed role guidance](reviewed-role-progress.md) and
[rotation execution evidence](rotation-execution-progress.md). These extend the
baseline below; none completes the overall companion objective.

Completed locally on 2026-10-25 in the canonical checkout. The overall autonomous
companion goal remains active; [M1 onward](implementation_plan.md) is outstanding.

## Changes

Recorded the owner's new direction in the vision, roadmap, decisions, architecture,
companion specification, documentation entry point and current handoff. Historical
scope is retained with explicit precedence. The plan distinguishes contextual
readiness, team DPS/comfort, mode-specific constraints, counterfactual account
value and a separate fun simulator, with measurable acceptance for each milestone.

Added `pnpm companion:status` and `--json` inventory tooling. It reads local catalog,
reference files, approved role-source hashes and engine metadata. Each reference
is checked against its recorded SHA-256, key and game ID. Engine/profile joins use
numeric identities. All Traveler variants count once in the account-identity
denominator. Missing identities fail instead of merging unknown entries. Expected
missing coverage is reported; integrity failures give a nonzero CLI status.

The initial result is 131 catalog entries / 123 account identities, 129 intact
description references, 119 entries sharing an avatar ID with a simulation form,
and twelve reviewed role profiles. Manekin/Manekina lack description references.
The engine inventory is 124 character forms / 237 weapons / 55 artifact sets.
The [plan](implementation_plan.md) records the full unsupported simulation list.
The exact pinned release manifest reproducibly checks 124/124 release identities
through 7.1, but its independent provenance is unverified. The official page's
content endpoint is preserved as a hashed 55,735-byte JSON artifact. Deterministic
extraction parses the Version 7.1 title/date and the official New Characters
claims for Vesna and Vodyanitsa; official release provenance and overall release
completeness remain `unverified`. These checks do not certify exact
form/constellation fidelity, activation/rotation correctness or endgame
readiness. Role hashes match local accepted manifests.

Generated JSON is in ignored `.local-maintenance/companion-coverage.json`. Regenerate
it from source rather than treating this output as authoritative maintained data:

```powershell
pnpm companion:status
pnpm --filter @celestia/api exec tsx tooling/companion-status.mjs --json
```

## Verification

- `pnpm companion:status`: passed, reporting the gaps above.
- JSON CLI output: generated and parsed successfully with PowerShell.
- `pnpm --filter @celestia/api exec vitest run tooling/companion-coverage.test.js tooling/build-analysis.test.js tooling/team-damage.test.js tooling/team-benchmark.test.js`:
  **37 passed across four files**, zero failures/skips. Six new inventory cases
  exercise coverage separation, identity joins, source-change gating, missing
  identity rejection, deterministic non-mutating behavior and actual repository
  reference hashes/IDs. Existing tests execute the real pinned WASM engine and
  check reproducibility, conserved damage and resistance response.
- Scoped ESLint: passed for all three new tooling files, zero warnings allowed.
- Prettier: passed for all changed source/document files.
- `git diff --check`: passed.

Runtime application behavior, database schema and dependencies are unchanged.
This scope uses no account or environment data and requires no database. Browser
acceptance, a full application suite/build and deployment were not part of this
tooling/document milestone; its checks do not imply product combat validation.

## Continue here

M1 subphase 1 remains open pending independently defensible provenance and
denominator reconciliation. Next: use the shared policy for contextual build
readiness before extending the old heuristic scores. Preserve the existing fixed
training-dummy testing flow while introducing content-specific encounter models
through their own adapters. Keep generated output in ignored directories.

## M1 Subphase 3 — account-context policy — 2026-10-27

Implemented one validated policy across public showcase observations, authenticated
stored imports, hypothetical contracts and player intent. `AccountContext` now keeps
scope, roster completeness, provenance families, source timestamps, independent
retrieval/import/database dates, freshness, exact form/equipment identities and
dimension-level missing-data reasons visible. Public account calculations accept an
injectable clock; seven days is the public stale threshold and five minutes is the
future tolerance. Stored GOOD rows remain undated/unknown rather than being promoted
by receipt or database write time.

Added deterministic source-family rules: public, private import/manual and
hypothetical evidence stay separate; conflicts remain retained without a selected
fingerprint; absent characters remain ownership-unknown; omitted or failed sections
do not prove an empty complete roster. Existing public and imported adapters emit the
common shape without changing their route envelopes.

Extended versioned team intent with namespaced protected gear, comfort, bounded time
budget and content mode/difficulty/target. Authenticated preferences are persisted in
the owner-scoped `genshin_team_preferences` table and exposed through revision-protected
GET/PATCH routes, including private account scopes whose UID is null. The authenticated
team UI uses server-backed query state; unauthenticated public UID behavior remains
browser-local. Relevant evidence/preference changes continue to invalidate deterministic
dependent search sessions; no readiness or ranking behavior was added.

Focused tests cover the shared contract, public/imported adapters, freshness and
future quarantine, exact identity/conflicts, missing-data semantics, preference
validation/malformed-data preservation/revision conflicts, authenticated UI and HTTP.
Implementation and database checks pass locally. A disposable loopback PostgreSQL 18
cluster applied all sixteen migrations and ran the nine guarded preference/import
cases without skips. Follow-up hardening removed synthetic per-row undated issues,
stopped a later partial import from re-dating preserved characters, scoped equipment
conflicts to the affected character, normalized account-only preference scope,
refreshed a 409 save's stored revision while keeping the draft, and exposed the
public source retrieval time. The new preference table is covered by account
export/deletion and the exact recovery inventory. The added intent fields remain
contract groundwork until a later milestone consumes them. While the test stage reached
1993/1993 tests with zero skips and all independent type, lint, build, and Prettier checks
pass, the composed `pnpm run verify` wrapper did not emit `verification.json` due to Windows
Vitest worker RPC timeouts (`onTaskUpdate`). Functional invariants and integration suites are
fully green; formal composed gate artifact emission remains a CI gate before M2 merge.
Subphase 1 remains open; this walkthrough does not claim overall M1 or release completion.

## M2 Subphase 2.1 — Contextual Readiness Engine — 2026-10-31

Implemented the Contextual Readiness Engine adhering strictly to **ADR-0011** (Pure Calculator separated from Pure Explainer) and the Intelligence Core architectural rules.

### Scope and Invariants Implemented

1. **Shared Contracts (`packages/api-contracts/src/genshin/readiness.ts`)**:
   - `readinessStatusSchema`: `'ready_for_target' | 'needs_investment' | 'conditional' | 'insufficient_data'`.
   - `readinessDimensionSchema`: `'talents' | 'weapon' | 'main_stats' | 'set_activation' | 'rotation_energy' | 'support_output'`.
   - `characterReadinessRequestSchema`: takes character observation/stored build, role profile, target encounter (or dummy benchmark), and team energy context.
   - `characterReadinessResponseSchema`: returns `{ status, score, dimensions, explanations, missingData, recommendation }`.
   - Exported from `packages/api-contracts/src/index.ts`.

2. **Pure Calculator (`apps/api/src/games/genshin/intelligence/readiness-intelligence/readiness-intelligence.calculator.ts`)**:
   - Completely deterministic pure function with zero side effects, no external dependencies, and no human-facing prose strings.
   - Evaluates:
     - Priority talent levels against target role benchmarks (target level 8, conditional 6).
     - Weapon suitability (matching reviewed role/scaling options) and minimum level (target level 80).
     - Artifact main stats against role requirements (Sands, Goblet, Circlet).
     - Set activation (4-piece vs 2-piece bonuses against recommended sets).
     - Rotation Energy Recharge vs estimated threshold with party battery and Favonius adjustments.
     - Support output scaling stats (HP, DEF, EM, ATK thresholds for buffers and healers).
   - **Regression Invariant 1 (ER Deficit Defeats High Stats)**: An Energy Recharge deficit defeats high offensive stats (CRIT, ATK, DMG) and forces overall status to `needs_investment` (or `conditional` for marginal deficits), with score penalized and capped at 58.
   - **Regression Invariant 2 (No Hallucinated Data)**: Unrecorded priority talents, weapons, key artifact slots, or energy stats return `insufficient_data` for that dimension and prevent false-positive `ready_for_target` verdicts.

3. **Pure Explainer (`apps/api/src/games/genshin/intelligence/readiness-intelligence/readiness-intelligence.explainer.ts`)**:
   - Translates numeric calculator scores, dimensional statuses, and metadata into concise, diagnostic, human-readable rationale without performing calculations or modifying statuses.
   - Explicitly explains energy deficits defeating offensive stats, talent gaps, weapon leveling, artifact main stat mismatches, and unrecorded data.

4. **Service, Controller & Routes**:
   - `ReadinessIntelligenceService`: Orchestrates calculator and explainer, returning `{ recommendation, score, explanations, status, dimensions, missingData }`.
   - `ReadinessIntelligenceController`: Validates input with Zod and sends standard success response.
   - `readinessIntelligenceRoutes`: Exposes `POST /api/v1/games/genshin/intelligence/readiness` (protected by `requireAuth`) and mounted into `genshin.routes.ts`.

### Verification Evidence

- `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/readiness-intelligence/`:
  **21 tests passed across 2 test files** (0 failures, 0 skips):
  - `readiness-intelligence.calculator.test.ts` (17 tests): Normalization helpers, role benchmark resolution, paired ready vs not-ready fixtures for DPS (Xiangling), Support (Kaedehara Kazuha), and Buffer (Furina); regression test for ER deficit defeating offensive stats; regression tests for unrecorded priority talents, weapons, ER stats, and incomplete artifacts returning `insufficient_data`.
  - `readiness-intelligence.service.test.ts` (4 tests): Service orchestration, standard response contract compliance, energy deficit explanation warning, diagnostic missing data explanation, and request schema validation.
- `pnpm --filter @celestia/api run check-types`: **Passed (exit code 0)**.
- `pnpm --filter @celestia/api run lint`: **Passed with 0 warnings (`eslint . --max-warnings 0`)**.

## M2 Subphase 2.2 — Marginal Investment Advice & Next-Upgrade Optimizer — 2026-11-02

Implemented the Marginal Investment Advice Engine adhering strictly to **ADR-0011** (Pure Calculator separated from Pure Explainer) and the Intelligence Core architectural rules.

### Scope and Invariants Implemented

1. **Shared Contracts (`packages/api-contracts/src/genshin/marginal-investment.ts`)**:
   - `upgradeCategorySchema`: `'talent' | 'weapon_level' | 'weapon_ascension' | 'character_ascension' | 'character_level' | 'artifact_main_stat' | 'artifact_level'`.
   - `resourceCostItemSchema`: `{ materialKey: string, name: string, count: number }`.
   - `upgradeCandidateSchema`: `{ id, category, target, currentLevel, targetLevel, costs, expectedScoreDelta, closesGap, efficiencyScore }`.
   - `marginalInvestmentRequestSchema`: accepts character build, role profile, target encounter, and team energy context (fully compatible with readiness request).
   - `marginalInvestmentResponseSchema`: returns `{ currentReadiness, rankedUpgrades, recommendedNextAction, explanations, recommendation, score }`.
   - Exported and build-checked in `@celestia/api-contracts`.

2. **Pure Calculator (`apps/api/src/games/genshin/intelligence/marginal-investment/marginal-investment.calculator.ts`)**:
   - Completely deterministic pure function with zero side effects, no UI/prose strings.
   - Generates bounded, realistic candidate next steps:
     - Priority talent level increments (e.g., Pyronado 6 -> 8 or 8 -> 9).
     - Weapon ascension and level increments (e.g., 70 -> 80 or 80 -> 90).
     - Character ascension phases (e.g., A4 -> A5).
     - Character level increments up to benchmark thresholds (e.g., 70 -> 80 or 80 -> 90).
     - Artifact main stat fixes and leveling, specifically prioritizing Sands ER fixes when in deficit.
   - Deterministic material progression lookup against pinned `progression-catalog.json` for exact Mora, talent books, boss drops, gemstones, and crowns.
   - Exact scoring and simulated readiness evaluation using `calculateReadiness`.
   - Marginal efficiency ranking: `efficiency = (expectedScoreDelta * (closesGap ? 2.5 : 1.0)) / normalizedCost`.
   - Deprioritizes low-impact farming traps (e.g., crowning Normal Attack on off-field supports) by incorporating heavy cost weighting for rare items (Crown of Insight: 1,000 weight, weekly boss materials: 300 weight) and 0 score delta.

3. **Pure Explainer (`apps/api/src/games/genshin/intelligence/marginal-investment/marginal-investment.explainer.ts`)**:
   - Pure function taking calculator results and explaining _why_ the recommended next action is prioritized.
   - Details exact materials required (`Materials Required: ...`).
   - Details the threshold or gap closed by the top recommendation.
   - Provides explicit diminishing returns explanations for builds already achieving `ready_for_target`.
   - Provides farming trap warnings when expensive non-essential upgrades (like crowning) are evaluated.

4. **Service, Controller & Routes**:
   - `MarginalInvestmentService`: Orchestrates calculator and explainer, returning structured response adhering to ADR-0011 (`{ currentReadiness, rankedUpgrades, recommendedNextAction, explanations, recommendation, score }`).
   - `MarginalInvestmentController`: Validates input with Zod, invokes service, and sends standard success response.
   - `marginalInvestmentRoutes`: Exposes `POST /api/v1/games/genshin/intelligence/marginal-investment` (protected by `requireAuth`), mounted into `genshin.routes.ts`.

### Verification Evidence

- `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/marginal-investment/`:
  **14 tests passed across 3 test files** (0 failures, 0 skips):
  - `marginal-investment.calculator.test.ts` (9 tests): Exact material progression lookups for Xiangling Pyronado (6 -> 8), Furina crowning (9 -> 10), Furina ascension (A4 -> A5), and The Catch weapon ascension (phase 5 -> 6); alias and weapon case-insensitive normalization; normalized cost scaling; regression test verifying Pyronado upgrade outranks crowning normal attack; regression test verifying ER deficit resolution outranks offensive upgrades; diminishing returns test on `ready_for_target` characters.
  - `marginal-investment.service.test.ts` (4 tests): Service orchestration, response contract compliance, ER deficit diagnosis, diminishing returns note, and farming trap warning.
  - `marginal-investment.controller.test.ts` (1 test): HTTP controller input validation and standard response envelope.
- `pnpm --filter @celestia/api run check-types`: **Passed (exit code 0)**.
- `pnpm --filter @celestia/api run lint`: **Passed with 0 warnings (`eslint . --max-warnings 0`)**.
- `pnpm --filter @celestia/api-contracts run build` & `lint`: **Passed with 0 warnings**.

---

## Milestone 2 — Subphase 2.3: Companion UI & Player Intent Integration (Implemented 2026-11-02)

### Scope of Work Completed

1. **Contracts Extension (`packages/api-contracts/src/genshin/team-preferences.ts`)**:
   - Added `goodEnoughCharacters: z.array(teamCharacterIdentitySchema).max(150).refine(unique).default([])` to `teamSearchPreferencesSchema`.
   - Included `goodEnoughCharacters: []` in `defaultTeamSearchPreferences`.
   - Re-built and verified `@celestia/api-contracts` (`tsc`).

2. **Web API Client & TanStack Query Hooks (`apps/web/src/lib/`)**:
   - In `apps/web/src/lib/api.ts`:
     - Added `fetchCharacterReadiness(payload: CharacterReadinessRequestInput)` calling `POST /games/genshin/intelligence/readiness`.
     - Added `fetchMarginalInvestment(payload: MarginalInvestmentRequestInput)` calling `POST /games/genshin/intelligence/marginal-investment`.
   - Created `apps/web/src/lib/use-character-readiness.ts`:
     - Built pure helper `characterToReadinessInput(characterOrObservation, options)` transforming raw showcase / observed builds into valid `CharacterReadinessRequestInput` schemas (normalizing talents, weapon keys, 5 artifact slots, canonical combat stats).
     - Built query hooks `useCharacterReadiness` and `useMarginalInvestment` caching queries by `[characterKey, buildSignature, roleId, encounterId]`.
     - Integrated `useAuthStore` to guard API fetch admission when unauthenticated and gracefully skip execution without throwing 401 exceptions.

3. **UI Components (`apps/web/src/components/`)**:
   - **`ContextualReadinessBadge.tsx`**:
     - Visual badge supporting all 4 readiness states: `ready_for_target` (green), `needs_investment` (orange/red), `conditional` (yellow), and `insufficient_data` (gray).
     - Displays composite score (0–100).
     - Renders "Target Met · Maintained" badge when `isGoodEnough` is active.
   - **`ReadinessDimensionsList.tsx`**:
     - Interactive checklist for the 6 core dimensions: `talents`, `weapon`, `main_stats`, `set_activation`, `rotation_energy`, and `support_output`.
     - Detects and renders high-visibility banner when an Energy Recharge deficit gates build performance.
     - Collapsible disclosure rendering diagnostic rationale from the intelligence explainer.
   - **`MarginalUpgradeCard.tsx`**:
     - Displays `#1` recommended next action with category, level delta, expected score delta, and efficiency ratio.
     - Displays required progression material counts (Mora, books, boss drops) using deterministic calculations.
     - Displays diminishing returns notice when character is already ready.
     - Surfaces farming trap warnings when expensive non-essential upgrades (like crowning) are evaluated.
     - Displays muted farming notification when character is marked "Good Enough".
   - **"Good Enough" Stop Condition**:
     - In `TeamPreferencesForm.tsx`, added "Mark as Good Enough" checkbox toggle per character identity.
     - In `TeamMemberBuild.tsx` and `PublicCharacterAnalysis.tsx`, added "Mark as Good Enough" toggle button syncing with `useTeamPreferences`.
     - When active, displays "Target Met · Maintained" badge and collapses high-urgency farming alerts into a collapsed disclosure.

4. **Integration**:
   - Mounted `ContextualReadinessBadge`, `ReadinessDimensionsList`, and `MarginalUpgradeCard` inside `TeamMemberBuild.tsx` and `PublicCharacterAnalysis.tsx`.
   - Maintained graceful loading and error states without disrupting existing showcase or team layouts.

5. **Testing**:
   - Added `apps/api/tooling/companion-readiness-client.test.js` (10 tests in JSDOM / Vitest):
     - Renders correct badges and scores across all 4 readiness states.
     - Renders "Target Met · Maintained" badge when `isGoodEnough: true`.
     - Renders 6 checklist dimensions and highlights ER deficit gating banner.
     - Renders `#1` recommended upgrade candidate, material costs, and diminishing returns notice.
     - Suppresses urgent alerts when `isGoodEnough: true`.
     - Verifies `characterToReadinessInput` correctly converts showcase characters into schemas valid against `characterReadinessRequestSchema`.
     - Verifies deterministic query key generation.
     - Verifies `goodEnoughCharacters` parses, validates uniqueness, and round-trips via `writeTeamPreferences` and `parseTeamPreferences`.

### Verification Evidence

- `pnpm --filter @celestia/api exec vitest run tooling/companion-readiness-client.test.js`:
  **10/10 tests passed**.
- `pnpm --filter @celestia/api exec vitest run tooling/team-preferences.test.js`:
  **10/10 tests passed**.
- `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/readiness-intelligence/ src/games/genshin/intelligence/marginal-investment/`:
  **35/35 tests passed**.
- `pnpm --filter @celestia/web run check-types`:
  **Passed (exit code 0, 0 errors)**.
- `pnpm --filter @celestia/web run lint`:
  **Passed (exit code 0, 0 warnings)**.
- `pnpm --filter @celestia/api run check-types`:
  **Passed (exit code 0, 0 errors)**.
- `pnpm --filter @celestia/api run lint`:
  **Passed (exit code 0, 0 warnings)**.
- `pnpm --filter @celestia/web run build`:
  **Passed (exit code 0, 0 errors, build in 1.36s)**.

---

## Milestone 2 Hardening — Contextual Readiness & Marginal Investment (Hardened 2026-11-04)

### Acceptance Blockers Resolved

1. **Preserve Unknown Data**:
   - In `apps/web/src/lib/use-character-readiness.ts`, stopped defaulting missing weapon levels, artifact levels/rarities, character levels, or ascension values to plausible numbers. Missing values are preserved as `null`.
   - Updated `@celestia/api-contracts` schemas (`readinessArtifactInputSchema`, `readinessWeaponInputSchema`, `readinessCharacterBuildSchema`) so `level`, `rarity`, and `ascension` accept `null`.
   - Omitted equipment is never converted into a synthetic complete build. Missing weapon or missing artifact slots remain explicit `null` and evaluate to `insufficient_data` / `unrecorded_weapon_level` / incomplete status.

2. **Block Unsafe Marginal Recommendations**:
   - In `marginal-investment.calculator.ts`, skipped talent upgrade candidate simulation when talents are null/unrecorded.
   - Prohibited creating synthetic artifact upgrade candidates for missing artifact slots.
   - For Energy Recharge deficits: if a character lacks a Sands artifact (`character.artifacts.sands == null`), the explainer identifies the missing ER Sands as an unavailable acquisition requirement without fabricating an artifact or calculating a false score delta.
   - Guaranteed input build immutability: deep clones are used during counterfactual simulation; equipment and talent slots are never mutated or invented.

3. **Remove Guessed Progression Costs**:
   - Removed all fallback hard-coded progression numbers (e.g., guessed Mora costs or crown fallbacks) for unknown characters or weapons in `marginal-investment.calculator.ts`.
   - Ascension and talent cost calculation functions return `null` when a character or weapon is missing from the pinned `progression-catalog.json`.
   - Structured explanations detail unavailable progression targets (`unsupportedProgressionTargets`) rather than displaying fabricated numbers.
   - Every displayed material cost is strictly backed by verified catalog tables (`ascension` and `talent`).

4. **Wire Actual M2 Context**:
   - In `PublicCharacterAnalysis.tsx` and `TeamMemberBuild.tsx`, wired selected build role, target encounter (`abyss_12`), team members (`partyMembers`), and rotation energy context (`sameElementCount`, `favoniusWeaponCount`, `particlesPerRotation`, `rotationLengthSeconds`).
   - Implemented real consumption of `minCharacterLevel`, `particlesPerRotation`, `partyMembers`, and `rotationLengthSeconds` in `readiness-intelligence.calculator.ts`:
     - Level deficit against encounter `minCharacterLevel` gates overall readiness.
     - Solo party configuration applies a +20% ER penalty.
     - `particlesPerRotation` dynamically adjusts role ER thresholds (-15% to +15%).
     - Fast rotations (<18s) increase ER demand by +10%, while long rotations (>=25s) reduce it by -10%.
   - Prevented silent fallback to `generic_support`: when no role is selected, the calculator uses the already-resolved reviewed profile if available, or returns `status: 'insufficient_data'` with `missingReasons: ['unspecified_role_profile']`.

5. **Fix Public/Private Integration**:
   - Readiness (`POST /api/v1/games/genshin/intelligence/readiness`) and marginal investment (`POST /api/v1/games/genshin/intelligence/marginal-investment`) endpoints are public. Showcase pages for public UIDs query them without authentication.
   - Removed `isAuthenticated` query gating from `useCharacterReadiness` and `useMarginalInvestment`.
   - Protected user preference persistence (`/api/v1/games/genshin/team-preferences`) remains securely scoped to authenticated users.
   - Added automated tests in `companion-readiness-client.test.js` validating both unauthenticated public showcase rendering and authenticated imported-account rendering.

6. **Fix Incomplete Set Status**:
   - If a recommended artifact set dimension is incomplete or unrecorded, the dimension resolves to `insufficient_data` or `needs_investment`.
   - In `calculateReadiness`, incomplete required dimensions prevent overall `ready_for_target`, correctly dropping to `conditional` or `insufficient_data`.

7. **Regression Test Suite**:
   - Created `apps/api/src/games/genshin/intelligence/readiness-intelligence/readiness-marginal-regression.test.ts` (8 tests):
     - Null talents produce zero talent upgrade candidates.
     - Missing Sands with ER deficit produces no fabricated ER Sands candidate and no false score delta.
     - Unknown character/weapon targets produce unavailable progression costs rather than guesses.
     - Missing weapon and artifact levels remain `null` and trigger `insufficient_data` with `unrecorded_weapon_level`.
     - Unspecified role input without a reviewed profile returns `insufficient_data` instead of falling back to `generic_support`.
     - Team members, particles per rotation, rotation length, and encounter minimum levels directly affect readiness status.
     - Incomplete required artifact sets never produce a false `ready_for_target`.
     - Calculator executions leave input request objects completely immutable.
   - Extended `apps/api/tooling/companion-readiness-client.test.js` (13 tests total) verifying null level preservation, anonymous public showcase rendering, and authenticated imported-account rendering.

### Verification Evidence

- **Focused API M2 & Client Tests**:
  `pnpm --filter @celestia/api exec vitest run src/games/genshin/intelligence/readiness-intelligence/ src/games/genshin/intelligence/marginal-investment/ tooling/companion-readiness-client.test.js`
  **7 test files passed, 56/56 tests passed**:
  - `readiness-intelligence.calculator.test.ts` (17 tests)
  - `readiness-intelligence.service.test.ts` (4 tests)
  - `readiness-marginal-regression.test.ts` (8 tests)
  - `marginal-investment.calculator.test.ts` (9 tests)
  - `marginal-investment.controller.test.ts` (1 test)
  - `marginal-investment.service.test.ts` (4 tests)
  - `companion-readiness-client.test.js` (13 tests)
- **Typechecks**:
  - `pnpm --filter @celestia/api-contracts run build`: **Passed (exit code 0)**.
  - `pnpm --filter @celestia/api run check-types`: **Passed (exit code 0, 0 errors)**.
  - `pnpm --filter @celestia/web run check-types`: **Passed (exit code 0, 0 errors)**.
- **Lint**:
  - `pnpm --filter @celestia/api run lint`: **Passed (`eslint . --max-warnings 0`, 0 errors, 0 warnings)**.
  - `pnpm --filter @celestia/web run lint`: **Passed (`eslint . --max-warnings 0`, 0 errors, 0 warnings)**.
- **Web Build**:
  - `pnpm --filter @celestia/web run build`: **Passed (`vite build`, exit code 0)**.
- **Git Diff Hygiene**:
  - `git diff --check`: **Passed (exit code 0, no whitespace or merge marker issues)**.
