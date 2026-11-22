# ADR-008: Pull Advisor & Independent Wish Mathematics Verification

- **Status:** Accepted
- **Date:** 2026-11-22
- **Milestone:** M8 — Pull Advisor and Wish Mathematics

## Context
Project Celestia's Pull Advisor informs players how many pulls and Primogems are needed for C0 characters, multi-copy constellations (C1–C6), signature weapons (R1–R5), Chronicled Wish targets, and featured 4-star units. Hardcoded or unverified probabilities risk misleading players into conflating median expectations with guarantees.

## Decisions

1. **Versioned, Provenance-Linked Rule Registry (`src/data/banner-rules.ts`, `src/data/provenance-registry.ts`)**
   - Every banner configuration (`CHARACTER_BANNER_RULES`, `WEAPON_BANNER_RULES`, `CHRONICLED_BANNER_RULES`, `FOUR_STAR_RULES`, `STARGLITTER_CASHBACK_CONFIG`) carries a `provenanceId` linked to `DATA_PROVENANCE_REGISTRY`.
   - `validateBannerRules()` enforces mathematical invariants (probability bounds, soft/hard pity ordering, exact 55.000% Capturing Radiance stationary convergence, and 75/25 rate-up consistency) in automated tests.

2. **Exact 4-State Capturing Radiance Multi-Copy Propagation (`src/engines/gacha-math.ts`)**
   - Replaced independent fresh-copy convolution for multi-copy Character Event Wish goals with exact state-partitioned Markov propagation `P(totalPulls = k, endingStreak = s)` for `s ∈ {0, 1, 2, 3}`.
   - Guaranteed 5★ pulls preserve the active Radiance streak for subsequent copies, while Capturing Radiance triggers on streak 3 (resetting to 0), yielding exact worst-case ceilings (e.g., 990 pulls for fresh C6 rather than 1080).

3. **Segregated 4-Star Absorbing Markov Modeling (`src/engines/gacha-4star.ts`, `src/components/PullDistributionModal.tsx`)**
   - Separated Weapon 4★ soft-pity ramp (pull 8: 66%, pull 9: 96%, pull 10: 100%, 75% across 5 featured) from Character 4★ rules (pull 9: 56.1%, pull 10: 100%, 50% across 3 featured) with adaptive convergence (`< 1e-9` tail).
   - Fixed `PullDistributionModal` so 4★ CDF curves never inherit 5★ pity or 5★ guarantee state.

4. **Independent Verification Gate (`src/engines/gacha-verification.test.ts`)**
   - Added a first-principles pull-by-pull Dynamic Programming state-machine verifier, closed-form absorbing Markov 4★ proofs, and deterministic seeded Monte Carlo tests (Mulberry32) directly in the Vitest suite.

5. **Transparent Assumptions & Probability vs. Certainty UX**
   - `PullAdvisorView`, `PullDistributionModal`, and `GachaAssumptionsModal` surface live provenance dates, active rule assumptions, and all three planning anchors: **Expected Mean**, **Median (50%)**, and **Worst-Case Ceiling (100% / Uncapped)**.

## Consequences
- Future HoYoverse gacha rule changes require editing only `src/data/banner-rules.ts` and `src/data/provenance-registry.ts`, immediately audited by `validateBannerRules()` and `gacha-verification.test.ts`.
- Multi-copy Character Event Wish distributions are mathematically exact while executing in under 10 ms.
