import { describe, it, expect } from 'vitest';
import { BANNER_PHASES } from './banners';
import { THEATER_SEASONS, THEATER_BOSS_INFO } from './theater-seasons';
import { ABYSS_CYCLES, DEFAULT_ACTIVE_ABYSS_CYCLE_ID } from './abyss-schedules';
import { CHARACTERS } from './characters';
import { WEAPONS_DATA, getWeaponByKey } from './weapons';
import { AVAILABLE_SCALING_KEYS } from './talent-scaling';
import {
  CURRENT_GAME_VERSION,
  PATCH_CYCLE_DAYS,
  CURRENT_VERSION_INFO,
  compareGameVersions,
  isVersionAtLeast,
  parseGameVersion,
  formatGameVersion,
} from './game-version';
import {
  DATA_PROVENANCE_REGISTRY,
  getProvenance,
  getAllProvenances,
} from './provenance-registry';
import type { Element } from '../types/genshin';

const VALID_ELEMENTS: Element[] = [
  'Pyro',
  'Hydro',
  'Anemo',
  'Electro',
  'Dendro',
  'Cryo',
  'Geo',
];

const RESISTANCE_KEYS = [
  'Pyro',
  'Hydro',
  'Cryo',
  'Electro',
  'Anemo',
  'Geo',
  'Dendro',
  'Physical',
] as const;

describe('Data-Source Integrity Verification', () => {
  describe('Banner Phases Integrity', () => {
    it('guarantees BANNER_PHASES contains calibrated phases', () => {
      expect(BANNER_PHASES.length).toBeGreaterThanOrEqual(10);
    });

    it('verifies all banner character IDs exist in canonical CHARACTERS SSOT', () => {
      const characterIds = new Set(CHARACTERS.map((c) => c.id));

      for (const phase of BANNER_PHASES) {
        for (const cb of phase.characterBanners) {
          expect(
            characterIds.has(cb.characterId),
            `Banner character "${cb.characterId}" in phase "${phase.id}" must exist in CHARACTERS`,
          ).toBe(true);
        }
      }
    });

    it('verifies all signature weapons and featured weapons exist in WEAPONS_DATA', () => {
      const weaponKeys = new Set(WEAPONS_DATA.map((w) => w.key));

      for (const phase of BANNER_PHASES) {
        for (const cb of phase.characterBanners) {
          const canonical = getWeaponByKey(cb.signatureWeaponKey);
          expect(
            canonical !== undefined || weaponKeys.has(cb.signatureWeaponKey),
            `Signature weapon "${cb.signatureWeaponKey}" for "${cb.characterId}" in phase "${phase.id}" must exist in WEAPONS_DATA`,
          ).toBe(true);
        }

        for (const fw of phase.weaponBanner.featuredWeapons) {
          const canonical = getWeaponByKey(fw);
          expect(
            canonical !== undefined || weaponKeys.has(fw),
            `Featured weapon "${fw}" in phase "${phase.id}" must exist in WEAPONS_DATA`,
          ).toBe(true);
        }
      }
    });

    it('verifies all featured 4-star characters are authentic 4-star characters', () => {
      for (const phase of BANNER_PHASES) {
        if (!phase.featured4StarIds) continue;
        for (const f4Id of phase.featured4StarIds) {
          const char = CHARACTERS.find((c) => c.id === f4Id);
          expect(
            char,
            `Featured 4-star "${f4Id}" in phase "${phase.id}" must exist in CHARACTERS`,
          ).toBeDefined();
          expect(
            char?.rarity,
            `Featured 4-star "${f4Id}" must have rarity === 4`,
          ).toBe(4);
        }
      }
    });

    it('verifies date ordering and provenance metadata for every banner phase', () => {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      for (const phase of BANNER_PHASES) {
        expect(
          dateRegex.test(phase.startDate),
          `Banner phase "${phase.id}" startDate "${phase.startDate}" must match YYYY-MM-DD`,
        ).toBe(true);
        expect(
          dateRegex.test(phase.endDate),
          `Banner phase "${phase.id}" endDate "${phase.endDate}" must match YYYY-MM-DD`,
        ).toBe(true);

        const startTimestamp = new Date(phase.startDate).getTime();
        const endTimestamp = new Date(phase.endDate).getTime();
        expect(
          startTimestamp,
          `Banner phase "${phase.id}" startDate must be before endDate`,
        ).toBeLessThan(endTimestamp);

        expect(
          phase.sourceUrl,
          `Banner phase "${phase.id}" must have non-empty sourceUrl`,
        ).toBeDefined();
        expect(
          phase.sourceUrl?.startsWith('https://'),
          `Banner phase "${phase.id}" sourceUrl must be HTTPS`,
        ).toBe(true);

        expect(
          phase.verifiedAt,
          `Banner phase "${phase.id}" must have non-empty verifiedAt`,
        ).toBeDefined();
        expect(
          dateRegex.test(phase.verifiedAt!),
          `Banner phase "${phase.id}" verifiedAt must match YYYY-MM-DD`,
        ).toBe(true);
      }
    });
  });

  describe('Imaginarium Theater Integrity', () => {
    it('verifies every season has exactly 3 valid element restrictions', () => {
      for (const season of THEATER_SEASONS) {
        expect(
          season.elements.length,
          `Season "${season.id}" must define exactly 3 elements`,
        ).toBe(3);

        for (const elem of season.elements) {
          expect(
            VALID_ELEMENTS.includes(elem),
            `Season "${season.id}" element "${elem}" must be a canonical Genshin Element`,
          ).toBe(true);
        }
      }
    });

    it('verifies all opening cast and special guests exist in canonical CHARACTERS SSOT', () => {
      const characterIds = new Set(CHARACTERS.map((c) => c.id));

      for (const season of THEATER_SEASONS) {
        for (const opId of season.openingCastIds) {
          expect(
            characterIds.has(opId),
            `Opening cast character "${opId}" in season "${season.id}" must exist in CHARACTERS`,
          ).toBe(true);
        }

        for (const guestId of season.specialGuestIds) {
          expect(
            characterIds.has(guestId),
            `Special guest character "${guestId}" in season "${season.id}" must exist in CHARACTERS`,
          ).toBe(true);
        }
      }
    });

    it('verifies all boss encounters map to calibrated THEATER_BOSS_INFO metadata', () => {
      for (const season of THEATER_SEASONS) {
        for (const [act, bossName] of Object.entries(season.bosses)) {
          const bossInfo = THEATER_BOSS_INFO[bossName];
          expect(
            bossInfo,
            `Act ${act} boss "${bossName}" in season "${season.id}" must exist in THEATER_BOSS_INFO`,
          ).toBeDefined();
          expect(bossInfo.name.length).toBeGreaterThan(0);
          expect(bossInfo.title.length).toBeGreaterThan(0);
          expect(bossInfo.hazard.length).toBeGreaterThan(0);
          expect(bossInfo.weakness.length).toBeGreaterThan(0);
          expect(bossInfo.recommendedArchetypes.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('Spiral Abyss Integrity', () => {
    it('verifies every cycle has exactly 3 chambers with populated halves', () => {
      for (const cycle of ABYSS_CYCLES) {
        expect(
          cycle.chambers.length,
          `Abyss cycle "${cycle.id}" must have exactly 3 chambers`,
        ).toBe(3);

        cycle.chambers.forEach((ch, idx) => {
          expect(ch.chamber).toBe(idx + 1);
          expect(ch.firstHalf.enemies.length).toBeGreaterThan(0);
          expect(ch.secondHalf.enemies.length).toBeGreaterThan(0);
          expect(ch.firstHalf.mechanics).toBeDefined();
          expect(ch.secondHalf.mechanics).toBeDefined();

          if (ch.firstHalf.mechanics.recommendedElements) {
            expect(ch.firstHalf.mechanics.recommendedElements.length).toBeGreaterThan(0);
          }
          if (ch.secondHalf.mechanics.recommendedElements) {
            expect(ch.secondHalf.mechanics.recommendedElements.length).toBeGreaterThan(0);
          }
        });
      }
    });

    it('verifies enemy stats, levels, and complete elemental/physical resistances', () => {
      for (const cycle of ABYSS_CYCLES) {
        for (const ch of cycle.chambers) {
          const allEnemies = [...ch.firstHalf.enemies, ...ch.secondHalf.enemies];
          for (const enemy of allEnemies) {
            expect(enemy.id.length).toBeGreaterThan(0);
            expect(enemy.name.length).toBeGreaterThan(0);
            expect(enemy.level).toBeGreaterThan(0);
            expect(enemy.hp).toBeGreaterThan(0);

            for (const resKey of RESISTANCE_KEYS) {
              expect(
                typeof enemy.baseRes[resKey],
                `Enemy "${enemy.name}" in cycle "${cycle.id}" Chamber ${ch.chamber} must define baseRes.${resKey}`,
              ).toBe('number');
              expect(
                isNaN(enemy.baseRes[resKey]),
                `Enemy "${enemy.name}" baseRes.${resKey} must not be NaN`,
              ).toBe(false);
            }
          }
        }
      }
    });

    it('verifies active cycle 7.2 covers November 2026', () => {
      const activeCycle = ABYSS_CYCLES.find((c) => c.id === DEFAULT_ACTIVE_ABYSS_CYCLE_ID);
      expect(activeCycle).toBeDefined();
      expect(activeCycle?.version).toBe(CURRENT_GAME_VERSION);
      expect(activeCycle?.effectiveStartDate).toBe('2026-11-16');
      expect(activeCycle?.effectiveEndDate).toBe('2026-12-16');
    });
  });

  describe('Talent Scaling Referential Integrity', () => {
    it('verifies all 128 characters have a corresponding talent scaling profile in AVAILABLE_SCALING_KEYS', () => {
      expect(CHARACTERS.length).toBe(128);

      for (const char of CHARACTERS) {
        const cleanKey = char.id.toLowerCase().replace(/[^a-z0-9]/g, '');
        expect(
          AVAILABLE_SCALING_KEYS,
          `Missing scaling key for ${char.name} (id: ${char.id})`,
        ).toContain(cleanKey);
      }
    });
  });

  describe('Canonical Character IDs SSOT Alignment', () => {
    it('guarantees CANONICAL_CHARACTER_IDS strictly contains all 128 playable characters from SSOT', async () => {
      const { CANONICAL_CHARACTER_IDS } = await import('./character-ids');
      expect(CHARACTERS.length).toBe(128);

      for (const char of CHARACTERS) {
        expect(
          CANONICAL_CHARACTER_IDS.has(char.id),
          `CANONICAL_CHARACTER_IDS missing SSOT character "${char.id}"`,
        ).toBe(true);
      }

      // Plus generic 'Traveler' alias for backward compatibility
      expect(CANONICAL_CHARACTER_IDS.has('Traveler')).toBe(true);
      expect(CANONICAL_CHARACTER_IDS.size).toBe(129);
    });
  });

  describe('Game Version SSOT Integrity', () => {
    it('declares CURRENT_GAME_VERSION as 7.2 baseline and standard 42-day patch cycle', () => {
      expect(CURRENT_GAME_VERSION).toBe('7.2');
      expect(PATCH_CYCLE_DAYS).toBe(42);
      expect(CURRENT_VERSION_INFO.version).toBe(CURRENT_GAME_VERSION);
      expect(CURRENT_VERSION_INFO.releaseDate).toBe('2026-11-04');
    });

    it('guarantees active schedule datasets match CURRENT_GAME_VERSION', () => {
      // Abyss active schedule
      const activeCycle = ABYSS_CYCLES.find((c) => c.id === DEFAULT_ACTIVE_ABYSS_CYCLE_ID);
      expect(activeCycle?.version).toBe(CURRENT_GAME_VERSION);

      // Theater active schedule (November 2026)
      const activeTheater = THEATER_SEASONS.find((s) => s.id === 'season-7-2-hydro-electro-geo');
      expect(activeTheater?.version).toBe(CURRENT_GAME_VERSION);

      // Current banner phases
      const p1Banner = BANNER_PHASES.find((p) => p.id === 'banner_7_2_phase_1');
      expect(p1Banner?.version).toBe(CURRENT_GAME_VERSION);
    });

    it('verifies game version comparison utilities and formatting', () => {
      expect(compareGameVersions('7.2', '7.1')).toBeGreaterThan(0);
      expect(compareGameVersions('7.2', '7.2')).toBe(0);
      expect(compareGameVersions('5.4', '7.2')).toBeLessThan(0);
      expect(compareGameVersions('7.2.1', '7.2')).toBeGreaterThan(0);

      expect(isVersionAtLeast('7.2')).toBe(true);
      expect(isVersionAtLeast('7.3')).toBe(true);
      expect(isVersionAtLeast('7.1')).toBe(false);
      expect(isVersionAtLeast('5.4')).toBe(false);

      expect(parseGameVersion('7.2')).toEqual({ major: 7, minor: 2, patch: undefined });
      expect(parseGameVersion('v7.2.1')).toEqual({ major: 7, minor: 2, patch: 1 });
      expect(parseGameVersion('')).toEqual({ major: 0, minor: 0, patch: undefined });
      expect(parseGameVersion(null as any)).toEqual({ major: 0, minor: 0, patch: undefined });

      expect(formatGameVersion('7.2')).toBe('v7.2');
      expect(formatGameVersion('v7.2')).toBe('v7.2');
      expect(formatGameVersion('')).toBe(`v${CURRENT_GAME_VERSION}`);
      expect(formatGameVersion(null as any)).toBe(`v${CURRENT_GAME_VERSION}`);
    });
  });

  describe('Data Provenance Registry Integrity', () => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    it('contains verified provenance records for all active schedules and modern additions', () => {
      const requiredActiveDatasets = [
        'banner_7_2_phase_1',
        'banner_7_2_phase_2',
        'banner_7_2_natlan_chronicled',
        'cycle-7-2',
        'abyss_floor_12_v7_2',
        'season-7-2-hydro-electro-geo',
        'season-7-2-dec-pyro-hydro-geo',
        'characters_v7_2_batch7',
        'weapons_v7_2_signatures',
        'artifacts_v7_2_master',
      ];

      for (const id of requiredActiveDatasets) {
        const prov = getProvenance(id);
        expect(prov, `Missing provenance record for active dataset "${id}"`).toBeDefined();
        expect(prov?.datasetId).toBe(id);
        expect(prov?.version).toBe(CURRENT_GAME_VERSION);
      }
    });

    it('guarantees all provenance records possess authentic HTTPS sources and evidence notes', () => {
      expect(Object.keys(DATA_PROVENANCE_REGISTRY).length).toBeGreaterThanOrEqual(10);
      const allProvenances = getAllProvenances();
      expect(allProvenances.length).toBeGreaterThanOrEqual(10);

      for (const prov of allProvenances) {
        expect(prov.datasetId.length).toBeGreaterThan(0);
        expect(prov.sourceUrl.startsWith('https://'), `sourceUrl for "${prov.datasetId}" must be HTTPS`).toBe(true);
        expect(dateRegex.test(prov.verifiedAt), `verifiedAt for "${prov.datasetId}" must be YYYY-MM-DD`).toBe(true);
        expect(prov.evidence.length, `evidence for "${prov.datasetId}" must be substantive`).toBeGreaterThanOrEqual(15);
        expect(['verified', 'provisional', 'stale']).toContain(prov.status);
      }
    });
  });
});
