# Implementation Plan: M6 — High-Fidelity Endgame Solvers (Spiral Abyss Floor 12 & Imaginarium Theater)

## Overview
Comprehensive overhaul of the endgame solver engines and user interfaces for Project Celestia v2 (Version 7.2 baseline): integrating RES shred into damage multipliers, eliminating positional rotating shield heuristics in favor of explicit metadata, injecting bench counter candidates into dual abyss compositions, implementing structured natural-language half suitability explanations, generating holistic Imaginarium Theater Season Analysis with preservation schedules and phased draft plans, solving shortfall vigor starvation via pigeonhole scheduling, and wiring live tactical intelligence across `EndgameView`, `AbyssDualTeamView`, and `ImaginariumTheaterView`.

## Architecture Decisions
- **Explicit Metadata Schema over Hardcoded Heuristics**: Replaced chamber position hardcodes with explicit `rotatingShields: Element[]`, `targetProfile: 'Single-Target' | 'AoE' | 'Mixed'`, `waveCount: number`, `movementTraits: EnemyMovementTrait[]`, `positioningTip: string`, and `chamberBuff: string` declared in `src/data/abyss-schedules.ts`.
- **Encounter-Counter Candidate Injection**: Implemented `injectEncounterCounterCandidates` in `src/engines/abyss-solver.ts` to scan bench characters for required mechanics (Bow weakpoint shots, elemental shields, Natlan Nightsoul) and inject specialized counter variants.
- **Effective Damage Multiplier Scoring**: Integrated `effectiveDmgMultiplier` into half scoring, mathematically rewarding RES shred (VV 4pc, Zhongli, Xilonen) against high-RES targets.
- **Pigeonhole Vigor Scheduling Algorithm**: Integrated remaining act tracking into `scoreCandidateForAct`. Whenever a character's remaining vigor equals or exceeds the number of remaining unfilled acts (`currentVigor >= remainingUnfilledActs`), the character receives an urgency score boost. This ensures shortfall rosters fill early playable acts without leaving orphaned vigor.
- **Curated Support Cast Borrow Advisor**: `recommendSupportCastBorrow` strictly excludes both owned characters and free Opening Cast trial units, prioritizing premier supports and counter units tailored specifically to the season's Act 10 Apex Boss mechanics.
- **Dynamic Matchup Re-Evaluation**: `swapTheaterActMember` and `removeTheaterActMember` automatically re-invoke `evaluateBossActMatchup` on boss acts whenever act lineups change.
- **Endgame Intelligence UI Panels**: Wired half suitability explanations, Ley Line match notes, counter gap fallback cards, Apex Boss readiness indicators, preservation priority badges, and underleveled qualification alerts across all endgame views.

## Task List

### Phase 1: Types & Core Engine Interfaces
- [x] Task 6.1: Extend `src/types/genshin.ts` with `EncounterTargetProfile`, `EnemyMovementTrait`, `TheaterPreservationEntry`, `TheaterDraftStep`, `TheaterSeasonAnalysis`, expanded `TheaterSeasonConfig`, expanded `ChamberHalfMetrics`, `AbyssHalfExplanation`, `AbyssMissingCounterFallback`, and expanded `AbyssDualTeamPlan`.

### Phase 2: Metadata Schema Enrichment & Validation
- [x] Task 6.2: Enrich `src/data/abyss-schedules.ts` with movement traits, target profiles, positioning tips, rotating shields, and chamber buffs.
- [x] Task 6.3: Enrich `src/data/theater-seasons.ts` with targeting profiles, counter elements, nightsoul/sustain requirements, and preservation notes; implement `validateTheaterSeasonConfig()`.
- [x] Task 6.4: Upgrade `src/engines/endgame-helper.ts` to handle `'Bow User Required'` and filter prohibited elements.

### Phase 3: Abyss Solver Core Engine Upgrades
- [x] Task 6.5: Overhaul `src/engines/abyss-solver.ts` with RES shred integration, explicit rotating shields metadata, encounter-counter candidate injection, structured half explanations, and missing counter fallbacks.

### Phase 4: Theater Solver Core Engine Upgrades
- [x] Task 6.6: Overhaul `src/engines/theater-solver.ts` with free trial borrow exclusion, dynamic boss matchup re-evaluation, underleveled reporting, holistic season analysis (`analyzeTheaterSeasonPlan`), and pigeonhole vigor scheduling.

### Phase 5: UI Presentation & Interactive Upgrades
- [x] Task 6.7: Overhaul `src/components/EndgameView.tsx` with target profile tags, wave counts, movement traits, positioning tips, chamber buffs, and usable counter buttons.
- [x] Task 6.8: Upgrade `src/components/AbyssDualTeamView.tsx` with half suitability explanations, Ley Line synergy, and missing counter fallback panels.
- [x] Task 6.9: Upgrade `src/components/ImaginariumTheaterView.tsx` with Season Intelligence, preservation priorities, underleveled notices, and "Save A{X}" badges.

### Phase 6: Test Suite Expansion & Quality Gates
- [x] Task 6.10: Expand regression suite in `src/engines/abyss-solver.test.ts` (36 tests passing).
- [x] Task 6.11: Expand regression suite in `src/engines/theater-solver.test.ts` (46 tests passing).
- [x] Task 6.12: Author Architecture Decision Record ADR-006 (`docs/decisions/0006-endgame-solvers-abyss-and-theater.md`).
- [x] Task 6.13: Validate Playwright E2E Journey 7 (`e2e/journeys/07-endgame-solvers.spec.ts`).

## Checkpoints & Verification
- [x] `node scripts/audit-game-data.mjs` passes 100% across all 7 axes
- [x] `pnpm test` passes all 594 unit/integration tests across 39 test files
- [x] `pnpm run typecheck` (`tsc -b`) passes with 0 errors
- [x] `pnpm run lint` passes with 0 errors
- [x] `pnpm run build` passes with 0 errors
- [x] `pnpm run check:budget` passes all bundle and lazy-isolation limits
- [x] `pnpm exec playwright test e2e/journeys/07-endgame-solvers.spec.ts` passes across all 4 browser configurations
