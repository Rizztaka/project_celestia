# Universal Roster Portability & Constellation Engine Uplift Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full client-side **Universal Roster Portability** conforming to the **Genshin Open Object Description (GOOD)** format. Enables one-click JSON drag-and-drop import/export from popular scanners (Amenoma, Inventory Klee, Irminsul, Seelie, Genshin Optimizer), persists rich character profiles (Level 1–90, Constellations C0–C6, Talents, Equipped Weapons, and raw Artifact bags) in `localStorage`, and uplifts all core engines (Team Generator, Rotation Synthesizer, Abyss & Theater Solvers) to dynamically leverage constellation breakpoints and investment weighting.

**Tech Stack:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide React, Vitest.

---

## User Review Required

> [!IMPORTANT]
> **Backward Compatibility Guarantee:**
> The legacy `celestia_v2_owned_roster: string[]` key in `localStorage` and `ownedIds: string[]` props across components will remain 100% supported and automatically synchronized. Existing saved rosters, default starter rosters, and previous UI flows will not break.

> [!NOTE]
> **Client-Side Privacy & Storage:**
> No user JSON or UID data is ever uploaded to any server. File parsing is executed locally via browser `FileReader`. Raw artifact bags from GOOD files are persisted under `celestia_v2_raw_artifacts` for upcoming personal artifact stop-point rating and build optimizers.

---

## Open Questions

All primary architectural decisions were resolved during the `/grill-me` alignment session:
- **Data Scope:** Characters (Level, C0–C6, Talents) + Equipped Weapons + Raw Artifact backup in storage.
- **Engine Depth:** Full engine uplift for synergy scoring, rotation notes, and Theater/Abyss act prioritization.
- **Merge Strategy:** Smart Merge & Update by default (updates matched units without wiping unmentioned ones), with an optional "Overwrite All" checkbox.
- **Two-Way Portability:** Interactive in-app C0–C6 and weapon quick-selectors with a one-click "Export to GOOD JSON" button.

---

## Proposed Changes

### Data Layer & Types

#### [MODIFY] `src/types/genshin.ts`
- Extend `src/types/genshin.ts` with:
  - `EquippedWeapon`: `{ name: string; key: string; level: number; refinement: number; rarity?: number }`
  - `OwnedCharacterProfile`: `{ id: string; level: number; constellation: number; ascension?: number; talents?: { auto: number; skill: number; burst: number }; weapon?: EquippedWeapon }`
  - `GOODCharacter`: Schema definition matching GOOD standard
  - `GOODWeapon`: Schema definition matching GOOD standard
  - `GOODData`: Top-level GOOD JSON schema (`format: 'GOOD'`, `version: number`, `source: string`, `characters`, `weapons`, `artifacts`)
- Update `TeamRecommendation` and solver interfaces to accept optional `rosterProfiles?: Record<string, OwnedCharacterProfile>`.

---

### Services & Storage

#### [NEW] `src/services/good-parser.ts`
- **`parseGOODJSON(jsonString: string): { success: boolean; data?: GOODData; error?: string }`**:
  Validates format and version, safely handles malformed JSON and corrupted payloads.
- **`mapGOODToCelestiaProfiles(good: GOODData): { profiles: Record<string, OwnedCharacterProfile>; rawArtifacts: any[]; summary: { importedCharacters: number; importedWeapons: number; importedArtifacts: number } }`**:
  Maps GOOD PascalCase keys (`HuTao`, `KaedeharaKazuha`, `RaidenShogun`) to Celestia character IDs, attaches equipped weapons matching `weapon.location === character.key`, and converts refinement/ascension/talent numbers.
- **`mergeRosterProfiles(existing: Record<string, OwnedCharacterProfile>, incoming: Record<string, OwnedCharacterProfile>, overwriteAll: boolean): Record<string, OwnedCharacterProfile>`**:
  Smart-merge incoming profiles into existing profiles. If `overwriteAll` is false, retains any previously owned characters not present in the imported file.
- **`exportToGOODJSON(profiles: Record<string, OwnedCharacterProfile>, rawArtifacts?: any[]): string`**:
  Generates a valid, formatted `GOOD` JSON object containing `characters`, `weapons`, and preserved `artifacts`.

#### [MODIFY] `src/services/storage.ts`
- Add constants:
  - `PROFILES_KEY = 'celestia_v2_roster_profiles'`
  - `ARTIFACTS_KEY = 'celestia_v2_raw_artifacts'`
- Implement:
  - `getSavedProfiles(): Record<string, OwnedCharacterProfile>` (with automatic fallback generating default profiles from `DEFAULT_ROSTER` at C0 / Level 90)
  - `saveProfiles(profiles: Record<string, OwnedCharacterProfile>): void`
  - `getSavedArtifacts(): any[]`
  - `saveArtifacts(artifacts: any[]): void`

---

### Core Engines Uplift

#### [MODIFY] `src/engines/team-generator.ts`
- Accept optional `rosterProfiles?: Record<string, OwnedCharacterProfile>`.
- Add constellation synergy rules:
  - **Xiangling C4:** +4 synergy score in Vaporize / Melt / Overload teams, adds reason `"Xiangling C4: Pyronado duration increased by +40%"`.
  - **Bennett C1:** +3 synergy score, adds reason `"Bennett C1: Fantastic Voyage ATK buff has no HP threshold"`.
  - **Bennett C6:** Flags Pyro Infusion interaction on physical / non-override teams (Keqing, Ayaka, Eula), while granting +15% Pyro DMG to Pyro carries (Arlecchino, Hu Tao, Diluc).
  - **Faruzan C6:** +7 synergy score for Anemo carry teams (Xiao, Wanderer), adds reason `"Faruzan C6: Pressurized Collapse pressurized vortexes provide massive Anemo CRIT DMG & energy battery"`.
  - **Furina C2:** +6 synergy score in all Furina archetypes, adds reason `"Furina C2: Hyper-accelerated Fanfare ramping and HP overflow"`.
  - **Nahida C2:** +6 synergy score in Quicken/Bloom teams, adds reason `"Nahida C2: Critical Bloom/Hyperbloom & Quicken DEF shred"`.

#### [MODIFY] `src/engines/rotation-synthesizer.ts`
- Incorporate constellation-specific timing flags (e.g. Xiangling C4 extends Pyronado field duration; Bennett C6 notes Pyro infusion active).

#### [MODIFY] `src/engines/theater-solver.ts`
- Calculate an `investmentScore` for each character:
  - Base: Rarity (5★ = 50, 4★ = 40)
  - Level: `(level / 90) * 30`
  - Constellations: `constellation * (rarity === 4 ? 4 : 8)`
  - Weapon: Signature or 5★ weapon equipped adds +15
- In `solveImaginariumTheater`, sort draft picks and act assignments so that the highest-investment characters are preserved and allocated to the climax boss Acts (Acts 8, 9, 10) instead of being consumed early in Acts 1–3.

#### [MODIFY] `src/engines/abyss-solver.ts`
- Factor `investmentScore` into carry and sub-DPS scoring so a player's C6 Level 90 DPS is prioritized over an unbuilt C0 character.

---

### UI Components & Workflows

#### [NEW] `src/components/GoodImportExportModal.tsx`
- Dialog component with:
  - Drag-and-drop zone and file picker for `.json` files.
  - JSON text paste fallback area.
  - Live schema preview (shows detected format, character count, weapon count, artifact count).
  - "Smart Merge" vs "Overwrite Roster" toggle.
  - "Import Now" action with instant toast notification.
  - "Export Roster to JSON" button with direct browser file download (`celestia_roster_backup.json`).

#### [MODIFY] `src/components/RosterView.tsx`
- Add an "Import / Export GOOD" button in the top action banner next to "Reset Default" and "Clear All".
- Display constellation badge (`C0` – `C6`) on each character card in the grid with an elegant color-coded pill (e.g. `C6` in gleaming gold `#d4af37`, `C0` in muted zinc).
- Provide quick inline `<` `>` stepper buttons on hover or click to rapidly bump constellation between 0 and 6.

#### [MODIFY] `src/components/CharacterDetailModal.tsx`
- In the hero header and constellation section:
  - Add interactive Constellation selector (pills 0 through 6) to directly set ownership constellation.
  - Add Level slider or number stepper (1–90).
  - Display the currently equipped weapon with refinement (`R1`–`R5`) and level.

#### [MODIFY] `src/App.tsx`
- Lift state to manage `rosterProfiles: Record<string, OwnedCharacterProfile>`.
- Derive `ownedIds = Object.keys(rosterProfiles)` for seamless 100% backward compatibility.
- Pass `rosterProfiles` into `RosterView`, `TeamGeneratorView`, `EndgameView`, and detail modals.

---

## Verification Plan

### Automated Tests
1. **New Test Suite: `src/services/good-parser.test.ts`**
   - Parse standard GOOD JSON format (Amenoma / Inventory Klee format).
   - Validate character key normalization (e.g. `HuTao` → `HuTao`, `RaidenShogun` → `RaidenShogun`).
   - Test weapon attachment to characters based on `weapon.location`.
   - Test Smart Merge vs Overwrite behavior.
   - Test error handling for invalid/corrupt JSON.
   - Test round-trip export to GOOD JSON.
2. **Updated Engine Tests:**
   - Test `team-generator.ts` with Xiangling C4 and Faruzan C6 to verify synergy score uplift and reasons.
   - Test `theater-solver.ts` to verify high-investment (C6/L90) characters are allocated to late acts.
   - Run entire test suite: `npm run test` (must pass 100%).
3. **Build & Typecheck:**
   - Run: `npx tsc -b` (must pass with 0 errors).
   - Run: `npm run build` (must successfully bundle Vite production build).

### Manual Verification
1. **Import:**
   - Open Roster tab, click "Import / Export GOOD".
   - Upload sample GOOD JSON. Verify characters, constellations (e.g., C6 Bennett, C2 Furina), and weapons populate instantly.
2. **Interactive Tweak:**
   - Change a character's constellation in `RosterView` or `CharacterDetailModal` from C0 to C6.
   - Navigate to Team Generator; verify the team synergy score increases and the constellation reason is displayed.
3. **Export:**
   - Click "Export Roster to JSON"; verify a clean `.json` file downloads and can be re-imported seamlessly.
4. **Endgame Guidance:**
   - Run Imaginarium Theater solver and Abyss solver; verify high-constellation carries are assigned to Floor 12 and Acts 8–10.
