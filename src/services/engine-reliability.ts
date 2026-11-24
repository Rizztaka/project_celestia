import type {
  DataProvenance,
  RecommendationExecutionContext,
  RecommendationMode,
  RecommendationReliability,
  ReliabilityScheduleRef,
  TemporalState,
} from '../types/genshin';
import { CURRENT_GAME_VERSION, compareGameVersions } from '../data/game-version';
import {
  evaluateRecommendationReliability,
  formatDateUtc,
  parseIsoCalendarDate,
  resolveCanonicalSchedule,
  resolveScheduleTemporalState,
} from './recommendation-reliability';

export interface UnattestedLocalDependency {
  name: string;
  sourceFile: string;
}

/**
 * Isolated internal-only registry override slot for strictly synchronous unit testing.
 * Never exposed on public engine parameters or `RecommendationExecutionContext`.
 */
let testProvenanceRegistryOverride: Readonly<Record<string, DataProvenance>> | undefined;

function isThenable(value: unknown): boolean {
  return (
    value !== null &&
    (typeof value === 'object' || typeof value === 'function') &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

/**
 * Runs a strictly synchronous callback `fn` with an isolated synthetic provenance registry
 * override and unconditionally restores the authoritative registry in `finally`.
 *
 * Rejects Promises/thenables at both compile time and runtime so module-level test state
 * cannot leak across asynchronous tests or concurrent evaluations.
 */
export function withTestProvenanceRegistry<T>(
  registry: Readonly<Record<string, DataProvenance>>,
  fn: () => T extends PromiseLike<unknown> ? never : T,
): T {
  const previous = testProvenanceRegistryOverride;
  testProvenanceRegistryOverride = registry;
  let result: T;
  try {
    result = fn();
  } finally {
    testProvenanceRegistryOverride = previous;
  }

  if (isThenable(result)) {
    Promise.resolve(result).catch(() => {});
    throw new TypeError(
      'withTestProvenanceRegistry() requires a synchronous callback and rejects Promises/thenables to prevent state leaks across async tests.',
    );
  }

  return result;
}

/**
 * Resolves the explicit ISO evaluation date for an engine call.
 * - Any caller-supplied `evaluatedAt` (including empty or malformed strings) is returned
 *   verbatim so Phase 2's strict `parseIsoCalendarDate()` rejects invalid inputs as
 *   `unsupported` / `isActionable: false` without substituting the system clock.
 * - System clock is consulted ONLY when `evaluatedAt === undefined`, checking
 *   `formatDateUtc(new Date())` without unsafe non-null assertions.
 */
export function resolveEvaluationDate(evaluatedAt?: string): string | null {
  if (evaluatedAt !== undefined) {
    return evaluatedAt;
  }
  const formatted = formatDateUtc(new Date());
  return formatted ? formatted.dateStr : null;
}

export type CanonicalScheduleModeResolution =
  | {
      found: true;
      mode: RecommendationMode;
      temporalState: TemporalState;
    }
  | {
      found: false;
      reason: 'unknown_schedule' | 'invalid_evaluated_at';
    };

/**
 * Resolves `RecommendationMode` from a canonical schedule entity's actual temporal
 * applicability at `evaluatedAt` (and version for undated historical archives).
 *
 * Never silently returns `'current'` when canonical schedule resolution fails or
 * when `evaluatedAt` is invalid; callers receive an explicit `{ found: false }` result.
 */
export function resolveCanonicalScheduleMode(
  scheduleRef: ReliabilityScheduleRef,
  evaluatedAt: string,
  entityVersion?: string,
): CanonicalScheduleModeResolution {
  const parsedDate = parseIsoCalendarDate(evaluatedAt);
  if (!parsedDate) {
    return { found: false, reason: 'invalid_evaluated_at' };
  }

  const canonical = resolveCanonicalSchedule(scheduleRef);
  if (!canonical) {
    return { found: false, reason: 'unknown_schedule' };
  }

  const temporalState = resolveScheduleTemporalState(canonical, parsedDate.dateStr);
  if (temporalState === 'upcoming') {
    return { found: true, mode: 'planning_preview', temporalState };
  }
  if (temporalState === 'expired') {
    return { found: true, mode: 'archive_simulation', temporalState };
  }
  if (temporalState === 'active') {
    return { found: true, mode: 'current', temporalState };
  }

  // Undated canonical schedule entities (e.g. historical Theater archives without calendar bounds)
  if (entityVersion && compareGameVersions(entityVersion, CURRENT_GAME_VERSION) < 0) {
    return { found: true, mode: 'archive_simulation', temporalState };
  }
  return { found: true, mode: 'current', temporalState };
}

function buildInvalidClockResult(mode: RecommendationMode): RecommendationReliability {
  return {
    status: 'unsupported',
    mode,
    isActionable: false,
    verification: 'unregistered',
    temporalState: 'not_applicable',
    provenanceIds: [],
    warnings: ['Unable to resolve a valid UTC evaluation date from the runtime clock.'],
    dependencies: [],
  };
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

/**
 * Applies a strictly fail-closed qualification guard when an engine materially depends on
 * local game-data tables that do not yet have a provenance record in `DATA_PROVENANCE_REGISTRY`.
 *
 * - Never invents registry IDs, URLs, or dataset attestations.
 * - Preserves Phase 2's `unsupported`, `historical`, and `qualified` outcomes.
 * - Prevents unresolved local dependencies from silently permitting `status: 'reliable'`
 *   or `isActionable: true`.
 */
function applyUnattestedLocalDependencyGuard(
  base: RecommendationReliability,
  unattestedLocalDependencies?: readonly UnattestedLocalDependency[],
): RecommendationReliability {
  if (!unattestedLocalDependencies || unattestedLocalDependencies.length === 0) {
    return base;
  }

  const sortedDeps = [...unattestedLocalDependencies].sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
  );
  const unattestedWarnings = sortedDeps.map(
    (dep) =>
      `Unattested local game-data dependency "${dep.name}" (${dep.sourceFile}) lacks a provenance record; recommendation is non-actionable and cannot be classified as fully reliable until attested.`,
  );

  return {
    ...base,
    status: base.status === 'reliable' ? 'qualified' : base.status,
    isActionable: false,
    warnings: dedupeStrings([...base.warnings, ...unattestedWarnings]),
  };
}

export interface EngineReliabilityRequest {
  mode: RecommendationMode;
  requiredDatasetIds: string[];
  optionalDatasetIds?: string[];
  schedule?: ReliabilityScheduleRef;
  unattestedLocalDependencies?: readonly UnattestedLocalDependency[];
  executionContext?: RecommendationExecutionContext;
}

/**
 * Thin boundary adapter delegating provenance/temporal/mode evaluation to the
 * authoritative Phase 2 central evaluator (`evaluateRecommendationReliability`).
 */
export function evaluateEngineBoundaryReliability(
  request: EngineReliabilityRequest,
): RecommendationReliability {
  const evaluatedAt = resolveEvaluationDate(request.executionContext?.evaluatedAt);
  if (evaluatedAt === null) {
    return buildInvalidClockResult(request.mode);
  }

  const datasetIds = [
    ...request.requiredDatasetIds,
    ...(request.optionalDatasetIds ?? []),
  ];

  const base = evaluateRecommendationReliability(
    {
      mode: request.mode,
      datasetIds,
      requiredDatasetIds: request.requiredDatasetIds,
      ...(request.schedule ? { schedule: request.schedule } : {}),
      evaluatedAt,
    },
    testProvenanceRegistryOverride
      ? { provenanceRegistry: testProvenanceRegistryOverride }
      : undefined,
  );

  return applyUnattestedLocalDependencyGuard(base, request.unattestedLocalDependencies);
}

export interface ScheduledEngineReliabilityRequest {
  schedule: ReliabilityScheduleRef;
  entityVersion?: string;
  requiredDatasetIds: string[];
  optionalDatasetIds?: string[];
  unattestedLocalDependencies?: readonly UnattestedLocalDependency[];
  executionContext?: RecommendationExecutionContext;
}

/**
 * Boundary adapter for canonical schedule-backed engines (Banners, Abyss, Theater).
 * Uses `resolveCanonicalScheduleMode()` so unknown schedule IDs or invalid timestamps
 * never silently substitute an active schedule and always produce the Phase 2
 * evaluator's deterministic `unsupported` outcome.
 */
export function evaluateScheduledEngineReliability(
  request: ScheduledEngineReliabilityRequest,
): RecommendationReliability {
  const evaluatedAt = resolveEvaluationDate(request.executionContext?.evaluatedAt);
  if (evaluatedAt === null) {
    return buildInvalidClockResult('current');
  }

  const resolution = resolveCanonicalScheduleMode(
    request.schedule,
    evaluatedAt,
    request.entityVersion,
  );

  // When `!resolution.found`, Phase 2's `evaluateRecommendationReliability` short-circuits
  // on invalid `evaluatedAt` or `scheduleUnknown` BEFORE mode evaluation, producing
  // `status: 'unsupported'` and `isActionable: false` with the canonical Phase 2 warning.
  const mode: RecommendationMode = resolution.found ? resolution.mode : 'current';

  return evaluateEngineBoundaryReliability({
    mode,
    requiredDatasetIds: request.requiredDatasetIds,
    optionalDatasetIds: request.optionalDatasetIds,
    schedule: request.schedule,
    unattestedLocalDependencies: request.unattestedLocalDependencies,
    executionContext: { evaluatedAt },
  });
}
