import { solveAbyssDualTeams } from '../engines/abyss-solver';
import { generateBestTeams } from '../engines/team-generator';
import { autoDraftTheaterSchedule } from '../engines/theater-solver';

self.onmessage = (e: MessageEvent) => {
  const { id, type, payload } = e.data || {};
  try {
    if (type === 'SOLVE_ABYSS') {
      const { ownedIds, rosterProfiles, cycle } = payload || {};
      const result = solveAbyssDualTeams(ownedIds, rosterProfiles, cycle);
      self.postMessage({ id, type, result });
    } else if (type === 'GENERATE_TEAMS') {
      const {
        availableIds,
        focusCharacterId,
        rosterProfiles,
        ownedWeapons,
        allowCatalogFallback,
      } = payload || {};
      const result = generateBestTeams(
        availableIds,
        focusCharacterId,
        rosterProfiles,
        ownedWeapons,
        allowCatalogFallback,
      );
      self.postMessage({ id, type, result });
    } else if (type === 'SOLVE_THEATER') {
      const { eligible, difficulty, season, userLocks, rosterProfiles } = payload || {};
      const result = autoDraftTheaterSchedule(
        eligible,
        difficulty,
        season,
        userLocks,
        rosterProfiles,
      );
      self.postMessage({ id, type, result });
    } else {
      self.postMessage({ id, type, error: `Unknown worker task type: ${type}` });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    self.postMessage({ id, type, error: message });
  }
};
