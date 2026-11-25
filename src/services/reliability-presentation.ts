import type {
  DataProvenance,
  DependencyRiskTier,
  FreshnessPolicyKind,
  RecommendationMode,
  RecommendationReliability,
  ReliabilityDependencyDetail,
  ReliabilityStatus,
  TemporalState,
  VerificationMethod,
  VerificationState,
} from '../types/genshin';
import { getProvenance } from '../data/provenance-registry';
import { BANNER_PHASES, getActiveBannerPhase } from '../data/banners';
import {
  formatDateUtc,
  resolveCanonicalSchedule,
  resolveScheduleTemporalState,
} from './recommendation-reliability';

export type ReliabilitySeverity = 'none' | 'info' | 'warning' | 'blocking';
export type ReliabilityContainerKind = 'none' | 'context' | 'status' | 'alert';
export type ProvenanceMatchStatus = 'matched' | 'unregistered' | 'unmatched' | 'ambiguous';

export type ReliabilityBadgeTone =
  | 'reliable'
  | 'qualified_caution'
  | 'qualified_info'
  | 'historical'
  | 'unsupported';

export interface FormattedDependencyRow {
  datasetId: string;
  role: 'required' | 'optional';
  roleLabel: 'Required' | 'Optional (Non-Blocking)';
  verification: VerificationState;
  policy: FreshnessPolicyKind;
  riskTier: DependencyRiskTier;
  version?: string;
  verifiedAt?: string;
  reason?: string;
  provenanceMatch: ProvenanceMatchStatus;
  /** Defined strictly when provenanceMatch === 'matched' */
  evidence?: string;
  verificationMethod?: VerificationMethod;
  verifiedFields?: string[];
  sourceUrl?: string;
}

export interface ReliabilityPresentationModel {
  status: ReliabilityStatus;
  mode: RecommendationMode;
  verification: VerificationState;
  temporalState: TemporalState;
  isActionable: boolean;

  badgeLabel: string;
  badgeTone: ReliabilityBadgeTone;
  actionabilityLabel: string;
  contextTag: string;
  triggerAriaLabel: string;

  bannerSeverity: ReliabilitySeverity;
  /** 'none' omits banner; 'context' renders <section>; 'status' renders <div role="status"> text + sibling controls; 'alert' renders <div role="alert"> text + sibling controls */
  containerKind: ReliabilityContainerKind;
  bannerTitle: string;
  bannerSummary: string;

  warnings: string[];
  requiredDependencies: FormattedDependencyRow[];
  optionalDependencies: FormattedDependencyRow[];
  evaluatedAt?: string;
  dependencyEvidenceAvailable: boolean;
}

const PROVISIONAL_FROM_VERIFIED_REASONS: ReadonlySet<string> = new Set([
  'future_version',
  'insufficient_verification_metadata',
  'sandbox_dataset',
]);

function compareCodeUnit(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function sanitizeHttpsUrl(rawUrl?: string): string | undefined {
  if (typeof rawUrl !== 'string') return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:' ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function isProvenanceStatusCompatible(
  depVerification: Exclude<VerificationState, 'unregistered'>,
  recordStatus: DataProvenance['status'],
  depReason?: string,
): boolean {
  switch (depVerification) {
    case 'verified':
      return recordStatus === 'verified';
    case 'stale':
      return recordStatus === 'verified' || recordStatus === 'stale';
    case 'provisional':
      if (recordStatus === 'provisional') {
        return true;
      }
      if (recordStatus === 'verified') {
        return depReason !== undefined && PROVISIONAL_FROM_VERIFIED_REASONS.has(depReason);
      }
      return false;
  }
}

function buildFailedDependencyRow(
  dep: ReliabilityDependencyDetail,
  provenanceMatch: Exclude<ProvenanceMatchStatus, 'matched'>,
): FormattedDependencyRow {
  return {
    datasetId: dep.datasetId,
    role: dep.required ? 'required' : 'optional',
    roleLabel: dep.required ? 'Required' : 'Optional (Non-Blocking)',
    verification: dep.verification,
    policy: dep.policy,
    riskTier: dep.riskTier,
    ...(dep.version !== undefined ? { version: dep.version } : {}),
    ...(dep.verifiedAt !== undefined ? { verifiedAt: dep.verifiedAt } : {}),
    ...(dep.reason !== undefined ? { reason: dep.reason } : {}),
    provenanceMatch,
  };
}

function matchDependencyProvenance(
  dep: ReliabilityDependencyDetail,
  datasetCounts: ReadonlyMap<string, number>,
  provenanceIdSet: ReadonlySet<string>,
): FormattedDependencyRow {
  // Predicate 1: non-empty datasetId and no duplicate datasetId ambiguity
  if (dep.datasetId.length === 0) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }
  if ((datasetCounts.get(dep.datasetId) ?? 0) !== 1) {
    return buildFailedDependencyRow(dep, 'ambiguous');
  }

  // Predicate 2: dependency is neither unregistered nor marked missing_provenance
  if (dep.verification === 'unregistered' || dep.reason === 'missing_provenance') {
    return buildFailedDependencyRow(dep, 'unregistered');
  }

  // Predicate 3: envelope explicitly attested this datasetId in provenanceIds
  if (!provenanceIdSet.has(dep.datasetId)) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }

  // Predicate 4: exact registry lookup and exact datasetId identity match
  const record = getProvenance(dep.datasetId);
  if (record === undefined) {
    return buildFailedDependencyRow(dep, 'unregistered');
  }
  if (typeof record !== 'object' || record === null || record.datasetId !== dep.datasetId) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }

  // Predicate 5: exact version match
  if (dep.version === undefined || record.version !== dep.version) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }

  // Predicate 6: exact verifiedAt match
  if (dep.verifiedAt === undefined || record.verifiedAt !== dep.verifiedAt) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }

  // Predicate 7: status compatibility rule
  if (!isProvenanceStatusCompatible(dep.verification, record.status, dep.reason)) {
    return buildFailedDependencyRow(dep, 'unmatched');
  }

  const safeSourceUrl = sanitizeHttpsUrl(record.sourceUrl);

  return {
    datasetId: dep.datasetId,
    role: dep.required ? 'required' : 'optional',
    roleLabel: dep.required ? 'Required' : 'Optional (Non-Blocking)',
    verification: dep.verification,
    policy: dep.policy,
    riskTier: dep.riskTier,
    version: dep.version,
    verifiedAt: dep.verifiedAt,
    ...(dep.reason !== undefined ? { reason: dep.reason } : {}),
    provenanceMatch: 'matched',
    evidence: record.evidence,
    ...(record.verificationMethod !== undefined
      ? { verificationMethod: record.verificationMethod }
      : {}),
    ...(record.verifiedFields !== undefined
      ? { verifiedFields: [...record.verifiedFields] }
      : {}),
    ...(safeSourceUrl !== undefined ? { sourceUrl: safeSourceUrl } : {}),
  };
}

function formatContextTag(mode: RecommendationMode, temporalState: TemporalState): string {
  let modeLabel: string;
  switch (mode) {
    case 'current':
      modeLabel = 'Live';
      break;
    case 'planning_preview':
      modeLabel = 'Preview';
      break;
    case 'archive_simulation':
      modeLabel = 'Archive';
      break;
    case 'sandbox_simulation':
      modeLabel = 'Sandbox';
      break;
  }

  let temporalLabel: string | undefined;
  switch (temporalState) {
    case 'active':
      temporalLabel = 'Active Schedule';
      break;
    case 'upcoming':
      temporalLabel = 'Upcoming Schedule';
      break;
    case 'expired':
      temporalLabel = 'Expired Schedule';
      break;
    case 'not_applicable':
      temporalLabel = undefined;
      break;
  }

  return temporalLabel ? `${modeLabel} · ${temporalLabel}` : modeLabel;
}

function buildTriggerAriaLabel(badgeLabel: string, actionabilityLabel: string): string {
  return `Reliability: ${badgeLabel} (${actionabilityLabel}). Toggle reliability details.`;
}

/**
 * Pure presentation formatter for Phase 3 `RecommendationReliability` envelopes.
 * Performs strict 7-predicate dependency-to-provenance matching without invoking
 * any Phase 2 or Phase 3 reliability evaluators.
 */
export function formatReliabilityPresentation(
  reliability: RecommendationReliability,
): ReliabilityPresentationModel {
  const warnings = Array.isArray(reliability.warnings) ? [...reliability.warnings] : [];
  const rawDependencies = Array.isArray(reliability.dependencies) ? reliability.dependencies : [];
  const provenanceIdSet = new Set(
    Array.isArray(reliability.provenanceIds) ? reliability.provenanceIds : [],
  );

  const datasetCounts = new Map<string, number>();
  for (const dep of rawDependencies) {
    datasetCounts.set(dep.datasetId, (datasetCounts.get(dep.datasetId) ?? 0) + 1);
  }

  const requiredDependencies: FormattedDependencyRow[] = [];
  const optionalDependencies: FormattedDependencyRow[] = [];

  for (const dep of rawDependencies) {
    const row = matchDependencyProvenance(dep, datasetCounts, provenanceIdSet);
    if (dep.required) {
      requiredDependencies.push(row);
    } else {
      optionalDependencies.push(row);
    }
  }

  const dependencyEvidenceAvailable =
    requiredDependencies.length > 0 || optionalDependencies.length > 0;
  const contextTag = formatContextTag(reliability.mode, reliability.temporalState);

  let badgeLabel: string;
  let badgeTone: ReliabilityBadgeTone;
  let actionabilityLabel: string;
  let bannerSeverity: ReliabilitySeverity;
  let containerKind: ReliabilityContainerKind;
  let bannerTitle: string;
  let bannerSummary: string;

  switch (reliability.status) {
    case 'reliable': {
      badgeLabel = 'Reliable';
      badgeTone = 'reliable';

      if (warnings.length === 0) {
        actionabilityLabel = 'Live-Actionable';
        bannerSeverity = 'none';
        containerKind = 'none';
        bannerTitle = 'Live-Actionable Recommendation';
        bannerSummary =
          requiredDependencies.length > 0 &&
          requiredDependencies.every((d) => d.verification === 'verified')
            ? 'All listed required dependencies are verified for live-game decisions.'
            : 'Recommendation is marked reliable and live-actionable with no active notices.';
      } else {
        const nonVerifiedOptional = optionalDependencies.filter(
          (d) => d.verification !== 'verified',
        );
        const hasOptionalNotice = nonVerifiedOptional.length > 0;

        actionabilityLabel = hasOptionalNotice
          ? 'Live-Actionable · Optional Notice'
          : 'Live-Actionable · Notice';
        bannerSeverity = 'warning';
        containerKind = 'status';
        bannerTitle = hasOptionalNotice
          ? 'Live-Actionable with Optional Data Notice'
          : 'Live-Actionable with Advisory Notice';
        bannerSummary = hasOptionalNotice
          ? `Optional non-blocking dataset(s) (${nonVerifiedOptional.map((d) => d.datasetId).join(', ')}) have verification notices.`
          : warnings.join(' ');
      }
      break;
    }

    case 'qualified': {
      if (reliability.mode === 'planning_preview') {
        badgeLabel = 'Preview';
        badgeTone = 'qualified_info';
        actionabilityLabel = 'Not Live-Actionable · Preview';
        bannerSeverity = 'info';
        containerKind = 'context';
        bannerTitle = 'Planning Preview';
        bannerSummary =
          reliability.temporalState === 'upcoming'
            ? 'Forward-looking preview for an upcoming schedule. Results are for planning only and are not live-actionable.'
            : 'Forward-looking planning preview. Results are for planning only and are not live-actionable.';
      } else if (reliability.mode === 'sandbox_simulation') {
        badgeLabel = 'Sandbox';
        badgeTone = 'qualified_info';
        actionabilityLabel = 'Not Live-Actionable · Simulation';
        bannerSeverity = 'info';
        containerKind = 'context';
        bannerTitle = 'Sandbox Simulation';
        bannerSummary =
          'Simulation based on user-configured or experimental parameters. Results are not official live-game advice.';
      } else {
        const staleRequired = requiredDependencies.filter((d) => d.verification === 'stale');
        const provisionalRequired = requiredDependencies.filter(
          (d) => d.verification === 'provisional',
        );

        if (staleRequired.length > 0) {
          badgeLabel = 'Qualified · Stale Dependency';
          badgeTone = 'qualified_caution';
          actionabilityLabel = reliability.isActionable
            ? 'Live-Actionable · Qualified'
            : 'Not Live-Actionable · Qualified';
          bannerSeverity = 'warning';
          containerKind = 'status';
          bannerTitle = 'Qualified Recommendation (Stale Dependency)';
          bannerSummary = `Required dataset(s) ${staleRequired.map((d) => d.datasetId).join(', ')} are past their freshness threshold.${reliability.isActionable ? ' Advice remains usable with caution.' : ' Results are not currently live-actionable.'}`;
        } else if (provisionalRequired.length > 0) {
          badgeLabel = 'Qualified · Provisional Data';
          badgeTone = 'qualified_caution';
          actionabilityLabel = reliability.isActionable
            ? 'Live-Actionable · Qualified'
            : 'Not Live-Actionable · Qualified';
          bannerSeverity = 'warning';
          containerKind = 'status';
          bannerTitle = 'Qualified Recommendation (Provisional Data)';
          bannerSummary = `Required dataset(s) ${provisionalRequired.map((d) => d.datasetId).join(', ')} are provisional.${reliability.isActionable ? ' Advice remains usable with caution.' : ' Results are not currently live-actionable.'}`;
        } else if (
          requiredDependencies.length > 0 &&
          requiredDependencies.every((d) => d.verification === 'verified') &&
          !reliability.isActionable
        ) {
          badgeLabel = 'Qualified · Advisory Only';
          badgeTone = 'qualified_info';
          actionabilityLabel = 'Not Live-Actionable · Advisory Only';
          bannerSeverity = 'info';
          containerKind = 'context';
          bannerTitle = 'Advisory-Only Recommendation';
          bannerSummary =
            warnings.length > 0
              ? `Listed required dependencies are verified, while non-actionable advisories apply: ${warnings.join(' ')}`
              : 'Listed required dependencies are verified, while this recommendation is marked non-actionable.';
        } else {
          badgeLabel = 'Qualified';
          badgeTone = reliability.isActionable ? 'qualified_caution' : 'qualified_info';
          actionabilityLabel = reliability.isActionable
            ? 'Live-Actionable · Qualified'
            : 'Not Live-Actionable · Qualified';
          bannerSeverity = reliability.isActionable ? 'warning' : 'info';
          containerKind = reliability.isActionable ? 'status' : 'context';
          bannerTitle = 'Qualified Recommendation';
          bannerSummary =
            warnings.length > 0
              ? warnings.join(' ')
              : reliability.isActionable
                ? 'Recommendation is marked qualified and live-actionable.'
                : 'Recommendation is marked qualified and not live-actionable.';
        }
      }
      break;
    }

    case 'historical': {
      badgeLabel = 'Historical';
      badgeTone = 'historical';
      actionabilityLabel = 'Not Live-Actionable · Archive';
      bannerSeverity = 'info';
      containerKind = 'context';
      bannerTitle = 'Historical Archive Simulation';
      bannerSummary =
        'Results reflect archived historical data and are not actionable in the live game.';
      break;
    }

    case 'unsupported': {
      badgeLabel = 'Unsupported';
      badgeTone = 'unsupported';
      actionabilityLabel = 'Blocked · Not Live-Actionable';
      bannerSeverity = 'blocking';
      containerKind = 'alert';
      bannerTitle = 'Unsupported Recommendation Context';
      bannerSummary =
        warnings.length > 0
          ? warnings[0]
          : 'Required data or schedule context is unsupported; results are not live-actionable.';
      break;
    }
  }

  return {
    status: reliability.status,
    mode: reliability.mode,
    verification: reliability.verification,
    temporalState: reliability.temporalState,
    isActionable: reliability.isActionable,
    badgeLabel,
    badgeTone,
    actionabilityLabel,
    contextTag,
    triggerAriaLabel: buildTriggerAriaLabel(badgeLabel, actionabilityLabel),
    bannerSeverity,
    containerKind,
    bannerTitle,
    bannerSummary,
    warnings,
    requiredDependencies,
    optionalDependencies,
    ...(reliability.evaluatedAt !== undefined ? { evaluatedAt: reliability.evaluatedAt } : {}),
    dependencyEvidenceAvailable,
  };
}

/**
 * Selects the canonical default banner ID for `refDate` with deterministic tie-breaking
 * and zero hard-coded banner IDs:
 * 1. Active banner (`getActiveBannerPhase`).
 * 2. Earliest upcoming banner (`startDate` ascending, ties by `BANNER_PHASES` index).
 * 3. Most recent historical banner (`endDate` descending, then `startDate` descending, ties by index).
 * 4. First entry in `BANNER_PHASES`, or `'sandbox'` when empty.
 */
export function selectDefaultBannerId(refDate: Date = new Date()): string {
  const formatted = formatDateUtc(refDate);
  if (!formatted) {
    return BANNER_PHASES[0]?.id ?? 'sandbox';
  }

  const active = getActiveBannerPhase(refDate);
  if (active) {
    return active.id;
  }

  const dateStr = formatted.dateStr;
  const upcoming: Array<{ id: string; startDate: string; index: number }> = [];
  const expired: Array<{ id: string; startDate: string; endDate: string; index: number }> = [];

  for (let index = 0; index < BANNER_PHASES.length; index++) {
    const phase = BANNER_PHASES[index];
    const window = resolveCanonicalSchedule({ type: 'banner', entityId: phase.id });
    const temporalState = resolveScheduleTemporalState(window, dateStr);

    if (temporalState === 'upcoming' && window?.startDate) {
      upcoming.push({ id: phase.id, startDate: window.startDate, index });
    } else if (temporalState === 'expired' && window?.startDate && window.endDate) {
      expired.push({
        id: phase.id,
        startDate: window.startDate,
        endDate: window.endDate,
        index,
      });
    }
  }

  if (upcoming.length > 0) {
    upcoming.sort(
      (a, b) => compareCodeUnit(a.startDate, b.startDate) || a.index - b.index,
    );
    return upcoming[0].id;
  }

  if (expired.length > 0) {
    expired.sort(
      (a, b) =>
        compareCodeUnit(b.endDate, a.endDate) ||
        compareCodeUnit(b.startDate, a.startDate) ||
        a.index - b.index,
    );
    return expired[0].id;
  }

  return BANNER_PHASES[0]?.id ?? 'sandbox';
}
