# ADR-003: Performance, Web Worker Offloading & Bundle Optimization Architecture

## Status
Accepted

## Date
2026-11-22

## Context
Project Celestia operates client-first, delivering interactive team composition generation, Abyss/Theater solvers, weapon conflict resolution, artifact stop point calculation, and pull advisory simulations for 128 playable characters, 256 weapons, and 64 artifact sets in Genshin Impact Version 7.2.
As the dataset expanded to full Version 7.2 coverage, three performance bottlenecks emerged:
1. **Main-Thread Engine Blocking**: Complex combinatorial solving (Dual-team Abyss solver, Theater roster satisfaction, and heuristic team generation) ran synchronously during component mounting, causing perceptible UI freezes (>500ms) on mobile viewports and low-tier CPUs.
2. **Bundle Bloat & Static Coupling**: Heavy game datasets (`artifacts-master.ts` ~105 KB raw, `weapons.ts` ~455 KB raw) and modals were statically imported into top-level views (`RosterView`, `ArtifactStopView`), causing Rollup to bundle game datasets into the initial entry modulepreloads in `index.html`.
3. **Rendering & Search Filter Overhead**: Large lists (128 character cards in `RosterView`, weapon cards in `WeaponConflictModal`) caused layout thrashing and dropped frames during rapid text filtering due to synchronous re-rendering, unconstrained image dimensions, and linear $O(N^2)$ object lookups.

## Decision
1. **Web Worker Solver Offloading with Dynamic Main-Thread Fallback**:
   - Offload heavy solvers (`generateBestTeams`, `solveAbyssDualTeams`, `solveTheaterTeam`, `solveArtifactLoadout`) to a dedicated Web Worker (`src/workers/solver.worker.ts`).
   - Implement an asynchronous worker dispatcher (`src/services/solver-dispatcher.ts`) that communicates via a typed request/response protocol with monotonic request IDs.
   - Solvers on the main thread are only loaded dynamically via `import()` as a fallback if the Web Worker fails or is unavailable in restricted environments.
   - Worker failures trigger graceful rejection of pending tasks (`rejectAllPending`), worker termination, and lazy worker reconstitution.
   - In `TeamGeneratorView.tsx` and `AbyssDualTeamView.tsx`, eliminate blocking synchronous solver invocations from `useState` initializers. Solvers execute asynchronously with React 19 `useTransition` and non-flicker loading indicators.

2. **Chunk Isolation & Lazy Dataset Splitting**:
   - Decouple `src/data/artifacts-master.ts` from `src/data/artifact-weights.ts`. In `ArtifactStopView.tsx`, load `artifacts-master.ts` dynamically inside a `useEffect` triggered only when switching to the Encyclopedia tab.
   - Configure `manualChunks` in `vite.config.ts` to isolate `genshin-artifacts-master` and `solver-dispatcher` into independent chunks.
   - Lazy-load secondary modals (`GoodImportExportModal`, `AccountBackupModal` in `RosterView`; `PullDistributionModal`, `GachaAssumptionsModal` in `PullAdvisorView`) behind `React.lazy()` and `<Suspense fallback={null}>`, removing static dependencies on `genshin-weapons` from the roster view.
   - Enforce an invariant that `dist/index.html` MUST NOT modulepreload any game-data chunk (`genshin-characters`, `genshin-weapons`, `genshin-artifacts-master`, `genshin-rotations`).

3. **DOM & Image Rendering Optimizations**:
   - **Resource Hints**: Inject `dns-prefetch` and `preconnect` hints in `index.html` for remote asset hosts (`https://enka.network`, `https://upload-os-bbs.mihoyo.com`).
   - **CharacterPortrait Hardening**: Enforce explicit width/height pixel dimensions in `SIZE_MAP`, set `referrerPolicy="no-referrer"`, and support eager priority loading for critical portraits.
   - **Weapon Conflict Modal**: Replace $O(N^2)$ `.find()` lookups with an $O(1)$ `Map` index (`CHARACTER_BY_ID`), apply CSS `content-visibility: auto` with `contain-intrinsic-size: auto 76px`, and add `loading="lazy" decoding="async" referrerPolicy="no-referrer"` to weapon icons.
   - **Search Input Deferral**: Wrap search query states with `useDeferredValue` across `RosterView`, `ArtifactStopView`, `WeaponConflictModal`, and wish budget calculations in `PullAdvisorView` to keep typing responsive at 60 FPS.

4. **Automated Bundle Ceilings & Performance CI Gates**:
   - Automated budget verification in `scripts/check-bundle-size.mjs`:
     - Entry chunk: `<= 110 KB` raw / `<= 35 KB` gzip (Achieved: **38.52 KB raw / 11.69 KB gzip**).
     - Solver dispatcher chunk: `<= 20 KB` raw (Achieved: **3.46 KB raw**).
     - Zero game-data chunks in `dist/index.html` `<link rel="modulepreload">`.
   - Comprehensive Playwright performance suite in `e2e/performance.spec.ts`:
     - Validates zero game data preloading in initial HTML.
     - Simulates Slow 4G CDP network conditions (interactive `< 1500ms`, FCP `< 1000ms`).
     - Verifies fast tab switching latency across all 5 views.
     - Enforces Long Task counts `<= 2` during view navigation.
     - Enforces heap stability and bounded memory growth.
     - Verifies 128-card search filtering latency `< 1500ms`.

## Consequences
- **Positive**: First Contentful Paint and Time-to-Interactive improved drastically on 4G connections; initial entry chunk is only 38.52 KB raw (11.69 KB gzip).
- **Positive**: Main thread remains completely unblocked during complex dual-team Abyss solves and team generation calculations.
- **Positive**: Heavy datasets (`artifacts-master.ts`, `weapons.ts`) are only downloaded on-demand when the user accesses features that require them.
- **Positive**: Regressions in bundle size, chunk coupling, or runtime performance are caught automatically in CI via `check:budget` and `test:e2e`.
