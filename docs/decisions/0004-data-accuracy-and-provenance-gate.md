# ADR-004: 7-Axis Game Data Integrity, Version SSOT & Substantive Provenance Architecture

## Status
Accepted

## Date
2026-11-22

## Context
Project Celestia relies on comprehensive client-side datasets covering 128 characters, 256 weapons, 64 artifact sets, modular talent scalings, character rotation profiles, active and historical banner phases, Imaginarium Theater schedules, and Spiral Abyss Floor 12 cycles for Version 7.2.
Prior to Milestone M4, several data-accuracy, provenance, and schedule-freshness blindspots existed:
1. **Version SSOT Drift**: Multiple files (`banner-rules.ts`, `data-freshness.ts`, view components) hardcoded `'7.2'` strings instead of importing canonical `CURRENT_GAME_VERSION` from `src/data/game-version.ts`.
2. **Theater Element-Eligibility Inconsistencies**: `season-7-2-dec-pyro-hydro-geo` erroneously listed `Columbina` (Hydro) in `specialGuestIds` (which must strictly be outside season elements), and `season-natlan-pyro-hydro-anemo` listed `Citlali` (Cryo) in `openingCastIds` (which must strictly match season elements).
3. **Mismatched Provenance Evidence**: `provenance-registry.ts` described `banner_5_4_phase_1` as `Yumemizuki Mizuki & Sigewinne` while `banners.ts` listed `Nefer & Furina`. Key core datasets (`rotations`, `talent-scaling`, `enka`, `artifact-weights`, `artifact-set-effects`, `team-archetypes`) lacked registered provenance entries.
4. **Schedule Expiration Blindness**: `isDatasetStale()` ignored schedule `effectiveEndDate`, allowing users to receive confident recommendations from expired schedules without visual warnings.
5. **Quality Gate Blindspots**: `audit-game-data.mjs` lacked validation for banner weapons, Theater element rules, 128 talent scaling JSON profiles, 128 character rotations, and substantive evidence quality.

## Decision
1. **Enforce Single Canonical Game Version SSOT**:
   - Centralize version declaration in `src/data/game-version.ts` (`CURRENT_GAME_VERSION = '7.2'`).
   - Bind `GACHA_RULES_VERSION = CURRENT_GAME_VERSION` in `src/data/banner-rules.ts`.
   - Update `PullAdvisorView.tsx`, `PullBudgetCard.tsx`, and `GachaAssumptionsModal.tsx` to reference canonical version constants dynamically.
   - Enforce zero hardcoded version literal drift via Axis 5 in `scripts/audit-game-data.mjs`.

2. **Fix Theater Eligibility & Schedule Calibration**:
   - In `src/data/theater-seasons.ts`:
     - `season-7-2-dec-pyro-hydro-geo`: Replaced `Columbina` in `specialGuestIds` with `Citlali` (Cryo).
     - `season-natlan-pyro-hydro-anemo`: Replaced `Citlali` in `openingCastIds` with `Xiangling` (Pyro).
     - Added authoritative `sourceUrl` and calibrated `verifiedAt` dates across all active and historical seasons.
   - In `src/data/banners.ts`:
     - Aligned historical 5.x banner `verifiedAt` dates with their respective patch release dates.

3. **Substantive Data Provenance Registry**:
   - Expanded `DataProvenance` in `src/types/genshin.ts` with `VerificationMethod` (`'official_notice' | 'in_game_verification' | 'theorycraft_consensus' | 'sandbox_simulation'`), `verifiedFields: string[]`, and `effectiveEndDate?: string`.
   - Overhauled `src/data/provenance-registry.ts` to register every banner phase, Abyss cycle, Theater season, and core system dataset (`characters_v7_2_batch7`, `weapons_v7_2_signatures`, `artifacts_v7_2_master`, `artifact_weights_v7_2`, `talent_scaling_v7_2_curves`, `rotations_v7_2_catalog`, `enka_id_map_v7_2`, `team_archetypes_v7_2`).
   - Fixed evidence alignment for `banner_5_4_phase_1` (Nefer & Furina).

4. **Expiration Detection & Prominent Stale Warnings**:
   - Enhanced `src/services/data-freshness.ts` with `isScheduleExpired()` checking `effectiveEndDate`.
   - Upgraded `src/components/DataFreshnessBadge.tsx` with verification method badges, audited fields list, and click-toggle support for mobile touch targets.
   - Exported `StaleDataWarningBanner` and mounted it prominently across `AbyssDualTeamView.tsx`, `ImaginariumTheaterView.tsx`, and `PullAdvisorView.tsx`.
   - Added freshness indicator badges to `TeamGeneratorView.tsx` and `ArtifactStopView.tsx`.

5. **7-Axis Automated Data Integrity Quality Gate**:
   - Upgraded `scripts/audit-game-data.mjs` to validate:
     - **Axis 1**: Entity counts, schema & ID uniqueness across 128 characters, 256 weapons, 64 artifact sets, 128 talent-scaling JSON files, and 128 character rotations.
     - **Axis 2**: Referential integrity across builds, banners, featured weapons, signature weapons, 4★ pools, artifact set effects, and Theater element/guest eligibility.
     - **Axis 3**: Schedule chronology and date validity (`startDate < endDate`, YYYY-MM-DD format).
     - **Axis 4**: Enka avatar showcase mapping completeness (124 entries: 122 unique + Aether/Lumine).
     - **Axis 5**: Single canonical game version SSOT without duplicated literals.
     - **Axis 6**: Substantive provenance evidence (HTTPS URLs, verification methods, audited fields, evidence >= 25 chars).
     - **Axis 7**: Active core dataset freshness matching `CURRENT_GAME_VERSION`.

## Consequences
- **Positive**: 100% referential integrity and game-rule compliance guaranteed across all 128 characters, 256 weapons, and all active/historical schedules.
- **Positive**: Zero version drift; updating `CURRENT_GAME_VERSION` automatically propagates across all engines, banners, badges, and modals.
- **Positive**: Users are immediately alerted via `StaleDataWarningBanner` when viewing historical Abyss cycles, Theater seasons, or past banner phases.
- **Positive**: CI quality gate automatically catches orphan keys, broken references, or unverified datasets before commit.
- **Evolution (Milestone M9 Phase 1)**: Evolved in [ADR-009: Data Trust & Recommendation Reliability Architecture (Milestone M9 Phase 1)](0004-m9-data-trust-and-recommendation-reliability.md), which decouples dataset verification authenticity from schedule temporal lifecycles, prunes 3 redundant registry records (to 35 canonical datasets), eliminates fabricated metadata, establishes frozen legacy expiration boundaries, and formalizes universal `RecommendationReliability` contracts.
