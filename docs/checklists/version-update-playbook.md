# Project Celestia — Game Version Update Playbook (SOP)

This Standard Operating Procedure (SOP) defines the mandatory, repeatable process for updating Project Celestia when a new Genshin Impact patch releases (Version 7.3+ and beyond).

---

## Phase 1: Upstream Data Extraction & Canonical SSOT Registration

### 1.1 Character Registration (`src/data/characters.ts`)
- [ ] Add new character records with canonical identifiers (`id`, `name`, `element`, `weapon`, `rarity`).
- [ ] Fill Level 90 baseline stats: HP, ATK, DEF, specialized stat, and specialized value.
- [ ] Populate combat roles (`On-Field DPS`, `Off-Field DPS`, `Buffer/Shred`, `Sustain`).
- [ ] Record all active/passive talents and Constellations (C1 through C6).
- [ ] Curate recommended builds (Weapons with rankings, Artifact sets, Sands/Goblet/Circlet mainstats, substat priorities).
- [ ] Assign archetype affinity tags (e.g. `Polestar`, `Hexerei`, `Nightsoul`, `Vaporize`, `Lunar-Bloom`).

### 1.2 Weapons Registration (`src/data/weapons.ts`)
- [ ] Register new weapons with canonical PascalCase keys (e.g. `StarsealedEdict`).
- [ ] Record base ATK and substats across Level 1 to 90.
- [ ] Populate refinement descriptions and scaling parameters (R1 through R5).
- [ ] Add weapon aliases to `CANONICAL_WEAPON_MAP` in `src/data/weapons.ts` to ensure fuzzy-matching and GOOD format compatibility.
- [ ] Cross-check signature weapon mappings: ensure signature weapons point to authentic canonical records in `WEAPONS_DATA`.

### 1.3 Artifact Sets (`src/data/artifacts-master.ts` & `src/data/artifact-weights.ts`)
- [ ] If new artifact sets release, append them to `MASTER_ARTIFACT_SETS` (incrementing total from 64).
- [ ] Define 2-piece and 4-piece set bonuses.
- [ ] If combat-relevant, add stat weight profiles to `src/data/artifact-weights.ts` (curated roll valuations).

### 1.4 Modular Talent Scaling (`src/data/talent-scaling/`)
- [ ] Create a dedicated scaling file: `src/data/talent-scaling/<characterId>.ts`.
- [ ] Extract Level 1 through 15 parameter curves for Normal Attack, Elemental Skill, and Elemental Burst.
- [ ] Register the character's lowercase key into `src/data/talent-scaling/index.ts` and `AVAILABLE_SCALING_KEYS`.

### 1.5 Rotation Calibration (`src/data/character-rotations.ts`)
- [ ] Add or calibrate standard 20-second rotation sequence.
- [ ] Record field time, particle generation counts, energy generation, and skill cooldown models.

---

## Phase 2: Live Schedules & Rotations Synchronization

### 2.1 Event Banners (`src/data/banners.ts`)
- [ ] Add new banner phases for Phase 1 and Phase 2.
- [ ] Verify `startDate < endDate` using standard `YYYY-MM-DD` formatting.
- [ ] Link canonical 5★ character IDs, authentic signature weapon keys, and featured 4★ pools.
- [ ] Include HTTPS provenance `sourceUrl` and date-stamped `verifiedAt`.

### 2.2 Imaginarium Theater (`src/data/theater-seasons.ts`)
- [ ] Define the new season configuration: exact 3 element restrictions, effective date range.
- [ ] Configure 6 Opening Cast characters and 4 Special Guest Cast characters (verify all exist in `CHARACTERS`).
- [ ] Verify Acts 3, 6, 8, and 10 boss encounters match records in `THEATER_BOSS_INFO`.
- [ ] If new boss archetypes appear, register their hazard, weakness, and recommended archetypes.

### 2.3 Spiral Abyss Floor 12 (`src/data/abyss-schedules.ts`)
- [ ] Append new cycle configuration `cycle-X-Y` to `ABYSS_CYCLES`.
- [ ] Configure Ley Line Disorder / Blessing of the Abyssal Moon description.
- [ ] Define 3 Chambers (Chamber 1, 2, 3), each with complete `firstHalf` and `secondHalf`.
- [ ] Ensure all enemies define non-zero HP, level 100, and complete `baseRes` covering all 7 elements + Physical.
- [ ] Update `DEFAULT_ACTIVE_ABYSS_CYCLE_ID` to point to the active cycle.

---

## Phase 3: Documentation & SSOT Verification

### 3.1 Regenerate Celestia Reference
Run the reference generation script:
```bash
node scripts/generate-reference.cjs
```
- [ ] Verify character count matches new total ($128 + N$).
- [ ] Verify weapon count matches new total ($256 + N$).
- [ ] Confirm `docs/knowledge/celestia-reference.md` updates cleanly.
- [ ] Confirm the Verified Corrections Ledger is preserved intact.

### 3.2 Update Rule Baseline
- [ ] If version baseline advances (e.g. from 7.2 to 7.3), update `GEMINI.md` Rule 1 & 2 baseline and character/weapon totals.

---

## Phase 4: Storage Migration & Schema Version Bump (If Applicable)

If local storage schema or profile format evolves:
1. Increment `CURRENT_SCHEMA_VERSION` in `src/services/storage-migration.ts` (e.g. from 2 to 3).
2. Implement migration step in `migrateStorageIfNeeded()`:
   - Generate automated pre-migration safety snapshot: `createSafetySnapshot('celestia_backup_v2')`.
   - Non-destructively transform stored keys.
   - Update `celestia_schema_version`.
3. Add migration unit test to `src/services/storage-migration.test.ts`.

---

## Phase 5: Automated Quality Gate Execution

Execute the full quality verification suite locally before committing:

```bash
# 1. Strict TypeScript type check
npx tsc -b

# 2. Automated data integrity verification
pnpm test src/data/data-integrity.test.ts

# 3. Full Vitest test suite execution
pnpm test

# 4. Production build verification
pnpm run build

# 5. Clean working tree check
git diff --exit-code
```

---

## Phase 6: Release & Post-Deployment Audit

- [ ] Verify fresh visitor experience: Authentic empty armory/roster on first load.
- [ ] Verify Demo Mode toggle: Confirms sample roster loads correctly and unloads cleanly.
- [ ] Verify Account Backup & Restore: Download backup, verify JSON validity, test restore.
- [ ] Verify Error Boundary: Trigger fallback in dev tools to confirm diagnostic download works.
- [ ] Audit responsive mobile viewports (iPhone 13, Pixel 5) with Playwright template.
