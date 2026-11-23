import type { DataProvenance, ProvenanceStatus, VerificationMethod } from '../types/genshin';
import { CURRENT_GAME_VERSION, PATCH_CYCLE_DAYS, compareGameVersions } from '../data/game-version';
import { getProvenance, getAllProvenances } from '../data/provenance-registry';

export interface FreshnessInfo {
  datasetId: string;
  version: string;
  status: ProvenanceStatus;
  isStale: boolean;
  isExpired: boolean;
  staleReason?: 'explicit_stale' | 'outdated_version' | 'expired_schedule' | 'age_exceeded' | 'invalid_date';
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

function parseUtcMidnight(d: Date | string): number {
  if (typeof d === 'string') {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.trim());
    if (match) {
      return Date.UTC(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
    }
  }
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(dateObj.getTime())) return NaN;
  return Date.UTC(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
}

/**
 * Checks whether a time-boxed dataset's effectiveEndDate has strictly passed relative to referenceDate.
 */
export function isScheduleExpired(
  provenance: DataProvenance,
  referenceDate: Date = new Date(),
): boolean {
  if (!provenance?.effectiveEndDate) return false;
  const endUtc = parseUtcMidnight(provenance.effectiveEndDate);
  const refUtc = parseUtcMidnight(referenceDate);
  if (Number.isNaN(endUtc) || Number.isNaN(refUtc)) return false;
  return refUtc > endUtc;
}

/**
 * Determines whether a dataset is considered stale based on:
 * 1. Explicit 'stale' status in provenance
 * 2. Version strictly older than CURRENT_GAME_VERSION
 * 3. Time-boxed schedule effectiveEndDate has passed
 * 4. Verification age strictly exceeds thresholdDays (defaults to PATCH_CYCLE_DAYS = 42)
 */
export function isDatasetStale(
  provenance: DataProvenance,
  thresholdDays: number = PATCH_CYCLE_DAYS,
  referenceDate: Date = new Date(),
): boolean {
  if (!provenance) return true;
  if (provenance.status === 'stale') {
    return true;
  }

  if (compareGameVersions(provenance.version, CURRENT_GAME_VERSION) < 0) {
    return true;
  }

  if (isScheduleExpired(provenance, referenceDate)) {
    return true;
  }

  const vUtc = parseUtcMidnight(provenance.verifiedAt);
  const rUtc = parseUtcMidnight(referenceDate);

  if (Number.isNaN(vUtc) || Number.isNaN(rUtc)) {
    return true;
  }

  const ageDays = Math.floor((rUtc - vUtc) / (1000 * 60 * 60 * 24));
  return ageDays > thresholdDays;
}

function getStaleReason(
  provenance: DataProvenance,
  thresholdDays: number,
  referenceDate: Date,
): FreshnessInfo['staleReason'] {
  if (provenance.status === 'stale') return 'explicit_stale';
  if (compareGameVersions(provenance.version, CURRENT_GAME_VERSION) < 0) return 'outdated_version';
  if (isScheduleExpired(provenance, referenceDate)) return 'expired_schedule';
  const vUtc = parseUtcMidnight(provenance.verifiedAt);
  const rUtc = parseUtcMidnight(referenceDate);
  if (Number.isNaN(vUtc) || Number.isNaN(rUtc)) return 'invalid_date';
  const ageDays = Math.floor((rUtc - vUtc) / (1000 * 60 * 60 * 24));
  if (ageDays > thresholdDays) return 'age_exceeded';
  return undefined;
}

/**
 * Retrieves comprehensive freshness metadata and formatted UI badge labels for a dataset.
 */
export function getFreshnessInfo(
  provenanceOrId: DataProvenance | string,
  referenceDate: Date = new Date(),
  thresholdDays: number = PATCH_CYCLE_DAYS,
): FreshnessInfo {
  const provenance: DataProvenance | undefined =
    typeof provenanceOrId === 'string' ? getProvenance(provenanceOrId) : provenanceOrId;

  if (!provenance) {
    const id = typeof provenanceOrId === 'string' ? provenanceOrId : 'unknown';
    const vMatch =
      id.match(/(?:cycle|banner|season)[-_]([0-9]+)[._]([0-9]+)/i) ||
      id.match(/v?([0-9]+\.[0-9]+)/);
    const inferredVersion = vMatch ? `${vMatch[1]}.${vMatch[2] ?? ''}`.replace(/\.$/, '') : null;
    const isSandbox = id.includes('sandbox') || id.startsWith('custom-');

    if (inferredVersion && compareGameVersions(inferredVersion, CURRENT_GAME_VERSION) < 0) {
      return {
        datasetId: id,
        version: inferredVersion,
        status: 'stale',
        isStale: true,
        isExpired: true,
        staleReason: 'outdated_version',
        ageDays: -1,
        verifiedAt: 'Historical Archive',
        sourceUrl: '',
        evidence: `Historical dataset from Version ${inferredVersion}. In-game lineups, enemy buffs, or mechanics differ from active Version ${CURRENT_GAME_VERSION}.`,
        badgeLabel: `Stale v${inferredVersion}`,
        badgeDescription: `Data from prior game patch (v${inferredVersion}). Lineups or mechanics have shifted in v${CURRENT_GAME_VERSION}.`,
      };
    }

    if (isSandbox) {
      return {
        datasetId: id,
        version: CURRENT_GAME_VERSION,
        status: 'provisional',
        isStale: false,
        isExpired: false,
        ageDays: 0,
        verifiedAt: 'Active Sandbox',
        sourceUrl: '',
        evidence: `User-configured custom sandbox simulation. Computed using active v${CURRENT_GAME_VERSION} mechanics.`,
        badgeLabel: 'Sandbox Simulation',
        badgeDescription: 'User-customized sandbox mode. Real-time calculations active.',
      };
    }

    return {
      datasetId: id,
      version: CURRENT_GAME_VERSION,
      status: 'provisional',
      isStale: false,
      isExpired: false,
      ageDays: 0,
      verifiedAt: 'Unregistered',
      sourceUrl: '',
      evidence:
        'Dataset does not have an explicit provenance record yet; verify in-game before committing resources.',
      badgeLabel: `Active v${CURRENT_GAME_VERSION}`,
      badgeDescription: 'No external provenance record found. Standard engine defaults apply.',
    };
  }

  const vUtc = parseUtcMidnight(provenance.verifiedAt);
  const rUtc = parseUtcMidnight(referenceDate);
  const ageDays =
    Number.isNaN(vUtc) || Number.isNaN(rUtc)
      ? -1
      : Math.floor((rUtc - vUtc) / (1000 * 60 * 60 * 24));

  const expired = isScheduleExpired(provenance, referenceDate);
  const stale = isDatasetStale(provenance, thresholdDays, referenceDate);
  const staleReason = stale ? getStaleReason(provenance, thresholdDays, referenceDate) : undefined;

  if (stale) {
    const expiredNote = expired && provenance.effectiveEndDate
      ? `Schedule ended on ${provenance.effectiveEndDate}. `
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
      effectiveEndDate: provenance.effectiveEndDate,
      sourceUrl: provenance.sourceUrl ?? '',
      evidence: provenance.evidence,
      verificationMethod: provenance.verificationMethod,
      verifiedFields: provenance.verifiedFields,
      badgeLabel: `Stale v${provenance.version}`,
      badgeDescription: `${expiredNote}Data verified ${ageDays >= 0 ? `${ageDays}d ago` : 'in an earlier cycle'} (${provenance.verifiedAt}). Lineups or mechanics may have shifted.`,
    };
  }

  if (provenance.status === 'provisional') {
    const isSandbox =
      provenance.datasetId.includes('sandbox') || provenance.datasetId.startsWith('custom-');
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'provisional',
      isStale: false,
      isExpired: false,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      effectiveEndDate: provenance.effectiveEndDate,
      sourceUrl: provenance.sourceUrl ?? '',
      evidence: provenance.evidence,
      verificationMethod: provenance.verificationMethod,
      verifiedFields: provenance.verifiedFields,
      badgeLabel: isSandbox ? 'Sandbox Simulation' : `Provisional v${provenance.version}`,
      badgeDescription: isSandbox
        ? 'User-customized sandbox mode. Real-time calculations active.'
        : `Provisional data verified on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`,
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
    effectiveEndDate: provenance.effectiveEndDate,
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
