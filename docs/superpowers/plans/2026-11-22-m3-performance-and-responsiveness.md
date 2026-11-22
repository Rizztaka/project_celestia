# Milestone M3: Performance & Responsiveness Optimization Implementation Plan

> **For agentic workers:** Completed milestone plan documenting the architectural execution of Milestone M3.

**Goal:** Eliminate main-thread blocking during combinatorial team/abyss solving, isolate large game datasets from initial bundle modulepreloads, optimize image rendering and DOM layout thrashing, and enforce strict automated bundle and runtime performance regression gates.

**Architecture:**
1. **Web Worker Solver Offloading**: Migrate heavy solvers (`generateBestTeams`, `solveAbyssDualTeams`, `solveTheaterTeam`, `solveArtifactLoadout`) off the UI thread via `src/workers/solver.worker.ts` and an asynchronous request/response dispatcher (`src/services/solver-dispatcher.ts`) with dynamic `import()` fallback.
2. **Chunk Isolation & Lazy Dataset Splitting**: Decouple `artifacts-master.ts` from `artifact-weights.ts` via dynamic import in `ArtifactStopView.tsx`. Isolate `solver-dispatcher` in `vite.config.ts`. Lazy-load heavy modals (`GoodImportExportModal`, `AccountBackupModal`, `PullDistributionModal`, `GachaAssumptionsModal`) behind React `Suspense`.
3. **Resource Hints & Layout Optimization**: Inject `dns-prefetch` and `preconnect` in `index.html` for asset CDNs. Set explicit pixel dimensions and `referrerPolicy="no-referrer"` in `CharacterPortrait.tsx`. Optimize `WeaponConflictModal.tsx` with an $O(1)$ character lookup index and `content-visibility: auto`.
4. **Interactive Responsiveness**: Implement `useDeferredValue` across search filtering inputs and budget recalculations to preserve 60 FPS fluid typing.
5. **Automated Performance Regression Gates**: Enforce <= 110 KB raw / <= 35 KB gzip entry chunk, <= 20 KB solver dispatcher, and zero game data preloading in `scripts/check-bundle-size.mjs`. Implement Playwright Slow 4G CDP emulation, Long Task limits, and 128-card filter latency checks in `e2e/performance.spec.ts`.

---

## Tasks & Deliverables

- [x] **Task 3.1: Chunk Slicing & Rollup Configuration (`vite.config.ts`)**
  - Decouple `genshin-artifacts-master` (~105 KB raw) from `genshin-artifact-weights`.
  - Isolate `solver-dispatcher` into its own chunk to prevent pulling heavy solver dependencies into `App.tsx`.
  - Verify zero game-data chunks (`genshin-characters`, `genshin-weapons`, `genshin-artifacts-master`, `genshin-rotations`) are preloaded in `dist/index.html`.

- [x] **Task 3.2: Early Resource Hints (`index.html`)**
  - Add `dns-prefetch` and `preconnect` links for `https://enka.network` and `https://upload-os-bbs.mihoyo.com`.

- [x] **Task 3.3: Web Worker Solver Offloading (`src/services/solver-dispatcher.ts`)**
  - Implement worker-first asynchronous dispatcher communicating with `src/workers/solver.worker.ts`.
  - Convert main-thread solver fallbacks to dynamic `import()`.
  - Add `rejectAllPending` task cancellation, worker termination, and lazy recreation upon error.

- [x] **Task 3.4: Character Portrait Dimension & Image Optimizations (`src/components/CharacterPortrait.tsx`)**
  - Add explicit pixel width/height attributes matching `SIZE_MAP` (`xs: 16`, `sm: 28`, `md: 44`, `lg: 72`, `xl: 80`).
  - Add `referrerPolicy="no-referrer"` to prevent external CDN blocking.
  - Support `priority` prop for above-the-fold eager image loading.

- [x] **Task 3.5: Component Slicing & Responsive Deferral**
  - `src/components/RosterView.tsx`: Lazy-load `GoodImportExportModal` and `AccountBackupModal` behind `Suspense`; defer search filtering via `useDeferredValue`.
  - `src/components/PullAdvisorView.tsx`: Lazy-load `PullDistributionModal` and `GachaAssumptionsModal`; defer budget recomputation via `useDeferredValue`.
  - `src/components/ArtifactStopView.tsx`: Dynamically import `artifacts-master.ts` only when viewing the Encyclopedia tab; defer search filtering.
  - `src/components/WeaponConflictModal.tsx`: Replace $O(N^2)$ `.find()` lookups with an $O(1)$ `CHARACTER_BY_ID` Map; defer search; add `contentVisibility: 'auto'` (`containIntrinsicSize: 'auto 76px'`) and lazy decoding on weapon icons.
  - `src/components/TeamGeneratorView.tsx` & `src/components/AbyssDualTeamView.tsx`: Eliminate blocking synchronous solver calls on initial mount; offload initial solve to Web Worker with `useTransition`.

- [x] **Task 3.6: Bundle Budget Enforcement (`scripts/check-bundle-size.mjs`)**
  - Tighten entry chunk limits: raw <= 110 KB, gzip <= 35 KB (Achieved: 38.52 KB raw / 11.69 KB gzip).
  - Add solver-dispatcher chunk limit: raw <= 20 KB (Achieved: 3.46 KB raw).
  - Add automated regression check verifying zero game data preloading in `dist/index.html`.

- [x] **Task 3.7: End-to-End Performance Test Suite (`e2e/performance.spec.ts`)**
  - Verify zero game-data preloads on initial page load.
  - Slow 4G CDP emulation: FCP < 1000ms (achieved ~612ms), interactive < 1500ms (achieved ~624ms).
  - 5-tab switching latency verification across Best Teams, Pull Advisor, Endgame Helper, Artifact Stop, My Roster.
  - Long Task monitoring: <= 2 long tasks across tab navigation.
  - Heap memory ceiling verification across navigation cycles.
  - 128-card search filter responsiveness: < 1500ms (achieved ~66ms).

---

## Verification Results
- `pnpm run check:budget`: **PASSED** (Entry: 38.52 KB raw / 11.69 KB gzip; Dispatcher: 3.46 KB raw; Zero game preloads).
- `pnpm test`: **PASSED** (552 tests across 39 files).
- `pnpm exec playwright test e2e/performance.spec.ts`: **PASSED** across all 4 browser targets (Desktop Chromium, Desktop Firefox, Mobile Chromium, Mobile WebKit).
- `pnpm run verify:all`: **PASSED** across all 8 quality gates.
