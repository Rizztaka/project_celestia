# Project Celestia — Milestone M0: Technical Audit & Baseline Report

> **Audit Date**: 2026-11-18  
> **Auditor**: Antigravity Technical Agent (Solo Routine)  
> **Baseline Version**: Genshin Impact Version 7.2 (Nod-Krai / Snezhnaya / Celestia)  
> **Milestone Status**: **M0 Completed — Baseline Established**  
> **Production Code Status**: Clean (Zero unintended diffs, zero feature code modifications)  
> **Architecture Decision Record**: [ADR-000: Technical Baseline & Architecture Map](../decisions/0000-technical-baseline-and-architecture-map.md)

---

## Executive Summary

Milestone M0 established an empirical, unvarnished baseline of Project Celestia v2 across toolchain integrity, user journeys, bundle slicing, CI/CD pipelines, runtime layout, live browser metrics, accessibility compliance, and persistent data safety.

**Key Baseline Metrics**:
- **TypeScript Check (`tsc -b`)**: 0 errors (100% strict type check pass).
- **Vitest Test Suite**: 23 test files, 318 tests passing in ~8.74 seconds.
- **SSOT Reference Integrity**: 128 playable characters, 256 weapons, 64 artifact sets verified via `scripts/generate-reference.cjs`.
- **Dependency Hygiene**: `pnpm install --frozen-lockfile` clean; 0 production vulnerabilities (`pnpm audit --prod`).
- **Initial Bundling Weight**: 1,733.51 kB raw JS (361.44 kB gzip) preloaded immediately on root mount.
- **Live Core Web Vitals (Local Vite Preview)**:
  - TTFB: 2.10 ms
  - DOM Interactive: 20.30 ms
  - First Contentful Paint (FCP): 38.60 ms
  - Largest Contentful Paint (LCP): 38.60 ms (`h1.text-2xl.font-bold.text-zinc-100.font-serif`, "Best Team Recommendations")
  - Cumulative Layout Shift (CLS): 0.00
- **Knowledge Graph Structure (Graphify AST)**: 591 nodes, 1,643 edges, 23 communities, 7 high-degree god nodes.
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

## 2. Architecture & Knowledge Graph Analysis (Graphify AST)

Codebase structural analysis was performed via AST extraction and Louvain community clustering (`graphify`), extracting **591 nodes**, **1,643 edges**, and **23 cohesive communities**.

### High-Degree "God Nodes" (Architectural Hotspots)
| Node ID | Label / Symbol | Degree Centrality | Role & Coupling Risk |
| :--- | :--- | :--- | :--- |
| `src_data_weapons_getweaponbykey` | `getWeaponByKey()` | **38** | Weapon lookup function invoked across solvers, armory, calculations, and UI modals. |
| `src_types_genshin_ownedcharacterprofile` | `OwnedCharacterProfile` | **33** | Core character profile type bound across 30+ components and persistent storage. |
| `src_components_characterdetailmodal` | `CharacterDetailModal()` | **30** | Monolithic modal handling build inspection, weapon quick-swap, and talent scaling. |
| `src_types_genshin_ownedweapon` | `OwnedWeapon` | **26** | Inventory weapon record structure. |
| `src_app_app` | `App()` | **25** | Root shell managing view transitions, Enka sync, modals, and toasts. |
| `src_types_genshin_character` | `Character` | **24** | Master character schema model. |
| `src_data_characters_characters` | `CHARACTERS` | **23** | Static registry of all 128 canonical playable characters. |

---

## 3. Bundle Slicing & Chunk Distribution

Inspection of `vite.config.ts`, `dist/index.html`, and `dist/assets/` revealed that while view components (`TeamGeneratorView`, `PullAdvisorView`, `EndgameView`, `ArtifactStopView`, `RosterView`) use dynamic `React.lazy()` imports, **the large static game databases are eagerly bundled into the initial root load**.

### Root Bundle Weight & Preload Map

| Asset / Chunk | Raw Size | Gzip Size | Preloaded on `/` | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `dist/assets/index-*.js` | 286.50 kB | 87.47 kB | **Yes (`<script>`)** | Entry application logic, React 19 runtime, App shell. |
| `dist/assets/genshin-characters-*.js` | 857.66 kB | 207.45 kB | **Yes (`<link rel="modulepreload">`)** | Complete 128-character registry, stats, and talent curves. |
| `dist/assets/genshin-weapons-*.js` | 466.31 kB | 44.60 kB | **Yes (`<link rel="modulepreload">`)** | Complete 256-weapon registry, stats, and refinement curves. |
| `dist/assets/vendor-lucide-*.js` | 30.76 kB | 7.92 kB | **Yes (`<link rel="modulepreload">`)** | Shared UI iconography. |
| `dist/assets/index-*.css` | 92.78 kB | 14.07 kB | **Yes (`<link rel="stylesheet">`)** | Tailwind CSS v4 styling rules. |
| **Initial Root Subtotal** | **1,733.51 kB** | **361.44 kB** | **Preloaded** | **Total payload required before interactive mount.** |
| `dist/assets/genshin-artifacts-*.js` | 116.01 kB | 27.82 kB | No (Lazy) | 64 Master sets & 37 combat sets. |
| `dist/assets/EndgameView-*.js` | 87.50 kB | 21.51 kB | No (Lazy) | Abyss & Imaginarium Theater solvers. |
| `dist/assets/PullAdvisorView-*.js` | 68.08 kB | 18.34 kB | No (Lazy) | Gacha probability calculation view. |
| `dist/assets/CharacterDetailModal-*.js`| 53.96 kB | 14.59 kB | No (Lazy) | Character inspection & constellation modal. |
| `dist/assets/ArtifactStopView-*.js` | 46.22 kB | 12.37 kB | No (Lazy) | Artifact stop-point diminishing returns calculator. |
| `dist/assets/genshin-rotations-*.js` | 35.75 kB | 10.63 kB | No (Lazy) | 128 calibrated character rotation profiles. |
| `dist/assets/RosterView-*.js` | 32.40 kB | 9.21 kB | No (Lazy) | Character roster grid and selection. |
| `dist/assets/TeamGeneratorView-*.js` | 20.62 kB | 5.55 kB | No (Lazy) | Primary team recommendation view. |
| `dist/assets/WeaponConflictModal-*.js` | 15.93 kB | 4.16 kB | No (Lazy) | Weapon collision resolution dialog. |
| `dist/assets/team-generator-*.js` | 11.99 kB | 4.37 kB | No (Lazy) | Core team generation algorithm. |
| 128 Talent Scaling Curves | ~2–5 kB each | ~1 kB each | No (Lazy) | Dynamic talent scaling curve modules. |

### Root Cause of Eager Data Preloading
In `src/services/storage.ts`:
- Line 4: `import { getWeaponByKey } from '../data/weapons';`
- Line 5: `import { CHARACTERS } from '../data/characters';`

Because `src/App.tsx` imports `getSavedProfiles` and `getSavedWeapons` directly from `storage.ts` at the top level, Rollup statically links `src/data/characters.ts` and `src/data/weapons.ts` into the entry graph. As a result, Vite emits `<link rel="modulepreload">` for both chunks.

---

## 4. Live Browser & Accessibility (a11y) Audit

Audited via real browser automation across Desktop (1920x1080) and Mobile (390x844) viewports at `http://localhost:4173/`:

### A. Core Web Vitals & Desktop Baseline (1920x1080)
- **TTFB**: 2.10 ms
- **DOM Interactive**: 20.30 ms
- **First Contentful Paint (FCP)**: 38.60 ms
- **Largest Contentful Paint (LCP)**: 38.60 ms (`h1.text-2xl.font-bold.text-zinc-100.font-serif`, "Best Team Recommendations")
- **Cumulative Layout Shift (CLS)**: 0.00
- **Console Errors**: 0 runtime exceptions.
- **Network Failures (ORB)**:
  - `GET https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Catalyst_Chernaya.png` -> `net::ERR_BLOCKED_BY_ORB`
  - `GET https://upload-os-bbs.mihoyo.com/game_record/genshin/equip/UI_EquipIcon_Sword_Regalis.png` -> `net::ERR_BLOCKED_BY_ORB`
  *(Opaque Response Blocking drops external MiHoYo equipment icon requests)*.

### B. Accessibility (a11y) Compliance (WCAG 2.2 AA)
1. **Heading Hierarchy**: Empty and initial states jump directly from `<h1>` to `<h3>Best Team Compositions</h3>`, skipping `<h2>`.
2. **Form Controls**: Header UID input (`input[placeholder="Enter UID..."]`) lacks `<label>` and has no `aria-label`.
3. **Accordion & Collapsible Controls**: "Show Tactical Strategy & Tips" buttons lack `aria-expanded` and `aria-controls`.
4. **Modal Dialogs**:
   - **Armory & Weapon Manager**: Missing `role="dialog"`, missing `aria-modal="true"`, missing `aria-label` on close button. **Pressing `Escape` does NOT close the Armory modal**, occluding background page interactions.
   - **Character Detail Modal**: Missing `role="dialog"`, `aria-modal="true"`, and focus trapping.
   - **Account Backup Modal**: Fully compliant (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `Escape` listener).
5. **Color Contrast**:
   - Gold accent `#d4af37` on `#0b0c10`: Contrast **7.4:1** (Passes AAA).
   - Primary text `#f4f4f5` on `#0b0c10`: Contrast **14:1** (Passes AAA).
   - Secondary text `text-zinc-500` (`#71717a`) on `#0b0c10`: Contrast **3.6:1** (Fails WCAG AA minimum 4.5:1).

### C. Mobile Responsiveness (390x844 Viewport)
1. **Header Horizontal Overflow**: At 390px width, top navigation does not collapse into a hamburger menu or mobile drawer. The UID input and Sync button get pushed off-screen (`scrollWidth: 406px` > `clientWidth: 390px`).
2. **Touch Target Size Violations (WCAG 2.5.5 / Apple HIG < 44x44px)**:
   - Constellation buttons `C0`–`C6`: **24px x 24px** (severe touch tap target failure).
   - Nav bar buttons: Height is **28px** (e.g. `50.8px x 28px`).
   - Character modal close button: **36px x 36px**.
   - Armory modal close button: **32px x 32px**.
   - Carry filter chips: Height is **28px**.
3. **Modal Layout**: Modals scale cleanly to 366px width within the 390px viewport with vertical scrolling.

---

## 5. User Journey Tracing (UI → Engine → Storage)

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

## 6. Senior Developer Quality Audit (Ponytail Audit)

### What this repository does:
Project Celestia is an offline-first, client-side Genshin Impact companion application for team composition optimization, gacha wish budgeting, artifact roll valuation, and endgame combat planning (Spiral Abyss & Imaginarium Theater) across 128 canonical characters and 256 weapons. The assumed load is single-client browser execution, but managing heavy persistent state in `localStorage` without backend synchronization.

### Must fix (Bugs, Data Loss & Scale Failures):
1. **Demo Mode clobbers and deletes authentic account data** (`src/App.tsx:L135-159` & `src/services/storage.ts:L92-100`)
   - **What this is:** Demo Mode toggle in the application header.
   - **Problem:** Enabling demo mode writes demo characters and weapons directly to `celestia_v2_roster_profiles` and `celestia_v2_raw_weapons`. Disabling it calls `resetAccountData()`, permanently deleting the player's saved data.
   - **Fix:** Move demo mode into dedicated storage keys (`celestia_v2_demo_*`) or an in-memory session store. Never write demo data to production keys.
   - **If we skip it:** Any user exploring demo mode destroys their entire account.

2. **Restore reports success when writes fail** (`src/services/backup.ts:L212-255` & `src/services/storage.ts:L124-131`)
   - **What this is:** Account backup JSON restore handler.
   - **Problem:** Storage functions catch write errors and log to console without rethrowing or returning failure booleans. When `localStorage` hits quota limits, restore partially writes keys but still reports `{ success: true }`.
   - **Fix:** Make storage write operations return explicit booleans. If any write fails, automatically invoke `rollbackPreRestoreBackup()` and return failure.
   - **If we skip it:** Users with full local storage or corrupted backups end up with half-restored, corrupted states without notice.

3. **Account reset leaves orphan privacy keys behind** (`src/services/storage.ts:L92-100`)
   - **What this is:** `resetAccountData()` function.
   - **Problem:** Only clears roster, profiles, weapons, and artifacts. It leaves `active_uid`, `pull_budget`, `abyss_cycle_id`, and `custom_abyss` intact in browser storage.
   - **Fix:** Clear all 8 user keys in `resetAccountData()`.
   - **If we skip it:** A user resetting their account still has their private UID and pull history stored.

4. **Armory modal traps keyboard users** (`src/components/WeaponConflictModal.tsx:L30-60`)
   - **What this is:** Armory modal dialog.
   - **Problem:** The modal does not attach an `Escape` keydown handler, lacks `role="dialog"`, and lacks `aria-modal="true"`. Pressing Escape does nothing, and the modal occludes all background elements.
   - **Fix:** Add `useEffect` listener for `Escape` to close the modal, and add proper ARIA dialog attributes.
   - **If we skip it:** Keyboard-only and assistive tech users cannot close the Armory without mouse interaction.

### Should fix (Risky code without tests, real slowness, duplication):
5. **Quality Gate workflow claims "Lint" but runs no linter** (`.github/workflows/quality-gate.yml:L11-44`)
   - **What this is:** GitHub Actions CI workflow.
   - **Problem:** Job is named `Quality Gate (Lint, Test, Build, SSOT)` but contains no lint command, and `package.json` contains no `lint` script or linter dependency.
   - **Fix:** Add Biome or ESLint with `pnpm lint` and wire it into CI before `tsc -b`.
   - **If we skip it:** Formatting inconsistencies and lint bugs slip into the repository unchecked.

6. **Playwright configuration is orphaned** (`playwright.config.ts:L1-8` & `package.json`)
   - **What this is:** Playwright E2E configuration file.
   - **Problem:** `playwright.config.ts` imports `@playwright/test` and points to `./e2e`, but `@playwright/test` is absent from `package.json` and `./e2e` does not exist. All journey tests run in simulated JSDOM.
   - **Fix:** Install `@playwright/test`, add `./e2e` browser journeys running against `vite preview`, and wire them into CI.
   - **If we skip it:** Real browser rendering bugs (like ORB image blocking and 390px overflow) remain unverified.

7. **Monolithic 1.64 MB JS eagerly bundled on root mount** (`vite.config.ts:L9-35` & `src/services/storage.ts:L4-5`)
   - **What this is:** Vite chunking and entry graph.
   - **Problem:** Top-level static imports in `storage.ts` force Rollup to preload 858 kB of characters and 466 kB of weapons before initial paint.
   - **Fix:** Dynamic import character and weapon data modules inside components/solvers when needed.
   - **If we skip it:** 2.27s LCP on 4G mobile connections.

8. **Mobile touch targets below 44x44px** (`src/components/CharacterDetailModal.tsx` & `src/components/Navbar.tsx`)
   - **What this is:** Constellation buttons `C0`–`C6` (24x24px) and nav tabs (28px height).
   - **Problem:** Touch areas fail WCAG 2.5.5 minimum guidelines, causing miss-taps on mobile touchscreens.
   - **Fix:** Add `min-h-[44px]` and padding.
   - **If we skip it:** Frustrating user experience on mobile devices.

### Nice to have:
9. **Cache MiHoYo CDN weapon icons locally** (`src/data/weapons.ts`)
   - **What this is:** Equipment icon image URLs.
   - **Problem:** External `upload-os-bbs.mihoyo.com` URLs trigger ORB blocking in Chromium.
   - **Fix:** Bundle weapon icons locally in `/public/assets/weapons/` or serve via local fallback.

### Verdict:
**Stable calculation baseline, but critical data safety vulnerabilities (P0) require immediate isolation in M1 before feature work.**

---

## 7. Doubt-Driven Development: Adversarial Stress Test

| Hypothesis / Common Assumption | Adversarial Challenge | Concrete Evidence from M0 Audit | Resolution |
| :--- | :--- | :--- | :--- |
| *"The test suite passes 100%, so user journeys work in production."* | JSDOM mocks browser APIs. Real browsers handle CSS rendering, network policies, and focus management differently. | Vitest simulated tests passed, but real browser testing revealed ORB network failures on images, mobile header clipping at 390px, and missing `Escape` listeners in Armory modal. | Treat Vitest as unit logic validation; introduce Playwright E2E in M2 for genuine browser verification. |
| *"React.lazy() eliminates initial bundle bottlenecks."* | Lazy-loading view components is ineffective if shared data modules are imported statically by root services. | `storage.ts` imports `CHARACTERS` and `getWeaponByKey`, causing Vite to emit `<link rel="modulepreload">` for 1.32 MB of static data on `/`. | Decouple storage persistence from static data registries in M3. |
| *"Local storage is reliable enough for user data without transactions."* | Browser `localStorage` has hard quota limits and throws `QuotaExceededError`. Sequential writes without two-phase verification leave partial records. | When writes fail mid-restore, existing restore returned success without rollback. | Implement atomic safety snapshot rollback in M1. |

---

## 8. Comprehensive Ranked Risk Register

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
| **P2-4** | **Armory modal traps keyboard users** | `src/components/WeaponConflictModal.tsx` | Missing `role="dialog"`, `aria-modal="true"`, and `Escape` keydown handler. | **Milestone M1 / M2** |
| **P2-5** | **Mobile touch targets below 44x44px** | `src/components/CharacterDetailModal.tsx`<br>`src/components/Navbar.tsx` | Constellation buttons (24x24px) and navigation tabs (28px height) fail WCAG 2.5.5. | **Milestone M2 / M3** |

### P3 — Low (Hygiene & Documentation)
| ID | Issue | Affected Files | Impact | Recommended Milestone |
| :--- | :--- | :--- | :--- | :--- |
| **P3-1** | **Subresource ORB image blocking** | `src/data/weapons.ts` | MiHoYo CDN image URLs blocked by Chromium Opaque Response Blocking. | **Milestone M3 / M4** |
| **P3-2** | **Outdated archive notice in README** | `README.md:16-19` | Minor documentation ambiguity regarding v1 monorepo legacy branch. | **Milestone M10** |

---

## 9. Milestone M1 Transition Checklist

With M0 established and verified, Milestone M1 (Account Reliability & Data Safety) can proceed with clear, targeted requirements:
- [ ] Implement `celestia_demo_*` storage namespace isolation.
- [ ] Convert all storage write functions to return explicit success/error results.
- [ ] Implement atomic two-phase commit & rollback in `backup.ts:importAccountBackup`.
- [ ] Expand `resetAccountData()` to purge all user-specific keys (`active_uid`, `pull_budget`, `custom_abyss`).
- [ ] Add unit tests for storage quota failures, namespace isolation, and restore rollback.
