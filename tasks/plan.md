# Implementation Plan: M1 — Account Reliability & Data Safety

## Overview
Comprehensive account reliability and data safety upgrades for Project Celestia v2 (Version 7.2 baseline). This milestone isolates Demo Mode into a dedicated storage namespace, makes all storage write operations return deterministic boolean status with diagnostic capture, expands account reset to wipe all 8 user keys, guarantees atomic two-phase backup restoration with automatic rollback, and displays last backup metadata with recovery guidance.

## Architecture Decisions
- **Demo Mode Storage Namespace**: Route all reads and writes through `DEMO_*` keys (`celestia_v2_demo_profiles`, `celestia_v2_demo_weapons`, `celestia_v2_demo_roster`) when `isDemoModeEnabled()` is true.
- **Explicit Storage Mutation Contracts**: `saveProfiles`, `saveWeapons`, `saveArtifacts`, `saveRoster`, `saveUid`, `savePullBudget`, `saveAbyssCycleId`, and `saveCustomAbyss` return `boolean` status flags; diagnostic errors captured in `getLastStorageError()`.
- **Atomic Two-Phase Restore**: 
  1. Capture pre-restore safety snapshot in `celestia_backup_pre_restore` (abort restore if snapshot fails).
  2. Write all keys sequentially and record success status.
  3. If any write fails, automatically execute `rollbackToBackup('celestia_backup_pre_restore')` and return `{ success: false, rolledBack: true }`.
- **Complete Account Reset**: `resetAccountData()` wipes all 8 user keys: `roster`, `profiles`, `weapons`, `artifacts`, `active_uid`, `pull_budget`, `abyss_cycle_id`, `custom_abyss`.
- **Backup Metadata Tracking**: Record `celestia_last_backup_meta` upon export and display in `AccountBackupModal.tsx`.

## Task List

### Phase 1: Storage Namespace Isolation & Error Diagnostics
- [x] Task 1.1: Demo Mode Storage Namespace Isolation (`src/services/storage.ts`, `src/App.tsx`, `src/services/storage.test.ts`)
- [x] Task 1.2: Deterministic Storage Mutation Contracts & Diagnostic Capture (`src/services/storage.ts`, `src/services/storage.test.ts`)

### Checkpoint: Storage Hardening
- [x] Demo mode mutations do not overwrite authentic player data
- [x] Disabling demo mode restores authentic profiles without data loss
- [x] QuotaExceededError and SecurityError captured in `getLastStorageError()`

### Phase 2: Complete Reset & Atomic Restore
- [x] Task 1.3: Comprehensive Account Reset across All 8 User Keys (`src/services/storage.ts`, `src/App.tsx`, `src/services/storage.test.ts`)
- [x] Task 1.4: Two-Phase Transactional Backup Restore with Automatic Rollback (`src/services/backup.ts`, `src/services/backup.test.ts`)

### Checkpoint: Restore Integrity
- [x] Simulated write failures trigger automatic rollback to pre-restore snapshot
- [x] Incomplete / corrupted imports return `{ success: false, rolledBack: true }`
- [x] Account reset completely wipes all 8 keys including UID and pull budget

### Phase 3: Metadata Tracking, UI & Documentation
- [x] Task 1.5: Backup Metadata Tracking & Recovery Guidance UX (`src/services/backup.ts`, `src/components/AccountBackupModal.tsx`)
- [x] Task 1.6: Architecture Decision Record ADR-001 (`docs/decisions/0001-storage-namespace-and-atomic-restore.md`)

### Checkpoint: Complete
- [x] All 23 Vitest test suites pass (324 tests)
- [x] `npx tsc -b` passes with 0 errors
- [x] `pnpm run build` succeeds
- [x] Live browser audit confirms demo isolation and modal UX

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| QuotaExceededError during snapshot creation | High | If pre-restore snapshot fails, restore aborts immediately before modifying storage. |
| Incomplete rollback leaving partial data | High | Rollback wipes restored keys before reapplying snapshot. |
| Legacy v1 backup rejection | Medium | Validator normalizes missing optional fields with safe defaults. |
