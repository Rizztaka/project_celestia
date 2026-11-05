import {
  defaultTeamSearchPreferences,
  type TeamPreferencesResponse,
  type TeamSearchPreferences,
} from '@celestia/api-contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

import { ApiError, fetchTeamPreferences, patchTeamPreferences } from './api';
import {
  parseTeamPreferences,
  readTeamPreferencesRaw,
  type TeamPreferenceScope,
  teamPreferencesEvent,
  type TeamPreferencesRaw,
} from './team-preferences';

function subscribe(listener: () => void) {
  window.addEventListener('storage', listener);
  window.addEventListener(teamPreferencesEvent, listener);
  return () => {
    window.removeEventListener('storage', listener);
    window.removeEventListener(teamPreferencesEvent, listener);
  };
}

export function useTeamPreferences(
  uid: string | null,
  scope?: Partial<TeamPreferenceScope>,
): {
  preferences: TeamSearchPreferences;
  state: 'saved' | 'empty' | 'invalid' | 'unavailable';
  raw: TeamPreferencesRaw;
  revision: number;
  isServerBacked: boolean;
  isLoading: boolean;
  saveAuthenticated: (
    preferences: TeamSearchPreferences,
    expectedRevision: number,
  ) => Promise<TeamPreferencesResponse>;
} {
  const queryClient = useQueryClient();
  const ownerId = scope?.ownerId ?? null;
  const accountId = scope?.accountId ?? null;
  const serverBacked = ownerId !== null;
  const localRaw = useSyncExternalStore<TeamPreferencesRaw>(
    subscribe,
    () => readTeamPreferencesRaw(uid, undefined, scope),
    () => null,
  );
  const query = useQuery<TeamPreferencesResponse>({
    queryKey: ['genshin-team-preferences', uid, accountId, ownerId],
    queryFn: ({ signal }) => fetchTeamPreferences(uid, accountId, signal),
    enabled: serverBacked,
    staleTime: 30_000,
  });
  const local = useMemo(() => parseTeamPreferences(uid, localRaw, scope), [localRaw, scope, uid]);
  const fallback = useMemo(
    () => defaultTeamSearchPreferences(uid, { ownerId, accountId }),
    [accountId, ownerId, uid],
  );
  const saveAuthenticated = useCallback(
    async (preferences: TeamPreferencesResponse['preferences'], expectedRevision: number) => {
      const queryKey = ['genshin-team-preferences', uid, accountId, ownerId];
      try {
        const response = await patchTeamPreferences(
          {
            scope: { uid, accountId },
            expectedRevision,
            preferences,
          },
          undefined,
        );
        queryClient.setQueryData(queryKey, response);
        return response;
      } catch (error) {
        // A concurrent save advanced the revision. Refresh the stored value while
        // keeping the caller's draft so the next save targets the real revision.
        if (error instanceof ApiError && error.status === 409)
          await queryClient.invalidateQueries({ queryKey });
        throw error;
      }
    },
    [accountId, ownerId, queryClient, uid],
  );
  const preferences = serverBacked ? (query.data?.preferences ?? fallback) : local.preferences;
  const state = serverBacked
    ? query.isError
      ? ('unavailable' as const)
      : query.data
        ? ('saved' as const)
        : ('empty' as const)
    : local.state;
  const raw: TeamPreferencesRaw = serverBacked
    ? query.data
      ? JSON.stringify(query.data.preferences)
      : null
    : localRaw;
  return {
    preferences,
    state,
    raw,
    revision: query.data?.revision ?? 0,
    isServerBacked: serverBacked,
    isLoading: serverBacked && query.isPending,
    saveAuthenticated,
  };
}
