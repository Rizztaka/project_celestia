# Milestone 3 (M3 — Release Reliability & Data Maintenance) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish end-to-end release reliability and automated data maintenance for Project Celestia v2 by deploying a GitHub Actions CI quality gate, introducing a versioned localStorage migration engine with safety snapshots, building native account backup and restore functionality, expanding automated data-source integrity tests across banners/theater/abyss, implementing an 8-journey end-to-end test suite, and creating client-side error diagnostic reporting alongside a repeatable game-version update playbook.

**Architecture:**
1. **GitHub Actions CI Quality Gate**: Configure `.github/workflows/quality-gate.yml` with node 22, pnpm frozen install, TypeScript strict type checking (`tsc -b`), Vitest test suite (`pnpm test`), production Vite build (`pnpm run build`), and SSOT reference validation (`node scripts/generate-reference.cjs`).
2. **Versioned Storage Migration Engine**: In `src/services/storage-migration.ts`, implement `celestia_schema_version = 2`. When older or unversioned data is detected, generate an immutable pre-migration snapshot (`celestia_backup_v1`), normalize weapon keys and rarities, clamp corrupted numeric stats, and record migration timestamps.
3. **Native Account Backup & Restore Service**: In `src/services/backup.ts`, provide complete export and import of user account state (`celestia-backup-YYYY-MM-DD.json`). Implement strict schema validation, pre-restore diff summary, and automatic pre-restore safety snapshot (`celestia_backup_pre_restore`) allowing 1-click undo.
4. **Data-Source Integrity Verification**: In `src/data/data-integrity.test.ts`, assert zero orphan keys across `BANNER_PHASES`, `THEATER_SEASONS`, `ABYSS_CYCLES`, and `talent-scaling/`, ensuring 100% referential integrity with canonical characters and weapons.
5. **End-to-End User Journey Suite**: In `src/tests/e2e-user-journeys.test.ts`, simulate all 8 audit user flows: Onboarding & Demo Toggle, Profile Customization, Atomic Weapon Transfer, Pull Budget Math, Team Generation Constraints, Abyss/Theater Drafting, Error Boundary Recovery, and Full Account Restore. Supply `playwright.config.ts` for headless browser execution.
6. **Error Diagnostics & Version Update Playbook**: Add client-side diagnostic report download to `ErrorBoundary.tsx` (capturing component stack, user agent, active tab, and sanitized storage metadata) and author `docs/checklists/version-update-playbook.md` as the definitive SOP for upcoming patch updates (Version 7.3+).

**Tech Stack:** TypeScript, React 19, Vitest, Vite, GitHub Actions, Playwright runner template.

**Spec:** Decisions locked via `/grill-me`:
- Storage Migration: Dedicated non-destructive migration engine with `celestia_schema_version = 2` and automatic pre-migration snapshot (`celestia_backup_v1`).
- Backup & Restore: Celestia native JSON backup (`celestia-backup-YYYY-MM-DD.json`) with version tagging, schema validation, and pre-restore rollback guard.
- CI & Quality Gate: Dual Tier approach (Fast GitHub Actions CI pipeline + 8-journey Vitest E2E user suite + Playwright runner template).

---

## Global Constraints
- All 284 existing unit and integration tests must continue to pass without regression.
- All commits remain strictly on the local `master` branch; **DO NOT push to `origin` / GitHub**.
- Canonical character count must remain exactly 128 (Version 7.2 baseline); weapons 256; master artifact sets 64.
- Storage migrations must be 100% idempotent and non-destructive: existing valid keys (`celestia_v2_roster_profiles`, `celestia_v2_raw_weapons`, etc.) must not be wiped or corrupted.
- Zero external dependencies introduced that increase client bundle size; use native browser APIs (Blob, URL.createObjectURL) for backup downloads and diagnostics.

## Review Focus
1. **Storage Migration Idempotency**: Verify running `migrateStorageIfNeeded()` multiple times consecutively produces identical state and never creates duplicate snapshots.
2. **Corrupted Backup JSON Injection**: Ensure `validateBackupData()` rejects malformed JSON, invalid schema versions, negative primogems, out-of-range pity (>89 character, >79 weapon), and unauthorized character IDs without throwing runtime exceptions.
3. **Pre-Restore Rollback Safety**: Verify that if a user imports an invalid or accidental backup file, the pre-restore snapshot (`celestia_backup_pre_restore`) allows full state restoration.
4. **Data Integrity Boundary Gaps**: Check that `data-integrity.test.ts` catches typos, invalid date formats (`YYYY-MM-DD`), non-existent weapon keys in banner weapon pools, and missing boss descriptions in Theater seasons.
5. **Error Diagnostic Sanitization**: Ensure error diagnostic JSON captures diagnostic debugging info (component stack, error message, viewport, schema version) while omitting any personal identifiable information (PII).

---

## Task Breakdown

### Task 1: GitHub Actions CI Quality Gate Workflow

**Files:**
- Create: `.github/workflows/quality-gate.yml`
- Test: `.github/workflows/quality-gate.yml` (YAML validation & manual pipeline dry-run)

**Interfaces:**
- Consumes: `pnpm`, `tsc -b`, `pnpm test`, `pnpm run build`, `scripts/generate-reference.cjs`
- Produces: Automated GitHub Actions CI workflow triggered on PRs and pushes to `master` and `main`

- [x] **Step 1: Write GitHub Actions workflow file**
  Create `.github/workflows/quality-gate.yml` with:
  - Triggers on `push` and `pull_request` for `master` and `main` branches.
  - Job `quality-gate` running on `ubuntu-latest`.
  - Node.js 22 with `pnpm/action-setup@v4`.
  - Frozen lockfile dependency installation (`pnpm install --frozen-lockfile`).
  - Strict type checking (`npx tsc -b`).
  - Vitest test suite execution (`pnpm test`).
  - Production Vite build verification (`pnpm run build`).
  - SSOT Reference synchronization check (`node scripts/generate-reference.cjs`).
  - Git working tree status verification (`git diff --exit-code`) to guarantee zero untracked artifacts.

- [x] **Step 2: Verify local CI commands match workflow steps**
  Run: `pnpm test && pnpm run build && node scripts/generate-reference.cjs`
  Expected: All commands exit with code 0.

- [x] **Step 3: Commit workflow locally**
  ```bash
  git add .github/workflows/quality-gate.yml
  git commit -m "ci: add comprehensive GitHub Actions quality gate workflow"
  ```

---

### Task 2: Storage Schema Versioning & Non-Destructive Migration Engine

**Files:**
- Create: `src/services/storage-migration.ts`
- Modify: `src/services/storage.ts`
- Test: `src/services/storage-migration.test.ts`

**Interfaces:**
- Consumes: `localStorage`, `getWeaponByKey`, `CHARACTERS`
- Produces: `CURRENT_SCHEMA_VERSION = 2`, `getStorageSchemaVersion(): number`, `migrateStorageIfNeeded(): { migrated: boolean; fromVersion: number; toVersion: number }`, `rollbackToBackup(backupKey: string): boolean`

- [x] **Step 1: Write failing tests for storage migration**
  Create `src/services/storage-migration.test.ts`:
  - Test 1: Stamping `celestia_schema_version = 2` on fresh initialization.
  - Test 2: Migrating legacy v1 storage (unversioned localStorage):
    - Creates `celestia_backup_v1` containing exact raw snapshot.
    - Normalizes alias weapon keys (e.g., `pjws` -> `PrimordialJadeWingedSpear`) and missing rarities.
    - Validates profile structure and initializes missing `consecutiveLossCount` in pull budget.
  - Test 3: Migration idempotency: running `migrateStorageIfNeeded()` on already upgraded v2 storage is a no-op (`migrated: false`).
  - Test 4: Rollback capability: restoring `celestia_backup_v1` restores pre-migration state accurately.

- [x] **Step 2: Run test to verify it fails**
  Run: `pnpm test src/services/storage-migration.test.ts`
  Expected: FAIL with module not found.

- [x] **Step 3: Implement `storage-migration.ts`**
  - Define `SCHEMA_VERSION_KEY = 'celestia_schema_version'`, `CURRENT_SCHEMA_VERSION = 2`.
  - Implement `createSafetySnapshot(snapshotKey: string): boolean`.
  - Implement migration steps from v1 to v2:
    - Backup raw keys into `celestia_backup_v1`.
    - Sanitize weapon IDs, canonical keys, and rarities in `celestia_v2_raw_weapons`.
    - Sanitize equipped weapons in `celestia_v2_roster_profiles`.
    - Sanitize pull budget in `celestia_v2_pull_budget` ensuring `consecutiveLossCount` exists.
    - Set `celestia_schema_version` to `2`.
  - Implement `migrateStorageIfNeeded()` and auto-invoke at bottom of `src/services/storage.ts`.

- [x] **Step 4: Run tests to verify they pass**
  Run: `pnpm test src/services/storage-migration.test.ts src/services/storage.test.ts`
  Expected: PASS all tests.

- [x] **Step 5: Commit changes locally**
  ```bash
  git add src/services/storage-migration.ts src/services/storage-migration.test.ts src/services/storage.ts
  git commit -m "feat(storage): implement non-destructive schema migration engine and v1 backup snapshot"
  ```

---

### Task 3: Full Account Backup & Restore Service

**Files:**
- Create: `src/services/backup.ts`
- Create: `src/services/backup.test.ts`
- Modify: `src/components/RosterView.tsx` (add Backup & Restore controls)
- Create: `src/components/AccountBackupModal.tsx`

**Interfaces:**
- Consumes: `getSavedRoster`, `getSavedProfiles`, `getSavedWeapons`, `getSavedArtifacts`, `getSavedPullBudget`, `getSavedAbyssCycleId`, `getSavedCustomAbyss`, `isDemoModeEnabled`
- Produces: `exportAccountBackup(): CelestiaBackupData`, `validateBackupData(data: unknown): ValidationResult`, `importAccountBackup(backup: CelestiaBackupData): { success: boolean; error?: string }`, `downloadBackupFile(): void`

- [x] **Step 1: Write failing tests for backup export & import**
  Create `src/services/backup.test.ts`:
  - Test 1: `exportAccountBackup()` outputs complete `CelestiaBackupData` matching format `celestia_native`, version `2`, and gameVersion `7.2`.
  - Test 2: `validateBackupData()` accepts valid backup objects and flags invalid fields (missing version, malformed profiles, out-of-range pity values).
  - Test 3: `importAccountBackup()` creates pre-restore safety snapshot `celestia_backup_pre_restore` and overwrites storage with valid backup payload.
  - Test 4: Rollback from pre-restore snapshot recovers prior state.

- [x] **Step 2: Run test to verify it fails**
  Run: `pnpm test src/services/backup.test.ts`
  Expected: FAIL with module not found.

- [x] **Step 3: Implement `backup.ts` and `AccountBackupModal.tsx`**
  - Implement `CelestiaBackupData` interface.
  - Implement `exportAccountBackup()`, `validateBackupData()`, `importAccountBackup()`, `downloadBackupFile()`.
  - Build `AccountBackupModal.tsx` displaying:
    - 1-Click "Download Celestia Backup (.json)" button.
    - Drag-and-drop or file upload for restoring backup.
    - Pre-restore confirmation summary displaying character count, weapon count, and export date.
    - "Restore Backup" button with rollback option.
  - Wire modal trigger button in `src/components/RosterView.tsx` next to GOOD import/export.

- [x] **Step 4: Run tests to verify they pass**
  Run: `pnpm test src/services/backup.test.ts`
  Expected: PASS.

- [x] **Step 5: Commit changes locally**
  ```bash
  git add src/services/backup.ts src/services/backup.test.ts src/components/AccountBackupModal.tsx src/components/RosterView.tsx
  git commit -m "feat(backup): implement native account backup, validation, and restore with rollback safety"
  ```

---

### Task 4: Data-Source Integrity Automated Tests

**Files:**
- Create: `src/data/data-integrity.test.ts`

**Interfaces:**
- Consumes: `BANNER_PHASES`, `THEATER_SEASONS`, `THEATER_BOSS_INFO`, `ABYSS_CYCLES`, `CHARACTERS`, `WEAPONS_DATA`, `AVAILABLE_SCALING_KEYS`
- Produces: Vitest suite asserting zero orphan IDs, valid date ranges, and complete mechanic descriptions

- [x] **Step 1: Write data integrity test suite**
  Create `src/data/data-integrity.test.ts` with assertions:
  - **Banner Integrity**:
    - Every character in `characterBanners` exists in `CHARACTERS`.
    - Every signature weapon in `signatureWeaponKey` and `featuredWeapons` exists in `WEAPONS_DATA`.
    - Every 4-star in `featured4StarIds` has `rarity === 4`.
    - `startDate < endDate` for all phases; valid date format (`YYYY-MM-DD`).
    - Every banner phase has a non-empty `sourceUrl` and `verifiedAt`.
  - **Imaginarium Theater Integrity**:
    - Season element restrictions are valid `Element` names.
    - Principal characters and special guest cast exist in `CHARACTERS`.
    - All boss encounters exist in `THEATER_BOSS_INFO` with valid hazards, weaknesses, and archetypes.
  - **Spiral Abyss Integrity**:
    - Every cycle has 3 chambers, each with valid `firstHalf` and `secondHalf`.
    - Enemy statistics have valid `level > 0`, `hp > 0`, and complete `baseRes` covering all 7 elements + Physical.
    - Active cycle `cycle-7-2` covers November 2026.
  - **Talent Scaling Integrity**:
    - All 128 characters have a corresponding talent scaling profile in `AVAILABLE_SCALING_KEYS`.

- [x] **Step 2: Run test suite**
  Run: `pnpm test src/data/data-integrity.test.ts`
  Expected: PASS (all data integrity checks succeed).

- [x] **Step 3: Commit changes locally**
  ```bash
  git add src/data/data-integrity.test.ts
  git commit -m "test(data): add automated data-source integrity validation across banners, theater, and abyss"
  ```

---

### Task 5: End-to-End User Journey Tests & Playwright Template

**Files:**
- Create: `src/tests/e2e-user-journeys.test.ts`
- Create: `playwright.config.ts`
- Create: `docs/playwright-setup.md`

**Interfaces:**
- Consumes: Complete Celestia storage, engine, and UI workflow contracts
- Produces: Vitest automated E2E test suite covering all 8 audit journeys + Playwright configuration template

- [x] **Step 1: Write the 8-journey E2E test suite**
  Create `src/tests/e2e-user-journeys.test.ts` with test blocks for:
  - **Journey 1: Truthful Onboarding & Demo Toggle**: Fresh empty storage defaults to 0 characters/weapons; toggling demo mode loads 11 characters + 8 weapons; turning off demo mode reverts cleanly to empty.
  - **Journey 2: Character Profile Customization & Roster Persistence**: Adding Mavuika, setting C2 R1, persisting profile, clearing roster, verifying empty map persists across reloads.
  - **Journey 3: Atomic Cross-Character Weapon Swapping**: Equipping "The Catch" from Xiangling to Raiden Shogun transfers weapon without duplicating; equipping bow on polearm is rejected.
  - **Journey 4: Pull Budget & Markov Gacha Simulator**: Configuring budget, recording consecutive losses, checking Capturing Radiance probability ($50\% \to 55\% \to 75\% \to 100\%$), verifying persistence.
  - **Journey 5: Multi-Factor Team Generator**: Requesting teams with owned characters only; verifying 0 unowned leak; verifying no dual-Traveler drafting; checking Composition Compatibility Score.
  - **Journey 6: Imaginarium Theater & Abyss Dual-Team Drafting**: Checking active season cast eligibility; drafting 12-1 and 12-2 ensuring 0 character overlap between halves.
  - **Journey 7: Error Recovery & Tab Navigation**: Simulating view fetch errors; ErrorBoundary renders fallback with Retry and Reload; Retry resets error state.
  - **Journey 8: Account Backup Export, Migration & Restore**: Exporting native JSON, mutating account, restoring backup with pre-restore guard, rolling back on cancel.

- [x] **Step 2: Run the E2E test suite**
  Run: `pnpm test src/tests/e2e-user-journeys.test.ts`
  Expected: PASS (all 8 journeys succeed).

- [x] **Step 3: Create Playwright configuration and documentation**
  - Create `playwright.config.ts` configuring Chromium/Firefox/WebKit mobile viewport presets (Pixel 5, iPhone 13, Desktop 1920x1080) and local Vite preview server.
  - Create `docs/playwright-setup.md` outlining how to run live browser tests with `@playwright/test`.

- [x] **Step 4: Commit changes locally**
  ```bash
  git add src/tests/e2e-user-journeys.test.ts playwright.config.ts docs/playwright-setup.md
  git commit -m "test(e2e): implement comprehensive 8-journey test suite and Playwright configuration template"
  ```

---

### Task 6: Client-Side Error Diagnostics & Version Update Playbook

**Files:**
- Modify: `src/components/ErrorBoundary.tsx`
- Modify: `src/components/ErrorBoundary.test.tsx`
- Create: `docs/checklists/version-update-playbook.md`

**Interfaces:**
- Consumes: React ErrorInfo, `getStorageSchemaVersion()`, `CHARACTERS`, `getSavedRoster`, `getSavedWeapons`
- Produces: Downloadable client diagnostic report JSON, Version Update SOP markdown document

- [x] **Step 1: Write failing test for ErrorBoundary diagnostic download**
  In `src/components/ErrorBoundary.test.tsx`, add a test verifying:
  - Error state displays "Download Error Report" button.
  - Clicking triggers JSON generation with error message, stack trace, active URL, and sanitized app state (character count, weapon count, schema version).

- [x] **Step 2: Run test to verify it fails**
  Run: `pnpm test src/components/ErrorBoundary.test.tsx`
  Expected: FAIL.

- [x] **Step 3: Implement diagnostic download in `ErrorBoundary.tsx`**
  - Add `handleDownloadReport()` creating a sanitized JSON blob:
    ```json
    {
      "timestamp": "2026-11-16T22:00:00.000Z",
      "error": "Error message",
      "stack": "...",
      "componentStack": "...",
      "userAgent": "...",
      "url": "http://localhost:5173",
      "schemaVersion": 2,
      "rosterCount": 11,
      "weaponCount": 8
    }
    ```
  - Render "Download Error Report" button with `Download` icon next to "Try Again" and "Reload Page".

- [x] **Step 4: Author `docs/checklists/version-update-playbook.md`**
  Create comprehensive SOP covering:
  - Step 1: Upstream Data Extraction (Character kits, weapons, artifact sets, talent curves)
  - Step 2: SSOT Markdown & Verification Synchronization (`scripts/generate-reference.cjs`)
  - Step 3: Event & Schedule Updates (Spiral Abyss cycles, Imaginarium Theater seasons, Banners)
  - Step 4: Storage Migration & Schema Version Bump (if format changes)
  - Step 5: Automated Quality Gate (`pnpm test`, `pnpm run build`, `git diff --exit-code`)
  - Step 6: Deployment Verification (Vercel inspection, mobile checks)

- [x] **Step 5: Run tests to verify they pass**
  Run: `pnpm test src/components/ErrorBoundary.test.tsx`
  Expected: PASS.

- [x] **Step 6: Commit changes locally**
  ```bash
  git add src/components/ErrorBoundary.tsx src/components/ErrorBoundary.test.tsx docs/checklists/version-update-playbook.md
  git commit -m "feat(diagnostics): add client error report export and author version update playbook SOP"
  ```

---

## Verification & Final Audit
- Run full Vitest suite: `pnpm test` (all 20+ test files passing).
- Run production build: `pnpm run build` (tsc strict typecheck and vite build exit code 0).
- Run SSOT reference generator: `node scripts/generate-reference.cjs` (reference markdown intact).
- Verify git status: clean working tree, commits strictly on local `master`.
- Update `walkthrough.md` with complete M3 accomplishments, CI setup, and verification evidence.
