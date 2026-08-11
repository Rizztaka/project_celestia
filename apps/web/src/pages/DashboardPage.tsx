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

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApi, ApiError } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import type { MeResponse } from "@celestia/api-contracts";

function DashboardPage() {
  const logout = useAuthStore((state) => state.logout);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchApi<MeResponse>("/auth/me"),
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading…</p>
      </div>
    );
  }

  if (error && !(error instanceof ApiError && error.status === 401)) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-sm">Something went wrong.</p>
          <p className="text-zinc-500 text-xs mt-1">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-zinc-300">
      {/* Top navigation bar */}
      <nav className="glass-panel border-b-0 border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <span className="font-display font-bold text-gradient text-lg tracking-tight">
          Project Celestia
        </span>
        <div className="flex items-center gap-6">
          <a
            href="/profile"
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Profile
          </a>
          <button
            onClick={logout}
            className="text-sm font-medium text-zinc-500 hover:text-danger-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-16 animate-fade-in relative z-10">
        <div className="mb-12">
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">
            Welcome back,{" "}
            <span className="text-gradient">{profile?.username}</span>
          </h1>
          <p className="text-zinc-400 mt-3 text-lg max-w-2xl">
            Your Genshin companion is being built. Check back soon for new features.
          </p>
        </div>

        {/* Phase 2 — Import entry point */}
        <div className="mt-10 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <a
            href="/import"
            className="glass-panel hover-lift rounded-2xl p-6 group cursor-pointer block"
          >
            <div className="w-12 h-12 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            </div>
            <h2 className="font-display font-bold text-white text-lg group-hover:text-accent-400 transition-colors">
              Import Account
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Import your roster from Genshin Optimizer or Inventory Kamera.
            </p>
          </a>

          <a
            href="/roster"
            className="glass-panel hover-lift rounded-2xl p-6 group cursor-pointer block"
          >
            <div className="w-12 h-12 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <h2 className="font-display font-bold text-white text-lg group-hover:text-violet-400 transition-colors">
              Roster
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Browse your imported characters, their talents, and equipped weapons.
            </p>
          </a>

          <a
            href="/inventory"
            className="glass-panel hover-lift rounded-2xl p-6 group cursor-pointer block"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
            <h2 className="font-display font-bold text-white text-lg group-hover:text-amber-400 transition-colors">
              Inventory
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Browse your full weapon and artifact inventories.
            </p>
          </a>

          <a
            href="/planner"
            className="glass-panel hover-lift rounded-2xl p-6 group cursor-pointer block"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <h2 className="font-display font-bold text-white text-lg group-hover:text-emerald-400 transition-colors">
              Daily Planner
            </h2>
            <p className="text-zinc-400 text-sm mt-2 leading-relaxed">
              Track your resin and daily checklist.
            </p>
          </a>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
