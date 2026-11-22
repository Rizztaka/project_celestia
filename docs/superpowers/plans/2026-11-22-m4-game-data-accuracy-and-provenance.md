# Milestone M4: Game Data Accuracy, Provenance & Maintenance Gate Implementation Plan

> **For agentic workers:** Completed milestone plan documenting the implementation of Milestone M4.

**Goal:** Establish single-canonical game version SSOT, fix real Imaginarium Theater element eligibility defects, calibrate historical schedule dates and evidence, expand provenance with structured verification metadata, implement schedule expiration detection with prominent warning banners, and upgrade the data audit script into an unyielding 7-Axis Quality Gate.

---

## Deliverables & Architecture

1. **Schema & Version SSOT**:
   - `src/types/genshin.ts`: Extended `DataProvenance` with `VerificationMethod`, `verifiedFields: string[]`, `effectiveEndDate?: string`.
   - `src/data/banner-rules.ts`: Replaced hardcoded version string with `export const GACHA_RULES_VERSION = CURRENT_GAME_VERSION;`.
   - Propagated `CURRENT_GAME_VERSION` across `PullAdvisorView.tsx`, `PullBudgetCard.tsx`, and `GachaAssumptionsModal.tsx`.

2. **Schedule & Theater Data Calibration**:
   - `src/data/theater-seasons.ts`:
     - Fixed `season-7-2-dec-pyro-hydro-geo`: Replaced `Columbina` with `Citlali` (Cryo) in `specialGuestIds`.
     - Fixed `season-natlan-pyro-hydro-anemo`: Replaced `Citlali` with `Xiangling` (Pyro) in `openingCastIds`.
     - Populated missing `sourceUrl` and `verifiedAt` across all seasons.
   - `src/data/banners.ts`:
     - Aligned historical 5.x banner `verifiedAt` dates with authentic patch releases.

3. **Substantive Provenance Registry**:
   - `src/data/provenance-registry.ts`: Registered all banner phases, Abyss cycles, Theater seasons, and 8 core datasets (`characters_v7_2_batch7`, `weapons_v7_2_signatures`, `artifacts_v7_2_master`, `artifact_weights_v7_2`, `talent_scaling_v7_2_curves`, `rotations_v7_2_catalog`, `enka_id_map_v7_2`, `team_archetypes_v7_2`) with verified methods, audited fields, and specific evidence.
   - Corrected `banner_5_4_phase_1` evidence to `Nefer & Furina`.

4. **Expiration Detection & Prominent Warnings**:
   - `src/services/data-freshness.ts`: Implemented `isScheduleExpired()`, updated `isDatasetStale()` to check `effectiveEndDate`, exposed `getStaleDatasetSummary()`.
   - `src/components/DataFreshnessBadge.tsx`: Added verification method tags, audited fields list, mobile touch toggle, and exported `StaleDataWarningBanner`.
   - Mounted `StaleDataWarningBanner` in `AbyssDualTeamView.tsx`, `ImaginariumTheaterView.tsx`, and `PullAdvisorView.tsx`.
   - Mounted `DataFreshnessBadge` in `TeamGeneratorView.tsx` and `ArtifactStopView.tsx`.

5. **7-Axis Quality Gate & Tests**:
   - Upgraded `scripts/audit-game-data.mjs` to validate 7 axes:
     - Axis 1: Entity counts, schema & ID uniqueness.
     - Axis 2: Referential integrity & game-rule eligibility.
     - Axis 3: Schedule chronology & date validity.
     - Axis 4: Enka avatar showcase mapping completeness.
     - Axis 5: Single canonical game version SSOT.
     - Axis 6: Substantive provenance evidence.
     - Axis 7: Active dataset freshness.
   - Appended tests to `src/data/data-integrity.test.ts` and `src/services/data-freshness.test.ts`.
   - Calibrated `src/engines/theater-solver.test.ts`.

---

## Verification Results
- `node scripts/audit-game-data.mjs`: **PASSED** (100% compliance across all 7 axes).
- `pnpm test`: **PASSED** (557 tests across 39 test files).
- `pnpm run typecheck`: **PASSED** (`tsc -b` 0 errors).
- `pnpm run lint`: **PASSED** (0 errors).
- `pnpm run check:budget`: **PASSED** (Entry chunk: 38.52 KB raw / 11.69 KB gzip).
- `pnpm run verify:ssot`: **PASSED** (128 characters, 256 weapons, 64 artifact sets).
