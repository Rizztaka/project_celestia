# ADR-001: Storage Namespace Isolation & Atomic Backup Restore

## Status
Accepted

## Date
2026-11-18

## Context
Project Celestia operates client-first, persisting player rosters, character profiles, weapon armory records, pull budgets, and custom Spiral Abyss configurations directly into browser `localStorage`.
Prior to Milestone M1, two critical data safety vulnerabilities existed:
1. **Demo Mode Data Overwrite**: Enabling Demo Mode wrote mock profiles and starter weapons directly to `celestia_v2_roster_profiles` and `celestia_v2_raw_weapons`. Disabling Demo Mode invoked `resetAccountData()`, permanently deleting real player accounts.
2. **Non-Atomic Backup Restore**: `importAccountBackup()` executed storage writes sequentially without verifying that each write succeeded. In the event of a storage failure (such as quota exhaustion), writes were left half-applied and the pre-restore snapshot was not automatically restored, risking account state corruption. Furthermore, `resetAccountData()` left UID, pull budget, and Abyss custom configurations orphaned in storage.

## Decision
1. **Namespace Isolation for Demo Mode**:
   - Introduce dedicated demo keys (`celestia_v2_demo_roster`, `celestia_v2_demo_profiles`, `celestia_v2_demo_weapons`, `celestia_v2_demo_artifacts`).
   - Route storage read/write operations dynamically according to `isDemoModeEnabled()`.
   - In `App.tsx`, toggling Demo Mode off reloads authentic user account data from the real storage namespace instead of calling `resetAccountData()`.
2. **Complete Account Reset**:
   - `resetAccountData()` purges all user account keys (`ROSTER_KEY`, `PROFILES_KEY`, `WEAPONS_KEY`, `ARTIFACTS_KEY`, `UID_KEY`, `PULL_BUDGET_KEY`, `ABYSS_CYCLE_ID_KEY`, `CUSTOM_ABYSS_KEY`) and clears cached demo namespace records.
3. **Transactional Atomic Backup Restore with Automatic Rollback**:
   - Before applying any restored keys, `importAccountBackup()` creates a pre-restore safety snapshot (`celestia_backup_pre_restore`).
   - Validates incoming backup structure (including multi-chamber custom Abyss configurations).
   - Tracks all write operations; if any write fails (e.g. `QuotaExceededError`) or post-write verification fails, `rollbackPreRestoreBackup()` is automatically triggered, guaranteeing all modifications are rolled back.
4. **Backup Metadata Tracking**:
   - Records metadata (`exportedAt`, `characterCount`, `weaponCount`, `artifactCount`) into `celestia_last_backup_meta` upon backup export, allowing UI surfaces to display the last successful backup timestamp and recovery status.

## Consequences
- **Positive**: Real player rosters and builds cannot be overwritten or deleted by Demo Mode.
- **Positive**: Failed restores leave zero half-written state; storage failures automatically revert to the exact pre-restore snapshot.
- **Positive**: Account resets are complete and predictable across all fields.
- **Positive**: All storage write operations return explicit booleans rather than swallowing errors.
