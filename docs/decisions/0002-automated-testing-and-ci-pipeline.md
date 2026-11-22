# ADR-002: Automated Testing, E2E Browser Testing & CI Quality Gate Architecture

## Status
Accepted

## Date
2026-11-18 (Updated 2026-11-22)

## Context
Project Celestia is a client-side Genshin Impact roster management, weapon armory, archetype synergy, and pull advisory web application running on React 19, TypeScript, and Vite.
Prior to Milestone M2, automated testing and static quality enforcement faced several gaps:
1. **Lack of Static Analysis / Linting**: No linter was configured. Code style regressions, unused variables, and React hook dependencies went undetected at commit time.
2. **Absence of Real Browser E2E Testing**: While 552 Vitest unit and integration tests verified domain logic and storage engines, the actual user experience in real browser environments (DOM events, navigation transitions, modal open/close cycles, storage synchronization across components, responsive viewport adaptation) was unverified.
3. **Accessibility (a11y) Blindspots**: Modals lacked standard WAI-ARIA dialog attributes (`role="dialog"`, `aria-modal="true"`), and icon-only buttons on compact viewports lacked accessible names (`aria-label`), risking WCAG 2.1 AA violations.
4. **CI Pipeline Incompleteness**: The GitHub Actions workflow lacked automated linting, E2E browser test execution, browser binary caching, and artifact reporting on failures.

## Decision
1. **ESLint 9 Flat Configuration**:
   - Deployed modern ESLint 9 flat config in `eslint.config.js` utilizing `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`.
   - Tuned rulesets for TypeScript 5.7 and React 19 compatibility while preserving stable modal synchronization patterns.
   - Configured `"lint"` and `"lint:fix"` scripts in `package.json`.

2. **Playwright & Axe-Core End-to-End Test Infrastructure**:
   - Pinned `@playwright/test` (`1.65.1`) and `@axe-core/playwright` (`4.14.0`).
   - Aligned Node environment via `.nvmrc` (`22`) and `package.json` (`engines: { node: "22.x" }`).
   - Configured `playwright.config.ts` targeting Vite production preview (`http://127.0.0.1:4173`) with automated web server lifecycle management and `reuseExistingServer: !process.env.CI`.
   - Defined 4-browser execution matrix:
     - **Desktop Chromium** (1920x1080 viewport)
     - **Desktop Firefox** (1920x1080 viewport)
     - **Mobile Chromium (Pixel 5)** (393x851 viewport, mobile touch emulation)
     - **Mobile WebKit (iPhone 13)** (390x844 viewport, mobile WebKit emulation)
   - Calibrated assertion timeout to 15000ms to allow lazy-loaded `Suspense` chunks sufficient resolution time under parallel worker execution.
   - Authored 12 comprehensive user journey test suites under `e2e/journeys/`:
     - `01-first-visit-demo.spec.ts`: Empty account landing, title verification, Demo Mode isolation toggle.
     - `02-roster-management.spec.ts`: Navigation to Roster view, elemental filtering, search input, adding character, constellation stepping, reload persistence, and removal.
     - `03-profiles-calibration.spec.ts`: Character detail modal opening, calibration of level and constellation, talent inspection, and card synchronization.
     - `04-armory-weapons.spec.ts`: Armory modal dialog opening, "Forge / Add" weapon submission, edit panel calibration, and equipment transfer.
     - `05-uid-sync.spec.ts`: UID input formatting, validation, showcase sync triggering, toast verification, reload persistence, Enka 404 error handling, and unknown avatar ID resilience.
     - `06-team-builder.spec.ts`: Team Generator rendering, insufficient roster notice, catalog fallback toggle, and owned synergy calculation in Demo Mode.
     - `07-endgame-solvers.spec.ts`: Endgame Helper view, Imaginarium Theater requirements check, and Spiral Abyss dual-half lineup solver.
     - `08-backup-restore-rollback.spec.ts`: Account backup modal, native JSON backup export, malformed JSON rejection, schema validation, and pre-restore rollback.
     - `09-pull-advisor.spec.ts`: Pull Advisor recommendations, wish budget calculations (primogems + fates), guarantee toggle, and reload persistence.
     - `10-mobile-viewport.spec.ts`: Responsive layout, zero horizontal overflow across 320px–1024px, mobile navigation touch targets >= 44px, and modal containment.
     - `11-accessibility-wcag.spec.ts`: Automated axe-core accessibility audit scanning all 5 primary views (Best Teams, Pull Advisor, Endgame Helper, Artifact Stop, My Roster) and 4 core modals (Account Backup, Weapon Armory, Character Detail, Gacha Assumptions) against WCAG 2.1 AA rules.
     - `12-storage-migration-resilience.spec.ts`: Real-browser legacy v1→v2 migration with safety snapshot creation, blocked storage notification banner, and quota-exceeded error handling without UI crash.
   - Preserved `e2e/performance.spec.ts` for M3 performance synthetic gates (lightweight bundle payload, smooth tab switching, modal chunk prefetching).

3. **Accessibility & Responsive Navbar Enhancements**:
   - Enhanced modal dialogs (`WeaponConflictModal`, `CharacterDetailModal`, `GoodImportExportModal`, `AccountBackupModal`) with `role="dialog"`, `aria-modal="true"`, and descriptive `aria-label` tags.
   - Enhanced `Navbar.tsx` with `aria-label` for Demo Mode toggle, Armory trigger, UID Sync button, and both desktop and mobile navigation tabs.
   - Converted mobile tab bar into semantic `<nav aria-label="Mobile Navigation">` with minimum 44px touch targets.
   - Optimized header flex spacing on narrow viewports (`gap-1.5 sm:gap-2`, input width `w-24 sm:w-36`) and added `shrink-0` to modal close buttons.
   - Hardened `App.tsx` mount effect against restricted storage environments (`if (!isStorageAvailable()) return;`).

4. **CI Quality Gate Pipeline Upgrade (`.github/workflows/quality-gate.yml`)**:
   - Upgraded GitHub Actions workflow into a two-job pipeline:
     - `static-unit-build`: runs lint, typecheck, Vitest (552 tests), data audit, SSOT check, and production build with budget validation.
     - `browser-e2e`: matrix job running Playwright across all 4 browser targets (`Desktop Chromium`, `Desktop Firefox`, `Mobile Chromium`, `Mobile WebKit`).
   - Tiered caching:
     - pnpm package store cache via `actions/setup-node@v4`.
     - Playwright browser binaries cache (`~/.cache/ms-playwright`) via `actions/cache@v4`.
   - Comprehensive local verification command: `pnpm run verify:all` running all 8 quality gates sequentially.
   - Enforced strict git clean working tree verification (`git diff --exit-code`).
   - Attached automated artifact upload for Playwright HTML reports on test failures (`actions/upload-artifact@v4`).

## Consequences
- **Positive**: Complete automated verification across 4 browser targets on authentic production builds in under 2 minutes.
- **Positive**: Continuous WCAG 2.1 AA accessibility regression testing on all 5 major views and 4 core modals.
- **Positive**: Strict static analysis catches React hook anomalies and TypeScript discrepancies prior to commit.
- **Positive**: Fast CI feedback loop enabled by two-tier caching and matrix test execution.
