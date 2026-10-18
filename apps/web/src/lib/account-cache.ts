import { QueryClient } from '@tanstack/react-query';

import { useAuthStore } from '../stores/auth.store';

export function createAccountQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      mutations: { retry: false },
      queries: {
        retry: (failureCount, error) => {
          if (error instanceof Error && 'status' in error) {
            const status = (error as { status: number }).status;
            if (status >= 400 && status < 500) return false;
          }
          return failureCount < 2;
        },
      },
    },
  });
}

export async function invalidateIntentQueries(client: QueryClient): Promise<void> {
  await Promise.all(
    [['companion'], ['genshin'], ['roster'], ['intelligence']].map((queryKey) =>
      client.invalidateQueries({ queryKey }),
    ),
  );
}

export function bindAccountCache(client: QueryClient): () => void {
  return useAuthStore.subscribe((current, previous) => {
    if (
      current.sessionEpoch !== previous.sessionEpoch ||
      (current.token !== previous.token && current.tokenRotation === previous.tokenRotation)
    ) {
      // clear() cancels outstanding queries and removes queries and mutations.
      client.clear();
    }
  });
}
