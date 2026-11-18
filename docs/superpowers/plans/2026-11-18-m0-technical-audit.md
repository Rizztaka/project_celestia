# M0 Technical Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Execute a comprehensive, non-destructive technical audit and establish an empirical performance, architecture, and reliability baseline for Project Celestia v2 before any feature refactoring begins.

**Architecture:** Operates in strict read-only audit mode against the local production Vite preview build (`http://localhost:4173`). Traces user journeys, analyzes bundle splits, inspects CI/CD workflows, captures mobile/desktop UI state, records throttled performance benchmarks, and produces a prioritized P0–P3 vulnerability register.

**Tech Stack:** React 19, TypeScript 5.7, Vite 6.2, Tailwind CSS v4, Vitest 5.1.

**Spec:** [docs/audit/m0-technical-baseline.md](file:///d:/Genshin%20Personal/project-celestia/docs/audit/m0-technical-baseline.md) / [tasks/plan.md](file:///d:/Genshin%20Personal/project-celestia/tasks/plan.md)

## Global Constraints
- Strictly NO feature code modifications or unneeded edits in M0.
- All testing and execution must preserve clean working tree status.
- Version 7.2 remains the authoritative baseline across all inspected character/weapon/artifact records.

## Review Focus
1. Demo Mode toggle corrupting real saved roster and profiles in `localStorage`.
2. Non-atomic backup restore returning success even if partial storage writes fail.
3. Leftover storage keys (`celestia_v2_active_uid`, `celestia_v2_pull_budget`) on account reset.
4. Eagerly bundled `genshin-characters` chunk (857 kB) exceeding Vite chunk warning threshold (2000 kB suppressed).
5. Quality Gate CI workflow citing lint and Playwright without running lint or bundling Playwright test binaries.

---

### Task 0.1: Clean Lockfile & Dependency Hygiene
**Files:**
- Inspect: `package.json`, `pnpm-lock.yaml`

- [ ] Step 1: Run `pnpm install --frozen-lockfile` to verify clean dependency tree without lockfile mutations.
- [ ] Step 2: Run `pnpm audit --prod` to audit security vulnerabilities.
- [ ] Step 3: Record lockfile integrity status in task tracker.

---

### Task 0.2: Static Analysis, Tests, and Reference Synchronization
**Files:**
- Inspect: `src/data/reference-ssot.test.ts`, `docs/knowledge/celestia-reference.md`

- [ ] Step 1: Run `pnpm exec tsc -b` to verify strict TypeScript compilation.
- [ ] Step 2: Run `pnpm test` to verify all 23 Vitest test suites (318 tests).
- [ ] Step 3: Run `node scripts/generate-reference.cjs` and verify clean git status via `git diff --stat`.
- [ ] Step 4: Record test execution times and memory characteristics.

---

### Task 0.3: Repository Topology Mapping & Dependency Graph Slicing
**Files:**
- Inspect: `vite.config.ts`, `src/App.tsx`, `src/data/characters.ts`, `src/data/weapons.ts`

- [ ] Step 1: Catalog all components, services, engines, and data files.
- [ ] Step 2: Run `pnpm build` and catalog exact byte sizes and gzip sizes for all emitted chunks in `dist/assets/`.
- [ ] Step 3: Analyze Vite's manualChunks configuration in `vite.config.ts` and document chunk warning suppression (`chunkSizeWarningLimit: 2000`).
- [ ] Step 4: Trace root entry point import chains to map which large datasets load immediately on first mount.

---

### Task 0.4: User Journey Tracing (UI → Engine → Storage)
**Files:**
- Inspect: `src/App.tsx`, `src/services/storage.ts`, `src/services/backup.ts`, `src/services/enka.ts`

- [ ] Step 1: Trace Journey 1 (First visit & empty roster).
- [ ] Step 2: Trace Journey 2 & 3 (Roster management, profiles, armory weapon transfer without duplication).
- [ ] Step 3: Trace Journey 4 (UID showcase import & Enka mapping limitations).
- [ ] Step 4: Trace Journey 5 (Team recommendation engine & role heuristics).
- [ ] Step 5: Trace Journey 6 (Endgame Abyss & Theater stage solvers).
- [ ] Step 6: Trace Journey 7 (Pull advisor & gacha probability math).
- [ ] Step 7: Trace Journey 8 (Backup export, schema versioning, and restore atomicity gaps).

---

### Task 0.5: CI/CD Pipeline & Deployment Configuration Audit
**Files:**
- Inspect: `.github/workflows/quality-gate.yml`, `playwright.config.ts`, `docs/playwright-setup.md`

- [ ] Step 1: Review workflow jobs, runners, and steps in `.github/workflows/quality-gate.yml`.
- [ ] Step 2: Document missing lint step despite workflow name.
- [ ] Step 3: Document missing `@playwright/test` in `package.json` and missing `e2e/` directory.
- [ ] Step 4: Document Node 22 environment alignment between GitHub Actions and Vercel.

---

### Task 0.6: Production UI Desktop & Mobile Viewport Audit
**Files:**
- Inspect: Production preview at `http://localhost:4173`

- [ ] Step 1: Start production preview server (`pnpm run preview`).
- [ ] Step 2: Audit Desktop viewport (1920x1080) across all 5 main views, modals, and empty states.
- [ ] Step 3: Audit Mobile viewport (390x844 / 393x851) for touch targets, navigation bar, and responsive clipping.
- [ ] Step 4: Verify zero uncaught browser console errors.

---

### Task 0.7: Baseline Performance Profiling (Dual Profile)
**Files:**
- Inspect: Production bundle metrics and browser timing APIs

- [ ] Step 1: Profile Desktop unthrottled performance (DOM load, script eval time, tab transition latency).
- [ ] Step 2: Profile Mobile throttled performance (4G network + 4x CPU slowdown).
- [ ] Step 3: Document LCP approximation, JS parse latency, and memory footprint.

---

### Task 0.8: Ranked Issue & Vulnerability Register (P0–P3)
**Files:**
- Create: `docs/audit/m0-technical-baseline.md`

- [ ] Step 1: Compile all findings into P0 (Critical), P1 (High), P2 (Medium), and P3 (Low) categories.
- [ ] Step 2: Detail root cause, reproduction path, affected files, and recommended remediation milestone for each finding.

---

### Task 0.9: Deliverable Publication & M1 Transition Plan
**Files:**
- Commit: `docs/audit/m0-technical-baseline.md`

- [ ] Step 1: Assemble and format the complete audit report at `docs/audit/m0-technical-baseline.md`.
- [ ] Step 2: Verify git status is clean of unintended changes.
- [ ] Step 3: Commit the audit deliverable to version control.
