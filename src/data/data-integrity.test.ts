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
import type {
  DataProvenance,
  Element,
  ProvenanceStatus,
  RecommendationMode,
  RecommendationReliability,
  ReliabilityStatus,
  TemporalState,
  VerificationMethod,
  VerificationState,
} from '../types/genshin';

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
        if (prov.sourceUrl !== undefined) {
          expect(
            prov.sourceUrl.startsWith('https://'),
            `sourceUrl for "${prov.datasetId}" must be HTTPS`,
          ).toBe(true);
        } else {
          const allowsMissingUrl =
            prov.datasetId === 'custom-sandbox' ||
            prov.verificationMethod === 'in_game_verification';
          expect(
            allowsMissingUrl,
            `Provenance "${prov.datasetId}" requires an HTTPS sourceUrl for verificationMethod "${prov.verificationMethod ?? 'none'}"`,
          ).toBe(true);
        }
        expect(dateRegex.test(prov.verifiedAt), `verifiedAt for "${prov.datasetId}" must be YYYY-MM-DD`).toBe(true);
        expect(prov.evidence.length, `evidence for "${prov.datasetId}" must be substantive`).toBeGreaterThanOrEqual(15);
        expect(['verified', 'provisional', 'stale']).toContain(prov.status);
      }
    });
  });

  describe('M9 Phase 1 — Reliability Contracts & Provenance Alignment', () => {
    type AssertEqual<A, B> =
      (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;
    type AssertDisjoint<A, B> = [Extract<A, B>] extends [never] ? true : false;

    it('enforces exact unions for all M9 reliability and provenance enums', () => {
      const isExactVerification: AssertEqual<
        VerificationState,
        'verified' | 'provisional' | 'stale' | 'unregistered'
      > = true;
      const isExactTemporal: AssertEqual<
        TemporalState,
        'upcoming' | 'active' | 'expired' | 'not_applicable'
      > = true;
      const isExactMode: AssertEqual<
        RecommendationMode,
        'current' | 'planning_preview' | 'archive_simulation' | 'sandbox_simulation'
      > = true;
      const isExactReliability: AssertEqual<
        ReliabilityStatus,
        'reliable' | 'qualified' | 'historical' | 'unsupported'
      > = true;
      const isExactProvenanceStatus: AssertEqual<
        ProvenanceStatus,
        'verified' | 'provisional' | 'stale'
      > = true;
      const isExactVerificationMethod: AssertEqual<
        VerificationMethod,
        'official_notice' | 'in_game_verification' | 'theorycraft_consensus'
      > = true;
      const isRegisteredSubset: AssertEqual<
        Exclude<VerificationState, ProvenanceStatus>,
        'unregistered'
      > = true;

      expect(isExactVerification).toBe(true);
      expect(isExactTemporal).toBe(true);
      expect(isExactMode).toBe(true);
      expect(isExactReliability).toBe(true);
      expect(isExactProvenanceStatus).toBe(true);
      expect(isExactVerificationMethod).toBe(true);
      expect(isRegisteredSubset).toBe(true);
    });

    it('accepts all VerificationState values and represents missing provenance as unregistered', () => {
      const states: VerificationState[] = ['verified', 'provisional', 'stale', 'unregistered'];
      expect(states).toHaveLength(4);

      const missing = getProvenance('non_existent_dataset_id');
      const missingVerification: VerificationState = missing ? missing.status : 'unregistered';
      expect(missing).toBeUndefined();
      expect(missingVerification).toBe('unregistered');
    });

    it('keeps TemporalState, RecommendationMode, VerificationState, and VerificationMethod distinct', () => {
      const temporalStates: TemporalState[] = ['upcoming', 'active', 'expired', 'not_applicable'];
      const modes: RecommendationMode[] = [
        'current',
        'planning_preview',
        'archive_simulation',
        'sandbox_simulation',
      ];
      const methods: VerificationMethod[] = [
        'official_notice',
        'in_game_verification',
        'theorycraft_consensus',
      ];

      const temporalDistinctFromMode: AssertDisjoint<TemporalState, RecommendationMode> = true;
      const temporalDistinctFromVerification: AssertDisjoint<TemporalState, VerificationState> = true;
      const modeDistinctFromVerification: AssertDisjoint<RecommendationMode, VerificationState> = true;
      const methodDistinctFromMode: AssertDisjoint<VerificationMethod, RecommendationMode> = true;

      expect(temporalStates).toHaveLength(4);
      expect(modes).toHaveLength(4);
      expect(methods).toHaveLength(3);
      expect(temporalDistinctFromMode).toBe(true);
      expect(temporalDistinctFromVerification).toBe(true);
      expect(modeDistinctFromVerification).toBe(true);
      expect(methodDistinctFromMode).toBe(true);
    });

    it('keeps ReliabilityStatus independent of VerificationState and TemporalState without asserting evaluator policy', () => {
      const statuses: ReliabilityStatus[] = ['reliable', 'qualified', 'historical', 'unsupported'];
      const statusDistinctFromVerification: AssertDisjoint<ReliabilityStatus, VerificationState> = true;
      const statusDistinctFromTemporal: AssertDisjoint<ReliabilityStatus, TemporalState> = true;

      // Structural contract fixtures only (evaluator decision rules are deferred to Phase 2).
      // Upcoming planning previews are not currently actionable (isActionable: false).
      const sampleCombinations: RecommendationReliability[] = [
        {
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: ['cycle-7-2'],
          warnings: [],
        },
        {
          status: 'qualified',
          mode: 'planning_preview',
          isActionable: false,
          verification: 'verified',
          temporalState: 'upcoming',
          provenanceIds: ['season-7-2-dec-pyro-hydro-geo'],
          warnings: ['Upcoming schedule preview; not active yet'],
        },
        {
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          provenanceIds: ['cycle-5-3'],
          warnings: ['Archived schedule'],
        },
        {
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          provenanceIds: [],
          warnings: ['Missing provenance record'],
        },
      ];

      expect(statuses).toHaveLength(4);
      expect(statusDistinctFromVerification).toBe(true);
      expect(statusDistinctFromTemporal).toBe(true);
      expect(sampleCombinations.map((c) => c.status)).toEqual(statuses);
      expect(sampleCombinations[0].isActionable).toBe(true);
      expect(sampleCombinations.slice(1).every((c) => c.isActionable === false)).toBe(true);
    });

    it('ensures RecommendationReliability contains only JSON-serializable fields', () => {
      const sample: RecommendationReliability = {
        status: 'qualified',
        mode: 'sandbox_simulation',
        isActionable: false,
        verification: 'provisional',
        temporalState: 'not_applicable',
        provenanceIds: ['custom-sandbox'],
        warnings: ['User-configured sandbox simulation'],
      };

      const roundTripped = JSON.parse(JSON.stringify(sample)) as RecommendationReliability;
      expect(roundTripped).toEqual(sample);
      expect(Object.keys(roundTripped).sort()).toEqual([
        'isActionable',
        'mode',
        'provenanceIds',
        'status',
        'temporalState',
        'verification',
        'warnings',
      ]);
    });

    it('retains canonical Abyss and Theater registry IDs and excludes removed redundant IDs', () => {
      const canonicalIds = [
        'cycle-7-2',
        'season-7-2-hydro-electro-geo',
        'season-7-2-dec-pyro-hydro-geo',
      ];
      for (const id of canonicalIds) {
        expect(getProvenance(id), `Expected canonical record "${id}"`).toBeDefined();
      }

      const removedRedundantIds = [
        'abyss_floor_12_v7_2',
        'theater_season_7_2_nov',
        'theater_season_7_2_dec',
      ];
      for (const id of removedRedundantIds) {
        expect(getProvenance(id), `Redundant ID "${id}" must be removed`).toBeUndefined();
        expect(Object.prototype.hasOwnProperty.call(DATA_PROVENANCE_REGISTRY, id)).toBe(false);
      }
    });

    it('allows optional sourceUrl for in-game observations and sandbox entries without breaking DataProvenance', () => {
      const inGameObservation: DataProvenance = {
        datasetId: 'in_game_observation_fixture',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-16',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['enemies', 'hp'],
        evidence: 'Direct in-game verification without a public notice URL.',
        status: 'verified',
      };
      expect(inGameObservation.sourceUrl).toBeUndefined();

      const sandbox = getProvenance('custom-sandbox');
      expect(sandbox).toBeDefined();
      expect(sandbox?.status).toBe('provisional');
      expect(sandbox?.verificationMethod).toBeUndefined();
      expect(sandbox?.sourceUrl).toBeUndefined();
    });

    it('enforces the legacy-only effectiveEndDate compatibility boundary until Phase 2 removal', () => {
      // Compile-time check: DataProvenance must not declare startDate, endDate, or effectiveStartDate
      const hasEffectiveStartDate: AssertEqual<
        'effectiveStartDate' extends keyof DataProvenance ? true : false,
        false
      > = true;
      const hasStartDate: AssertEqual<'startDate' extends keyof DataProvenance ? true : false, false> = true;
      const hasEndDate: AssertEqual<'endDate' extends keyof DataProvenance ? true : false, false> = true;
      expect(hasEffectiveStartDate).toBe(true);
      expect(hasStartDate).toBe(true);
      expect(hasEndDate).toBe(true);

      // Canonical schedule end-date map from canonical entity sources of truth
      const canonicalEndDates = new Map<string, string>([
        ...BANNER_PHASES.map((b) => [b.id, b.endDate] as const),
        ...ABYSS_CYCLES.filter((c) => c.effectiveEndDate).map((c) => [c.id, c.effectiveEndDate!] as const),
        ...THEATER_SEASONS.filter((s) => s.effectiveEndDate).map((s) => [s.id, s.effectiveEndDate!] as const),
      ]);

      const legacyEndDateIds: string[] = [];
      for (const prov of getAllProvenances()) {
        const raw = prov as unknown as Record<string, unknown>;
        expect(raw).not.toHaveProperty('effectiveStartDate');
        expect(raw).not.toHaveProperty('startDate');
        expect(raw).not.toHaveProperty('endDate');

        if (prov.effectiveEndDate !== undefined) {
          legacyEndDateIds.push(prov.datasetId);
          expect(
            canonicalEndDates.get(prov.datasetId),
            `Legacy effectiveEndDate on "${prov.datasetId}" must only mirror an existing canonical schedule entity`,
          ).toBe(prov.effectiveEndDate);
        }
      }

      // Frozen count of legacy-only effectiveEndDate entries (38 -> 35 registry records; 20 -> 17 legacy dates).
      // Mandatory Phase 2 task: migrate freshness expiry to canonical entities and remove all 17 fields.
      expect(legacyEndDateIds).toHaveLength(17);
    });
  });

  describe('M4 Deep Maintenance & Provenance Guarantees', () => {
    it('enforces Imaginarium Theater opening cast element eligibility and off-element special guests', () => {
      const charMap = new Map(CHARACTERS.map((c) => [c.id, c]));

      for (const season of THEATER_SEASONS) {
        const allowed = new Set(season.elements);
        const openingSet = new Set(season.openingCastIds);

        for (const opId of season.openingCastIds) {
          const c = charMap.get(opId);
          expect(c, `Missing opening cast ${opId}`).toBeDefined();
          expect(
            allowed.has(c!.element),
            `Opening cast "${opId}" (${c!.element}) in "${season.id}" must match [${season.elements.join('/')}]`,
          ).toBe(true);
        }

        for (const guestId of season.specialGuestIds) {
          const c = charMap.get(guestId);
          expect(c, `Missing special guest ${guestId}`).toBeDefined();
          expect(openingSet.has(guestId)).toBe(false);
          expect(
            allowed.has(c!.element),
            `Special guest "${guestId}" (${c!.element}) in "${season.id}" must be outside [${season.elements.join('/')}]`,
          ).toBe(false);
        }
      }
    });

    it('guarantees every banner phase, Abyss cycle, and Theater season has a substantive provenance entry', () => {
      const allScheduleIds = [
        ...BANNER_PHASES.map((b) => b.id),
        ...ABYSS_CYCLES.map((a) => a.id),
        ...THEATER_SEASONS.map((s) => s.id),
        'rotations_v7_2_catalog',
        'talent_scaling_v7_2_curves',
        'enka_id_map_v7_2',
        'artifact_weights_v7_2',
        'team_archetypes_v7_2',
      ];

      for (const id of allScheduleIds) {
        const prov = getProvenance(id);
        expect(prov, `Missing provenance for "${id}"`).toBeDefined();
        expect(prov?.verificationMethod, `Missing verificationMethod for "${id}"`).toBeDefined();
        expect(prov?.verifiedFields?.length, `Missing verifiedFields for "${id}"`).toBeGreaterThan(0);
        expect(prov?.evidence.length, `Evidence too short for "${id}"`).toBeGreaterThanOrEqual(25);
      }
    });

    it('binds GACHA_RULES_VERSION directly to canonical CURRENT_GAME_VERSION', async () => {
      const { GACHA_RULES_VERSION } = await import('./banner-rules');
      expect(GACHA_RULES_VERSION).toBe(CURRENT_GAME_VERSION);
    });

    it('verifies 100% character rotation coverage across all 128 characters', async () => {
      const { CHARACTER_ROTATIONS } = await import('./character-rotations');
      for (const char of CHARACTERS) {
        const rot = CHARACTER_ROTATIONS[char.id.toLowerCase()];
        expect(rot, `Missing rotation profile for "${char.id}"`).toBeDefined();
      }
    });
  });
});
