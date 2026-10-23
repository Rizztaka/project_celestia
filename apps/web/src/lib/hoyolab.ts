import type { HoyolabStatus } from '@celestia/api-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { captureSession } from './account-session';
import { fetchApi } from './api';

const path = '/games/genshin/hoyolab';
export function useHoyolabStatus() {
  return useQuery({
    queryKey: ['genshin', 'hoyolab'],
    queryFn: ({ signal }) => fetchApi<HoyolabStatus>(path, { signal, cache: 'no-store' }),
    retry: false,
    refetchInterval: 60_000,
  });
}
export function useHoyolabCommand() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      kind,
      uid,
      server,
    }: {
      kind: 'sync' | 'disconnect' | 'select';
      uid?: string;
      server?: string;
    }) =>
      fetchApi<HoyolabStatus>(
        path + (kind === 'disconnect' ? '' : '/' + kind),
        {
          method: kind === 'disconnect' ? 'DELETE' : 'POST',
          ...(kind === 'select' ? { body: JSON.stringify({ uid, server }) } : {}),
        },
        captureSession(),
      ),
    onSuccess: async (data) => {
      client.setQueryData(['genshin', 'hoyolab'], data);
      await Promise.all(
        [['genshin'], ['companion'], ['intelligence']].map((queryKey) =>
          client.invalidateQueries({ queryKey }),
        ),
      );
    },
    retry: false,
  });
}
