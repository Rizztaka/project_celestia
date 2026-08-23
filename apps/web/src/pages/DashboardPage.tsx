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
import { Link } from 'react-router-dom';
import { useEffect } from 'react';

import { ApiError,fetchApi } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);

  const {
    // data,
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
          <Link
            to="/profile"
            className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
          >
            Profile
          </Link>
          <button
            onClick={logout}
            className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="animate-fade-in relative z-10 mx-auto max-w-5xl px-6 py-10">
        
        {/* Launch Banner (Phase 7) */}
        <div className="mb-8 overflow-hidden rounded-2xl border border-accent-500/30 bg-accent-500/10 p-1 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-indigo-500/20 blur-xl"></div>
          <div className="relative flex items-center justify-between rounded-xl bg-celestia-900/80 px-6 py-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-accent-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="font-display font-bold text-white">All Systems Operational</h3>
                <p className="text-xs text-accent-200">Project Celestia is fully online and ready for deployment.</p>
              </div>
            </div>
            <div className="hidden sm:block">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-400 opacity-75"></span>
                <span className="relative inline-flex h-3 w-3 rounded-full bg-accent-500"></span>
              </span>
            </div>
          </div>
        </div>

        <header className="mb-8 relative">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-2">Welcome Back</h1>
        <p className="text-muted-foreground text-lg">Select a game domain to enter your personalized command center.</p>
      </header>

      {/* GAME DOMAINS (DUAL PORTAL) */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Genshin Impact Portal */}
        <Link to="/roster" className="block glass-panel p-8 relative overflow-hidden group cursor-pointer border-blue-500/30 hover:border-blue-400 hover:-translate-y-1 hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.3)] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl group-hover:bg-blue-400/30 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-500/20 p-2 rounded-lg text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/30 transition-all">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white drop-shadow-md">Genshin Impact</h2>
            </div>
            <p className="text-blue-100/70 flex-grow">Manage your Teyvat journey. Optimize your roster, analyze pull history, and conquer the Spiral Abyss.</p>
          </div>
        </Link>

        {/* NIKKE Portal */}
        <Link to="/nikke/roster" className="block glass-panel p-8 relative overflow-hidden group cursor-pointer border-pink-500/30 hover:border-pink-400 hover:-translate-y-1 hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.3)] transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-pink-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl group-hover:bg-pink-400/30 transition-all duration-700" />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/20 p-2 rounded-lg text-pink-400 group-hover:scale-110 group-hover:bg-pink-500/30 transition-all">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-md">Goddess of Victory</h2>
              </div>
              <span className="px-2 py-1 text-xs font-bold bg-pink-500/20 text-pink-300 rounded-md border border-pink-500/30">NEW</span>
            </div>
            <p className="text-pink-100/70 flex-grow">Command your Nikke squad. Track limits breaks, manage Overload gear, and prepare for the surface reclamation.</p>
          </div>
        </Link>
      </section>

      <section className="mt-16">
        <h2 className="text-2xl font-bold tracking-tight text-white mb-6">Quick Navigation</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link
            to="/import"
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
          </Link>

          <Link
            to="/roster"
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
          </Link>

          <Link
            to="/inventory"
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
          </Link>

          <Link
            to="/planner"
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
          </Link>

          <Link
            to="/endgame"
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
          </Link>

          <Link
            to="/intelligence"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-blue-400">
              Intelligence Core
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              AI-driven insights for your characters, artifacts, and teams.
            </p>
          </Link>

          <Link
            to="/simulators"
            className="glass-panel hover-lift group block cursor-pointer rounded-2xl p-6"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 transition-transform group-hover:scale-110">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
            </div>
            <h2 className="font-display text-lg font-bold text-white transition-colors group-hover:text-amber-400">
              Pull Simulator
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              Simulate banner wishes with accurate pity and 50/50 mechanics.
            </p>
          </Link>
        </div>
      </section>
      </main>
    </div>
  );
}

export default DashboardPage;
