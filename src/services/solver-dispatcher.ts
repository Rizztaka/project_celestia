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
import { solveAbyssDualTeams } from '../engines/abyss-solver';
import { generateBestTeams } from '../engines/team-generator';
import { autoDraftTheaterSchedule, type TheaterScheduleResult } from '../engines/theater-solver';

let workerInstance: Worker | null = null;
let messageIdSeq = 0;
const pendingCallbacks = new Map<
  number,
  { resolve: (val: any) => void; reject: (err: any) => void }
>();

function getWorker(): Worker | null {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
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
        console.error('[SolverWorker] Worker error:', err);
      };
    } catch {
      workerInstance = null;
    }
  }
  return workerInstance;
}

/**
 * Offloads dual Abyss floor 12 solving to a Web Worker when available,
 * gracefully falling back to main-thread execution in environments without Web Worker support.
 */
export async function dispatchSolveAbyss(
  ownedIds: string[],
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  cycle?: AbyssCycleConfig,
): Promise<AbyssDualTeamPlan> {
  const worker = getWorker();
  if (!worker) {
    return solveAbyssDualTeams(ownedIds, rosterProfiles, cycle);
  }

  const id = ++messageIdSeq;
  return new Promise((resolve, reject) => {
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'SOLVE_ABYSS',
      payload: { ownedIds, rosterProfiles, cycle },
    });
  });
}

/**
 * Offloads team recommendations generation to a Web Worker when available,
 * gracefully falling back to main-thread execution in environments without Web Worker support.
 */
export async function dispatchGenerateBestTeams(
  availableIds: string[],
  focusCharacterId?: string,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
  ownedWeapons?: OwnedWeapon[],
  allowCatalogFallback?: boolean,
): Promise<TeamRecommendation[]> {
  const worker = getWorker();
  if (!worker) {
    return generateBestTeams(
      availableIds,
      focusCharacterId,
      rosterProfiles,
      ownedWeapons,
      allowCatalogFallback,
    );
  }

  const id = ++messageIdSeq;
  return new Promise((resolve, reject) => {
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'GENERATE_TEAMS',
      payload: {
        availableIds,
        focusCharacterId,
        rosterProfiles,
        ownedWeapons,
        allowCatalogFallback,
      },
    });
  });
}

/**
 * Offloads Imaginarium Theater auto-drafting to a Web Worker when available,
 * gracefully falling back to main-thread execution in environments without Web Worker support.
 */
export async function dispatchAutoDraftTheater(
  eligible: Character[],
  difficulty: TheaterDifficulty,
  season: TheaterSeasonConfig,
  userLocks?: Record<number, string[]>,
  rosterProfiles?: Record<string, OwnedCharacterProfile>,
): Promise<TheaterScheduleResult> {
  const worker = getWorker();
  if (!worker) {
    return autoDraftTheaterSchedule(
      eligible,
      difficulty,
      season,
      userLocks,
      rosterProfiles,
    );
  }

  const id = ++messageIdSeq;
  return new Promise((resolve, reject) => {
    pendingCallbacks.set(id, { resolve, reject });
    worker.postMessage({
      id,
      type: 'SOLVE_THEATER',
      payload: {
        eligible,
        difficulty,
        season,
        userLocks,
        rosterProfiles,
      },
    });
  });
}
