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

import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { ApiError,fetchApi } from '../lib/api';
import type { AuthUser } from '../stores/auth.store';
import { useAuthStore } from '../stores/auth.store';

interface LoginResponse {
  user: AuthUser;
  token: string;
}

function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      fetchApi<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
    onSuccess: (data) => {
      login(data.token, data.user);
      navigate('/', { replace: true });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const errorMessage = mutation.error instanceof ApiError ? mutation.error.message : null;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      {/* Background ambient glow */}
      <div className="bg-accent-500/10 pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full mix-blend-screen blur-3xl"></div>
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-indigo-500/10 mix-blend-screen blur-3xl"></div>

      <div className="animate-fade-in relative z-10 w-full max-w-sm">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="font-display text-gradient text-3xl font-bold tracking-tight">
            Project Celestia
          </h1>
          <p className="mt-2 text-sm font-medium text-zinc-400">Sign in to your account</p>
        </div>

        {/* Card */}
        <div className="glass-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
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
                className="bg-celestia-950/50 focus:border-accent-500 focus:ring-accent-500 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-600 shadow-inner transition-all focus:outline-none focus:ring-1"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="password"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
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
                className="bg-celestia-950/50 focus:border-accent-500 focus:ring-accent-500 w-full rounded-xl border border-white/10 px-4 py-2.5 text-sm text-white placeholder-zinc-600 shadow-inner transition-all focus:outline-none focus:ring-1"
              />
            </div>

            {/* Error message — preserved after failure */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-danger-950/20 border-danger-500/30 text-danger-400 animate-fade-in flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
              >
                <svg
                  className="h-5 w-5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={mutation.isPending}
              className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 mt-4 w-full rounded-xl bg-gradient-to-r to-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* Footer link */}
        <p className="mt-6 text-center text-sm text-zinc-500">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
