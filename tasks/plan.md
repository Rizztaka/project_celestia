# Implementation Plan: M2 — Automated Testing & CI Quality Gate

## Overview
Comprehensive test automation and continuous integration infrastructure for Project Celestia v2 (Version 7.2 baseline). This milestone installs and configures ESLint 9 Flat Config with React Hooks and TypeScript plugins, integrates Playwright E2E browser testing and Axe-Core automated WCAG 2.1 AA accessibility auditing across Desktop and Mobile viewports, upgrades modals and navigation for full accessibility, and enhances the GitHub Actions CI pipeline with tiered caching and failure reporting.

## Architecture Decisions
- **ESLint 9 Flat Configuration**: Modern `eslint.config.js` with `@eslint/js`, `typescript-eslint`, and `eslint-plugin-react-hooks`.
- **Playwright Test Runner**: Native Playwright runner with `@playwright/test` and `@axe-core/playwright` targeting production preview on `localhost:4173`.
- **Dual Device Matrix**: Primary test matrix covers Desktop Chrome (1920x1080) and Mobile Chrome (Pixel 5, 393x851 with touch emulation).
- **15-Second Chunk Resolution Timeout**: Calibrated Playwright assertion timeout to 15000ms to guarantee lazy-loaded React 19 chunks resolve reliably under parallel multi-worker concurrency.
- **WAI-ARIA Accessibility**: Added `role="dialog"`, `aria-modal="true"`, and descriptive `aria-label` to all application modals (`WeaponConflictModal`, `CharacterDetailModal`, `GoodImportExportModal`) and navigation controls.
- **CI Tiered Caching**: Two-tier cache in `.github/workflows/quality-gate.yml` for pnpm package store and Playwright browser binaries (`~/.cache/ms-playwright`).

## Task List

### Phase 1: Linting & E2E Infrastructure
- [x] Task 2.1: ESLint 9 Flat Configuration Setup (`eslint.config.js`, `package.json`)
- [x] Task 2.2: Playwright & Axe-Core Infrastructure Setup (`playwright.config.ts`, `e2e/fixtures/test-helpers.ts`)

### Phase 2: User Journey & Accessibility Test Suites
- [x] Task 2.3: Journey Specs 1 to 5 (First Visit & Demo, Roster Management, Character Calibration, Armory & Weapons, UID Sync)
- [x] Task 2.4: Journey Specs 6 to 10 (Team Builder, Endgame Solvers, Backup/Restore, Pull Advisor, Mobile Viewport)
- [x] Task 2.5: Automated WCAG 2.1 AA Accessibility Audit (`e2e/journeys/11-accessibility-wcag.spec.ts`)

### Phase 3: Accessibility Enhancements & CI Quality Gate
- [x] Task 2.6: Modal & Header ARIA Accessibility Hardening (`src/components/WeaponConflictModal.tsx`, `src/components/CharacterDetailModal.tsx`, `src/components/GoodImportExportModal.tsx`, `src/components/Navbar.tsx`)
- [x] Task 2.7: GitHub Actions CI Quality Gate Upgrade with Tiered Caching (`.github/workflows/quality-gate.yml`, `.gitignore`)
- [x] Task 2.8: Architecture Decision Record ADR-002 (`docs/decisions/0002-automated-testing-and-ci-pipeline.md`)

## Checkpoints & Verification
- [x] `pnpm run lint` passes with 0 errors
- [x] `npx tsc -b` passes with 0 errors
- [x] `pnpm test` passes all 328 unit/integration tests across 23 test files
- [x] `pnpm run build` succeeds cleanly
- [x] `pnpm run test:e2e` passes all 26 browser tests across Desktop Chrome and Mobile Chrome (Pixel 5)
- [x] `node scripts/generate-reference.cjs` verifies SSOT alignment (128 characters, 256 weapons, 64 artifact sets)
- [x] Git working tree is clean
