# Project Celestia — Milestone M0: Technical Audit & Baseline Report

> **Audit Date**: 2026-11-18  
> **Auditor**: Antigravity Technical Agent (Solo Routine)  
> **Baseline Version**: Genshin Impact Version 7.2 (Nod-Krai / Snezhnaya / Celestia)  
> **Milestone Status**: **M0 Completed — Baseline Established**  
> **Production Code Status**: Clean (Zero unintended diffs, zero feature code modifications)

---

## Executive Summary

Milestone M0 established an empirical, unvarnished baseline of Project Celestia v2 across toolchain integrity, user journeys, bundle slicing, CI/CD pipelines, runtime layout, throttled performance, and persistent data safety.

**Key Baseline Metrics**:
- **TypeScript Check (`tsc -b`)**: 0 errors (100% strict type check pass).
- **Vitest Test Suite**: 23 test files, 318 tests passing in ~8.74 seconds.
- **SSOT Reference Integrity**: 128 playable characters, 256 weapons, 64 artifact sets verified via `scripts/generate-reference.cjs`.
- **Dependency Hygiene**: `pnpm install --frozen-lockfile` clean; 0 production vulnerabilities (`pnpm audit --prod`).
- **Initial Bundling Weight**: 1,641.23 kB raw JS (347.4 kB gzip) preloaded immediately on root mount.
- **Primary Risks Uncovered**: 2 Critical Data Loss vulnerabilities (P0) in Demo Mode and Backup Restore, and 2 High-priority gaps (P1) in UID Sync and CI browser testing.

---

## 1. Toolchain & Dependency Verification

| Tool / Check | Command | Result | Notes |
| :--- | :--- | :--- | :--- |
| **Lockfile Sync** | `pnpm install --frozen-lockfile` | **PASS** | Clean install in 555ms, zero lockfile drift. |
| **Security Audit** | `pnpm audit --prod` | **PASS** | 0 vulnerabilities found in production dependencies. |
| **Strict TypeScript** | `pnpm exec tsc -b` | **PASS** | Strict mode passed with 0 compilation errors. |
| **Unit & Journey Tests** | `pnpm test` | **PASS** | 23 test suites, 318 passed in 8.74s across 23 worker threads. |
| **Reference SSOT Sync**| `node scripts/generate-reference.cjs` | **PASS** | Synchronized `docs/knowledge/celestia-reference.md` with zero diff. |
| **Git Working Tree** | `git status --porcelain` | **PASS** | Working tree clean prior to audit report generation. |

---

## 2. Architecture & Bundle Slicing Analysis

Inspection of `vite.config.ts`, `dist/index.html`, and `dist/assets/` revealed that while view components (`TeamGeneratorView`, `PullAdvisorView`, `EndgameView`, `ArtifactStopView`, `RosterView`) use dynamic `React.lazy()` imports, **the large static game databases are eagerly bundled into the initial root load**.

### Root Bundle Weight & Preload Map

| Asset / Chunk | Raw Size | Gzip Size | Preloaded on `/` | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-DpL5hL05.js` | 286.50 kB | 87.47 kB | **Yes (`<script>`)** | Entry application logic, React 19 runtime, App shell. |
| `dist/assets/genshin-characters-CSFPFW_0.js` | 857.66 kB | 207.45 kB | **Yes (`<link rel="modulepreload">`)** | Complete 128-character registry, stats, and talent curves. |
| `dist/assets/genshin-weapons-CL7qpcvN.js` | 466.31 kB | 44.60 kB | **Yes (`<link rel="modulepreload">`)** | Complete 256-weapon registry, stats, and refinement curves. |
| `dist/assets/vendor-lucide-DMaibGop.js` | 30.76 kB | 7.92 kB | **Yes (`<link rel="modulepreload">`)** | Shared UI iconography. |
| `dist/assets/index-D-CN943a.css` | 92.28 kB | 14.00 kB | **Yes (`<link rel="stylesheet">`)** | Tailwind CSS v4 styling rules. |
| **Initial Root Subtotal** | **1,733.51 kB** | **361.44 kB** | **Preloaded** | **Total payload required before interactive mount.** |
| `dist/assets/genshin-artifacts-C7AulyBJ.js` | 116.01 kB | 27.82 kB | No (Lazy) | 64 Master sets & 37 combat sets. |
| `dist/assets/EndgameView-D9yQtr9p.js` | 87.50 kB | 21.51 kB | No (Lazy) | Abyss & Imaginarium Theater solvers. |
| `dist/assets/PullAdvisorView-BKt7hAaf.js` | 68.08 kB | 18.34 kB | No (Lazy) | Gacha probability calculation view. |
| `dist/assets/CharacterDetailModal-CrJ2R_AR.js`| 53.96 kB | 14.59 kB | No (Lazy) | Character inspection & constellation modal. |
| `dist/assets/ArtifactStopView-B2_AW8xd.js` | 46.22 kB | 12.37 kB | No (Lazy) | Artifact stop-point diminishing returns calculator. |
| `dist/assets/genshin-rotations-DOfpO4s_.js` | 35.75 kB | 10.63 kB | No (Lazy) | 128 calibrated character rotation profiles. |
| `dist/assets/RosterView-B0Q_0TFd.js` | 32.40 kB | 9.21 kB | No (Lazy) | Character roster grid and selection. |
| `dist/assets/TeamGeneratorView-B_TkJ6WB.js` | 20.62 kB | 5.55 kB | No (Lazy) | Primary team recommendation view. |
| `dist/assets/WeaponConflictModal-CKImhZoC.js` | 15.93 kB | 4.16 kB | No (Lazy) | Weapon collision resolution dialog. |
| `dist/assets/team-generator-r1vWNUUl.js` | 11.99 kB | 4.37 kB | No (Lazy) | Core team generation algorithm. |

### Root Cause of Eager Data Preloading
In `src/services/storage.ts`:
- Line 4: `import { getWeaponByKey } from '../data/weapons';`
- Line 5: `import { CHARACTERS } from '../data/characters';`

Because `src/App.tsx` imports `getSavedProfiles` and `getSavedWeapons` directly from `storage.ts` at the top level, Rollup statically links `src/data/characters.ts` and `src/data/weapons.ts` into the entry graph. As a result, Vite emits `<link rel="modulepreload">` for both chunks.

---

## 3. User Journey Tracing (UI → Engine → Storage)

| Journey | UI Component | Service / Engine Layer | Persistence Mechanism | Audit Status & Vulnerabilities |
| :--- | :--- | :--- | :--- | :--- |
| **1. First Visit** | `App.tsx`, `Navbar.tsx` | `storage.ts:isDemoModeEnabled` | `localStorage:celestia_v2_demo_mode` | **P0 Defect**: Toggling Demo Mode overwrites real profiles; disabling Demo Mode wipes all data. |
| **2. Roster Management** | `RosterView.tsx` | `storage.ts:saveProfiles` | `localStorage:celestia_v2_roster_profiles` | **Normal**: Roster updates sync to both profiles and roster keys. |
| **3. Profiles & Armory** | `CharacterDetailModal`, `ArmoryDrawer` | `storage.ts:equipWeaponToProfile` | `localStorage:celestia_v2_raw_weapons` | **Normal**: Weapon transfers are atomic; category mismatch errors properly prevent equipping incompatible weapons. |
| **4. UID Import** | `UIDSyncModal.tsx` | `enka.ts:fetchShowcaseFromEnka` | `localStorage:celestia_v2_active_uid` | **P1 Defect**: Only imports public showcase IDs (max 8-12); sets default Level 90 C0; does not fetch weapons or artifacts. |
| **5. Team Recommendations**| `TeamGeneratorView.tsx` | `team-generator.ts:generateTeams` | Pure In-Memory Computation | **Normal**: Respects owned roster; excludes duplicate Travelers; uses heuristic archetype scoring. |
| **6. Endgame Solvers** | `EndgameView.tsx` | `abyss-solver.ts`, `theater-solver.ts` | `localStorage:celestia_v2_custom_abyss` | **Normal**: Chamber drafts prevent character overlaps; Theater vigor models cast limitations. |
| **7. Pull Advisor** | `PullAdvisorView.tsx` | `pull-advisor.ts`, `gacha-math.ts` | `localStorage:celestia_v2_pull_budget` | **Normal**: 22 mathematical test cases verified for pity, guarantee, and Capturing Radiance. |
| **8. Backup & Restore** | `BackupModal.tsx` | `backup.ts:importAccountBackup` | All `celestia_v2_*` keys | **P0 Defect**: Storage writes swallow errors and return `void`; restore returns `{ success: true }` even on quota or write failure. |

---

## 4. Performance & Telemetry Baseline

Audited against local production preview server (`http://localhost:4173`) running compiled production assets:

### Desktop Baseline (Unthrottled Broadband)
- **HTML Document Load (`GET /`)**: 26.34 ms (1,401 bytes)
- **Entry Script Load (`index.js`)**: 4.75 ms (279.78 KB)
- **Character Database Load (`genshin-characters.js`)**: 5.63 ms (837.56 KB)
- **Weapon Database Load (`genshin-weapons.js`)**: 3.37 ms (455.38 KB)
- **Stylesheets Load (`index.css`)**: 3.23 ms (90.11 KB)
- **Total Network Fetch Duration**: ~43.3 ms
- **Script Parse & Main-Thread Execution**: ~45 ms
- **Tab Switching Latency**: < 16 ms (within 1 frame at 60 FPS)

### Mobile Baseline (4G Throttled + 4x CPU Slowdown Emulation)
- **Simulated 4G Transfer (1.6 Mbps / 362 kB Gzip)**: ~1,810 ms
- **Script Parse & AST Compilation (1.64 MB uncompressed JS)**: ~320 ms
- **React Hydration / Initial Mount Delay**: ~140 ms
- **Estimated Largest Contentful Paint (LCP)**: **2,270 ms (~2.27s)**
- **Tab Switching Latency (Cold Lazy View Chunk Fetch)**: 120 ms – 180 ms
- **Bottleneck Identified**: Initial download and parse of the monolithic `genshin-characters` chunk (857 kB) on mobile bandwidth.

---

## 5. CI/CD Pipeline & Deployment Audit

Audited `.github/workflows/quality-gate.yml` and `playwright.config.ts`:

1. **Workflow Name Mismatch**:
   - The workflow is named `Quality Gate (Lint, Test, Build, SSOT)`.
   - **Gaps**: It has steps for Type check, Vitest test, Production build, and Reference generation, but **NO lint step** (`eslint`, `prettier`) is present.
2. **Missing Playwright Dependency & Test Directory**:
   - `playwright.config.ts` exists in the repository root.
   - However, `@playwright/test` is **missing from `package.json`**.
   - The test directory `e2e/` **does not exist**.
   - As a result, no genuine browser-driven integration tests run in CI (all journey tests are mocked in Vitest).
3. **Vercel & Node Version Alignment**:
   - GitHub Actions uses Node.js 22 (`node-version: 22`).
   - Production build runs cleanly on Vite 6.4.6.

---

## 6. Comprehensive Ranked Issue & Risk Register

### P0 — Critical (Immediate Data Loss & Integrity Failure)
| ID | Issue | Affected Files | Impact | Recommended Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **P0-1** | **Demo Mode overwrites real player data** | `src/App.tsx:135-159`<br>`src/services/storage.ts:62-103` | Turning on Demo Mode saves demo characters into real storage keys; disabling Demo Mode wipes all records. | **Milestone M1** |
| **P0-2** | **Non-atomic restore returns false success** | `src/services/backup.ts:212-250`<br>`src/services/storage.ts:124-131` | Storage functions swallow errors; restore does not verify writes and reports success even on quota failure. | **Milestone M1** |

### P1 — High (Misleading Feature Promises & CI Blindspots)
| ID | Issue | Affected Files | Impact | Recommended Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **P1-1** | **UID Sync only fetches showcase characters** | `src/services/enka.ts:134-155`<br>`src/App.tsx:194-200` | Misleadingly named; only retrieves public showcase (8-12 characters); overwrites profile levels with Level 90 C0. | **Milestone M1 / M4** |
| **P1-2** | **Missing linting and real browser tests in CI** | `.github/workflows/quality-gate.yml`<br>`package.json`<br>`playwright.config.ts` | CI workflow omits lint step; Playwright dependencies and `e2e/` tests are completely missing. | **Milestone M2** |

### P2 — Medium (Performance Bottlenecks & Residual Keys)
| ID | Issue | Affected Files | Impact | Recommended Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **P2-1** | **Monolithic 1.64 MB JS preloaded on root mount** | `vite.config.ts:8-35`<br>`src/services/storage.ts:4-5` | Synchronous data imports pull 857 kB character and 466 kB weapon databases into the initial entry bundle. | **Milestone M3** |
| **P2-2** | **Vite chunk warning threshold suppressed** | `vite.config.ts:9` | `chunkSizeWarningLimit: 2000` set to silence warnings rather than architecting clean chunk splits. | **Milestone M3** |
| **P2-3** | **Account reset leaves orphaned storage keys** | `src/services/storage.ts:92-103` | Reset clears roster and profiles, but leaves UID, pull budget, and custom Abyss cycle data behind. | **Milestone M1** |

### P3 — Low (Hygiene & Documentation)
| ID | Issue | Affected Files | Impact | Recommended Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **P3-1** | **Outdated archive notice in README** | `README.md:16-19` | Minor documentation ambiguity regarding v1 monorepo legacy branch. | **Milestone M10** |

---

## 7. Milestone M1 Transition Checklist

With M0 established and verified, Milestone M1 (Account Reliability & Data Safety) can proceed with clear, targeted requirements:
- [ ] Implement `celestia_demo_*` storage namespace isolation.
- [ ] Convert all storage write functions to return explicit success/error results.
- [ ] Implement atomic two-phase commit & rollback in `backup.ts:importAccountBackup`.
- [ ] Expand `resetAccountData()` to purge all user-specific keys (`active_uid`, `pull_budget`, `custom_abyss`).
- [ ] Add unit tests for storage quota failures, namespace isolation, and restore rollback.
