# Milestone M1: Account Reliability and Data Safety Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Completely isolate Demo Mode data into a protected storage namespace, make all storage operations explicit with error detection, enforce atomic two-phase backup restores with automatic rollback, expand account reset to all 8 user keys, and present last backup status with clear recovery instructions.

**Architecture:** 
1. **Demo Namespace Routing**: Transparently route storage mutations and reads through `DEMO_*` keys (`celestia_v2_demo_profiles`, `celestia_v2_demo_weapons`, `celestia_v2_demo_roster`) when `isDemoModeEnabled()` is true, guaranteeing authentic player records in `celestia_v2_*` can never be overwritten or deleted by Demo Mode toggles.
2. **Deterministic Mutation Status & Error Diagnostics**: Upgrade all storage write functions (`saveProfiles`, `saveWeapons`, `saveArtifacts`, `saveRoster`, `saveUid`, `savePullBudget`, `saveAbyssCycleId`, `saveCustomAbyss`) to return `boolean` status flags, capturing detailed diagnostics (`QuotaExceededError`, `SecurityError`, parse failures) in `getLastStorageError()`.
3. **Two-Phase Transactional Backup Restore**: Execute restores atomically by: (a) verifying and capturing a pre-restore safety snapshot, (b) executing all key writes while collecting status booleans, and (c) automatically rolling back from the snapshot if any write fails.
4. **Complete Account Reset**: Expand `resetAccountData()` to wipe all 8 user-specific keys (`roster`, `profiles`, `weapons`, `artifacts`, `active_uid`, `pull_budget`, `abyss_cycle_id`, `custom_abyss`), synchronizing local React state in `App.tsx`.
5. **Backup Metadata & Recovery Guidance**: Track `celestia_last_backup_meta` on export and surface it in `AccountBackupModal.tsx` alongside recovery instructions.

**Tech Stack:** TypeScript, React 19, Vitest, HTML5 Web Storage API (`localStorage`), Tailwind CSS v4.

**Spec Reference:**
- [`docs/audit/m0-technical-baseline.md`](file:///d:/Genshin%20Personal/project-celestia/docs/audit/m0-technical-baseline.md)
- [`docs/decisions/0000-technical-baseline-and-architecture-map.md`](file:///d:/Genshin%20Personal/project-celestia/docs/decisions/0000-technical-baseline-and-architecture-map.md)

---

## Global Constraints

- **Active Version Floor**: Version 7.2 (Nod-Krai / Snezhnaya / Celestia era) with all 128 canonical characters, 256 weapons, and 64 artifact sets.
- **Dependency Ceiling**: Zero external runtime dependencies added (vanilla TypeScript schema validation adheres strictly to the Ponytail principle).
- **Storage Contract**: All write operations must return a boolean indicating success or failure. Never swallow write errors silently.
- **Fail-Safe Integrity**: If an import or write operation encounters a quota or parsing error, the system must either complete fully or roll back completely without leaving partial data.
- **Test Integrity**: Full Vitest test suite must pass with 100% success (318 baseline -> 324 passing tests).

---

## Review Focus (Adversarial Stress Cases)

1. **Storage Quota Exhaustion (`QuotaExceededError`) During Restore**: When `localStorage` is near capacity, snapshot creation or sequential writes may fail. The system must abort before touching keys or execute `rollbackToBackup` immediately, leaving no corrupted half-states.
2. **Private Browsing / Blocked Storage (`SecurityError`)**: When cookies/storage are disabled by the browser, `localStorage.setItem` throws `SecurityError`. Handlers must catch this, return `false`, set `lastStorageError`, and avoid uncaught UI crashes.
3. **Corrupted / Malformed Storage JSON**: If keys contain non-JSON garbage, all `getSaved*` readers must catch `SyntaxError`, log a warning, and fall back safely to empty defaults rather than crashing the component tree.
4. **Demo Mode Toggle Cross-Contamination**: Toggling Demo Mode ON, modifying characters, and toggling Demo Mode OFF must leave the authentic account exactly as it was, with zero demo characters leaked and zero authentic data erased.
5. **Partial / Legacy Schema Restores (Schema v1 vs v2)**: Older backups lacking `customAbyssConfig` or `pullBudget` must be gracefully normalized with defaults rather than rejecting valid user accounts.

---

## Task Structure & Implementation Plan

### Task 1: Demo Mode Storage Namespace Isolation

**Files:**
- Modify: `src/services/storage.ts`
- Modify: `src/App.tsx`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Consumes: `isDemoModeEnabled(): boolean` from `src/services/storage.ts`
- Produces: `DEMO_PROFILES_KEY = 'celestia_v2_demo_profiles'`, `DEMO_WEAPONS_KEY = 'celestia_v2_demo_weapons'`, `DEMO_ROSTER_KEY = 'celestia_v2_demo_roster'`

- [ ] **Step 1: Write failing unit test for Demo Mode isolation**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement namespace routing in `storage.ts` & update `App.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify zero TypeScript errors**

---

### Task 2: Explicit Storage Return Status & Error Capture

**Files:**
- Modify: `src/services/storage.ts`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Consumes: `localStorage.setItem`, `localStorage.getItem`
- Produces: `getLastStorageError(): string | null`, `clearLastStorageError(): void`, boolean return on all `save*` methods

- [ ] **Step 1: Write failing unit test for storage write failure and diagnostics**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement explicit boolean returns and error recording in `storage.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify zero TypeScript errors**

---

### Task 3: Comprehensive Account Reset Across All 8 User Keys

**Files:**
- Modify: `src/services/storage.ts`
- Modify: `src/App.tsx`
- Test: `src/services/storage.test.ts`

**Interfaces:**
- Consumes: `ACCOUNT_SPECIFIC_KEYS`
- Produces: `resetAccountData(): void` which removes all 8 keys

- [ ] **Step 1: Write failing test verifying reset clears UID, Pull Budget, and Abyss data**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Update `resetAccountData` in `storage.ts` and `handleResetAccount` in `App.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify zero TypeScript errors**

---

### Task 4: Two-Phase Atomic Backup Restore with Automatic Rollback

**Files:**
- Modify: `src/services/backup.ts`
- Test: `src/services/backup.test.ts`

**Interfaces:**
- Consumes: `createSafetySnapshot(key): boolean`, `rollbackToBackup(key): boolean`
- Produces: `importAccountBackup(backup: CelestiaBackupData): { success: boolean; error?: string; rolledBack?: boolean }`

- [ ] **Step 1: Write failing test for automatic rollback on write failure**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement two-phase atomic restore and rollback in `backup.ts`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify zero TypeScript errors**

---

### Task 5: Backup Metadata Tracking & Recovery UX

**Files:**
- Modify: `src/services/backup.ts`
- Modify: `src/components/AccountBackupModal.tsx`
- Test: `src/services/backup.test.ts`

**Interfaces:**
- Consumes: `LAST_BACKUP_META_KEY = 'celestia_last_backup_meta'`
- Produces: `recordLastBackupMeta`, `getLastBackupMeta`

- [ ] **Step 1: Write failing test for backup metadata tracking**
- [ ] **Step 2: Run test to verify it fails**
- [ ] **Step 3: Implement metadata tracking and UI indicator in `AccountBackupModal.tsx`**
- [ ] **Step 4: Run test to verify it passes**
- [ ] **Step 5: Verify zero TypeScript errors**

---

### Task 6: Architecture Decision Record ADR-001 & Full Verification

**Files:**
- Create: `docs/decisions/0001-storage-namespace-and-atomic-restore.md`
- Modify: `tasks/plan.md`
- Modify: `tasks/todo.md`

- [ ] **Step 1: Author ADR-001**
- [ ] **Step 2: Execute full verification suite (`pnpm test`, `npx tsc -b`, `pnpm run build`)**

---

## Verification Plan

### Automated Tests
1. `pnpm test src/services/storage.test.ts`
2. `pnpm test src/services/backup.test.ts`
3. `pnpm test` (all 23 suites, >= 324 tests)
4. `npx tsc -b`
5. `pnpm run build`
