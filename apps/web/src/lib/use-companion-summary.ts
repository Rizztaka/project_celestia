import type { CompanionSummaryResponse } from '@celestia/api-contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';

import { captureSession } from './account-session';
import { fetchCompanionSummary, fetchPublicCompanionSummary } from './api';

export function useCompanionSummary(uid?: string) {
  const [session] = useState(captureSession);
  const queryClient = useQueryClient();

  const isPublic = typeof uid === 'string';

  const queryKey = useMemo(
    () =>
      isPublic
        ? ['genshin', 'companion-summary', uid]
        : ['genshin', 'companion-summary', 'authenticated'],
    [isPublic, uid],
  );

  const query = useQuery<CompanionSummaryResponse>({
    queryKey,
    queryFn: ({ signal }) => {
      if (isPublic) {
        if (!uid) throw new Error('UID is required for public companion summary.');
        return fetchPublicCompanionSummary(uid, signal);
      }
      return fetchCompanionSummary(signal, session);
    },
    enabled: isPublic ? Boolean(uid) : true,
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
