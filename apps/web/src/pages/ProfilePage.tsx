/**
 * ProfilePage — displays the current user's account profile.
 *
 * Completes the "User profiles" objective from Phase 1 (ROADMAP.md).
 *
 * Fetches from GET /api/v1/auth/me. TanStack Query caches this data
 * so if the user navigated from the dashboard, the request is already
 * cached and no new network call is made (staleTime default behaviour).
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchApi, ApiError } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import type { MeResponse } from "@celestia/api-contracts";

function ProfilePage() {
  const logout = useAuthStore((state) => state.logout);

  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["me"], // same key as DashboardPage — uses cached result
    queryFn: () => fetchApi<MeResponse>("/auth/me"),
    retry: false,
  });

  useEffect(() => {
    if (error instanceof ApiError && error.status === 401) {
      logout();
    }
  }, [error, logout]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Top navigation bar */}
      <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="font-semibold text-indigo-400 tracking-tight hover:text-indigo-300 transition-colors"
        >
          Project Celestia
        </Link>
        <button
          onClick={logout}
          className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
        >
          Sign out
        </button>
      </nav>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight mb-8">
          Your Profile
        </h1>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          {/* Username */}
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Username</span>
            <span className="text-white text-sm font-medium">
              {profile?.username ?? "—"}
            </span>
          </div>

          {/* Email */}
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Email</span>
            <span className="text-white text-sm font-medium">
              {profile?.email ?? "—"}
            </span>
          </div>

          {/* Account ID */}
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Account ID</span>
            <span className="text-zinc-500 text-xs font-mono">
              {profile?.id ?? "—"}
            </span>
          </div>

          {/* Member since */}
          <div className="px-6 py-4 flex justify-between items-center">
            <span className="text-zinc-400 text-sm">Member since</span>
            <span className="text-white text-sm">
              {profile?.createdAt
                ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
        </div>

        {/* Back link */}
        <Link
          to="/"
          className="inline-block mt-6 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          ← Back to dashboard
        </Link>
      </main>
    </div>
  );
}

export default ProfilePage;
