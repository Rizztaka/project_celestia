import { describe, it, expect } from 'vitest';
import {
  evaluateDatasetFreshness,
  evaluateRecommendationReliability,
  getDatasetFreshnessPolicy,
  parseIsoCalendarDate,
  resolveCanonicalSchedule,
  resolveExplicitDatasetFreshnessPolicy,
  resolveScheduleTemporalState,
} from './recommendation-reliability';
import { getFreshnessInfo, isDatasetStale } from './data-freshness';
import { DATA_PROVENANCE_REGISTRY } from '../data/provenance-registry';
import { CURRENT_GAME_VERSION, PATCH_CYCLE_DAYS } from '../data/game-version';
import type {
  DataProvenance,
  RecommendationMode,
  RecommendationReliability,
} from '../types/genshin';

describe('Central Recommendation Reliability Evaluator (M9 Phase 2)', () => {
  describe('Verification resolution & unified freshness policy', () => {
    it('resolves verified registry records as verified and reliable in current mode', () => {
      const result = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: [
          'weapons_v7_2_signatures',
          'characters_v7_2_batch7',
          'gacha_rules_character_7_2',
        ],
        requiredDatasetIds: [
          'weapons_v7_2_signatures',
          'characters_v7_2_batch7',
          'gacha_rules_character_7_2',
        ],
        evaluatedAt: '2026-11-23',
      });

      expect(result.status).toBe('reliable');
      expect(result.isActionable).toBe(true);
      expect(result.verification).toBe('verified');
      expect(result.temporalState).toBe('not_applicable');
      expect(result.provenanceIds).toEqual([
        'characters_v7_2_batch7',
        'gacha_rules_character_7_2',
        'weapons_v7_2_signatures',
      ]);
      expect(result.warnings).toEqual([]);
    });

    it('preserves provisional records as provisional and never marks them reliable', () => {
      const result = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['season-7-snezhnaya-cryo-hydro-electro'],
        requiredDatasetIds: ['season-7-snezhnaya-cryo-hydro-electro'],
        schedule: { type: 'theater', entityId: 'season-7-snezhnaya-cryo-hydro-electro' },
        evaluatedAt: '2026-11-23',
      });

      expect(result.verification).toBe('provisional');
      expect(result.status).toBe('qualified');
      expect(result.isActionable).toBe(false);
      expect(
        result.warnings.some((w) => w.includes('season-7-snezhnaya-cryo-hydro-electro')),
      ).toBe(true);
    });

    it('treats explicitly stale high-risk required records as stale and unsupported in current mode', () => {
      const result = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['cycle-5-3'],
        requiredDatasetIds: ['cycle-5-3'],
        evaluatedAt: '2026-11-23',
      });

      expect(result.verification).toBe('stale');
      expect(result.status).toBe('unsupported');
      expect(result.isActionable).toBe(false);
      expect(result.warnings.some((w) => w.includes('cycle-5-3'))).toBe(true);
    });

    it('enforces identical dataset-specific freshness policies across evaluator and data-freshness.ts', () => {
      // 42 days after 2026-11-16 is 2026-12-28; 43 days is 2026-12-29; 100 days is 2027-02-24
      const onBoundaryDate = new Date('2026-12-28T12:00:00Z');
      const pastCadenceDate = new Date('2026-12-29T12:00:00Z');
      const farFutureDate = new Date('2027-02-24T12:00:00Z');

      // 1. version_bound does NOT go stale after 42 days in either module
      const charEval = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['characters_v7_2_batch7', 'gacha_rules_character_7_2'],
        evaluatedAt: '2027-02-24',
      });
      expect(charEval.status).toBe('reliable');
      expect(charEval.verification).toBe('verified');
      expect(
        isDatasetStale(DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7, PATCH_CYCLE_DAYS, farFutureDate),
      ).toBe(false);
      expect(getFreshnessInfo('characters_v7_2_batch7', farFutureDate).isStale).toBe(false);

      // 2. patch_cadence uses 42-day review cadence in both modules
      const rotOnBoundary = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['rotations_v7_2_catalog'],
        requiredDatasetIds: ['rotations_v7_2_catalog'],
        evaluatedAt: '2026-12-28',
      });
      expect(rotOnBoundary.verification).toBe('verified');
      expect(
        isDatasetStale(DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog, PATCH_CYCLE_DAYS, onBoundaryDate),
      ).toBe(false);

      const rotPastCadence = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['rotations_v7_2_catalog'],
        requiredDatasetIds: ['rotations_v7_2_catalog'],
        evaluatedAt: '2026-12-29',
      });
      expect(rotPastCadence.status).toBe('qualified');
      expect(rotPastCadence.verification).toBe('stale');
      expect(rotPastCadence.dependencies?.[0].reason).toBe('age_exceeded');
      expect(
        isDatasetStale(DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog, PATCH_CYCLE_DAYS, pastCadenceDate),
      ).toBe(true);

      // 3. sandbox stays provisional forever in both modules
      const sandboxEval = evaluateRecommendationReliability({
        mode: 'sandbox_simulation',
        datasetIds: ['custom-sandbox'],
        requiredDatasetIds: ['custom-sandbox'],
        evaluatedAt: '2027-02-24',
      });
      expect(sandboxEval.verification).toBe('provisional');
      expect(getFreshnessInfo('custom-sandbox', farFutureDate).status).toBe('provisional');
      expect(getFreshnessInfo('custom-sandbox', farFutureDate).isStale).toBe(false);

      // 4. schedule_window uses canonical dates in both modules
      const expiredBanner = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['banner_7_2_phase_1'],
        requiredDatasetIds: ['banner_7_2_phase_1'],
        evaluatedAt: '2026-11-25',
      });
      expect(expiredBanner.verification).toBe('stale');
      expect(expiredBanner.dependencies?.[0].reason).toBe('expired_schedule');
      expect(getFreshnessInfo('banner_7_2_phase_1', new Date('2026-11-25T12:00:00Z')).isExpired).toBe(
        true,
      );
      expect(
        evaluateDatasetFreshness(
          DATA_PROVENANCE_REGISTRY.banner_7_2_phase_1,
          parseIsoCalendarDate('2026-11-25'),
        ).staleReason,
      ).toBe('expired_schedule');
    });

    it('explicitly classifies every registered dataset ID and detects unclassified datasets', () => {
      const allRegisteredIds = Object.keys(DATA_PROVENANCE_REGISTRY);
      expect(allRegisteredIds).toHaveLength(36);

      const patchCadenceIds: string[] = [];
      for (const id of allRegisteredIds) {
        const explicit = resolveExplicitDatasetFreshnessPolicy(id);
        expect(
          explicit,
          `Registered dataset "${id}" must have an explicit freshness policy classification`,
        ).toBeDefined();

        if (explicit?.policy === 'patch_cadence') {
          patchCadenceIds.push(id);
        } else {
          expect(explicit?.maxAgeDays).toBeUndefined();
        }
      }

      expect(patchCadenceIds.sort()).toEqual([
        'artifact_weights_v7_2',
        'rotations_v7_2_catalog',
        'team_archetypes_v7_2',
      ]);

      // Unclassified dataset ID is detected and falls back to conservative high-risk policy
      expect(resolveExplicitDatasetFreshnessPolicy('unclassified_future_dataset_v7_2')).toBeUndefined();
      expect(getDatasetFreshnessPolicy('unclassified_future_dataset_v7_2')).toEqual({
        policy: 'patch_cadence',
        riskTier: 'high',
        maxAgeDays: PATCH_CYCLE_DAYS,
        provisionalActionable: false,
        staleActionable: false,
      });
    });

    it('does not allow thresholdDaysOverride to override schedule_window or version_bound policies', () => {
      const activeDate = parseIsoCalendarDate('2026-11-24');
      const expiredDate = parseIsoCalendarDate('2026-11-25');
      const farFuture = parseIsoCalendarDate('2027-06-01');

      expect(evaluateDatasetFreshness(DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7, farFuture, 1).isStale).toBe(false);
      expect(evaluateDatasetFreshness(DATA_PROVENANCE_REGISTRY.banner_7_2_phase_1, activeDate, 1).isStale).toBe(false);
      expect(evaluateDatasetFreshness(DATA_PROVENANCE_REGISTRY.banner_7_2_phase_1, expiredDate, 9999).isStale).toBe(true);
    });

    it('prevents future-version provenance from becoming verified or actionable in current mode while preserving current-version behavior', () => {
      const futureCharacters: DataProvenance = {
        datasetId: 'characters_v8_0_future',
        version: '8.0',
        verifiedAt: '2026-11-23',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['id', 'element', 'weapon', 'rarity', 'stats'],
        evidence: 'Version 8.0 forward-looking character catalog.',
        status: 'verified',
      };
      const futurePatchWeapons: DataProvenance = {
        datasetId: 'weapons_v7_2_1_future',
        version: '7.2.1',
        verifiedAt: '2026-11-23',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['key', 'baseAtk'],
        evidence: 'Version 7.2.1 hotfix weapon catalog.',
        status: 'verified',
      };
      const registry = {
        ...DATA_PROVENANCE_REGISTRY,
        characters_v8_0_future: futureCharacters,
        weapons_v7_2_1_future: futurePatchWeapons,
      };

      // Future major/minor version (8.0 vs active 7.2): never verified, never reliable/actionable in current mode
      const freshness = evaluateDatasetFreshness(futureCharacters, parseIsoCalendarDate('2026-11-23'));
      expect(freshness.isFutureVersion).toBe(true);
      expect(freshness.isStale).toBe(false);

      const currentFuture = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_v8_0_future', 'weapons_v7_2_signatures'],
          requiredDatasetIds: ['characters_v8_0_future', 'weapons_v7_2_signatures'],
          evaluatedAt: '2026-11-23',
        },
        { provenanceRegistry: registry },
      );
      expect(currentFuture.status).toBe('unsupported');
      expect(currentFuture.isActionable).toBe(false);
      expect(currentFuture.verification).toBe('provisional');
      expect(
        currentFuture.dependencies?.find((d) => d.datasetId === 'characters_v8_0_future')?.reason,
      ).toBe('future_version');
      expect(currentFuture.warnings.some((w) => w.includes('characters_v8_0_future'))).toBe(true);

      // Future patch version (7.2.1 vs active 7.2) is equally blocked in current mode
      const currentFuturePatch = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['weapons_v7_2_1_future'],
          requiredDatasetIds: ['weapons_v7_2_1_future'],
          evaluatedAt: '2026-11-23',
        },
        { provenanceRegistry: registry },
      );
      expect(currentFuturePatch.status).toBe('unsupported');
      expect(currentFuturePatch.isActionable).toBe(false);
      expect(currentFuturePatch.verification).toBe('provisional');

      // Planning preview allows future-version data only as qualified and non-actionable
      const previewFuture = evaluateRecommendationReliability(
        {
          mode: 'planning_preview',
          datasetIds: ['characters_v8_0_future'],
          requiredDatasetIds: ['characters_v8_0_future'],
          evaluatedAt: '2026-11-23',
        },
        { provenanceRegistry: registry },
      );
      expect(previewFuture.status).toBe('qualified');
      expect(previewFuture.isActionable).toBe(false);
      expect(previewFuture.verification).toBe('provisional');

      // Legacy data-freshness.ts agrees: future-version record is provisional, never verified
      const legacyInfo = getFreshnessInfo(futureCharacters, new Date('2026-11-23T12:00:00Z'));
      expect(legacyInfo.status).toBe('provisional');
      expect(legacyInfo.badgeLabel).toBe('Provisional v8.0');

      // Normal current-version (7.2) version-bound datasets remain verified, reliable, and actionable
      const normalCurrent = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        requiredDatasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        evaluatedAt: '2027-02-24',
      });
      expect(normalCurrent.status).toBe('reliable');
      expect(normalCurrent.isActionable).toBe(true);
      expect(normalCurrent.verification).toBe('verified');
      expect(
        evaluateDatasetFreshness(DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7, parseIsoCalendarDate('2027-02-24')).isFutureVersion,
      ).toBe(false);
    });

    it('resolves unknown and version-like unregistered IDs as unregistered and unsupported', () => {
      for (const unknownId of ['arbitrary_unregistered_dataset', 'banner_5_0_phase_1']) {
        const result = evaluateRecommendationReliability({
          mode: 'current',
          datasetIds: [unknownId],
          requiredDatasetIds: [unknownId],
          evaluatedAt: '2026-11-23',
        });

        expect(result.verification).toBe('unregistered');
        expect(result.status).toBe('unsupported');
        expect(result.isActionable).toBe(false);
        expect(result.provenanceIds).toEqual([]);
        expect(result.warnings.some((w) => w.includes(unknownId))).toBe(true);
      }
    });

    it('does not falsely infer verification from URL, version string, or registry existence when metadata is missing', () => {
      const unsubstantiated: DataProvenance = {
        datasetId: 'characters_unsubstantiated_test',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-11-20',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Has a URL and current version but lacks verificationMethod and verifiedFields.',
        status: 'verified',
      };

      const result = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_unsubstantiated_test'],
          requiredDatasetIds: ['characters_unsubstantiated_test'],
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            characters_unsubstantiated_test: unsubstantiated,
          },
        },
      );

      expect(result.verification).toBe('provisional');
      expect(result.status).toBe('qualified');
      expect(result.isActionable).toBe(false);
      expect(result.dependencies?.[0].reason).toBe('insufficient_verification_metadata');
    });

    it('marks a record with an invalid verifiedAt date as stale and unsupported under high-risk policy', () => {
      const brokenDate: DataProvenance = {
        datasetId: 'characters_bad_date_test',
        version: CURRENT_GAME_VERSION,
        verifiedAt: '2026-02-30',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['id'],
        evidence: 'Invalid calendar date test fixture.',
        status: 'verified',
      };

      const result = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_bad_date_test'],
          requiredDatasetIds: ['characters_bad_date_test'],
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            characters_bad_date_test: brokenDate,
          },
        },
      );

      expect(result.verification).toBe('stale');
      expect(result.status).toBe('unsupported');
      expect(result.isActionable).toBe(false);
      expect(result.dependencies?.[0].reason).toBe('invalid_date');
    });
  });

  describe('Temporal resolution (canonical schedule entities)', () => {
    it('evaluates Banner boundary dates accurately (inclusive [startDate, endDate])', () => {
      // banner_7_2_phase_1: 2026-11-04 to 2026-11-24
      const window = resolveCanonicalSchedule({ type: 'banner', entityId: 'banner_7_2_phase_1' });
      expect(window).toBeDefined();
      expect(resolveScheduleTemporalState(window, '2026-11-03')).toBe('upcoming');
      expect(resolveScheduleTemporalState(window, '2026-11-04')).toBe('active');
      expect(resolveScheduleTemporalState(window, '2026-11-24')).toBe('active');
      expect(resolveScheduleTemporalState(window, '2026-11-25')).toBe('expired');
    });

    it('evaluates Abyss boundary dates accurately (inclusive [effectiveStartDate, effectiveEndDate])', () => {
      // cycle-7-2: 2026-11-16 to 2026-12-16
      const window = resolveCanonicalSchedule({ type: 'abyss', entityId: 'cycle-7-2' });
      expect(window).toBeDefined();
      expect(resolveScheduleTemporalState(window, '2026-11-15')).toBe('upcoming');
      expect(resolveScheduleTemporalState(window, '2026-11-16')).toBe('active');
      expect(resolveScheduleTemporalState(window, '2026-12-16')).toBe('active');
      expect(resolveScheduleTemporalState(window, '2026-12-17')).toBe('expired');
    });

    it('evaluates Theater boundary dates accurately (half-open [effectiveStartDate, effectiveEndDate))', () => {
      // season-7-2-hydro-electro-geo: 2026-11-01 to 2026-12-01 (final active day: 2026-11-30)
      const novWindow = resolveCanonicalSchedule({
        type: 'theater',
        entityId: 'season-7-2-hydro-electro-geo',
      });
      expect(novWindow).toBeDefined();
      expect(resolveScheduleTemporalState(novWindow, '2026-10-31')).toBe('upcoming');
      expect(resolveScheduleTemporalState(novWindow, '2026-11-01')).toBe('active');
      expect(resolveScheduleTemporalState(novWindow, '2026-11-30')).toBe('active');
      expect(resolveScheduleTemporalState(novWindow, '2026-12-01')).toBe('expired');
      expect(resolveScheduleTemporalState(novWindow, '2026-12-02')).toBe('expired');

      // season-7-2-dec-pyro-hydro-geo: 2026-12-01 to 2027-01-01 (final active day: 2026-12-31)
      const decWindow = resolveCanonicalSchedule({
        type: 'theater',
        entityId: 'season-7-2-dec-pyro-hydro-geo',
      });
      expect(decWindow).toBeDefined();
      expect(resolveScheduleTemporalState(decWindow, '2026-11-30')).toBe('upcoming');
      expect(resolveScheduleTemporalState(decWindow, '2026-12-01')).toBe('active');
      expect(resolveScheduleTemporalState(decWindow, '2026-12-31')).toBe('active');
      expect(resolveScheduleTemporalState(decWindow, '2027-01-01')).toBe('expired');
    });

    it('returns unsupported for unknown schedule IDs without substituting an active schedule', () => {
      for (const type of ['banner', 'abyss', 'theater'] as const) {
        const result = evaluateRecommendationReliability({
          mode: 'current',
          datasetIds: ['characters_v7_2_batch7'],
          requiredDatasetIds: ['characters_v7_2_batch7'],
          schedule: { type, entityId: `unknown-${type}-id` },
          evaluatedAt: '2026-11-23',
        });

        expect(result.status).toBe('unsupported');
        expect(result.isActionable).toBe(false);
        expect(result.temporalState).toBe('not_applicable');
        expect(result.warnings.some((w) => w.includes(`unknown-${type}-id`))).toBe(true);
      }
    });

    it('returns not_applicable for non-scheduled datasets and avoids UTC/offset shift issues', () => {
      const result = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7'],
        evaluatedAt: '2026-11-24T00:30:00Z',
      });

      expect(result.temporalState).toBe('not_applicable');
      expect(result.evaluatedAt).toBe('2026-11-24');
      expect(parseIsoCalendarDate('2026-11-24T01:00:00+05:30')?.dateStr).toBe('2026-11-23');
      expect(parseIsoCalendarDate('2026-02-30')).toBeNull();
      expect(parseIsoCalendarDate('2026-11-24T12:00:00')).toBeNull();
    });
  });

  describe('Recommendation modes & archive-mode stale distinction', () => {
    it('returns reliable and actionable in current mode for verified active schedules, and rejects upcoming or expired schedules as unsupported and non-actionable', () => {
      const active = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-7-2' },
        evaluatedAt: '2026-11-23',
      });
      expect(active.status).toBe('reliable');
      expect(active.isActionable).toBe(true);
      expect(active.temporalState).toBe('active');

      const upcomingInCurrent = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        schedule: { type: 'banner', entityId: 'banner_7_2_phase_2' },
        evaluatedAt: '2026-11-20',
      });
      expect(upcomingInCurrent.status).toBe('unsupported');
      expect(upcomingInCurrent.isActionable).toBe(false);
      expect(upcomingInCurrent.temporalState).toBe('upcoming');

      const expiredInCurrent = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['banner_7_2_phase_1', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['banner_7_2_phase_1', 'gacha_rules_character_7_2'],
        schedule: { type: 'banner', entityId: 'banner_7_2_phase_1' },
        evaluatedAt: '2026-11-25',
      });
      expect(expiredInCurrent.status).toBe('unsupported');
      expect(expiredInCurrent.isActionable).toBe(false);
      expect(expiredInCurrent.temporalState).toBe('expired');
    });

    it('returns qualified, non-actionable results for upcoming content in planning_preview mode', () => {
      const preview = evaluateRecommendationReliability({
        mode: 'planning_preview',
        datasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        schedule: { type: 'banner', entityId: 'banner_7_2_phase_2' },
        evaluatedAt: '2026-11-20',
      });

      expect(preview.status).toBe('qualified');
      expect(preview.mode).toBe('planning_preview');
      expect(preview.isActionable).toBe(false);
      expect(preview.verification).toBe('verified');
      expect(preview.temporalState).toBe('upcoming');
      expect(
        preview.warnings.some((w) => /upcoming/i.test(w) && w.includes('banner_7_2_phase_2')),
      ).toBe(true);
    });

    it('accepts expired verified schedules and attested historical schedule archives as historical', () => {
      // Case 1a: Verified schedule that expired naturally (banner_7_2_phase_1 after 2026-11-24)
      const expiredVerifiedBanner = evaluateRecommendationReliability({
        mode: 'archive_simulation',
        datasetIds: ['banner_7_2_phase_1', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['banner_7_2_phase_1', 'gacha_rules_character_7_2'],
        schedule: { type: 'banner', entityId: 'banner_7_2_phase_1' },
        evaluatedAt: '2026-11-25',
      });
      expect(expiredVerifiedBanner.status).toBe('historical');
      expect(expiredVerifiedBanner.isActionable).toBe(false);
      expect(expiredVerifiedBanner.temporalState).toBe('expired');
      expect(expiredVerifiedBanner.provenanceIds).toContain('banner_7_2_phase_1');

      // Case 1b: Registered prior-version historical schedule archives (Abyss & Theater)
      const archiveAbyss = evaluateRecommendationReliability({
        mode: 'archive_simulation',
        datasetIds: ['cycle-5-3', 'characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        schedule: { type: 'abyss', entityId: 'cycle-5-3' },
        evaluatedAt: '2026-11-23',
      });
      expect(archiveAbyss.status).toBe('historical');
      expect(archiveAbyss.isActionable).toBe(false);
      expect(archiveAbyss.temporalState).toBe('expired');

      const archiveTheater = evaluateRecommendationReliability({
        mode: 'archive_simulation',
        datasetIds: ['season-natlan-pyro-hydro-anemo', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['season-natlan-pyro-hydro-anemo', 'characters_v7_2_batch7'],
        schedule: { type: 'theater', entityId: 'season-natlan-pyro-hydro-anemo' },
        evaluatedAt: '2026-11-23',
      });
      expect(archiveTheater.status).toBe('historical');
      expect(archiveTheater.isActionable).toBe(false);
    });

    it('preserves isExpired and canonical end date for expired prior-version schedules and enforces archive rules', () => {
      const priorVersionVerifiedCycle: DataProvenance = {
        datasetId: 'cycle-5-3',
        version: '5.3',
        verifiedAt: '2025-01-01',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['chambers', 'enemies', 'hp', 'baseRes', 'shields'],
        evidence: 'Version 5.3 Spiral Abyss Floor 12 verified record.',
        status: 'verified',
      };

      const freshness = evaluateDatasetFreshness(
        priorVersionVerifiedCycle,
        parseIsoCalendarDate('2026-11-23'),
      );
      expect(freshness.isStale).toBe(true);
      expect(freshness.staleReason).toBe('outdated_version');
      expect(freshness.isExpired).toBe(true);
      expect(freshness.canonicalEndDate).toBe('2025-02-01');

      const archiveResult = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            'cycle-5-3': priorVersionVerifiedCycle,
          },
        },
      );
      expect(archiveResult.status).toBe('historical');
      expect(archiveResult.isActionable).toBe(false);
      expect(archiveResult.temporalState).toBe('expired');
    });

    it('rejects explicitly compromised stale data in archive_simulation mode', () => {
      // Compromised non-schedule required dependency (weapons explicitly marked stale)
      const compromisedWeapons: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures,
        status: 'stale',
        evidence: 'Compromised passive refinement data; pending re-audit.',
      };
      const withCompromisedCore = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'weapons_v7_2_signatures'],
          requiredDatasetIds: ['cycle-5-3', 'weapons_v7_2_signatures'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            weapons_v7_2_signatures: compromisedWeapons,
          },
        },
      );
      expect(withCompromisedCore.status).toBe('unsupported');
      expect(withCompromisedCore.isActionable).toBe(false);
      expect(withCompromisedCore.warnings.some((w) => w.includes('weapons_v7_2_signatures'))).toBe(
        true,
      );

      // Compromised schedule explicitly marked stale on current version (even after end date)
      const compromisedCurrentCycle: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY['cycle-7-2'],
        status: 'stale',
        evidence: 'Compromised enemy HP multipliers; data reliability unconfirmed.',
      };
      const withCompromisedSchedule = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-7-2' },
          evaluatedAt: '2026-12-20',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            'cycle-7-2': compromisedCurrentCycle,
          },
        },
      );
      expect(withCompromisedSchedule.status).toBe('unsupported');
      expect(withCompromisedSchedule.isActionable).toBe(false);

      // Prior-version schedule explicitly marked stale with non-archive compromised evidence
      const compromisedHistorical: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY['cycle-5-3'],
        status: 'stale',
        evidence: 'Compromised resistance values detected during audit; do not use.',
      };
      const withCompromisedArchive = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            'cycle-5-3': compromisedHistorical,
          },
        },
      );
      expect(withCompromisedArchive.status).toBe('unsupported');
      expect(withCompromisedArchive.isActionable).toBe(false);

      // Historical Archive prefix cannot bypass explicit compromise language in evidence
      const compromisedWithPrefix: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY['cycle-5-3'],
        status: 'stale',
        evidence: 'Historical Archive · Compromised resistance values; do not use.',
      };
      const withCompromisedPrefix = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            'cycle-5-3': compromisedWithPrefix,
          },
        },
      );
      expect(withCompromisedPrefix.status).toBe('unsupported');
      expect(withCompromisedPrefix.isActionable).toBe(false);
    });

    it('prevents archive_simulation from classifying future-version provenance as historical while preserving older-version archives', () => {
      const futureVerifiedCore: DataProvenance = {
        datasetId: 'characters_v8_0_future',
        version: '8.0',
        verifiedAt: '2026-11-23',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        verificationMethod: 'in_game_verification',
        verifiedFields: ['id', 'stats'],
        evidence: 'Version 8.0 character snapshot.',
        status: 'verified',
      };
      const futureStaleWithPrefix: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY['cycle-5-3'],
        version: '8.0',
        status: 'stale',
        evidence: 'Historical Archive · Future Version 8.0 Abyss cycle.',
      };
      const registry = {
        ...DATA_PROVENANCE_REGISTRY,
        characters_v8_0_future: futureVerifiedCore,
        'cycle-5-3': futureStaleWithPrefix,
      };

      // Future-version verified supporting dependency cannot produce historical status
      const archiveWithFutureCore = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-7-1', 'characters_v8_0_future'],
          requiredDatasetIds: ['cycle-7-1', 'characters_v8_0_future'],
          schedule: { type: 'abyss', entityId: 'cycle-7-1' },
          evaluatedAt: '2026-11-23',
        },
        { provenanceRegistry: registry },
      );
      expect(archiveWithFutureCore.status).toBe('unsupported');
      expect(archiveWithFutureCore.isActionable).toBe(false);
      expect(archiveWithFutureCore.warnings.some((w) => w.includes('characters_v8_0_future'))).toBe(true);

      // Future-version stale schedule with Historical Archive prefix is still rejected
      const archiveWithFutureSchedule = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        { provenanceRegistry: registry },
      );
      expect(archiveWithFutureSchedule.status).toBe('unsupported');
      expect(archiveWithFutureSchedule.isActionable).toBe(false);

      // Older-version historical schedule archive (5.3) remains historical in the default registry
      const validOlderArchive = evaluateRecommendationReliability({
        mode: 'archive_simulation',
        datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-5-3' },
        evaluatedAt: '2026-11-23',
      });
      expect(validOlderArchive.status).toBe('historical');
      expect(validOlderArchive.isActionable).toBe(false);
      expect(validOlderArchive.temporalState).toBe('expired');
    });

    it('rejects unregistered data and records lacking substantive verification metadata in archive_simulation mode', () => {
      // Unregistered historical schedule ID never falls back to active cycle-7-2
      const unregisteredArchive = evaluateRecommendationReliability({
        mode: 'archive_simulation',
        datasetIds: ['cycle-4-8', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['cycle-4-8', 'characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-4-8' },
        evaluatedAt: '2026-11-23',
      });
      expect(unregisteredArchive.status).toBe('unsupported');
      expect(unregisteredArchive.isActionable).toBe(false);
      expect(unregisteredArchive.provenanceIds).not.toContain('cycle-7-2');

      // Record lacking substantive verification metadata (no verificationMethod / verifiedFields)
      const unsubstantiatedArchive: DataProvenance = {
        datasetId: 'cycle-5-3',
        version: '5.3',
        verifiedAt: '2025-01-01',
        sourceUrl: 'https://genshin.hoyoverse.com/en/news',
        evidence: 'Historical Archive · Version 5.3 Floor 12 without method or fields.',
        status: 'stale',
      };
      const missingMetaArchive = evaluateRecommendationReliability(
        {
          mode: 'archive_simulation',
          datasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          requiredDatasetIds: ['cycle-5-3', 'characters_v7_2_batch7'],
          schedule: { type: 'abyss', entityId: 'cycle-5-3' },
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            'cycle-5-3': unsubstantiatedArchive,
          },
        },
      );
      expect(missingMetaArchive.status).toBe('unsupported');
      expect(missingMetaArchive.isActionable).toBe(false);
      expect(
        missingMetaArchive.warnings.some((w) => /verification metadata/i.test(w)),
      ).toBe(true);
    });

    it('returns qualified, non-actionable results in sandbox_simulation mode without suppressing warnings', () => {
      const sandbox = evaluateRecommendationReliability({
        mode: 'sandbox_simulation',
        datasetIds: ['custom-sandbox', 'characters_v7_2_batch7', 'rotations_v7_2_catalog'],
        requiredDatasetIds: ['custom-sandbox', 'characters_v7_2_batch7', 'rotations_v7_2_catalog'],
        evaluatedAt: '2027-01-05', // rotations_v7_2_catalog is stale (>42d)
      });

      expect(sandbox.status).toBe('qualified');
      expect(sandbox.mode).toBe('sandbox_simulation');
      expect(sandbox.isActionable).toBe(false);
      expect(sandbox.verification).toBe('stale');
      expect(sandbox.warnings.some((w) => /sandbox/i.test(w))).toBe(true);
      expect(sandbox.warnings.some((w) => w.includes('rotations_v7_2_catalog'))).toBe(true);
    });

    it('handles unregistered custom sandbox IDs consistently as unregistered and unsupported', () => {
      const unregisteredSandbox = evaluateRecommendationReliability({
        mode: 'sandbox_simulation',
        datasetIds: ['custom-pyro-hydro-geo', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['custom-pyro-hydro-geo', 'characters_v7_2_batch7'],
        evaluatedAt: '2026-11-23',
      });

      expect(unregisteredSandbox.status).toBe('unsupported');
      expect(unregisteredSandbox.isActionable).toBe(false);
      expect(unregisteredSandbox.verification).toBe('unregistered');
      expect(unregisteredSandbox.provenanceIds).toEqual(['characters_v7_2_batch7']);
      expect(
        unregisteredSandbox.warnings.some((w) => w.includes('custom-pyro-hydro-geo')),
      ).toBe(true);

      // Matches data-freshness.ts status for the exact same unregistered custom ID
      expect(
        getFreshnessInfo('custom-pyro-hydro-geo', new Date('2026-11-23T12:00:00Z')).status,
      ).toBe('unregistered');
    });
  });

  describe('Dependency aggregation, optional isolation & determinism', () => {
    it('returns qualified with dataset-specific warning when one required advisory dependency is provisional', () => {
      const provisionalRotation: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog,
        status: 'provisional',
      };

      const result = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures', 'rotations_v7_2_catalog'],
          requiredDatasetIds: [
            'characters_v7_2_batch7',
            'weapons_v7_2_signatures',
            'rotations_v7_2_catalog',
          ],
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            rotations_v7_2_catalog: provisionalRotation,
          },
        },
      );

      expect(result.status).toBe('qualified');
      expect(result.verification).toBe('provisional');
      expect(result.isActionable).toBe(true);
      expect(result.warnings.some((w) => w.includes('rotations_v7_2_catalog'))).toBe(true);
    });

    it('distinguishes low-risk stale required dependencies (qualified) from high-risk stale ones (unsupported)', () => {
      const lowRiskStale = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7', 'artifact_weights_v7_2'],
        requiredDatasetIds: ['characters_v7_2_batch7', 'artifact_weights_v7_2'],
        evaluatedAt: '2027-01-10',
      });
      expect(getDatasetFreshnessPolicy('artifact_weights_v7_2').riskTier).toBe('low');
      expect(lowRiskStale.status).toBe('qualified');
      expect(lowRiskStale.isActionable).toBe(true);
      expect(lowRiskStale.warnings.some((w) => w.includes('artifact_weights_v7_2'))).toBe(true);

      const outdatedCore: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures,
        version: '7.1',
      };
      const highRiskStale = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
          requiredDatasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            weapons_v7_2_signatures: outdatedCore,
          },
        },
      );
      expect(getDatasetFreshnessPolicy('weapons_v7_2_signatures').riskTier).toBe('high');
      expect(highRiskStale.status).toBe('unsupported');
      expect(highRiskStale.isActionable).toBe(false);
      expect(highRiskStale.warnings.some((w) => w.includes('weapons_v7_2_signatures'))).toBe(true);

      // Explicitly compromised low-risk dataset (explicit_stale) is NOT actionable even though low-risk
      const explicitlyStaleRotation: DataProvenance = {
        ...DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog,
        status: 'stale',
      };
      const compromisedLowRisk = evaluateRecommendationReliability(
        {
          mode: 'current',
          datasetIds: ['characters_v7_2_batch7', 'rotations_v7_2_catalog'],
          requiredDatasetIds: ['characters_v7_2_batch7', 'rotations_v7_2_catalog'],
          evaluatedAt: '2026-11-23',
        },
        {
          provenanceRegistry: {
            ...DATA_PROVENANCE_REGISTRY,
            rotations_v7_2_catalog: explicitlyStaleRotation,
          },
        },
      );
      expect(compromisedLowRisk.status).toBe('qualified');
      expect(compromisedLowRisk.isActionable).toBe(false);
      expect(compromisedLowRisk.warnings.some((w) => w.includes('rotations_v7_2_catalog'))).toBe(
        true,
      );
    });

    it('guarantees optional missing, provisional, and stale dependencies never affect aggregate verification or status while still producing warnings', () => {
      const baseline = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        requiredDatasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        evaluatedAt: '2026-11-23',
      });

      const withMixedOptionals = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: [
          'characters_v7_2_batch7',
          'weapons_v7_2_signatures',
          'optional_unregistered_notes',
          'season-7-snezhnaya-cryo-hydro-electro', // provisional optional
          'cycle-5-3', // explicitly stale optional
        ],
        requiredDatasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        evaluatedAt: '2026-11-23',
      });

      expect(withMixedOptionals.status).toBe(baseline.status);
      expect(withMixedOptionals.isActionable).toBe(baseline.isActionable);
      expect(withMixedOptionals.verification).toBe(baseline.verification);
      expect(withMixedOptionals.status).toBe('reliable');
      expect(withMixedOptionals.verification).toBe('verified');

      // provenanceIds contains ONLY registered datasets, in ascending code-unit order
      expect(withMixedOptionals.provenanceIds).toEqual([
        'characters_v7_2_batch7',
        'cycle-5-3',
        'season-7-snezhnaya-cryo-hydro-electro',
        'weapons_v7_2_signatures',
      ]);
      expect(withMixedOptionals.provenanceIds).not.toContain('optional_unregistered_notes');

      // All three problematic optional dependencies emit warnings
      expect(
        withMixedOptionals.warnings.some((w) => w.includes('optional_unregistered_notes')),
      ).toBe(true);
      expect(
        withMixedOptionals.warnings.some((w) =>
          w.includes('season-7-snezhnaya-cryo-hydro-electro'),
        ),
      ).toBe(true);
      expect(withMixedOptionals.warnings.some((w) => w.includes('cycle-5-3'))).toBe(true);
    });

    it('handles duplicate dataset IDs, input permutations, and warning deduplication deterministically', () => {
      const orderA = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: [
          'weapons_v7_2_signatures',
          'optional_missing_b',
          'characters_v7_2_batch7',
          'rotations_v7_2_catalog',
          'weapons_v7_2_signatures',
          'optional_missing_a',
          'optional_missing_b',
        ],
        requiredDatasetIds: [
          'rotations_v7_2_catalog',
          'weapons_v7_2_signatures',
          'characters_v7_2_batch7',
          'rotations_v7_2_catalog',
        ],
        evaluatedAt: '2027-01-05',
      });

      const orderB = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: [
          'optional_missing_a',
          'characters_v7_2_batch7',
          'rotations_v7_2_catalog',
          'optional_missing_b',
          'weapons_v7_2_signatures',
        ],
        requiredDatasetIds: [
          'characters_v7_2_batch7',
          'rotations_v7_2_catalog',
          'weapons_v7_2_signatures',
        ],
        evaluatedAt: '2027-01-05',
      });

      expect(orderA).toEqual(orderB);
      expect(orderA.provenanceIds).toEqual([
        'characters_v7_2_batch7',
        'rotations_v7_2_catalog',
        'weapons_v7_2_signatures',
      ]);
      expect(orderA.dependencies?.map((d) => d.datasetId)).toEqual([
        'characters_v7_2_batch7',
        'optional_missing_a',
        'optional_missing_b',
        'rotations_v7_2_catalog',
        'weapons_v7_2_signatures',
      ]);
      // Required warnings precede optional warnings in sorted datasetId order, with no duplicates
      expect(orderA.warnings).toHaveLength(new Set(orderA.warnings).size);
      expect(orderA.warnings[0]).toContain('rotations_v7_2_catalog');
      expect(orderA.warnings[1]).toContain('optional_missing_a');
      expect(orderA.warnings[2]).toContain('optional_missing_b');
    });

    it('validates RecommendationMode at runtime and rejects invalid modes deterministically', () => {
      const invalidMode = evaluateRecommendationReliability({
        mode: 'future_unapproved_mode' as unknown as RecommendationMode,
        datasetIds: ['characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7'],
        evaluatedAt: '2026-11-23',
      });

      expect(invalidMode.status).toBe('unsupported');
      expect(invalidMode.mode).toBe('current');
      expect(invalidMode.isActionable).toBe(false);
      expect(invalidMode.verification).toBe('unregistered');
      expect(invalidMode.provenanceIds).toEqual([]);
      expect(invalidMode.evaluatedAt).toBe('2026-11-23');
      expect(invalidMode.warnings[0]).toContain('Invalid evaluation context');
      expect(invalidMode.warnings[0]).toContain('future_unapproved_mode');
      expect(invalidMode.warnings[0]).toContain('invalid-context placeholder');
      expect(structuredClone(invalidMode)).toEqual(invalidMode);
    });

    it('rejects empty datasetIds and empty requiredDatasetIds so an empty dependency context can never become reliable or actionable', () => {
      const bothEmpty = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: [],
        requiredDatasetIds: [],
        evaluatedAt: '2026-11-23',
      });
      expect(bothEmpty.status).toBe('unsupported');
      expect(bothEmpty.isActionable).toBe(false);
      expect(bothEmpty.verification).toBe('unregistered');

      const emptyRequiredWithActiveSchedule = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        requiredDatasetIds: [],
        schedule: { type: 'abyss', entityId: 'cycle-7-2' },
        evaluatedAt: '2026-11-23',
      });
      expect(emptyRequiredWithActiveSchedule.status).toBe('unsupported');
      expect(emptyRequiredWithActiveSchedule.isActionable).toBe(false);
      expect(emptyRequiredWithActiveSchedule.verification).toBe('unregistered');
    });

    it('enforces schedule/dependency linkage so a valid unrelated or omitted schedule cannot make a recommendation reliable', () => {
      // Omitted schedule entity from datasetIds & requiredDatasetIds
      const omittedScheduleDep = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-7-2' },
        evaluatedAt: '2026-11-23',
      });
      expect(omittedScheduleDep.status).toBe('unsupported');
      expect(omittedScheduleDep.isActionable).toBe(false);
      expect(omittedScheduleDep.temporalState).toBe('active');
      expect(omittedScheduleDep.warnings.some((w) => w.includes('cycle-7-2'))).toBe(true);

      // Schedule entity listed only as optional (not required)
      const optionalOnlyScheduleDep = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-7-2' },
        evaluatedAt: '2026-11-23',
      });
      expect(optionalOnlyScheduleDep.status).toBe('unsupported');
      expect(optionalOnlyScheduleDep.isActionable).toBe(false);

      // Correctly linked active schedule -> reliable & actionable
      const linkedScheduleDep = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        requiredDatasetIds: ['cycle-7-2', 'characters_v7_2_batch7'],
        schedule: { type: 'abyss', entityId: 'cycle-7-2' },
        evaluatedAt: '2026-11-23',
      });
      expect(linkedScheduleDep.status).toBe('reliable');
      expect(linkedScheduleDep.isActionable).toBe(true);
      expect(linkedScheduleDep.temporalState).toBe('active');

      // Upcoming schedule dataset in requiredDatasetIds even without context.schedule -> unsupported
      const unscheduledUpcomingDep = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        requiredDatasetIds: ['banner_7_2_phase_2', 'gacha_rules_character_7_2'],
        evaluatedAt: '2026-11-20',
      });
      expect(unscheduledUpcomingDep.status).toBe('unsupported');
      expect(unscheduledUpcomingDep.isActionable).toBe(false);
      expect(unscheduledUpcomingDep.warnings.some((w) => w.includes('banner_7_2_phase_2'))).toBe(true);
    });

    it('rejects invalid contexts when requiredDatasetIds is not a subset of datasetIds or evaluatedAt is invalid', () => {
      const notSubset = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7', 'weapons_v7_2_signatures'],
        evaluatedAt: '2026-11-23',
      });
      expect(notSubset.status).toBe('unsupported');
      expect(notSubset.isActionable).toBe(false);
      expect(notSubset.warnings[0]).toContain('weapons_v7_2_signatures');

      const badDate = evaluateRecommendationReliability({
        mode: 'current',
        datasetIds: ['characters_v7_2_batch7'],
        requiredDatasetIds: ['characters_v7_2_batch7'],
        evaluatedAt: 'not-a-date',
      });
      expect(badDate.status).toBe('unsupported');
      expect(badDate.isActionable).toBe(false);
    });
  });

  describe('Serialization, structured-clone & plain-data guarantees', () => {
    it('returns JSON-serializable and structuredClone-safe results free of non-plain objects', () => {
      const input = {
        mode: 'current' as const,
        datasetIds: [
          'cycle-7-2',
          'characters_v7_2_batch7',
          'rotations_v7_2_catalog',
          'optional_unregistered_extra',
        ],
        requiredDatasetIds: ['cycle-7-2', 'characters_v7_2_batch7', 'rotations_v7_2_catalog'],
        schedule: { type: 'abyss' as const, entityId: 'cycle-7-2' },
        evaluatedAt: '2026-12-10',
      };

      const first = evaluateRecommendationReliability(input);
      const second = evaluateRecommendationReliability(input);
      expect(first).toEqual(second);

      const jsonRoundTrip = JSON.parse(JSON.stringify(first)) as RecommendationReliability;
      expect(jsonRoundTrip).toEqual(first);

      const cloned = structuredClone(first);
      expect(cloned).toEqual(first);

      const assertPlainData = (value: unknown): void => {
        if (value === null || value === undefined) return;
        expect(typeof value).not.toBe('function');
        if (typeof value === 'object') {
          expect(value instanceof Date).toBe(false);
          expect(value instanceof Map).toBe(false);
          expect(value instanceof Set).toBe(false);
          if (Array.isArray(value)) {
            value.forEach(assertPlainData);
          } else {
            expect(Object.getPrototypeOf(value)).toBe(Object.prototype);
            Object.values(value).forEach(assertPlainData);
          }
        }
      };

      assertPlainData(first);
    });
  });
});

