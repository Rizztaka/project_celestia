# Milestone M2: Proper Automated Testing and CI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish an unyielding automated quality gate so regressions cannot reach production. Configure ESLint 9 flat config, pin `@playwright/test` and `@axe-core/playwright`, implement 10 real browser user journey test suites under `e2e/` against Vite's production preview (`localhost:4173`), embed automated WCAG 2.1 AA accessibility audits, and upgrade GitHub Actions `.github/workflows/quality-gate.yml` with tiered caching, strict type checking, linting, unit tests, browser tests, and clean tree assertions.

**Architecture:**
1. **Zero-Deprecation Linting Standard**: Establish ESLint 9 flat configuration (`eslint.config.js`) combining `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`.
2. **True Browser E2E Harness**: Pin `@playwright/test` and `@axe-core/playwright` in `devDependencies`. Configure `playwright.config.ts` to manage the Vite production preview server (`pnpm run preview --port 4173 --host`) and run tests against real Chromium, Firefox, and WebKit browser engines.
3. **10 Authentic User Journey Test Suites (`e2e/`)**: Translate simulated vitest journeys into real DOM-interacting Playwright tests covering onboarding, demo mode isolation, roster edits, weapon armory transfers, UID sync, team solver, endgame abyss/theater, atomic backup rollback, pull budget, and mobile touch viewports.
4. **Automated Accessibility Gate**: Embed `@axe-core/playwright` scans on core application routes and modals, failing on any WCAG 2.1 AA violation.
5. **Tiered CI Pipeline**: Update `.github/workflows/quality-gate.yml` to install Playwright browser binaries with aggressive GitHub Actions caching, running Desktop + Mobile Chromium on PRs/pushes (under 2 minutes) while providing the full 5-project matrix locally and on scheduled runs.

**Tech Stack:** TypeScript, ESLint 9 Flat Config, `@playwright/test` v1.50+, `@axe-core/playwright`, Vite 6, GitHub Actions, Node 22, pnpm v9+.

**Spec Reference:**
- [`docs/audit/m0-technical-baseline.md`](file:///d:/Genshin%20Personal/project-celestia/docs/audit/m0-technical-baseline.md)
- [`docs/decisions/0000-technical-baseline-and-architecture-map.md`](file:///d:/Genshin%20Personal/project-celestia/docs/decisions/0000-technical-baseline-and-architecture-map.md)
- [`docs/decisions/0001-storage-namespace-and-atomic-restore.md`](file:///d:/Genshin%20Personal/project-celestia/docs/decisions/0001-storage-namespace-and-atomic-restore.md)

---

## Global Constraints

- **Version Alignment**: Node.js 22.x in both GitHub Actions CI and local development.
- **Game Version Floor**: Strict Version 7.2 baseline (128 characters, 256 weapons, 64 artifact sets).
- **Execution Budget**: CI pipeline must complete within 2.5 minutes on GitHub Actions standard Ubuntu runners.
- **No Flakiness**: E2E tests must never use arbitrary `sleep()` / `waitForTimeout()`; all interactions must use auto-waiting locators (`toBeVisible`, `toHaveText`, `toBeEnabled`).
- **Production Fidelity**: All E2E browser tests must run against the compiled production bundle via `pnpm run preview`, never against development mode.

---

## Review Focus (Adversarial Stress Cases)

1. **WebServer Port Race Conditions in CI**: `playwright.config.ts` webServer command must properly bind to port 4173 with `reuseExistingServer: !process.env.CI` to prevent zombie preview daemons from causing `EADDRINUSE`.
2. **Playwright Browser Binary Caching**: If browser binaries are downloaded on every CI run without caching, runs will consume unnecessary minutes and bandwidth. The workflow must cache `~/.cache/ms-playwright` keyed by Playwright version.
3. **Strict ESLint 9 Compatibility**: Avoid legacy ESLint plugins or rules that emit deprecation warnings or crash under native ESM (`"type": "module"` in `package.json`).
4. **Hydration & Storage Synchronization in Headless Browsers**: Tests verifying Demo Mode, Account Reset, and Restore must ensure `localStorage` events and React state remain in sync across rapid headless browser clicks.
5. **Cross-Platform Path & Line Ending Resilience**: Scripts and Git status assertions in CI must tolerate Windows CRLF vs Linux LF differences without failing clean tree assertions.

---

## Task Structure & Implementation Plan

### Task 1: ESLint 9 Flat Config Setup & Scripts

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json`
- Test: `pnpm run lint`

- [ ] **Step 1: Install ESLint 9 and flat config plugins**
- [ ] **Step 2: Create `eslint.config.js` with TypeScript and React Hooks support**
- [ ] **Step 3: Add `"lint"` script to `package.json`**
- [ ] **Step 4: Execute linting check and fix any minor syntax warnings**
- [ ] **Step 5: Commit**

---

### Task 2: Playwright & Axe-Core Setup & Configuration

**Files:**
- Modify: `package.json`
- Modify: `playwright.config.ts`
- Test: `pnpm exec playwright --version`

- [ ] **Step 1: Install `@playwright/test` and `@axe-core/playwright`**
- [ ] **Step 2: Update `playwright.config.ts`**
- [ ] **Step 3: Add scripts to `package.json` (`test:e2e`, `test:e2e:all`, `test:e2e:ui`)**
- [ ] **Step 4: Install Chromium and Firefox test binaries**
- [ ] **Step 5: Commit**

---

### Task 3: Implement E2E Browser User Journeys (1 to 5)

**Files:**
- Create: `e2e/fixtures/test-helpers.ts`
- Create: `e2e/journeys/01-first-visit-demo.spec.ts`
- Create: `e2e/journeys/02-roster-management.spec.ts`
- Create: `e2e/journeys/03-profiles-calibration.spec.ts`
- Create: `e2e/journeys/04-armory-weapons.spec.ts`
- Create: `e2e/journeys/05-uid-sync.spec.ts`
- Test: `pnpm run test:e2e`

- [ ] **Step 1: Create reusable test helper utilities**
- [ ] **Step 2: Journey 1: First Visit, Empty Account & Demo Mode Toggle**
- [ ] **Step 3: Journey 2: Roster Management**
- [ ] **Step 4: Journey 3: Character Profiles & Talents**
- [ ] **Step 5: Journey 4: Armory & Atomic Weapon Transfer**
- [ ] **Step 6: Journey 5: UID Sync & Enka Integration**
- [ ] **Step 7: Run Journeys 1-5**

---

### Task 4: Implement E2E Browser User Journeys (6 to 10) & Accessibility Audit

**Files:**
- Create: `e2e/journeys/06-team-builder.spec.ts`
- Create: `e2e/journeys/07-endgame-solvers.spec.ts`
- Create: `e2e/journeys/08-backup-restore-rollback.spec.ts`
- Create: `e2e/journeys/09-pull-advisor.spec.ts`
- Create: `e2e/journeys/10-mobile-viewport.spec.ts`
- Create: `e2e/journeys/11-accessibility-wcag.spec.ts`
- Test: `pnpm run test:e2e`

- [ ] **Step 1: Journey 6: Team Builder Constraints**
- [ ] **Step 2: Journey 7: Endgame Solvers**
- [ ] **Step 3: Journey 8: Backup Export, Import & Automatic Rollback**
- [ ] **Step 4: Journey 9: Pull Advisor & Wish Math**
- [ ] **Step 5: Journey 10: Mobile Viewport & Touch Targets**
- [ ] **Step 6: Journey 11: Automated WCAG 2.1 AA Accessibility via `@axe-core/playwright`**
- [ ] **Step 7: Run Journeys 6-11**

---

### Task 5: Upgrade GitHub Actions Quality Gate Pipeline

**Files:**
- Modify: `.github/workflows/quality-gate.yml`
- Test: Local workflow lint & run verification

- [ ] **Step 1: Update `.github/workflows/quality-gate.yml` with Playwright binary caching, lint step, and e2e test execution**
- [ ] **Step 2: Verify all quality gates pass locally**
- [ ] **Step 3: Commit**

---

### Task 6: ADR-002 Documentation & Task Tracking

**Files:**
- Create: `docs/decisions/0002-automated-testing-and-ci-pipeline.md`
- Modify: `tasks/plan.md`
- Modify: `tasks/todo.md`

- [ ] **Step 1: Author ADR-002**
- [ ] **Step 2: Update `tasks/plan.md` and `tasks/todo.md` for M2**
- [ ] **Step 3: Commit**

---

## Verification Plan

### Automated Local Verification
1. `pnpm run lint` — 0 ESLint errors.
2. `npx tsc -b` — 0 TypeScript compiler errors.
3. `pnpm test` — 328 Vitest unit tests pass across 23 test suites.
4. `pnpm run build` — Clean Vite production build.
5. `pnpm run test:e2e` — 11 Playwright browser suites pass across Desktop Chrome and Mobile Chrome.
6. `node scripts/generate-reference.cjs` — SSOT reference synchronized with 0 git diff.
7. `git status --porcelain` — Clean working tree.
