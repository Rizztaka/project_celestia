import { showcaseUidSchema } from '@celestia/api-contracts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useReducer } from 'react';

import {
  mergeObservations,
  observationsFromResult,
  type ObservedRoster,
  observedRosterKey,
  recordObservedRoster,
} from './observed-roster';
import {
  fetchShowcase,
  refreshSeconds,
  rememberSuccessfulShowcase,
  retainShowcaseSnapshot,
  showcaseQueryKey,
  showcaseQueryOptions,
} from './showcase';

export function useShowcase(uid: string) {
  const client = useQueryClient();
  const options = showcaseQueryOptions(uid);
  const query = useQuery({
    ...options,
    queryFn: async ({ signal }) =>
      retainShowcaseSnapshot(
        client.getQueryData(showcaseQueryKey(uid)),
        await fetchShowcase(uid, signal),
      ),
    enabled: showcaseUidSchema.safeParse(uid).success,
  });
  useEffect(() => {
    if (!query.data) return;
    rememberSuccessfulShowcase(query.data);
    if (
      !query.data.snapshot ||
      query.data.snapshot.uid !== uid ||
      query.data.issue ||
      !query.data.fetchedAt
    )
      return;
    const result = query.data;
    let active = true;
    void recordObservedRoster(uid, result)
      .then((saved) => {
        if (active)
          client.setQueryData<ObservedRoster>(observedRosterKey(uid), (previous) => ({
            records: mergeObservations(saved.records, previous?.records ?? []),
            issue:
              previous?.issue &&
              previous.records.some(
                (record) =>
                  !saved.records.some(
                    (item) =>
                      item.character.key === record.character.key &&
                      Date.parse(item.observedAt) >= Date.parse(record.observedAt),
                  ),
              )
                ? previous.issue
                : saved.issue,
          }));
      })
      .catch(() => {
        if (active)
          client.setQueryData<ObservedRoster>(observedRosterKey(uid), (previous) => ({
            records: mergeObservations(
              previous?.records ?? [],
              observationsFromResult(uid, result),
            ),
            issue:
              'Roster changes could not be saved in this browser. Keep this tab open and check browser storage access. Existing stored records were preserved.',
          }));
      });
    return () => {
      active = false;
    };
  }, [query.data, uid, client]);
  return query;
}

export function useRefreshSeconds(result: Parameters<typeof refreshSeconds>[0]) {
  const [, tick] = useReducer((value: number) => value + 1, 0);
  const deadline = result?.nextRefreshAt;
  useEffect(() => {
    if (!deadline || Date.parse(deadline) <= Date.now()) return;
    const timer = window.setInterval(() => {
      tick();
      if (Date.parse(deadline) <= Date.now()) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [deadline]);
  return refreshSeconds(result);
}
