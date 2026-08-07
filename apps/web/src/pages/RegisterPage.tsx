/**
 * RegisterPage — POST /api/v1/auth/register
 *
 * On success: stores token in Zustand, navigates to dashboard.
 * On failure: displays the server's error message inline.
 * Form input is preserved after failure so users don't have to retype.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { fetchApi, ApiError } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";
import type { AuthUser } from "../stores/auth.store";

interface RegisterResponse {
  user: AuthUser;
  token: string;
}

function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      fetchApi<RegisterResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password }),
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl mix-blend-screen pointer-events-none"></div>
      
      <div className="w-full max-w-sm animate-fade-in relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-display font-bold text-gradient tracking-tight">
            Project Celestia
          </h1>
          <p className="text-zinc-400 text-sm mt-2 font-medium">Create your account</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
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
                htmlFor="username"
                className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                autoComplete="username"
                minLength={3}
                maxLength={30}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="traveler"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full bg-celestia-950/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all shadow-inner"
              />
            </div>

            {/* Error message — input preserved after failure */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-danger-950/20 border border-danger-500/30 text-danger-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-accent-500 to-indigo-600 hover:from-accent-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-accent-glow/30 mt-4"
            >
              {mutation.isPending ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="text-center text-zinc-500 text-sm mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
