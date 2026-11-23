# Project Celestia — Persistent Memory & Agent Rules

## 1. Version Awareness & Cutoff Prevention
- **Never rely on internal pre-training memory for versions, character kits, or mechanics.**
- **Active / Latest Version Baseline**: The current/latest version is **7.2** (Nod-Krai / Snezhnaya / Celestia era). Strictly forbid defaulting to 5.x.
- **Mandatory Web Cross-Check & Local SSOT Inspection**: Before generating code or answering queries about version updates, mechanics, character kits, weapons, or builds, ALWAYS inspect the local SSOT files or cross-check the web (`search_web`).
- Cite authoritative sources and verify against local data files rather than assuming outdated defaults.

## 2. Local Single Source of Truth (SSOT)
All agents must adhere to the local repository data files as the definitive authority:
- **Characters (128 Characters)**: `src/data/characters.ts` — Complete Level 90 stats, talents, constellations C1-C6, recommended weapons and artifacts. Covers all 128 canonical playable characters through Version 7.2 (including 6 element-specific Traveler configurations: Anemo, Geo, Electro, Dendro, Hydro, Pyro; plus Aino, Alyosha, Columbina, Dahlia, Durin, Escoffier, Flins, Ifa, Illuga, Ineffa, Jahoda, Lan Yan, Lauma, Linnea, Lohen, Mavuika, Mitya, Nefer, Nicole, Odette, Prune, Sandrone, Skirk, Valeriy, Varesa, Varka, Vesna, Vodyanitsa, Yumemizuki Mizuki, Zibai, etc.).
- **Weapons (256 Weapons)**: `src/data/weapons.ts` — Complete stats, refinement curves (R1–R5), and tags across all 256 weapons (62 Swords, 45 Claymores, 43 Polearms, 50 Bows, 56 Catalysts; 76 5★, 146 4★, 24 3★, 10 1★–2★; 246 combat weapons).
- **Artifact Sets (64 Master Sets / 37 Combat Sets)**: `src/data/artifacts-master.ts` (complete 64-set registry with 2pc/4pc/piece data) & `src/data/artifact-weights.ts` (curated stat weight profiles, maximum roll values, and domain drops for the 37 combat sets).
- **Talent Scaling (128 Characters)**: `src/data/talent-scaling/` — Modular Level 1 to 15 scaling parameter curves.
- **Character Rotations (128 Calibrated Profiles)**: `src/data/character-rotations.ts` — 128 calibrated rotation profiles and cooldown models.
- **Data Provenance & Reliability (35 Canonical Datasets)**: `src/data/provenance-registry.ts` — Authoritative provenance registry across banners, Abyss cycles, Theater seasons, and core system datasets. Formal decoupled M9 reliability contracts in `src/types/genshin.ts` (`VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, `RecommendationReliability`). Central Recommendation Reliability Evaluator SSOT in `src/services/recommendation-reliability.ts` and single-policy freshness architecture in `src/services/data-freshness.ts`.

## 3. Persistent Knowledge Base & Reference Documentation
- **Master Knowledge Base**: [`docs/knowledge/celestia-reference.md`](docs/knowledge/celestia-reference.md) contains the authoritative directory of all 128 characters (by Element and Region), 64 artifact sets, 256 weapons, modular talent scaling, combat systems (Moonsign, Nightsoul, Hexerei, Polestar, Bond of Life), and the permanent Corrections Ledger.
- **Self-Correction Protocol**: Whenever an agent makes a mistake regarding version numbers, character kits, weapon passives, or builds:
  1. Immediately consult `docs/knowledge/celestia-reference.md` and the SSOT data files.
  2. Permanently record the incident, erroneous claim, correct baseline, and root-cause remediation into the **Verified Corrections Ledger** in `docs/knowledge/celestia-reference.md`.
  3. Update the summary ledger below in this file.

## 4. Verified Corrections Ledger (Summary)
- **Baseline Version**: Current era is **Version 7.2** (Nod-Krai / Snezhnaya / Natlan / Celestia). Defaulting to 5.x or earlier is strictly prohibited.
- **Playable Character Count**: Exactly **128 canonical playable characters** (124+ baseline; 122 unique named characters plus 6 element-specific Traveler configurations) are supported and tested in `src/data/characters.ts`.
- **Weapon Count & Authentic Signatures**: Exactly **256 weapons** (253+ baseline: 76 5★, 146 4★, 24 3★, 10 1★–2★; 246 combat weapons) across 5 classes (62 Swords [19 5★/35 4★/6 3★/2 1★–2★], 45 Claymores [11 5★/27 4★/5 3★/2 1★–2★], 43 Polearms [13 5★/25 4★/3 3★/2 1★–2★], 50 Bows [12 5★/31 4★/5 3★/2 1★–2★], 56 Catalysts [21 5★/28 4★/5 3★/2 1★–2★]) in `src/data/weapons.ts`. Hallucination of weapon names (e.g. Void-Severing Edge, Glacial Colossus) is strictly forbidden; all 76 authentic signatures come directly from `WEAPONS_DATA`.
- **Artifact Sets**: Exactly **64 Master Artifact Sets** in `src/data/artifacts-master.ts` (with 37 combat sets modeled with roll valuation and weight profiles in `src/data/artifact-weights.ts` and `src/data/characters.ts`).
- **Talent Scaling**: Modular parameter curves across Level 1–15 in `src/data/talent-scaling/` for all 128 characters.
- **Ledger Preservation**: `scripts/generate-reference.cjs` parses and preserves the Verified Corrections Ledger when synchronizing markdown documentation with data files.
- **Build & Stat Weight Calibration**: Synchronized builds and descriptions for all 10 Batch 7 characters (Alyosha, Flins, Ifa, Linnea, Lohen, Odette, Sandrone, Varesa, Vesna, Zibai); implemented dynamic stat weight synthesis with comprehensive character alias resolution (`Kokomi`, `Ayaka`, `Itto`, `Childe`, `Yae`, etc.) in `getCharacterStatWeights`; guaranteed 0 crit weight for Sangonomiya Kokomi in both stat weights and weapon solver; corrected targetSets typos for Scroll of the Hero of Cinder City, Shimenawa's Reminiscence, and Vourukasha's Glow.
- **Gacha Mathematics & Wish Engine Invariants (M8 Baseline)**:
  - **Capturing Radiance**: 4-state Markov renewal model `[0.50, 0.50, 8/11, 1.00]`. Streak 3 yields 100% guarantee (4th attempt). Long-term win rate on 50/50s strictly equals 55.000%.
  - **Weapon Banner 75/25 Guarantee Carryover**: Losing a 5★ to an off-banner standard weapon guarantees the next 5★ is a featured rate-up weapon (50% target win rate). This guarantee carries over across banner phases even though Fate Points reset to 0.
  - **4-Star Math Separation**: 4-star character acquisition has no hard guarantee ceiling and must be modeled via an absorbing Markov chain (median ~35 pulls, 90th percentile ~105 pulls), strictly segregated from 5★ pity.
  - **Chronicled Wish Rules**: 0.600% base rate, 74 soft pity, 90 hard pity, 50% base rate-up, 1 Fate Point ceiling (resets between banners).
- **Data Trust & Recommendation Reliability Invariants (M9 Phase 1 Baseline)**:
  - **Decoupled 5-Axis Contracts**: Segregated data verification (`VerificationState = 'verified' | 'provisional' | 'stale' | 'unregistered'`), schedule temporal lifecycle (`TemporalState = 'upcoming' | 'active' | 'expired' | 'not_applicable'`), engine execution mode (`RecommendationMode = 'current' | 'planning_preview' | 'archive_simulation' | 'sandbox_simulation'`), and recommendation trust rating (`ReliabilityStatus = 'reliable' | 'qualified' | 'historical' | 'unsupported'`).
  - **Actionability Semantics (`isActionable`)**: Defined strictly as live-game actionability right now (`true` only for currently actionable `current` advice backed by supported, non-upcoming, non-expired data; `false` for forward-looking previews, historical archives, sandbox runs, and unsupported outputs).
  - **Canonical Provenance Registry (35 Datasets)**: Pruned 3 redundant aliases (`abyss_floor_12_v7_2`, `theater_season_7_2_nov`, `theater_season_7_2_dec`), leaving canonical schedule IDs (`cycle-7-2`, `season-7-2-hydro-electro-geo`, `season-7-2-dec-pyro-hydro-geo`) authoritative.
  - **Truthful Metadata & HTTPS Guardrails**: `sourceUrl` made optional without fabricated URLs (omitted allowed only for `in_game_verification` and `custom-sandbox`; HTTPS strictly enforced when present); removed invalid `'sandbox_simulation'` from `VerificationMethod`.
  - **Legacy Expiration Boundary**: `DataProvenance.effectiveEndDate` marked `@deprecated` and frozen at exactly 17 entries mirroring canonical schedules, scheduled for complete removal in Phase 2 in favor of canonical schedule entities (`BANNER_PHASES`, `ABYSS_CYCLES`, `THEATER_SEASONS`).
- **Data Trust & Recommendation Reliability Invariants (M9 Phase 2 Baseline)**:
  - **Central Evaluator SSOT (`src/services/recommendation-reliability.ts`)**: Authoritative module for 4 freshness policies (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`), canonical schedule temporal resolution (inclusive `[start, end]` for banners & Abyss; half-open `[start, end)` for Theater), dependency-linkage enforcement, archive compromise guards, and deterministic code-unit sorting.
  - **Single-Policy Freshness Architecture**: `src/services/data-freshness.ts` delegates directly to `evaluateDatasetFreshness()` and `isSandboxDatasetId()`, eliminating disparate staleness/expiry logic.
  - **Complete Removal of `effectiveEndDate`**: `DataProvenance.effectiveEndDate` permanently deleted; all 17 legacy entries purged from `src/data/provenance-registry.ts`.
  - **Axis 6 Audit & Contract Guardrails**: Axis 6 in `scripts/audit-game-data.mjs` and compile-time/runtime assertions in `src/data/data-integrity.test.ts` forbid duplicating schedule-date fields on `DataProvenance` and registry records.
  - **Conservative Future-Version Provenance Policy**: `isFutureVersion: true` when `compareGameVersions(record.version, CURRENT_GAME_VERSION) > 0`, downgraded to `provisional` (`future_version`), blocked from live actionability in `current` mode and from historical classification in `archive_simulation` mode, permitted only in `planning_preview` mode as qualified and non-actionable with warnings.

## 5. Project Stack & Environment
- **Runtime / Framework**: React 19 + Vite + TypeScript (see `package.json`)
- **Styling**: Tailwind CSS v4
- **Tooling**: pnpm / Vitest
