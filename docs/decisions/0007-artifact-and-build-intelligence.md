# ADR-007: Artifact Intelligence, Accuracy & Build Optimization (M7)

## Status
Accepted

## Date
2026-11-22

## Context
Project Celestia provides automated artifact evaluation, roll valuation, set bonus comparison, and stop-farming recommendations across Genshin Impact's 64 artifact sets and 128 playable characters.
Prior to Milestone M7, an audit of the artifact intelligence modules revealed 5 critical calculation and UX bugs:

1. **Elemental DMG% & Healing Bonus% ESR Inflation**: `MAX_SUBSTAT_VALUES` returns `0` for `pyro_dmg_`, `geo_dmg_`, `heal_`, etc. (as these cannot appear as substats). When calculating Equivalent Substat Rolls (ESR) for set bonuses (e.g. 2pc +15% Elemental DMG), `MAX_SUBSTAT_VALUES[stat] || 1` divided by `1`—inflating 15% Elemental DMG from ~3.0 rolls to 15 (or 7.5 rolls if halved) and 4pc Nighttime Whispers (50% Geo DMG) to 25 rolls. Furthermore, elemental set bonuses were awarded regardless of whether the character matched the element, Retracing Bolide 2pc had a fake `def_: 15`, buff dilution was ignored, and v5.x–v7.2 artifact sets were omitted.
2. **Broken 2pc+2pc Comparison & Hardcoded Gladiator's Finale**: `compareSetConfigurations` ignored `_context`, unconditionally defaulted the companion 2pc partner to `"Gladiator's Finale"` (+18% ATK) even for HP%, DEF%, or EM scaling characters (e.g., Neuvillette, Zhongli, Alhaitham, Chiori), and failed to scale the break-even roll delta with the player's actual equipped substat roll count.
3. **No-op Hyperbloom Preset & Flat ATK Dilution Gap**: In `adjustWeightsForTeamContext`, `hyperbloom` team preset was a no-op (leaving transformative EM scaler weights unadjusted), while Bennett's massive flat ATK buff diluted `atk_` but ignored flat `atk`, and external DMG% buffs (Furina, Kazuha/VV) did not account for saturation diminishing returns on DMG% scalers.
4. **Missing Weapon & Ascension ER Hooks with Mutable Cache Leak**: `evaluateWholeBuildEr` inside `analyzeArtifactBuild` always defaulted `weaponEr = 0` and `ascensionEr = 0`, forcing characters like Bennett with Favonius Sword (61.3% ER) or Raiden Shogun (32% ascension ER) to report false ER deficits. Additionally, `getCharacterStatWeights` returned an uncloned fallback object from `STAT_WEIGHTS_CACHE`, which allowed external modifications to mutate the global cache.
5. **Universal Stop-Farming Engine Invisibility in UI**: While `analyzeArtifactBuild` computed `universalStop` (`STOP` / `FARM_DOMAIN` / `STRONGBOX_ONLY` / `USE_ELIXIR` / `USE_DUST`), `stopScore`, `roiPer1kResinPct`, hard gates, per-slot completion %, and Elixir/Dust EV, `ArtifactStopView.tsx` and `ArtifactSlotCard.tsx` never rendered them or exposed Goal / Bonus ER controls, leaving users with outdated continuous logistic descriptions.

## Decision

1. **Normalized Single-Roll Equivalents & Element Validation (`src/data/artifact-set-effects.ts`)**:
   - Introduced `NON_SUBSTAT_ROLL_EQUIVALENT` calibrated against KQM standard roll distributions: Elemental DMG% (5.0% per roll), Physical DMG% (6.25% per roll), and Healing Bonus% (4.5% per roll).
   - Implemented `ELEMENTAL_DMG_STAT_TO_ELEMENT` validation: characters only receive elemental damage set bonus ESR if their character vision matches the stat element (or if character identity cannot be resolved).
   - Added team buff saturation multipliers: applying `0.82×` DMG% multiplier under Furina/Kazuha and `0.70×` ATK multiplier under Bennett.
   - Expanded set effects to cover missing v5.x–v7.2 sets (`Finale of the Deep Galleries`, `Night of the Sky's Unveiling`, `Long Night's Oath`, `Scroll of the Hero of Cinder City`, `Obsidian Codex`, `Unfinished Reverie`, `Fragment of Harmonic Whimsy`, `Song of Days Past`, `Nighttime Whispers in the Echoing Chasm`, plus `Instructor` and `Scholar`). Fixed Retracing Bolide to +35% Shield Strength without fake DEF.

2. **Context-Aware 2pc+2pc Comparison & Equipped Roll Scaling (`src/engines/artifact-probability.ts`)**:
   - Implemented `findOptimal2pcPartner`: intelligently recommends complementary 2pc sets based on character primary scaling stats (e.g. Tenacity/Vourukasha for HP%, Husk for DEF%, Gilded/Wanderer for EM, Emblem for ER, or vision-matched Elemental DMG).
   - Scaled required substat roll thresholds dynamically against the player's equipped effective rolls rather than fixed constants: `breakEvenRollDelta = Math.max(0, currentTotalRolls - (target4pcEsr - currentSetEsr) * 0.9)`.

3. **Hyperbloom Preset & Team Buff Saturation (`src/engines/artifact-probability.ts`)**:
   - Handled `preset === 'hyperbloom'` by setting `eleMas = 1.0` and scaling down non-reaction offensive stats (`atk_`, `atk`, `critRate_`, `critDmg_` to 0.15×–0.25×).
   - Diluted flat `atk` by `0.65×` alongside `atk_` when Bennett or custom flat ATK buffs are present.
   - Diluted elemental damage weights when massive external DMG% buffs (Furina, Kazuha/VV) are present.

4. **Weapon/Ascension ER Hooks & Immutable Cache Access**:
   - Exposed `weaponEr`, `ascensionEr`, and `customErTarget` on `TeamContext`.
   - Wired `weaponEr` and `ascensionEr` directly into `evaluateWholeBuildEr` inside `analyzeArtifactBuild`, with fallback inference from character base burst energy cost when requirements are unspecified.
   - Ensured `getCharacterStatWeights` strictly returns a deep cloned copy (`{ ...fallback }`) to prevent global cache pollution.
   - Added 4 new Domain entries in `DOMAIN_PAIRS_REGISTRY` (Derelict Masonry Dock, Spire of Moonlit Tides, Ashen Crucible, Crimson Bastion) and 4 new sets to `STRONGBOX_SETS_SET`.

5. **Universal Stop-Farming UI Integration (`src/components/ArtifactStopView.tsx` & `ArtifactSlotCard.tsx`)**:
   - Added an interactive `InvestmentGoal` selector (`casual` / `endgame` / `hyper`) and bonus weapon ER input into `ArtifactStopView.tsx`.
   - Added `Universal Stop-Farming Recommendation` banner with clear visual color-coded badges, Stop Score progress meter, ROI per 1,000 Resin, and Elixir / Sanctifying Dust expected value indicators.
   - Surfaced `SetBonusValidationResult` warnings (e.g. unknown sets, wasted 3pc, element mismatch).
   - Added `SlotUpgradePriorityItem` ranking strip and per-slot ceiling progress bars on `ArtifactSlotCard.tsx`.

## Consequences & Verification

- **Automated Test Coverage**:
  - `src/data/artifact-set-effects.test.ts`: Added tests verifying 2pc/4pc ESR calculation, elemental match guard, and team buff saturation.
  - `src/engines/artifact-validator.test.ts`: Added tests verifying roll/level boundaries and set bonus audit.
  - `src/engines/artifact-probability.test.ts`: Added tests verifying hyperbloom context weights, weapon ER deficit clearance, dynamic 2pc+2pc pairing, and ranked slot priorities.
  - Full Vitest suite: 604 / 604 tests passing across 39 files with 0 failures.
- **Static Analysis & Builds**:
  - `pnpm exec tsc --noEmit`: 0 type errors.
  - `pnpm run build`: Production Vite build succeeded without bundle issues.
