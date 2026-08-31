/**
 * ProfilePage — displays the current user's account profile.
 *
 * Completes the "User profiles" objective from Phase 1 (ROADMAP.md).
 *
 * Fetches from GET /api/v1/auth/me. TanStack Query caches this data
 * so if the user navigated from the dashboard, the request is already
 * cached and no new network call is made (staleTime default behaviour).
 */

import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

function ProfilePage() {
  const logout = useAuthStore((state) => state.logout);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['me'], // same key as DashboardPage — uses cached result
    queryFn: () => fetchApi<MeResponse>('/auth/me'),
    retry: false,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
    }
  }, [error, logout]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top navigation bar */}
      <nav className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <Link
          to="/"
          className="font-semibold tracking-tight text-indigo-400 transition-colors hover:text-indigo-300"
        >
          Project Celestia
        </Link>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 transition-colors hover:text-red-400"
        >
          Sign out
        </button>
      </nav>

      {/* Main content */}
      <main className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-8 text-2xl font-bold tracking-tight">Your Profile</h1>

        <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-zinc-900">
          {/* Username */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-400">Username</span>
            <span className="text-sm font-medium text-white">{profile?.username ?? '—'}</span>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-400">Email</span>
            <span className="text-sm font-medium text-white">{profile?.email ?? '—'}</span>
          </div>

          {/* Account ID */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-400">Account ID</span>
            <span className="font-mono text-xs text-zinc-500">{profile?.id ?? '—'}</span>
          </div>

          {/* Member since */}
          <div className="flex items-center justify-between px-6 py-4">
            <span className="text-sm text-zinc-400">Member since</span>
            <span className="text-sm text-white">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : '—'}
            </span>
          </div>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="mt-6 inline-block text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to dashboard
        </Link>
      </main>
    </div>
  );
}

export default ProfilePage;
