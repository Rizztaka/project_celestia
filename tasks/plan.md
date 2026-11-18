# Implementation Plan: M0 — Technical Audit & Baseline

## Overview
Comprehensive read-only technical audit and baseline measurement for Project Celestia v2 (Version 7.2 baseline). This milestone modifies no feature code and establishes empirical benchmarks across repository topology, toolchain integrity, user journeys, bundle slicing, CI/CD configuration, production preview UI, throttled performance, and a ranked P0–P3 risk matrix.

## Architecture Decisions
- **Target Environment**: Local Vite production preview (`http://localhost:4173`) using compiled production chunks to isolate external network variability.
- **Deliverable Persistence**: Dual delivery — interactive Antigravity artifact and permanent markdown baseline at `docs/audit/m0-technical-baseline.md`.
- **Data Scope**: Automated structural schema and SSOT integrity checks for M0; kit-by-kit theorycrafting deferred to M4.
- **Performance Profiling**: Dual-condition baseline (Desktop unthrottled + Mobile 4G/4x CPU slowdown).

## Task List

### Phase 1: Toolchain & Build Verification
- [x] Task 0.1: Clean Lockfile & Dependency Hygiene (`pnpm install --frozen-lockfile`, `pnpm audit --prod`)
- [x] Task 0.2: Static Analysis, Tests, and Reference Synchronization (`tsc -b`, `pnpm test`, `node scripts/generate-reference.cjs`)

### Checkpoint: Foundation
- [x] TypeScript check clean (0 errors)
- [x] All 318 Vitest tests pass
- [x] Reference generation clean with 0 git diff

### Phase 2: Architecture & Journey Audit
- [x] Task 0.3: Repository Topology Mapping & Dependency Graph Slicing (asset sizes, chunk analysis)
- [x] Task 0.4: User Journey Tracing (UI → Engine → Storage across 8 journeys)
- [x] Task 0.5: CI/CD Pipeline & Deployment Configuration Audit (workflow vs. scripts, Node 22)

### Checkpoint: Architecture
- [x] Entry chunk import chain mapped
- [x] 8 user journeys traced to storage keys
- [x] CI gaps and missing Playwright setup documented

### Phase 3: Runtime & Performance Profiling
- [x] Task 0.6: Production UI Desktop & Mobile Viewport Audit (`localhost:4173`, responsive layout, console checks)
- [x] Task 0.7: Baseline Performance Profiling (Desktop vs. 4G/4x CPU throttled)

### Checkpoint: Runtime Telemetry
- [x] Desktop and Mobile UI verified with zero uncaught console errors
- [x] Parse, evaluation, and tab switch latencies recorded

### Phase 4: Synthesis & Deliverable
- [x] Task 0.8: Ranked Issue & Vulnerability Register (P0–P3 Matrix)
- [x] Task 0.9: Deliverable Publication & M1 Transition Plan (Commit `docs/audit/m0-technical-baseline.md`)

### Checkpoint: Complete
- [x] Audit deliverable committed to Git
- [x] Zero feature code regressions or unexpected diffs
- [x] Ready for Milestone M1

## Risks and Mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Accidental code modification during audit | High | Strict git status verification (`git status --porcelain`) before and after each task. |
| Vite preview port 4173 conflict | Medium | Check port availability before starting preview server. |
| Browser rendering differences | Low | Emulate both standard desktop (1920x1080) and mobile viewports (Pixel 5 / iPhone). |
