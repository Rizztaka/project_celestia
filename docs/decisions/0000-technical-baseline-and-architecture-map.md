# ADR-000: Technical Baseline, Codebase Audit & Architecture Map

## Status
Accepted

## Date
2026-11-18

## Context
Project Celestia v2 is a client-side Genshin Impact companion targeting Version 7.2 (Nod-Krai / Snezhnaya / Celestia era), supporting:
- 128 canonical playable characters (including 6 element-specific Traveler configurations)
- 256 combat and progression weapons
- 64 master artifact sets (37 combat sets modeled with roll valuation and weight profiles)

Milestone M0 establishes an empirical technical baseline across architecture, data safety, performance, testing, and deployment before initiating feature development or optimization.

### Key Audit Findings
1. **Critical Data Safety Vulnerabilities (P0)**:
   - **Demo Mode**: Enabling demo mode overwrote production `localStorage` keys (`celestia_v2_roster_profiles` and `celestia_v2_raw_weapons`). Disabling demo mode executed `resetAccountData()`, permanently deleting real player profiles.
   - **Non-Atomic Restore**: Backup restoration called storage save functions sequentially without verifying return status or atomicity. Storage quota errors or write exceptions resulted in partial data writes while returning `{ success: true }`.
   - **Incomplete Account Reset**: `resetAccountData()` only removed roster, profiles, weapons, and artifacts, leaving `active_uid`, `pull_budget`, `abyss_cycle_id`, and `custom_abyss` intact in browser storage.

2. **Architectural Coupling & Graph Analysis (AST)**:
   - AST and community detection via `graphify` revealed a graph of 591 nodes, 1,643 edges, and 23 distinct communities.
   - High-centrality "God Nodes":
     - `getWeaponByKey()` (degree 38): Tightly coupled across solver engines, UI views, armory, and storage.
     - `OwnedCharacterProfile` (degree 33): Root data type bound across 30+ files without domain boundary abstraction.
     - `CharacterDetailModal()` (degree 30): Monolithic modal handling build details, weapon quick-swap, talent scaling, and constellation toggling.
     - `OwnedWeapon` (degree 26): Core weapon bag inventory model.
     - `App()` (degree 25): Shell component managing tab transitions, notifications, Enka sync, and modal states.

3. **Bundle Performance**:
   - Total uncompressed JavaScript payload on root mount exceeds 1.73 MB (361.4 kB gzip).
   - Eager imports in `src/services/storage.ts` cause Vite to emit `<link rel="modulepreload">` for `genshin-characters` (857.66 kB) and `genshin-weapons` (466.31 kB) immediately on initial page load.
   - `chunkSizeWarningLimit` was raised to 2,000 KB in `vite.config.ts` to suppress build warnings instead of structuring true lazy loading.

4. **Accessibility (a11y) & Mobile UX**:
   - Live browser testing on Desktop (1920x1080) and Mobile (390x844) revealed:
     - Heading hierarchy skips `<h2>` in recommendation cards.
     - UID input lacks `<label>` or `aria-label`.
     - Armory modal lacks `role="dialog"` and `aria-modal="true"`.
     - **Armory modal fails to close on `Escape` key**, occluding background elements and trapping keyboard navigation.
     - Mobile touch targets for constellation buttons (`C0`–`C6`) are only 24x24px, and navigation buttons are 28px height, violating WCAG 2.5.5 minimum 44x44px target requirements.
     - Subresource Opaque Response Blocking (ORB) drops external MiHoYo equipment icon requests.

5. **CI/CD Hygiene**:
   - `.github/workflows/quality-gate.yml` is titled "Lint, Test, Build, SSOT" but contains zero linting commands.
   - `package.json` lacks a `lint` script and linter dependency.
   - `playwright.config.ts` exists in the repository root, but `@playwright/test` is absent from `package.json`, and the `./e2e` test directory does not exist. All current journey tests are mocked in Vitest JSDOM.

## Decision
1. **Preserve Clean Client-Side Architecture**: Retain the 100% client-side React 19 + TypeScript + Vite architecture. Do not introduce backend servers or heavy database runtimes.
2. **Prioritize Data Safety (Milestone M1)**:
   - Namespace demo mode completely into `celestia_v2_demo_*` keys or memory. Real account data must never be modified by demo toggles.
   - Make all storage operations return explicit boolean status flags.
   - Implement transactional backup restore with automatic rollback to a pre-restore safety snapshot on write failure.
   - Expand `resetAccountData()` to clear all 8 account keys.
3. **Formalize CI Quality Gates (Milestone M2)**:
   - Introduce Biome or ESLint with strict type and lint rules.
   - Pin `@playwright/test` and author genuine browser-driven E2E tests under `./e2e` executing against `vite preview`.
4. **Data Slicing & Chunk Optimization (Milestone M3)**:
   - Decouple static data dependencies from `storage.ts` so `genshin-characters` and `genshin-weapons` are only dynamically fetched when character views or armory drawers mount.
   - Enforce a 500 KB chunk budget and restore standard `chunkSizeWarningLimit`.
5. **Accessibility Hardening**:
   - Add proper modal dialog attributes (`role="dialog"`, `aria-modal="true"`, focus trapping, `Escape` key handlers).
   - Expand mobile touch targets to >= 44x44px.

## Consequences
- **Positive**:
  - Full transparency into real technical risks without premature optimizations or unverified claims.
  - User accounts and rosters are protected against data corruption and accidental resets.
  - Clear roadmap with testable milestones (M1 through M6).
- **Negative / Trade-offs**:
  - M0 deliberately introduces zero feature code modifications to maintain baseline reproducibility.
  - Data modularization in M3 will require adjusting top-level imports in `storage.ts` and `App.tsx`.
