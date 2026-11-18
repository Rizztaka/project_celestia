# Task List: M0 — Technical Audit & Baseline

- [x] Task 0.1: Clean Lockfile & Dependency Hygiene
  - Acceptance: `pnpm install --frozen-lockfile` succeeds with zero changes; production dependencies audited.
  - Verify: `pnpm install --frozen-lockfile && git status --porcelain`
  - Files: `package.json`, `pnpm-lock.yaml`

- [x] Task 0.2: Static Analysis, Tests, and Reference Synchronization
  - Acceptance: Strict `tsc -b` passes with 0 errors; all 318 Vitest tests pass; reference generation generates accurate SSOT doc.
  - Verify: `pnpm exec tsc -b && pnpm test && node scripts/generate-reference.cjs`
  - Files: `src/data/reference-ssot.test.ts`, `docs/knowledge/celestia-reference.md`

- [x] Task 0.3: Repository Topology Mapping & Dependency Graph Slicing
  - Acceptance: Complete inventory of all components, services, engines, and data files; exact chunk weights from `pnpm build` cataloged.
  - Verify: `pnpm build` chunk inspection
  - Files: `vite.config.ts`, `src/App.tsx`, `src/data/characters.ts`, `src/data/weapons.ts`

- [x] Task 0.4: User Journey Tracing (UI → Engine → Storage)
  - Acceptance: Step-by-step trace of 8 core user journeys; pinpoint root causes of demo mode data loss, non-atomic restore, and reset leftover keys.
  - Verify: Trace matrices against `src/services/storage.ts`, `backup.ts`, `enka.ts`
  - Files: `src/App.tsx`, `src/services/storage.ts`, `src/services/backup.ts`, `src/services/enka.ts`

- [x] Task 0.5: CI/CD Pipeline & Deployment Configuration Audit
  - Acceptance: Complete gap analysis of `.github/workflows/quality-gate.yml` (missing lint, missing Playwright, missing e2e/ tests) and Vercel build configs.
  - Verify: Review `.github/workflows/quality-gate.yml` and `playwright.config.ts`
  - Files: `.github/workflows/quality-gate.yml`, `playwright.config.ts`

- [x] Task 0.6: Production UI Desktop & Mobile Viewport Audit
  - Acceptance: Production build run on Vite preview (`http://localhost:4173`); audited across Desktop (1920x1080) and Mobile (390x844/393x851); 0 console errors.
  - Verify: Browser viewport inspection on `http://localhost:4173`
  - Files: Production preview build

- [x] Task 0.7: Baseline Performance Profiling (Dual Profile)
  - Acceptance: Baseline LCP, bundle parse time, and tab transition delays benchmarked under standard desktop and 4G throttled/4x CPU mobile conditions.
  - Verify: Benchmark timings recorded in ms
  - Files: `dist/assets/*.js`

- [x] Task 0.8: Ranked Issue & Vulnerability Register (P0–P3)
  - Acceptance: Comprehensive matrix categorizing all discovered bugs, architectural risks, and performance bottlenecks into P0, P1, P2, and P3 tiers.
  - Verify: Matrix completeness and actionable remediation targets
  - Files: `docs/audit/m0-technical-baseline.md`

- [x] Task 0.9: Deliverable Publication & M1 Transition Plan
  - Acceptance: Permanent SSOT audit report committed to `docs/audit/m0-technical-baseline.md`; clean git working tree; M1 roadmap handover defined.
  - Verify: `git status --porcelain` and committed document
  - Files: `docs/audit/m0-technical-baseline.md`
