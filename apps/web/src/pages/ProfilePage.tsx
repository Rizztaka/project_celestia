import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import AccountDataControls from '../components/AccountDataControls';
import SessionManagement from '../components/SessionManagement';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { ApiError, fetchApi } from '../lib/api';
import { planButton } from '../lib/plan-view';
import { useAuthStore } from '../stores/auth.store';

export default function ProfilePage() {
  const logout = useAuthStore((state) => state.logout);
  const [session] = useState(captureSession);
  const profile = useQuery({
    queryKey: ['me'],
    queryFn: ({ signal }) => fetchApi<MeResponse>('/auth/me', { signal }, session),
    retry: false,
  });
  useEffect(() => {
    if (
      isCurrentSession(session) &&
      profile.error instanceof ApiError &&
      profile.error.status === 401
    )
      logout();
  }, [profile.error, logout, session]);
  return (
    <main
      id="companion-content"
      tabIndex={-1}
      className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6"
    >
      <header>
        <p className="eyebrow">YOUR SPACE</p>
        <h1 className="text-3xl font-bold text-white">Settings & profile</h1>
        <p className="mt-3 text-zinc-400">
          Adjust your companion using the same controls you use day to day.
        </p>
      </header>
      <section aria-label="Companion settings" className="glass-panel space-y-4 rounded-xl p-5">
        <h2 className="text-xl font-semibold text-white">Your companion</h2>
        <div className="flex flex-wrap gap-3">
          <Link className={planButton} to="/planner?tab=daily#routine-settings">
            Server & manual records
          </Link>
          <Link className={planButton} to="/workspace#plan-choices">
            Routine choices & resin ceiling
          </Link>
          <Link className={planButton} to="/import">
            Import observations
          </Link>
        </div>
        <p className="text-sm text-zinc-400">
          Asia, America, Europe and TW/HK/MO reset tracking are supported. Imports are optional and
          preserve focus, declared goals and plan choices.
        </p>
      </section>
      <section aria-label="Account profile" className="glass-panel space-y-4 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Your account</h2>
          <button
            className={planButton}
            disabled={profile.isFetching}
            onClick={() => void profile.refetch()}
          >
            Refresh profile
          </button>
        </div>
        {profile.isPending && <p role="status">Loading profile…</p>}
        {profile.error && (
          <p role="alert" className="text-amber-200">
            Could not refresh profile.{' '}
            {profile.data
              ? 'Last confirmed account details remain below.'
              : 'Account details are unavailable. Try Refresh profile.'}
          </p>
        )}
        {profile.data && (
          <dl className="grid gap-4 sm:grid-cols-2">
            {[
              ['Username', profile.data.username],
              ['Email', profile.data.email],
              ['Account ID', profile.data.id],
              ['Member since', new Date(profile.data.createdAt).toLocaleDateString()],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-sm text-zinc-400">{label}</dt>
                <dd className="mt-1 break-words text-white">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>
      <SessionManagement verified={!!profile.data?.emailVerifiedAt} />
      <AccountDataControls />
    </main>
  );
}
