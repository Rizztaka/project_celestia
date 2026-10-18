import type { SessionInfo } from '@celestia/api-contracts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { fetchApi } from '../lib/api';
import { planButton } from '../lib/plan-view';
import { useAuthStore } from '../stores/auth.store';

function deviceLabel(agent: string | null) {
  if (!agent) return 'Unknown device';
  const browser = /Edg\//.test(agent)
    ? 'Edge'
    : /Firefox\//.test(agent)
      ? 'Firefox'
      : /Chrome\//.test(agent)
        ? 'Chrome'
        : /Safari\//.test(agent)
          ? 'Safari'
          : 'Browser';
  const os = /Android/.test(agent)
    ? 'Android'
    : /iPhone|iPad/.test(agent)
      ? 'iOS'
      : /Windows/.test(agent)
        ? 'Windows'
        : /Macintosh|Mac OS/.test(agent)
          ? 'macOS'
          : /Linux/.test(agent)
            ? 'Linux'
            : 'Unknown OS';
  return `${browser} · ${os}`;
}
export default function SessionManagement({ verified }: { verified: boolean }) {
  const [message, setMessage] = useState('');
  const sessions = useQuery({
    queryKey: ['auth', 'sessions'],
    queryFn: ({ signal }) => fetchApi<SessionInfo[]>('/auth/sessions', { signal }),
    retry: false,
  });
  const providers = useQuery({
    queryKey: ['auth', 'providers'],
    queryFn: ({ signal }) =>
      fetchApi<{ discord: boolean; google: boolean }>('/auth/oauth/providers', { signal }),
    retry: false,
  });
  const mutation = useMutation({
    mutationFn: async (action: 'others' | 'verification' | 'discord' | 'google') => {
      if (action === 'discord' || action === 'google') {
        const result = await fetchApi<{ url: string }>(`/auth/oauth/${action}/link`, {
          method: 'POST',
          body: '{}',
        });
        useAuthStore.getState().logout();
        window.location.assign(result.url);
        return action;
      }
      await fetchApi(action === 'others' ? '/auth/logout-others' : '/auth/verification-email', {
        method: 'POST',
        body: '{}',
      });
      return action;
    },
    onSuccess: (action) => {
      setMessage(
        action === 'others'
          ? 'Other devices signed out.'
          : 'If verification is needed, an email has been sent.',
      );
      void sessions.refetch();
    },
  });
  return (
    <section aria-label="Account security" className="glass-panel space-y-5 rounded-xl p-5">
      <h2 className="text-xl font-semibold text-white">Account security</h2>
      <div className="space-y-3 text-sm text-zinc-300">
        <p>Email: {verified ? 'Verified' : 'Verification pending'}</p>
        {!verified && (
          <button
            className={planButton}
            disabled={mutation.isPending}
            onClick={() => mutation.mutate('verification')}
          >
            Send verification email
          </button>
        )}
        <div className="flex flex-wrap gap-3">
          {(['discord', 'google'] as const).map((provider) => (
            <button
              key={provider}
              className={planButton}
              disabled={mutation.isPending || !providers.data?.[provider]}
              onClick={() => mutation.mutate(provider)}
            >
              Connect {provider === 'discord' ? 'Discord' : 'Google'}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-white">Active Sessions</h3>
        <button
          className={planButton}
          disabled={sessions.isFetching}
          onClick={() => void sessions.refetch()}
        >
          Refresh sessions
        </button>
      </div>
      {sessions.isPending && <p role="status">Loading sessions…</p>}
      {sessions.error && (
        <p role="alert" className="text-amber-200">
          Sessions could not refresh. {sessions.error.message}
        </p>
      )}
      <ul className="space-y-3">
        {sessions.data?.map((session) => (
          <li
            key={session.id}
            className="space-y-2 rounded-lg border border-white/10 p-3 text-sm text-zinc-300"
          >
            <p className="font-medium text-white">
              {deviceLabel(session.userAgent)}{' '}
              {session.isCurrent && <span className="ml-2 text-emerald-200">This device</span>}
            </p>
            <p className="break-words">IP: {session.ipAddress ?? 'Unknown'}</p>
            <p>Signed in: {new Date(session.createdAt).toLocaleString()}</p>
            <p>Last refreshed: {new Date(session.lastRefreshedAt).toLocaleString()}</p>
            <details>
              <summary className="cursor-pointer">Device details</summary>
              <p className="mt-2 break-words">
                {session.userAgent ?? 'No browser details were recorded.'}
              </p>
            </details>
          </li>
        ))}
      </ul>
      <button
        className={planButton}
        disabled={mutation.isPending || !sessions.data?.some((session) => !session.isCurrent)}
        onClick={() => mutation.mutate('others')}
      >
        Sign out of all other devices
      </button>
      {message && (
        <p role="status" className="text-sm text-emerald-200">
          {message}
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="text-sm text-amber-200">
          {mutation.error.message}
        </p>
      )}
    </section>
  );
}
