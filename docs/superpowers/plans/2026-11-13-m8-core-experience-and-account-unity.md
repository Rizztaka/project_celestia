# M8 — Core Experience & Account Unity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform Project Celestia into an indispensable Genshin companion by solving the four core product review challenges: unifying the account connection experience around zero-friction UID showcase refresh, elevating "Today" into the undeniable single heart of the application, surfacing explicit data-trust and provenance boundaries, and categorizing intelligence into transparent epistemological layers (Game Rules vs. GCSim Simulations vs. Heuristic Comfort).

**Architecture:** Extend Project Celestia's Modular Monolith and ADR-0011 (Calculator/Explainer separation).

1. **Frontend Experience Alignment**: Mount the full companion intelligence suite (`NextActionSummaryCard` and `CompanionSummaryGrid`) on `UidDashboardPage.tsx` using `useCompanionSummary(uid)`, granting instant zero-friction value to public UID visitors.
2. **Account Sync Transparency**: Replace overwhelming raw debug data dumps with a calm `AccountSyncCard` displaying source, freshness, observed scope, and change diffs, with raw technical data collapsed in an inspectable disclosure.
3. **Epistemological Layering**: Update `companion-summary.explainer.ts` and `NextActionSummaryCard.tsx` to tag every synthesized reasoning bullet with its evidence tier: `[Game Rule]`, `[Simulated]`, or `[Comfort & Goals]`.
4. **Security & Connection Consolidation**: Formally deprecate manual session-cookie pasting via ADR-0012, enshrining UID Enka as primary zero-friction onboarding, GOOD JSON as complete offline inventory, and browser extension as optional developer-only tooling.

**Tech Stack:** TypeScript 5, React 19, TanStack Query, Tailwind CSS, Express 5, Prisma 7, PostgreSQL, Vitest 3, gcsim v2.47.2 (WASM).

**Spec:** [Project Celestia Product Review & Action Plan](file:///d:/Genshin%20Personal/project-celestia/docs/plans/CURRENT_HANDOFF.md)

---

## Global Constraints

- **Modular Monolith**: Game intelligence logic lives strictly under `apps/api/src/games/genshin/intelligence/`. Platform auth/users never hold Genshin kit logic.
- **ADR-0011 Strictness**: Separate pure calculations (zero prose, deterministic math) from explainers (pure formatting/translation, zero business decisions).
- **UID-First Zero Friction**: Any visitor entering a 9-digit UID must immediately receive their primary recommended action, simulation insights, and daily domain schedule without requiring an account, password, extension, or cookie.
- **Truth in Simulation & Epistemology**: Every reasoning point in `NextActionSummaryCard` must declare its evidence source: `[Game Rule]`, `[Simulated]`, or `[Comfort & Goals]`. Heuristics must never masquerade as GCSim simulation results.
- **Fail-Closed Data Trust**: Missing showcase characters/inventory must remain tagged `inventoryStatus: 'unknown'` rather than assumed 0. Stale observations must carry visible `stale` warnings.
- **Security & Account Safety**: Manual cookie pasting is permanently banned. Credentials and session cookies must never be requested in form fields or stored in plaintext.

---

## Review Focus

1. **Public UID Dashboard Parity**: Ensure `UidDashboardPage.tsx` loads and displays `NextActionSummaryCard` and `CompanionSummaryGrid` via `fetchPublicCompanionSummary(uid)` without crashing on partial showcase context.
2. **Epistemological Layer Attribution**: Ensure `companion-summary.explainer.ts` prefixes or tags each rationale point with its appropriate evidentiary category (`[Game Rule]`, `[Simulated]`, `[Comfort & Goals]`).
3. **Sync Card Calmness vs Debug Exposure**: Ensure `AccountSyncCard.tsx` displays high-level status (Last synced, source, entries count, changes) without vomiting 18 raw tables unless explicitly expanded.
4. **Unknown vs Zero Boundary Enforcement**: Ensure public showcase mode clearly communicates that unshowcased roster units and unequipped inventory are unknown, not missing.
5. **Full Gate Compliance**: Web typecheck, lint, build, API unit/integration tests, and repository format must pass with 0 errors and 0 warnings.

---

### Task 1: Public UID Dashboard Parity & Hero Integration

**Files:**

- Modify: `apps/web/src/pages/UidDashboardPage.tsx`
- Modify: `apps/web/src/components/dashboard/NextActionSummaryCard.tsx`
- Test: `apps/web/src/pages/UidDashboardPage.test.tsx` (or API contract test `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.http.test.ts`)

**Interfaces:**

- Consumes: `useCompanionSummary(uid)` from `apps/web/src/lib/use-companion-summary.ts`.
- Produces: Complete Today experience on `/u/:uid` including `NextActionSummaryCard`, `CompanionSummaryGrid`, and roster-filtered `TodayDomains`.

- [ ] **Step 1: Write test proving public companion summary is fetched and consumed**
      Verify in `companion-summary.http.test.ts` that `GET /public/uid/:uid/intelligence/summary` returns valid `CompanionSummaryResponse` conforming to schema with `isPartialAccount: true`.

- [ ] **Step 2: Update `UidDashboardPage.tsx` to render the companion intelligence suite**
      Wire `const { summary, refetch, isFetching } = useCompanionSummary(uid);` into `UidDashboardPage.tsx`. Render `NextActionSummaryCard` as the hero, followed by `CompanionSummaryGrid`, and then `TodayDomains`.

- [ ] **Step 3: Verify web typecheck and build**
      Run: `pnpm --filter @celestia/web check-types`
      Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/web/src/pages/UidDashboardPage.tsx apps/web/src/components/dashboard/NextActionSummaryCard.tsx
  git commit -m "feat(today): bring companion summary hero and intelligence grid to public uid dashboard"
  ```

---

### Task 2: Calm Account Sync & Freshness Card

**Files:**

- Create: `apps/web/src/components/dashboard/AccountSyncCard.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`
- Modify: `apps/web/src/pages/UidDashboardPage.tsx`
- Modify: `apps/web/src/styles/companion.css`

**Interfaces:**

- Consumes: `AccountContextFreshness`, `scope`, `rosterScope` from `CompanionSummaryResponse` or `ImportStatus`.
- Produces: Calm, informative status card answering: What was updated? What changed? Is data current? What should I do next? Raw data inspectable via collapsed `<details>`.

- [ ] **Step 1: Create `AccountSyncCard.tsx`**
      Implement component accepting `{ summary?: CompanionSummaryResponse; importStatus?: ImportStatus; uid?: string; onRefresh?: () => void; isRefreshing?: boolean }`.
      Display:
  - Source pill (`Enka.Network Showcase` or `GOOD Import`).
  - Freshness timestamp and relative age (`Updated 12m ago`).
  - Scope badge (`Showcase (8 characters observed)` or `Full Account (54 characters, 1,200 materials)`).
  - Collapsible `<details>` section for technical diagnostics (raw counts, depot IDs, missing dimensions).

- [ ] **Step 2: Integrate `AccountSyncCard` into `DashboardPage.tsx` and `UidDashboardPage.tsx`**
      Replace verbose debug status with the calm `AccountSyncCard`.

- [ ] **Step 3: Verify web typecheck and lint**
      Run: `pnpm --filter @celestia/web check-types && pnpm --filter @celestia/web lint`
      Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 4: Commit**
  ```bash
  git add apps/web/src/components/dashboard/AccountSyncCard.tsx apps/web/src/pages/DashboardPage.tsx apps/web/src/pages/UidDashboardPage.tsx apps/web/src/styles/companion.css
  git commit -m "feat(ui): add calm AccountSyncCard replacing raw debug tables"
  ```

---

### Task 3: Epistemological Layer Attribution in Explanations (ADR-0011)

**Files:**

- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.explainer.ts`
- Modify: `apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.explainer.test.ts`
- Modify: `apps/web/src/components/dashboard/NextActionSummaryCard.tsx`

**Interfaces:**

- Consumes: Evaluated optimization actions, simulation DPS deltas, domain drop schedules.
- Produces: `narrativeOverview` points tagged with explicit prefixes:
  - `[Game Rule]` for domain weekday schedules, talent book tiers, and level caps.
  - `[Simulated]` for GCSim 20s rotation DPS, damage deltas, and sample iterations.
  - `[Comfort & Goals]` for energy sufficiency, defensive shield/heal ratings, and player favorites.

- [ ] **Step 1: Write failing test for layer tagging in `companion-summary.explainer.test.ts`**
      Assert that explanation strings in `narrativeOverview` start with or include their epistemological layer tag (`[Game Rule]`, `[Simulated]`, or `[Comfort & Goals]`).

- [ ] **Step 2: Update `companion-summary.explainer.ts` to attach layer tags**
      Implement deterministic layer assignment based on the source fact:
  - Domain schedule / weekday matches -> `[Game Rule]`
  - Real GCSim simulation ranking / DPS delta -> `[Simulated]`
  - Bottlenecks, favorites, ER thresholds -> `[Comfort & Goals]`

- [ ] **Step 3: Update `NextActionSummaryCard.tsx` to render layer badges**
      Parse and display distinct color-coded badges for `[Game Rule]` (emerald), `[Simulated]` (cyan), and `[Comfort & Goals]` (indigo) in the "Why this focus?" rationale drawer.

- [ ] **Step 4: Run unit tests**
      Run: `pnpm --filter @celestia/api test src/games/genshin/intelligence/companion-summary/`
      Expected: PASS (all tests pass).

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.explainer.ts apps/api/src/games/genshin/intelligence/companion-summary/companion-summary.explainer.test.ts apps/web/src/components/dashboard/NextActionSummaryCard.tsx
  git commit -m "feat(intelligence): tag companion summary explanations with epistemological layers"
  ```

---

### Task 4: Security Architecture ADR-0012 & Connection Route Clarity

**Files:**

- Create: `docs/architecture/adr-0012-account-connection-security.md`
- Modify: `docs/plans/CURRENT_HANDOFF.md`
- Modify: `README.md` (or workspace guide)

**Interfaces:**

- Consumes: Security requirements, external product review findings.
- Produces: Architectural Decision Record establishing UID-First Enka as default, GOOD JSON as complete import, and formally deprecating manual cookie entry.

- [ ] **Step 1: Author ADR-0012**
      Document context, decision, consequences:
  - Context: Competing approaches (unpacked browser extension vs manual cookie paste vs public UID showcase).
  - Decision: UID public showcase via Enka.Network is the canonical primary onboarding path. GOOD JSON import is the canonical complete inventory path. Manual session-cookie entry is rejected and banned. The browser connector is relegated to optional developer research.
  - Consequences: Zero account theft risk, minimal onboarding friction, clear boundary guarantees.

- [ ] **Step 2: Update `CURRENT_HANDOFF.md` and repository docs**
      Record ADR-0012 and M8 roadmap status in the canonical handoff file.

- [ ] **Step 3: Commit**
  ```bash
  git add docs/architecture/adr-0012-account-connection-security.md docs/plans/CURRENT_HANDOFF.md
  git commit -m "docs(adr): record ADR-0012 account connection security and canonical onboarding paths"
  ```

---

### Task 5: Full Monorepo Verification & Real Journey Acceptance

**Files:**

- Test: `apps/api/tooling/m7-1-real-journey.integration.test.js`
- Test: `apps/api/tooling/verification.mjs`

- [ ] **Step 1: Run comprehensive API test suite**
      Run: `pnpm --filter @celestia/api test`
      Expected: All unit and HTTP tests pass.

- [ ] **Step 2: Run web typecheck, lint, and build**
      Run: `pnpm --filter @celestia/web check-types && pnpm --filter @celestia/web lint && pnpm --filter @celestia/web build`
      Expected: PASS with 0 errors and 0 warnings.

- [ ] **Step 3: Run repository format check**
      Run: `pnpm format:check`
      Expected: PASS.

- [ ] **Step 4: Commit and finalize milestone**
  ```bash
  git commit --allow-empty -m "chore(release): M8 core experience and account unity verified"
  ```
