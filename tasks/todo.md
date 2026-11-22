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

# Task List: M8 — Pull Advisor & Wish Mathematics Verification

- [x] Task 8.1: Exact 4-State Capturing Radiance Multi-Copy State Propagation
  - Acceptance: Multi-copy C1–C6 targets track joint distribution across Capturing Radiance streak states (`s ∈ {0, 1, 2, 3}`), guaranteeing 100% featured win at streak 3, preserving streaks on 50/50 guarantees, and reflecting true worst-case ceilings (990 pulls for fresh C6; 811 pulls from 89 pity + streak 3).
  - Verify: `pnpm test src/engines/gacha-math.test.ts`
  - Files: `src/engines/gacha-math.ts`, `src/engines/gacha-math.test.ts`

- [x] Task 8.2: 4-Star Segregation, Weapon 4★ Pity Ramp, and Uncapped Adaptive Convergence
  - Acceptance: `PullDistributionModal` strictly passes (0, false) for 4★ targets; `gacha-4star.ts` integrates separate Weapon 4★ soft-pity curve (pull 8 at 66%, pull 9 at 96%, 75% rate-up across 5 featured) with adaptive convergence (< 1e-9 remaining tail).
  - Verify: `pnpm test src/engines/gacha-4star.test.ts`, `src/components/PullDistributionModal.test.tsx`
  - Files: `src/engines/gacha-4star.ts`, `src/components/PullDistributionModal.tsx`

- [x] Task 8.3: Rule Invariant Validator & Provenance Registry Expansion
  - Acceptance: `provenance-registry.ts` enriched with `gacha_rules_4star_7_2` and `gacha_rules_starglitter_7_2`; `banner-rules.ts` implements `validateBannerRules()`; `GachaAssumptionsModal` wires live provenance statuses and source citations.
  - Verify: `pnpm test src/engines/gacha-verification.test.ts`, `src/components/GachaAssumptionsModal.test.tsx`
  - Files: `src/data/banner-rules.ts`, `src/data/provenance-registry.ts`, `src/components/GachaAssumptionsModal.tsx`

- [x] Task 8.4: Independent Verification Suite & Seeded Monte Carlo CI Integration
  - Acceptance: Replaced unseeded scratch script with `src/engines/gacha-verification.test.ts` implementing a first-principles pull-by-pull DP state machine, closed-form 4★ absorbing Markov proofs, deterministic Mulberry32 PRNG (100k trials), and boundary pity state audits.
  - Verify: `pnpm test src/engines/gacha-verification.test.ts`
  - Files: `src/engines/gacha-verification.test.ts`

- [x] Task 8.5: UI Transparency & Probability vs. Certainty Experience
  - Acceptance: Active Wish Model Assumptions summary strip added to `PullAdvisorView.tsx`; milestone cards in `PullDistributionModal.tsx` display Expected Mean alongside Median, P25, P90, and Hard Ceiling / Uncapped; `GachaAssumptionsModal.tsx` features an explicit Probability vs. Certainty guide.
  - Verify: `pnpm test src/components/PullAdvisorView.test.tsx`, `pnpm run build`
  - Files: `src/components/PullAdvisorView.tsx`, `src/components/PullDistributionModal.tsx`, `src/components/GachaAssumptionsModal.tsx`

- [x] Task 8.6: Architecture Decision Record ADR-008
  - Acceptance: Authored `docs/decisions/0008-pull-advisor-and-wish-mathematics.md`.
  - Verify: Markdown review
  - Files: `docs/decisions/0008-pull-advisor-and-wish-mathematics.md`
