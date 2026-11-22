# ADR-006: High-Fidelity Endgame Solvers (Spiral Abyss Floor 12 & Imaginarium Theater)

## Status
Accepted

## Date
2026-11-22

## Context
Project Celestia provides automated solvers and strategic guidance for Genshin Impact's premier endgame modes: Spiral Abyss Floor 12 (dual disjoint teams) and Imaginarium Theater (Visionary 10-act draft schedule with 2-vigor constraints).
Prior to Milestone M6, several critical limitations and inaccuracies existed in both endgame engines and their user interfaces:

1. **Abyss Solver Inaccuracies & Hardcoded Mechanics**:
   - `effectiveDmgMultiplier` (enemy base RES + team shred) was calculated in helper routines but omitted from the team ranking and scoring formula.
   - Rotating shield mechanics were hardcoded specifically to Chamber 3 Second Half. This resulted in false positives against single-element bosses (e.g., Version 7.1 Hydro Tulpa) and false negatives on rotating shield encounters in other chambers (e.g., Version 5.2 Iniquitous Baptist).
   - Candidates for dual halves were selected strictly from top raw-synergy teams. If a player owned an encounter counter (e.g., a Bow user for Aeonblight Drake or a Natlan Nightsoul unit for Wayob Accretion) that was not selected in the top raw synergy compositions, the solver left the mechanic unsatisfied rather than injecting the counter as a specialized tech variant.
   - Lack of structured explainability: players were given raw clearance strings without insight into Target Profile fit (Single-Target vs. AoE cleave), wave counts, enemy movement traits (teleporting, airborne, burrowing), Ley Line buff synergy, or bench substitute fallbacks.

2. **Imaginarium Theater Scheduling & Recommendation Flaws**:
   - `recommendSupportCastBorrow` recommended Opening Cast members who were already granted for free at Level 80 trial status, wasting the player's 1-character friend borrow slot.
   - Manual member swaps (`swapTheaterActMember`) and removals (`removeTheaterActMember`) did not re-evaluate `bossMatchup` ratings, leading to stale or misleading combat grades.
   - Owned characters below the Level 70 Visionary/Hard threshold were silently dropped without reporting which characters needed investment to unlock eligibility.
   - Shortfall drafting suffered from stranded / orphaned vigor: greedy drafting of higher-priority characters left bench units with unspendable vigor when fewer acts remained than their remaining vigor points, causing early playable acts to fail to reach 4 members.
   - Absence of high-level Season Intelligence: players had no visibility into Apex Boss (Act 10) readiness, carry preservation schedules, roster vulnerabilities, or phased drafting advice.

## Decision

1. **Abyss Solver Architecture & Metadata-Driven Mechanics**:
   - **Explicit Metadata Schema**: Replaced positional checks with explicit `rotatingShields: Element[]`, `targetProfile: 'Single-Target' | 'AoE' | 'Mixed'`, `waveCount: number`, `movementTraits: EnemyMovementTrait[]`, `positioningTip: string`, and `chamberBuff: string` declared in `src/data/abyss-schedules.ts`.
   - **Encounter-Counter Candidate Injection**: Implemented `injectEncounterCounterCandidates` in `src/engines/abyss-solver.ts`. When an encounter requires a specialized counter (Bow, specific elemental shield-breaker, Natlan Nightsoul) and raw synergy teams lack it, the engine scans the player's bench, creates tech-slot variants, and evaluates them alongside primary teams.
   - **Effective Damage Multiplier Scoring**: Integrated `effectiveDmgMultiplier` into half scoring, mathematically rewarding RES shred (VV 4pc, Zhongli, Xilonen, elemental skills) against high-RES targets (e.g. 70% Ruin Grader, 40% Consecrated Beasts).
   - **Structured Half Explanations & Fallback Advisor**: Populated `firstHalfExplanation`, `secondHalfExplanation`, and `missingCounterFallbacks` on `AbyssDualTeamPlan`. When a requirement cannot be satisfied, the solver surfaces owned bench substitutes with actionable tactical advice.

2. **Imaginarium Theater Scheduling & Season Intelligence**:
   - **Pigeonhole Vigor Scheduling Algorithm**: Integrated remaining act tracking into `scoreCandidateForAct`. Whenever a character's remaining vigor equals or exceeds the number of remaining unfilled acts (`currentVigor >= remainingUnfilledActs`), the character receives an urgency score boost. By pigeonhole principle, this guarantees that shortfall rosters exhaust all available vigor across early playable acts (Acts 1–3 in Visionary) without leaving orphaned vigor.
   - **Curated Support Cast Borrow Advisor**: `recommendSupportCastBorrow` strictly excludes both owned characters and free Opening Cast trial units, prioritizing premier supports and counter units tailored specifically to the season's Act 10 Apex Boss mechanics (e.g. excluding Hydro carries for Hydro Tulpa; rewarding Nightsoul for Centaur Automaton).
   - **Dynamic Matchup Re-Evaluation**: `swapTheaterActMember` and `removeTheaterActMember` automatically re-invoke `evaluateBossActMatchup` on boss acts whenever act lineups change.
   - **Underleveled Qualification Visibility**: `filterEligibleTheaterRoster` records and returns `excludedUnderleveled` characters for player transparency.
   - **Season Intelligence Engine (`analyzeTheaterSeasonPlan`)**: Computes `TheaterSeasonAnalysis` featuring Apex Boss readiness grade (`'Ready' | 'Needs Preparation' | 'At Risk'`), carry preservation schedule (`preservationPlan`), high-value season archetypes, roster weakness checks, and a 5-phase draft roadmap.

3. **User Interface Integration**:
   - **`EndgameView.tsx`**: Enriched enemy reference cards with target profile tags, wave count badges, movement traits, positioning tips, chamber buffs, and usable counter buttons with character portraits.
   - **`AbyssDualTeamView.tsx`**: Surfaced "Why This Team Suits Assigned Half" cards with Target Profile Fit badges, Ley Line match notes, strengths, risks, positioning tips, and a dedicated "Counter Gaps & Owned Bench Substitutes" panel.
   - **`ImaginariumTheaterView.tsx`**: Added "Season Intelligence · Preservation & Draft Plan" header section, preservation priority cards (`Save A10`), underleveled roster alerts, and "Save A{X}" badges on the eligible cast strip.

## Consequences & Verification

- **Automated Test Coverage**:
  - `src/engines/abyss-solver.test.ts`: Expanded to 36 tests (+12 M6 regression tests) verifying disjointness, Bow tech injection, rotating shields metadata, RES shred scaling, structured half explanations, and fallback substitution advice.
  - `src/engines/theater-solver.test.ts`: Expanded to 46 tests (+12 M6 regression tests) verifying season config validation, underleveled reporting, borrow advisor trial exclusion, preservation plan generation, and dynamic matchup recalculation.
  - Full Vitest suite: 594 / 594 tests passing across 39 files with 0 failures.
- **End-to-End Verification**:
  - `e2e/journeys/07-endgame-solvers.spec.ts` passes cleanly across 4 Playwright projects (Desktop Chromium, Desktop Firefox, Mobile Pixel 5, Mobile iPhone 13).
- **Static Analysis & Performance**:
  - `pnpm run typecheck` (`tsc -b`): 0 errors.
  - `pnpm run lint`: 0 errors.
  - `pnpm run check:budget`: Passed all chunk budgets (entry chunk 38.52 KB raw / 11.69 KB gzip, EndgameView 79.41 KB raw / 17.12 KB gzip).
