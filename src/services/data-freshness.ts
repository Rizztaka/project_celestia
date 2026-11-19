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
  if (!provenance) return true;
  if (provenance.status === 'stale') {
    return true;
  }

  // Datasets tagged with versions strictly older than active baseline are stale
  if (compareGameVersions(provenance.version, CURRENT_GAME_VERSION) < 0) {
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
    // Attempt to infer version from id string (e.g. 'banner_5_3_phase_1', 'cycle-5-3', 'season-5-2')
    const vMatch = id.match(/(?:cycle|banner|season)[-_]([0-9]+)[._]([0-9]+)/i) || id.match(/v?([0-9]+\.[0-9]+)/);
    const inferredVersion = vMatch ? `${vMatch[1]}.${vMatch[2] ?? ''}`.replace(/\.$/, '') : null;
    const isSandbox = id.includes('sandbox') || id.startsWith('custom-');

    if (inferredVersion && compareGameVersions(inferredVersion, CURRENT_GAME_VERSION) < 0) {
      return {
        datasetId: id,
        version: inferredVersion,
        status: 'stale',
        isStale: true,
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
        ageDays: 0,
        verifiedAt: 'Active Sandbox',
        sourceUrl: '',
        evidence: 'User-configured custom sandbox simulation. Computed using active v7.2 mechanics.',
        badgeLabel: 'Sandbox Simulation',
        badgeDescription: 'User-customized sandbox mode. Real-time calculations active.',
      };
    }

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

  const vUtc = parseUtcMidnight(provenance.verifiedAt);
  const rUtc = parseUtcMidnight(referenceDate);
  const ageDays = Number.isNaN(vUtc) || Number.isNaN(rUtc)
    ? -1
    : Math.floor((rUtc - vUtc) / (1000 * 60 * 60 * 24));

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
    const isSandbox = provenance.datasetId.includes('sandbox') || provenance.datasetId.startsWith('custom-');
    return {
      datasetId: provenance.datasetId,
      version: provenance.version,
      status: 'provisional',
      isStale: false,
      ageDays,
      verifiedAt: provenance.verifiedAt,
      sourceUrl: provenance.sourceUrl,
      evidence: provenance.evidence,
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
    ageDays,
    verifiedAt: provenance.verifiedAt,
    sourceUrl: provenance.sourceUrl,
    evidence: provenance.evidence,
    badgeLabel: `Verified v${provenance.version}`,
    badgeDescription: `Verified against official Hoyoverse sources on ${provenance.verifiedAt}. Evidence: ${provenance.evidence}`,
  };
}
