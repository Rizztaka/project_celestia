import type {
  DataProvenance,
  DependencyRiskTier,
  FreshnessPolicyKind,
  RecommendationMode,
  RecommendationReliability,
  ReliabilityDependencyDetail,
  ReliabilityEvaluationContext,
  ReliabilityScheduleRef,
  ReliabilityScheduleType,
  ReliabilityStatus,
  TemporalState,
  VerificationState,
} from '../types/genshin';
import { ABYSS_CYCLES } from '../data/abyss-schedules';
import { BANNER_PHASES } from '../data/banners';
import {
  CURRENT_GAME_VERSION,
  PATCH_CYCLE_DAYS,
  compareGameVersions,
} from '../data/game-version';
import { DATA_PROVENANCE_REGISTRY } from '../data/provenance-registry';
import { THEATER_SEASONS } from '../data/theater-seasons';

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const CALENDAR_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_TIMESTAMP_WITH_TZ_RE =
  /^(\d{4})-(\d{2})-(\d{2})T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:\d{2})$/;
const HISTORICAL_ARCHIVE_EVIDENCE_RE = /^Historical Archive\b/i;
const COMPROMISED_EVIDENCE_RE =
  /\b(compromised|corrupted|invalidated|unverified|retracted|do not use|broken)\b/i;

const VALID_RECOMMENDATION_MODES: ReadonlySet<string> = new Set<RecommendationMode>([
  'current',
  'planning_preview',
  'archive_simulation',
  'sandbox_simulation',
]);

function isValidRecommendationMode(mode: unknown): mode is RecommendationMode {
  return typeof mode === 'string' && VALID_RECOMMENDATION_MODES.has(mode);
}

export type FreshnessStaleReason =
  | 'explicit_stale'
  | 'outdated_version'
  | 'expired_schedule'
  | 'age_exceeded'
  | 'invalid_date';

export interface ParsedUtcDate {
  dateStr: string;
  utcMs: number;
}

export interface CanonicalScheduleWindow {
  type: ReliabilityScheduleType;
  entityId: string;
  startDate?: string;
  endDate?: string;
  /**
   * Banners and Abyss use inclusive bounds `[startDate, endDate]`.
   * Imaginarium Theater uses half-open bounds `[effectiveStartDate, effectiveEndDate)`
   * matching `getActiveTheaterSeason()` so monthly resets transition cleanly on day 1.
   */
  endInclusive: boolean;
}

export interface DatasetFreshnessPolicy {
  policy: FreshnessPolicyKind;
  riskTier: DependencyRiskTier;
  maxAgeDays?: number;
  provisionalActionable: boolean;
  staleActionable: boolean;
}

export interface DatasetFreshnessResult {
  policy: DatasetFreshnessPolicy;
  isStale: boolean;
  isExpired: boolean;
  staleReason?: FreshnessStaleReason;
  ageDays: number;
  canonicalSchedule?: CanonicalScheduleWindow;
  canonicalEndDate?: string;
  temporalState: TemporalState;
  hasValidVerifiedAt: boolean;
}

export interface ReliabilityEvaluationOptions {
  /** Optional provenance registry override for deterministic unit testing. */
  provenanceRegistry?: Readonly<Record<string, DataProvenance>>;
}

function compareCodeUnit(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

function dedupeAndSortIds(ids: readonly string[]): string[] {
  const unique = new Set<string>();
  for (const id of ids) {
    unique.add(id);
  }
  return Array.from(unique).sort(compareCodeUnit);
}

function dedupeStrings(items: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function buildValidatedUtcDate(year: number, month: number, day: number): ParsedUtcDate | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const utcMs = Date.UTC(year, month - 1, day);
  const check = new Date(utcMs);
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return null;
  }
  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return { dateStr: `${yyyy}-${mm}-${dd}`, utcMs };
}

/**
 * Parses an explicit ISO-8601 calendar date (`YYYY-MM-DD`) or timezone-qualified
 * timestamp (`YYYY-MM-DDTHH:mm:ssZ` / `±HH:MM`) into a UTC calendar date with zero
 * local-timezone drift.
 */
export function parseIsoCalendarDate(input: string): ParsedUtcDate | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();

  const dateMatch = CALENDAR_DATE_RE.exec(trimmed);
  if (dateMatch) {
    return buildValidatedUtcDate(
      parseInt(dateMatch[1], 10),
      parseInt(dateMatch[2], 10),
      parseInt(dateMatch[3], 10),
    );
  }

  const tsMatch = ISO_TIMESTAMP_WITH_TZ_RE.exec(trimmed);
  if (tsMatch) {
    // Reject impossible calendar dates (e.g. 2026-02-30T12:00:00Z) before Date.parse normalizes them.
    if (
      !buildValidatedUtcDate(
        parseInt(tsMatch[1], 10),
        parseInt(tsMatch[2], 10),
        parseInt(tsMatch[3], 10),
      )
    ) {
      return null;
    }
    const parsedMs = Date.parse(trimmed);
    if (Number.isNaN(parsedMs)) return null;
    const d = new Date(parsedMs);
    return buildValidatedUtcDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
  }

  return null;
}

/**
 * Formats a `Date` instance as a UTC calendar date (`YYYY-MM-DD`) without local-timezone shifts.
 */
export function formatDateUtc(date: Date): ParsedUtcDate | null {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  return buildValidatedUtcDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

/**
 * Identifies sandbox dataset IDs consistently across freshness and reliability checks.
 */
export function isSandboxDatasetId(datasetId: string): boolean {
  return (
    datasetId === 'custom-sandbox' ||
    datasetId.includes('sandbox') ||
    datasetId.startsWith('custom-')
  );
}

/**
 * Resolves a canonical schedule entity by explicit type and ID.
 * Never substitutes an active default when `entityId` is unknown.
 */
export function resolveCanonicalSchedule(
  ref: ReliabilityScheduleRef,
): CanonicalScheduleWindow | undefined {
  switch (ref.type) {
    case 'banner': {
      const phase = BANNER_PHASES.find((p) => p.id === ref.entityId);
      if (!phase) return undefined;
      return {
        type: 'banner',
        entityId: phase.id,
        startDate: phase.startDate,
        endDate: phase.endDate,
        endInclusive: true,
      };
    }
    case 'abyss': {
      const cycle = ABYSS_CYCLES.find((c) => c.id === ref.entityId);
      if (!cycle) return undefined;
      return {
        type: 'abyss',
        entityId: cycle.id,
        startDate: cycle.effectiveStartDate,
        endDate: cycle.effectiveEndDate,
        endInclusive: true,
      };
    }
    case 'theater': {
      const season = THEATER_SEASONS.find((s) => s.id === ref.entityId);
      if (!season) return undefined;
      return {
        type: 'theater',
        entityId: season.id,
        startDate: season.effectiveStartDate,
        endDate: season.effectiveEndDate,
        endInclusive: false,
      };
    }
    default:
      return undefined;
  }
}

/**
 * Resolves a canonical schedule entity across Banners, Abyss, and Theater by dataset ID.
 */
export function resolveCanonicalScheduleById(
  datasetId: string,
): CanonicalScheduleWindow | undefined {
  return (
    resolveCanonicalSchedule({ type: 'banner', entityId: datasetId }) ??
    resolveCanonicalSchedule({ type: 'abyss', entityId: datasetId }) ??
    resolveCanonicalSchedule({ type: 'theater', entityId: datasetId })
  );
}

/**
 * Evaluates a canonical schedule's temporal applicability against a UTC calendar date.
 */
export function resolveScheduleTemporalState(
  window: CanonicalScheduleWindow | undefined,
  evaluatedDateStr: string,
): TemporalState {
  if (!window || !window.startDate || !window.endDate) {
    return 'not_applicable';
  }
  if (evaluatedDateStr < window.startDate) {
    return 'upcoming';
  }
  if (window.endInclusive) {
    return evaluatedDateStr <= window.endDate ? 'active' : 'expired';
  }
  return evaluatedDateStr < window.endDate ? 'active' : 'expired';
}

/**
 * Resolves the explicit freshness and risk policy for classified dataset families.
 * Returns `undefined` for unrecognized dataset IDs so integrity tests can detect
 * any newly registered dataset that lacks an explicit policy classification.
 *
 * - Time-boxed schedules (`banner_*`, `cycle-*`, `season-*`): governed exclusively by
 *   canonical schedule dates and game version (`schedule_window`, high-risk; never uses 42-day decay).
 * - Gacha rules & core SSOT catalogs (`gacha_rules_*`, `characters_*`, `weapons_*`,
 *   `artifacts_*`, `talent_scaling_*`, `enka_id_map_*`): governed by active game version
 *   (`version_bound`, high-risk; never uses 42-day decay).
 * - Advisory meta heuristics (`artifact_weights_*`, `rotations_*`, `team_archetypes_*`):
 *   uses the 42-day `PATCH_CYCLE_DAYS` review cadence (`patch_cadence`, low-risk;
 *   deliberately policy-permitted to remain qualified-and-actionable with warnings when
 *   explicitly provisional or past review cadence).
 * - User sandbox (`custom-sandbox`, `custom-*`, `*sandbox*`): `sandbox` policy, low-risk,
 *   never uses 42-day decay, never live-actionable (`provisionalActionable: false`,
 *   `staleActionable: false`).
 */
export function resolveExplicitDatasetFreshnessPolicy(
  datasetId: string,
): DatasetFreshnessPolicy | undefined {
  if (isSandboxDatasetId(datasetId)) {
    return {
      policy: 'sandbox',
      riskTier: 'low',
      provisionalActionable: false,
      staleActionable: false,
    };
  }

  if (
    datasetId.startsWith('banner_') ||
    datasetId.startsWith('cycle-') ||
    datasetId.startsWith('season-')
  ) {
    return {
      policy: 'schedule_window',
      riskTier: 'high',
      provisionalActionable: false,
      staleActionable: false,
    };
  }

  if (
    datasetId.startsWith('gacha_rules_') ||
    datasetId.startsWith('characters_') ||
    datasetId.startsWith('weapons_') ||
    datasetId.startsWith('artifacts_') ||
    datasetId.startsWith('talent_scaling_') ||
    datasetId.startsWith('enka_id_map_')
  ) {
    return {
      policy: 'version_bound',
      riskTier: 'high',
      provisionalActionable: false,
      staleActionable: false,
    };
  }

  if (
    datasetId.startsWith('artifact_weights_') ||
    datasetId.startsWith('rotations_') ||
    datasetId.startsWith('team_archetypes_')
  ) {
    return {
      policy: 'patch_cadence',
      riskTier: 'low',
      maxAgeDays: PATCH_CYCLE_DAYS,
      provisionalActionable: true,
      staleActionable: true,
    };
  }

  return undefined;
}

/**
 * Resolves the effective freshness and risk policy for any dataset ID.
 * Unclassified IDs fall back to the safest conservative policy (`patch_cadence`,
 * `high` risk tier, non-actionable when provisional or stale).
 */
export function getDatasetFreshnessPolicy(datasetId: string): DatasetFreshnessPolicy {
  return (
    resolveExplicitDatasetFreshnessPolicy(datasetId) ?? {
      policy: 'patch_cadence',
      riskTier: 'high',
      maxAgeDays: PATCH_CYCLE_DAYS,
      provisionalActionable: false,
      staleActionable: false,
    }
  );
}

/**
 * Single authoritative freshness evaluation shared by `evaluateRecommendationReliability()`
 * and legacy `src/services/data-freshness.ts` so both never disagree on staleness or expiry.
 */
export function evaluateDatasetFreshness(
  record: DataProvenance,
  evaluatedDate: ParsedUtcDate | null,
  thresholdDaysOverride?: number,
): DatasetFreshnessResult {
  const policy = getDatasetFreshnessPolicy(record.datasetId);
  const canonicalSchedule =
    policy.policy === 'schedule_window'
      ? resolveCanonicalScheduleById(record.datasetId)
      : undefined;
  const canonicalEndDate = canonicalSchedule?.endDate;
  const temporalState =
    evaluatedDate && canonicalSchedule
      ? resolveScheduleTemporalState(canonicalSchedule, evaluatedDate.dateStr)
      : 'not_applicable';
  const isExpired = temporalState === 'expired';
  const parsedVerifiedAt = parseIsoCalendarDate(record.verifiedAt);
  const hasValidVerifiedAt = parsedVerifiedAt !== null;
  const ageDays =
    parsedVerifiedAt && evaluatedDate
      ? Math.floor((evaluatedDate.utcMs - parsedVerifiedAt.utcMs) / MS_PER_DAY)
      : -1;

  if (record.status === 'stale') {
    return {
      policy,
      isStale: true,
      isExpired,
      staleReason: 'explicit_stale',
      ageDays,
      canonicalSchedule,
      canonicalEndDate,
      temporalState,
      hasValidVerifiedAt,
    };
  }

  if (policy.policy === 'sandbox') {
    return {
      policy,
      isStale: false,
      isExpired: false,
      ageDays,
      canonicalSchedule,
      canonicalEndDate,
      temporalState: 'not_applicable',
      hasValidVerifiedAt,
    };
  }

  if (compareGameVersions(record.version, CURRENT_GAME_VERSION) < 0) {
    return {
      policy,
      isStale: true,
      isExpired,
      staleReason: 'outdated_version',
      ageDays,
      canonicalSchedule,
      canonicalEndDate,
      temporalState,
      hasValidVerifiedAt,
    };
  }

  if (policy.policy === 'schedule_window' && isExpired) {
    return {
      policy,
      isStale: true,
      isExpired: true,
      staleReason: 'expired_schedule',
      ageDays,
      canonicalSchedule,
      canonicalEndDate,
      temporalState,
      hasValidVerifiedAt,
    };
  }

  if (!hasValidVerifiedAt || !evaluatedDate) {
    return {
      policy,
      isStale: true,
      isExpired,
      staleReason: 'invalid_date',
      ageDays: -1,
      canonicalSchedule,
      canonicalEndDate,
      temporalState,
      hasValidVerifiedAt,
    };
  }

  if (policy.policy === 'patch_cadence') {
    const maxAge = thresholdDaysOverride ?? policy.maxAgeDays ?? PATCH_CYCLE_DAYS;
    if (ageDays > maxAge) {
      return {
        policy,
        isStale: true,
        isExpired,
        staleReason: 'age_exceeded',
        ageDays,
        canonicalSchedule,
        canonicalEndDate,
        temporalState,
        hasValidVerifiedAt,
      };
    }
  }

  return {
    policy,
    isStale: false,
    isExpired,
    ageDays,
    canonicalSchedule,
    canonicalEndDate,
    temporalState,
    hasValidVerifiedAt,
  };
}

function hasSubstantiveVerificationMetadata(record: DataProvenance): boolean {
  return (
    record.verificationMethod !== undefined &&
    typeof record.evidence === 'string' &&
    record.evidence.trim().length > 0 &&
    Array.isArray(record.verifiedFields) &&
    record.verifiedFields.length > 0
  );
}

/**
 * Classifies whether a dependency is admissible in `archive_simulation` mode:
 * - `valid`: verified current/supporting data, an expired verified schedule, a low-risk
 *   patch-cadence dataset whose review window elapsed, or an attested prior-version
 *   canonical historical schedule archive with substantive metadata.
 * - `compromised_explicit_stale`: explicitly marked `stale` outside attested prior-version
 *   canonical schedule archives (e.g., compromised current-version or non-schedule data).
 * - `insufficient_metadata`: missing verificationMethod / verifiedFields / evidence or invalid verifiedAt.
 * - `provisional_unverified`: provisional or sandbox dataset not verified for historical archive use.
 * - `unregistered`: missing provenance record.
 */
type ArchiveAdmissibility =
  | 'valid'
  | 'compromised_explicit_stale'
  | 'insufficient_metadata'
  | 'provisional_unverified'
  | 'unregistered';

interface ResolvedDependencyInternal {
  detail: ReliabilityDependencyDetail;
  policy: DatasetFreshnessPolicy;
  isRegistered: boolean;
  temporalState: TemporalState;
  archiveAdmissibility: ArchiveAdmissibility;
  warnings: string[];
}

function isAttestedPriorVersionScheduleArchive(
  record: DataProvenance,
  freshness: DatasetFreshnessResult,
  substantive: boolean,
): boolean {
  return (
    freshness.policy.policy === 'schedule_window' &&
    freshness.canonicalSchedule !== undefined &&
    freshness.hasValidVerifiedAt &&
    substantive &&
    compareGameVersions(record.version, CURRENT_GAME_VERSION) < 0 &&
    HISTORICAL_ARCHIVE_EVIDENCE_RE.test(record.evidence.trim()) &&
    !COMPROMISED_EVIDENCE_RE.test(record.evidence)
  );
}

function resolveDependency(
  datasetId: string,
  required: boolean,
  evaluatedDate: ParsedUtcDate,
  registry: Readonly<Record<string, DataProvenance>>,
): ResolvedDependencyInternal {
  const fallbackPolicy = getDatasetFreshnessPolicy(datasetId);
  const record = Object.prototype.hasOwnProperty.call(registry, datasetId)
    ? registry[datasetId]
    : undefined;
  const roleLabel = required ? 'Required' : 'Optional';

  if (!record) {
    return {
      detail: {
        datasetId,
        required,
        verification: 'unregistered',
        policy: fallbackPolicy.policy,
        riskTier: fallbackPolicy.riskTier,
        reason: 'missing_provenance',
      },
      policy: fallbackPolicy,
      isRegistered: false,
      temporalState: 'not_applicable',
      archiveAdmissibility: 'unregistered',
      warnings: [
        `${roleLabel} dataset "${datasetId}" has no provenance record (unregistered).`,
      ],
    };
  }

  const freshness = evaluateDatasetFreshness(record, evaluatedDate);
  const substantive = hasSubstantiveVerificationMetadata(record);
  const warnings: string[] = [];

  let verification: VerificationState;
  let reason: string | undefined;
  let archiveAdmissibility: ArchiveAdmissibility;

  if (freshness.isStale) {
    verification = 'stale';
    reason = freshness.staleReason;

    if (!freshness.hasValidVerifiedAt) {
      archiveAdmissibility = 'insufficient_metadata';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" has an invalid verifiedAt date ("${record.verifiedAt}").`,
      );
    } else if (!substantive) {
      archiveAdmissibility = 'insufficient_metadata';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" lacks required verification metadata (method, verifiedFields, or evidence).`,
      );
    } else if (freshness.staleReason === 'explicit_stale') {
      if (isAttestedPriorVersionScheduleArchive(record, freshness, substantive)) {
        archiveAdmissibility = 'valid';
        warnings.push(
          `${roleLabel} dataset "${datasetId}" (v${record.version}) is an archived historical schedule marked stale for active play.`,
        );
      } else {
        archiveAdmissibility = 'compromised_explicit_stale';
        warnings.push(
          `${roleLabel} dataset "${datasetId}" (v${record.version}) is explicitly marked stale and cannot be relied upon as verified data.`,
        );
      }
    } else if (freshness.staleReason === 'expired_schedule') {
      archiveAdmissibility =
        record.status === 'verified' && freshness.canonicalSchedule !== undefined
          ? 'valid'
          : 'provisional_unverified';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" schedule has expired as of ${evaluatedDate.dateStr}.`,
      );
    } else if (freshness.staleReason === 'outdated_version') {
      archiveAdmissibility =
        record.status === 'verified' &&
        freshness.policy.policy === 'schedule_window' &&
        freshness.canonicalSchedule !== undefined
          ? 'valid'
          : 'compromised_explicit_stale';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" targets outdated v${record.version} (active v${CURRENT_GAME_VERSION}).`,
      );
    } else if (freshness.staleReason === 'age_exceeded') {
      archiveAdmissibility =
        record.status === 'verified' && freshness.policy.riskTier === 'low'
          ? 'valid'
          : 'compromised_explicit_stale';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" exceeded its ${freshness.policy.maxAgeDays ?? PATCH_CYCLE_DAYS}-day freshness policy (${freshness.ageDays} days since ${record.verifiedAt}).`,
      );
    } else {
      archiveAdmissibility = 'insufficient_metadata';
      warnings.push(
        `${roleLabel} dataset "${datasetId}" has an invalid freshness timestamp.`,
      );
    }
  } else if (freshness.policy.policy === 'sandbox') {
    verification = 'provisional';
    reason = 'sandbox_dataset';
    archiveAdmissibility = 'provisional_unverified';
    warnings.push(
      `${roleLabel} dataset "${datasetId}" is user-configured sandbox data (provisional).`,
    );
  } else if (record.status === 'provisional') {
    verification = 'provisional';
    reason = 'explicit_provisional';
    archiveAdmissibility = 'provisional_unverified';
    warnings.push(
      `${roleLabel} dataset "${datasetId}" is provisional and not fully verified.`,
    );
  } else if (!substantive) {
    // Never infer verification merely from URL, version string, or registry existence.
    verification = 'provisional';
    reason = 'insufficient_verification_metadata';
    archiveAdmissibility = 'insufficient_metadata';
    warnings.push(
      `${roleLabel} dataset "${datasetId}" lacks required verification metadata (method, verifiedFields, or evidence) and cannot be treated as verified.`,
    );
  } else {
    verification = 'verified';
    archiveAdmissibility = 'valid';
  }

  return {
    detail: {
      datasetId,
      required,
      verification,
      policy: freshness.policy.policy,
      riskTier: freshness.policy.riskTier,
      version: record.version,
      verifiedAt: record.verifiedAt,
      ...(reason !== undefined ? { reason } : {}),
    },
    policy: freshness.policy,
    isRegistered: true,
    temporalState: freshness.temporalState,
    archiveAdmissibility,
    warnings,
  };
}

function aggregateVerification(requiredDeps: readonly ResolvedDependencyInternal[]): VerificationState {
  if (requiredDeps.length === 0) return 'unregistered';
  if (requiredDeps.some((d) => d.detail.verification === 'unregistered')) return 'unregistered';
  if (requiredDeps.some((d) => d.detail.verification === 'stale')) return 'stale';
  if (requiredDeps.some((d) => d.detail.verification === 'provisional')) return 'provisional';
  return 'verified';
}

/**
 * Central deterministic reliability evaluator for Project Celestia.
 *
 * Contract & validation policies:
 * - `mode` is validated at runtime; invalid modes return an invalid-context representation
 *   (`status: 'unsupported'`, `isActionable: false`, `verification: 'unregistered'`, empty
 *   `provenanceIds`/`dependencies`, and an `Invalid evaluation context:` warning) using
 *   `mode: 'current'` strictly as a type-conforming fallback to preserve the exact `RecommendationMode` union.
 * - Empty `datasetIds` or empty `requiredDatasetIds` is invalid and returns `unsupported` and
 *   `isActionable: false` (a recommendation with zero required provenance dependencies cannot
 *   be classified as `reliable` or live-actionable).
 * - Schedule/dependency consistency: when `context.schedule` is provided, `schedule.entityId`
 *   must resolve to a canonical entity AND appear in `requiredDatasetIds` so its provenance is
 *   verified alongside its temporal window. Omitting it (or listing it only as optional) returns
 *   `unsupported` and `isActionable: false`.
 * - Sandbox consistency: registered `custom-sandbox` resolves to `provisional`; unregistered
 *   `custom-*` / `*sandbox*` IDs remain `unregistered` and cannot bypass required-dependency checks.
 * - `datasetIds` and `requiredDatasetIds` are deduplicated and ordered in ascending
 *   UTF-16 code-unit order (`dependencies` and `provenanceIds` are independent of input order).
 * - `provenanceIds` contains strictly registered dataset IDs in ascending UTF-16 code-unit order.
 * - Optional dependencies never alter `verification`, `status`, or `isActionable`,
 *   but always emit deterministic warnings when unregistered, provisional, or stale.
 * - `warnings` are ordered deterministically (context/schedule -> required deps -> optional deps
 *   -> mode advisories) and deduplicated.
 */
export function evaluateRecommendationReliability(
  context: ReliabilityEvaluationContext,
  options: ReliabilityEvaluationOptions = {},
): RecommendationReliability {
  const registry = options.provenanceRegistry ?? DATA_PROVENANCE_REGISTRY;
  const parsedEvalDateForInvalidMode = parseIsoCalendarDate(context.evaluatedAt);

  if (!isValidRecommendationMode(context.mode)) {
    // `RecommendationReliability.mode` is locked to the exact 4-member `RecommendationMode` union.
    // Use `'current'` strictly as a type-conforming invalid-context placeholder; consumers must
    // check `status` / `isActionable` and never treat `status: 'unsupported'` as a valid current evaluation.
    return {
      status: 'unsupported',
      mode: 'current',
      isActionable: false,
      verification: 'unregistered',
      temporalState: 'not_applicable',
      provenanceIds: [],
      warnings: [
        `Invalid evaluation context: invalid recommendation mode "${String(context.mode)}" (fallback mode "current" is an invalid-context placeholder, not a valid current evaluation); expected one of current, planning_preview, archive_simulation, sandbox_simulation.`,
      ],
      dependencies: [],
      ...(parsedEvalDateForInvalidMode ? { evaluatedAt: parsedEvalDateForInvalidMode.dateStr } : {}),
    };
  }

  const parsedEvalDate = parseIsoCalendarDate(context.evaluatedAt);

  if (!parsedEvalDate) {
    return {
      status: 'unsupported',
      mode: context.mode,
      isActionable: false,
      verification: 'unregistered',
      temporalState: 'not_applicable',
      provenanceIds: [],
      warnings: [
        `Invalid evaluatedAt timestamp "${String(context.evaluatedAt)}": expected ISO-8601 date (YYYY-MM-DD) or timezone-qualified timestamp.`,
      ],
      dependencies: [],
    };
  }

  const sortedDatasetIds = dedupeAndSortIds(context.datasetIds ?? []);
  const sortedRequiredIds = dedupeAndSortIds(context.requiredDatasetIds ?? []);
  const datasetSet = new Set(sortedDatasetIds);
  const requiredSet = new Set(sortedRequiredIds);

  const missingFromSupplied = sortedRequiredIds.filter((id) => !datasetSet.has(id));
  if (missingFromSupplied.length > 0) {
    return {
      status: 'unsupported',
      mode: context.mode,
      isActionable: false,
      verification: 'unregistered',
      temporalState: 'not_applicable',
      provenanceIds: [],
      warnings: [
        `Invalid evaluation context: required dataset(s) [${missingFromSupplied.join(', ')}] are not present in datasetIds.`,
      ],
      dependencies: [],
      evaluatedAt: parsedEvalDate.dateStr,
    };
  }

  if (sortedDatasetIds.length === 0 || sortedRequiredIds.length === 0) {
    return {
      status: 'unsupported',
      mode: context.mode,
      isActionable: false,
      verification: 'unregistered',
      temporalState: 'not_applicable',
      provenanceIds: [],
      warnings: [
        'Invalid evaluation context: at least one required dataset ID must be provided.',
      ],
      dependencies: [],
      evaluatedAt: parsedEvalDate.dateStr,
    };
  }

  const structuralWarnings: string[] = [];
  const modeWarnings: string[] = [];

  // Resolve canonical schedule entity (never silently substitute active default)
  let scheduleUnknown = false;
  let scheduleNotLinked = false;
  let canonicalWindow: CanonicalScheduleWindow | undefined;
  let temporalState: TemporalState = 'not_applicable';

  if (context.schedule) {
    canonicalWindow = resolveCanonicalSchedule(context.schedule);
    if (!canonicalWindow) {
      scheduleUnknown = true;
      temporalState = 'not_applicable';
      structuralWarnings.push(
        `Unknown ${context.schedule.type} schedule entity "${context.schedule.entityId}"; refusing to substitute an active schedule.`,
      );
    } else {
      temporalState = resolveScheduleTemporalState(canonicalWindow, parsedEvalDate.dateStr);
      if (!requiredSet.has(context.schedule.entityId)) {
        scheduleNotLinked = true;
        structuralWarnings.push(
          `Schedule entity "${context.schedule.entityId}" (${context.schedule.type}) must be included in requiredDatasetIds so its provenance is verified alongside its schedule window.`,
        );
      }
    }
  }

  const resolvedDeps = sortedDatasetIds.map((id) =>
    resolveDependency(id, requiredSet.has(id), parsedEvalDate, registry),
  );
  const requiredDeps = resolvedDeps.filter((d) => d.detail.required);
  const optionalDeps = resolvedDeps.filter((d) => !d.detail.required);

  const upcomingRequiredScheduleDeps = requiredDeps.filter(
    (d) => d.temporalState === 'upcoming',
  );
  for (const dep of upcomingRequiredScheduleDeps) {
    if (dep.detail.datasetId !== context.schedule?.entityId) {
      structuralWarnings.push(
        `Required schedule dataset "${dep.detail.datasetId}" is upcoming as of ${parsedEvalDate.dateStr} and not yet active in-game.`,
      );
    }
  }

  const requiredWarnings = requiredDeps.flatMap((d) => d.warnings);
  const optionalWarnings = optionalDeps.flatMap((d) => d.warnings);

  const provenanceIds = resolvedDeps.filter((d) => d.isRegistered).map((d) => d.detail.datasetId);
  const aggregateVerif = aggregateVerification(requiredDeps);
  const dependencies: ReliabilityDependencyDetail[] = resolvedDeps.map((d) => ({ ...d.detail }));

  const hasRequiredUnregistered = requiredDeps.some(
    (d) => d.detail.verification === 'unregistered',
  );
  const hasRequiredHighRiskStale = requiredDeps.some(
    (d) => d.detail.verification === 'stale' && d.policy.riskTier === 'high',
  );
  const hasRequiredLowRiskStale = requiredDeps.some(
    (d) => d.detail.verification === 'stale' && d.policy.riskTier === 'low',
  );
  const hasRequiredProvisional = requiredDeps.some(
    (d) => d.detail.verification === 'provisional',
  );
  const hasRequiredUpcomingScheduleDep = upcomingRequiredScheduleDeps.length > 0;
  const allRequiredProvisionalActionable = requiredDeps
    .filter((d) => d.detail.verification === 'provisional')
    .every(
      (d) => d.policy.provisionalActionable && d.detail.reason === 'explicit_provisional',
    );
  const allRequiredStaleActionable = requiredDeps
    .filter((d) => d.detail.verification === 'stale')
    .every((d) => d.policy.staleActionable && d.detail.reason === 'age_exceeded');

  let status: ReliabilityStatus;
  let isActionable = false;

  if (scheduleUnknown || scheduleNotLinked || hasRequiredUnregistered) {
    status = 'unsupported';
    isActionable = false;
  } else {
    switch (context.mode) {
      case 'current': {
        if (temporalState === 'upcoming' || hasRequiredUpcomingScheduleDep) {
          status = 'unsupported';
          isActionable = false;
          if (temporalState === 'upcoming') {
            modeWarnings.push(
              `Schedule "${context.schedule?.entityId}" is upcoming (starts ${canonicalWindow?.startDate}) and cannot be treated as current live-game advice; use planning_preview mode.`,
            );
          } else {
            modeWarnings.push(
              'Upcoming schedule dependencies cannot be treated as current live-game advice; use planning_preview mode.',
            );
          }
        } else if (temporalState === 'expired') {
          status = 'unsupported';
          isActionable = false;
          modeWarnings.push(
            `Schedule "${context.schedule?.entityId}" has expired as of ${parsedEvalDate.dateStr}; use archive_simulation mode for historical analysis.`,
          );
        } else if (hasRequiredHighRiskStale) {
          status = 'unsupported';
          isActionable = false;
        } else if (hasRequiredProvisional || hasRequiredLowRiskStale) {
          status = 'qualified';
          isActionable = allRequiredProvisionalActionable && allRequiredStaleActionable;
        } else {
          status = 'reliable';
          isActionable = true;
        }
        break;
      }

      case 'planning_preview': {
        isActionable = false;
        if (temporalState === 'expired') {
          status = 'unsupported';
          modeWarnings.push(
            `Schedule "${context.schedule?.entityId}" has already expired and is not valid for planning_preview mode.`,
          );
        } else if (hasRequiredHighRiskStale) {
          status = 'unsupported';
        } else {
          status = 'qualified';
          if (temporalState === 'upcoming' && canonicalWindow?.startDate) {
            modeWarnings.push(
              `Planning preview: ${canonicalWindow.type} schedule "${canonicalWindow.entityId}" is upcoming (starts ${canonicalWindow.startDate}) and not yet active in-game.`,
            );
          } else {
            modeWarnings.push(
              'Planning preview: forward-looking projection; do not treat as confirmed live-game advice.',
            );
          }
        }
        break;
      }

      case 'archive_simulation': {
        isActionable = false;
        const invalidArchiveDeps = requiredDeps.filter(
          (d) => d.archiveAdmissibility !== 'valid',
        );
        if (temporalState === 'upcoming' || hasRequiredUpcomingScheduleDep) {
          status = 'unsupported';
          if (temporalState === 'upcoming') {
            modeWarnings.push(
              `Schedule "${context.schedule?.entityId}" is upcoming and cannot be evaluated as a historical archive.`,
            );
          } else {
            modeWarnings.push(
              'Upcoming schedule dependencies cannot be evaluated as a historical archive.',
            );
          }
        } else if (invalidArchiveDeps.length > 0) {
          status = 'unsupported';
          const affectedIds = invalidArchiveDeps.map((d) => d.detail.datasetId).join(', ');
          modeWarnings.push(
            `Archive simulation unsupported: required dataset(s) [${affectedIds}] are not verified historical archive records.`,
          );
        } else {
          status = 'historical';
          modeWarnings.push(
            canonicalWindow
              ? `Historical archive simulation for ${canonicalWindow.type} "${canonicalWindow.entityId}"; results reflect archived data and are not live-game actionable.`
              : 'Historical archive simulation; results reflect archived data and are not live-game actionable.',
          );
        }
        break;
      }

      case 'sandbox_simulation': {
        isActionable = false;
        if (hasRequiredHighRiskStale) {
          status = 'unsupported';
        } else {
          status = 'qualified';
          modeWarnings.push(
            'Sandbox simulation uses user-configured or experimental parameters and is not official live-game advice.',
          );
        }
        break;
      }
    }
  }

  return {
    status,
    mode: context.mode,
    isActionable,
    verification: aggregateVerif,
    temporalState,
    provenanceIds,
    warnings: dedupeStrings([
      ...structuralWarnings,
      ...requiredWarnings,
      ...optionalWarnings,
      ...modeWarnings,
    ]),
    dependencies,
    evaluatedAt: parsedEvalDate.dateStr,
  };
}

