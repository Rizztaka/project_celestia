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

## 5. Project Stack & Environment
- **Runtime / Framework**: React 19 + Vite + TypeScript (see `package.json`)
- **Styling**: Tailwind CSS v4
- **Tooling**: pnpm / Vitest
