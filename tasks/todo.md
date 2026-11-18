# Task List: M1 — Account Reliability & Data Safety

- [x] Task 1.1: Demo Mode Storage Namespace Isolation
  - Acceptance: Demo mode profiles, weapons, and roster are isolated to `celestia_v2_demo_*` keys; real account records are untouched when demo mode is enabled or disabled.
  - Verify: `pnpm vitest run src/services/storage.test.ts`
  - Files: `src/services/storage.ts`, `src/App.tsx`, `src/services/storage.test.ts`

- [x] Task 1.2: Deterministic Storage Mutation Contracts & Diagnostic Capture
  - Acceptance: All `save*` methods return explicit `boolean` values; `QuotaExceededError` and write failures are safely caught and surfaced via `getLastStorageError()`.
  - Verify: `pnpm vitest run src/services/storage.test.ts`
  - Files: `src/services/storage.ts`, `src/services/storage.test.ts`

- [x] Task 1.3: Comprehensive Account Reset across All 8 User Keys
  - Acceptance: `resetAccountData()` wipes all 8 account keys (`roster`, `profiles`, `weapons`, `artifacts`, `active_uid`, `pull_budget`, `abyss_cycle_id`, `custom_abyss`); `App.tsx` synchronizes React state.
  - Verify: `pnpm vitest run src/services/storage.test.ts`
  - Files: `src/services/storage.ts`, `src/App.tsx`, `src/services/storage.test.ts`

- [x] Task 1.4: Two-Phase Transactional Backup Restore with Automatic Rollback
  - Acceptance: Restores capture pre-restore safety snapshot; any failure during sequential writes triggers `rollbackToBackup` and returns `{ success: false, rolledBack: true }`.
  - Verify: `pnpm vitest run src/services/backup.test.ts`
  - Files: `src/services/backup.ts`, `src/services/backup.test.ts`

- [x] Task 1.5: Backup Metadata Tracking & Recovery Guidance UX
  - Acceptance: Exporting a backup updates `celestia_last_backup_meta`; `AccountBackupModal.tsx` displays timestamp, character/weapon counts, and rollback controls.
  - Verify: `pnpm vitest run src/services/backup.test.ts`, manual modal inspection
  - Files: `src/services/backup.ts`, `src/components/AccountBackupModal.tsx`

- [x] Task 1.6: Architecture Decision Record ADR-001 & Technical Documentation
  - Acceptance: ADR-001 documented in `docs/decisions/0001-storage-namespace-and-atomic-restore.md`; task tracking synchronized.
  - Verify: Markdown review and repository consistency
  - Files: `docs/decisions/0001-storage-namespace-and-atomic-restore.md`, `tasks/plan.md`, `tasks/todo.md`
