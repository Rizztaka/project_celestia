import type { CompanionSummaryResponse } from '@celestia/api-contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { captureSession } from './account-session';
import { fetchCompanionSummary, fetchPublicCompanionSummary } from './api';

export function useCompanionSummary(uid?: string) {
  const [session] = useState(captureSession);
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () =>
      uid
        ? ['genshin', 'companion-summary', uid]
        : ['genshin', 'companion-summary', 'authenticated'],
    [uid],
  );

  const query = useQuery<CompanionSummaryResponse>({
    queryKey,
    queryFn: ({ signal }) => {
      if (uid) {
        return fetchPublicCompanionSummary(uid, signal);
      }
      return fetchCompanionSummary(signal, session);
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    ...query,
    summary: query.data,
    invalidate,
  };
}
