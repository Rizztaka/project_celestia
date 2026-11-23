import type { DataProvenance, VerificationMethod, VerificationState } from '../types/genshin';
import { CURRENT_GAME_VERSION, PATCH_CYCLE_DAYS } from '../data/game-version';
import { getProvenance, getAllProvenances } from '../data/provenance-registry';
import {
  evaluateDatasetFreshness,
  formatDateUtc,
  isSandboxDatasetId,
  type FreshnessStaleReason,
} from './recommendation-reliability';

export interface FreshnessInfo {
  datasetId: string;
  version: string;
  status: VerificationState;
  isStale: boolean;
  isExpired: boolean;
  staleReason?: FreshnessStaleReason;
  ageDays: number;
  verifiedAt: string;
  effectiveEndDate?: string;
  sourceUrl: string;
  evidence: string;
  verificationMethod?: VerificationMethod;
  verifiedFields?: string[];
  badgeLabel: string;
  badgeDescription: string;
}

/**
 * Checks whether a time-boxed dataset's canonical schedule has expired relative to referenceDate.
 */
export function isScheduleExpired(
  provenance: DataProvenance,
  referenceDate: Date = new Date(),
): boolean {
  if (!provenance?.datasetId) return false;
  const refUtc = formatDateUtc(referenceDate);
  if (!refUtc) return false;
  return evaluateDatasetFreshness(provenance, refUtc).isExpired;
}

/**
 * Determines whether a dataset is stale using the unified dataset-specific freshness policy
 * from `src/services/recommendation-reliability.ts`:
 * - `schedule_window`: canonical schedule dates + game version
 * - `version_bound`: game version (does not expire after 42 days)
 * - `patch_cadence`: `thresholdDays` (defaults to `PATCH_CYCLE_DAYS = 42`) + game version
 * - `sandbox`: remains provisional (never ages out)
 */
export function isDatasetStale(
  provenance: DataProvenance,
  thresholdDays?: number,
  referenceDate: Date = new Date(),
): boolean {
  if (!provenance) return true;
  const refUtc = formatDateUtc(referenceDate);
  return evaluateDatasetFreshness(provenance, refUtc, thresholdDays).isStale;
}

/**
 * Retrieves comprehensive freshness metadata and formatted UI badge labels for a dataset.
 */
export function getFreshnessInfo(
  provenanceOrId: DataProvenance | string,
  referenceDate: Date = new Date(),
  thresholdDays?: number,
): FreshnessInfo {
  const provenance: DataProvenance | undefined =
    typeof provenanceOrId === 'string' ? getProvenance(provenanceOrId) : provenanceOrId;

  if (!provenance) {
    const id = typeof provenanceOrId === 'string' ? provenanceOrId : 'unknown';

    if (isSandboxDatasetId(id)) {
      return {
        datasetId: id,
        version: 'unknown',
        status: 'unregistered',
        isStale: false,
        isExpired: false,
        ageDays: -1,
        verifiedAt: 'Unregistered',
        sourceUrl: '',
        evidence:
          'Unregistered custom sandbox dataset. No provenance record exists; treat results as experimental and non-actionable.',
        badgeLabel: 'Unregistered Sandbox',
        badgeDescription: 'Unregistered custom sandbox mode. No provenance record exists.',
      };
    }

    return {
      datasetId: id,
      version: 'unknown',
      status: 'unregistered',
      isStale: false,
      isExpired: false,
      ageDays: -1,
      verifiedAt: 'Unregistered',
      sourceUrl: '',
      evidence:
        'Dataset does not have an explicit provenance record yet; verify in-game before committing resources.',
      badgeLabel: 'Unregistered',
      badgeDescription:
        'No provenance record found for this dataset. Do not treat as verified or active without checking in-game.',
    };
  }

  const refUtc = formatDateUtc(referenceDate);
  const freshness = evaluateDatasetFreshness(provenance, refUtc, thresholdDays);
  const { ageDays, isExpired: expired, isStale: stale, staleReason, canonicalEndDate } = freshness;

  if (stale) {
    const expiredNote = expired && canonicalEndDate
      ? `Schedule ended on ${canonicalEndDate}. `
      : '';
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'stale',
      isStale: true,
      isExpired: expired,
      staleReason,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      effectiveEndDate: canonicalEndDate,
      sourceUrl: provenance.sourceUrl ?? '',
      evidence: provenance.evidence,
      verificationMethod: provenance.verificationMethod,
      verifiedFields: provenance.verifiedFields,
      badgeLabel: `Stale v${provenance.version}`,
      badgeDescription: `${expiredNote}Data verified ${ageDays >= 0 ? `${ageDays}d ago` : 'in an earlier cycle'} (${provenance.verifiedAt}). Lineups or mechanics may have shifted.`,
    };
  }

  if (
    provenance.status === 'provisional' ||
    freshness.policy.policy === 'sandbox' ||
    freshness.isFutureVersion
  ) {
    const isSandbox = freshness.policy.policy === 'sandbox';
    const badgeDescription = isSandbox
      ? 'User-customized sandbox mode. Real-time calculations active.'
      : freshness.isFutureVersion
        ? `Future-version dataset (v${provenance.version}) ahead of active v${CURRENT_GAME_VERSION}; treated as provisional and not verified for live-game advice.`
        : `Provisional data verified on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`;
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'provisional',
      isStale: false,
      isExpired: false,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      effectiveEndDate: canonicalEndDate,
      sourceUrl: provenance.sourceUrl ?? '',
      evidence: provenance.evidence,
      verificationMethod: provenance.verificationMethod,
      verifiedFields: provenance.verifiedFields,
      badgeLabel: isSandbox ? 'Sandbox Simulation' : `Provisional v${provenance.version}`,
      badgeDescription,
    };
  }

  return {
    datasetId: provenance.datasetId,
    version: provenance.version,
    status: 'verified',
    isStale: false,
    isExpired: false,
    ageDays,
    verifiedAt: provenance.verifiedAt,
    effectiveEndDate: canonicalEndDate,
    sourceUrl: provenance.sourceUrl ?? '',
    evidence: provenance.evidence,
    verificationMethod: provenance.verificationMethod,
    verifiedFields: provenance.verifiedFields,
    badgeLabel: `Verified v${provenance.version}`,
    badgeDescription: `Verified on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`,
  };
}

/**
 * Audits all registered datasets at once, partitioning fresh, provisional, and stale entries.
 */
export function getStaleDatasetSummary(
  referenceDate: Date = new Date(),
  thresholdDays: number = PATCH_CYCLE_DAYS,
): {
  verified: FreshnessInfo[];
  provisional: FreshnessInfo[];
  stale: FreshnessInfo[];
} {
  const verified: FreshnessInfo[] = [];
  const provisional: FreshnessInfo[] = [];
  const stale: FreshnessInfo[] = [];

  for (const prov of getAllProvenances()) {
    const info = getFreshnessInfo(prov, referenceDate, thresholdDays);
    if (info.isStale) {
      stale.push(info);
    } else if (info.status === 'provisional') {
      provisional.push(info);
    } else {
      verified.push(info);
    }
  }

  return { verified, provisional, stale };
}

