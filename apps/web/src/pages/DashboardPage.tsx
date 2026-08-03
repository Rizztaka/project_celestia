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
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top navigation bar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-indigo-400 tracking-tight">
          Project Celestia
        </span>
        <div className="flex items-center gap-4">
          <a
            href="/profile"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Profile
          </a>
          <button
            onClick={logout}
            className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back,{" "}
          <span className="text-indigo-400">{profile?.username}</span>
        </h1>
        <p className="text-zinc-400 mt-2">
          Your Genshin companion is being built. Check back soon.
        </p>

        {/* Phase 2 placeholder */}
        <div className="mt-10 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Characters", desc: "Coming in Phase 2" },
            { label: "Artifacts", desc: "Coming in Phase 2" },
            { label: "Daily Planner", desc: "Coming in Phase 3" },
          ].map((card) => (
            <div
              key={card.label}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5"
            >
              <h2 className="font-semibold text-white text-sm">{card.label}</h2>
              <p className="text-zinc-500 text-xs mt-1">{card.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
