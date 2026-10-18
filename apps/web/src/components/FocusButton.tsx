import type { FocusRecord } from '@celestia/api-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { invalidateIntentQueries } from '../lib/account-cache';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { fetchFocus, setFocus } from '../lib/api';

export function FocusButton({ characterKey }: { characterKey: string }) {
  const client = useQueryClient();
  const [session] = useState(captureSession);
  const [error, setError] = useState<string | null>(null);
  const focus = useQuery({
    queryKey: ['genshin', 'focus'],
    queryFn: ({ signal }) => fetchFocus(signal),
    retry: false,
  });
  const record = focus.data?.find((row) => row.characterKey === characterKey);
  const save = useMutation({
    mutationFn: () =>
      setFocus(
        characterKey,
        { contractVersion: 1, focused: !record?.focused, expectedRevision: record?.revision ?? 0 },
        session,
      ),
    retry: false,
    networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: ['genshin', 'focus'] }),
    onSuccess: (saved) => {
      if (isCurrentSession(session)) {
        client.setQueryData<FocusRecord[]>(['genshin', 'focus'], (old) => {
          const previous = old?.find((row) => row.characterKey === saved.characterKey);
          return previous && previous.revision > saved.revision
            ? old
            : [...(old ?? []).filter((row) => row.characterKey !== saved.characterKey), saved];
        });
        setError(null);
        void invalidateIntentQueries(client);
      }
    },
    onError: (error) => {
      if (isCurrentSession(session)) setError(error.message);
    },
  });
  return (
    <div className="space-y-2">
      <button
        type="button"
        aria-pressed={record?.focused ?? false}
        disabled={save.isPending || focus.isPending || focus.isError}
        onClick={() => save.mutate()}
        className="rounded-lg border border-indigo-400/40 px-3 py-2 text-sm text-indigo-200 disabled:opacity-50"
      >
        {save.isPending ? 'Saving focus…' : record?.focused ? 'Remove from focus' : 'Add to focus'}
      </button>
      {(error || focus.error) && (
        <div role="alert" className="text-sm text-amber-200">
          {error ?? focus.error?.message}{' '}
          <button
            className="underline"
            onClick={() =>
              void focus.refetch().then(() => {
                if (isCurrentSession(session)) setError(null);
              })
            }
          >
            Refresh focus
          </button>
        </div>
      )}
    </div>
  );
}
