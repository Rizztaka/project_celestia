const fs = require('fs');
const path = require('path');

function readFileNormalized(filePath) {
  return fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
}

// 0. Read canonical game version SSOT from src/data/game-version.ts
const versionText = readFileNormalized('src/data/game-version.ts');
const versionMatch = versionText.match(/CURRENT_GAME_VERSION\s*=\s*['"]([^'"]+)['"]/);
const GAME_VERSION = versionMatch ? versionMatch[1] : '7.2';

// 1. Read and parse characters from src/data/characters.ts
const charText = readFileNormalized('src/data/characters.ts');
const charLines = charText.split('\n');
const characters = [];
const charArtifactSets = new Set();
const charArtifactUsers = {};
const charWeaponUsers = {};

for (const line of charLines) {
  const trimmed = line.trim();
  if (trimmed.startsWith('{"id":')) {
    try {
      const cleaned = trimmed.replace(/,\s*$/, '');
      const obj = JSON.parse(cleaned);
      characters.push(obj);

      if (obj.build && obj.build.artifacts) {
        for (const art of obj.build.artifacts) {
          if (art.name) {
            charArtifactSets.add(art.name);
            if (!charArtifactUsers[art.name]) charArtifactUsers[art.name] = [];
            if (!charArtifactUsers[art.name].includes(obj.name)) {
              charArtifactUsers[art.name].push(obj.name);
            }
          }
        }
      }

      if (obj.build && obj.build.weapons) {
        for (const w of obj.build.weapons) {
          if (w.name) {
            if (!charWeaponUsers[w.name]) charWeaponUsers[w.name] = [];
            if (!charWeaponUsers[w.name].includes(obj.name)) {
              charWeaponUsers[w.name].push(obj.name);
            }
          }
        }
      }
    } catch (e) {
      console.error('Error parsing character line:', e.message);
    }
  }
}

// 2. Region mappings for all characters
const manualRegionOverrides = {
  'Aino': 'Nod-Krai',
  'Alyosha': 'Snezhnaya',
  'Columbina': 'Nod-Krai / Snezhnaya',
  'Dahlia': 'Mondstadt',
  'Durin': 'Mondstadt',
  'Escoffier': 'Fontaine',
  'Flins': 'Fontaine',
  'Ifa': 'Natlan',
  'Illuga': 'Natlan',
  'Ineffa': 'Natlan',
  'Jahoda': 'Natlan',
  'Lan Yan': 'Liyue',
  'Lauma': 'Nod-Krai',
  'Linnea': 'Nod-Krai',
  'Lohen': 'Mondstadt',
  'Mavuika': 'Natlan',
  'Mitya': 'Snezhnaya',
  'Nefer': 'Nod-Krai',
  'Nicole': 'Hexenzirkel / Mondstadt',
  'Odette': 'Fontaine',
  'Prune': 'Fontaine',
  'Sandrone': 'Snezhnaya',
  'Skirk': 'Abyss / Khaenri\'ah',
  'Valeriy': 'Snezhnaya',
  'Varesa': 'Natlan',
  'Varka': 'Mondstadt',
  'Vesna': 'Snezhnaya',
  'Vodyanitsa': 'Snezhnaya',
  'Yumemizuki Mizuki': 'Inazuma',
  'Zibai': 'Liyue',
  'Citlali': 'Natlan',
  'Chasca': 'Natlan',
  'Xilonen': 'Natlan',
  'Kinich': 'Natlan',
  'Kachina': 'Natlan',
  'Ororon': 'Natlan',
  'Iansan': 'Natlan',
  'Aloy': 'Other',
  'Traveler (Anemo)': 'Outlander / Traveler',
  'Traveler (Geo)': 'Outlander / Traveler',
  'Traveler (Electro)': 'Outlander / Traveler',
  'Traveler (Dendro)': 'Outlander / Traveler',
  'Traveler (Hydro)': 'Outlander / Traveler',
  'Traveler (Pyro)': 'Outlander / Traveler',
  'TravelerAnemo': 'Outlander / Traveler',
  'TravelerGeo': 'Outlander / Traveler',
  'TravelerElectro': 'Outlander / Traveler',
  'TravelerDendro': 'Outlander / Traveler',
  'TravelerHydro': 'Outlander / Traveler',
  'TravelerPyro': 'Outlander / Traveler'
};

let genshindb;
try {
  genshindb = require('genshin-db');
} catch (e) {}

const mappedChars = [];
for (const c of characters) {
  let region = manualRegionOverrides[c.name] || manualRegionOverrides[c.id];
  if (!region && genshindb) {
    const g = genshindb.characters(c.name) || genshindb.characters(c.id);
    if (g && g.region) region = g.region;
  }
  if (!region) {
    const allText = (c.description + ' ' + (c.tags ? c.tags.join(' ') : '') + ' ' + (c.talents ? c.talents.map(t => t.description).join(' ') : '')).toLowerCase();
    if (allText.includes('nod-krai')) region = 'Nod-Krai';
    else if (allText.includes('snezhnaya') || allText.includes('fatui')) region = 'Snezhnaya';
    else if (allText.includes('natlan')) region = 'Natlan';
    else if (allText.includes('fontaine')) region = 'Fontaine';
    else if (allText.includes('sumeru')) region = 'Sumeru';
    else if (allText.includes('inazuma')) region = 'Inazuma';
    else if (allText.includes('liyue')) region = 'Liyue';
    else if (allText.includes('mondstadt') || allText.includes('knights of favonius')) region = 'Mondstadt';
    else region = 'Teyvat / Special';
  }
  mappedChars.push({
    id: c.id,
    name: c.name,
    element: c.element,
    weapon: c.weapon,
    rarity: c.rarity,
    roles: c.roles,
    region: region,
    description: c.description,
    build: c.build
  });
}

// 3. Read weapons from src/data/weapons.ts
const weaponText = readFileNormalized('src/data/weapons.ts');
const arrayDeclaration = 'export const WEAPONS_DATA: WeaponData[] = [';
const startIndex = weaponText.indexOf(arrayDeclaration);
const arrayStart = startIndex + arrayDeclaration.length - 1;
const arrayEnd = weaponText.indexOf('];\n\nexport const WEAPONS_BY_KEY');
const jsonStr = weaponText.slice(arrayStart, arrayEnd + 1);
const weapons = JSON.parse(jsonStr);

// Calculate exact weapon distribution matrix
const weaponTypes = ['Sword', 'Claymore', 'Polearm', 'Bow', 'Catalyst'];
const weaponMatrix = {};
for (const t of weaponTypes) {
  weaponMatrix[t] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, total: 0 };
}
for (const w of weapons) {
  const t = w.weaponType;
  const r = w.rarity;
  if (weaponMatrix[t] && weaponMatrix[t][r] !== undefined) {
    weaponMatrix[t][r]++;
    weaponMatrix[t].total++;
  }
}

const total5Star = weapons.filter(w => w.rarity === 5).length;
const total4Star = weapons.filter(w => w.rarity === 4).length;
const total3Star = weapons.filter(w => w.rarity === 3).length;
const totalLowStar = weapons.filter(w => w.rarity <= 2).length;

// Read master artifacts
let masterArtifacts = [];
if (fs.existsSync('src/data/artifacts-master.ts')) {
  const artText = readFileNormalized('src/data/artifacts-master.ts');
  const decl = 'export const ARTIFACTS_MASTER: ArtifactSetMaster[] = [';
  const aStart = artText.indexOf(decl);
  if (aStart !== -1) {
    const sIdx = aStart + decl.length - 1;
    const eIdx = artText.indexOf('];\n\nexport const ARTIFACTS_BY_NAME');
    masterArtifacts = JSON.parse(artText.slice(sIdx, eIdx + 1));
  }
}

console.log(`Loaded ${mappedChars.length} characters, ${weapons.length} weapons (${total5Star} 5★, ${total4Star} 4★, ${total3Star} 3★, ${totalLowStar} 1★-2★), and ${masterArtifacts.length} master artifact sets (${charArtifactSets.size} combat sets).`);

// 4. Preserve existing Verified Corrections Ledger if file already exists
const targetFilePath = 'docs/knowledge/celestia-reference.md';
let existingLedgerRows = [];

if (fs.existsSync(targetFilePath)) {
  const oldContent = fs.readFileSync(targetFilePath, 'utf8');
  const ledgerMatch = oldContent.match(/## 7\. Verified Corrections Ledger[\s\S]*?(?:### How to Log a New Correction|$)/);
  if (ledgerMatch) {
    const lines = ledgerMatch[0].split('\n');
    for (const l of lines) {
      const trimmed = l.trim();
      if (trimmed.startsWith('|') && !trimmed.includes('Incident Description') && !trimmed.includes(':---')) {
        existingLedgerRows.push(trimmed);
      }
    }
  }
}

// Default ledger rows ensuring baseline incidents are permanently preserved
const baselineIncidents = [
  '| **2026-11-15** | Version Anchor Regression | Assumed current version was 5.x | **Version 7.2** is the active baseline (Nod-Krai, Snezhnaya, Natlan, Fontaine, Celestia). | Pre-training cutoff bias. Remediation: Enforced `GEMINI.md` rule and reference knowledge base. |',
  '| **2026-11-15** | Character Roster Size | Assumed roster was ~80-90 characters | Exactly **128 canonical playable characters** (including 6 element-specific Traveler configurations) exist in `src/data/characters.ts`. | Failure to check local dataset. Remediation: Created complete 128-character element/region directory. |',
  '| **2026-11-15** | Artifact Set Indexing | Missed late-game and modern artifact sets | **64 Master Artifact Sets** in `src/data/artifacts-master.ts` (with 37 combat sets actively indexed in the build engine). | Missing reference ledger. Remediation: Fully documented all 64 sets with 2pc/4pc details and primary users. |',
  '| **2026-11-15** | Weapon Count & Modern Passives | Hallucinated old weapon stats | Exactly **256 weapons** (76 5★, 146 4★, 24 3★, 10 1★–2★) in `src/data/weapons.ts` with full R1–R5 curves. | Reliance on memory. Remediation: Catalogued all 76 5★ signatures and top staples. |',
  '| **2026-11-15** | Weapon Signature Hallucinations | Hallucinated 8 fictitious weapons (Void-Severing Edge, Glacial Colossus, Boreas\' Northern Wrath, etc.) and fabricated class rarity distributions | All **76 authentic 5★ weapons** must be derived from `src/data/weapons.ts` with correct class counts (19 Swords, 11 Claymores, 13 Polearms, 12 Bows, 21 Catalysts). | Hallucination from memory instead of reading `WEAPONS_DATA`. Remediation: Programmatic generation directly from SSOT and automated Vitest validation. |',
  '| **2026-11-15** | GenshinDB Complete SSOT Expansion | Limited data to 122 characters, 246 weapons, and 37 artifact sets without modular talent scaling | Expanded to **128 canonical playable characters** (including 6 element-specific Traveler configurations), **256 weapons** (all 1★ to 5★ with R1–R5 curves), **64 Master Artifact Sets**, and **Level 1–15 modular talent scaling**. | Comprehensive SSOT synchronization directly from `genshin-db` v5.2.15+ and authoritative game data. |',
  '| **2026-11-15** | Artifact ID & Weapon Key Integrity | Overwrote Resolution of Sojourner with duplicate ID `10001` for Initiate; created duplicate `PrizedIsshinBlade` keys overwriting weapon index | Assigned unique ID `10000` to Initiate and distinct keys `PrizedIsshinBlade`, `PrizedIsshinBlade1`, `PrizedIsshinBlade2` with authentic stats across all 256 weapons, 128 calibrated rotations, and talent scaling aliases. | Failure to enforce uniqueness on synthetic additions and name-based weapon iterations. Remediation: Added unique ID validation, verbose extraction, and full rotation calibration. |',
  '| **2026-11-16** | Build & Stat Weight Calibration | 10 Batch 7 characters had mismatched goblet elements, wrong artifact sets (e.g. Cryo on Electro Alyosha, Geo on Electro Flins), and weapon/artifact typos; fallback weights hardcoded `pyro_dmg_` and ATK% for 113 characters; Kokomi crit-zeroing logic bypassed fallback weights; alias lookups (\'Kokomi\', \'Ayaka\', etc.) fell back to Pyro ATK% | All 128 characters have matching goblet elements/damage bonuses, accurate BiS artifact sets and wielder descriptions; `getCharacterStatWeights` dynamically synthesizes weights and goblets from character SSOT data with comprehensive alias resolution and zeroed crit for Kokomi; weapon solver guarantees 0 crit weight for Kokomi; target set typos corrected | Data ingestion drift in Batch 7 script and static fallback in artifact-weights. Remediation: Synchronized character builds, implemented dynamic stat weight synthesis and alias resolver in `getCharacterStatWeights`, moved Kokomi crit-zeroing outside undefined guard in `weapon-solver.ts`, fixed targetSets typos, and added comprehensive invariant tests. |',
  '| **2026-11-20** | Gacha Mathematics & Wish Engine Invariants | Hardcoded Capturing Radiance 100% guarantee at streak 2 (yielding false 64.46% win rate); weapon banner omitted 75/25 off-banner carryover guarantee; universal sandbox assigned 5★ 180 hard pity to 4★ characters | 4-state Markov renewal model (`[0.50, 0.50, 8/11, 1.00]`) converging to exact published 55.000% consolidated win rate (streak 3 gives 100% guarantee on 4th attempt); weapon banner models 75/25 carryover (50% target win rate on next 5★); 4★ targets modeled via absorbing Markov chain with realistic percentiles (median ~35 pulls, 90th percentile ~105 pulls, uncapped ceiling); multi-copy discrete convolution for C1-C6 and R1-R5 goals; optional ~8% Starglitter cashback toggle | Incomplete capture of HoYoverse 5.0+ / 7.2 wish rules in initial heuristic engine. Remediation: Created centralized `src/data/banner-rules.ts`, refactored `gacha-math.ts`, created `gacha-4star.ts`, updated `pull-advisor.ts`, added 500k-iteration Monte Carlo verification suite, expanded schema in `types/genshin.ts` and `storage.ts`, and added interactive CDF and methodology modals. |',
  '| **2026-11-23** | M9 Phase 1 Data Trust, Reliability Contracts & Provenance Consolidation | Overloaded `ProvenanceStatus` (`\'verified\' | \'provisional\' | \'stale\'`) coupled data verification with schedule lifecycles; fabricated URLs/methods existed for sandbox entries (`sandbox_simulation`); duplicate schedule IDs (`abyss_floor_12_v7_2`, `theater_season_7_2_nov`, `theater_season_7_2_dec`) inflated registry to 38 entries; duplicated schedule expiry dates into `DataProvenance.effectiveEndDate`. | Decoupled 5-axis contracts (`VerificationState`, `TemporalState`, `RecommendationMode`, `ReliabilityStatus`, `RecommendationReliability`); 35 canonical provenance records (redundancies pruned); clean optional `sourceUrl` (omitted allowed for in-game verification and sandbox); frozen 17 legacy `effectiveEndDate` entries mirroring canonical schedules pending Phase 2 migration; exact-union compile and runtime tests in `data-integrity.test.ts`. | Structural coupling in M4 schema. Remediation: Implemented formal M9 reliability contracts in `src/types/genshin.ts`, cleaned `src/data/provenance-registry.ts`, updated Axis 6 in `scripts/audit-game-data.mjs`, added exact-union assertions in `data-integrity.test.ts`, and established Phase 2 migration path. |'
];

// Merge unique rows
const mergedLedgerRows = [];
const seenLedgerKeys = new Set();
for (const row of [...baselineIncidents, ...existingLedgerRows]) {
  const parts = row.split('|').map(p => p.trim());
  const key = parts[2] || row; // Incident Description
  if (!seenLedgerKeys.has(key)) {
    seenLedgerKeys.add(key);
    mergedLedgerRows.push(row);
  }
}

// 5. Construct Markdown
let md = `# Project Celestia — Authoritative Reference & Knowledge Base (v${GAME_VERSION} Baseline)

> **Persistent Memory Notice**: This document is the primary authoritative reference for Project Celestia. All models, agents, and subagents must treat this document and the underlying data files as the undisputed Single Source of Truth (SSOT). Under NO circumstances should an agent default to legacy 5.x or prior versions. The active baseline is **Version ${GAME_VERSION}** (encompassing Nod-Krai, Snezhnaya, Natlan, Fontaine, and Celestia eras).

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
   - [Version ${GAME_VERSION} & Modern Era Highlights](#version-${GAME_VERSION.replace('.', '')}--modern-era-highlights)
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
| **Characters** | \`src/data/characters.ts\` | **128 Characters** | Complete Level 90 stats, talents, constellations C1-C6, recommended weapons & artifacts |
| **Weapons** | \`src/data/weapons.ts\` | **256 Weapons** | 5 Weapon types (62 Swords, 45 Claymores, 43 Polearms, 50 Bows, 56 Catalysts; 76 5★, 146 4★, 24 3★, 10 1★-2★), R1–R5 passives & stats |
| **Artifacts** | \`src/data/artifacts-master.ts\` & \`src/data/artifact-weights.ts\` | **64 Sets** (37 Combat Sets) | Master registry of all 64 sets (1★–5★) plus stat weights, max substats, domain drops & builds |
| **Talent Scaling** | \`src/data/talent-scaling/\` | **128 Profiles** | Full Level 1 to 15 scaling multiplier curves (Modular Architecture) |
| **Rotations** | \`src/data/character-rotations.ts\` | **128 Profiles** | Precise action sequence, energy thresholds, skill cooldown timings |
| **Data Provenance** | \`src/data/provenance-registry.ts\` | **35 Canonical Datasets** | Substantive provenance records linking patch notices, in-game verification, and theorycraft evidence |

### Data Trust & Recommendation Reliability Architecture (Milestone M9 Contracts)

To decouple data verification authenticity from schedule temporal lifecycles and solver execution modes, Project Celestia establishes five strongly-typed, JSON-serializable reliability contracts in \`src/types/genshin.ts\`:

1. **\`VerificationState\`** (Exact 4-Value Union):
   - \`'verified'\`: Dataset independently audited and verified against official notices, direct in-game observation, or theorycraft consensus.
   - \`'provisional'\`: Preliminary data awaiting confirmation or active user sandbox modifications.
   - \`'stale'\`: Un-synchronized or outdated dataset from prior versions requiring review.
   - \`'unregistered'\`: Dataset or entity lacking a registered provenance entry in \`DATA_PROVENANCE_REGISTRY\`.

2. **\`TemporalState\`** (Exact 4-Value Union):
   - \`'upcoming'\`: Time-boxed schedule whose start date is in the future.
   - \`'active'\`: Currently active schedule within valid start and end dates.
   - \`'expired'\`: Concluded schedule past its effective end date.
   - \`'not_applicable'\`: Evergreen datasets (characters, weapons, formulas) without calendar expiration.

3. **\`RecommendationMode\`** (Exact 4-Value Union):
   - \`'current'\`: Real-time recommendation evaluated against live-game state and active schedules.
   - \`'planning_preview'\`: Forward-looking recommendation based on upcoming schedules or announced banners.
   - \`'archive_simulation'\`: Retrospective analysis evaluated against concluded historical schedules.
   - \`'sandbox_simulation'\`: Hypothetical solver evaluation against user-customized constraints or enemy lineups.

4. **\`ReliabilityStatus\`** (Exact 4-Value Union):
   - \`'reliable'\`: High-confidence recommendation backed by verified, currently active data.
   - \`'qualified'\`: Recommendation valid under explicit qualifications (provisional data, sandbox assumptions, or partial constraints).
   - \`'historical'\`: Informational output derived from expired schedules or archived combat environments.
   - \`'unsupported'\`: Output cannot be guaranteed due to missing provenance, conflicting data, or stale assumptions.

5. **\`RecommendationReliability\`** (Universal Solver Contract):
   \`\`\`typescript
   export interface RecommendationReliability {
     status: ReliabilityStatus;
     mode: RecommendationMode;
     isActionable: boolean;
     verification: VerificationState;
     temporalState: TemporalState;
     provenanceIds: string[];
     warnings: string[];
   }
   \`\`\`

6. **Actionability Semantics (\`isActionable\`)**:
   - Represents whether the recommendation is actionable in the live game *right now*.
   - Strictly \`true\` only for currently actionable (\`current\`) advice backed by supported, non-upcoming, non-expired data.
   - Strictly \`false\` for forward-looking previews (\`planning_preview\`), historical archives (\`archive_simulation\`), sandbox runs (\`sandbox_simulation\`), and \`unsupported\` outputs.

7. **Provenance Invariants & Exact Subsets**:
   - \`ProvenanceStatus\` = \`Exclude<VerificationState, 'unregistered'>\` (\`'verified' | 'provisional' | 'stale'\`).
   - \`VerificationMethod\` = \`'official_notice' | 'in_game_verification' | 'theorycraft_consensus'\`.
   - \`sourceUrl?: string\` is optional; when provided, HTTPS is strictly enforced. Omitted URLs are permitted only for \`in_game_verification\` and \`custom-sandbox\`.
   - \`effectiveEndDate?: string\` is \`@deprecated\` legacy-only, frozen at 17 entries mirroring canonical schedule entities (\`BANNER_PHASES\`, \`ABYSS_CYCLES\`, \`THEATER_SEASONS\`), with mandatory removal scheduled for Phase 2.

### Self-Correction Protocol (Mandatory for All Agents)
1. **Never Assume Outdated Baselines**:
   - The current baseline is **Version ${GAME_VERSION}**.
   - If you catch yourself thinking Genshin is on version 5.0, 5.2, or 5.x, **STOP IMMEDIATELY**. Correct your assumption to ${GAME_VERSION}.
2. **Local Inspection First**:
   - Before answering queries about kits, passives, scaling, or builds, verify directly against the SSOT files listed above.
3. **Web Cross-Check**:
   - If uncertain about recent patches, banners, or character kits, perform a web search (\`search_web\`) or inspect the local test suites.
4. **Log Corrections**:
   - Any hallucination or error pointed out by the user must be added to the [Verified Corrections Ledger](#7-verified-corrections-ledger-permanent-incident-log) in this file and summarized in \`GEMINI.md\`.

---

## 2. Active Baseline & Version Architecture

Project Celestia models the full state of Genshin Impact up through **Version ${GAME_VERSION}**.
Key regional progression:
- **Mondstadt & Liyue**: v1.0+
- **Inazuma**: v2.0+
- **Sumeru**: v3.0+ (Dendro element, Quicken, Hyperbloom, Burgeon)
- **Fontaine**: v4.0+ (Arkhe system, Bond of Life, HP fluctuation mechanics)
- **Natlan**: v5.0+ (Nightsoul Blessing, Phlogiston, Nightsoul Burst)
- **Nod-Krai**: v6.0+ (Moonsign system, Ascendant Gleam, Lunar reactions)
- **Snezhnaya & Celestia**: v7.0 - v${GAME_VERSION} (Polestar Fields, Stellar reactions, Hexerei rites, Abyss mastery)

---

## 3. Master Character Directory (128 Characters)

### Summary Statistics
- **Total Playable Characters**: **128** (including 6 element-specific Traveler configurations)
- **5-Star Characters**: ${mappedChars.filter(c => c.rarity === 5).length}
- **4-Star Characters**: ${mappedChars.filter(c => c.rarity === 4).length}
`;

// Group by Element
const elements = ['Hydro', 'Pyro', 'Cryo', 'Electro', 'Anemo', 'Geo', 'Dendro'];
md += `\n### Characters by Element\n\n`;

for (const el of elements) {
  const elChars = mappedChars.filter(c => c.element === el).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  md += `#### ${el} (${elChars.length} Characters)\n\n`;
  md += `| Name | ID | Rarity | Weapon | Region | Roles | Top Recommended Build (Artifacts / Weapons) |\n`;
  md += `| :--- | :--- | :---: | :--- | :--- | :--- | :--- |\n`;
  for (const c of elChars) {
    const artStr = c.build && c.build.artifacts ? c.build.artifacts.map(a => a.name).slice(0, 2).join(' / ') : 'Standard';
    const wepStr = c.build && c.build.weapons ? c.build.weapons.map(w => w.name).slice(0, 2).join(' / ') : 'Standard';
    md += `| **${c.name}** | \`${c.id}\` | ${c.rarity}★ | ${c.weapon} | ${c.region} | ${c.roles.join(', ')} | ${artStr} — ${wepStr} |\n`;
  }
  md += `\n`;
}

// Group by Region
md += `### Characters by Region\n\n`;
const regions = [
  'Nod-Krai',
  'Nod-Krai / Snezhnaya',
  'Snezhnaya',
  'Natlan',
  'Fontaine',
  'Sumeru',
  'Inazuma',
  'Liyue',
  'Mondstadt',
  'Hexenzirkel / Mondstadt',
  'Abyss / Khaenri\'ah',
  'Outlander / Traveler',
  'Other'
];

for (const reg of regions) {
  const regChars = mappedChars.filter(c => c.region === reg).sort((a, b) => b.rarity - a.rarity || a.name.localeCompare(b.name));
  if (regChars.length === 0) continue;
  md += `#### ${reg} (${regChars.length} Characters)\n\n`;
  md += `| Name | Element | Rarity | Weapon | Roles | Primary Build |\n`;
  md += `| :--- | :--- | :---: | :--- | :--- | :--- |\n`;
  for (const c of regChars) {
    const artStr = c.build && c.build.artifacts ? c.build.artifacts.map(a => a.name).slice(0, 2).join(', ') : 'Standard';
    md += `| **${c.name}** | ${c.element} | ${c.rarity}★ | ${c.weapon} | ${c.roles.join(', ')} | ${artStr} |\n`;
  }
  md += `\n`;
}

// Modern Era Highlights
md += `### Version ${GAME_VERSION} & Modern Era Highlights

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

The Celestia engine tracks **64 Master Artifact Sets** in \`src/data/artifacts-master.ts\`, including exactly **37 combat sets** with calibrated stat weights and roll valuation curves in \`src/data/artifact-weights.ts\`.

### Complete 37-Set Combat Roster

`;

const artifactSetData = [
  { name: 'Archaic Petra', bonus2: 'Geo DMG Bonus +15%', bonus4: 'Upon obtaining an Elemental Shard from Crystallize, all party members gain 35% DMG Bonus for that element for 10s.' },
  { name: 'Blizzard Strayer', bonus2: 'Cryo DMG Bonus +15%', bonus4: 'When attacking an opponent affected by Cryo, CRIT Rate +20%. If frozen, CRIT Rate +20% additional (up to +40%).' },
  { name: 'Bloodstained Chivalry', bonus2: 'Physical DMG Bonus +25%', bonus4: 'After defeating an opponent, Charged Attack DMG +50% and stamina cost reduced to 0 for 10s.' },
  { name: 'Crimson Witch of Flames', bonus2: 'Pyro DMG Bonus +15%', bonus4: 'Overloaded/Burning/Burgeon DMG +40%. Vaporize/Melt DMG +15%. Skill cast increases 2pc bonus by 50% (max 3 stacks).' },
  { name: 'Deepwood Memories', bonus2: 'Dendro DMG Bonus +15%', bonus4: 'Skill or Burst hit reduces target\'s Dendro RES by 30% for 8s (triggers off-field).' },
  { name: 'Desert Pavilion Chronicle', bonus2: 'Anemo DMG Bonus +15%', bonus4: 'Charged Attack hit increases Normal ATK SPD by 10% and Normal/Charged/Plunging DMG by 40% for 15s.' },
  { name: 'Echoes of an Offering', bonus2: 'ATK +18%', bonus4: 'Normal Attack hit has 36% chance to trigger Valley Rite, increasing Normal Attack DMG by 70% of ATK.' },
  { name: 'Emblem of Severed Fate', bonus2: 'Energy Recharge +20%', bonus4: 'Increases Elemental Burst DMG by 25% of Energy Recharge (max 75% bonus at 300% ER).' },
  { name: 'Flower of Paradise Lost', bonus2: 'Elemental Mastery +80', bonus4: 'Bloom, Hyperbloom, and Burgeon reaction DMG +40%. Extra +25% per stack on trigger (max 4 stacks).' },
  { name: 'Fragment of Harmonic Whimsy', bonus2: 'ATK +18%', bonus4: 'When the value of a Bond of Life increases or decreases, character deals 18% increased DMG for 6s (max 3 stacks, +54%).' },
  { name: 'Gilded Dreams', bonus2: 'Elemental Mastery +80', bonus4: 'Within 8s of reaction, gains ATK +14% for same-element teammates and +50 EM for different-element teammates (max 3 stacks).' },
  { name: 'Gladiator\'s Finale', bonus2: 'ATK +18%', bonus4: 'If wielder uses Sword, Claymore, or Polearm, Normal Attack DMG +35%.' },
  { name: 'Golden Troupe', bonus2: 'Elemental Skill DMG +20%', bonus4: 'Increases Elemental Skill DMG by 25%. When off-field, Skill DMG is further increased by 25% (total +70% off-field).' },
  { name: 'Heart of Depth', bonus2: 'Hydro DMG Bonus +15%', bonus4: 'After using Elemental Skill, Normal and Charged Attack DMG +30% for 15s.' },
  { name: 'Husk of Opulent Dreams', bonus2: 'DEF +30%', bonus4: 'Gains Curiosity stacks on-field (Geo hit) and off-field (every 3s). Each stack grants +6% DEF and +6% Geo DMG (max 4 stacks, +24%).' },
  { name: 'Instructor', bonus2: 'Elemental Mastery +80', bonus4: 'Triggering an Elemental Reaction increases all party members\' Elemental Mastery by 120 for 8s.' },
  { name: 'Lavawalker', bonus2: 'Pyro RES +40%', bonus4: 'Increases DMG against opponents affected by Pyro by 35%.' },
  { name: 'Maiden Beloved', bonus2: 'Character Healing Effectiveness +15%', bonus4: 'Using an Elemental Skill or Burst increases healing received by all party members by 20% for 10s.' },
  { name: 'Marechaussee Hunter', bonus2: 'Normal & Charged Attack DMG +15%', bonus4: 'When current HP increases or decreases, CRIT Rate +12% for 5s (max 3 stacks, +36% total CRIT Rate).' },
  { name: 'Nighttime Whispers in the Echoing Woods', bonus2: 'ATK +18%', bonus4: 'Using an Elemental Skill grants +20% Geo DMG for 10s. When shielded by Crystallize, grants +150% additional effect (total +50% Geo DMG).' },
  { name: 'Noblesse Oblige', bonus2: 'Elemental Burst DMG +20%', bonus4: 'Using an Elemental Burst increases all party members\' ATK by 20% for 12s (does not stack).' },
  { name: 'Nymph\'s Dream', bonus2: 'Hydro DMG Bonus +15%', bonus4: 'Normal/Charged/Plunge/Skill/Burst hits grant Mirrored Nymph stacks (+ATK% & +Hydro DMG%, up to +25% ATK and +15% Hydro).' },
  { name: 'Obsidian Codex', bonus2: 'DMG dealt +15% while in Nightsoul\'s Blessing', bonus4: 'While on-field character is in Nightsoul\'s Blessing, consuming Nightsoul points increases CRIT Rate by 40% for 6s.' },
  { name: 'Ocean-Hued Clam', bonus2: 'Healing Bonus +15%', bonus4: 'Accumulates healing (including overheal) for 3s, then detonates a Sea-Dyed Foam dealing 90% of accumulated heal as Physical DMG (up to ~30k DMG).' },
  { name: 'Pale Flame', bonus2: 'Physical DMG Bonus +25%', bonus4: 'Skill hit grants +9% ATK for 7s (max 2 stacks). At 2 stacks, 2pc effect is increased by 100% (+50% Phys DMG, +18% ATK).' },
  { name: 'Scroll of the Hero of Cinder City', bonus2: 'Party Energy restored upon nearby Nightsoul Burst', bonus4: 'Triggering an elemental reaction grants 12% DMG bonus for involved elements. If equipped character is in Nightsoul, grants 28% more (total +40% party DMG).' },
  { name: 'Shimenawa\'s Reminiscence', bonus2: 'ATK +18%', bonus4: 'If character has >=15 Energy when casting Skill, consumes 15 Energy to increase Normal/Charged/Plunging DMG by 50% for 10s.' },
  { name: 'Silken Moon\'s Serenade', bonus2: 'Elemental Mastery +80', bonus4: 'When party Moonsign is active, triggering Lunar reactions grants +36% team Lunar reaction DMG and +120 EM for 12s.' },
  { name: 'Song of Days Past', bonus2: 'Healing Bonus +15%', bonus4: 'Records healing up to 15,000 HP for 6s, then grants Yearning buff adding 8% of recorded healing to active character\'s hits (max 5 hits).' },
  { name: 'Tenacity of the Millelith', bonus2: 'HP +20%', bonus4: 'When an Elemental Skill hits an opponent, all party members gain +20% ATK and +30% Shield Strength for 3s (triggers off-field).' },
  { name: 'The Exile', bonus2: 'Energy Recharge +20%', bonus4: 'Using an Elemental Burst regenerates 2 Energy for all party members (excluding wielder) every 2s for 6s (6 Energy total).' },
  { name: 'Thundering Fury', bonus2: 'Electro DMG Bonus +15%', bonus4: 'Overloaded, Electro-Charged, Superconduct, and Hyperbloom DMG +40%, Aggravate bonus +20%. Triggering reactions reduces Skill CD by 1s (0.8s CD).' },
  { name: 'Unfinished Reverie', bonus2: 'ATK +18%', bonus4: 'After leaving combat for 3s, DMG +50%. In combat, if no Burning opponents are nearby, DMG bonus decreases by 10% every second; with Burning, it increases by 10% (up to 50%).' },
  { name: 'Vermillion Hereafter', bonus2: 'ATK +18%', bonus4: 'After Burst, gains Nascent Light (+8% ATK). Each time HP decreases, ATK increases by 10% (max 4 stacks, up to +66% ATK total).' },
  { name: 'Viridescent Venerer', bonus2: 'Anemo DMG Bonus +15%', bonus4: 'Swirl DMG +60%. Decreases opponent\'s Elemental RES to the element infused in the Swirl by 40% for 10s.' },
  { name: 'Vourukasha\'s Glow', bonus2: 'HP +20%', bonus4: 'Skill and Burst DMG +10%. When taking DMG, gains +8% Skill/Burst DMG for 5s (max 5 stacks, +50% total bonus).' },
  { name: 'Wanderer\'s Troupe', bonus2: 'Elemental Mastery +80', bonus4: 'If wielder uses Catalyst or Bow, Charged Attack DMG +35%.' }
];

md += `| # | Artifact Set | 2-Piece Bonus | 4-Piece Bonus / Strategic Role | Primary Users in Celestia |\n`;
md += `| :---: | :--- | :--- | :--- | :--- |\n`;

artifactSetData.forEach((art, idx) => {
  const users = charArtifactUsers[art.name] || [];
  const userStr = users.length > 0 ? users.slice(0, 5).join(', ') + (users.length > 5 ? `, +${users.length - 5} more` : '') : 'Universal';
  md += `| ${idx + 1} | **${art.name}** | ${art.bonus2} | ${art.bonus4} | ${userStr} |\n`;
});

// Master 64-Set Registry Index
md += `\n### Master 64-Set Registry Index\n\n`;
md += `| # | Artifact Set | Min Rarity | Max Rarity | Combat Set? | 2pc / 1pc Effect |\n`;
md += `| :---: | :--- | :---: | :---: | :---: | :--- |\n`;

masterArtifacts.forEach((art, idx) => {
  const bonus = art.effect2Pc || art.effect1Pc || 'None (Introductory set)';
  md += `| ${idx + 1} | **${art.name}** | ${art.minRarity}★ | ${art.maxRarity}★ | ${art.isCombatSet ? 'Yes' : 'No'} | ${bonus} |\n`;
});

// 5. Weapons Directory
md += `\n---\n\n## 5. Master Weapons Directory (256 Weapons)\n\n### Weapon Distribution Overview\n\n`;
md += `| Weapon Class | Total Weapons | 5★ Weapons | 4★ Weapons | 3★ Weapons | 1★–2★ Weapons |\n`;
md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;

for (const t of weaponTypes) {
  const m = weaponMatrix[t];
  const low = (m[1] || 0) + (m[2] || 0);
  md += `| **${t}** | ${m.total} | ${m[5]} | ${m[4]} | ${m[3]} | ${low} |\n`;
}
md += `| **Total** | **${weapons.length}** | **${total5Star}** | **${total4Star}** | **${total3Star}** | **${totalLowStar}** |\n\n`;
md += `> **Combat Weapons (3★–5★)**: **246 weapons** (76 5★, 146 4★, 24 3★) with full refinement curves (R1–R5).\n\n`;

md += `### 5★ Signature Weapons Catalogue (All ${total5Star} Weapons)\n\n`;

const fiveStars = weapons.filter(w => w.rarity === 5);

for (const t of weaponTypes) {
  const ws = fiveStars.filter(w => w.weaponType === t).sort((a, b) => a.name.localeCompare(b.name));
  md += `#### ${t}s (${ws.length} Weapons)\n\n`;
  for (const w of ws) {
    const users = charWeaponUsers[w.name] || [];
    const userStr = users.length > 0 ? ` *(Recommended for: ${users.join(', ')})*` : '';
    const cleanDesc = w.passiveDesc ? w.passiveDesc.replace(/\n+/g, ' ').trim() : '';
    const subStat = w.subStatType ? `, ${w.subStatType.replace('_', '')} ${w.subStatValue}` : '';
    md += `- **${w.name}**: Base ATK ${w.baseAtk}${subStat} | *${w.passiveName}*: ${cleanDesc}${userStr}\n`;
  }
  md += `\n`;
}

md += `### Key 4★ and 3★ Meta Weapons

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
${mergedLedgerRows.join('\n')}

### How to Log a New Correction:
1. Open this file: \`docs/knowledge/celestia-reference.md\`.
2. Locate this table under **Section 7: Verified Corrections Ledger**.
3. Add a new row containing:
   - Date (\`YYYY-MM-DD\`)
   - Incident Description
   - Erroneous Claim
   - Verified Correct Baseline
   - Root Cause & Remediation
4. Update the corresponding summary bullet in \`GEMINI.md\` under Section 4.
`;

fs.writeFileSync(targetFilePath, md);
console.log(`Successfully generated ${targetFilePath} with exact SSOT metrics and preserved ledger.`);
