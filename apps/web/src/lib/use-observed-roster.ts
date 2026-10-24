import { type ShowcaseResult, showcaseUidSchema } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';

import {
  mergeObservations,
  observationsFromResult,
  observedRosterKey,
  readObservedRoster,
} from './observed-roster';

export function useObservedRoster(uid: string, result?: ShowcaseResult) {
  const history = useQuery({
    queryKey: observedRosterKey(uid),
    queryFn: () => readObservedRoster(uid),
    enabled: showcaseUidSchema.safeParse(uid).success,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  const records = mergeObservations(
    history.data?.records ?? [],
    observationsFromResult(uid, result),
  );
  return {
    records,
    issue:
      history.data?.issue ??
      (history.error
        ? 'Saved roster is unavailable in this browser. Previously stored records have not been deleted.'
        : null),
  };
}
