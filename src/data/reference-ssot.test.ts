import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { CHARACTERS } from './characters';
import { WEAPONS_DATA, WEAPONS_BY_KEY, getWeaponByKey } from './weapons';
import { ARTIFACTS_MASTER, ARTIFACTS_BY_ID, getArtifactSet } from './artifacts-master';
import { AVAILABLE_SCALING_KEYS, getTalentScaling } from './talent-scaling';
import { CHARACTER_ROTATIONS, getCharacterRotation } from './character-rotations';
import { ABYSS_CYCLES, DEFAULT_ACTIVE_ABYSS_CYCLE_ID, getActiveAbyssCycle } from './abyss-schedules';
import { THEATER_SEASONS, DEFAULT_ACTIVE_THEATER_SEASON_ID, getActiveTheaterSeason } from './theater-seasons';
import { BANNER_PHASES, getActiveBannerPhase } from './banners';
import { CURRENT_ABYSS_CHAMBERS } from '../engines/endgame-helper';

describe('Persistent Reference SSOT Verification', () => {
  const rootDir = process.cwd();
  const geminiPath = path.join(rootDir, 'GEMINI.md');
  const referencePath = path.join(rootDir, 'docs', 'knowledge', 'celestia-reference.md');

  it('verifies GEMINI.md enforces Version 7.2 baseline and designates SSOT data files', () => {
    expect(fs.existsSync(geminiPath), 'GEMINI.md must exist in root').toBe(true);
    const gemini = fs.readFileSync(geminiPath, 'utf8');

    expect(gemini).toContain('7.2');
    expect(gemini).toContain('Nod-Krai');
    expect(gemini).toContain('Strictly forbid defaulting to 5.x');
    expect(gemini).toContain('src/data/characters.ts');
    expect(gemini).toContain('src/data/weapons.ts');
    expect(gemini).toContain('src/data/artifact-weights.ts');
    expect(gemini).toContain('src/data/artifacts-master.ts');
    expect(gemini).toContain('src/data/talent-scaling/');
    expect(gemini).toContain('docs/knowledge/celestia-reference.md');
  });

  it('verifies celestia-reference.md exists and is non-empty', () => {
    expect(fs.existsSync(referencePath), 'docs/knowledge/celestia-reference.md must exist').toBe(true);
    const content = fs.readFileSync(referencePath, 'utf8');
    expect(content.length).toBeGreaterThan(10000);
    expect(content).toContain('v7.2 Baseline');
  });

  it('documents all 124+ canonical playable characters in celestia-reference.md', () => {
    const content = fs.readFileSync(referencePath, 'utf8');
    expect(CHARACTERS.length).toBeGreaterThanOrEqual(124);

    for (const char of CHARACTERS) {
      expect(content, `Missing character ${char.name} in celestia-reference.md`).toContain(`**${char.name}**`);
      expect(content, `Missing ID ${char.id} in celestia-reference.md`).toContain(`\`${char.id}\``);
    }
  });

  it('documents all 64 master artifact sets (including 37 combat sets) in celestia-reference.md', () => {
    const content = fs.readFileSync(referencePath, 'utf8');
    expect(ARTIFACTS_MASTER.length).toBe(64);

    const expectedSets = new Set<string>();
    for (const char of CHARACTERS) {
      if (char.build?.artifacts) {
        for (const art of char.build.artifacts) {
          if (art.name) expectedSets.add(art.name);
        }
      }
    }

    expect(expectedSets.size).toBe(37);
    for (const setName of expectedSets) {
      expect(content, `Missing combat artifact set ${setName} in celestia-reference.md`).toContain(`**${setName}**`);
    }

    // Verify Master Sets Index in markdown
    for (const masterSet of ARTIFACTS_MASTER) {
      expect(content, `Missing master set ${masterSet.name} in celestia-reference.md`).toContain(`**${masterSet.name}**`);
    }
  });

  it('accurately reports the weapon distribution matrix (256 weapons: 76 5★, 146 4★, 24 3★, 10 1★-2★)', () => {
    const content = fs.readFileSync(referencePath, 'utf8');
    expect(WEAPONS_DATA.length).toBeGreaterThanOrEqual(253);
    expect(WEAPONS_DATA.length).toBe(256);

    const fiveStars = WEAPONS_DATA.filter((w) => w.rarity === 5);
    const fourStars = WEAPONS_DATA.filter((w) => w.rarity === 4);
    const threeStars = WEAPONS_DATA.filter((w) => w.rarity === 3);
    const lowStars = WEAPONS_DATA.filter((w) => w.rarity <= 2);

    expect(fiveStars.length).toBe(76);
    expect(fourStars.length).toBe(146);
    expect(threeStars.length).toBe(24);
    expect(lowStars.length).toBe(10);

    // Verify each weapon type distribution
    expect(content).toMatch(/\|\s*\*\*Sword\*\*\s*\|\s*62\s*\|\s*19\s*\|\s*35\s*\|\s*6\s*\|\s*2\s*\|/);
    expect(content).toMatch(/\|\s*\*\*Claymore\*\*\s*\|\s*45\s*\|\s*11\s*\|\s*27\s*\|\s*5\s*\|\s*2\s*\|/);
    expect(content).toMatch(/\|\s*\*\*Polearm\*\*\s*\|\s*43\s*\|\s*13\s*\|\s*25\s*\|\s*3\s*\|\s*2\s*\|/);
    expect(content).toMatch(/\|\s*\*\*Bow\*\*\s*\|\s*50\s*\|\s*12\s*\|\s*31\s*\|\s*5\s*\|\s*2\s*\|/);
    expect(content).toMatch(/\|\s*\*\*Catalyst\*\*\s*\|\s*56\s*\|\s*21\s*\|\s*28\s*\|\s*5\s*\|\s*2\s*\|/);
  });

  it('catalogues all 76 authentic 5★ signature weapons from WEAPONS_DATA', () => {
    const content = fs.readFileSync(referencePath, 'utf8');
    const fiveStars = WEAPONS_DATA.filter((w) => w.rarity === 5);

    for (const w of fiveStars) {
      expect(content, `Missing 5★ weapon ${w.name} in catalogue`).toContain(`**${w.name}**`);
    }
  });

  it('contains modular talent scaling curves for all characters', () => {
    expect(AVAILABLE_SCALING_KEYS.length).toBeGreaterThanOrEqual(124);
    for (const char of CHARACTERS) {
      const cleanKey = char.id.toLowerCase().replace(/[^a-z0-9]/g, '');
      expect(AVAILABLE_SCALING_KEYS, `Missing scaling key for ${char.id}`).toContain(cleanKey);
    }
  });

  it('contains the permanent Verified Corrections Ledger with all key incidents', () => {
    const content = fs.readFileSync(referencePath, 'utf8');
    expect(content).toContain('## 7. Verified Corrections Ledger (Permanent Incident Log)');
    expect(content).toContain('Version Anchor Regression');
    expect(content).toContain('Character Roster Size');
    expect(content).toContain('Artifact Set Indexing');
    expect(content).toContain('Weapon Count & Modern Passives');
    expect(content).toContain('Weapon Signature Hallucinations');
    expect(content).toContain('GenshinDB Complete SSOT Expansion');
    expect(content).toContain('Artifact ID & Weapon Key Integrity');
  });

  it('guarantees 100% unique artifact IDs across all 64 master artifact sets without collision', () => {
    expect(ARTIFACTS_MASTER.length).toBe(64);
    expect(Object.keys(ARTIFACTS_BY_ID).length).toBe(64);

    // Verify Resolution of Sojourner (id: 10001) and Initiate (id: 10000)
    const sojourner = getArtifactSet('10001');
    expect(sojourner).toBeDefined();
    expect(sojourner?.name).toBe('Resolution of Sojourner');

    const initiate = getArtifactSet('10000');
    expect(initiate).toBeDefined();
    expect(initiate?.name).toBe('Initiate');
  });

  it('guarantees 100% unique weapon keys across all 256 weapons and indexes quest variants', () => {
    expect(WEAPONS_DATA.length).toBe(256);
    expect(Object.keys(WEAPONS_BY_KEY).length).toBe(256);

    // Verify Prized Isshin Blade quest progression variants
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade']).toBeDefined();
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade1']).toBeDefined();
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade2']).toBeDefined();

    // Verify stats differ authentically
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade'].subStatValue).toBe('41.3%');
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade1'].subStatValue).toBeUndefined();
    expect(WEAPONS_BY_KEY['PrizedIsshinBlade2'].subStatValue).toBe('20.7%');
  });

  it('resolves every recommended weapon across all 128 characters cleanly via getWeaponByKey', () => {
    for (const char of CHARACTERS) {
      for (const w of char.build?.weapons || []) {
        const resolved = getWeaponByKey(w.name);
        expect(resolved, `Failed to resolve weapon "${w.name}" recommended for ${char.name}`).toBeDefined();
        expect(resolved?.weaponType).toBe(char.weapon);
      }
    }
  });

  it('supports lazy loading talent scaling data including standard character aliases', async () => {
    const kazuhaScaling = await getTalentScaling('kazuha');
    expect(kazuhaScaling).toBeDefined();
    expect(kazuhaScaling?.name).toBe('Kaedehara Kazuha');

    const raidenScaling = await getTalentScaling('raiden');
    expect(raidenScaling).toBeDefined();
    expect(raidenScaling?.name).toBe('Raiden Shogun');

    const travelerScaling = await getTalentScaling('Traveler (Anemo)');
    expect(travelerScaling).toBeDefined();
    expect(travelerScaling?.name).toBe('Traveler (Anemo)');

    const unknown = await getTalentScaling('NonExistentCharacter');
    expect(unknown).toBeUndefined();
  });

  it('provides calibrated rotation profiles for all 128 canonical characters', () => {
    expect(Object.keys(CHARACTER_ROTATIONS).length).toBeGreaterThanOrEqual(128);

    for (const char of CHARACTERS) {
      const rot = getCharacterRotation(char.id);
      expect(rot, `Missing calibrated rotation for character ${char.id} (${char.name})`).toBeDefined();
      expect(rot?.primarySequence.length).toBeGreaterThan(0);
      expect(rot?.stage).toBeTruthy();
      expect(rot?.estimatedFieldTime).toBeGreaterThan(0);
      expect(rot?.notes).toBeTruthy();
    }
  });

  it('registers active Version 7.2 Floor 12 cycles (cycle-7-2 & cycle-7-1) as default active schedules', () => {
    expect(DEFAULT_ACTIVE_ABYSS_CYCLE_ID).toBe('cycle-7-2');
    expect(ABYSS_CYCLES[0].id).toBe('cycle-7-2');
    const cycle72 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-2');
    expect(cycle72).toBeDefined();
    expect(cycle72?.name).toContain('Stellar Fracture');
    expect(cycle72?.version).toBe('7.2');
    expect(cycle72?.chambers).toHaveLength(3);

    const cycle71 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-1');
    expect(cycle71).toBeDefined();
    expect(cycle71?.name).toContain('Lunar Gleam');
    expect(cycle71?.version).toBe('7.1');
    expect(cycle71?.chambers).toHaveLength(3);

    // Historical archive preserved
    expect(ABYSS_CYCLES.some((c) => c.id === 'cycle-5-3')).toBe(true);
    expect(ABYSS_CYCLES.some((c) => c.id === 'cycle-5-2')).toBe(true);
    expect(ABYSS_CYCLES.some((c) => c.id === 'cycle-5-1')).toBe(true);
  });

  it('registers active Version 7.2 Imaginarium Theater seasons (season-7-2-hydro-electro-geo & upcoming)', () => {
    expect(DEFAULT_ACTIVE_THEATER_SEASON_ID).toBe('season-7-2-hydro-electro-geo');
    expect(THEATER_SEASONS[0].id).toBe('season-7-2-hydro-electro-geo');
    const activeSeason = THEATER_SEASONS.find(
      (s) => s.id === 'season-7-2-hydro-electro-geo'
    );
    expect(activeSeason).toBeDefined();
    expect(activeSeason?.elements).toEqual(['Hydro', 'Electro', 'Geo']);
    expect(activeSeason?.openingCastIds).toEqual(['Columbina', 'Clorinde', 'Navia', 'Furina', 'Mitya', 'Zhongli']);
    expect(activeSeason?.specialGuestIds).toEqual(['Mavuika', 'Nahida', 'Chasca', 'KaedeharaKazuha']);
    expect(activeSeason?.sourceUrl).toBeDefined();
    expect(activeSeason?.verifiedAt).toBeDefined();

    const upcomingSeason = THEATER_SEASONS.find(
      (s) => s.id === 'season-7-2-dec-pyro-hydro-geo'
    );
    expect(upcomingSeason).toBeDefined();
    expect(upcomingSeason?.elements).toEqual(['Pyro', 'Hydro', 'Geo']);
  });

  it('verifies BannerPhase SSOT, 7.2 Phase 1 four-stars, and getActiveBannerPhase', () => {
    const phase1 = BANNER_PHASES.find((p) => p.id === 'banner_7_2_phase_1');
    expect(phase1).toBeDefined();
    expect(phase1?.featured4StarIds).toEqual(['Valeriy', 'Charlotte', 'Rosaria']);
    expect(phase1?.characterBanners).toEqual([
      { characterId: 'Mitya', signatureWeaponKey: 'StarsealedEdict' },
      { characterId: 'Furina', signatureWeaponKey: 'SplendorOfTranquilWaters' },
    ]);
    expect(phase1?.sourceUrl).toBeDefined();
    expect(phase1?.verifiedAt).toBeDefined();

    // Date aware resolution
    const activeNov = getActiveBannerPhase(new Date('2026-11-16'));
    expect(activeNov?.id).toBe('banner_7_2_phase_1');

    const activeLateNov = getActiveBannerPhase(new Date('2026-11-25'));
    expect(activeLateNov?.id).toBe('banner_7_2_phase_2');

    const outOfBounds = getActiveBannerPhase(new Date('2030-01-01'));
    expect(outOfBounds).toBeUndefined();
  });

  it('verifies date-aware Imaginarium Theater season resolution across boundaries', () => {
    const activeNov = getActiveTheaterSeason(new Date('2026-11-16'));
    expect(activeNov.id).toBe('season-7-2-hydro-electro-geo');
    expect(activeNov.elements).toEqual(['Hydro', 'Electro', 'Geo']);

    // Boundary check on 2026-12-01: cleanly transitions to December season
    const boundaryDec = getActiveTheaterSeason(new Date('2026-12-01'));
    expect(boundaryDec.id).toBe('season-7-2-dec-pyro-hydro-geo');
    expect(boundaryDec.elements).toEqual(['Pyro', 'Hydro', 'Geo']);

    const activeDec = getActiveTheaterSeason(new Date('2026-12-15'));
    expect(activeDec.id).toBe('season-7-2-dec-pyro-hydro-geo');
    expect(activeDec.elements).toEqual(['Pyro', 'Hydro', 'Geo']);

    // Fallback to active season if out of range
    const fallback = getActiveTheaterSeason(new Date('2030-01-01'));
    expect(fallback).toBeDefined();
    expect(fallback.id).toBe(THEATER_SEASONS[0].id);
  });

  it('verifies Abyss cycle-7-2 metadata and date-aware resolution', () => {
    const cycle72 = ABYSS_CYCLES.find((c) => c.id === 'cycle-7-2');
    expect(cycle72).toBeDefined();
    expect(cycle72?.effectiveStartDate).toBe('2026-11-16');
    expect(cycle72?.effectiveEndDate).toBe('2026-12-16');
    expect(cycle72?.sourceUrl).toBeDefined();
    expect(cycle72?.verifiedAt).toBeDefined();

    const activeCycle = getActiveAbyssCycle(new Date('2026-11-16'));
    expect(activeCycle.id).toBe('cycle-7-2');
  });

  it('verifies endgame-helper derives CURRENT_ABYSS_CHAMBERS directly from getActiveAbyssCycle', () => {
    const activeCycle = getActiveAbyssCycle();
    expect(CURRENT_ABYSS_CHAMBERS.length).toBe(activeCycle.chambers.length * 2);

    const c1FirstHalf = CURRENT_ABYSS_CHAMBERS.find((c) => c.chamber === 1 && c.half === 'First Half');
    expect(c1FirstHalf).toBeDefined();
    expect(c1FirstHalf?.floor).toBe(12);

    const c1SecondHalf = CURRENT_ABYSS_CHAMBERS.find((c) => c.chamber === 1 && c.half === 'Second Half');
    expect(c1SecondHalf).toBeDefined();
    expect(c1SecondHalf?.recommendedElements).toContain('Hydro');
    expect(c1SecondHalf?.enemies).toContain('Abyss Lector: Fathomless Flames');
  });

  it('validates dynamic talent scaling curves and parameters for key modern and canonical characters', async () => {
    const furina = await getTalentScaling('furina');
    expect(furina).toBeDefined();
    expect(furina?.normal?.parameters['param1']?.length).toBe(15);
    expect(furina?.skill?.labels.some((l) => l.includes('Salon Solitaire') || l.includes('DMG'))).toBe(true);
    expect(furina?.burst?.parameters['param1']?.length).toBe(15);

    const mavuika = await getTalentScaling('mavuika');
    expect(mavuika).toBeDefined();
    expect(mavuika?.skill).toBeDefined();

    const columbina = await getTalentScaling('columbina');
    expect(columbina).toBeDefined();
    expect(columbina?.burst).toBeDefined();
  });

  it('resolves dynamic talent scaling curves across all 128 playable characters', async () => {
    expect(CHARACTERS.length).toBe(128);
    for (const char of CHARACTERS) {
      const scaling = await getTalentScaling(char.id);
      expect(scaling, `Missing talent scaling for ${char.id} (${char.name})`).toBeDefined();
      expect(scaling?.normal?.parameters, `Missing normal attack params for ${char.id}`).toBeDefined();
      expect(scaling?.skill?.parameters, `Missing skill params for ${char.id}`).toBeDefined();
      expect(scaling?.burst?.parameters, `Missing burst params for ${char.id}`).toBeDefined();
    }
  }, 20000);
});
