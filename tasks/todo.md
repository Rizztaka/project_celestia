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

# Task List: M9 — Data Trust & Recommendation Reliability (Phase 1)

- [x] Task 9.1: Core Reliability Contracts & Exact Unions
  - Acceptance: Define decoupled contracts in `src/types/genshin.ts` (`VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, `RecommendationReliability`); define `ProvenanceStatus` as `Exclude<VerificationState, 'unregistered'>`; make `DataProvenance.sourceUrl?: string` optional with HTTPS guardrails; mark `effectiveEndDate?: string` as `@deprecated` legacy-only; document `isActionable` live-game semantics.
  - Verify: `pnpm run typecheck`, `pnpm test src/data/data-integrity.test.ts`
  - Files: `src/types/genshin.ts`, `src/data/data-integrity.test.ts`

- [x] Task 9.2: Provenance Registry Consolidation & Truthful Metadata
  - Acceptance: Prune 3 redundant schedule records (`abyss_floor_12_v7_2`, `theater_season_7_2_nov`, `theater_season_7_2_dec`) leaving canonical counterparts (`cycle-7-2`, `season-7-2-hydro-electro-geo`, `season-7-2-dec-pyro-hydro-geo`) authoritative (consolidated to 35 records); remove fabricated URL and invalid `verificationMethod: 'sandbox_simulation'` from `custom-sandbox`.
  - Verify: `node scripts/audit-game-data.mjs` (35 records audited)
  - Files: `src/data/provenance-registry.ts`, `scripts/audit-game-data.mjs`

- [x] Task 9.3: Compile & Runtime Compatibility Alignment
  - Acceptance: Update `src/services/data-freshness.ts` (`sourceUrl` null coalescing, remove `sandbox_simulation`) and `src/components/DataFreshnessBadge.tsx` for clean compile; assert legacy 17 `effectiveEndDate` boundary in `data-integrity.test.ts`.
  - Verify: `pnpm test`, `pnpm run build`
  - Files: `src/services/data-freshness.ts`, `src/components/DataFreshnessBadge.tsx`, `src/data/data-integrity.test.ts`

- [x] Task 9.4: Architecture Decision Record ADR-009 / M9
  - Acceptance: Author `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md` (ADR-009) covering Status, Context, Decision Drivers, Considered Options, Decision, Contract Specification, Consequences, and Phase 2 Roadmap.
  - Verify: Markdown review
  - Files: `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md`

- [x] Task 9.5: Reference Knowledge Base & Ledger Synchronization
  - Acceptance: Update `scripts/generate-reference.cjs` and `docs/knowledge/celestia-reference.md` with 35 canonical datasets, M9 contracts, and 2026-11-23 Verified Corrections Ledger entry; update `GEMINI.md` Section 2 and Section 4.
  - Verify: `pnpm run verify:ssot`, `pnpm test src/data/reference-ssot.test.ts`
  - Files: `scripts/generate-reference.cjs`, `docs/knowledge/celestia-reference.md`, `GEMINI.md`

- [x] Task 9.6: Central Recommendation Reliability Evaluator (Phase 2)
  - Acceptance: Author `src/services/recommendation-reliability.ts` implementing `evaluateRecommendationReliability()`, `evaluateDatasetFreshness()`, `resolveScheduleTemporalState()`, 4 freshness policies (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`), dependency linkage enforcement, archive compromise guards, and deterministic sorting.
  - Verify: `pnpm vitest run src/services/recommendation-reliability.test.ts` (33 tests passing)
  - Files: `src/services/recommendation-reliability.ts`, `src/services/recommendation-reliability.test.ts`

- [x] Task 9.7: Single-Policy Freshness Delegation (Phase 2)
  - Acceptance: Refactor `src/services/data-freshness.ts` to delegate directly to `evaluateDatasetFreshness()` and `isSandboxDatasetId()`; ensure legacy parity, unregistered custom sandbox alignment, and zero divergence.
  - Verify: `pnpm vitest run src/services/data-freshness.test.ts` (21 tests passing)
  - Files: `src/services/data-freshness.ts`, `src/services/data-freshness.test.ts`

- [x] Task 9.8: Removal of Legacy `effectiveEndDate` & Schedule Date Guards (Phase 2)
  - Acceptance: Remove `effectiveEndDate?: string` from `DataProvenance` in `src/types/genshin.ts`; purge all 17 legacy `effectiveEndDate` fields from `src/data/provenance-registry.ts`; add Axis 6 schedule-date duplicate guard to `scripts/audit-game-data.mjs`; update compile-time and runtime assertions in `src/data/data-integrity.test.ts`.
  - Verify: `node scripts/audit-game-data.mjs`, `pnpm vitest run src/data/data-integrity.test.ts` (30 tests passing)
  - Files: `src/types/genshin.ts`, `src/data/provenance-registry.ts`, `scripts/audit-game-data.mjs`, `src/data/data-integrity.test.ts`

- [x] Task 9.9: Conservative Future-Version Provenance Policy & Boundary Testing (Phase 2)
  - Acceptance: Enforce `isFutureVersion: true` when `compareGameVersions(record.version, CURRENT_GAME_VERSION) > 0`, downgraded to `provisional` (`future_version`), blocked from live actionability in `current` mode and from historical classification in `archive_simulation` mode, permitted only in `planning_preview` mode as qualified and non-actionable with warnings.
  - Verify: `pnpm vitest run src/services/recommendation-reliability.test.ts src/services/data-freshness.test.ts`
  - Files: `src/services/recommendation-reliability.ts`, `src/services/data-freshness.ts`

- [x] Task 9.10: Full Test Suite Verification & Quality Gates (Phase 2)
  - Acceptance: 92/92 focused tests across `recommendation-reliability.test.ts` (33), `data-freshness.test.ts` (21), `data-integrity.test.ts` (30), and `DataFreshnessBadge.test.tsx` (8); exactly 661/661 tests passing repository-wide across 40 test suites; 100% compliance on 7-Axis Data Integrity Audit.
  - Verify: `pnpm vitest run`, `node scripts/audit-game-data.mjs`, `pnpm exec tsc --noEmit`
  - Files: `src/services/recommendation-reliability.test.ts`, `src/services/data-freshness.test.ts`, `src/data/data-integrity.test.ts`, `src/components/DataFreshnessBadge.test.tsx`

- [x] Task 9.11: Authoritative Documentation & ADR-009 Phase 2 Transition
  - Acceptance: Transition `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md` (ADR-009) to Accepted (Phase 2 Implemented); synchronize `docs/knowledge/celestia-reference.md` via `pnpm run verify:ssot`; record M9 Phase 2 invariants in `GEMINI.md` Section 4; generate walkthrough artifact `Project_Celestia_M9_Phase2_Documentation_Walkthrough.md`.
  - Verify: `pnpm run verify:ssot`, `pnpm test src/data/reference-ssot.test.ts`
  - Files: `docs/decisions/0004-m9-data-trust-and-recommendation-reliability.md`, `scripts/generate-reference.cjs`, `docs/knowledge/celestia-reference.md`, `GEMINI.md`

# Task List: M9 — Data Trust & Recommendation Reliability (Phase 3 Roadmap)

- [ ] Task 9.12: Analytical Engine Return Type Integration (Phase 3)
  - Scope: Update return types of `generateBestTeams()`, `solveAbyssDualTeams()`, `solveImaginariumTheater()`, `calculateArtifactUpgradeProbabilities()`, and `evaluatePullPlan()` to return `reliability: RecommendationReliability`.
  - Verify: Solver unit tests, engine integration tests.
  - Files: `src/engines/team-generator.ts`, `src/engines/abyss-solver.ts`, `src/engines/theater-solver.ts`, `src/engines/artifact-probability.ts`, `src/engines/pull-advisor.ts`

- [ ] Task 9.13: UI Badging & Actionability Header Integration (Phase 3)
  - Scope: Upgrade `DataFreshnessBadge.tsx` and view headers (`AbyssDualTeamView.tsx`, `ImaginariumTheaterView.tsx`, `PullAdvisorView.tsx`, `TeamGeneratorView.tsx`) to surface reliability status ratings, actionability pills, and multi-dependency breakdown modals.
  - Verify: Component tests, browser verification.
  - Files: `src/components/DataFreshnessBadge.tsx`, `src/components/AbyssDualTeamView.tsx`, `src/components/ImaginariumTheaterView.tsx`, `src/components/PullAdvisorView.tsx`, `src/components/TeamGeneratorView.tsx`

- [ ] Task 9.14: Playwright E2E Reliability Journeys (Phase 3)
  - Scope: Create comprehensive Playwright journeys verifying live actionability indicators across active schedules, planning preview badges for upcoming banners, and historical warnings in archive modes.
  - Verify: `pnpm exec playwright test e2e/journeys/09-data-reliability.spec.ts`
  - Files: `e2e/journeys/09-data-reliability.spec.ts`



