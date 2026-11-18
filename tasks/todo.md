# Task List: M2 — Automated Testing & CI Quality Gate

- [x] Task 2.1: Modern Linting System (ESLint 9 Flat Config)
  - Acceptance: `eslint.config.js` configured with `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`; `"lint"` and `"lint:fix"` scripts pass with 0 errors.
  - Verify: `pnpm run lint`
  - Files: `eslint.config.js`, `package.json`

- [x] Task 2.2: Playwright & Axe-Core Infrastructure Setup
  - Acceptance: Pinned `@playwright/test` and `@axe-core/playwright`; `playwright.config.ts` configured for production preview (`localhost:4173`); test helper fixtures created.
  - Verify: `playwright.config.ts`, `e2e/fixtures/test-helpers.ts`
  - Files: `playwright.config.ts`, `package.json`, `e2e/fixtures/test-helpers.ts`

- [x] Task 2.3: Core User Journey Suites (Journeys 1 to 5)
  - Acceptance: 5 comprehensive journeys testing empty state/demo mode, roster filters, character calibration, armory modals, and UID showcase sync.
  - Verify: `pnpm run test:e2e`
  - Files: `e2e/journeys/01-first-visit-demo.spec.ts` through `05-uid-sync.spec.ts`

- [x] Task 2.4: Advanced Features & Viewport Suites (Journeys 6 to 10)
  - Acceptance: 5 journeys testing team generator synergies, theater/abyss endgame solvers, transactional backup/restore, pull advisor wish math, and mobile viewport responsive layout.
  - Verify: `pnpm run test:e2e`
  - Files: `e2e/journeys/06-team-builder.spec.ts` through `10-mobile-viewport.spec.ts`

- [x] Task 2.5: Automated WCAG 2.1 AA Accessibility Audit
  - Acceptance: Automated scan with `@axe-core/playwright` verifying 0 critical accessibility violations on landing views and open modal dialogs.
  - Verify: `pnpm run test:e2e`
  - Files: `e2e/journeys/11-accessibility-wcag.spec.ts`

- [x] Task 2.6: Modal & Header ARIA Accessibility Hardening
  - Acceptance: All modal dialogs enhanced with `role="dialog"`, `aria-modal="true"`, and descriptive `aria-label`; header buttons have accessible names on both desktop and mobile viewports.
  - Verify: Axe-core scan & responsive browser verification
  - Files: `src/components/WeaponConflictModal.tsx`, `src/components/CharacterDetailModal.tsx`, `src/components/GoodImportExportModal.tsx`, `src/components/Navbar.tsx`

- [x] Task 2.7: GitHub Actions CI Quality Gate Upgrade with Tiered Caching
  - Acceptance: Upgraded `.github/workflows/quality-gate.yml` with pnpm store caching, Playwright binary caching, lint, typecheck, unit tests, build, E2E tests, SSOT validation, and failure report upload.
  - Verify: Workflow syntax & git clean working tree
  - Files: `.github/workflows/quality-gate.yml`, `.gitignore`

- [x] Task 2.8: Architecture Decision Record ADR-002
  - Acceptance: ADR-002 authored in `docs/decisions/0002-automated-testing-and-ci-pipeline.md` detailing all architectural choices, test design, and CI gates.
  - Verify: Markdown review
  - Files: `docs/decisions/0002-automated-testing-and-ci-pipeline.md`, `tasks/plan.md`, `tasks/todo.md`
