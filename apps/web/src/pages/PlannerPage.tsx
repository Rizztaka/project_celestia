import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "../stores/auth.store";
import {
  fetchDailyState,
  patchResin,
  patchChecklist,
  type DailyState,
} from "../lib/api";
import {
  resinFullAt,
  formatTimeUntilFull,
  MAX_RESIN,
} from "../lib/resin";

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const QUERY_KEY = ["companion", "daily"] as const;

// -------------------------------------------------------
// Resin arc helpers
// -------------------------------------------------------
const ARC_RADIUS = 72;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

function resinArcColor(resin: number): string {
  if (resin >= MAX_RESIN) return "#34d399"; // emerald — full
  if (resin >= 180)       return "#ef4444"; // red — near cap
  if (resin >= 160)       return "#f59e0b"; // amber — approaching cap
  return "#6366f1";                          // indigo — normal
}

function resinDashOffset(resin: number): number {
  const fraction = Math.min(resin / MAX_RESIN, 1);
  return ARC_CIRCUMFERENCE * (1 - fraction);
}

// -------------------------------------------------------
// ResinArc — SVG circular progress indicator
// -------------------------------------------------------
function ResinArc({ resin }: { resin: number }) {
  const color  = resinArcColor(resin);
  const offset = resinDashOffset(resin);
  const isFull = resin >= MAX_RESIN;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow ring */}
      <div
        className="absolute w-48 h-48 rounded-full blur-2xl opacity-20 transition-all duration-1000"
        style={{ background: color }}
      />

      <svg
        width="192"
        height="192"
        viewBox="0 0 192 192"
        className="-rotate-90"
        aria-label={`${resin} out of ${MAX_RESIN} resin`}
      >
        {/* Track */}
        <circle
          cx="96"
          cy="96"
          r={ARC_RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="10"
        />
        {/* Progress arc */}
        <circle
          cx="96"
          cy="96"
          r={ARC_RADIUS}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={ARC_CIRCUMFERENCE}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>

      {/* Centre content */}
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-5xl font-display font-bold tabular-nums transition-colors duration-1000"
          style={{ color }}
        >
          {resin}
        </span>
        <span className="text-zinc-500 text-sm font-medium tracking-widest mt-1">
          / {MAX_RESIN}
        </span>
        {isFull && (
          <span className="mt-2 text-emerald-400 text-xs font-bold animate-pulse tracking-widest">
            ● FULL
          </span>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// ChecklistToggle
// -------------------------------------------------------
function ChecklistToggle({
  label,
  subLabel,
  checked,
  onChange,
  disabled,
}: {
  label:    string;
  subLabel?: string;
  checked:  boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl border transition-all group ${
        checked
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {/* Toggle pill */}
      <div
        className={`w-10 h-6 rounded-full shrink-0 relative transition-colors duration-300 ${
          checked ? "bg-emerald-500" : "bg-zinc-700"
        }`}
      >
        <div
          className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-300 ${
            checked ? "left-5" : "left-1"
          }`}
        />
      </div>

      {/* Label */}
      <div className="text-left flex-1">
        <p className={`text-sm font-semibold transition-colors ${checked ? "text-emerald-400" : "text-zinc-300 group-hover:text-white"}`}>
          {label}
        </p>
        {subLabel && (
          <p className="text-xs text-zinc-600 mt-0.5">{subLabel}</p>
        )}
      </div>

      {/* Check icon */}
      {checked && (
        <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

// -------------------------------------------------------
// ResinUpdateForm
// -------------------------------------------------------
function ResinUpdateForm({
  currentResin,
  onSubmit,
  isPending,
}: {
  currentResin: number;
  onSubmit:     (amount: number) => void;
  isPending:    boolean;
}) {
  const [value, setValue] = useState<string>(String(currentResin));

  // Keep the input in sync when the server returns a new checkpoint
  useEffect(() => {
    setValue(String(currentResin));
  }, [currentResin]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= MAX_RESIN) {
      onSubmit(parsed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mt-6">
      <input
        type="number"
        min={0}
        max={MAX_RESIN}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Resin amount"
        className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500/50 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="bg-gradient-to-r from-accent-500 to-indigo-600 hover:from-accent-400 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-accent-glow/20"
      >
        {isPending ? "Saving…" : "Update"}
      </button>
    </form>
  );
}

// -------------------------------------------------------
// Skeleton
// -------------------------------------------------------
function PlannerSkeleton() {
  return (
    <div className="mt-10 flex flex-col lg:flex-row gap-8 animate-pulse">
      <div className="glass-panel rounded-2xl p-8 flex-1 flex flex-col items-center gap-6">
        <div className="w-48 h-48 rounded-full bg-white/5" />
        <div className="w-32 h-4 bg-white/5 rounded" />
        <div className="w-full h-10 bg-white/5 rounded-xl" />
      </div>
      <div className="glass-panel rounded-2xl p-8 w-full lg:w-80 flex flex-col gap-4">
        <div className="w-24 h-4 bg-white/5 rounded mb-2" />
        {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-white/5 rounded-xl" />)}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Nav
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
      <div className="flex items-center gap-6">
        <Link to="/roster"    className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Roster</Link>
        <Link to="/inventory" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Inventory</Link>
        <button
          onClick={onLogout}
          className="text-sm font-medium text-zinc-500 hover:text-danger-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

// -------------------------------------------------------
// PlannerPage — main export
// -------------------------------------------------------
export default function PlannerPage() {
  const logout      = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  // ── Server state ─────────────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn:  fetchDailyState,
    retry:    false,
  });

  // ── Live resin tick ───────────────────────────────────
  // Re-compute current resin every second via a local state variable.
  // This drives the arc and countdown without polling the server.
  const [now, setNow] = useState(Date.now());
  const intervalRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Derived resin (uses `now` so it updates every second)
  const currentResin = data
    ? Math.min(
        data.resinAmount + Math.floor((now - new Date(data.resinUpdatedAt).getTime()) / (8 * 60 * 1000)),
        MAX_RESIN,
      )
    : 0;

  const fullAt     = data ? resinFullAt(data.resinAmount, data.resinUpdatedAt) : null;
  const timeToFull = formatTimeUntilFull(fullAt);

  // ── Resin update mutation ─────────────────────────────
  const resinMutation = useMutation({
    mutationFn: patchResin,
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  // ── Checklist mutation (optimistic) ──────────────────
  const checklistMutation = useMutation({
    mutationFn: patchChecklist,
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEY });
      const previous = queryClient.getQueryData<DailyState>(QUERY_KEY);
      if (previous) {
        queryClient.setQueryData<DailyState>(QUERY_KEY, { ...previous, ...input });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(QUERY_KEY, context.previous);
      }
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  const handleToggle = useCallback(
    (field: "commissionsDone" | "teapotClaimed" | "transformerClaimed", value: boolean) => {
      checklistMutation.mutate({ [field]: value });
    },
    [checklistMutation],
  );

  // ── Render ────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Ambient background */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
      <div className="absolute bottom-0 right-1/3 w-[400px] h-[300px] bg-accent-500/5 rounded-full blur-[100px] mix-blend-screen pointer-events-none" />

      <main className="max-w-5xl mx-auto px-6 py-12 relative z-10">
        {/* Page heading */}
        <div className="mb-10 animate-fade-in">
          <h1 className="text-4xl font-display font-bold tracking-tight text-white">
            Daily Planner
          </h1>
          <p className="text-zinc-400 mt-2 text-base">
            {data
              ? `Resets at 04:00 AM UTC+8 — Next reset: ${formatNextReset()}`
              : "Loading your daily companion…"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="bg-danger-950/20 border border-danger-500/30 text-danger-400 text-sm px-4 py-3 rounded-xl animate-fade-in flex items-start gap-2 mb-8">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {error instanceof Error ? error.message : "Failed to load daily companion."}
          </div>
        )}

        {isLoading && <PlannerSkeleton />}

        {data && !isLoading && (
          <div className="flex flex-col lg:flex-row gap-8 animate-fade-in">
            {/* ── Left: Resin tracker ─────────────────────────── */}
            <div className="glass-panel rounded-2xl p-8 flex-1 flex flex-col items-center">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">
                Original Resin
              </h2>

              <ResinArc resin={currentResin} />

              {/* Time to full */}
              <div className="mt-6 text-center">
                {currentResin >= MAX_RESIN ? (
                  <p className="text-emerald-400 font-semibold text-sm animate-pulse">
                    Resin is full — spend it!
                  </p>
                ) : (
                  <p className="text-zinc-400 text-sm">
                    Full in{" "}
                    <span className="text-white font-semibold font-display">
                      {timeToFull}
                    </span>
                  </p>
                )}
              </div>

              {/* Near-cap warning */}
              {currentResin >= 180 && currentResin < MAX_RESIN && (
                <div className="mt-4 flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Approaching cap — consider spending resin
                </div>
              )}

              {/* Divider */}
              <div className="w-full border-t border-white/5 mt-6" />

              {/* Manual update form */}
              <div className="w-full mt-4">
                <p className="text-xs text-zinc-500 mb-1">Update current resin</p>
                <ResinUpdateForm
                  currentResin={currentResin}
                  onSubmit={(amount) => resinMutation.mutate(amount)}
                  isPending={resinMutation.isPending}
                />
                {resinMutation.isError && (
                  <p className="text-danger-400 text-xs mt-2">
                    {resinMutation.error instanceof Error
                      ? resinMutation.error.message
                      : "Failed to update resin."}
                  </p>
                )}
              </div>
            </div>

            {/* ── Right: Daily checklist ───────────────────────── */}
            <div className="glass-panel rounded-2xl p-8 w-full lg:w-80 flex flex-col">
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-widest mb-6">
                Daily Checklist
              </h2>

              <div className="flex flex-col gap-3 flex-1">
                <ChecklistToggle
                  label="Daily Commissions"
                  subLabel="4 / 4 completed"
                  checked={data.commissionsDone}
                  onChange={(v) => handleToggle("commissionsDone", v)}
                  disabled={checklistMutation.isPending}
                />
                <ChecklistToggle
                  label="Teapot Currency"
                  subLabel="Serenitea Pot overflow"
                  checked={data.teapotClaimed}
                  onChange={(v) => handleToggle("teapotClaimed", v)}
                  disabled={checklistMutation.isPending}
                />
                <ChecklistToggle
                  label="Parametric Transformer"
                  subLabel="Weekly cooldown"
                  checked={data.transformerClaimed}
                  onChange={(v) => handleToggle("transformerClaimed", v)}
                  disabled={checklistMutation.isPending}
                />
              </div>

              {/* Progress summary */}
              <div className="mt-6 border-t border-white/5 pt-5">
                {(() => {
                  const done = [
                    data.commissionsDone,
                    data.teapotClaimed,
                    data.transformerClaimed,
                  ].filter(Boolean).length;
                  const total = 3;
                  const allDone = done === total;
                  return (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-zinc-500">Daily progress</span>
                        <span className={allDone ? "text-emerald-400 font-semibold" : "text-zinc-400"}>
                          {done} / {total}
                        </span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-emerald-400" : "bg-accent-500"}`}
                          style={{ width: `${(done / total) * 100}%` }}
                        />
                      </div>
                      {allDone && (
                        <p className="text-emerald-400 text-xs font-semibold mt-3 animate-fade-in">
                          ✓ All daily tasks complete!
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// -------------------------------------------------------
// Helper: next 20:00 UTC reset timestamp (Asia server)
// -------------------------------------------------------
function formatNextReset(): string {
  const now      = new Date();
  const boundary = new Date(now);
  boundary.setUTCHours(20, 0, 0, 0);
  if (now >= boundary) {
    boundary.setUTCDate(boundary.getUTCDate() + 1);
  }

  const diffMs  = boundary.getTime() - now.getTime();
  const hours   = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}
