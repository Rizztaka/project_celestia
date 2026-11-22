import type {
  AbyssDualTeamPlan,
  TeamRecommendation,
  OwnedCharacterProfile,
  OwnedWeapon,
  Character,
  TheaterDifficulty,
  TheaterSeasonConfig,
} from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import type { TheaterScheduleResult } from '../engines/theater-solver';

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
): Promise<AbyssDualTeamPlan> {
  try {
    return await runWorkerTask<AbyssDualTeamPlan>('SOLVE_ABYSS', {
      ownedIds,
      rosterProfiles,
      cycle,
    });
  } catch {
    const { solveAbyssDualTeams } = await import('../engines/abyss-solver');
    return solveAbyssDualTeams(ownedIds, rosterProfiles, cycle);
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
): Promise<TeamRecommendation[]> {
  try {
    return await runWorkerTask<TeamRecommendation[]>('GENERATE_TEAMS', {
      availableIds,
      focusCharacterId,
      rosterProfiles,
      ownedWeapons,
      allowCatalogFallback,
    });
  } catch {
    const { generateBestTeams } = await import('../engines/team-generator');
    return generateBestTeams(
      availableIds,
      focusCharacterId,
      rosterProfiles,
      ownedWeapons,
      allowCatalogFallback,
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
): Promise<TheaterScheduleResult> {
  try {
    return await runWorkerTask<TheaterScheduleResult>('SOLVE_THEATER', {
      eligible,
      difficulty,
      season,
      userLocks,
      rosterProfiles,
    });
  } catch {
    const { autoDraftTheaterSchedule } = await import('../engines/theater-solver');
    return autoDraftTheaterSchedule(
      eligible,
      difficulty,
      season,
      userLocks,
      rosterProfiles,
    );
  }
}
