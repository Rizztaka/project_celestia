import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type {
  DataProvenance,
  RecommendationReliability,
  ReliabilityDependencyDetail,
} from '../types/genshin';
import { DATA_PROVENANCE_REGISTRY } from '../data/provenance-registry';
import { BANNER_PHASES } from '../data/banners';

vi.mock('./recommendation-reliability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./recommendation-reliability')>();
  return {
    ...actual,
    evaluateRecommendationReliability: vi.fn(actual.evaluateRecommendationReliability),
    evaluateDatasetFreshness: vi.fn(actual.evaluateDatasetFreshness),
  };
});

vi.mock('./data-freshness', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./data-freshness')>();
  return {
    ...actual,
    isDatasetStale: vi.fn(actual.isDatasetStale),
    isScheduleExpired: vi.fn(actual.isScheduleExpired),
    getFreshnessInfo: vi.fn(actual.getFreshnessInfo),
  };
});

vi.mock('./engine-reliability', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./engine-reliability')>();
  return {
    ...actual,
    evaluateEngineBoundaryReliability: vi.fn(actual.evaluateEngineBoundaryReliability),
    evaluateScheduledEngineReliability: vi.fn(actual.evaluateScheduledEngineReliability),
  };
});

import * as recommendationReliability from './recommendation-reliability';
import * as dataFreshness from './data-freshness';
import * as engineReliability from './engine-reliability';
import {
  formatReliabilityPresentation,
  selectDefaultBannerId,
  type FormattedDependencyRow,
} from './reliability-presentation';

function expectNoAuxiliaryProvenance(row: FormattedDependencyRow): void {
  expect(row.evidence).toBeUndefined();
  expect(row.verificationMethod).toBeUndefined();
  expect(row.verifiedFields).toBeUndefined();
  expect(row.sourceUrl).toBeUndefined();
}

function buildEnvelope(
  overrides: Partial<RecommendationReliability> = {},
): RecommendationReliability {
  return {
    status: 'reliable',
    mode: 'current',
    isActionable: true,
    verification: 'verified',
    temporalState: 'not_applicable',
    provenanceIds: [],
    warnings: [],
    dependencies: [],
    evaluatedAt: '2026-11-23',
    ...overrides,
  };
}

function makeDepFromRecord(
  record: DataProvenance,
  overrides: Partial<ReliabilityDependencyDetail> = {},
): ReliabilityDependencyDetail {
  return {
    datasetId: record.datasetId,
    required: true,
    verification: record.status,
    policy: 'version_bound',
    riskTier: 'high',
    version: record.version,
    verifiedAt: record.verifiedAt,
    ...overrides,
  };
}

describe('Reliability Presentation Service (M9 Phase 4 — Slice 1)', () => {
  const temporaryRegistryKeys: string[] = [];

  function registerTempProvenance(key: string, record: DataProvenance): void {
    temporaryRegistryKeys.push(key);
    DATA_PROVENANCE_REGISTRY[key] = record;
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    while (temporaryRegistryKeys.length > 0) {
      const key = temporaryRegistryKeys.pop();
      if (key !== undefined) {
        delete DATA_PROVENANCE_REGISTRY[key];
      }
    }
  });

  describe('Strict 7-predicate dependency-to-provenance matching — all 8 status-compatibility combinations', () => {
    const verifiedRecord = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
    const provisionalRecord =
      DATA_PROVENANCE_REGISTRY['season-7-snezhnaya-cryo-hydro-electro'];
    const staleRecord = DATA_PROVENANCE_REGISTRY['cycle-5-3'];

    it('1. matches verified dependency with verified registry record and attaches provenance', () => {
      const dep = makeDepFromRecord(verifiedRecord, { verification: 'verified' });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [verifiedRecord.datasetId],
          dependencies: [dep],
        }),
      );

      expect(model.requiredDependencies).toHaveLength(1);
      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('matched');
      expect(row.evidence).toBe(verifiedRecord.evidence);
      expect(row.verificationMethod).toBe(verifiedRecord.verificationMethod);
      expect(row.verifiedFields).toEqual(verifiedRecord.verifiedFields);
      expect(row.sourceUrl).toBe(verifiedRecord.sourceUrl);
    });

    it('2. rejects verified dependency against provisional registry record (unmatched, fail-closed)', () => {
      const dep = makeDepFromRecord(provisionalRecord, {
        verification: 'verified',
        policy: 'schedule_window',
      });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [provisionalRecord.datasetId],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(row);
    });

    it('3. rejects verified dependency against stale registry record (unmatched, fail-closed)', () => {
      const dep = makeDepFromRecord(staleRecord, {
        verification: 'verified',
        policy: 'schedule_window',
      });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [staleRecord.datasetId],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(row);
    });

    it('4. matches stale dependency with verified registry record (aged patch_cadence / expired schedule)', () => {
      const cadenceRecord = DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog;
      const dep = makeDepFromRecord(cadenceRecord, {
        verification: 'stale',
        policy: 'patch_cadence',
        riskTier: 'low',
        reason: 'age_exceeded',
      });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          verification: 'stale',
          provenanceIds: [cadenceRecord.datasetId],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('matched');
      expect(row.evidence).toBe(cadenceRecord.evidence);
      expect(row.verificationMethod).toBe(cadenceRecord.verificationMethod);
      expect(row.verifiedFields).toEqual(cadenceRecord.verifiedFields);
      expect(row.sourceUrl).toBe(cadenceRecord.sourceUrl);
    });

    it('5. matches stale dependency with stale registry record (historical schedule archive)', () => {
      const dep = makeDepFromRecord(staleRecord, {
        verification: 'stale',
        policy: 'schedule_window',
        reason: 'explicit_stale',
      });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          provenanceIds: [staleRecord.datasetId],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('matched');
      expect(row.evidence).toBe(staleRecord.evidence);
      expect(row.verificationMethod).toBe(staleRecord.verificationMethod);
      expect(row.verifiedFields).toEqual(staleRecord.verifiedFields);
      expect(row.sourceUrl).toBe(staleRecord.sourceUrl);
    });

    it('6. matches provisional dependency with provisional registry record', () => {
      const dep = makeDepFromRecord(provisionalRecord, {
        verification: 'provisional',
        policy: 'schedule_window',
        reason: 'explicit_provisional',
      });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          isActionable: false,
          verification: 'provisional',
          provenanceIds: [provisionalRecord.datasetId],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('matched');
      expect(row.evidence).toBe(provisionalRecord.evidence);
      expect(row.verificationMethod).toBe(provisionalRecord.verificationMethod);
      expect(row.verifiedFields).toEqual(provisionalRecord.verifiedFields);
      expect(row.sourceUrl).toBe(provisionalRecord.sourceUrl);
    });

    it.each([
      'future_version',
      'insufficient_verification_metadata',
      'sandbox_dataset',
    ] as const)(
      '7. matches provisional dependency against verified registry record when reason is permitted (%s)',
      (permittedReason) => {
        const dep = makeDepFromRecord(verifiedRecord, {
          verification: 'provisional',
          reason: permittedReason,
        });
        const model = formatReliabilityPresentation(
          buildEnvelope({
            status: 'qualified',
            isActionable: false,
            verification: 'provisional',
            provenanceIds: [verifiedRecord.datasetId],
            dependencies: [dep],
          }),
        );

        const row = model.requiredDependencies[0];
        expect(row.provenanceMatch).toBe('matched');
        expect(row.evidence).toBe(verifiedRecord.evidence);
        expect(row.verificationMethod).toBe(verifiedRecord.verificationMethod);
        expect(row.verifiedFields).toEqual(verifiedRecord.verifiedFields);
        expect(row.sourceUrl).toBe(verifiedRecord.sourceUrl);
      },
    );

    it.each([undefined, 'explicit_provisional', 'age_exceeded', 'unknown_reason'])(
      '8. rejects provisional dependency against verified registry record without a permitted reason (%s)',
      (unpermittedReason) => {
        const dep = makeDepFromRecord(verifiedRecord, {
          verification: 'provisional',
          ...(unpermittedReason !== undefined ? { reason: unpermittedReason } : {}),
        });
        const model = formatReliabilityPresentation(
          buildEnvelope({
            status: 'qualified',
            isActionable: false,
            verification: 'provisional',
            provenanceIds: [verifiedRecord.datasetId],
            dependencies: [dep],
          }),
        );

        const row = model.requiredDependencies[0];
        expect(row.provenanceMatch).toBe('unmatched');
        expectNoAuxiliaryProvenance(row);
      },
    );

    it('rejects remaining incompatible pairs (stale vs provisional, provisional vs stale) fail-closed', () => {
      const staleVsProvisional = makeDepFromRecord(provisionalRecord, {
        verification: 'stale',
        policy: 'schedule_window',
      });
      const provisionalVsStale = makeDepFromRecord(staleRecord, {
        verification: 'provisional',
        policy: 'schedule_window',
        reason: 'future_version',
      });

      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          isActionable: false,
          provenanceIds: [provisionalRecord.datasetId, staleRecord.datasetId],
          dependencies: [staleVsProvisional, provisionalVsStale],
        }),
      );

      expect(model.requiredDependencies[0].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[0]);
      expect(model.requiredDependencies[1].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[1]);
    });
  });

  describe('Fail-closed provenance matching edge cases', () => {
    const baseRecord = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;

    it('marks missing and unregistered provenance as unregistered with all 4 auxiliary fields undefined', () => {
      const missingDep: ReliabilityDependencyDetail = {
        datasetId: 'nonexistent_dataset_v9',
        required: true,
        verification: 'unregistered',
        policy: 'patch_cadence',
        riskTier: 'high',
        reason: 'missing_provenance',
      };
      const reasonOnlyMissing: ReliabilityDependencyDetail = makeDepFromRecord(baseRecord, {
        reason: 'missing_provenance',
      });
      const absentFromRegistry: ReliabilityDependencyDetail = {
        datasetId: 'attested_but_absent_from_registry',
        required: false,
        verification: 'verified',
        policy: 'version_bound',
        riskTier: 'high',
        version: '7.2',
        verifiedAt: '2026-11-16',
      };

      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'unsupported',
          isActionable: false,
          verification: 'unregistered',
          provenanceIds: [baseRecord.datasetId, 'attested_but_absent_from_registry'],
          dependencies: [missingDep, reasonOnlyMissing, absentFromRegistry],
        }),
      );

      expect(model.requiredDependencies[0].provenanceMatch).toBe('unregistered');
      expectNoAuxiliaryProvenance(model.requiredDependencies[0]);

      expect(model.requiredDependencies[1].provenanceMatch).toBe('unregistered');
      expectNoAuxiliaryProvenance(model.requiredDependencies[1]);

      expect(model.optionalDependencies[0].provenanceMatch).toBe('unregistered');
      expect(model.optionalDependencies[0].role).toBe('optional');
      expect(model.optionalDependencies[0].roleLabel).toBe('Optional (Non-Blocking)');
      expectNoAuxiliaryProvenance(model.optionalDependencies[0]);
    });

    it('rejects dependency absent from envelope provenanceIds (unmatched, all 4 fields undefined)', () => {
      const dep = makeDepFromRecord(baseRecord, { verification: 'verified' });
      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: ['weapons_v7_2_signatures'],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(row);
    });

    it('rejects version mismatch and missing dep.version (unmatched, all 4 fields undefined)', () => {
      const wrongVersion = makeDepFromRecord(baseRecord, { version: '7.1' });
      const missingVersion = makeDepFromRecord(
        DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures,
        { version: undefined },
      );

      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [baseRecord.datasetId, 'weapons_v7_2_signatures'],
          dependencies: [wrongVersion, missingVersion],
        }),
      );

      expect(model.requiredDependencies[0].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[0]);

      expect(model.requiredDependencies[1].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[1]);
    });

    it('rejects verifiedAt mismatch and missing dep.verifiedAt (unmatched, all 4 fields undefined)', () => {
      const wrongTimestamp = makeDepFromRecord(baseRecord, { verifiedAt: '2026-11-15' });
      const missingTimestamp = makeDepFromRecord(
        DATA_PROVENANCE_REGISTRY.weapons_v7_2_signatures,
        { verifiedAt: undefined },
      );

      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [baseRecord.datasetId, 'weapons_v7_2_signatures'],
          dependencies: [wrongTimestamp, missingTimestamp],
        }),
      );

      expect(model.requiredDependencies[0].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[0]);

      expect(model.requiredDependencies[1].provenanceMatch).toBe('unmatched');
      expectNoAuxiliaryProvenance(model.requiredDependencies[1]);
    });

    it('detects duplicate datasetId entries as ambiguous and leaves all 4 auxiliary fields undefined on every duplicate', () => {
      const firstCopy = makeDepFromRecord(baseRecord, { required: true });
      const secondCopy = makeDepFromRecord(baseRecord, { required: false });

      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [baseRecord.datasetId],
          dependencies: [firstCopy, secondCopy],
        }),
      );

      expect(model.requiredDependencies).toHaveLength(1);
      expect(model.optionalDependencies).toHaveLength(1);

      expect(model.requiredDependencies[0].provenanceMatch).toBe('ambiguous');
      expectNoAuxiliaryProvenance(model.requiredDependencies[0]);

      expect(model.optionalDependencies[0].provenanceMatch).toBe('ambiguous');
      expectNoAuxiliaryProvenance(model.optionalDependencies[0]);
    });

    it('rejects empty datasetId, prototype keys, and mismatched registry record.datasetId without borrowing metadata', () => {
      registerTempProvenance('aliased_lookup_key', {
        ...baseRecord,
        datasetId: 'different_canonical_id',
      });

      const emptyIdDep: ReliabilityDependencyDetail = {
        datasetId: '',
        required: true,
        verification: 'verified',
        policy: 'version_bound',
        riskTier: 'high',
        version: '7.2',
        verifiedAt: '2026-11-16',
      };
      const prototypeKeyDep: ReliabilityDependencyDetail = {
        datasetId: 'toString',
        required: true,
        verification: 'verified',
        policy: 'version_bound',
        riskTier: 'high',
        version: '7.2',
        verifiedAt: '2026-11-16',
      };
      const aliasedDep: ReliabilityDependencyDetail = {
        datasetId: 'aliased_lookup_key',
        required: true,
        verification: 'verified',
        policy: 'version_bound',
        riskTier: 'high',
        version: baseRecord.version,
        verifiedAt: baseRecord.verifiedAt,
      };

      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: ['', 'toString', 'aliased_lookup_key'],
          dependencies: [emptyIdDep, prototypeKeyDep, aliasedDep],
        }),
      );

      for (const row of model.requiredDependencies) {
        expect(row.provenanceMatch).toBe('unmatched');
        expectNoAuxiliaryProvenance(row);
      }
    });

    it.each([
      'http://genshin.hoyoverse.com/en/news',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>',
      'ftp://files.example.com/archive.json',
      'not-a-valid-url',
      '   ',
    ])('rejects non-HTTPS sourceUrl (%s) while keeping matched provenance evidence intact', (badUrl) => {
      const key = 'test_non_https_source_record';
      registerTempProvenance(key, {
        datasetId: key,
        version: '7.2',
        verifiedAt: '2026-11-16',
        sourceUrl: badUrl,
        verificationMethod: 'official_notice',
        verifiedFields: ['id'],
        evidence: 'Verified official notice with non-HTTPS URL test fixture.',
        status: 'verified',
      });

      const dep: ReliabilityDependencyDetail = {
        datasetId: key,
        required: true,
        verification: 'verified',
        policy: 'version_bound',
        riskTier: 'high',
        version: '7.2',
        verifiedAt: '2026-11-16',
      };

      const model = formatReliabilityPresentation(
        buildEnvelope({
          provenanceIds: [key],
          dependencies: [dep],
        }),
      );

      const row = model.requiredDependencies[0];
      expect(row.provenanceMatch).toBe('matched');
      expect(row.evidence).toBe('Verified official notice with non-HTTPS URL test fixture.');
      expect(row.verificationMethod).toBe('official_notice');
      expect(row.verifiedFields).toEqual(['id']);
      expect(row.sourceUrl).toBeUndefined();
    });
  });

  describe('Evidence-based status & actionability presentation matrix', () => {
    it('formats reliable without warnings as banner-omitted Live-Actionable', () => {
      const rec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          temporalState: 'active',
          provenanceIds: [rec.datasetId],
          dependencies: [makeDepFromRecord(rec)],
          warnings: [],
        }),
      );

      expect(model.badgeLabel).toBe('Reliable');
      expect(model.badgeTone).toBe('reliable');
      expect(model.actionabilityLabel).toBe('Live-Actionable');
      expect(model.contextTag).toBe('Live · Active Schedule');
      expect(model.bannerSeverity).toBe('none');
      expect(model.containerKind).toBe('none');
      expect(model.dependencyEvidenceAvailable).toBe(true);
    });

    it('formats reliable with warnings and non-verified optional dependency as Optional Notice', () => {
      const req = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
      const opt = DATA_PROVENANCE_REGISTRY['cycle-5-3'];
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          provenanceIds: [req.datasetId, opt.datasetId],
          warnings: ['Optional dataset "cycle-5-3" is archived.'],
          dependencies: [
            makeDepFromRecord(req, { required: true }),
            makeDepFromRecord(opt, {
              required: false,
              verification: 'stale',
              policy: 'schedule_window',
            }),
          ],
        }),
      );

      expect(model.badgeLabel).toBe('Reliable');
      expect(model.actionabilityLabel).toBe('Live-Actionable · Optional Notice');
      expect(model.bannerSeverity).toBe('warning');
      expect(model.containerKind).toBe('status');
      expect(model.bannerSummary).toContain('cycle-5-3');
    });

    it('formats reliable with warnings and no non-verified optional dependencies as generic Notice without citing optional data', () => {
      const warningText = 'Engine heuristic note: energy threshold estimated at 180% ER.';
      const model = formatReliabilityPresentation(
        buildEnvelope({
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          warnings: [warningText],
          dependencies: undefined,
        }),
      );

      expect(model.badgeLabel).toBe('Reliable');
      expect(model.actionabilityLabel).toBe('Live-Actionable · Notice');
      expect(model.bannerSeverity).toBe('warning');
      expect(model.containerKind).toBe('status');
      expect(model.bannerSummary).toBe(warningText);
      expect(model.bannerSummary).not.toMatch(/optional/i);
      expect(model.dependencyEvidenceAvailable).toBe(false);
    });

    it('formats qualified + planning_preview and qualified + sandbox_simulation as passive context', () => {
      const preview = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'planning_preview',
          isActionable: false,
          verification: 'verified',
          temporalState: 'upcoming',
          warnings: ['Planning preview: banner schedule is upcoming.'],
        }),
      );
      expect(preview.badgeLabel).toBe('Preview');
      expect(preview.badgeTone).toBe('qualified_info');
      expect(preview.actionabilityLabel).toBe('Not Live-Actionable · Preview');
      expect(preview.contextTag).toBe('Preview · Upcoming Schedule');
      expect(preview.bannerSeverity).toBe('info');
      expect(preview.containerKind).toBe('context');

      const sandbox = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'sandbox_simulation',
          isActionable: false,
          verification: 'provisional',
          temporalState: 'not_applicable',
          warnings: ['Sandbox simulation uses user-configured parameters.'],
        }),
      );
      expect(sandbox.badgeLabel).toBe('Sandbox');
      expect(sandbox.badgeTone).toBe('qualified_info');
      expect(sandbox.actionabilityLabel).toBe('Not Live-Actionable · Simulation');
      expect(sandbox.contextTag).toBe('Sandbox');
      expect(sandbox.bannerSeverity).toBe('info');
      expect(sandbox.containerKind).toBe('context');
    });

    it('formats qualified current-mode stale, provisional, and advisory-only required dependencies strictly from evidence', () => {
      const cadenceRec = DATA_PROVENANCE_REGISTRY.rotations_v7_2_catalog;
      const staleModel = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'current',
          isActionable: true,
          verification: 'stale',
          provenanceIds: [cadenceRec.datasetId],
          dependencies: [
            makeDepFromRecord(cadenceRec, {
              verification: 'stale',
              policy: 'patch_cadence',
              riskTier: 'low',
              reason: 'age_exceeded',
            }),
          ],
          warnings: ['Required dataset "rotations_v7_2_catalog" exceeded 42-day review cadence.'],
        }),
      );
      expect(staleModel.badgeLabel).toBe('Qualified · Stale Dependency');
      expect(staleModel.badgeTone).toBe('qualified_caution');
      expect(staleModel.bannerSeverity).toBe('warning');
      expect(staleModel.containerKind).toBe('status');
      expect(staleModel.bannerSummary).toContain('rotations_v7_2_catalog');

      const provRec = DATA_PROVENANCE_REGISTRY['season-7-snezhnaya-cryo-hydro-electro'];
      const provModel = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'current',
          isActionable: false,
          verification: 'provisional',
          provenanceIds: [provRec.datasetId],
          dependencies: [
            makeDepFromRecord(provRec, {
              verification: 'provisional',
              policy: 'schedule_window',
              reason: 'explicit_provisional',
            }),
          ],
          warnings: ['Required dataset "season-7-snezhnaya-cryo-hydro-electro" is provisional.'],
        }),
      );
      expect(provModel.badgeLabel).toBe('Qualified · Provisional Data');
      expect(provModel.badgeTone).toBe('qualified_caution');
      expect(provModel.bannerSeverity).toBe('warning');
      expect(provModel.containerKind).toBe('status');
      expect(provModel.bannerSummary).toContain('season-7-snezhnaya-cryo-hydro-electro');
      expect(provModel.bannerSummary).not.toMatch(/verified/i);

      const coreRec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
      const advisoryWarning =
        'Unattested local game-data dependency "SIGNATURE_WEAPONS" lacks a provenance record.';
      const advisoryModel = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'current',
          isActionable: false,
          verification: 'verified',
          provenanceIds: [coreRec.datasetId],
          dependencies: [makeDepFromRecord(coreRec, { verification: 'verified' })],
          warnings: [advisoryWarning],
        }),
      );
      expect(advisoryModel.badgeLabel).toBe('Qualified · Advisory Only');
      expect(advisoryModel.badgeTone).toBe('qualified_info');
      expect(advisoryModel.bannerSeverity).toBe('info');
      expect(advisoryModel.containerKind).toBe('context');
      expect(advisoryModel.bannerSummary).toContain('Listed required dependencies are verified');
      expect(advisoryModel.bannerSummary).toContain(advisoryWarning);
    });

    it('uses neutral dependency-absent wording without invented verification claims when dependencies are omitted or empty', () => {
      const warningText = 'Envelope notice: custom calibration weight active.';

      for (const dependencies of [undefined, [] as ReliabilityDependencyDetail[]]) {
        const actionable = formatReliabilityPresentation(
          buildEnvelope({
            status: 'qualified',
            mode: 'current',
            isActionable: true,
            verification: 'provisional',
            warnings: [warningText],
            dependencies,
          }),
        );
        expect(actionable.badgeLabel).toBe('Qualified');
        expect(actionable.actionabilityLabel).toBe('Live-Actionable · Qualified');
        expect(actionable.bannerSeverity).toBe('warning');
        expect(actionable.containerKind).toBe('status');
        expect(actionable.bannerSummary).toBe(warningText);
        expect(actionable.dependencyEvidenceAvailable).toBe(false);
        expect(actionable.bannerTitle).not.toMatch(/verified|stale|provisional|unregistered/i);
        expect(actionable.bannerSummary).not.toMatch(/verified|stale|provisional|unregistered/i);

        const nonActionable = formatReliabilityPresentation(
          buildEnvelope({
            status: 'qualified',
            mode: 'current',
            isActionable: false,
            verification: 'verified',
            warnings: [warningText],
            dependencies,
          }),
        );
        expect(nonActionable.badgeLabel).toBe('Qualified');
        expect(nonActionable.actionabilityLabel).toBe('Not Live-Actionable · Qualified');
        expect(nonActionable.bannerSeverity).toBe('info');
        expect(nonActionable.containerKind).toBe('context');
        expect(nonActionable.bannerSummary).toBe(warningText);
        expect(nonActionable.dependencyEvidenceAvailable).toBe(false);
        expect(nonActionable.triggerAriaLabel).not.toMatch(
          /verified|stale|provisional|unregistered/i,
        );
      }
    });

    it('formats historical and unsupported states with exact container kinds and labels', () => {
      const historical = formatReliabilityPresentation(
        buildEnvelope({
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          warnings: ['Historical archive simulation for abyss "cycle-5-3".'],
        }),
      );
      expect(historical.badgeLabel).toBe('Historical');
      expect(historical.badgeTone).toBe('historical');
      expect(historical.actionabilityLabel).toBe('Not Live-Actionable · Archive');
      expect(historical.contextTag).toBe('Archive · Expired Schedule');
      expect(historical.bannerSeverity).toBe('info');
      expect(historical.containerKind).toBe('context');

      const unsupported = formatReliabilityPresentation(
        buildEnvelope({
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'unregistered',
          temporalState: 'not_applicable',
          warnings: ['Unknown abyss schedule entity "cycle-unknown".'],
        }),
      );
      expect(unsupported.badgeLabel).toBe('Unsupported');
      expect(unsupported.badgeTone).toBe('unsupported');
      expect(unsupported.conceptualDataState).toBe('Unknown');
      expect(unsupported.dataStateLabel).toBe('Unknown (Unregistered Data)');
      expect(unsupported.actionabilityLabel).toBe('Blocked · Not Live-Actionable');
      expect(unsupported.bannerSeverity).toBe('blocking');
      expect(unsupported.containerKind).toBe('alert');
      expect(unsupported.bannerSummary).toBe('Unknown abyss schedule entity "cycle-unknown".');
    });

    it('maps all 6-state conceptualDataState variants distinctly (Verified, Estimated, Unknown, Expired, Unsupported)', () => {
      const verified = formatReliabilityPresentation(
        buildEnvelope({
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
        }),
      );
      expect(verified.conceptualDataState).toBe('Verified');
      expect(verified.dataStateLabel).toBe('Verified');

      const estimated = formatReliabilityPresentation(
        buildEnvelope({
          status: 'qualified',
          mode: 'current',
          isActionable: false,
          verification: 'provisional',
        }),
      );
      expect(estimated.conceptualDataState).toBe('Estimated');

      const expiredArchive = formatReliabilityPresentation(
        buildEnvelope({
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
        }),
      );
      expect(expiredArchive.conceptualDataState).toBe('Expired');

      const expiredUnsupported = formatReliabilityPresentation(
        buildEnvelope({
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          warnings: ['Schedule expired.'],
        }),
      );
      expect(expiredUnsupported.conceptualDataState).toBe('Expired');
      expect(expiredUnsupported.dataStateLabel).toBe('Expired (Schedule Expired)');

      const unsupportedOther = formatReliabilityPresentation(
        buildEnvelope({
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'provisional',
          temporalState: 'not_applicable',
          warnings: ['Invalid evaluatedAt clock.'],
        }),
      );
      expect(unsupportedOther.conceptualDataState).toBe('Unsupported');
      expect(unsupportedOther.dataStateLabel).toBe('Unsupported');
    });
  });

  describe('Canonical default-banner selector (selectDefaultBannerId)', () => {
    it('selects active banner on 2026-11-23 (banner_7_2_phase_1)', () => {
      expect(selectDefaultBannerId(new Date('2026-11-23T12:00:00Z'))).toBe('banner_7_2_phase_1');
    });

    it('selects active banner on 2026-11-25 (banner_7_2_phase_2)', () => {
      expect(selectDefaultBannerId(new Date('2026-11-25T12:00:00Z'))).toBe('banner_7_2_phase_2');
    });

    it('selects most recent historical banner with deterministic tie-breaking on 2026-12-16', () => {
      // banner_7_2_phase_2 (index 1) and banner_7_2_natlan_chronicled (index 2) share
      // startDate 2026-11-24 and endDate 2026-12-15; array index breaks the tie deterministically.
      expect(selectDefaultBannerId(new Date('2026-12-16T12:00:00Z'))).toBe('banner_7_2_phase_2');
    });

    it('selects earliest upcoming banner for pre-schedule synthetic dates', () => {
      // Before all canonical banners (earliest startDate is 2024-10-09 -> banner_5_1_phase_1)
      expect(selectDefaultBannerId(new Date('2024-01-01T12:00:00Z'))).toBe('banner_5_1_phase_1');
      // Between v5.4 archive (ended 2025-03-04) and v7.2 (starts 2026-11-04 -> banner_7_2_phase_1)
      expect(selectDefaultBannerId(new Date('2025-06-01T12:00:00Z'))).toBe('banner_7_2_phase_1');
    });

    it('falls back to first BANNER_PHASES entry on invalid Date and to sandbox when BANNER_PHASES is empty', () => {
      expect(selectDefaultBannerId(new Date('invalid-date'))).toBe(BANNER_PHASES[0].id);

      const savedPhases = BANNER_PHASES.splice(0, BANNER_PHASES.length);
      try {
        expect(selectDefaultBannerId(new Date('2026-11-25T12:00:00Z'))).toBe('sandbox');
      } finally {
        BANNER_PHASES.push(...savedPhases);
      }
    });
  });

  describe('Purity guarantee — zero calls to Phase 2 or Phase 3 reliability evaluators', () => {
    it('never invokes Phase 2 or Phase 3 evaluators during formatting or banner selection', () => {
      const verifiedRec = DATA_PROVENANCE_REGISTRY.characters_v7_2_batch7;
      const staleRec = DATA_PROVENANCE_REGISTRY['cycle-5-3'];
      const provisionalRec = DATA_PROVENANCE_REGISTRY['season-7-snezhnaya-cryo-hydro-electro'];

      const envelopes: RecommendationReliability[] = [
        buildEnvelope({
          status: 'reliable',
          mode: 'current',
          isActionable: true,
          verification: 'verified',
          provenanceIds: [verifiedRec.datasetId],
          dependencies: [makeDepFromRecord(verifiedRec)],
        }),
        buildEnvelope({
          status: 'qualified',
          mode: 'planning_preview',
          isActionable: false,
          verification: 'provisional',
          temporalState: 'upcoming',
          provenanceIds: [provisionalRec.datasetId],
          dependencies: [makeDepFromRecord(provisionalRec, { policy: 'schedule_window' })],
          warnings: ['Upcoming preview.'],
        }),
        buildEnvelope({
          status: 'historical',
          mode: 'archive_simulation',
          isActionable: false,
          verification: 'stale',
          temporalState: 'expired',
          provenanceIds: [staleRec.datasetId],
          dependencies: [makeDepFromRecord(staleRec, { policy: 'schedule_window' })],
          warnings: ['Historical archive.'],
        }),
        buildEnvelope({
          status: 'unsupported',
          mode: 'current',
          isActionable: false,
          verification: 'unregistered',
          warnings: ['Missing provenance.'],
          dependencies: [
            {
              datasetId: 'missing_ds',
              required: true,
              verification: 'unregistered',
              policy: 'patch_cadence',
              riskTier: 'high',
              reason: 'missing_provenance',
            },
          ],
        }),
      ];

      for (const env of envelopes) {
        formatReliabilityPresentation(env);
      }

      selectDefaultBannerId(new Date('2026-11-23T12:00:00Z'));
      selectDefaultBannerId(new Date('2026-11-25T12:00:00Z'));
      selectDefaultBannerId(new Date('2026-12-16T12:00:00Z'));
      selectDefaultBannerId(new Date('2024-01-01T12:00:00Z'));

      expect(recommendationReliability.evaluateRecommendationReliability).not.toHaveBeenCalled();
      expect(recommendationReliability.evaluateDatasetFreshness).not.toHaveBeenCalled();
      expect(dataFreshness.isDatasetStale).not.toHaveBeenCalled();
      expect(dataFreshness.isScheduleExpired).not.toHaveBeenCalled();
      expect(dataFreshness.getFreshnessInfo).not.toHaveBeenCalled();
      expect(engineReliability.evaluateEngineBoundaryReliability).not.toHaveBeenCalled();
      expect(engineReliability.evaluateScheduledEngineReliability).not.toHaveBeenCalled();
    });
  });
});
