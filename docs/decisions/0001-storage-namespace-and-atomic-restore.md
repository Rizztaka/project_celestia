# ADR-001: Storage Namespace Isolation & Atomic Backup Restore

## Status
Accepted

## Date
2026-11-18 (Updated 2026-11-22)

## Context
Project Celestia operates client-first, persisting player rosters, character profiles, weapon armory records, pull budgets, and custom Spiral Abyss configurations directly into browser `localStorage`.
Prior to Milestone M1, two critical data safety vulnerabilities existed:
1. **Demo Mode Data Overwrite**: Enabling Demo Mode wrote mock profiles and starter weapons directly to `celestia_v2_roster_profiles` and `celestia_v2_raw_weapons`. Disabling Demo Mode invoked `resetAccountData()`, permanently deleting real player accounts. Furthermore, modifying UID, Pull Budget, or Spiral Abyss configurations while in Demo Mode leaked directly into the real user's storage keys.
2. **Non-Atomic Backup Restore**: `importAccountBackup()` executed storage writes sequentially without verifying that each write succeeded. In the event of a storage failure (such as quota exhaustion), writes were left half-applied and the pre-restore snapshot was not automatically restored, risking account state corruption. Furthermore, `resetAccountData()` left UID, pull budget, and Abyss custom configurations orphaned in storage.

## Decision
1. **Full 8-Domain Namespace Isolation for Demo Mode**:
   - Introduce dedicated demo keys across all 8 user storage domains (`celestia_v2_demo_roster`, `celestia_v2_demo_profiles`, `celestia_v2_demo_weapons`, `celestia_v2_demo_artifacts`, `celestia_v2_demo_uid`, `celestia_v2_demo_pull_budget`, `celestia_v2_demo_abyss_cycle_id`, `celestia_v2_demo_custom_abyss`).
   - Route storage read/write operations dynamically according to `isDemoModeEnabled()`.
   - In `App.tsx`, toggling Demo Mode off reloads authentic user account data from the real storage namespace instead of calling `resetAccountData()`. Guarded with `skipNextPersistRef` and key-based re-hydration to prevent namespace cross-contamination.
2. **Complete Account Reset**:
   - `resetAccountData()` purges all 8 user account keys (`ROSTER_KEY`, `PROFILES_KEY`, `WEAPONS_KEY`, `ARTIFACTS_KEY`, `UID_KEY`, `PULL_BUDGET_KEY`, `ABYSS_CYCLE_ID_KEY`, `CUSTOM_ABYSS_KEY`) and all 8 demo namespace records.
3. **Transactional Atomic Backup Restore with Automatic Rollback**:
   - Before applying any restored keys, `importAccountBackup()` creates a pre-restore safety snapshot (`celestia_backup_pre_restore`).
   - Deeply validates incoming backup structure (including multi-chamber custom Abyss configurations, weapon levels/refinements, talent levels 1-15, M8 pull budget fields, and UID formats).
   - Detects cross-account identity conflicts (`detectAccountConflict`) and guards against accidental overwriting of a different UID unless `forceOverwrite` is confirmed.
   - Automatically upgrades legacy v1 backups (`normalizeBackupPayload`) by resolving weapon aliases and hydrating complete M8 wish math fields.
   - Tracks all write operations; if any write fails (e.g. `QuotaExceededError`) or post-write verification fails across profiles, weapons count, budget, or UID, `rollbackPreRestoreBackup()` is automatically triggered, guaranteeing all modifications are rolled back.
4. **Error Diagnostics and Classification**:
   - Storage errors are classified via `StorageErrorCode` (`STORAGE_UNAVAILABLE`, `QUOTA_EXCEEDED`, `MALFORMED_JSON`, `UNKNOWN`) and captured in `getLastStorageErrorInfo()`.
   - Read operations catch and classify JSON syntax errors without throwing.
   - All storage write operations return explicit booleans rather than swallowing errors.
5. **Backup Metadata Tracking & Recovery Guidance**:
   - Records metadata (`exportedAt`, `characterCount`, `weaponCount`, `artifactCount`) into `celestia_last_backup_meta` upon backup export, allowing UI surfaces to display the last successful backup timestamp and recovery status with step-by-step recovery guidance.

## Consequences
- **Positive**: Real player rosters, armories, budgets, UIDs, and builds cannot be overwritten or deleted by Demo Mode.
- **Positive**: Failed restores leave zero half-written state; storage failures automatically revert to the exact pre-restore snapshot.
- **Positive**: Account resets are complete and predictable across all fields.
- **Positive**: All storage write operations return explicit booleans rather than swallowing errors, surfacing clear toast notifications to users when quota is reached.
- **Positive**: Cross-account restores require explicit overwrite confirmation, preventing accidental data loss when sharing or testing different accounts.
