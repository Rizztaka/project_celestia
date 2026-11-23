# Project Celestia — Authoritative Reference & Knowledge Base (v7.2 Baseline)

> **Persistent Memory Notice**: This document is the primary authoritative reference for Project Celestia. All models, agents, and subagents must treat this document and the underlying data files as the undisputed Single Source of Truth (SSOT). Under NO circumstances should an agent default to legacy 5.x or prior versions. The active baseline is **Version 7.2** (encompassing Nod-Krai, Snezhnaya, Natlan, Fontaine, and Celestia eras).

---

## Table of Contents
1. [Core Directives & Self-Correction Protocol](#1-core-directives--self-correction-protocol)
   - [Single Source of Truth (SSOT) Files](#single-source-of-truth-ssot-files)
   - [Data Trust & Recommendation Reliability Architecture](#data-trust--recommendation-reliability-architecture-milestone-m9-contracts)
   - [Self-Correction Protocol](#self-correction-protocol-mandatory-for-all-agents)
2. [Active Baseline & Version Architecture](#2-active-baseline--version-architecture)
3. [Master Character Directory (128 Characters)](#3-master-character-directory-128-characters)
   - [Characters by Element](#characters-by-element)
   - [Characters by Region](#characters-by-region)
   - [Version 7.2 & Modern Era Highlights](#version-72--modern-era-highlights)
4. [Master Artifact Sets Directory (64 Sets / 37 Combat Sets)](#4-master-artifact-sets-directory-64-sets--37-combat-sets)
   - [Artifact Sets by Release Era & Archetype](#artifact-sets-by-release-era--archetype)
   - [Complete 37-Set Combat Roster](#complete-37-set-combat-roster)
   - [Master 64-Set Registry Index](#master-64-set-registry-index)
5. [Master Weapons Directory (256 Weapons)](#5-master-weapons-directory-256-weapons)
   - [Weapon Distribution Overview](#weapon-distribution-overview)
   - [5★ Signature Weapons Catalogue (All 76 Weapons)](#5-signature-weapons-catalogue-all-76-weapons)
   - [Key 4★ and 3★ Meta Weapons](#key-4-and-3-meta-weapons)
6. [Combat Mechanics & Era Systems](#6-combat-mechanics--era-systems)
7. [Verified Corrections Ledger (Permanent Incident Log)](#7-verified-corrections-ledger-permanent-incident-log)

---

## 1. Core Directives & Self-Correction Protocol

### Single Source of Truth (SSOT) Files
| Domain | SSOT File Path | Total Items | Description |
| :--- | :--- | :--- | :--- |
| **Characters** | `src/data/characters.ts` | **128 Characters** | Complete Level 90 stats, talents, constellations C1-C6, recommended weapons & artifacts |
| **Weapons** | `src/data/weapons.ts` | **256 Weapons** | 5 Weapon types (62 Swords, 45 Claymores, 43 Polearms, 50 Bows, 56 Catalysts; 76 5★, 146 4★, 24 3★, 10 1★-2★), R1–R5 passives & stats |
| **Artifacts** | `src/data/artifacts-master.ts` & `src/data/artifact-weights.ts` | **64 Sets** (37 Combat Sets) | Master registry of all 64 sets (1★–5★) plus stat weights, max substats, domain drops & builds |
| **Talent Scaling** | `src/data/talent-scaling/` | **128 Profiles** | Full Level 1 to 15 scaling multiplier curves (Modular Architecture) |
| **Rotations** | `src/data/character-rotations.ts` | **128 Profiles** | Precise action sequence, energy thresholds, skill cooldown timings |
| **Data Provenance** | `src/data/provenance-registry.ts` | **35 Canonical Datasets** | Substantive provenance records linking patch notices, in-game verification, and theorycraft evidence |

### Data Trust & Recommendation Reliability Architecture (Milestone M9 Contracts)

To decouple data verification authenticity from schedule temporal lifecycles and solver execution modes, Project Celestia establishes five strongly-typed, JSON-serializable reliability contracts in `src/types/genshin.ts`:

1. **`VerificationState`** (Exact 4-Value Union):
   - `'verified'`: Dataset independently audited and verified against official notices, direct in-game observation, or theorycraft consensus.
   - `'provisional'`: Preliminary data awaiting confirmation or active user sandbox modifications.
   - `'stale'`: Un-synchronized or outdated dataset from prior versions requiring review.
   - `'unregistered'`: Dataset or entity lacking a registered provenance entry in `DATA_PROVENANCE_REGISTRY`.

2. **`TemporalState`** (Exact 4-Value Union):
   - `'upcoming'`: Time-boxed schedule whose start date is in the future.
   - `'active'`: Currently active schedule within valid start and end dates.
   - `'expired'`: Concluded schedule past its effective end date.
   - `'not_applicable'`: Evergreen datasets (characters, weapons, formulas) without calendar expiration.

3. **`RecommendationMode`** (Exact 4-Value Union):
   - `'current'`: Real-time recommendation evaluated against live-game state and active schedules.
   - `'planning_preview'`: Forward-looking recommendation based on upcoming schedules or announced banners.
   - `'archive_simulation'`: Retrospective analysis evaluated against concluded historical schedules.
   - `'sandbox_simulation'`: Hypothetical solver evaluation against user-customized constraints or enemy lineups.

4. **`ReliabilityStatus`** (Exact 4-Value Union):
   - `'reliable'`: High-confidence recommendation backed by verified, currently active data.
   - `'qualified'`: Recommendation valid under explicit qualifications (provisional data, sandbox assumptions, or partial constraints).
   - `'historical'`: Informational output derived from expired schedules or archived combat environments.
   - `'unsupported'`: Output cannot be guaranteed due to missing provenance, conflicting data, or stale assumptions.

5. **`RecommendationReliability`** (Universal Solver Contract):
   ```typescript
   export interface RecommendationReliability {
     status: ReliabilityStatus;
     mode: RecommendationMode;
     isActionable: boolean;
     verification: VerificationState;
     temporalState: TemporalState;
     provenanceIds: string[];
     warnings: string[];
     dependencies?: ReliabilityDependencyDetail[];
     evaluatedAt?: string;
   }
   ```

6. **Actionability Semantics (`isActionable`)**:
   - Represents whether the recommendation is actionable in the live game *right now*.
   - Strictly `true` only for currently actionable (`current`) advice backed by supported, non-upcoming, non-expired data.
   - Strictly `false` for forward-looking previews (`planning_preview`), historical archives (`archive_simulation`), sandbox runs (`sandbox_simulation`), and `unsupported` outputs.

7. **Provenance Invariants & Complete Removal of `effectiveEndDate`**:
   - `ProvenanceStatus` = `Exclude<VerificationState, 'unregistered'>` (`'verified' | 'provisional' | 'stale'`).
   - `VerificationMethod` = `'official_notice' | 'in_game_verification' | 'theorycraft_consensus'`.
   - `sourceUrl?: string` is optional; when provided, HTTPS is strictly enforced. Omitted URLs are permitted only for `in_game_verification` and `custom-sandbox`.
   - `effectiveEndDate` is permanently removed from `DataProvenance`, and all 17 legacy entries are purged from `src/data/provenance-registry.ts`. Canonical schedule dates are derived exclusively from canonical entities (`BANNER_PHASES`, `ABYSS_CYCLES`, `THEATER_SEASONS`) and guarded by Axis 6 audit checks.

8. **The 4 Freshness Policies & Risk Tiers**:
   - `schedule_window` (High Risk): Governed strictly by canonical schedule start/end dates. Never decays via 42-day cycle.
   - `version_bound` (High Risk): Governed strictly by active `version === CURRENT_GAME_VERSION`. Never decays via 42-day cycle.
   - `patch_cadence` (Low Risk): Meta heuristics reviewed on 42-day cadence (`PATCH_CYCLE_DAYS`). Stale if `ageDays > 42` or prior version.
   - `sandbox` (Low Risk): User-configured sandbox scenario. Always provisional, never ages out.

9. **Central Evaluator SSOT & Single-Policy Freshness Architecture**:
   - Central Evaluator SSOT (`src/services/recommendation-reliability.ts`) exposes `evaluateRecommendationReliability()`, `evaluateDatasetFreshness()`, and `resolveScheduleTemporalState()`.
   - `src/services/data-freshness.ts` delegates directly to `evaluateDatasetFreshness()` and `isSandboxDatasetId()`, eliminating disparate staleness/expiry logic.

10. **Conservative Future-Version Provenance Policy**:
    - When `compareGameVersions(record.version, CURRENT_GAME_VERSION) > 0`, `isFutureVersion: true` is flagged, downgraded to `provisional` (`future_version`).
    - Blocked from live actionability in `current` mode (`isActionable: false`, `status: 'qualified'`).
    - Rejected from historical classification in `archive_simulation` mode (`status: 'unsupported'`).
    - Permitted only in `planning_preview` mode as qualified and non-actionable with warnings.

### Self-Correction Protocol (Mandatory for All Agents)
1. **Never Assume Outdated Baselines**:
   - The current baseline is **Version 7.2**.
   - If you catch yourself thinking Genshin is on version 5.0, 5.2, or 5.x, **STOP IMMEDIATELY**. Correct your assumption to 7.2.
2. **Local Inspection First**:
   - Before answering queries about kits, passives, scaling, or builds, verify directly against the SSOT files listed above.
3. **Web Cross-Check**:
   - If uncertain about recent patches, banners, or character kits, perform a web search (`search_web`) or inspect the local test suites.
4. **Log Corrections**:
   - Any hallucination or error pointed out by the user must be added to the [Verified Corrections Ledger](#7-verified-corrections-ledger-permanent-incident-log) in this file and summarized in `GEMINI.md`.

---

## 2. Active Baseline & Version Architecture

Project Celestia models the full state of Genshin Impact up through **Version 7.2**.
Key regional progression:
- **Mondstadt & Liyue**: v1.0+
- **Inazuma**: v2.0+
- **Sumeru**: v3.0+ (Dendro element, Quicken, Hyperbloom, Burgeon)
- **Fontaine**: v4.0+ (Arkhe system, Bond of Life, HP fluctuation mechanics)
- **Natlan**: v5.0+ (Nightsoul Blessing, Phlogiston, Nightsoul Burst)
- **Nod-Krai**: v6.0+ (Moonsign system, Ascendant Gleam, Lunar reactions)
- **Snezhnaya & Celestia**: v7.0 - v7.2 (Polestar Fields, Stellar reactions, Hexerei rites, Abyss mastery)

---

## 3. Master Character Directory (128 Characters)

### Summary Statistics
- **Total Playable Characters**: **128** (including 6 element-specific Traveler configurations)
- **5-Star Characters**: 76
- **4-Star Characters**: 52

### Characters by Element

#### Hydro (18 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Columbina** | `Columbina` | 5★ | Catalyst | Nod-Krai / Snezhnaya | Buffer/Shred, Off-Field DPS | Golden Troupe / Deepwood Memories — A Thousand Floating Dreams / Sacrificial Fragments |
| **Furina** | `Furina` | 5★ | Sword | Fontaine | Buffer/Shred, Off-Field DPS | Golden Troupe / Tenacity of the Millelith — Splendor of Tranquil Waters / Festering Desire |
| **Kamisato Ayato** | `KamisatoAyato` | 5★ | Sword | Inazuma | On-Field DPS | Heart of Depth / Echoes of an Offering — Haran Geppaku Futsu / Primordial Jade Cutter |
| **Mona** | `Mona` | 5★ | Catalyst | Mondstadt | Buffer/Shred | Noblesse Oblige / Emblem of Severed Fate — Thrilling Tales of Dragon Slayers / Favonius Codex |
| **Mualani** | `Mualani` | 5★ | Catalyst | Natlan | On-Field DPS | Obsidian Codex / Heart of Depth — Surf's Up / Ring of Yaxche |
| **Neuvillette** | `Neuvillette` | 5★ | Catalyst | Fontaine | On-Field DPS | Marechaussee Hunter / Heart of Depth — Tome of the Eternal Flow / Sacrificial Jade |
| **Nilou** | `Nilou` | 5★ | Sword | Sumeru | On-Field DPS | Tenacity of the Millelith / Vourukasha's Glow — Key of Khaj-Nisut / The Dockhand's Assistant |
| **Sangonomiya Kokomi** | `SangonomiyaKokomi` | 5★ | Catalyst | Inazuma | Sustain | Ocean-Hued Clam / Tenacity of the Millelith — Thrilling Tales of Dragon Slayers / Everlasting Moonglow |
| **Sigewinne** | `Sigewinne` | 5★ | Bow | Fontaine | Sustain | Ocean-Hued Clam / Song of Days Past — Silvershower Heartstrings / Favonius Warbow |
| **Tartaglia** | `Tartaglia` | 5★ | Bow | Snezhnaya | On-Field DPS | Nymph's Dream / Heart of Depth — Polar Star / Aqua Simulacra |
| **Traveler (Hydro)** | `TravelerHydro` | 5★ | Sword | Outlander / Traveler | Off-Field DPS | Golden Troupe / Nymph's Dream — Fleuve Cendre Ferryman / Favonius Sword |
| **Vodyanitsa** | `Vodyanitsa` | 5★ | Catalyst | Snezhnaya | Sustain, Buffer/Shred | Ocean-Hued Clam / Song of Days Past — Prototype Amber / Thrilling Tales of Dragon Slayers |
| **Yelan** | `Yelan` | 5★ | Bow | Liyue | On-Field DPS, Off-Field DPS | Emblem of Severed Fate — Aqua Simulacra / Favonius Warbow |
| **Aino** | `Aino` | 4★ | Claymore | Nod-Krai | On-Field DPS, Off-Field DPS | Golden Troupe / Emblem of Severed Fate — Serpent Spine / Wolf's Gravestone |
| **Barbara** | `Barbara` | 4★ | Catalyst | Mondstadt | Sustain | Ocean-Hued Clam / Maiden Beloved — Thrilling Tales of Dragon Slayers / Prototype Amber |
| **Candace** | `Candace` | 4★ | Polearm | Sumeru | Buffer/Shred | Noblesse Oblige / The Exile — Favonius Lance / "The Catch" |
| **Dahlia** | `Dahlia` | 4★ | Sword | Mondstadt | Sustain | Noblesse Oblige / Tenacity of the Millelith — Favonius Sword / The Dockhand's Assistant |
| **Xingqiu** | `Xingqiu` | 4★ | Sword | Liyue | On-Field DPS, Off-Field DPS | Emblem of Severed Fate / Noblesse Oblige — Sacrificial Sword / Favonius Sword |

#### Pyro (19 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Arlecchino** | `Arlecchino` | 5★ | Polearm | Snezhnaya | On-Field DPS | Fragment of Harmonic Whimsy / Gladiator's Finale — Crimson Moon's Semblance / Primordial Jade Winged-Spear |
| **Dehya** | `Dehya` | 5★ | Claymore | Sumeru | On-Field DPS, Off-Field DPS | Tenacity of the Millelith / Vourukasha's Glow — Beacon of the Reed Sea / Wolf's Gravestone |
| **Diluc** | `Diluc` | 5★ | Claymore | Mondstadt | On-Field DPS | Crimson Witch of Flames / Gilded Dreams — Redhorn Stonethresher / Beacon of the Reed Sea |
| **Durin** | `Durin` | 5★ | Sword | Mondstadt | On-Field DPS, Off-Field DPS | Noblesse Oblige / Emblem of Severed Fate — Mistsplitter Reforged / Peak Patrol Song |
| **Hu Tao** | `HuTao` | 5★ | Polearm | Liyue | On-Field DPS | Crimson Witch of Flames / Shimenawa's Reminiscence — Staff of Homa / Dragon's Bane |
| **Klee** | `Klee` | 5★ | Catalyst | Mondstadt | On-Field DPS | Crimson Witch of Flames / Lavawalker — Lost Prayer to the Sacred Winds / Kagura's Verity |
| **Lyney** | `Lyney` | 5★ | Bow | Fontaine | On-Field DPS | Marechaussee Hunter / Lavawalker — The First Great Magic / Aqua Simulacra |
| **Mavuika** | `Mavuika` | 5★ | Claymore | Natlan | On-Field DPS, Off-Field DPS | Obsidian Codex / Scroll of the Hero of Cinder City — A Thousand Blazing Suns / Serpent Spine |
| **Nicole** | `Nicole` | 5★ | Catalyst | Hexenzirkel / Mondstadt | Buffer/Shred, Off-Field DPS | Noblesse Oblige / Golden Troupe — A Thousand Floating Dreams / The Widsith |
| **Traveler (Pyro)** | `TravelerPyro` | 5★ | Sword | Outlander / Traveler | Buffer/Shred, Off-Field DPS | Scroll of the Hero of Cinder City / Obsidian Codex — Favonius Sword / Peak Patrol Song |
| **Yoimiya** | `Yoimiya` | 5★ | Bow | Inazuma | On-Field DPS | Shimenawa's Reminiscence / Crimson Witch of Flames — Thundering Pulse / Aqua Simulacra |
| **Amber** | `Amber` | 4★ | Bow | Mondstadt | On-Field DPS | Noblesse Oblige / Instructor — Elegy for the End / Favonius Warbow |
| **Bennett** | `Bennett` | 4★ | Sword | Mondstadt | Sustain, Buffer/Shred | Noblesse Oblige / Instructor — Aquila Favonia / Mistsplitter Reforged |
| **Chevreuse** | `Chevreuse` | 4★ | Polearm | Fontaine | Sustain, Buffer/Shred | Noblesse Oblige / Song of Days Past — Rightful Reward / Favonius Lance |
| **Gaming** | `Gaming` | 4★ | Claymore | Liyue | On-Field DPS | Marechaussee Hunter / Crimson Witch of Flames — Serpent Spine / Beacon of the Reed Sea |
| **Thoma** | `Thoma` | 4★ | Polearm | Inazuma | Sustain | Flower of Paradise Lost / Gilded Dreams — Kitain Cross Spear / Dragon's Bane |
| **Xiangling** | `Xiangling` | 4★ | Polearm | Liyue | On-Field DPS, Off-Field DPS | Emblem of Severed Fate / Crimson Witch of Flames — "The Catch" / Staff of the Scarlet Sands |
| **Xinyan** | `Xinyan` | 4★ | Claymore | Liyue | On-Field DPS | Pale Flame / Tenacity of the Millelith — Redhorn Stonethresher / Wolf's Gravestone |
| **Yanfei** | `Yanfei` | 4★ | Catalyst | Liyue | On-Field DPS | Wanderer's Troupe / Crimson Witch of Flames — Lost Prayer to the Sacred Winds / The Widsith |

#### Cryo (21 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Aloy** | `Aloy` | 5★ | Bow | Other | On-Field DPS | Blizzard Strayer / Noblesse Oblige — Thundering Pulse / Polar Star |
| **Citlali** | `Citlali` | 5★ | Catalyst | Natlan | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City / Noblesse Oblige — Starcaller's Watch / Wandering Evenstar |
| **Escoffier** | `Escoffier` | 5★ | Polearm | Fontaine | Sustain, Buffer/Shred | Noblesse Oblige / Ocean-Hued Clam — Favonius Lance / Rightful Reward |
| **Eula** | `Eula` | 5★ | Claymore | Mondstadt | On-Field DPS | Pale Flame / Bloodstained Chivalry — Song of Broken Pines / Beacon of the Reed Sea |
| **Ganyu** | `Ganyu` | 5★ | Bow | Liyue | On-Field DPS | Wanderer's Troupe / Blizzard Strayer — Hunter's Path / The First Great Magic |
| **Kamisato Ayaka** | `KamisatoAyaka` | 5★ | Sword | Inazuma | On-Field DPS | Blizzard Strayer / Blizzard Strayer — Mistsplitter Reforged / Amenoma Kageuchi |
| **Lohen** | `Lohen` | 5★ | Polearm | Mondstadt | On-Field DPS | Pale Flame / Gladiator's Finale — Staff of Homa / Primordial Jade Winged-Spear |
| **Odette** | `Odette` | 5★ | Sword | Fontaine | On-Field DPS, Off-Field DPS | Golden Troupe / Emblem of Severed Fate — Mistsplitter Reforged / Primordial Jade Cutter |
| **Qiqi** | `Qiqi` | 5★ | Sword | Liyue | Sustain | Ocean-Hued Clam / Tenacity of the Millelith — Sacrificial Sword / Favonius Sword |
| **Sandrone** | `Sandrone` | 5★ | Claymore | Snezhnaya | On-Field DPS, Off-Field DPS | Golden Troupe / Marechaussee Hunter — Redhorn Stonethresher / Serpent Spine |
| **Shenhe** | `Shenhe` | 5★ | Polearm | Liyue | Buffer/Shred | Gladiator's Finale / Shimenawa's Reminiscence — Calamity Queller / Favonius Lance |
| **Skirk** | `Skirk` | 5★ | Sword | Abyss / Khaenri'ah | On-Field DPS | Blizzard Strayer / Fragment of Harmonic Whimsy — Absolution / Mistsplitter Reforged |
| **Wriothesley** | `Wriothesley` | 5★ | Catalyst | Fontaine | On-Field DPS | Marechaussee Hunter / Blizzard Strayer — Cashflow Supervision / Tulaytullah's Remembrance |
| **Charlotte** | `Charlotte` | 4★ | Catalyst | Fontaine | Sustain | Noblesse Oblige / Ocean-Hued Clam — Favonius Codex / Prototype Amber |
| **Chongyun** | `Chongyun` | 4★ | Claymore | Liyue | On-Field DPS | Noblesse Oblige / Emblem of Severed Fate — Wolf's Gravestone / Serpent Spine |
| **Diona** | `Diona` | 4★ | Bow | Mondstadt | Sustain | Noblesse Oblige / Tenacity of the Millelith — Sacrificial Bow / Favonius Warbow |
| **Freminet** | `Freminet` | 4★ | Claymore | Fontaine | On-Field DPS | Pale Flame / Blizzard Strayer — Song of Broken Pines / Redhorn Stonethresher |
| **Kaeya** | `Kaeya` | 4★ | Sword | Mondstadt | On-Field DPS, Off-Field DPS | Blizzard Strayer / Emblem of Severed Fate — Mistsplitter Reforged / Primordial Jade Cutter |
| **Layla** | `Layla` | 4★ | Sword | Sumeru | Sustain, Off-Field DPS | Tenacity of the Millelith / Tenacity of the Millelith — The Dockhand's Assistant / Favonius Sword |
| **Mika** | `Mika` | 4★ | Polearm | Mondstadt | Sustain, Buffer/Shred | Noblesse Oblige / Ocean-Hued Clam — Favonius Lance / Rightful Reward |
| **Rosaria** | `Rosaria` | 4★ | Polearm | Mondstadt | On-Field DPS, Off-Field DPS | Noblesse Oblige / Emblem of Severed Fate — Staff of Homa / Deathmatch |

#### Electro (22 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Clorinde** | `Clorinde` | 5★ | Sword | Fontaine | On-Field DPS | Fragment of Harmonic Whimsy / Gladiator's Finale — Absolution / Mistsplitter Reforged |
| **Cyno** | `Cyno` | 5★ | Polearm | Sumeru | On-Field DPS | Gilded Dreams / Thundering Fury — Staff of the Scarlet Sands / Staff of Homa |
| **Flins** | `Flins` | 5★ | Polearm | Fontaine | On-Field DPS | Thundering Fury / Golden Troupe — Staff of Homa / Primordial Jade Winged-Spear |
| **Ineffa** | `Ineffa` | 5★ | Polearm | Natlan | Buffer/Shred, Off-Field DPS | Scroll of the Hero of Cinder City / Golden Troupe — Staff of the Scarlet Sands / Favonius Lance |
| **Keqing** | `Keqing` | 5★ | Sword | Liyue | On-Field DPS | Thundering Fury / Thundering Fury — Mistsplitter Reforged / Primordial Jade Cutter |
| **Mitya** | `Mitya` | 5★ | Catalyst | Snezhnaya | Buffer/Shred, Off-Field DPS | Gilded Dreams / Golden Troupe — Reliquary of Truth / Lost Prayer to the Sacred Winds |
| **Raiden Shogun** | `RaidenShogun` | 5★ | Polearm | Inazuma | On-Field DPS | Emblem of Severed Fate — Engulfing Lightning / "The Catch" |
| **Traveler (Electro)** | `TravelerElectro` | 5★ | Sword | Outlander / Traveler | Buffer/Shred, Off-Field DPS | Emblem of Severed Fate / Noblesse Oblige — Favonius Sword / Sacrificial Sword |
| **Varesa** | `Varesa` | 5★ | Catalyst | Natlan | On-Field DPS | Obsidian Codex / Marechaussee Hunter — Lost Prayer to the Sacred Winds / Sacrificial Jade |
| **Yae Miko** | `YaeMiko` | 5★ | Catalyst | Inazuma | On-Field DPS, Off-Field DPS | Golden Troupe / Gilded Dreams — Kagura's Verity / A Thousand Floating Dreams |
| **Alyosha** | `Alyosha` | 4★ | Polearm | Snezhnaya | On-Field DPS | Emblem of Severed Fate / Thundering Fury — Staff of Homa / Primordial Jade Winged-Spear |
| **Beidou** | `Beidou` | 4★ | Claymore | Liyue | On-Field DPS, Off-Field DPS | Emblem of Severed Fate / Noblesse Oblige — Wolf's Gravestone / Serpent Spine |
| **Dori** | `Dori` | 4★ | Claymore | Sumeru | Sustain | Noblesse Oblige / The Exile — Favonius Greatsword / Sacrificial Greatsword |
| **Fischl** | `Fischl` | 4★ | Bow | Mondstadt | On-Field DPS, Off-Field DPS | Golden Troupe / Thundering Fury — Aqua Simulacra / Polar Star |
| **Iansan** | `Iansan` | 4★ | Polearm | Natlan | Buffer/Shred | Scroll of the Hero of Cinder City / Noblesse Oblige — Favonius Lance / Ballad of the Fjords |
| **Kujou Sara** | `KujouSara` | 4★ | Bow | Inazuma | Buffer/Shred | Emblem of Severed Fate / Noblesse Oblige — Skyward Harp / Elegy for the End |
| **Kuki Shinobu** | `KukiShinobu` | 4★ | Sword | Inazuma | Sustain, Off-Field DPS | Flower of Paradise Lost / Gilded Dreams — Freedom-Sworn / Xiphos' Moonlight |
| **Lisa** | `Lisa` | 4★ | Catalyst | Mondstadt | On-Field DPS, Off-Field DPS | Noblesse Oblige / Thundering Fury — Kagura's Verity / A Thousand Floating Dreams |
| **Ororon** | `Ororon` | 4★ | Bow | Natlan | On-Field DPS, Off-Field DPS | Scroll of the Hero of Cinder City / Golden Troupe — Elegy for the End / Favonius Warbow |
| **Razor** | `Razor` | 4★ | Claymore | Mondstadt | On-Field DPS | Pale Flame / Gilded Dreams — Beacon of the Reed Sea / Wolf's Gravestone |
| **Sethos** | `Sethos` | 4★ | Bow | Sumeru | On-Field DPS | Wanderer's Troupe / Gilded Dreams — Hunter's Path / The First Great Magic |
| **Valeriy** | `Valeriy` | 4★ | Sword | Snezhnaya | Sustain, Buffer/Shred, Off-Field DPS | Noblesse Oblige / Tenacity of the Millelith — Peak Patrol Song / Favonius Sword |

#### Anemo (20 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Chasca** | `Chasca` | 5★ | Bow | Natlan | On-Field DPS | Obsidian Codex / Desert Pavilion Chronicle — Astral Vulture's Crimson Plumage / The First Great Magic |
| **Jean** | `Jean` | 5★ | Sword | Mondstadt | Sustain | Viridescent Venerer / Noblesse Oblige — Favonius Sword / Freedom-Sworn |
| **Kaedehara Kazuha** | `KaedeharaKazuha` | 5★ | Sword | Inazuma | Buffer/Shred | Viridescent Venerer — Freedom-Sworn / Xiphos' Moonlight |
| **Traveler (Anemo)** | `TravelerAnemo` | 5★ | Sword | Outlander / Traveler | Buffer/Shred, Off-Field DPS | Viridescent Venerer / Noblesse Oblige — Freedom-Sworn / Favonius Sword |
| **Varka** | `Varka` | 5★ | Claymore | Mondstadt | On-Field DPS | Desert Pavilion Chronicle / Viridescent Venerer — Wolf's Gravestone / Redhorn Stonethresher |
| **Venti** | `Venti` | 5★ | Bow | Mondstadt | Buffer/Shred, Off-Field DPS | Viridescent Venerer / Noblesse Oblige — Elegy for the End / The Stringless |
| **Vesna** | `Vesna` | 5★ | Sword | Snezhnaya | Buffer/Shred | Viridescent Venerer / Noblesse Oblige — Freedom-Sworn / Xiphos' Moonlight |
| **Wanderer** | `Wanderer` | 5★ | Catalyst | Sumeru | On-Field DPS | Desert Pavilion Chronicle / Shimenawa's Reminiscence — Tulaytullah's Remembrance / Lost Prayer to the Sacred Winds |
| **Xianyun** | `Xianyun` | 5★ | Catalyst | Liyue | Sustain, Buffer/Shred | Song of Days Past / Viridescent Venerer — Crane's Echoing Call / Oathsworn Eye |
| **Xiao** | `Xiao` | 5★ | Polearm | Liyue | On-Field DPS | Vermillion Hereafter / Marechaussee Hunter — Primordial Jade Winged-Spear / Staff of Homa |
| **Yumemizuki Mizuki** | `YumemizukiMizuki` | 5★ | Catalyst | Inazuma | On-Field DPS | Marechaussee Hunter / Viridescent Venerer — Lost Prayer to the Sacred Winds / The Widsith |
| **Faruzan** | `Faruzan` | 4★ | Bow | Sumeru | Buffer/Shred | Tenacity of the Millelith / Emblem of Severed Fate — Favonius Warbow / Elegy for the End |
| **Ifa** | `Ifa` | 4★ | Catalyst | Natlan | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City / Noblesse Oblige — Favonius Codex / Thrilling Tales of Dragon Slayers |
| **Jahoda** | `Jahoda` | 4★ | Bow | Natlan | Buffer/Shred, Off-Field DPS | Noblesse Oblige / Viridescent Venerer — Favonius Warbow / Elegy for the End |
| **Lan Yan** | `LanYan` | 4★ | Catalyst | Liyue | Buffer/Shred | Viridescent Venerer / Scroll of the Hero of Cinder City — Favonius Codex / Thrilling Tales of Dragon Slayers |
| **Lynette** | `Lynette` | 4★ | Sword | Fontaine | On-Field DPS, Off-Field DPS | Viridescent Venerer / Marechaussee Hunter — Sacrificial Sword / Favonius Sword |
| **Prune** | `Prune` | 4★ | Catalyst | Fontaine | Sustain, Buffer/Shred | Ocean-Hued Clam / Noblesse Oblige — Prototype Amber / Thrilling Tales of Dragon Slayers |
| **Sayu** | `Sayu` | 4★ | Claymore | Inazuma | Sustain | Viridescent Venerer / Ocean-Hued Clam — Favonius Greatsword / Katsuragikiri Nagamasa |
| **Shikanoin Heizou** | `ShikanoinHeizou` | 4★ | Catalyst | Inazuma | On-Field DPS | Viridescent Venerer / Desert Pavilion Chronicle — Lost Prayer to the Sacred Winds / Kagura's Verity |
| **Sucrose** | `Sucrose` | 4★ | Catalyst | Mondstadt | Buffer/Shred | Viridescent Venerer / Instructor — Sacrificial Fragments / Thrilling Tales of Dragon Slayers |

#### Geo (15 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Albedo** | `Albedo` | 5★ | Sword | Mondstadt | Buffer/Shred, Off-Field DPS | Golden Troupe / Husk of Opulent Dreams — Cinnabar Spindle / Uraku Misugiri |
| **Arataki Itto** | `AratakiItto` | 5★ | Claymore | Inazuma | On-Field DPS | Husk of Opulent Dreams / Marechaussee Hunter — Redhorn Stonethresher / Serpent Spine |
| **Chiori** | `Chiori` | 5★ | Sword | Inazuma | On-Field DPS, Off-Field DPS | Golden Troupe / Husk of Opulent Dreams — Uraku Misugiri / Cinnabar Spindle |
| **Linnea** | `Linnea` | 5★ | Bow | Nod-Krai | On-Field DPS, Off-Field DPS | Golden Troupe / Emblem of Severed Fate — Aqua Simulacra / The Stringless |
| **Navia** | `Navia` | 5★ | Claymore | Fontaine | On-Field DPS | Nighttime Whispers in the Echoing Woods / Golden Troupe — Verdict / The Unforged |
| **Traveler (Geo)** | `TravelerGeo` | 5★ | Sword | Outlander / Traveler | Off-Field DPS, Buffer/Shred | Golden Troupe / Archaic Petra — Primordial Jade Cutter / Festering Desire |
| **Xilonen** | `Xilonen` | 5★ | Sword | Natlan | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City / Husk of Opulent Dreams — Peak Patrol Song / Favonius Sword |
| **Zhongli** | `Zhongli` | 5★ | Polearm | Liyue | Sustain | Tenacity of the Millelith / Noblesse Oblige — Black Tassel / Staff of Homa |
| **Zibai** | `Zibai` | 5★ | Sword | Liyue | On-Field DPS | Husk of Opulent Dreams / Archaic Petra — Light of Foliar Incision / Favonius Sword |
| **Gorou** | `Gorou` | 4★ | Bow | Inazuma | Buffer/Shred | The Exile / Husk of Opulent Dreams — Favonius Warbow / Elegy for the End |
| **Illuga** | `Illuga` | 4★ | Polearm | Natlan | Sustain, Buffer/Shred | Noblesse Oblige / Tenacity of the Millelith — Favonius Lance / Rightful Reward |
| **Kachina** | `Kachina` | 4★ | Polearm | Natlan | On-Field DPS, Off-Field DPS | Scroll of the Hero of Cinder City / Husk of Opulent Dreams — Footprint of the Rainbow / Favonius Lance |
| **Ningguang** | `Ningguang` | 4★ | Catalyst | Liyue | On-Field DPS | Nighttime Whispers in the Echoing Woods / Archaic Petra — Lost Prayer to the Sacred Winds / Memory of Dust |
| **Noelle** | `Noelle` | 4★ | Claymore | Mondstadt | Sustain | Marechaussee Hunter / Husk of Opulent Dreams — Redhorn Stonethresher / Serpent Spine |
| **Yun Jin** | `YunJin` | 4★ | Polearm | Liyue | Buffer/Shred | Husk of Opulent Dreams / The Exile — Favonius Lance / Rightful Reward |

#### Dendro (13 Characters)

| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |
| :--- | :--- | :---: | :--- | :--- | :--- | :--- |
| **Alhaitham** | `Alhaitham` | 5★ | Sword | Sumeru | On-Field DPS | Gilded Dreams / Deepwood Memories — Light of Foliar Incision / Mistsplitter Reforged |
| **Baizhu** | `Baizhu` | 5★ | Catalyst | Liyue | Sustain | Deepwood Memories / Ocean-Hued Clam — Prototype Amber / Jadefall's Splendor |
| **Emilie** | `Emilie` | 5★ | Polearm | Fontaine | On-Field DPS, Off-Field DPS | Unfinished Reverie / Deepwood Memories — Lumidouce Elegy / Calamity Queller |
| **Kinich** | `Kinich` | 5★ | Claymore | Natlan | On-Field DPS | Obsidian Codex / Unfinished Reverie — Fang of the Mountain King / Serpent Spine |
| **Lauma** | `Lauma` | 5★ | Catalyst | Nod-Krai | Buffer/Shred | Silken Moon's Serenade / Deepwood Memories — A Thousand Floating Dreams / Sacrificial Jade |
| **Nahida** | `Nahida` | 5★ | Catalyst | Sumeru | Buffer/Shred, Off-Field DPS | Deepwood Memories / Gilded Dreams — A Thousand Floating Dreams / The Widsith |
| **Nefer** | `Nefer` | 5★ | Catalyst | Nod-Krai | On-Field DPS | Silken Moon's Serenade / Deepwood Memories — Reliquary of Truth / Sacrificial Jade |
| **Tighnari** | `Tighnari` | 5★ | Bow | Sumeru | On-Field DPS | Gilded Dreams / Wanderer's Troupe — Hunter's Path / The First Great Magic |
| **Traveler (Dendro)** | `TravelerDendro` | 5★ | Sword | Outlander / Traveler | Off-Field DPS, Buffer/Shred | Deepwood Memories / Gilded Dreams — Favonius Sword / Sacrificial Sword |
| **Collei** | `Collei` | 4★ | Bow | Sumeru | On-Field DPS, Off-Field DPS | Deepwood Memories / Noblesse Oblige — Elegy for the End / Favonius Warbow |
| **Kaveh** | `Kaveh` | 4★ | Claymore | Sumeru | On-Field DPS | Deepwood Memories / Flower of Paradise Lost — Mailed Flower / Favonius Greatsword |
| **Kirara** | `Kirara` | 4★ | Sword | Inazuma | Sustain | Deepwood Memories / Tenacity of the Millelith — The Dockhand's Assistant / Favonius Sword |
| **Yaoyao** | `Yaoyao` | 4★ | Polearm | Liyue | Sustain | Deepwood Memories / Tenacity of the Millelith — Favonius Lance / Rightful Reward |

### Characters by Region

#### Nod-Krai (4 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Lauma** | Dendro | 5★ | Catalyst | Buffer/Shred | Silken Moon's Serenade, Deepwood Memories |
| **Linnea** | Geo | 5★ | Bow | On-Field DPS, Off-Field DPS | Golden Troupe, Emblem of Severed Fate |
| **Nefer** | Dendro | 5★ | Catalyst | On-Field DPS | Silken Moon's Serenade, Deepwood Memories |
| **Aino** | Hydro | 4★ | Claymore | On-Field DPS, Off-Field DPS | Golden Troupe, Emblem of Severed Fate |

#### Nod-Krai / Snezhnaya (1 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Columbina** | Hydro | 5★ | Catalyst | Buffer/Shred, Off-Field DPS | Golden Troupe, Deepwood Memories |

#### Snezhnaya (8 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Arlecchino** | Pyro | 5★ | Polearm | On-Field DPS | Fragment of Harmonic Whimsy, Gladiator's Finale |
| **Mitya** | Electro | 5★ | Catalyst | Buffer/Shred, Off-Field DPS | Gilded Dreams, Golden Troupe |
| **Sandrone** | Cryo | 5★ | Claymore | On-Field DPS, Off-Field DPS | Golden Troupe, Marechaussee Hunter |
| **Tartaglia** | Hydro | 5★ | Bow | On-Field DPS | Nymph's Dream, Heart of Depth |
| **Vesna** | Anemo | 5★ | Sword | Buffer/Shred | Viridescent Venerer, Noblesse Oblige |
| **Vodyanitsa** | Hydro | 5★ | Catalyst | Sustain, Buffer/Shred | Ocean-Hued Clam, Song of Days Past |
| **Alyosha** | Electro | 4★ | Polearm | On-Field DPS | Emblem of Severed Fate, Thundering Fury |
| **Valeriy** | Electro | 4★ | Sword | Sustain, Buffer/Shred, Off-Field DPS | Noblesse Oblige, Tenacity of the Millelith |

#### Natlan (14 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Chasca** | Anemo | 5★ | Bow | On-Field DPS | Obsidian Codex, Desert Pavilion Chronicle |
| **Citlali** | Cryo | 5★ | Catalyst | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City, Noblesse Oblige |
| **Ineffa** | Electro | 5★ | Polearm | Buffer/Shred, Off-Field DPS | Scroll of the Hero of Cinder City, Golden Troupe |
| **Kinich** | Dendro | 5★ | Claymore | On-Field DPS | Obsidian Codex, Unfinished Reverie |
| **Mavuika** | Pyro | 5★ | Claymore | On-Field DPS, Off-Field DPS | Obsidian Codex, Scroll of the Hero of Cinder City |
| **Mualani** | Hydro | 5★ | Catalyst | On-Field DPS | Obsidian Codex, Heart of Depth |
| **Varesa** | Electro | 5★ | Catalyst | On-Field DPS | Obsidian Codex, Marechaussee Hunter |
| **Xilonen** | Geo | 5★ | Sword | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City, Husk of Opulent Dreams |
| **Iansan** | Electro | 4★ | Polearm | Buffer/Shred | Scroll of the Hero of Cinder City, Noblesse Oblige |
| **Ifa** | Anemo | 4★ | Catalyst | Sustain, Buffer/Shred | Scroll of the Hero of Cinder City, Noblesse Oblige |
| **Illuga** | Geo | 4★ | Polearm | Sustain, Buffer/Shred | Noblesse Oblige, Tenacity of the Millelith |
| **Jahoda** | Anemo | 4★ | Bow | Buffer/Shred, Off-Field DPS | Noblesse Oblige, Viridescent Venerer |
| **Kachina** | Geo | 4★ | Polearm | On-Field DPS, Off-Field DPS | Scroll of the Hero of Cinder City, Husk of Opulent Dreams |
| **Ororon** | Electro | 4★ | Bow | On-Field DPS, Off-Field DPS | Scroll of the Hero of Cinder City, Golden Troupe |

#### Fontaine (16 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Clorinde** | Electro | 5★ | Sword | On-Field DPS | Fragment of Harmonic Whimsy, Gladiator's Finale |
| **Emilie** | Dendro | 5★ | Polearm | On-Field DPS, Off-Field DPS | Unfinished Reverie, Deepwood Memories |
| **Escoffier** | Cryo | 5★ | Polearm | Sustain, Buffer/Shred | Noblesse Oblige, Ocean-Hued Clam |
| **Flins** | Electro | 5★ | Polearm | On-Field DPS | Thundering Fury, Golden Troupe |
| **Furina** | Hydro | 5★ | Sword | Buffer/Shred, Off-Field DPS | Golden Troupe, Tenacity of the Millelith |
| **Lyney** | Pyro | 5★ | Bow | On-Field DPS | Marechaussee Hunter, Lavawalker |
| **Navia** | Geo | 5★ | Claymore | On-Field DPS | Nighttime Whispers in the Echoing Woods, Golden Troupe |
| **Neuvillette** | Hydro | 5★ | Catalyst | On-Field DPS | Marechaussee Hunter, Heart of Depth |
| **Odette** | Cryo | 5★ | Sword | On-Field DPS, Off-Field DPS | Golden Troupe, Emblem of Severed Fate |
| **Sigewinne** | Hydro | 5★ | Bow | Sustain | Ocean-Hued Clam, Song of Days Past |
| **Wriothesley** | Cryo | 5★ | Catalyst | On-Field DPS | Marechaussee Hunter, Blizzard Strayer |
| **Charlotte** | Cryo | 4★ | Catalyst | Sustain | Noblesse Oblige, Ocean-Hued Clam |
| **Chevreuse** | Pyro | 4★ | Polearm | Sustain, Buffer/Shred | Noblesse Oblige, Song of Days Past |
| **Freminet** | Cryo | 4★ | Claymore | On-Field DPS | Pale Flame, Blizzard Strayer |
| **Lynette** | Anemo | 4★ | Sword | On-Field DPS, Off-Field DPS | Viridescent Venerer, Marechaussee Hunter |
| **Prune** | Anemo | 4★ | Catalyst | Sustain, Buffer/Shred | Ocean-Hued Clam, Noblesse Oblige |

#### Sumeru (14 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Alhaitham** | Dendro | 5★ | Sword | On-Field DPS | Gilded Dreams, Deepwood Memories |
| **Cyno** | Electro | 5★ | Polearm | On-Field DPS | Gilded Dreams, Thundering Fury |
| **Dehya** | Pyro | 5★ | Claymore | On-Field DPS, Off-Field DPS | Tenacity of the Millelith, Vourukasha's Glow |
| **Nahida** | Dendro | 5★ | Catalyst | Buffer/Shred, Off-Field DPS | Deepwood Memories, Gilded Dreams |
| **Nilou** | Hydro | 5★ | Sword | On-Field DPS | Tenacity of the Millelith, Vourukasha's Glow |
| **Tighnari** | Dendro | 5★ | Bow | On-Field DPS | Gilded Dreams, Wanderer's Troupe |
| **Wanderer** | Anemo | 5★ | Catalyst | On-Field DPS | Desert Pavilion Chronicle, Shimenawa's Reminiscence |
| **Candace** | Hydro | 4★ | Polearm | Buffer/Shred | Noblesse Oblige, The Exile |
| **Collei** | Dendro | 4★ | Bow | On-Field DPS, Off-Field DPS | Deepwood Memories, Noblesse Oblige |
| **Dori** | Electro | 4★ | Claymore | Sustain | Noblesse Oblige, The Exile |
| **Faruzan** | Anemo | 4★ | Bow | Buffer/Shred | Tenacity of the Millelith, Emblem of Severed Fate |
| **Kaveh** | Dendro | 4★ | Claymore | On-Field DPS | Deepwood Memories, Flower of Paradise Lost |
| **Layla** | Cryo | 4★ | Sword | Sustain, Off-Field DPS | Tenacity of the Millelith, Tenacity of the Millelith |
| **Sethos** | Electro | 4★ | Bow | On-Field DPS | Wanderer's Troupe, Gilded Dreams |

#### Inazuma (17 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Arataki Itto** | Geo | 5★ | Claymore | On-Field DPS | Husk of Opulent Dreams, Marechaussee Hunter |
| **Chiori** | Geo | 5★ | Sword | On-Field DPS, Off-Field DPS | Golden Troupe, Husk of Opulent Dreams |
| **Kaedehara Kazuha** | Anemo | 5★ | Sword | Buffer/Shred | Viridescent Venerer |
| **Kamisato Ayaka** | Cryo | 5★ | Sword | On-Field DPS | Blizzard Strayer, Blizzard Strayer |
| **Kamisato Ayato** | Hydro | 5★ | Sword | On-Field DPS | Heart of Depth, Echoes of an Offering |
| **Raiden Shogun** | Electro | 5★ | Polearm | On-Field DPS | Emblem of Severed Fate |
| **Sangonomiya Kokomi** | Hydro | 5★ | Catalyst | Sustain | Ocean-Hued Clam, Tenacity of the Millelith |
| **Yae Miko** | Electro | 5★ | Catalyst | On-Field DPS, Off-Field DPS | Golden Troupe, Gilded Dreams |
| **Yoimiya** | Pyro | 5★ | Bow | On-Field DPS | Shimenawa's Reminiscence, Crimson Witch of Flames |
| **Yumemizuki Mizuki** | Anemo | 5★ | Catalyst | On-Field DPS | Marechaussee Hunter, Viridescent Venerer |
| **Gorou** | Geo | 4★ | Bow | Buffer/Shred | The Exile, Husk of Opulent Dreams |
| **Kirara** | Dendro | 4★ | Sword | Sustain | Deepwood Memories, Tenacity of the Millelith |
| **Kujou Sara** | Electro | 4★ | Bow | Buffer/Shred | Emblem of Severed Fate, Noblesse Oblige |
| **Kuki Shinobu** | Electro | 4★ | Sword | Sustain, Off-Field DPS | Flower of Paradise Lost, Gilded Dreams |
| **Sayu** | Anemo | 4★ | Claymore | Sustain | Viridescent Venerer, Ocean-Hued Clam |
| **Shikanoin Heizou** | Anemo | 4★ | Catalyst | On-Field DPS | Viridescent Venerer, Desert Pavilion Chronicle |
| **Thoma** | Pyro | 4★ | Polearm | Sustain | Flower of Paradise Lost, Gilded Dreams |

#### Liyue (22 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Baizhu** | Dendro | 5★ | Catalyst | Sustain | Deepwood Memories, Ocean-Hued Clam |
| **Ganyu** | Cryo | 5★ | Bow | On-Field DPS | Wanderer's Troupe, Blizzard Strayer |
| **Hu Tao** | Pyro | 5★ | Polearm | On-Field DPS | Crimson Witch of Flames, Shimenawa's Reminiscence |
| **Keqing** | Electro | 5★ | Sword | On-Field DPS | Thundering Fury, Thundering Fury |
| **Qiqi** | Cryo | 5★ | Sword | Sustain | Ocean-Hued Clam, Tenacity of the Millelith |
| **Shenhe** | Cryo | 5★ | Polearm | Buffer/Shred | Gladiator's Finale, Shimenawa's Reminiscence |
| **Xianyun** | Anemo | 5★ | Catalyst | Sustain, Buffer/Shred | Song of Days Past, Viridescent Venerer |
| **Xiao** | Anemo | 5★ | Polearm | On-Field DPS | Vermillion Hereafter, Marechaussee Hunter |
| **Yelan** | Hydro | 5★ | Bow | On-Field DPS, Off-Field DPS | Emblem of Severed Fate |
| **Zhongli** | Geo | 5★ | Polearm | Sustain | Tenacity of the Millelith, Noblesse Oblige |
| **Zibai** | Geo | 5★ | Sword | On-Field DPS | Husk of Opulent Dreams, Archaic Petra |
| **Beidou** | Electro | 4★ | Claymore | On-Field DPS, Off-Field DPS | Emblem of Severed Fate, Noblesse Oblige |
| **Chongyun** | Cryo | 4★ | Claymore | On-Field DPS | Noblesse Oblige, Emblem of Severed Fate |
| **Gaming** | Pyro | 4★ | Claymore | On-Field DPS | Marechaussee Hunter, Crimson Witch of Flames |
| **Lan Yan** | Anemo | 4★ | Catalyst | Buffer/Shred | Viridescent Venerer, Scroll of the Hero of Cinder City |
| **Ningguang** | Geo | 4★ | Catalyst | On-Field DPS | Nighttime Whispers in the Echoing Woods, Archaic Petra |
| **Xiangling** | Pyro | 4★ | Polearm | On-Field DPS, Off-Field DPS | Emblem of Severed Fate, Crimson Witch of Flames |
| **Xingqiu** | Hydro | 4★ | Sword | On-Field DPS, Off-Field DPS | Emblem of Severed Fate, Noblesse Oblige |
| **Xinyan** | Pyro | 4★ | Claymore | On-Field DPS | Pale Flame, Tenacity of the Millelith |
| **Yanfei** | Pyro | 4★ | Catalyst | On-Field DPS | Wanderer's Troupe, Crimson Witch of Flames |
| **Yaoyao** | Dendro | 4★ | Polearm | Sustain | Deepwood Memories, Tenacity of the Millelith |
| **Yun Jin** | Geo | 4★ | Polearm | Buffer/Shred | Husk of Opulent Dreams, The Exile |

#### Mondstadt (23 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Albedo** | Geo | 5★ | Sword | Buffer/Shred, Off-Field DPS | Golden Troupe, Husk of Opulent Dreams |
| **Diluc** | Pyro | 5★ | Claymore | On-Field DPS | Crimson Witch of Flames, Gilded Dreams |
| **Durin** | Pyro | 5★ | Sword | On-Field DPS, Off-Field DPS | Noblesse Oblige, Emblem of Severed Fate |
| **Eula** | Cryo | 5★ | Claymore | On-Field DPS | Pale Flame, Bloodstained Chivalry |
| **Jean** | Anemo | 5★ | Sword | Sustain | Viridescent Venerer, Noblesse Oblige |
| **Klee** | Pyro | 5★ | Catalyst | On-Field DPS | Crimson Witch of Flames, Lavawalker |
| **Lohen** | Cryo | 5★ | Polearm | On-Field DPS | Pale Flame, Gladiator's Finale |
| **Mona** | Hydro | 5★ | Catalyst | Buffer/Shred | Noblesse Oblige, Emblem of Severed Fate |
| **Varka** | Anemo | 5★ | Claymore | On-Field DPS | Desert Pavilion Chronicle, Viridescent Venerer |
| **Venti** | Anemo | 5★ | Bow | Buffer/Shred, Off-Field DPS | Viridescent Venerer, Noblesse Oblige |
| **Amber** | Pyro | 4★ | Bow | On-Field DPS | Noblesse Oblige, Instructor |
| **Barbara** | Hydro | 4★ | Catalyst | Sustain | Ocean-Hued Clam, Maiden Beloved |
| **Bennett** | Pyro | 4★ | Sword | Sustain, Buffer/Shred | Noblesse Oblige, Instructor |
| **Dahlia** | Hydro | 4★ | Sword | Sustain | Noblesse Oblige, Tenacity of the Millelith |
| **Diona** | Cryo | 4★ | Bow | Sustain | Noblesse Oblige, Tenacity of the Millelith |
| **Fischl** | Electro | 4★ | Bow | On-Field DPS, Off-Field DPS | Golden Troupe, Thundering Fury |
| **Kaeya** | Cryo | 4★ | Sword | On-Field DPS, Off-Field DPS | Blizzard Strayer, Emblem of Severed Fate |
| **Lisa** | Electro | 4★ | Catalyst | On-Field DPS, Off-Field DPS | Noblesse Oblige, Thundering Fury |
| **Mika** | Cryo | 4★ | Polearm | Sustain, Buffer/Shred | Noblesse Oblige, Ocean-Hued Clam |
| **Noelle** | Geo | 4★ | Claymore | Sustain | Marechaussee Hunter, Husk of Opulent Dreams |
| **Razor** | Electro | 4★ | Claymore | On-Field DPS | Pale Flame, Gilded Dreams |
| **Rosaria** | Cryo | 4★ | Polearm | On-Field DPS, Off-Field DPS | Noblesse Oblige, Emblem of Severed Fate |
| **Sucrose** | Anemo | 4★ | Catalyst | Buffer/Shred | Viridescent Venerer, Instructor |

#### Hexenzirkel / Mondstadt (1 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Nicole** | Pyro | 5★ | Catalyst | Buffer/Shred, Off-Field DPS | Noblesse Oblige, Golden Troupe |

#### Abyss / Khaenri'ah (1 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Skirk** | Cryo | 5★ | Sword | On-Field DPS | Blizzard Strayer, Fragment of Harmonic Whimsy |

#### Outlander / Traveler (6 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Traveler (Anemo)** | Anemo | 5★ | Sword | Buffer/Shred, Off-Field DPS | Viridescent Venerer, Noblesse Oblige |
| **Traveler (Dendro)** | Dendro | 5★ | Sword | Off-Field DPS, Buffer/Shred | Deepwood Memories, Gilded Dreams |
| **Traveler (Electro)** | Electro | 5★ | Sword | Buffer/Shred, Off-Field DPS | Emblem of Severed Fate, Noblesse Oblige |
| **Traveler (Geo)** | Geo | 5★ | Sword | Off-Field DPS, Buffer/Shred | Golden Troupe, Archaic Petra |
| **Traveler (Hydro)** | Hydro | 5★ | Sword | Off-Field DPS | Golden Troupe, Nymph's Dream |
| **Traveler (Pyro)** | Pyro | 5★ | Sword | Buffer/Shred, Off-Field DPS | Scroll of the Hero of Cinder City, Obsidian Codex |

#### Other (1 Characters)

| Name | Element | Rarity | Weapon | Roles | Primary Build |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Aloy** | Cryo | 5★ | Bow | On-Field DPS | Blizzard Strayer, Noblesse Oblige |

### Version 7.2 & Modern Era Highlights

| Character | Element / Weapon | Rarity | Region | Key Mechanical Features & Kit Archetype |
| :--- | :--- | :---: | :--- | :--- |
| **Nefer** | Dendro Catalyst | 5★ | Nod-Krai | Premier Lunar-Bloom on-field driver. Ascendant Gleam synergy, converts EM into explosive bloom seeds (*Silken Moon's Serenade*). |
| **Aino** | Hydro Claymore | 4★ | Nod-Krai | Off-field Hydro deployable duck turret (*Cool Your Jets Ducky*), Moonsign level booster (+1 Moonsign). |
| **Lauma** | Dendro Catalyst | 5★ | Nod-Krai | Moonsign shredder and team EM buffer for Nod-Krai reaction teams (*Silken Moon's Serenade* / *Deepwood*). |
| **Linnea** | Geo Bow | 5★ | Nod-Krai | Lunar-Crystallize DPS, constructs crystalline barriers scaling with ATK/DEF. |
| **Columbina** | Hydro Catalyst | 5★ | Nod-Krai / Snezhnaya | Welkin Moon Maiden born in Nod-Krai; creates **Lunar Domain**, converts Bloom/Electro-Charged/Crystallize into Lunar variants with HP scaling. |
| **Mavuika** | Pyro Claymore | 5★ | Natlan | Pyro Archon, Nightsoul transmission driver, massive off-field Pyro application and burst nuke (*A Thousand Blazing Suns*). |
| **Xilonen** | Geo Sword | 5★ | Natlan | Universal elemental shredder and healer using Nightsoul sampler discs (*Peak Patrol Song*). |
| **Citlali** | Cryo Catalyst | 5★ | Natlan | Off-field Cryo applicator, shield generator, and Nightsoul elemental shred buffer (*Starcaller's Watch*). |
| **Chasca** | Anemo Bow | 5★ | Natlan | Multi-elemental converter bullets via Nightsoul flight state (*Astral Vulture's Crimson Plumage*). |
| **Kinich** | Dendro Claymore | 5★ | Natlan | Grapple-looping Nightsoul scaling single-target cannon bursts (*Fang of the Mountain King*). |
| **Mitya** | Electro Catalyst | 5★ | Snezhnaya | Snezhnayan Polestar buffer and off-field Electro shredder (*Reliquary of Truth*). |
| **Valeriy** | Electro Sword | 4★ | Snezhnaya | Snezhnayan burst sustain and rapid reaction battery (*Peak Patrol Song*). |
| **Alyosha** | Electro Polearm | 4★ | Snezhnaya | Hunter's Mark tracker, summons canine spirit *Tugarin* into Polestar fields (*Staff of Homa*). |
| **Sandrone** | Cryo Claymore | 5★ | Snezhnaya | Fatui Harbinger #7 (Marionette), automaton summoner dealing heavy Cryo physical/elemental strikes (*Redhorn* / *A Teaspoon of Transcendence*). |
| **Varka** | Anemo Claymore | 5★ | Mondstadt | Grand Master of Favonius, high-impact sweeping Anemo physical hybrid carry (*Gest of the Mighty Wolf* / *Wolf's Gravestone*). |
| **Durin** | Pyro Sword | 5★ | Mondstadt | Dragonspine purifying flames, dragon-heart Pyro infusion carry and off-field sub-DPS (*Mistsplitter Reforged*). |
| **Nicole** | Pyro Catalyst | 5★ | Hexenzirkel | Hexenzirkel guide, fate-weaving reality manipulation and party-wide Pyro amplifier (*A Thousand Floating Dreams*). |
| **Skirk** | Cryo Sword | 5★ | Khaenri'ah | Master of the Abyss, spatial rift slashes, void-infused Cryo carry (*Absolution* / *Mistsplitter*). |
| **Escoffier** | Cryo Polearm | 5★ | Fontaine | Culinary master, persistent Cryo field chef offering freeze sustain and ATK buffs (*Symphonist of Scents*). |
| **Flins** | Electro Polearm | 5★ | Fontaine | Rapid-thrust Electro carry with high energy generation (*Staff of Homa*). |
| **Ifa** | Anemo Catalyst | 4★ | Natlan | Natlan veterinarian, aerial healer and Swirl buffer. |
| **Illuga** | Geo Polearm | 4★ | Natlan | Geo construct shielder and def-scaling support. |
| **Ineffa** | Electro Polearm | 5★ | Natlan | Nightsoul burst amplifier and off-field Electro striker. |
| **Jahoda** | Anemo Bow | 4★ | Natlan | Long-range crowd controller and swirl shredder. |
| **Lan Yan** | Anemo Catalyst | 4★ | Liyue | Adeptal martial arts performer, swirl buffer and crowd gatherer. |
| **Lohen** | Cryo Polearm | 5★ | Mondstadt | Mondstadt knight errant, freeze/melt burst carry. |
| **Odette** | Cryo Sword | 5★ | Fontaine | Fontaine fencer, high-cadence Cryo skill duelist. |
| **Prune** | Anemo Catalyst | 4★ | Fontaine | Clockwork technician, kinetic barrier generator and healer. |
| **Vesna** | Anemo Sword | 5★ | Snezhnaya | Northern blizzard swordswoman, high-velocity swirl sub-DPS. |
| **Vodyanitsa** | Hydro Catalyst | 5★ | Snezhnaya | Snezhnayan river maiden, tidal wave sustain and healing amplifier. |
| **Yumemizuki Mizuki** | Anemo Catalyst | 5★ | Inazuma | Inazuman illusionist, dream-state Anemo carry. |
| **Zibai** | Geo Sword | 5★ | Liyue | Liyue White Horse Adeptus, crystalline swordmaster converting Crystallize to Lunar-Crystallize. |

---

## 4. Master Artifact Sets Directory (64 Sets / 37 Combat Sets)

The Celestia engine tracks **64 Master Artifact Sets** in `src/data/artifacts-master.ts`, including exactly **37 combat sets** with calibrated stat weights and roll valuation curves in `src/data/artifact-weights.ts`.

### Complete 37-Set Combat Roster

| # | Artifact Set | 2-Piece Bonus | 4-Piece Bonus / Strategic Role | Primary Users in Celestia |
| :---: | :--- | :--- | :--- | :--- |
| 1 | **Archaic Petra** | Geo DMG Bonus +15% | Upon obtaining an Elemental Shard from Crystallize, all party members gain 35% DMG Bonus for that element for 10s. | Ningguang, Zibai, Traveler (Geo) |
| 2 | **Blizzard Strayer** | Cryo DMG Bonus +15% | When attacking an opponent affected by Cryo, CRIT Rate +20%. If frozen, CRIT Rate +20% additional (up to +40%). | Aloy, Freminet, Ganyu, Kaeya, Kamisato Ayaka, +3 more |
| 3 | **Bloodstained Chivalry** | Physical DMG Bonus +25% | After defeating an opponent, Charged Attack DMG +50% and stamina cost reduced to 0 for 10s. | Eula |
| 4 | **Crimson Witch of Flames** | Pyro DMG Bonus +15% | Overloaded/Burning/Burgeon DMG +40%. Vaporize/Melt DMG +15%. Skill cast increases 2pc bonus by 50% (max 3 stacks). | Diluc, Gaming, Hu Tao, Klee, Mavuika, +3 more |
| 5 | **Deepwood Memories** | Dendro DMG Bonus +15% | Skill or Burst hit reduces target's Dendro RES by 30% for 8s (triggers off-field). | Alhaitham, Baizhu, Collei, Columbina, Emilie, +8 more |
| 6 | **Desert Pavilion Chronicle** | Anemo DMG Bonus +15% | Charged Attack hit increases Normal ATK SPD by 10% and Normal/Charged/Plunging DMG by 40% for 15s. | Chasca, Shikanoin Heizou, Varka, Wanderer, Xiao |
| 7 | **Echoes of an Offering** | ATK +18% | Normal Attack hit has 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK. | Kamisato Ayato, Wanderer |
| 8 | **Emblem of Severed Fate** | Energy Recharge +20% | Increases Elemental Burst DMG by 25% of Energy Recharge (max 75% bonus at 300% ER). | Aino, Alyosha, Beidou, Chongyun, Durin, +13 more |
| 9 | **Flower of Paradise Lost** | Elemental Mastery +80 | Bloom, Hyperbloom, and Burgeon reaction DMG +40%. Extra +25% per stack on trigger (max 4 stacks). | Kaveh, Kuki Shinobu, Thoma |
| 10 | **Fragment of Harmonic Whimsy** | ATK +18% | When the value of a Bond of Life increases or decreases, character deals 18% increased DMG for 6s (max 3 stacks, +54%). | Arlecchino, Clorinde, Skirk |
| 11 | **Gilded Dreams** | Elemental Mastery +80 | Within 8s of reaction, gains ATK +14% for same-element teammates and +50 EM for different-element teammates (max 3 stacks). | Alhaitham, Cyno, Dehya, Diluc, Ineffa, +10 more |
| 12 | **Gladiator's Finale** | ATK +18% | If wielder uses Sword, Claymore, or Polearm, Normal Attack DMG +35%. | Arlecchino, Clorinde, Cyno, Kamisato Ayato, Lohen, +3 more |
| 13 | **Golden Troupe** | Elemental Skill DMG +20% | Increases Elemental Skill DMG by 25%. When off-field, Skill DMG is further increased by 25% (total +70% off-field). | Aino, Albedo, Chiori, Columbina, Durin, +14 more |
| 14 | **Heart of Depth** | Hydro DMG Bonus +15% | After using Elemental Skill, Normal and Charged Attack DMG +30% for 15s. | Kamisato Ayato, Mualani, Neuvillette, Tartaglia |
| 15 | **Husk of Opulent Dreams** | DEF +30% | Gains Curiosity stacks on-field (Geo hit) and off-field (every 3s). Each stack grants +6% DEF and +6% Geo DMG (max 4 stacks, +24%). | Albedo, Arataki Itto, Chiori, Gorou, Kachina, +4 more |
| 16 | **Instructor** | Elemental Mastery +80 | Triggering an Elemental Reaction increases all party members' Elemental Mastery by 120 for 8s. | Amber, Barbara, Bennett, Collei, Sucrose, +2 more |
| 17 | **Lavawalker** | Pyro RES +40% | Increases DMG against opponents affected by Pyro by 35%. | Klee, Lyney |
| 18 | **Maiden Beloved** | Character Healing Effectiveness +15% | Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s. | Barbara, Diona |
| 19 | **Marechaussee Hunter** | Normal & Charged Attack DMG +15% | When current HP increases or decreases, CRIT Rate +12% for 5s (max 3 stacks, +36% total CRIT Rate). | Arataki Itto, Gaming, Hu Tao, Lynette, Lyney, +9 more |
| 20 | **Nighttime Whispers in the Echoing Woods** | ATK +18% | Using an Elemental Skill grants +20% Geo DMG for 10s. When shielded by Crystallize, grants +150% additional effect (total +50% Geo DMG). | Navia, Ningguang |
| 21 | **Noblesse Oblige** | Elemental Burst DMG +20% | Using an Elemental Burst increases all party members' ATK by 20% for 12s (does not stack). | Aloy, Amber, Beidou, Bennett, Candace, +37 more |
| 22 | **Nymph's Dream** | Hydro DMG Bonus +15% | Normal/Charged/Plunge/Skill/Burst hits grant Mirrored Nymph stacks (+ATK% & +Hydro DMG%, up to +25% ATK and +15% Hydro). | Tartaglia, Traveler (Hydro) |
| 23 | **Obsidian Codex** | DMG dealt +15% while in Nightsoul's Blessing | While on-field character is in Nightsoul's Blessing, consuming Nightsoul points increases CRIT Rate by 40% for 6s. | Chasca, Kinich, Mavuika, Mualani, Varesa, +1 more |
| 24 | **Ocean-Hued Clam** | Healing Bonus +15% | Accumulates healing (including overheal) for 3s, then detonates a Sea-Dyed Foam dealing 90% of accumulated heal as Physical DMG (up to ~30k DMG). | Baizhu, Barbara, Charlotte, Dori, Escoffier, +9 more |
| 25 | **Pale Flame** | Physical DMG Bonus +25% | Skill hit grants +9% ATK for 7s (max 2 stacks). At 2 stacks, 2pc effect is increased by 100% (+50% Phys DMG, +18% ATK). | Eula, Freminet, Lohen, Razor, Xinyan |
| 26 | **Scroll of the Hero of Cinder City** | Party Energy restored upon nearby Nightsoul Burst | Triggering an elemental reaction grants 12% DMG bonus for involved elements. If equipped character is in Nightsoul, grants 28% more (total +40% party DMG). | Citlali, Iansan, Ifa, Ineffa, Kachina, +5 more |
| 27 | **Shimenawa's Reminiscence** | ATK +18% | If character has >=15 Energy when casting Skill, consumes 15 Energy to increase Normal/Charged/Plunging DMG by 50% for 10s. | Ganyu, Hu Tao, Shenhe, Wanderer, Yoimiya |
| 28 | **Silken Moon's Serenade** | Elemental Mastery +80 | When party Moonsign is active, triggering Lunar reactions grants +36% team Lunar reaction DMG and +120 EM for 12s. | Lauma, Nefer |
| 29 | **Song of Days Past** | Healing Bonus +15% | Records healing up to 15,000 HP for 6s, then grants Yearning buff adding 8% of recorded healing to active character's hits (max 5 hits). | Baizhu, Charlotte, Chevreuse, Sigewinne, Vodyanitsa, +1 more |
| 30 | **Tenacity of the Millelith** | HP +20% | When an Elemental Skill hits an opponent, all party members gain +20% ATK and +30% Shield Strength for 3s (triggers off-field). | Chevreuse, Citlali, Dahlia, Dehya, Diona, +13 more |
| 31 | **The Exile** | Energy Recharge +20% | Using an Elemental Burst regenerates 2 Energy for all party members (excluding wielder) every 2s for 6s (6 Energy total). | Candace, Dori, Faruzan, Gorou, Yun Jin |
| 32 | **Thundering Fury** | Electro DMG Bonus +15% | Overloaded, Electro-Charged, Superconduct, and Hyperbloom DMG +40%, Aggravate bonus +20%. Triggering reactions reduces Skill CD by 1s (0.8s CD). | Alyosha, Clorinde, Cyno, Fischl, Flins, +2 more |
| 33 | **Unfinished Reverie** | ATK +18% | After leaving combat for 3s, DMG +50%. In combat, if no Burning opponents are nearby, DMG bonus decreases by 10% every second; with Burning, it increases by 10% (up to 50%). | Emilie, Kinich |
| 34 | **Vermillion Hereafter** | ATK +18% | After Burst, gains Nascent Light (+8% ATK). Each time HP decreases, ATK increases by 10% (max 4 stacks, up to +66% ATK total). | Xiao |
| 35 | **Viridescent Venerer** | Anemo DMG Bonus +15% | Swirl DMG +60%. Decreases opponent's Elemental RES to the element infused in the Swirl by 40% for 10s. | Jahoda, Jean, Kaedehara Kazuha, Lan Yan, Lynette, +9 more |
| 36 | **Vourukasha's Glow** | HP +20% | Skill and Burst DMG +10%. When taking DMG, gains +8% Skill/Burst DMG for 5s (max 5 stacks, +50% total bonus). | Dehya, Nilou |
| 37 | **Wanderer's Troupe** | Elemental Mastery +80 | If wielder uses Catalyst or Bow, Charged Attack DMG +35%. | Ganyu, Sethos, Tighnari, Yanfei |

### Master 64-Set Registry Index

| # | Artifact Set | Min Rarity | Max Rarity | Combat Set? | 2pc / 1pc Effect |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | **A Day Carved From Rising Winds** | 4★ | 5★ | Yes | ATK +18%. |
| 2 | **Archaic Petra** | 4★ | 5★ | Yes | Gain a 15% Geo DMG Bonus. |
| 3 | **Aubade of Morningstar and Moon** | 4★ | 5★ | Yes | Increases Elemental Mastery by 80. |
| 4 | **Blizzard Strayer** | 4★ | 5★ | Yes | Cryo DMG Bonus +15% |
| 5 | **Bloodstained Chivalry** | 4★ | 5★ | Yes | Physical DMG +25% |
| 6 | **Celestial Gift** | 4★ | 5★ | Yes | Energy Recharge +20%. |
| 7 | **Crimson Witch of Flames** | 4★ | 5★ | Yes | Pyro DMG Bonus +15% |
| 8 | **Deepwood Memories** | 4★ | 5★ | Yes | Dendro DMG Bonus +15%. |
| 9 | **Desert Pavilion Chronicle** | 4★ | 5★ | Yes | Anemo DMG Bonus +15% |
| 10 | **Disenchantment in Deep Shadow** | 4★ | 5★ | Yes | ATK +18%. |
| 11 | **Echoes of an Offering** | 4★ | 5★ | Yes | ATK +18%. |
| 12 | **Emblem of Severed Fate** | 4★ | 5★ | Yes | Energy Recharge +20% |
| 13 | **Finale of the Deep Galleries** | 4★ | 5★ | Yes | Cryo DMG Bonus +15% |
| 14 | **Flower of Paradise Lost** | 4★ | 5★ | Yes | Increases Elemental Mastery by 80. |
| 15 | **Fragment of Harmonic Whimsy** | 4★ | 5★ | Yes | ATK +18%. |
| 16 | **Gilded Dreams** | 4★ | 5★ | Yes | Increases Elemental Mastery by 80. |
| 17 | **Gladiator's Finale** | 4★ | 5★ | Yes | ATK +18%. |
| 18 | **Golden Troupe** | 4★ | 5★ | Yes | Increases Elemental Skill DMG by 20%. |
| 19 | **Heart of Depth** | 4★ | 5★ | Yes | Hydro DMG Bonus +15% |
| 20 | **Heart of the Furnace** | 4★ | 5★ | Yes | ATK +18%. |
| 21 | **Husk of Opulent Dreams** | 4★ | 5★ | Yes | DEF +30% |
| 22 | **Lavawalker** | 4★ | 5★ | Yes | Pyro RES increased by 40%. |
| 23 | **Long Night's Oath** | 4★ | 5★ | Yes | Plunging Attack DMG increased by 25%. |
| 24 | **Maiden Beloved** | 4★ | 5★ | Yes | Character Healing Effectiveness +15% |
| 25 | **Marechaussee Hunter** | 4★ | 5★ | Yes | Normal and Charged Attack DMG +15% |
| 26 | **Night of the Sky's Unveiling** | 4★ | 5★ | Yes | Increases Elemental Mastery by 80. |
| 27 | **Nighttime Whispers in the Echoing Woods** | 4★ | 5★ | Yes | ATK +18%. |
| 28 | **Noblesse Oblige** | 4★ | 5★ | Yes | Elemental Burst DMG +20% |
| 29 | **Nymph's Dream** | 4★ | 5★ | Yes | Hydro DMG Bonus +15% |
| 30 | **Obsidian Codex** | 4★ | 5★ | Yes | While the equipping character is in Nightsoul's Blessing and is on the field, their DMG dealt is increased by 15%. |
| 31 | **Ocean-Hued Clam** | 4★ | 5★ | Yes | Healing Bonus +15%. |
| 32 | **Pale Flame** | 4★ | 5★ | Yes | Physical DMG is increased by 25%. |
| 33 | **Retracing Bolide** | 4★ | 5★ | Yes | Increases Shield Strength by 35%. |
| 34 | **Scarlet Proof** | 4★ | 5★ | Yes | ATK +18%. |
| 35 | **Scroll of the Hero of Cinder City** | 4★ | 5★ | Yes | When a nearby party member triggers a Nightsoul Burst, the equipping character regenerates 6 Elemental Energy. |
| 36 | **Shimenawa's Reminiscence** | 4★ | 5★ | Yes | ATK +18%. |
| 37 | **Silken Moon's Serenade** | 4★ | 5★ | Yes | Energy Recharge +20%. |
| 38 | **Song of Days Past** | 4★ | 5★ | Yes | Healing Bonus +15%. |
| 39 | **Tenacity of the Millelith** | 4★ | 5★ | Yes | HP +20% |
| 40 | **Thundering Fury** | 4★ | 5★ | Yes | Electro DMG Bonus +15% |
| 41 | **Thundersoother** | 4★ | 5★ | Yes | Electro RES increased by 40%. |
| 42 | **Unfinished Reverie** | 4★ | 5★ | Yes | ATK +18%. |
| 43 | **Vermillion Hereafter** | 4★ | 5★ | Yes | ATK +18%. |
| 44 | **Viridescent Venerer** | 4★ | 5★ | Yes | Anemo DMG Bonus +15% |
| 45 | **Vourukasha's Glow** | 4★ | 5★ | Yes | HP +20% |
| 46 | **Wanderer's Troupe** | 4★ | 5★ | Yes | Increases Elemental Mastery by 80. |
| 47 | **Berserker** | 3★ | 4★ | Yes | CRIT Rate +12% |
| 48 | **Brave Heart** | 3★ | 4★ | Yes | ATK +18%. |
| 49 | **Defender's Will** | 3★ | 4★ | Yes | DEF +30% |
| 50 | **Gambler** | 3★ | 4★ | Yes | Increases Elemental Skill DMG by 20%. |
| 51 | **Instructor** | 3★ | 4★ | Yes | Increases Elemental Mastery by 80. |
| 52 | **Martial Artist** | 3★ | 4★ | Yes | Normal and Charged Attack DMG +15% |
| 53 | **Prayers for Destiny** | 3★ | 4★ | No | Affected by Hydro for 40% less time. |
| 54 | **Prayers for Illumination** | 3★ | 4★ | No | Affected by Pyro for 40% less time. |
| 55 | **Prayers for Wisdom** | 3★ | 4★ | No | Affected by Electro for 40% less time. |
| 56 | **Prayers to Springtime** | 3★ | 4★ | No | Affected by Cryo for 40% less time. |
| 57 | **Resolution of Sojourner** | 3★ | 4★ | Yes | ATK +18%. |
| 58 | **Scholar** | 3★ | 4★ | Yes | Energy Recharge +20% |
| 59 | **The Exile** | 3★ | 4★ | Yes | Energy Recharge +20% |
| 60 | **Tiny Miracle** | 3★ | 4★ | Yes | All Elemental RES increased by 20%. |
| 61 | **Adventurer** | 1★ | 3★ | No | Max HP increased by 1,000. |
| 62 | **Lucky Dog** | 1★ | 3★ | No | DEF increased by 100. |
| 63 | **Traveling Doctor** | 1★ | 3★ | No | Increases incoming healing by 20%. |
| 64 | **Initiate** | 1★ | 1★ | No | None (Introductory set) |

---

## 5. Master Weapons Directory (256 Weapons)

### Weapon Distribution Overview

| Weapon Class | Total Weapons | 5★ Weapons | 4★ Weapons | 3★ Weapons | 1★–2★ Weapons |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Sword** | 62 | 19 | 35 | 6 | 2 |
| **Claymore** | 45 | 11 | 27 | 5 | 2 |
| **Polearm** | 43 | 13 | 25 | 3 | 2 |
| **Bow** | 50 | 12 | 31 | 5 | 2 |
| **Catalyst** | 56 | 21 | 28 | 5 | 2 |
| **Total** | **256** | **76** | **146** | **24** | **10** |

> **Combat Weapons (3★–5★)**: **246 weapons** (76 5★, 146 4★, 24 3★) with full refinement curves (R1–R5).

### 5★ Signature Weapons Catalogue (All 76 Weapons)

#### Swords (19 Weapons)

- **Absolution**: Base ATK 674, critDMG 44.1% | *Deathly Pact*: CRIT DMG increased by 20%. Increasing the value of a Bond of Life increases the DMG the equipping character deals by 16% for 6s. Max 3 stacks. *(Recommended for: Clorinde, Skirk)*
- **Aquila Favonia**: Base ATK 674, physicaldmg_ 41.3% | *Falcon's Defiance*: ATK is increased by 20%. Triggers on taking DMG: the soul of the Falcon of the West awakens, holding the banner of resistance aloft, regenerating HP equal to 100% of ATK and dealing 200% of ATK as DMG to surrounding opponents. This effect can only occur once every 15s. *(Recommended for: Bennett)*
- **Athame Artis**: Base ATK 608, critRate 33.1% | *Day King's Splendor Solis*: CRIT DMG from Elemental Bursts is increased by 16%. When an Elemental Burst hits an opponent, gain the Blade of the Daylight Hours effect: ATK is increased by 20%. Nearby active party members other than the equipping character have their ATK increased by 16% for 3s. Additionally, when the party possesses Hexerei: Secret Rite effects, the effects of Blade of the Daylight Hours are increased by an additional 75%. This effect can be triggered even if the equipping character is off-field.
- **Azurelight**: Base ATK 674, critRate 22.1% | *Whitehill's Bestowal*: Within 12s after an Elemental Skill is used, ATK is increased by 24%. During this time, when the equipping character has 0 Energy, ATK will be further increased by 24%, and CRIT DMG will be increased by 40%.
- **Beyond the Chrysalis**: Base ATK 674, critDMG 44.1% | *Dance of Wings Unbound*: Each time the equipping character uses their Elemental Skill or Elemental Burst, they gain one of the following three effects in sequence: Winds of Devotion: Increases the equipping character's CRIT DMG by 56% for 10s; Winds of Defiance: Increases Stellar Swirl reaction DMG dealt by the equipping character by 36% for 10s; and Winds of Plenty: Regenerates 5 Elemental Energy for the equipping character. Up to 5 Elemental Energy can be regenerated in this way every 4s. The aforementioned effects are removed and the sequence is reset when the equipping character leaves the field.
- **Exaiphanes Blade**: Base ATK 608, critRate 33.1% | *Traveler's Path*: When the Traveler equips this, their ATK will increase by 16% for 8s after they hit an opponent. At the same time, they will also regenerate 3 Elemental Energy. This effect can trigger once every 5s. This can be triggered even when the character is not on the field.
- **Freedom-Sworn**: Base ATK 608, eleMas 198 | *Revolutionary Chorale*: A part of the "Millennial Movement" that wanders amidst the winds. Increases DMG by 10%. When the character wielding this weapon triggers Elemental Reactions, they gain a Sigil of Rebellion. This effect can be triggered once every 0.5s and can be triggered even if said character is not on the field. When you possess 2 Sigils of Rebellion, all of them will be consumed and all nearby party members will obtain "Millennial Movement: Song of Resistance" for 12s. "Millennial Movement: Song of Resistance" increases Normal, Charged and Plunging Attack DMG by 16% and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Rebellion for 20s. Of the many effects of the "Millennial Movement," buffs of the same type will not stack. *(Recommended for: Jean, Kaedehara Kazuha, Kuki Shinobu, Lynette, Vesna, Traveler (Anemo), Traveler (Dendro), Traveler (Pyro))*
- **Haran Geppaku Futsu**: Base ATK 608, critRate 33.1% | *Honed Flow*: Obtain 12% All Elemental DMG Bonus. When other nearby party members use Elemental Skills, the character equipping this weapon will gain 1 Wavespike stack. Max 2 stacks. This effect can be triggered once every 0.3s. When the character equipping this weapon uses an Elemental Skill, all stacks of Wavespike will be consumed to gain Rippling Upheaval: each stack of Wavespike consumed will increase Normal Attack DMG by 20% for 8s. *(Recommended for: Clorinde, Kamisato Ayato)*
- **Key of Khaj-Nisut**: Base ATK 542, hp 66.2% | *Sunken Song of the Sands*: HP increased by 20%. When an Elemental Skill hits opponents, you gain the Grand Hymn effect for 20s. This effect increases the equipping character's Elemental Mastery by 0.12% of their Max HP. This effect can trigger once every 0.3s. Max 3 stacks. When this effect gains 3 stacks, or when the third stack's duration is refreshed, the Elemental Mastery of all nearby party members will be increased by 0.2% of the equipping character's max HP for 20s. *(Recommended for: Furina, Kirara, Kuki Shinobu, Layla, Nilou)*
- **Light of Foliar Incision**: Base ATK 542, critDMG 88.2% | *Whitemoon Bristle*: CRIT Rate is increased by 4%. After Normal Attacks deal Elemental DMG, the Foliar Incision effect will be obtained, increasing DMG dealt by Normal Attacks and Elemental Skills by 120% of Elemental Mastery. This effect will disappear after 28 DMG instances or 12s. You can obtain Foliar Incision once every 12s. *(Recommended for: Alhaitham, Zibai)*
- **Lightbearing Moonshard**: Base ATK 542, critDMG 88.2% | *Legacy of Lang-Gan*: Increases DEF by 20%. DMG inflicted by Lunar-Crystallize reactions increases by 64% for 5s after the equipping character uses an Elemental Skill.
- **Mistsplitter Reforged**: Base ATK 674, critDMG 44.1% | *Mistsplitter's Edge*: Gain a 12% Elemental DMG Bonus for all elements and receive the might of the Mistsplitter's Emblem. At stack levels 1/2/3, the Mistsplitter's Emblem provides a 8/16/28% Elemental DMG Bonus for the character's Elemental Type. The character will obtain 1 stack of Mistsplitter's Emblem in each of the following scenarios: Normal Attack deals Elemental DMG (stack lasts 5s), casting Elemental Burst (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently. *(Recommended for: Alhaitham, Bennett, Clorinde, Durin, Kaeya, Kamisato Ayaka, Kamisato Ayato, Keqing, Odette, Skirk, Xingqiu)*
- **Peak Patrol Song**: Base ATK 542, def 82.7% | *Halcyon Years Unending*: Gain "Ode to Flowers" after Normal or Plunging Attacks hit an opponent: DEF increases by 8% and gain a 10% All Elemental DMG Bonus for 6s. Max 2 stacks. Can trigger once per 0.1s. When this effect reaches 2 stacks or the 2nd stack's duration is refreshed, increase all nearby party members' All Elemental DMG Bonus by 8% for every 1,000 DEF the equipping character has, up to a maximum of 25.6%, for 15s. *(Recommended for: Durin, Valeriy, Xilonen, Traveler (Pyro))*
- **Primordial Jade Cutter**: Base ATK 542, critRate 44.1% | *Protector's Virtue*: HP increased by 20%. Additionally, provides an ATK Bonus based on 1.2% of the wielder's Max HP. *(Recommended for: Alhaitham, Chiori, Kaeya, Kamisato Ayato, Keqing, Odette, Xingqiu, Traveler (Geo), Traveler (Hydro))*
- **Skyward Blade**: Base ATK 608, enerRech 55.1% | *Sky-Piercing Fang*: CRIT Rate increased by 4%. Gains Skypiercing Might upon using an Elemental Burst: Increases Movement SPD by 10%, increases ATK SPD by 10%, and Normal and Charged hits deal additional DMG equal to 20% of ATK. Skypiercing Might lasts for 12s. *(Recommended for: Jean, Kamisato Ayaka, Qiqi, Traveler (Electro))*
- **Splendor of Tranquil Waters**: Base ATK 542, critDMG 88.2% | *Dawn and Dusk by the Lake*: When the equipping character's current HP increases or decreases, Elemental Skill DMG dealt will be increased by 8% for 6s. Max 3 stacks. This effect can be triggered once every 0.2s. When other party members' current HP increases or decreases, the equipping character's Max HP will be increased by 14% for 6s. Max 2 stacks. This effect can be triggered once every 0.2s. The aforementioned effects can be triggered even if the wielder is off-field. *(Recommended for: Furina)*
- **Summit Shaper**: Base ATK 608, atk 49.6% | *Golden Majesty*: Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.
- **Uraku Misugiri**: Base ATK 542, critDMG 88.2% | *Brocade Bloom, Shrine Sword*: Normal Attack DMG is increased by 16% and Elemental Skill DMG is increased by 24%. After a nearby active character deals Geo DMG, the aforementioned effects increase by 100% for 15s. Additionally, the wielder's DEF is increased by 20%. *(Recommended for: Albedo, Chiori)*
- **Whitelake Frostfeather**: Base ATK 674, critRate 22.1% | *Snow Swan's Finale*: When the equipping character hits an opponent with their Elemental Skill, they gain "Lake-Hued Lament": ATK increases by 8% for 8s. This effect can trigger once every 0.1s. Max 3 stacks, and each stack's duration is independent. At 3 stacks, the CRIT DMG of any Stellar Glimmer reaction DMG caused by the equipping character is increased by 50%, and triggering Stellar Glimmer reactions or Stellar Glimmer reaction DMG will also restore 4 Elemental Energy to the character. This Energy recovery effect can trigger once every 3.5s. Can be triggered even when the equipping character is off-field.

#### Claymores (11 Weapons)

- **A Teaspoon of Transcendence**: Base ATK 674, critDMG 44.1% | *White Fairy's Queening*: ATK is increased by 28%. Additionally, each time the equipping character hits an opponent with their Charged Attack, they attain "Transcendence" for a short time: their Stellar-Conduct and Stellar Swirl reaction DMG is increased by 16% for 5s. This effect can stack once every 0.2s, max 3 stacks.
- **A Thousand Blazing Suns**: Base ATK 741, critRate 11.0% | *Sunset Reignites the Dawn*: Gain the "Scorching Brilliance" effect when using an Elemental Skill or Burst: CRIT DMG increased by 20% and ATK increased by 28% for 6s. This effect can trigger once every 10s. While a "Scorching Brilliance" instance is active, its duration is increased by 2s after Normal or Charged attacks deal Elemental DMG. This effect can trigger once every second, and the max duration increase is 6s. Additionally, when the equipping character is in the Nightsoul's Blessing state, "Scorching Brilliance" effects are increased by 75%, and its duration will not count down when the equipping character is off-field. *(Recommended for: Mavuika)*
- **Beacon of the Reed Sea**: Base ATK 608, critRate 33.1% | *Desert Watch*: After the character's Elemental Skill hits an opponent, their ATK will be increased by 20% for 8s. After the character takes DMG, their ATK will be increased by 20% for 8s. The 2 aforementioned effects can be triggered even when the character is not on the field. Additionally, when not protected by a shield, the character's Max HP will be increased by 32%. *(Recommended for: Beidou, Dehya, Diluc, Eula, Gaming, Kinich, Razor)*
- **Fang of the Mountain King**: Base ATK 741, critRate 11.0% | *Turquoise Hunt*: Gain 1 stack of Canopy's Favor after hitting an opponent with an Elemental Skill. This can be triggered once every 0.5s. After a nearby party member triggers a Burning or Burgeon reaction, the equipping character will gain 3 stacks. This effect can be triggered once every 2s and can be triggered even when the triggering party member is off-field. Canopy's Favor: Elemental Skill and Burst DMG is increased by 10% for 6s. Max 6 stacks. Each stack is counted independently. *(Recommended for: Kinich)*
- **Gest of the Mighty Wolf**: Base ATK 608, critRate 33.1% | *Indomitable Chivalry*: Increase ATK SPD by 10%. Every time the equipping character's Normal Attack(s) hit opponent(s), when they cast their Elemental Skill, or when they begin their Charged Attack(s), gain 1/2/2 stacks of Four Winds' Hymn respectively: DMG dealt is increased by 7.5% for 4s. Max 4 stacks. This effect can be triggered once every 0.01s. Additionally, when the party has the "Hexerei: Secret Rite" effect, each stack of Four Winds' Hymn also increases the equipping character's CRIT DMG by 7.5%.
- **Redhorn Stonethresher**: Base ATK 542, critDMG 88.2% | *Gokadaiou Otogibanashi*: DEF is increased by 28%. Normal and Charged Attack DMG is increased by 40% of DEF. *(Recommended for: Arataki Itto, Diluc, Freminet, Gaming, Noelle, Sandrone, Varka, Xinyan)*
- **Skyward Pride**: Base ATK 674, enerRech 36.8% | *Sky-ripping Dragon Spine*: Increases all DMG by 8%. After using an Elemental Burst, a vacuum blade that does 80% of ATK as DMG to opponents along its path will be created when Normal or Charged Attacks hit. Lasts for 20s or 8 vacuum blades.
- **Song of Broken Pines**: Base ATK 741, physicaldmg_ 20.7% | *Rebel's Banner-Hymn*: A part of the "Millennial Movement" that wanders amidst the winds. Increases ATK by 16%, and when Normal or Charged Attacks hit opponents, the character gains a Sigil of Whispers. This effect can be triggered once every 0.3s. When you possess 4 Sigils of Whispers, all of them will be consumed and all nearby party members will obtain the "Millennial Movement: Banner-Hymn" effect for 12s. "Millennial Movement: Banner-Hymn" increases Normal ATK SPD by 12% and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Whispers for 20s. Of the many effects of the "Millennial Movement," buffs of the same type will not stack. *(Recommended for: Eula, Freminet)*
- **The Unforged**: Base ATK 608, atk 49.6% | *Golden Majesty*: Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%. *(Recommended for: Navia)*
- **Verdict**: Base ATK 674, critRate 22.1% | *Many Oaths of Dawn and Dusk*: Increases ATK by 20%. When party members obtain Elemental Shards from Crystallize or trigger Lunar-Crystallize reactions, the equipping character will gain 1 Seal, increasing Elemental Skill DMG by 18%. The Seal lasts for 15s, and the equipper may have up to 2 Seals at once. All of the equipper's Seals will disappear 0.2s after their Elemental Skill deals DMG. Up to 1 Seal may be obtained every second through the Lunar-Crystallize reaction. *(Recommended for: Navia)*
- **Wolf's Gravestone**: Base ATK 608, atk 49.6% | *Wolfish Tracker*: Increases ATK by 20%. On hit, attacks against opponents with less than 30% HP increase all party members' ATK by 40% for 12s. Can only occur once every 30s. *(Recommended for: Aino, Beidou, Chongyun, Dehya, Diluc, Eula, Mavuika, Razor, Sandrone, Sayu, Varka, Xinyan)*

#### Polearms (13 Weapons)

- **Bloodsoaked Ruins**: Base ATK 674, critRate 22.1% | *Mournful Tribute*: For 3.5s after using an Elemental Burst, the equipping character's Lunar-Charged DMG dealt to opponents is increased by 36%. Additionally, after triggering a Lunar-Charged reaction, the equipping character will gain Requiem of Ruin: CRIT DMG is increased by 28% for 6s. They will also regain 12 Elemental Energy. Elemental Energy can be restored this way once every 14s.
- **Calamity Queller**: Base ATK 741, atk 16.5% | *Extinguishing Precept*: Gain 12% All Elemental DMG Bonus. Obtain Consummation for 20s after using an Elemental Skill, causing ATK to increase by 3.2% per second. This ATK increase has a maximum of 6 stacks. When the character equipped with this weapon is not on the field, Consummation's ATK increase is doubled. *(Recommended for: Emilie, Shenhe, Xiao)*
- **Crimson Moon's Semblance**: Base ATK 674, critRate 22.1% | *Ashen Sun's Shadow*: Grants a Bond of Life equal to 25% of Max HP when a Charged Attack hits an opponent. This effect can be triggered up to once every 14s. In addition, when the equipping character has a Bond of Life, they gain a 12% DMG Bonus; if the value of the Bond of Life is greater than or equal to 30% of Max HP, then gain an additional 24% DMG Bonus. *(Recommended for: Arlecchino)*
- **Disaster and Remorse**: Base ATK 674, critRate 22.1% | *Dolorous Stroke*: After the equipping character uses an Elemental Skill, they gain "Path of Conflict" for 17s, as well as "Unforgivable" and "Irreparable" for 3s each. This effect can trigger once every 18s. Unforgivable: Increases the equipping character's Normal Attack and Charged Attack DMG by 40%. Irreparable: Increases the equipping character's Elemental Skill and Elemental Burst DMG by 40%. While Path of Conflict is in effect, when the equipping character hits an opponent with a Normal Attack or Charged Attack, Irreparable's duration will be increased by 1s. When the equipping character hits an opponent with their Elemental Skill or Elemental Burst, Unforgivable's duration will be increased by 1s. Each of the above effects can be triggered once every 0.1s. When Path of Conflict ends or the equipping character leaves the field, both Unforgivable and Irreparable will be removed. Hexerei: Secret Rite: The above DMG boosts are increased by 75%.
- **Engulfing Lightning**: Base ATK 608, enerRech 55.1% | *Timeless Dream: Eternal Stove*: ATK increased by 28% of Energy Recharge over the base 100%. You can gain a maximum bonus of 80% ATK. Gain 30% Energy Recharge for 12s after using an Elemental Burst. *(Recommended for: Raiden Shogun, Shenhe, Xiangling)*
- **Fractured Halo**: Base ATK 608, critDMG 66.2% | *Purifying Crown*: After an Elemental Skill or Elemental Burst is used, ATK is increased by 24% for 20s. If the equipping character creates a Shield while this effect is active, they will gain the Electrifying Edict effect for 20s: All nearby party members deal 40% more Lunar-Charged DMG.
- **Lumidouce Elegy**: Base ATK 608, critRate 33.1% | *Bright Dawn Overture*: ATK increased by 15%. After the equipping character triggers Burning on an opponent or deals Dendro DMG to Burning opponents, the DMG dealt is increased by 18%. This effect lasts for 8s, max 2 stacks. When 2 stacks are reached or when the duration is refreshed at 2 stacks, restore 12 Energy. Energy can be restored this way once every 12s. The 2 aforementioned effects can be triggered even when the character is off-field. *(Recommended for: Emilie)*
- **Primordial Jade Winged-Spear**: Base ATK 674, critRate 22.1% | *Eagle Spear of Justice*: On hit, increases ATK by 3.2% for 6s. Max 7 stacks. This effect can only occur once every 0.3s. While in possession of the maximum possible stacks, DMG dealt is increased by 12%. *(Recommended for: Alyosha, Arlecchino, Cyno, Flins, Lohen, Xiao)*
- **Skyward Spine**: Base ATK 674, enerRech 36.8% | *Black Wing*: Increases CRIT Rate by 8% and increases Normal ATK SPD by 12%. Additionally, Normal and Charged Attacks hits on opponents have a 50% chance to trigger a vacuum blade that deals 40% of ATK as DMG in a small AoE. This effect can occur no more than once every 2s. *(Recommended for: Shenhe)*
- **Staff of Homa**: Base ATK 608, critDMG 66.2% | *Reckless Cinnabar*: HP increased by 20%. Additionally, provides an ATK Bonus based on 0.8% of the wielder's Max HP. When the wielder's HP is less than 50%, this ATK Bonus is increased by an additional 1% of Max HP. *(Recommended for: Alyosha, Cyno, Emilie, Flins, Hu Tao, Lohen, Raiden Shogun, Rosaria, Xiao, Zhongli)*
- **Staff of the Scarlet Sands**: Base ATK 542, critRate 44.1% | *Heat Haze at Horizon's End*: The equipping character gains 52% of their Elemental Mastery as bonus ATK. When an Elemental Skill hits opponents, the Dream of the Scarlet Sands effect will be gained for 10s: The equipping character will gain 28% of their Elemental Mastery as bonus ATK. Max 3 stacks. *(Recommended for: Cyno, Ineffa, Xiangling)*
- **Symphonist of Scents**: Base ATK 608, critDMG 66.2% | *Seasoned Symphony*: ATK is increased by 12%. When the equipping character is off-field, ATK is increased by an additional 12%. After initiating healing, the equipping character and the character(s) they have healed will obtain the "Sweet Echoes" effect, increasing their ATK by 32% for 3s. This effect can be triggered even if the equipping character is off-field.
- **Vortex Vanquisher**: Base ATK 608, atk 49.6% | *Golden Majesty*: Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%.

#### Bows (12 Weapons)

- **Amos' Bow**: Base ATK 608, atk 49.6% | *Strong-Willed*: Increases Normal and Charged Attack DMG by 12%. After a Normal or Charged Attack is fired, DMG dealt increases by a further 8% every 0.1s the arrow is in the air for up to 5 times. *(Recommended for: Ganyu)*
- **Aqua Simulacra**: Base ATK 542, critDMG 88.2% | *The Cleansing Form*: HP is increased by 16%. When there are opponents nearby, the DMG dealt by the wielder of this weapon is increased by 20%. This will take effect whether the character is on-field or not. *(Recommended for: Chasca, Fischl, Ganyu, Linnea, Lyney, Tartaglia, Tighnari, Venti, Yelan, Yoimiya)*
- **Astral Vulture's Crimson Plumage**: Base ATK 608, critDMG 66.2% | *The Moonring Sighted*: For 12s after triggering a Swirl or Stellar Swirl reaction, ATK increases by 24%. In addition, when 1/2 or more characters in the party are of a different Elemental Type from the equipping character, the DMG dealt by the equipping character's Charged Attacks is increased by 20%/48%, and Elemental Burst DMG dealt is increased by 10%/24%. *(Recommended for: Chasca)*
- **Elegy for the End**: Base ATK 608, enerRech 55.1% | *The Parting Refrain*: A part of the "Millennial Movement" that wanders amidst the winds. Increases Elemental Mastery by 60. When the Elemental Skills or Elemental Bursts of the character wielding this weapon hit opponents, that character gains a Sigil of Remembrance. This effect can be triggered once every 0.2s and can be triggered even if said character is not on the field. When you possess 4 Sigils of Remembrance, all of them will be consumed and all nearby party members will obtain the "Millennial Movement: Farewell Song" effect for 12s. "Millennial Movement: Farewell Song" increases Elemental Mastery by 100 and increases ATK by 20%. Once this effect is triggered, you will not gain Sigils of Remembrance for 20s. Of the many effects of the "Millennial Movement," buffs of the same type will not stack. *(Recommended for: Amber, Collei, Faruzan, Gorou, Jahoda, Kujou Sara, Ororon, Venti, Yelan)*
- **Golden Frostbound Oath**: Base ATK 542, critDMG 88.2% | *Dawn's Salutation Returned*: Increase DEF by 16%. When the equipping character's Elemental Skill or Lunar-Crystallize attacks hit opponents, gain the Frost Fae's Favor effect for 6s: Geo DMG inflicted by the equipping character increases by 40%, Lunar-Crystallize Reaction DMG increases by 40%. While this effect is active, if there are Moondrifts near the equipping character, all other nearby party members will gain the Frost Fae's Mischief effect: Geo DMG dealt increases by 20% and Lunar-Crystallize Reaction DMG increases by 20%. This effect can be triggered even when the equipping character is off-field.
- **Hunter's Path**: Base ATK 542, critRate 44.1% | *At the End of the Beast-Paths*: Gain 12% All Elemental DMG Bonus. Obtain the Tireless Hunt effect after hitting an opponent with a Charged Attack. This effect increases Charged Attack DMG by 160% of Elemental Mastery. This effect will be removed after 12 Charged Attacks or 10s. Only 1 instance of Tireless Hunt can be gained every 12s. *(Recommended for: Ganyu, Sethos, Tighnari)*
- **Polar Star**: Base ATK 608, critRate 33.1% | *Daylight's Augury*: Elemental Skill and Elemental Burst DMG increased by 12%. After a Normal Attack, Charged Attack, Elemental Skill or Elemental Burst hits an opponent, 1 stack of Ashen Nightstar will be gained for 12s. When 1/2/3/4 stacks of Ashen Nightstar are present, ATK is increased by 10/20/30/48%. The stack of Ashen Nightstar created by the Normal Attack, Charged Attack, Elemental Skill or Elemental Burst will be counted independently of the others. *(Recommended for: Aloy, Fischl, Tartaglia)*
- **Silvershower Heartstrings**: Base ATK 542, hp 66.2% | *Dryas's Nocturne*: The equipping character can gain the Remedy effect. When they possess 1/2/3 Remedy stacks, Max HP will increase by 12%/24%/40%. 1 stack may be gained when the following conditions are met: 1 stack for 25s when using an Elemental Skill; 1 stack for 25s when the value of a Bond of Life value increases; 1 stack for 20s for performing healing. Stacks can still be triggered when the equipping character is not on the field. Each stack's duration is counted independently. In addition, when 3 stacks are active, Elemental Burst CRIT Rate will be increased by 28%. This effect will be canceled 4s after falling under 3 stacks. *(Recommended for: Sigewinne)*
- **Skyward Harp**: Base ATK 674, critRate 22.1% | *Echoing Ballad*: Increases CRIT DMG by 20%. Hits have a 60% chance to inflict a small AoE attack, dealing 125% Physical ATK DMG. Can only occur once every 4s. *(Recommended for: Faruzan, Fischl, Kujou Sara)*
- **The Daybreak Chronicles**: Base ATK 674, critDMG 44.1% | *Ode Beyond Time*: The equipping character gains Stirring Dawn Breeze: 3s after leaving combat, Normal Attack, Elemental Skill, and Elemental Burst DMG is increased by 60%. While in combat, this DMG Bonus will decrease by 10% per second until it reaches 0%. When the equipping character's Normal Attacks, Elemental Skills, or Elemental Bursts hit an opponent, the DMG Bonus for the corresponding DMG type is increased by 10% until it reaches 60%. This effect can be triggered once every 0.1s for each of the attack types mentioned above. This effect can be triggered even if the equipping character is off-field. Additionally, when the party possesses Hexerei: Secret Rite effects, when the equipping character's Normal Attacks, Elemental Skills, or Elemental Bursts hit an opponent, the DMG Bonus for all these DMG types is increased by 20% instead.
- **The First Great Magic**: Base ATK 608, critDMG 66.2% | *Parsifal the Great*: DMG dealt by Charged Attacks increased by 16%. For every party member with the same Elemental Type as the wielder (including the wielder themselves), gain 1 Gimmick stack. For every party member with a different Elemental Type from the wielder, gain 1 Theatrics stack. When the wielder has 1/2/3 or more Gimmick stacks, ATK will be increased by 16%/32%/48%. When the wielder has 1/2/3 or more Theatrics stacks, Movement SPD will be increased by 4%/7%/10%. *(Recommended for: Chasca, Ganyu, Lyney, Sethos, Tighnari)*
- **Thundering Pulse**: Base ATK 608, critDMG 66.2% | *Rule by Thunder*: Increases ATK by 20% and grants the might of the Thunder Emblem. At stack levels 1/2/3, the Thunder Emblem increases Normal Attack DMG by 12/24/40%. The character will obtain 1 stack of Thunder Emblem in each of the following scenarios: Normal Attack deals DMG (stack lasts 5s), casting Elemental Skill (stack lasts 10s); Energy is less than 100% (stack disappears when Energy is full). Each stack's duration is calculated independently. *(Recommended for: Aloy, Lyney, Tartaglia, Yoimiya)*

#### Catalysts (21 Weapons)

- **A Thousand Floating Dreams**: Base ATK 542, eleMas 265 | *A Thousand Nights' Dawnsong*: Party members other than the equipping character will provide the equipping character with buffs based on whether their Elemental Type is the same as the latter or not. If their Elemental Types are the same, increase Elemental Mastery by 32. If not, increase the equipping character's DMG Bonus from their Elemental Type by 10%. Each of the aforementioned effects can have up to 3 stacks. Additionally, all nearby party members other than the equipping character will have their Elemental Mastery increased by 40. Multiple such effects from multiple such weapons can stack. *(Recommended for: Columbina, Lauma, Lisa, Nahida, Nefer, Nicole, Yae Miko)*
- **Angelos' Heptades**: Base ATK 741, atk 16.5% | *Crown of the Final Scion*: ATK is increased by 12%. After the equipping character creates a Shield, they gain "Pathfinder's Light" for 20s: Increases your active party member's DMG by 10% for every 1,000 ATK the equipping character has, up to a maximum of 26%. Additionally, when the equipping character creates a Shield, they will also gain "Guide's Contentment": Restores 14 Elemental Energy to the equipping character. The aforementioned effect can trigger once every 14s, and can also be triggered when any type of chest is opened outside of combat. The equipping character may trigger this effect even when they are an off-field. Hexerei: Secret Rite: When your own Hexerei character is off-field in the party, they will also gain 50% of the DMG increase from Pathfinder's Light.
- **Cashflow Supervision**: Base ATK 674, critRate 22.1% | *Golden Blood-Tide*: ATK is increased by 16%. When current HP increases or decreases, Normal Attack DMG is increased by 16%, Charged Attack DMG is increased by 14%, and Stellar-Conduct DMG is increased by 14% for 4s. Max 3 stacks. This effect can be triggered once every 0.3s. When the wielder has 3 stacks, ATK SPD will be increased by 8%. *(Recommended for: Wriothesley)*
- **Crane's Echoing Call**: Base ATK 741, atk 16.5% | *Cloudfall Axiom*: After the equipping character hits an opponent with a Plunging Attack, all nearby party members' Plunging Attacks will deal 28% increased DMG for 20s. When nearby party members hit opponents with Plunging Attacks, they will restore 2.5 Energy to the equipping character. Energy can be restored this way every 0.7s. This energy regain effect can be triggered even if the equipping character is not on the field. *(Recommended for: Xianyun)*
- **Everlasting Moonglow**: Base ATK 608, hp 49.6% | *Byakuya Kougetsu*: Healing Bonus increased by 10%, Normal Attack DMG is increased by 1% of the Max HP of the character equipping this weapon. For 12s after using an Elemental Burst, Normal Attacks that hit opponents will restore 0.6 Energy. Energy can be restored this way once every 0.1s. *(Recommended for: Sangonomiya Kokomi)*
- **Hymn of the Maelstrom**: Base ATK 542, hp 66.2% | *Rondo of Slumber*: Increases Healing Bonus by 4%. When performing healing, the equipping character gains the "Vatsamonga's Vatic Vintage" effect, which increases Max HP by 4% as well as increases the currently active party member's ATK by 0.4% for every 1,000 Max HP the equipping character has over 40,000. A maximum of 8% ATK can be gained in this way. This effect lasts 10s, max 3 stacks. When a nearby party member triggers a Frozen or Stellar Swirl reaction, the aforementioned Max HP and ATK boosts will be further increased by 75% for the next 5s. The aforementioned effects can still trigger even when the equipping character is not on the field.
- **Jadefall's Splendor**: Base ATK 608, hp 49.6% | *Primordial Jade Regalia*: For 3s after using an Elemental Burst or creating a shield, the equipping character can gain the Primordial Jade Regalia effect: Restore 4.5 Energy every 2.5s, and gain 0.3% Elemental DMG Bonus for their corresponding Elemental Type for every 1,000 Max HP they possess, up to 12%. Primordial Jade Regalia will still take effect even if the equipping character is not on the field. *(Recommended for: Baizhu)*
- **Kagura's Verity**: Base ATK 608, critDMG 66.2% | *Kagura Dance of the Sacred Sakura*: Using an Elemental Skill grants the Kagura Dance effect, increasing the wielding character's Elemental Skill DMG by 12% as well as their Stellar-Conduct DMG by 12% for 24s. Max 3 stacks. This character will gain a 12% All Elemental DMG Bonus when they possess 3 stacks. *(Recommended for: Klee, Lisa, Shikanoin Heizou, Yae Miko)*
- **Lost Prayer to the Sacred Winds**: Base ATK 608, critRate 33.1% | *Boundless Blessing*: Increases Movement SPD by 10%. When in battle, gain an 8% Elemental DMG Bonus every 4s. Max 4 stacks. Lasts until the character falls or leaves combat. *(Recommended for: Klee, Mitya, Neuvillette, Ningguang, Shikanoin Heizou, Varesa, Wanderer, Wriothesley, Yanfei, Yumemizuki Mizuki)*
- **Memory of Dust**: Base ATK 608, atk 49.6% | *Golden Majesty*: Increases Shield Strength by 20%. Scoring hits on opponents increases ATK by 4% for 8s. Max 5 stacks. Can only occur once every 0.3s. While protected by a shield, this ATK increase effect is increased by 100%. *(Recommended for: Ningguang, Wanderer)*
- **Nightweaver's Looking Glass**: Base ATK 542, eleMas 265 | *Millennial Hymn*: When the equipping character's Elemental Skill deals Hydro or Dendro DMG, they will gain Prayer of the Far North: Elemental Mastery is increased by 60 for 4.5s. When nearby party members trigger Lunar-Bloom reactions, the equipping character gains New Moon Verse: Elemental Mastery is increased by 60 for 10s. When both Prayer of the Far North and New Moon Verse are in effect, all nearby party members' Bloom DMG is increased by 120%, their Hyperbloom and Burgeon DMG is increased by 80%, and their Lunar-Bloom DMG is increased by 40%. This effect cannot stack. The aforementioned effects can be triggered even if the equipping character is off-field.
- **Nocturne's Curtain Call**: Base ATK 542, critDMG 88.2% | *Ballad of the Crossroads*: Max HP increases by 10%. When triggering Lunar reactions or inflicting Lunar Reaction DMG on opponents, the equipping character will recover 14 Energy, and receive the Bountiful Sea's Sacred Wine effect for 12s: Max HP increases by an additional 14%, CRIT DMG from Lunar Reaction DMG increases by 60%. The Energy recovery effect can be triggered at most once every 18s, and can be triggered even when the equipping character is off-field.
- **Reliquary of Truth**: Base ATK 542, critDMG 88.2% | *Essence of Falsity*: CRIT Rate is increased by 8%. When the equipping character unleashes an Elemental Skill, they gain the Secret of Lies effect: Elemental Mastery is increased by 80 for 12s. When the equipping character deals Lunar-Bloom DMG to an opponent, they gain the Moon of Truth effect: CRIT DMG is increased by 24% for 4s. When both the Secret of Lies and Moon of Truth effects are active at the same time, the results of both effects will be increased by 50%. *(Recommended for: Mitya, Nefer)*
- **Skyward Atlas**: Base ATK 674, atk 33.1% | *Wandering Clouds*: Increases Elemental DMG Bonus by 12%. Normal Attack hits have a 50% chance to earn the favor of the clouds, which actively seek out nearby opponents to attack for 15s, dealing 160% ATK DMG. Can only occur once every 30s. *(Recommended for: Xianyun)*
- **Starcaller's Watch**: Base ATK 542, eleMas 265 | *Offering Unto Wind and Sun*: Increases Elemental Mastery by 100. Gain the "Mirror of Night" effect within 15s after the equipping character creates a shield: The current active party member deals 28% increased DMG to nearby opponents. You can gain the "Mirror of Night" effect once every 14s. *(Recommended for: Citlali)*
- **Starsealed Edict**: Base ATK 542, critDMG 88.2% | *Dawnstar's Flowing Trail*: Increases CRIT DMG by 24%. The equipping character gains the Crystal Compounding effect when they use their Elemental Skill, increasing Elemental Mastery by 48 for 20s. During this time, the equipping character gains a Law of Combustion stack when a nearby party member triggers an Elemental Reaction. Each stack increases Elemental Mastery by an additional 24. Max 3 stacks. These stacks last until Crystal Compounding ends or the equipping character uses their Elemental Skill again. Radiance: Stellar-Conduct: Each Law of Combustion stack also increases the equipping character's Stellar-Conduct CRIT DMG by 12%. These effects can be triggered even when the equipping character is off-field.
- **Sunny Morning Sleep-In**: Base ATK 542, eleMas 265 | *Bathhouses, Hawks, and Narukami*: Elemental Mastery increases by 120 for 6s after triggering Swirl or Stellar Swirl. Elemental Mastery increases by 96 for 9s after the wielder's Elemental Skill hits an opponent. Elemental Mastery increases by 32 for 30s after the wielder's Elemental Burst hits an opponent.
- **Surf's Up**: Base ATK 542, critDMG 88.2% | *Aqua Remembrance*: Max HP increased by 20%. Once every 15s, for the 14s after using an Elemental Skill: Gain 4 Scorching Summer stacks. Each stack increases Normal Attack DMG by 12%. For the duration of the effect, once every 1.5s, lose 1 stack after a Normal Attack hits an opponent; once every 1.5s, gain 1 stack after triggering a Vaporize reaction on an opponent. Max 4 Scorching Summer stacks. *(Recommended for: Mualani)*
- **Tome of the Eternal Flow**: Base ATK 542, critDMG 88.2% | *Aeon Wave*: HP is increased by 16%. When current HP increases or decreases, Charged Attack DMG will be increased by 14% for 4s. Max 3 stacks. This effect can be triggered once every 0.3s. When the character has 3 stacks or a third stack's duration refreshes, 8 Energy will be restored. This Energy restoration effect can be triggered once every 12s. *(Recommended for: Neuvillette)*
- **Tulaytullah's Remembrance**: Base ATK 674, critDMG 44.1% | *Bygone Azure Teardrop*: Normal Attack SPD is increased by 10%. After the wielder unleashes an Elemental Skill, Normal Attack DMG will increase by 4.8% every second for 14s. After hitting an opponent with a Normal Attack during this duration, Normal Attack DMG will be increased by 9.6%. This increase can be triggered once every 0.3s. The maximum Normal Attack DMG increase per single duration of the overall effect is 48%. The effect will be removed when the wielder leaves the field, and using the Elemental Skill again will reset all DMG buffs. *(Recommended for: Wanderer, Wriothesley)*
- **Vivid Notions**: Base ATK 674, critDMG 44.1% | *Falling Rainbow's Wish*: ATK is increased by 28%. When you use a Plunging Attack, you will gain the "Dawn's First Hue" effect: Plunging Attack CRIT DMG is increased by 28%. When you use an Elemental Skill or Burst, you will gain the "Twilight's Splendor" effect: Plunging Attack CRIT DMG is increased by 40%. The two effects above each last for 15s, and will be canceled 0.1s after the ground impact hits a target.

### Key 4★ and 3★ Meta Weapons

| Weapon | Class | Rarity | Main / Substat | Key Passive & Role | Primary Celestia Beneficiaries |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **The Catch** | Polearm | 4★ | Base ATK 510, ER 45.9% | *Shanty*: +32% Burst DMG, +12% Burst CRIT Rate | Xiangling, Raiden Shogun |
| **Favonius Sword** | Sword | 4★ | Base ATK 454, ER 61.3% | *Windfall*: CRIT hits have 100% chance to generate 6 neutral energy particles | Bennett, Xingqiu, Kazuha, Furina, Jean, Traveler |
| **Favonius Lance** | Polearm | 4★ | Base ATK 565, ER 30.6% | *Windfall*: Universal team energy battery on CRIT hit | Zhongli, Shenhe, Yun Jin, Yaoyao, Mika |
| **Favonius Warbow** | Bow | 4★ | Base ATK 454, ER 61.3% | *Windfall*: High ER stat and particle generation | Yelan, Faruzan, Gorou, Collei, Diona |
| **Favonius Codex** | Catalyst | 4★ | Base ATK 510, ER 45.9% | *Windfall*: Burst uptime battery for catalyst supports | Baizhu, Xianyun, Mona, Sucrose |
| **Favonius Greatsword** | Claymore | 4★ | Base ATK 454, ER 61.3% | *Windfall*: Energy battery for high-cost bursts | Beidou, Sayu, Dehya, Noelle |
| **Sacrificial Sword** | Sword | 4★ | Base ATK 454, ER 61.3% | *Composed*: 80% chance to instantly reset Skill cooldown (16s CD) | Xingqiu, Kazuha, Lynette, Layla, Traveler |
| **Sacrificial Fragments** | Catalyst | 4★ | Base ATK 454, EM 221 | *Composed*: Skill CD reset + highest 4★ EM | Sucrose, Nahida, Columbina |
| **Sacrificial Bow** | Bow | 4★ | Base ATK 565, ER 30.6% | *Composed*: Skill reset for high-utility skills | Diona, Faruzan, Sara |
| **Serpent Spine** | Claymore | 4★ | Base ATK 510, CRIT Rate 27.6% | *Wavesplitter*: Every 4s on field grants +10% DMG (max 5 stacks, +50% All DMG) | Beidou, Diluc, Gaming, Itto, Navia, Noelle |
| **The Stringless** | Bow | 4★ | Base ATK 510, EM 165 | *Songless Ballad*: Increases Elemental Skill and Burst DMG by 48% | Fischl, Venti, Collei, Tighnari |
| **Xiphos' Moonlight** | Sword | 4★ | Base ATK 510, EM 165 | *Jinni's Whispers*: Converts EM into personal and party Energy Recharge | Kazuha, Kuki Shinobu, Nilou |
| **Fleuve Cendre Ferryman** | Sword | 4★ | Base ATK 510, ER 45.9% | *Solvebone*: Increases Skill CRIT Rate by 16% and ER by 32% post-Skill | Furina, Bennett, Lynette, Traveler |
| **Thrilling Tales of Dragon Slayers** | Catalyst | 3★ | Base ATK 401, HP 35.2% | *Heritage*: Switching characters grants next active character **+48% ATK for 10s** | Barbara, Sucrose, Mona, Baizhu, Nicole |
| **Black Tassel** | Polearm | 3★ | Base ATK 354, HP 46.9% | *Bane of the Soft*: Massive HP% stat stick | Zhongli, Chevreuse, Yaoyao, Thoma |
| **Slingshot** | Bow | 3★ | Base ATK 354, CRIT Rate 31.2% | *Slingshot*: Normal/Charged shots hitting within 0.3s deal +60% DMG | Yelan, Tighnari, Yoimiya |
| **Harbinger of Dawn** | Sword | 3★ | Base ATK 401, CRIT DMG 46.9% | *Vigorous*: When HP > 90%, increases CRIT Rate by 28% | Albedo, Layla, Kaeya, Traveler |
| **White Tassel** | Polearm | 3★ | Base ATK 401, CRIT Rate 23.4% | *Sharp*: Increases Normal Attack DMG by 48% | Cyno, Arlecchino, Hu Tao |

---

## 6. Combat Mechanics & Era Systems

### 1. Moonsign System & Lunar Reactions (Nod-Krai / Version 6.x & 7.x)
- **Moonsign Levels**: Parties accumulate Moonsign levels (e.g. from Aino's passive *Moonsign Benediction* and Columbina's talents).
- **Ascendant Gleam**: State activated at high Moonsign thresholds empowering elemental abilities.
- **Lunar Reaction Types**:
  - **Lunar-Bloom**: Dendro + Hydro under Moonsign creates hyper-dense Lunar seeds detonating with zero delay and increased AoE (driven by Nefer and Columbina).
  - **Lunar-Charged**: Electro + Hydro under Moonsign dealing continuous ticking chain-damage with elemental resistance reduction.
  - **Lunar-Crystallize**: Geo + Elemental under Moonsign creating resonant shields that pulse matching elemental shockwaves (driven by Zibai and Linnea).

### 2. Nightsoul Blessing & Nightsoul Burst (Natlan / Version 5.x+)
- **Nightsoul Points**: Secondary resource bar fueling high-mobility movement (skating, climbing, flying) and enhanced combat stances.
- **Nightsoul Transmission**: Instant character swapping mid-movement directly into high-speed combat states.
- **Nightsoul Burst**: Detonation triggered when any party member deals elemental DMG with a Natlan character in team, reducing cooldowns and activating artifact buffs (e.g., *Scroll of the Hero of Cinder City*).

### 3. Hexerei & Secret Rites (Hexenzirkel / Version 7.x)
- **Hexerei: Secret Rite**: Arcane party state triggered by Hexenzirkel members (e.g., Nicole) or specialized weapons (*Athame Artis*, *Disaster and Remorse*), multiplying weapon passive effects by +75%.

### 4. Polestar Fields (Snezhnaya / Version 7.x)
- **Stellar-Conduct & Stellar Swirl**: Snezhnayan reaction enhancement occurring within Polestar aura zones (e.g., Alyosha's *Hunter's Advance*, Vesna's blade dance, and Mitya's lightning arrays).

### 5. Bond of Life & HP Fluctuation (Fontaine / Version 4.x+)
- **Bond of Life**: Absorbs incoming heals equal to a % of Max HP before healing can resume; empowers carries like Arlecchino and Clorinde and triggers *Fragment of Harmonic Whimsy*.
- **Fanfare**: Furina's teamwide damage multiplier (up to +75% All DMG) accumulated when party members' HP rises or falls.

---

## 7. Verified Corrections Ledger (Permanent Incident Log)

> **Purpose**: Whenever an agent or model makes an erroneous statement about versions, mechanics, characters, weapons, or builds, the correction must be documented here permanently so future agents do not repeat the mistake.

| Date | Incident Description | Erroneous Claim | Verified Correct Baseline | Root Cause & Remediation |
| :---: | :--- | :--- | :--- | :--- |
| **2026-11-15** | Version Anchor Regression | Assumed current version was 5.x | **Version 7.2** is the active baseline (Nod-Krai, Snezhnaya, Natlan, Fontaine, Celestia). | Pre-training cutoff bias. Remediation: Enforced `GEMINI.md` rule and reference knowledge base. |
| **2026-11-15** | Character Roster Size | Assumed roster was ~80-90 characters | Exactly **128 canonical playable characters** (including 6 element-specific Traveler configurations) exist in `src/data/characters.ts`. | Failure to check local dataset. Remediation: Created complete 128-character element/region directory. |
| **2026-11-15** | Artifact Set Indexing | Missed late-game and modern artifact sets | **64 Master Artifact Sets** in `src/data/artifacts-master.ts` (with 37 combat sets actively indexed in the build engine). | Missing reference ledger. Remediation: Fully documented all 64 sets with 2pc/4pc details and primary users. |
| **2026-11-15** | Weapon Count & Modern Passives | Hallucinated old weapon stats | Exactly **256 weapons** (76 5★, 146 4★, 24 3★, 10 1★–2★) in `src/data/weapons.ts` with full R1–R5 curves. | Reliance on memory. Remediation: Catalogued all 76 5★ signatures and top staples. |
| **2026-11-15** | Weapon Signature Hallucinations | Hallucinated 8 fictitious weapons (Void-Severing Edge, Glacial Colossus, Boreas' Northern Wrath, etc.) and fabricated class rarity distributions | All **76 authentic 5★ weapons** must be derived from `src/data/weapons.ts` with correct class counts (19 Swords, 11 Claymores, 13 Polearms, 12 Bows, 21 Catalysts). | Hallucination from memory instead of reading `WEAPONS_DATA`. Remediation: Programmatic generation directly from SSOT and automated Vitest validation. |
| **2026-11-15** | GenshinDB Complete SSOT Expansion | Limited data to 122 characters, 246 weapons, and 37 artifact sets without modular talent scaling | Expanded to **128 canonical playable characters** (including 6 element-specific Traveler configurations), **256 weapons** (all 1★ to 5★ with R1–R5 curves), **64 Master Artifact Sets**, and **Level 1–15 modular talent scaling**. | Comprehensive SSOT synchronization directly from `genshin-db` v5.2.15+ and authoritative game data. |
| **2026-11-15** | Artifact ID & Weapon Key Integrity | Overwrote Resolution of Sojourner with duplicate ID `10001` for Initiate; created duplicate `PrizedIsshinBlade` keys overwriting weapon index | Assigned unique ID `10000` to Initiate and distinct keys `PrizedIsshinBlade`, `PrizedIsshinBlade1`, `PrizedIsshinBlade2` with authentic stats across all 256 weapons, 128 calibrated rotations, and talent scaling aliases. | Failure to enforce uniqueness on synthetic additions and name-based weapon iterations. Remediation: Added unique ID validation, verbose extraction, and full rotation calibration. |
| **2026-11-16** | Build & Stat Weight Calibration | 10 Batch 7 characters had mismatched goblet elements, wrong artifact sets (e.g. Cryo on Electro Alyosha, Geo on Electro Flins), and weapon/artifact typos; fallback weights hardcoded `pyro_dmg_` and ATK% for 113 characters; Kokomi crit-zeroing logic bypassed fallback weights; alias lookups ('Kokomi', 'Ayaka', etc.) fell back to Pyro ATK% | All 128 characters have matching goblet elements/damage bonuses, accurate BiS artifact sets and wielder descriptions; `getCharacterStatWeights` dynamically synthesizes weights and goblets from character SSOT data with comprehensive alias resolution and zeroed crit for Kokomi; weapon solver guarantees 0 crit weight for Kokomi; target set typos corrected | Data ingestion drift in Batch 7 script and static fallback in artifact-weights. Remediation: Synchronized character builds, implemented dynamic stat weight synthesis and alias resolver in `getCharacterStatWeights`, moved Kokomi crit-zeroing outside undefined guard in `weapon-solver.ts`, fixed targetSets typos, and added comprehensive invariant tests. |
| **2026-11-20** | Gacha Mathematics & Wish Engine Invariants | Hardcoded Capturing Radiance 100% guarantee at streak 2 (yielding false 64.46% win rate); weapon banner omitted 75/25 off-banner carryover guarantee; universal sandbox assigned 5★ 180 hard pity to 4★ characters | 4-state Markov renewal model (`[0.50, 0.50, 8/11, 1.00]`) converging to exact published 55.000% consolidated win rate (streak 3 gives 100% guarantee on 4th attempt); weapon banner models 75/25 carryover (50% target win rate on next 5★); 4★ targets modeled via absorbing Markov chain with realistic percentiles (median ~35 pulls, 90th percentile ~105 pulls, uncapped ceiling); multi-copy discrete convolution for C1-C6 and R1-R5 goals; optional ~8% Starglitter cashback toggle | Incomplete capture of HoYoverse 5.0+ / 7.2 wish rules in initial heuristic engine. Remediation: Created centralized `src/data/banner-rules.ts`, refactored `gacha-math.ts`, created `gacha-4star.ts`, updated `pull-advisor.ts`, added 500k-iteration Monte Carlo verification suite, expanded schema in `types/genshin.ts` and `storage.ts`, and added interactive CDF and methodology modals. |
| **2026-11-23** | M9 Phase 1 Data Trust, Reliability Contracts & Provenance Consolidation | Overloaded `ProvenanceStatus` (`'verified' | 'provisional' | 'stale'`) coupled data verification with schedule lifecycles; fabricated URLs/methods existed for sandbox entries (`sandbox_simulation`); duplicate schedule IDs (`abyss_floor_12_v7_2`, `theater_season_7_2_nov`, `theater_season_7_2_dec`) inflated registry to 38 entries; duplicated schedule expiry dates into `DataProvenance.effectiveEndDate`. | Decoupled 5-axis contracts (`VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, `RecommendationReliability`); 35 canonical provenance records (redundancies pruned); clean optional `sourceUrl` (omitted allowed for in-game verification and sandbox); frozen 17 legacy `effectiveEndDate` entries mirroring canonical schedules pending Phase 2 migration; exact-union compile and runtime tests in `data-integrity.test.ts`. | Structural coupling in M4 schema. Remediation: Implemented formal M9 reliability contracts in `src/types/genshin.ts`, cleaned `src/data/provenance-registry.ts`, updated Axis 6 in `scripts/audit-game-data.mjs`, added exact-union assertions in `data-integrity.test.ts`, and established Phase 2 migration path. |
| **2026-11-23** | M9 Phase 2 Central Evaluator & Single-Policy Freshness Architecture | Disparate expiration and staleness checks split between `data-freshness.ts` and solvers; 17 legacy `effectiveEndDate` entries duplicated canonical schedule dates in `provenance-registry.ts`; no centralized dependency-risk evaluation or conservative future-version policy; potential for divergent staleness assessments | Central SSOT evaluator in `recommendation-reliability.ts` (`evaluateRecommendationReliability`, `evaluateDatasetFreshness`, `resolveScheduleTemporalState`) with 4 freshness policies (`schedule_window`, `version_bound`, `patch_cadence`, `sandbox`); `data-freshness.ts` delegating directly to SSOT; permanent removal of `DataProvenance.effectiveEndDate` and purge of 17 legacy entries; Axis 6 audit guard forbidding duplicate schedule dates; conservative future-version policy; 92/92 focused + 661/661 repo-wide tests passing | Architectural fragmentation and lingering deprecated metadata from M4/Phase 1. Remediation: Centralized evaluation into `src/services/recommendation-reliability.ts`, unified freshness logic, deleted `DataProvenance.effectiveEndDate` across types and registry, enforced Axis 6 AST/regex checks, and validated complete 40-suite test matrix. |

### How to Log a New Correction:
1. Open this file: `docs/knowledge/celestia-reference.md`.
2. Locate this table under **Section 7: Verified Corrections Ledger**.
3. Add a new row containing:
   - Date (`YYYY-MM-DD`)
   - Incident Description
   - Erroneous Claim
   - Verified Correct Baseline
   - Root Cause & Remediation
4. Update the corresponding summary bullet in `GEMINI.md` under Section 4.
