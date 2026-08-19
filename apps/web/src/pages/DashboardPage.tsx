/**
 * DashboardPage — the home screen for authenticated users.
 *
 * Calls GET /api/v1/auth/me via TanStack Query to restore the session
 * and display a personalised greeting. This is the correct pattern:
 * TanStack Query owns server state; it handles caching, background
 * refetch, and loading/error states automatically.
 *
 * If the token is expired or invalid, fetchApi throws an ApiError (401),
 * which triggers logout() to clear stale state and ProtectedRoute to
 * redirect to /login.
 */

import type { MeResponse } from '@celestia/api-contracts';
import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { ApiError,fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['me'],
    queryFn: () => fetchApi<MeResponse>('/auth/me'),
    retry: false, // don't retry auth failures
  });

  // If the server rejects the token (expired / revoked), clear auth state.
  // ProtectedRoute will then redirect to /login automatically.
  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
    }
  }, [error, logout]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <p className="text-sm text-zinc-500">Loading…</p>
      </div>
    );
  }

  if (error && !(error instanceof ApiError && error.status === 401)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center">
          <p className="text-sm text-red-400">Something went wrong.</p>
          <p className="mt-1 text-xs text-zinc-500">
            {error instanceof Error ? error.message : 'Unknown error'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      {/* Top navigation bar */}
      <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
        <span className="font-display text-gradient text-lg font-bold tracking-tight">
          Project Celestia
        </span>
        <div className="flex items-center gap-6">
          <a
            href="/profile"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Profile
          </a>
          <button
            onClick={logout}
            className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="animate-fade-in relative z-10 mx-auto max-w-5xl px-6 py-16">
        <div className="mb-12">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Welcome back, <span className="text-gradient">{profile?.username}</span>
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-zinc-400">
            Your Genshin companion is being built. Check back soon for new features.
          </p>
        </div>

        {/* Phase 2 — Import entry point */}
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/import"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="bg-accent-500/20 text-accent-400 mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
            </div>
            <h2 className="font-display group-hover:text-accent-400 text-lg font-bold text-white transition-colors">
              Import Account
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Import your roster from Genshin Optimizer or Inventory Kamera.
            </p>
          </a>

          <a
            href="/roster"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-violet-400">
              Roster
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Browse your imported characters, their talents, and equipped weapons.
            </p>
          </a>

          <a
            href="/inventory"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-amber-400">
              Inventory
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Browse your full weapon and artifact inventories.
            </p>
          </a>

          <a
            href="/planner"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-emerald-400">
              Daily Planner
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Track your resin and daily checklist.
            </p>
          </a>

          <a
            href="/endgame"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/20 text-violet-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-violet-400">
              Endgame Center
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Track your Spiral Abyss teams and star ratings per cycle.
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
