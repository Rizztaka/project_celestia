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

import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importGenshinAccount, ApiError, type ImportResult } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";

function ImportPage() {
  const logout = useAuthStore((state) => state.logout);

  const [goodJson, setGoodJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const mutation = useMutation<ImportResult, Error, unknown>({
    mutationFn: (goodPayload: unknown) => importGenshinAccount(goodPayload),
    onSuccess: () => {
      // Invalidate the genshin cache so the Roster page reflects the new data
      queryClient.invalidateQueries({ queryKey: ["genshin"] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setParseError(null);

    // Guard: empty textarea
    if (!goodJson.trim()) {
      setParseError("Paste your GOOD export first.");
      return;
    }

    // Guard: client-side JSON validation — catches garbled text before network call
    let parsed: unknown;
    try {
      parsed = JSON.parse(goodJson);
    } catch {
      setParseError(
        "This doesn't look like valid JSON. Make sure you copied the full export.",
      );
      return;
    }

    mutation.mutate(parsed);
  };

  // Derive the error message to display (client error takes priority over server error)
  const errorMessage =
    parseError ??
    (mutation.error instanceof ApiError ? mutation.error.message : null) ??
    (mutation.isError ? "Something went wrong. Please try again." : null);

  // -------------------------------------------------------
  // Success state — replaces the form entirely
  // -------------------------------------------------------
  if (mutation.isSuccess && mutation.data) {
    const { charactersImported, weaponsImported, artifactsImported } =
      mutation.data;

    return (
      <div className="min-h-screen relative overflow-hidden text-zinc-300">
        <Nav onLogout={logout} />
        <main className="max-w-3xl mx-auto px-6 py-20 relative z-10 animate-fade-in">
          {/* Success header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-success-400/20 border border-success-400/30 shadow-[0_0_30px_rgba(52,211,153,0.3)] mb-6">
              <svg
                className="w-10 h-10 text-success-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">
              Import complete!
            </h1>
            <p className="text-zinc-400 text-lg">
              Your Genshin account has been synchronized with Celestia.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-6 mb-12">
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
              className="w-full sm:w-auto min-w-[200px] text-center bg-gradient-to-r from-accent-500 to-indigo-600 hover:from-accent-400 hover:to-indigo-500 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg shadow-accent-glow/30"
            >
              Go to Roster
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto min-w-[200px] text-center glass-panel hover-lift text-white font-semibold py-3 px-6 rounded-xl transition-all"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => {
                mutation.reset();
                setGoodJson("");
                setParseError(null);
              }}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
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
    <div className="min-h-screen relative overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />
      
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none"></div>

      <main className="max-w-3xl mx-auto px-6 py-12 relative z-10 animate-fade-in">
        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-display font-bold tracking-tight text-white mb-3">
            Import Account
          </h1>
          <p className="text-zinc-400 text-base leading-relaxed max-w-2xl">
            Export your data from{" "}
            <a
              href="https://frzyc.github.io/genshin-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent-400 hover:text-accent-300 font-medium transition-colors"
            >
              Genshin Optimizer
            </a>{" "}
            or{" "}
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
                className="text-xs font-semibold text-zinc-400 uppercase tracking-wider"
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
                placeholder={'{\n  "format": "GOOD",\n  "version": 2,\n  "characters": [...],\n  "weapons": [...],\n  "artifacts": [...]\n}'}
                className="w-full bg-celestia-950/80 border border-white/10 rounded-xl px-4 py-4 text-sm text-zinc-300 placeholder-zinc-700 font-mono leading-relaxed focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-danger-950/20 border border-danger-500/30 text-danger-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2"
              >
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {errorMessage}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-gradient-to-r from-accent-500 to-indigo-600 hover:from-accent-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base font-semibold py-3.5 px-4 rounded-xl transition-all shadow-lg shadow-accent-glow/30"
            >
              {mutation.isPending ? "Importing…" : "Start Import"}
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
    <nav className="glass-panel border-b-0 border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <Link
        to="/"
        className="font-display font-bold text-gradient text-lg tracking-tight hover:opacity-80 transition-opacity"
      >
        Project Celestia
      </Link>
      <button
        onClick={onLogout}
        className="text-sm font-medium text-zinc-500 hover:text-danger-400 transition-colors"
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
    <div className={`glass-panel border-white/5 rounded-2xl p-6 text-center hover-lift relative overflow-hidden group`}>
      <div className={`absolute inset-0 ${glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}></div>
      <p className={`text-5xl font-display font-bold ${color} mb-2 relative z-10`}>{value}</p>
      <p className="text-zinc-400 text-sm font-medium uppercase tracking-wider relative z-10">{label}</p>
    </div>
  );
}

export default ImportPage;
