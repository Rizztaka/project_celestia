# Companion Orchestration & Fictional Wish Sandbox Evidence (Milestone 6)

Implemented and verified locally on 2026-11-07 for Milestone 6 (M6) of the [Autonomous Endgame Companion Roadmap](file:///d:/Genshin%20Personal/project-celestia/docs/ROADMAP.md).

## Executive Summary

Milestone 6 delivers the final two cornerstone requirements of the Autonomous Endgame Companion architecture:

1. **Pillar 1: Fictional Wish Sandbox Restoration**
   - Restores a dedicated, client-persisted gacha simulator strictly isolated from account wish savings, ownership, and user goals.
   - Features pure state transitions with shared 5★/4★ character pity, 50/50 guarantees, weapon banner Fate Point lifecycle (clearing on target changes or scenario transitions), and chronicled wish pooling.
   - Implements bounded LocalStorage persistence (`celestia_wish_sandbox_session_v1`) with 200-pull FIFO history truncation and cumulative statistics tracking.
   - Delivers interactive UI (`WishSandboxView.tsx`, `WishItemCard.tsx`, `WishHistoryDrawer.tsx`) with 1x/10x pull animations, banner scenario selection, custom pity overrides, and public showcase routing (`/simulators` in `GuestWorkspace`, `/u/:uid/simulators` in `UidWorkspace`, and `/simulators` in authenticated `CompanionLayout`).

2. **Pillar 2: Autonomous Companion Orchestration & Next-Action Dashboard**
   - Composes the intelligence engines from M2 (Readiness & Marginal Investment), M3 (Teams & Rotations), M4 (Endgame Joint Allocation), and M5 (Account-Value Pulls) into a unified, deterministic next-action recommendation engine.
   - Cross-references marginal investment candidates with today's rotating talent/weapon domain schedule (`domainSchedule.json`) to elevate `FARMING_AVAILABLE` actions when materials are actively drop-accessible today.
   - Integrates M3 defensible team suggestions (`teamSuggestionSnapshotSchema`) with automatic core roster synthesis and dedicated card visualization.
   - Preserves public UID workspace isolation: `UidDashboardPage.tsx` operates offline on cached showcase queries without unexpected network fetches.
   - Provides honest degradation for public showcase UIDs (`isPartialAccount = true`) with transparent caveats for unobserved characters.
   - Delivers a prominent hero card (`NextActionSummaryCard.tsx`) with category badging and progressive disclosure explanations, accompanied by a 5-card status matrix (`CompanionSummaryGrid.tsx`).
   - Implements reactive cache invalidation (`use-companion-summary.ts`) on account imports and preference updates.

---

## Architectural Implementation

### 1. Fictional Wish Sandbox Architecture (Client-Side Isolation)

- **Pure State Machine** (`apps/web/src/lib/wish-sandbox-session.ts`):
  - `createInitialWishSandboxSession`: Initializes default session with versioning and empty pity pools.
  - `getActivePityForBanner`: Extracts relevant pity pool (character, weapon, chronicled) based on banner type.
  - `buildSandboxPullRequest`: Prepares simulation request ensuring pity counters do not exceed hard pity boundaries.
  - `applyWishResultToSession`: Pure reducer appending new pulls, prepending 5-star milestones, updating pity/guarantees, and capping history to $\le 200$ items.
  - `setBannerScenario`: Switches active scenario and cleanly clears weapon/chronicled Fate Points if moving across pools.
  - `setPathTarget`: Updates weapon/chronicled epitomized path target, resetting accumulated Fate Points to 0 upon target switch.
  - `updatePityOverrides`: Allows travelers to manually test custom pity/guarantee states.
  - `saveWishSandboxSession` / `loadWishSandboxSession`: Safe LocalStorage I/O with JSON corruption recovery.

- **Sandbox UI Components** (`apps/web/src/components/simulators/`):
  - `WishItemCard.tsx`: Pull card rendering with 5★ gold glow, 4★ purple styling, 3★ fallback, weapon/character indicators, and `Featured` badges.
  - `WishHistoryDrawer.tsx`: History modal with aggregate 5★/4★ pull rates, pity counts, and filterable recent pulls.
  - `WishSandboxView.tsx`: Full interactive workbench with banner scenario dropdown, path selector, custom pity drawer, pull buttons, and explicit fictional disclaimers.
  - `SimulatorsPage.tsx` & `UidSimulatorsPage.tsx`: Top-level route wrappers for authenticated travelers and showcase visitors.

### 2. Orchestration Engine Architecture (Backend Contracts & Service)

- **API Contracts** (`packages/api-contracts/src/genshin/companion-summary.ts`):
  - `companionSummaryPrimaryActionSchema`: Category (`FARMING_AVAILABLE`, `BUILD_INVESTMENT`, `ENDGAME_READINESS`, `PULL_STRATEGY`), priority, headline, subtext, targetRoute.
  - `readyBuildSummaryItemSchema`: Evaluated readiness score, role, status.
  - `topMarginalUpgradeSummarySchema`: Efficiency score, action detail, `todayDomainAvailable`, and domain family.
  - `endgameStatusSnapshotSchema`: Abyss score, readiness boolean, Onslaught status, Theater acts estimated.
  - `companionSummaryResponseSchema`: Complete dashboard payload with contract version, timestamp, account scope, and missing data caveats.

- **Pure Calculator & Explainer** (ADR-0011):
  - `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.calculator.ts`: Synthesizes inputs into deterministic priority rankings. Prioritizes active farming domains first, followed by high-ROI marginal investments, endgame bottlenecks, and high-value pull recommendations.
  - `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.explainer.ts`: Generates plain-English narrative bullet points explaining today's focus, encounter thresholds, drop schedules, endgame bottlenecks, and wish recommendations.

- **Companion Summary Service & Routes**:
  - `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.service.ts`: Orchestrates M2–M5 services in parallel:
    - M2 Character Readiness & Marginal Investment via `ReadinessIntelligenceService` and `MarginalInvestmentService`.
    - M3 Team Lineup via `TeamIntelligenceService` (extracting top buildable meta templates and defensible rotations).
    - M4 Endgame Joint Allocation via `EndgameIntelligenceService` (estimating Abyss harmonic clearance and Theater act capacity).
    - M5 Pull Intelligence via `PullIntelligenceService` (assessing active banner account-value).
  - Correlates candidate material keys with server-date rotating domain drops from `domainSchedule.json`.
  - Mounted at `/api/v1/games/genshin/intelligence/summary` (authenticated) and `/api/v1/games/genshin/public/uid/:uid/intelligence/summary` (public showcase).

### 3. Dashboard Frontend Integration

- **TanStack Query Hook** (`apps/web/src/lib/use-companion-summary.ts`):
  - Provides `useCompanionSummary(uid?)` with 5-minute stale time.
  - Safely separates authenticated queries from public showcase queries using explicit `isPublic` gates.
  - Automatically participates in `invalidateIntentQueries(client)` on import or account changes.

- **Dashboard UI Presentation** (`apps/web/src/components/dashboard/`):
  - `NextActionSummaryCard.tsx`: Hero card with category color badge, actionable headline, primary action button linking directly to target workflow, interactive "Why this focus?" rationale drawer, and a direct "↻ Refresh" advice trigger.
  - `CompanionSummaryGrid.tsx`: 5-card responsive matrix displaying Ready Builds (M2), Top Upgrades with "Drop Today" badge (M2), Team Lineup (M3), Endgame Center (M4), and Wish Advisor (M5).
  - Integrated into `DashboardPage.tsx` (the authenticated companion home), while preserving the zero-unbudgeted-network cache contract of `UidDashboardPage.tsx`.

---

## Verification & Quality Gates

### 1. Test Suite Coverage

- **Wish Sandbox Unit Tests** (`apps/api/tooling/wish-sandbox-session.test.js`):
  - 14 tests verifying initial state, pity sharing across character banners, independent weapon pity, Fate Point reset on path switch, bounded 200-pull FIFO retention, and storage corruption recovery.
  - Output: `✓ tooling/wish-sandbox-session.test.js (14 tests) 12ms`.

- **Companion Summary Unit Tests** (`apps/api/src/games/genshin/intelligence/companion-summary/`):
  - `companion-summary.calculator.test.ts` (8 tests): Open domain prioritization, endgame fallback, pull advice elevation, team lineup synthesis, empty roster safety.
  - `companion-summary.service.test.ts` (4 tests): Authenticated and public showcase synthesis, team recommendation integration, server domain date alignment.
  - `companion-summary.http.test.ts` (4 tests): Express route validation, unauthenticated 401, public showcase 200.
  - Output: `✓ 16 passed in 73ms`.

- **M6 Integration Benchmarks** (`apps/api/tooling/m6-benchmarks.integration.test.js`):
  - Benchmark 1: Synthesizes readiness, marginal investment, and domain schedule into `FARMING_AVAILABLE` action.
  - Benchmark 2: Prioritizes `ENDGAME_READINESS` when no urgent upgrades are open today and Abyss is bottlenecked.
  - Benchmark 3: Prioritizes `PULL_STRATEGY` when account is endgame-ready with a `HIGH_ACCOUNT_VALUE` recommendation and verifies team suggestions.
  - Benchmark 4: Handles safe degradation for empty roster and partial public showcase data with caveats.
  - Benchmark 5: Sub-100ms execution latency benchmark across 100 consecutive synthesis calculations (**3ms total, 0.03ms per iteration**).
  - Benchmark 6: Fictional wish sandbox state machine transitions and complete isolation from account data.
  - Output: `✓ tooling/m6-benchmarks.integration.test.js (6 tests) 23ms`.

### 2. Monorepo Quality Gates Summary

| Gate | Command | Result |
| :--- | :--- | :--- |
| **API Contracts Build** | `pnpm --filter @celestia/api-contracts run build` | **PASSED** (0 errors) |
| **API Typecheck** | `pnpm --filter @celestia/api run check-types` | **PASSED** (`tsc --noEmit`, 0 errors) |
| **Web Typecheck** | `pnpm --filter @celestia/web run check-types` | **PASSED** (`tsc -b`, 0 errors) |
| **API ESLint** | `pnpm --filter @celestia/api run lint` | **PASSED** (`--max-warnings 0`) |
| **Web ESLint** | `pnpm --filter @celestia/web run lint` | **PASSED** (`--max-warnings 0`) |
| **Production Web Build** | `pnpm --filter @celestia/web run build` | **PASSED** (Built in 738ms) |
| **Git Diff Check** | `git diff --check` | **PASSED** (0 whitespace/formatting errors) |
| **M6 Test Suite (36 tests)** | `vitest run ...` | **PASSED** (36/36 passing across 5 suites) |
