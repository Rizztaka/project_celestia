/**
 * ImportPage — POST /api/v1/games/genshin/import
 *
 * Allows the user to paste a GOOD-format JSON export from Genshin Optimizer
 * or Inventory Kamera and import it into their Project Celestia account.
 *
 * UI states:
 *   idle    → textarea + submit button
 *   pending → textarea disabled + "Importing…" button
 *   error   → error banner shown above submit button (textarea preserved)
 *   success → stat summary screen replaces the form entirely
 *
 * Error handling (two layers):
 *   1. Client-side: JSON.parse() fails before any network request → local state
 *   2. Server-side: ApiError from mutation → mutation.error.message displayed
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ApiError, importGenshinAccount, type ImportResult } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

function ImportPage() {
  const logout = useAuthStore((state) => state.logout);

  const [goodJson, setGoodJson] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation<ImportResult, Error, unknown>({
    mutationFn: (goodPayload: unknown) => importGenshinAccount(goodPayload),
    onSuccess: () => {
      // Invalidate the genshin cache so the Roster page reflects the new data
      queryClient.invalidateQueries({ queryKey: ['genshin'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    // Guard: empty textarea
    if (!goodJson.trim()) {
      setParseError('Paste your GOOD export first.');
      return;
    }

    // Guard: client-side JSON validation — catches garbled text before network call
    let parsed: unknown;
    try {
      parsed = JSON.parse(goodJson);
    } catch {
      setParseError("This doesn't look like valid JSON. Make sure you copied the full export.");
      return;
    }

    mutation.mutate(parsed);
  };

  // Derive the error message to display (client error takes priority over server error)
  const errorMessage =
    parseError ??
    (mutation.error instanceof ApiError ? mutation.error.message : null) ??
    (mutation.isError ? 'Something went wrong. Please try again.' : null);

  // -------------------------------------------------------
  // Success state — replaces the form entirely
  // -------------------------------------------------------
  if (mutation.isSuccess && mutation.data) {
    const { charactersImported, weaponsImported, artifactsImported } = mutation.data;

    return (
      <div className="relative min-h-screen overflow-hidden text-zinc-300">
        <Nav onLogout={logout} />
        <main className="animate-fade-in relative z-10 mx-auto max-w-3xl px-6 py-20">
          {/* Success header */}
          <div className="mb-12 text-center">
            <div className="bg-success-400/20 border-success-400/30 mb-6 inline-flex h-20 w-20 items-center justify-center rounded-2xl border shadow-[0_0_30px_rgba(52,211,153,0.3)]">
              <svg
                className="text-success-400 h-10 w-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="font-display mb-2 text-4xl font-bold tracking-tight text-white">
              Import complete!
            </h1>
            <p className="text-lg text-zinc-400">
              Your Genshin account has been synchronized with Celestia.
            </p>
          </div>

          {/* Stat cards */}
          <div className="mb-12 grid grid-cols-3 gap-6">
            <StatCard
              label="Characters"
              value={charactersImported}
              color="text-accent-400"
              glow="bg-accent-500/10"
            />
            <StatCard
              label="Weapons"
              value={weaponsImported}
              color="text-amber-400"
              glow="bg-amber-400/10"
            />
            <StatCard
              label="Artifacts"
              value={artifactsImported}
              color="text-purple-400"
              glow="bg-purple-400/10"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-4">
            <Link
              to="/roster"
              className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 w-full min-w-[200px] rounded-xl bg-gradient-to-r to-indigo-600 px-6 py-3 text-center font-semibold text-white shadow-lg transition-all hover:to-indigo-500 sm:w-auto"
            >
              Go to Roster
            </Link>
            <Link
              to="/"
              className="glass-panel hover-lift w-full min-w-[200px] rounded-xl px-6 py-3 text-center font-semibold text-white transition-all sm:w-auto"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => {
                mutation.reset();
                setGoodJson('');
                setParseError(null);
              }}
              className="text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-300"
            >
              Import another file
            </button>
          </div>
        </main>
      </div>
    );
  }

  // -------------------------------------------------------
  // Idle / Pending / Error state
  // -------------------------------------------------------
  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Background ambient glow */}
      <div className="bg-accent-500/5 pointer-events-none absolute right-0 top-0 h-[500px] w-[500px] rounded-full mix-blend-screen blur-[100px]"></div>

      <main className="animate-fade-in relative z-10 mx-auto max-w-3xl px-6 py-12">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="font-display mb-3 text-3xl font-bold tracking-tight text-white">
            Import Account
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-zinc-400">
            Export your data from{' '}
            <a
              href="https://frzyc.github.io/genshin-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              Genshin Optimizer
            </a>{' '}
            or{' '}
            <a
              href="https://github.com/Inventory-Kamera/InventoryKamera"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              Inventory Kamera
            </a>
            , then paste the JSON below.
          </p>
        </div>

        {/* Import form */}
        <div className="glass-panel rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Textarea */}
            <div className="space-y-2">
              <label
                htmlFor="good-json"
                className="text-xs font-semibold uppercase tracking-wider text-zinc-400"
              >
                GOOD Format JSON
              </label>
              <textarea
                id="good-json"
                rows={12}
                value={goodJson}
                onChange={(e) => {
                  setGoodJson(e.target.value);
                  if (parseError) setParseError(null);
                  if (mutation.isError) mutation.reset();
                }}
                disabled={mutation.isPending}
                placeholder={
                  '{\n  "format": "GOOD",\n  "version": 2,\n  "characters": [...],\n  "weapons": [...],\n  "artifacts": [...]\n}'
                }
                className="bg-celestia-950/80 focus:border-accent-500 focus:ring-accent-500 w-full resize-none rounded-xl border border-white/10 px-4 py-4 font-mono text-sm leading-relaxed text-zinc-300 placeholder-zinc-700 shadow-inner transition-all focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Error banner */}
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

            {/* Submit button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="from-accent-500 hover:from-accent-400 shadow-accent-glow/30 w-full rounded-xl bg-gradient-to-r to-indigo-600 px-4 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {mutation.isPending ? 'Importing…' : 'Start Import'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

// -------------------------------------------------------
// Local sub-components
// -------------------------------------------------------

function Nav({ onLogout }: { onLogout: () => void }) {
  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between border-b-0 border-white/10 px-6 py-4">
      <Link
        to="/"
        className="font-display text-gradient text-lg font-bold tracking-tight transition-opacity hover:opacity-80"
      >
        Project Celestia
      </Link>
      <button
        onClick={onLogout}
        className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
      >
        Sign out
      </button>
    </nav>
  );
}

function StatCard({
  label,
  value,
  color,
  glow,
}: {
  label: string;
  value: number;
  color: string;
  glow: string;
}) {
  return (
    <div
      className={`glass-panel hover-lift group relative overflow-hidden rounded-2xl border-white/5 p-6 text-center`}
    >
      <div
        className={`absolute inset-0 ${glow} pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
      ></div>
      <p className={`font-display text-5xl font-bold ${color} relative z-10 mb-2`}>{value}</p>
      <p className="relative z-10 text-sm font-medium uppercase tracking-wider text-zinc-400">
        {label}
      </p>
    </div>
  );
}

export default ImportPage;
