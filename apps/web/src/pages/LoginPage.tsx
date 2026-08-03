/**
 * LoginPage — POST /api/v1/auth/login
 *
 * On success: stores token in Zustand, navigates to dashboard.
 * On failure: displays the server's error message inline.
 *
 * Per UI_UX_GUIDELINES.md:
 *   - Forms preserve entered information after validation failures
 *   - Error messages are clear and avoid technical jargon
 *   - Immediate feedback on submission
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { fetchApi, ApiError } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import type { AuthUser } from "../stores/auth.store";

interface LoginResponse {
  user: AuthUser;
  token: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      fetchApi<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate("/", { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorMessage =
    mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Project Celestia
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Error message — preserved after failure */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-red-950/50 border border-red-800 text-red-300 text-sm px-3 py-2 rounded-lg"
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors mt-2"
            >
              {mutation.isPending ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
