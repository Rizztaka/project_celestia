import type { DataProvenance, ProvenanceStatus } from '../types/genshin';
import { CURRENT_GAME_VERSION, PATCH_CYCLE_DAYS, compareGameVersions } from '../data/game-version';
import { getProvenance } from '../data/provenance-registry';

export interface FreshnessInfo {
  datasetId: string;
  version: string;
  status: ProvenanceStatus;
  isStale: boolean;
  ageDays: number;
  verifiedAt: string;
  sourceUrl: string;
  evidence: string;
  badgeLabel: string;
  badgeDescription: string;
}

/**
 * Determines whether a dataset is considered stale based on:
 * 1. Explicit 'stale' status in provenance
 * 2. Version is older than the current game version (< CURRENT_GAME_VERSION)
 * 3. Age in days exceeds the threshold (defaults to PATCH_CYCLE_DAYS = 42)
 */
export function isDatasetStale(
  provenance: DataProvenance,
  thresholdDays: number = PATCH_CYCLE_DAYS,
  referenceDate: Date = new Date(),
): boolean {
  if (provenance.status === 'stale') {
    return true;
  }

  // Datasets tagged with versions strictly older than active baseline are stale
  if (compareGameVersions(provenance.version, CURRENT_GAME_VERSION) < 0) {
    return true;
  }

  const verifiedTime = new Date(provenance.verifiedAt).getTime();
  const refTime = referenceDate.getTime();

  if (Number.isNaN(verifiedTime)) {
    return true;
  }

  const ageDays = Math.floor((refTime - verifiedTime) / (1000 * 60 * 60 * 24));
  return ageDays > thresholdDays;
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
    return {
      datasetId: id,
      version: CURRENT_GAME_VERSION,
      status: 'provisional',
      isStale: false,
      ageDays: 0,
      verifiedAt: 'Unregistered',
      sourceUrl: '',
      evidence: 'Dataset does not have an explicit provenance entry; assuming active version.',
      badgeLabel: `Active v${CURRENT_GAME_VERSION}`,
      badgeDescription: 'No external provenance record found. Standard engine defaults apply.',
    };
  }

  const verifiedTime = new Date(provenance.verifiedAt).getTime();
  const refTime = referenceDate.getTime();
  const ageDays = Number.isNaN(verifiedTime)
    ? -1
    : Math.floor((refTime - verifiedTime) / (1000 * 60 * 60 * 24));

  const stale = isDatasetStale(provenance, thresholdDays, referenceDate);

  if (stale) {
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'stale',
      isStale: true,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      sourceUrl: provenance.sourceUrl,
      evidence: provenance.evidence,
      badgeLabel: `Stale v${provenance.version}`,
      badgeDescription: `Data verified ${ageDays >= 0 ? `${ageDays}d ago` : 'in an earlier cycle'} (${provenance.verifiedAt}). Lineups or mechanics may have shifted.`,
    };
  }

  if (provenance.status === 'provisional') {
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'provisional',
      isStale: false,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      sourceUrl: provenance.sourceUrl,
      evidence: provenance.evidence,
      badgeLabel: `Provisional v${provenance.version}`,
      badgeDescription: `Provisional data verified on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`,
    };
  }

  return {
    datasetId: provenance.datasetId,
    version: provenance.version,
    status: 'verified',
    isStale: false,
    ageDays,
    verifiedAt: provenance.verifiedAt,
    sourceUrl: provenance.sourceUrl,
    evidence: provenance.evidence,
    badgeLabel: `Verified v${provenance.version}`,
    badgeDescription: `Verified against official Hoyoverse sources on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`,
  };
}
