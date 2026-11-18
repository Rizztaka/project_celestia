# ADR-002: Automated Testing, E2E Browser Testing & CI Quality Gate Architecture

## Status
Accepted

## Date
2026-11-18

## Context
Project Celestia is a client-side Genshin Impact roster management, weapon armory, archetype synergy, and pull advisory web application running on React 19, TypeScript, and Vite.
Prior to Milestone M2, automated testing and static quality enforcement faced several gaps:
1. **Lack of Static Analysis / Linting**: No linter was configured. Code style regressions, unused variables, and React hook dependencies went undetected at commit time.
2. **Absence of Real Browser E2E Testing**: While 328 Vitest unit tests verified domain logic and storage engines, the actual user experience in real browser environments (DOM events, navigation transitions, modal open/close cycles, storage synchronization across components, responsive viewport adaptation) was unverified.
3. **Accessibility (a11y) Blindspots**: Modals lacked standard WAI-ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`), and icon-only buttons on compact viewports lacked accessible names (`aria-label`), violating WCAG 2.1 AA guidelines.
4. **CI Pipeline Incompleteness**: The GitHub Actions workflow lacked automated linting, E2E browser test execution, browser binary caching, and artifact reporting on failures.

## Decision
1. **ESLint 9 Flat Configuration**:
   - Deployed modern ESLint 9 flat config in `eslint.config.js` utilizing `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`.
   - Tuned rulesets for TypeScript 5.7 and React 19 compatibility while preserving stable modal synchronization patterns.
   - Configured `"lint"` and `"lint:fix"` scripts in `package.json`.

2. **Playwright & Axe-Core End-to-End Test Infrastructure**:
   - Pinned `@playwright/test` and `@axe-core/playwright`.
   - Configured `playwright.config.ts` targeting Vite production preview (`http://localhost:4173`) with automated web server lifecycle management and `reuseExistingServer: !process.env.CI`.
   - Defined dual primary execution projects:
     - **Desktop Chrome** (1920x1080 viewport)
     - **Mobile Chrome (Pixel 5)** (393x851 viewport, mobile touch emulation)
   - Calibrated assertion timeout to 15000ms to allow lazy-loaded `Suspense` chunks sufficient resolution time under parallel worker execution.
   - Authored 11 user journey test suites under `e2e/journeys/`:
     - `01-first-visit-demo.spec.ts`: Empty account landing, title verification, Demo Mode isolation toggle.
     - `02-roster-management.spec.ts`: Navigation to Roster view, elemental filtering, search input.
     - `03-profiles-calibration.spec.ts`: Character detail modal opening and profile inspection.
     - `04-armory-weapons.spec.ts`: Armory modal dialog opening, weapon count display, and clean dismissal.
     - `05-uid-sync.spec.ts`: UID input formatting, validation, and showcase sync triggering.
     - `06-team-builder.spec.ts`: Team Generator rendering, archetype synergy engine, and filter chips.
     - `07-endgame-solvers.spec.ts`: Endgame Helper view, Imaginarium Theater, and Spiral Abyss tab transitions.
     - `08-backup-restore-rollback.spec.ts`: Account backup modal, JSON backup export, and metadata tracking.
     - `09-pull-advisor.spec.ts`: Pull Advisor recommendations and wish budget calculations.
     - `10-mobile-viewport.spec.ts`: Responsive layout, mobile bottom/drawer navigation, and viewport scaling.
     - `11-accessibility-wcag.spec.ts`: Automated axe-core accessibility audit scanning root application and modal dialogs against WCAG 2.1 AA rules.

3. **Accessibility & Responsive Navbar Enhancements**:
   - Enhanced modal dialogs (`WeaponConflictModal`, `CharacterDetailModal`, `GoodImportExportModal`) with `role="dialog"`, `aria-modal="true"`, and descriptive `aria-label` tags.
   - Enhanced `Navbar.tsx` with `aria-label` for Demo Mode toggle, Armory trigger, UID Sync button, and both desktop and mobile navigation tabs.
   - Converted mobile tab bar into semantic `<nav aria-label="Mobile Navigation">`.
   - Optimized header flex spacing on narrow viewports (`gap-1.5 sm:gap-2`, input width `w-24 sm:w-36`) and added `shrink-0` to modal close buttons to prevent pointer intercept collisions.

4. **CI Quality Gate Pipeline Upgrade (`.github/workflows/quality-gate.yml`)**:
   - Upgraded GitHub Actions workflow with tiered caching:
     - pnpm package store cache via `actions/setup-node@v4`.
     - Playwright Chromium browser binaries cache (`~/.cache/ms-playwright`) via `actions/cache@v4`.
   - Enforced 6 sequential quality gates:
     1. ESLint 9 Flat Config (`pnpm run lint`)
     2. Strict TypeScript typecheck (`npx tsc -b`)
     3. Vitest unit and integration suite (`pnpm test`)
     4. Production Vite bundle build (`pnpm run build`)
     5. Playwright E2E browser tests across Desktop and Mobile (`pnpm run test:e2e`)
     6. SSOT reference synchronization (`node scripts/generate-reference.cjs`)
   - Enforced strict git clean working tree verification (`git diff --exit-code`).
   - Attached automated artifact upload for Playwright HTML reports on test failures (`actions/upload-artifact@v4`).

## Consequences
- **Positive**: Complete automated verification across both Desktop and Mobile browsers on authentic production builds in under 30 seconds locally and under 2 minutes in CI.
- **Positive**: Continuous WCAG 2.1 AA accessibility regression testing on all major views and modals.
- **Positive**: Strict static analysis catches React hook anomalies and TypeScript discrepancies prior to commit.
- **Positive**: Fast CI feedback loop enabled by two-tier caching (pnpm store + Playwright browser binaries).
