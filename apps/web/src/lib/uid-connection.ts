import { type ShowcaseResult, showcaseUidSchema } from '@celestia/api-contracts';
import type { QueryClient } from '@tanstack/react-query';

import { refreshSeconds, rememberSuccessfulShowcase, showcaseQueryOptions } from './showcase';

/** Searching is a preview. Only the separate Add action remembers the UID. */
export async function lookupUidCandidate(client: QueryClient, input: string) {
  const uid = showcaseUidSchema.parse(input.trim());
  const options = showcaseQueryOptions(uid);
  const cached = client.getQueryData(options.queryKey);
  return client.fetchQuery({
    ...options,
    staleTime: cached?.issue && refreshSeconds(cached) === 0 ? 0 : Infinity,
  });
}

export function canAddUidCandidate(input: string, result?: ShowcaseResult): boolean {
  return (
    !!result?.snapshot &&
    result.snapshot.uid === input.trim() &&
    !result.issue &&
    (result.delivery === 'fetched' || result.delivery === 'cached')
  );
}

export function connectUidCandidate(input: string, result?: ShowcaseResult): string | null {
  if (!canAddUidCandidate(input, result)) return null;
  rememberSuccessfulShowcase(result!);
  return result!.snapshot!.uid;
}
