import type {
  Character,
  OwnedCharacterProfile,
  OwnedWeapon,
  RecommendationExecutionContext,
  TheaterDifficulty,
  TheaterSeasonConfig,
} from '../types/genshin';
import type { AbyssCycleConfig } from '../data/abyss-schedules';
import { solveAbyssDualTeams } from '../engines/abyss-solver';
import { generateBestTeams } from '../engines/team-generator';
import { autoDraftTheaterSchedule } from '../engines/theater-solver';

export interface SolveAbyssPayload {
  ownedIds?: string[];
  rosterProfiles?: Record<string, OwnedCharacterProfile>;
  cycle?: AbyssCycleConfig;
  executionContext?: RecommendationExecutionContext;
}

export interface GenerateTeamsPayload {
  availableIds?: string[];
  focusCharacterId?: string;
  rosterProfiles?: Record<string, OwnedCharacterProfile>;
  ownedWeapons?: OwnedWeapon[];
  allowCatalogFallback?: boolean;
  executionContext?: RecommendationExecutionContext;
}

export interface SolveTheaterPayload {
  eligible?: Character[];
  difficulty?: TheaterDifficulty;
  season?: TheaterSeasonConfig;
  userLocks?: Record<number, string[]>;
  rosterProfiles?: Record<string, OwnedCharacterProfile>;
  executionContext?: RecommendationExecutionContext;
}

/**
 * Executes a single solver worker task with the caller's forwarded execution context.
 */
export function executeSolverWorkerTask(
  type: string,
  payload: Record<string, unknown> = {},
): unknown {
  if (type === 'SOLVE_ABYSS') {
    const p = payload as SolveAbyssPayload;
    return solveAbyssDualTeams(p.ownedIds ?? [], p.rosterProfiles, p.cycle, p.executionContext);
  }
  if (type === 'GENERATE_TEAMS') {
    const p = payload as GenerateTeamsPayload;
    return generateBestTeams(
      p.availableIds ?? [],
      p.focusCharacterId,
      p.rosterProfiles,
      p.ownedWeapons,
      p.allowCatalogFallback,
      p.executionContext,
    );
  }
  if (type === 'SOLVE_THEATER') {
    const p = payload as SolveTheaterPayload;
    if (!p.season) {
      throw new Error('Missing required season in SOLVE_THEATER payload');
    }
    return autoDraftTheaterSchedule(
      p.eligible ?? [],
      p.difficulty ?? 'Visionary',
      p.season,
      p.userLocks,
      p.rosterProfiles,
      p.executionContext,
    );
  }
  throw new Error(`Unknown worker task type: ${type}`);
}

/**
 * Production Web Worker `MessageEvent` handler.
 * Exported so tests invoke the exact production message handler without duplicating
 * the task switch, while remaining safe to import in Node/Vitest when `self` is absent.
 */
export function handleSolverWorkerMessage(
  e: MessageEvent,
  postResponse: (message: unknown) => void,
): void {
  const { id, type, payload } = e.data || {};
  try {
    const result = executeSolverWorkerTask(type, payload || {});
    postResponse({ id, type, result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    postResponse({ id, type, error: message });
  }
}

const isDedicatedWorkerScope =
  typeof self !== 'undefined' &&
  typeof window === 'undefined' &&
  typeof (self as unknown as { postMessage?: unknown }).postMessage === 'function';

if (isDedicatedWorkerScope) {
  self.onmessage = (e: MessageEvent) => {
    handleSolverWorkerMessage(e, (msg) => self.postMessage(msg));
  };
}
