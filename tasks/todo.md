# Task List: M6 — High-Fidelity Endgame Solvers (Spiral Abyss Floor 12 & Imaginarium Theater)

- [x] Task 6.1: Extend Endgame Solver Types
  - Acceptance: `EncounterTargetProfile`, `EnemyMovementTrait`, `TheaterPreservationEntry`, `TheaterDraftStep`, `TheaterSeasonAnalysis`, expanded `TheaterSeasonConfig`, expanded `ChamberHalfMetrics`, `AbyssHalfExplanation`, `AbyssMissingCounterFallback`, and expanded `AbyssDualTeamPlan` added to `src/types/genshin.ts`.
  - Verify: `pnpm run typecheck`
  - Files: `src/types/genshin.ts`

- [x] Task 6.2: Enrich Abyss Schedules & Theater Season Metadata
  - Acceptance: Enemy movement traits, target profiles, positioning tips, rotating shields, and chamber buffs added to `src/data/abyss-schedules.ts`; `THEATER_BOSS_INFO` enriched with targeting profiles, counter elements, nightsoul/sustain requirements, and preservation notes; `validateTheaterSeasonConfig()` added to `src/data/theater-seasons.ts`.
  - Verify: `pnpm test src/data/data-integrity.test.ts`
  - Files: `src/data/abyss-schedules.ts`, `src/data/theater-seasons.ts`

- [x] Task 6.3: Upgrade Endgame Helper & Validation
  - Acceptance: `analyzeEndgameReadiness` handles `'Bow User Required'` in `missingElements` and filters out prohibited elements from `usableCounters`.
  - Verify: `pnpm test src/engines/abyss-solver.test.ts`
  - Files: `src/engines/endgame-helper.ts`

- [x] Task 6.4: Abyss Solver Core Upgrades & Counter Injection
  - Acceptance: `effectiveDmgMultiplier` wired into half scoring; hardcoded rotating shield checks replaced with `rotatingShields` metadata; encounter-counter candidate injection (Bow / shield-breakers / Nightsoul) implemented; structured half explanations and missing counter fallbacks populated.
  - Verify: `pnpm test src/engines/abyss-solver.test.ts` (36 tests passing)
  - Files: `src/engines/abyss-solver.ts`, `src/engines/abyss-solver.test.ts`

- [x] Task 6.5: Theater Solver Upgrades & Pigeonhole Vigor Scheduling
  - Acceptance: Free Opening Cast trial units excluded from `recommendSupportCastBorrow`; `bossMatchup` dynamically re-evaluated on manual swap and removal; `excludedUnderleveled` reported; `seasonAnalysis` generated; pigeonhole vigor scheduling implemented so shortfall rosters fill early playable acts without orphaning vigor.
  - Verify: `pnpm test src/engines/theater-solver.test.ts` (46 tests passing)
  - Files: `src/engines/theater-solver.ts`, `src/engines/theater-solver.test.ts`

- [x] Task 6.6: Endgame UI Upgrades (Pass 2)
  - Acceptance: `EndgameView.tsx` displays target profiles, wave counts, movement traits, positioning tips, and chamber buffs; `AbyssDualTeamView.tsx` displays half suitability explanations, Ley Line synergy, and missing counter fallback panels; `ImaginariumTheaterView.tsx` displays Season Intelligence, preservation priorities, underleveled notices, and "Save A{X}" badges.
  - Verify: `pnpm run build`, `pnpm run check:budget`
  - Files: `src/components/EndgameView.tsx`, `src/components/AbyssDualTeamView.tsx`, `src/components/ImaginariumTheaterView.tsx`

- [x] Task 6.7: Architecture Decision Record ADR-006
  - Acceptance: Authored `docs/decisions/0006-endgame-solvers-abyss-and-theater.md`.
  - Verify: Markdown review
  - Files: `docs/decisions/0006-endgame-solvers-abyss-and-theater.md`

- [x] Task 6.8: Full CI Quality Gate & Playwright E2E Verification
  - Acceptance: `node scripts/audit-game-data.mjs` (100%), `pnpm test` (594/594 passing), `pnpm run typecheck` (0 errors), `pnpm run lint` (0 errors), `pnpm run build` (passed), `pnpm run check:budget` (all chunks within budget), `pnpm exec playwright test e2e/journeys/07-endgame-solvers.spec.ts` (4/4 passed).
  - Verify: All automated commands pass cleanly.
