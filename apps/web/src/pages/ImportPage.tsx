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
import { useMutation } from "@tanstack/react-query";
import { importGenshinAccount, ApiError, type ImportResult } from "../lib/api";
import { useAuthStore } from "../stores/auth.store";

function ImportPage() {
  const logout = useAuthStore((state) => state.logout);

  const [goodJson, setGoodJson] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);

  const mutation = useMutation<ImportResult, Error, unknown>({
    mutationFn: (goodPayload: unknown) => importGenshinAccount(goodPayload),
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
      <div className="min-h-screen bg-zinc-950 text-white">
        <Nav onLogout={logout} />
        <main className="max-w-2xl mx-auto px-6 py-16">
          {/* Success header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-900/50 border border-emerald-700 mb-5">
              <svg
                className="w-7 h-7 text-emerald-400"
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
            <h1 className="text-2xl font-bold tracking-tight">
              Import complete!
            </h1>
            <p className="text-zinc-400 text-sm mt-2">
              Your Genshin account has been saved to Project Celestia.
            </p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            <StatCard
              label="Characters"
              value={charactersImported}
              color="text-indigo-400"
            />
            <StatCard
              label="Weapons"
              value={weaponsImported}
              color="text-amber-400"
            />
            <StatCard
              label="Artifacts"
              value={artifactsImported}
              color="text-violet-400"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-col items-center gap-3">
            <Link
              to="/"
              className="w-full text-center bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={() => {
                mutation.reset();
                setGoodJson("");
                setParseError(null);
              }}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Import again
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
    <div className="min-h-screen bg-zinc-950 text-white">
      <Nav onLogout={logout} />
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Import Account</h1>
          <p className="text-zinc-400 text-sm mt-2">
            Export your data from{" "}
            <a
              href="https://frzyc.github.io/genshin-optimizer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Genshin Optimizer
            </a>{" "}
            or{" "}
            <a
              href="https://github.com/Inventory-Kamera/InventoryKamera"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Inventory Kamera
            </a>
            , then paste the JSON below.
          </p>
        </div>

        {/* Import form */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Textarea */}
            <div className="space-y-1.5">
              <label
                htmlFor="good-json"
                className="text-xs font-medium text-zinc-400 uppercase tracking-wide"
              >
                GOOD Format JSON
              </label>
              <textarea
                id="good-json"
                rows={14}
                value={goodJson}
                onChange={(e) => {
                  setGoodJson(e.target.value);
                  // Clear parse error when user starts editing again
                  if (parseError) setParseError(null);
                  if (mutation.isError) mutation.reset();
                }}
                disabled={mutation.isPending}
                placeholder={'{\n  "format": "GOOD",\n  "version": 2,\n  "characters": [...],\n  "weapons": [...],\n  "artifacts": [...]\n}'}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-3 text-sm text-zinc-200 placeholder-zinc-700 font-mono leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed resize-none"
              />
            </div>

            {/* Error banner — textarea is preserved after failure */}
            {errorMessage && (
              <div
                role="alert"
                className="bg-red-950/50 border border-red-800 text-red-300 text-sm px-3 py-2.5 rounded-lg"
              >
                {errorMessage}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {mutation.isPending ? "Importing…" : "Import Account"}
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
    <nav className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
      <Link
        to="/"
        className="font-semibold text-indigo-400 tracking-tight hover:text-indigo-300 transition-colors"
      >
        Project Celestia
      </Link>
      <button
        onClick={onLogout}
        className="text-sm text-zinc-500 hover:text-red-400 transition-colors"
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
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      <p className="text-zinc-400 text-xs mt-1">{label}</p>
    </div>
  );
}

export default ImportPage;
