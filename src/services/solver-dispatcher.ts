import type {
  AbyssDualTeamPlan,
  TeamRecommendation,
  OwnedCharacterProfile,
  OwnedWeapon,
  Character,
  TheaterDifficulty,
  TheaterSeasonConfig,
  RecommendationCollection,
  RecommendationExecutionContext,
} from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import type { TheaterScheduleResult } from '../engines/theater-solver';

/**
 * Resolves an explicit UTC evaluation date once at dispatch time without importing
 * heavy data/evaluator modules so the dispatcher chunk stays under the 20 KB budget.
 * Explicitly supplied `evaluatedAt` strings (even invalid ones) are forwarded verbatim
 * and never replaced by the system clock; the system clock is used only when omitted.
 */
function withResolvedExecutionContext(
  executionContext?: RecommendationExecutionContext,
): RecommendationExecutionContext | undefined {
  if (executionContext !== undefined && executionContext.evaluatedAt !== undefined) {
    return { evaluatedAt: executionContext.evaluatedAt };
  }
  const now = new Date();
  if (Number.isNaN(now.getTime())) {
    return undefined;
  }
  const yyyy = String(now.getUTCFullYear()).padStart(4, '0');
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return { evaluatedAt: `${yyyy}-${mm}-${dd}` };
}

let workerInstance: Worker | null = null;
let workerFailed = false;
let messageIdSeq = 0;
const pendingCallbacks = new Map<
  number,
  { resolve: (val: any) => void; reject: (err: any) => void }
>();

function rejectAllPending(reason: Error) {
  for (const [id, cb] of pendingCallbacks.entries()) {
    pendingCallbacks.delete(id);
    cb.reject(reason);
  }
}

function getWorker(): Worker | null {
  if (workerFailed || typeof window === 'undefined' || typeof Worker === 'undefined') {
    return null;
  }
  if (!workerInstance) {
    try {
      workerInstance = new Worker(
        new URL('../workers/solver-worker.ts', import.meta.url),
        { type: 'module' },
      );
      workerInstance.onmessage = (e: MessageEvent) => {
        const { id, result, error } = e.data || {};
        const cb = pendingCallbacks.get(id);
        if (cb) {
          pendingCallbacks.delete(id);
          if (error) {
            cb.reject(new Error(error));
          } else {
            cb.resolve(result);
          }
        }
      };
      workerInstance.onerror = (err) => {
        console.error('[SolverWorker] Worker error, falling back to main thread:', err);
        workerFailed = true;
        workerInstance?.terminate();
        workerInstance = null;
        rejectAllPending(new Error('Solver worker crashed'));
      };
    } catch {
      workerFailed = true;
      workerInstance = null;
    }
  }
  return workerInstance;
}

function runWorkerTask<T>(type: string, payload: Record<string, unknown>): Promise<T> {
  const worker = getWorker();
  if (!worker) {
    return Promise.reject(new Error('Worker unavailable'));
  }

  const id = ++messageIdSeq;
  return new Promise<T>((resolve, reject) => {
    pendingCallbacks.set(id, { resolve, reject });
    try {
      worker.postMessage({ id, type, payload });
    } catch (err) {
      pendingCallbacks.delete(id);
      reject(err);
    }
  });
}

/**
 * Offloads dual Abyss Floor 12 solving to a Web Worker when available,
 * dynamically importing the solver on the main thread only if workers are unavailable.
 */
export async function dispatchSolveAbyss(
  ownedIds: string[],
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  cycle?: AbyssCycleConfig,
  executionContext?: RecommendationExecutionContext,
): Promise<AbyssDualTeamPlan> {
  const resolvedContext = withResolvedExecutionContext(executionContext);
  try {
    return await runWorkerTask<AbyssDualTeamPlan>('SOLVE_ABYSS', {
      ownedIds,
      rosterProfiles,
      cycle,
      executionContext: resolvedContext,
    });
  } catch {
    const { solveAbyssDualTeams } = await import('../engines/abyss-solver');
    return solveAbyssDualTeams(ownedIds, rosterProfiles, cycle, resolvedContext);
  }
}

/**
 * Offloads team recommendation generation to a Web Worker when available,
 * dynamically importing the generator on the main thread only if workers are unavailable.
 */
export async function dispatchGenerateBestTeams(
  availableIds: string[],
  focusCharacterId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
  allowCatalogFallback?: boolean,
  executionContext?: RecommendationExecutionContext,
): Promise<RecommendationCollection<TeamRecommendation>> {
  const resolvedContext = withResolvedExecutionContext(executionContext);
  try {
    return await runWorkerTask<RecommendationCollection<TeamRecommendation>>('GENERATE_TEAMS', {
      availableIds,
      focusCharacterId,
      rosterProfiles,
      ownedWeapons,
      allowCatalogFallback,
      executionContext: resolvedContext,
    });
  } catch {
    const { generateBestTeams } = await import('../engines/team-generator');
    return generateBestTeams(
      availableIds,
      focusCharacterId,
      rosterProfiles,
      ownedWeapons,
      allowCatalogFallback,
      resolvedContext,
    );
  }
}

/**
 * Offloads Imaginarium Theater auto-drafting to a Web Worker when available,
 * dynamically importing the solver on the main thread only if workers are unavailable.
 */
export async function dispatchAutoDraftTheater(
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
  userLocks?: Record<number, string[]>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  executionContext?: RecommendationExecutionContext,
): Promise<TheaterScheduleResult> {
  const resolvedContext = withResolvedExecutionContext(executionContext);
  try {
    return await runWorkerTask<TheaterScheduleResult>('SOLVE_THEATER', {
      eligible,
      difficulty,
      season,
      userLocks,
      rosterProfiles,
      executionContext: resolvedContext,
    });
  } catch {
    const { autoDraftTheaterSchedule } = await import('../engines/theater-solver');
    return autoDraftTheaterSchedule(
      eligible,
      difficulty,
      season,
      userLocks,
      rosterProfiles,
      resolvedContext,
    );
  }
}
