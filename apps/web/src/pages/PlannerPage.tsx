import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback,useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import EventCard from '../components/EventCard';
import GoalForm from '../components/GoalForm';
import MaterialRow from '../components/MaterialRow';
import WeeklyBossCard from '../components/WeeklyBossCard';
import {
  createGoal,
  type CreateGoalInput,
  type DailyState,
  deleteGoal,
  type EventsResponse,
  fetchDailyState,
  fetchEvents,
  fetchGoals,
  fetchMaterialDelta,
  fetchTodayDomains,
  fetchWeeklyBosses,
  patchChecklist,
  patchEventTier,
  patchResin,
  patchWeeklyBoss,
  type UpgradeGoal,
  type WeeklyBossesResponse,
} from '../lib/api';
import { formatTimeUntilFull, MAX_RESIN,resinFullAt } from '../lib/resin';
import { goalTypeLabel,phasesToLevelRange } from '../lib/static';
import { useAuthStore } from '../stores/auth.store';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const QUERY_KEY = ['companion', 'daily'] as const;
const GOALS_KEY = ['companion', 'goals'] as const;
const MATERIALS_KEY = ['companion', 'materials'] as const;
const TODAY_KEY = ['companion', 'today'] as const;
const EVENTS_KEY = ['companion', 'events'] as const;
const WEEKLY_KEY = ['companion', 'weekly-bosses'] as const;

// -------------------------------------------------------
// Resin arc helpers
// -------------------------------------------------------
const ARC_RADIUS = 72;
const ARC_CIRCUMFERENCE = 2 * Math.PI * ARC_RADIUS;

function resinArcColor(resin: number): string {
  if (resin >= MAX_RESIN) return '#34d399'; // emerald — full
  if (resin >= 180) return '#ef4444'; // red — near cap
  if (resin >= 160) return '#f59e0b'; // amber — approaching cap
  return '#6366f1'; // indigo — normal
}

function resinDashOffset(resin: number): number {
  const fraction = Math.min(resin / MAX_RESIN, 1);
  return ARC_CIRCUMFERENCE * (1 - fraction);
}

// -------------------------------------------------------
// ResinArc — SVG circular progress indicator
// -------------------------------------------------------
function ResinArc({ resin }: { resin: number }) {
  const color = resinArcColor(resin);
  const offset = resinDashOffset(resin);
  const isFull = resin >= MAX_RESIN;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer ambient glow ring */}
      <div
        className="absolute h-48 w-48 rounded-full opacity-20 blur-2xl transition-all duration-1000"
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
          className="font-display text-5xl font-bold tabular-nums transition-colors duration-1000"
          style={{ color }}
        >
          {resin}
        </span>
        <span className="mt-1 text-sm font-medium tracking-widest text-zinc-500">
          / {MAX_RESIN}
        </span>
        {isFull && (
          <span className="mt-2 animate-pulse text-xs font-bold tracking-widest text-emerald-400">
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
  label: string;
  subLabel?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`group flex w-full items-center gap-4 rounded-xl border px-5 py-4 transition-all ${
        checked
          ? 'border-emerald-500/30 bg-emerald-500/10'
          : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.05]'
      } disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {/* Toggle pill */}
      <div
        className={`relative h-6 w-10 shrink-0 rounded-full transition-colors duration-300 ${
          checked ? 'bg-emerald-500' : 'bg-zinc-700'
        }`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all duration-300 ${
            checked ? 'left-5' : 'left-1'
          }`}
        />
      </div>

      {/* Label */}
      <div className="flex-1 text-left">
        <p
          className={`text-sm font-semibold transition-colors ${checked ? 'text-emerald-400' : 'text-zinc-300 group-hover:text-white'}`}
        >
          {label}
        </p>
        {subLabel && <p className="mt-0.5 text-xs text-zinc-600">{subLabel}</p>}
      </div>

      {/* Check icon */}
      {checked && (
        <svg
          className="h-4 w-4 shrink-0 text-emerald-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
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
  onSubmit: (amount: number) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState<string>(String(currentResin));
  const [prevResin, setPrevResin] = useState(currentResin);

  // Keep the input in sync when the server returns a new checkpoint
  if (currentResin !== prevResin) {
    setPrevResin(currentResin);
    setValue(String(currentResin));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed >= 0 && parsed <= MAX_RESIN) {
      onSubmit(parsed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex gap-2">
      <input
        type="number"
        min={0}
        max={MAX_RESIN}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label="Resin amount"
        className="focus:ring-accent-500/50 focus:border-accent-500/50 flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 font-mono text-sm text-white transition-all [appearance:textfield] focus:outline-none focus:ring-2 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="submit"
        disabled={isPending}
        className="from-accent-500 hover:from-accent-400 shadow-accent-glow/20 rounded-xl bg-gradient-to-r to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Saving…' : 'Update'}
      </button>
    </form>
  );
}

// -------------------------------------------------------
// Skeleton
// -------------------------------------------------------
function PlannerSkeleton() {
  return (
    <div className="mt-10 flex animate-pulse flex-col gap-8 lg:flex-row">
      <div className="glass-panel flex flex-1 flex-col items-center gap-6 rounded-2xl p-8">
        <div className="h-48 w-48 rounded-full bg-white/5" />
        <div className="h-4 w-32 rounded bg-white/5" />
        <div className="h-10 w-full rounded-xl bg-white/5" />
      </div>
      <div className="glass-panel flex w-full flex-col gap-4 rounded-2xl p-8 lg:w-80">
        <div className="mb-2 h-4 w-24 rounded bg-white/5" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-xl bg-white/5" />
        ))}
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Nav
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
      <div className="flex items-center gap-6">
        <Link
          to="/roster"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Roster
        </Link>
        <Link
          to="/inventory"
          className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
        >
          Inventory
        </Link>
        <button
          onClick={onLogout}
          className="hover:text-danger-400 text-sm font-medium text-zinc-500 transition-colors"
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
  const logout = useAuthStore((s) => s.logout);
  const queryClient = useQueryClient();

  // ── Tab state ─────────────────────────────────────────
  type Tab = 'daily' | 'weekly' | 'farming' | 'events';
  const [activeTab, setActiveTab] = useState<Tab>('daily');

  // ── Server state — Daily ─────────────────────────────
  const { data, isLoading, error } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: fetchDailyState,
    retry: false,
  });

  // ── Server state — Goals / Materials / Today ──────────
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: GOALS_KEY,
    queryFn: fetchGoals,
  });
  const { data: materialsData, isLoading: materialsLoading } = useQuery({
    queryKey: MATERIALS_KEY,
    queryFn: fetchMaterialDelta,
  });
  const { data: todayData, isLoading: todayLoading } = useQuery({
    queryKey: TODAY_KEY,
    queryFn: fetchTodayDomains,
  });

  // ── Server state — Events ────────────────────────────
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: EVENTS_KEY,
    queryFn: fetchEvents,
  });

  // ── Server state — Weekly Bosses ──────────────────────
  const { data: weeklyData, isLoading: weeklyLoading } = useQuery({
    queryKey: WEEKLY_KEY,
    queryFn: fetchWeeklyBosses,
  });

  // ── Live resin tick ───────────────────────────────────
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Derived resin
  const currentResin = data
    ? Math.min(
        data.resinAmount +
          Math.floor((now - new Date(data.resinUpdatedAt).getTime()) / (8 * 60 * 1000)),
        MAX_RESIN,
      )
    : 0;

  const fullAt = data ? resinFullAt(data.resinAmount, data.resinUpdatedAt) : null;
  const timeToFull = formatTimeUntilFull(fullAt);

  // ── Resin update mutation ─────────────────────────────
  const resinMutation = useMutation({
    mutationFn: patchResin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
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
    (field: 'commissionsDone' | 'teapotClaimed' | 'transformerClaimed', value: boolean) => {
      checklistMutation.mutate({ [field]: value });
    },
    [checklistMutation],
  );

  // ── Goal mutations ────────────────────────────────────
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalError, setGoalError] = useState<string | null>(null);

  const invalidateGoalQueries = () => {
    queryClient.invalidateQueries({ queryKey: GOALS_KEY });
    queryClient.invalidateQueries({ queryKey: MATERIALS_KEY });
    queryClient.invalidateQueries({ queryKey: TODAY_KEY });
  };

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      setShowGoalForm(false);
      setGoalError(null);
      invalidateGoalQueries();
    },
    onError: (err) => {
      setGoalError(err instanceof Error ? err.message : 'Failed to create goal.');
    },
  });

  // Track which goalIds are currently being deleted to prevent double-fire.
  // Using a Set rather than a single isPending flag correctly handles the case
  // where a user rapidly clicks different delete buttons.
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onMutate: (id: string) => {
      setDeletingIds((prev) => new Set(prev).add(id));
    },
    onSettled: (_data, _err, id: string) => {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onSuccess: invalidateGoalQueries,
  });

  const handleCreateGoal = useCallback(
    (input: CreateGoalInput) => {
      setGoalError(null);
      createGoalMutation.mutate(input);
    },
    [createGoalMutation],
  );

  // Sorted material delta rows (only items with remaining delta > 0 shown at top)
  const materialRows = materialsData
    ? Object.entries(materialsData.needed)
        .map(([key, needed]) => ({
          key,
          needed,
          inventory: materialsData.inventory[key] ?? 0,
          delta: materialsData.delta[key] ?? 0,
        }))
        .sort((a, b) => (b.delta > 0 ? 1 : -1) - (a.delta > 0 ? 1 : -1) || b.needed - a.needed)
    : [];

  // ── Event tier mutation (optimistic) ─────────────────────
  // Per-tier pending set: "eventKey|tierId" — same pattern as deletingIds.
  const [pendingTiers, setPendingTiers] = useState<Set<string>>(new Set());

  const eventTierMutation = useMutation({
    mutationFn: ({
      eventKey,
      tierId,
      claimed,
    }: {
      eventKey: string;
      tierId: string;
      claimed: boolean;
    }) => patchEventTier(eventKey, tierId, claimed),

    // Optimistic update: flip the tier in the cached query data immediately
    onMutate: async ({ eventKey, tierId, claimed }) => {
      const compositeKey = `${eventKey}|${tierId}`;
      setPendingTiers((prev) => new Set(prev).add(compositeKey));

      await queryClient.cancelQueries({ queryKey: EVENTS_KEY });
      const previous = queryClient.getQueryData<EventsResponse>(EVENTS_KEY);

      if (previous) {
        queryClient.setQueryData<EventsResponse>(EVENTS_KEY, {
          ...previous,
          totalUnclaimedPrimogems: previous.events.reduce((sum, e) => {
            const eClaimed =
              e.key !== eventKey
                ? e.claimedPrimogems
                : e.rewardTiers.reduce(
                    (acc, t) =>
                      acc + ((t.tierId === tierId ? claimed : t.claimed) ? t.primogems : 0),
                    0,
                  );
            return sum + (e.isActive ? e.totalPrimogems - eClaimed : 0);
          }, 0),
          events: previous.events.map((e) =>
            e.key !== eventKey
              ? e
              : {
                  ...e,
                  rewardTiers: e.rewardTiers.map((t) =>
                    t.tierId !== tierId ? t : { ...t, claimed },
                  ),
                  claimedPrimogems: e.rewardTiers.reduce(
                    (sum, t) =>
                      sum + ((t.tierId === tierId ? claimed : t.claimed) ? t.primogems : 0),
                    0,
                  ),
                },
          ),
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      // Roll back to the snapshot taken in onMutate
      if (context?.previous) {
        queryClient.setQueryData(EVENTS_KEY, context.previous);
      }
    },

    onSettled: (_data, _err, { eventKey, tierId }) => {
      const compositeKey = `${eventKey}|${tierId}`;
      setPendingTiers((prev) => {
        const next = new Set(prev);
        next.delete(compositeKey);
        return next;
      });
      // Re-fetch to get accurate server-computed totalUnclaimedPrimogems
      queryClient.invalidateQueries({ queryKey: EVENTS_KEY });
    },
  });

  const handleEventTierToggle = useCallback(
    (eventKey: string, tierId: string, claimed: boolean) => {
      const key = `${eventKey}|${tierId}`;
      if (!pendingTiers.has(key)) {
        eventTierMutation.mutate({ eventKey, tierId, claimed });
      }
    },
    [eventTierMutation, pendingTiers],
  );

  // ── Weekly boss mutation (optimistic) ────────────────────
  // Per-boss pending set — same pattern as deletingIds and pendingTiers.
  const [pendingBosses, setPendingBosses] = useState<Set<string>>(new Set());

  const weeklyBossMutation = useMutation({
    mutationFn: ({ bossKey, defeated }: { bossKey: string; defeated: boolean }) =>
      patchWeeklyBoss(bossKey, defeated),

    onMutate: async ({ bossKey, defeated }) => {
      setPendingBosses((prev) => new Set(prev).add(bossKey));

      await queryClient.cancelQueries({ queryKey: WEEKLY_KEY });
      const previous = queryClient.getQueryData<WeeklyBossesResponse>(WEEKLY_KEY);

      if (previous) {
        const updatedBosses = previous.bosses.map((b) =>
          b.key !== bossKey ? b : { ...b, defeated },
        );
        const newDefeatedCount = updatedBosses.filter((b) => b.defeated).length;
        queryClient.setQueryData<WeeklyBossesResponse>(WEEKLY_KEY, {
          ...previous,
          bosses: updatedBosses,
          defeatedCount: newDefeatedCount,
          discountedRemaining: Math.max(0, 3 - newDefeatedCount),
          nextFightCost: newDefeatedCount < 3 ? 30 : 60,
        });
      }

      return { previous };
    },

    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(WEEKLY_KEY, context.previous);
      }
    },

    onSettled: (_data, _err, { bossKey }) => {
      setPendingBosses((prev) => {
        const next = new Set(prev);
        next.delete(bossKey);
        return next;
      });
      queryClient.invalidateQueries({ queryKey: WEEKLY_KEY });
    },
  });

  const handleBossToggle = useCallback(
    (bossKey: string, defeated: boolean) => {
      if (!pendingBosses.has(bossKey)) {
        weeklyBossMutation.mutate({ bossKey, defeated });
      }
    },
    [weeklyBossMutation, pendingBosses],
  );

  // ── Render ────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      <Nav onLogout={logout} />

      {/* Ambient background */}
      <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[500px] rounded-full bg-indigo-500/5 mix-blend-screen blur-[120px]" />
      <div className="bg-accent-500/5 pointer-events-none absolute bottom-0 right-1/3 h-[300px] w-[400px] rounded-full mix-blend-screen blur-[100px]" />

      <main className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {/* Page heading */}
        <div className="animate-fade-in mb-8">
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">
            Daily Planner
          </h1>
          <p className="mt-2 text-base text-zinc-400">
            {data
              ? `Resets at 04:00 AM UTC+8 — Next reset: ${formatNextReset()}`
              : 'Loading your daily companion…'}
          </p>
        </div>

        {/* ── Tab Switcher ───────────────────────────────── */}
        <div className="animate-fade-in mb-8 flex w-fit gap-1 rounded-xl bg-white/5 p-1">
          {(['daily', 'weekly', 'farming', 'events'] as const).map((tab) => (
            <button
              key={tab}
              id={`tab-${tab}`}
              onClick={() => setActiveTab(tab)}
              className={`relative rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white/10 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {tab === 'daily' ? (
                'Daily'
              ) : tab === 'weekly' ? (
                <span className="flex items-center gap-1.5">
                  Weekly
                  {weeklyData && weeklyData.discountedRemaining > 0 && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-400">
                      {weeklyData.discountedRemaining}
                    </span>
                  )}
                </span>
              ) : tab === 'farming' ? (
                'Farming Goals'
              ) : (
                <span className="flex items-center gap-1.5">
                  Events
                  {eventsData && eventsData.totalUnclaimedPrimogems > 0 && (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-amber-400">
                      {eventsData.totalUnclaimedPrimogems}✦
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            role="alert"
            className="bg-danger-950/20 border-danger-500/30 text-danger-400 animate-fade-in mb-8 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm"
          >
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {error instanceof Error ? error.message : 'Failed to load daily companion.'}
          </div>
        )}

        {isLoading && <PlannerSkeleton />}

        {data && !isLoading && activeTab === 'daily' && (
          <div className="animate-fade-in flex flex-col gap-8 lg:flex-row">
            {/* ── Left: Resin tracker ─────────────────────────── */}
            <div className="glass-panel flex flex-1 flex-col items-center rounded-2xl p-8">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                Original Resin
              </h2>

              <ResinArc resin={currentResin} />

              {/* Time to full */}
              <div className="mt-6 text-center">
                {currentResin >= MAX_RESIN ? (
                  <p className="animate-pulse text-sm font-semibold text-emerald-400">
                    Resin is full — spend it!
                  </p>
                ) : (
                  <p className="text-sm text-zinc-400">
                    Full in{' '}
                    <span className="font-display font-semibold text-white">{timeToFull}</span>
                  </p>
                )}
              </div>

              {/* Near-cap warning */}
              {currentResin >= 180 && currentResin < MAX_RESIN && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Approaching cap — consider spending resin
                </div>
              )}

              {/* Divider */}
              <div className="mt-6 w-full border-t border-white/5" />

              {/* Manual update form */}
              <div className="mt-4 w-full">
                <p className="mb-1 text-xs text-zinc-500">Update current resin</p>
                <ResinUpdateForm
                  currentResin={currentResin}
                  onSubmit={(amount) => resinMutation.mutate(amount)}
                  isPending={resinMutation.isPending}
                />
                {resinMutation.isError && (
                  <p className="text-danger-400 mt-2 text-xs">
                    {resinMutation.error instanceof Error
                      ? resinMutation.error.message
                      : 'Failed to update resin.'}
                  </p>
                )}
              </div>
            </div>

            {/* ── Right: Daily checklist ───────────────────────── */}
            <div className="glass-panel flex w-full flex-col rounded-2xl p-8 lg:w-80">
              <h2 className="mb-6 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                Daily Checklist
              </h2>

              <div className="flex flex-1 flex-col gap-3">
                <ChecklistToggle
                  label="Daily Commissions"
                  subLabel="4 / 4 completed"
                  checked={data.commissionsDone}
                  onChange={(v) => handleToggle('commissionsDone', v)}
                  disabled={checklistMutation.isPending}
                />
                <ChecklistToggle
                  label="Teapot Currency"
                  subLabel="Serenitea Pot overflow"
                  checked={data.teapotClaimed}
                  onChange={(v) => handleToggle('teapotClaimed', v)}
                  disabled={checklistMutation.isPending}
                />
                <ChecklistToggle
                  label="Parametric Transformer"
                  subLabel="Weekly cooldown"
                  checked={data.transformerClaimed}
                  onChange={(v) => handleToggle('transformerClaimed', v)}
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
                      <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="text-zinc-500">Daily progress</span>
                        <span
                          className={allDone ? 'font-semibold text-emerald-400' : 'text-zinc-400'}
                        >
                          {done} / {total}
                        </span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-emerald-400' : 'bg-accent-500'}`}
                          style={{ width: `${(done / total) * 100}%` }}
                        />
                      </div>
                      {allDone && (
                        <p className="animate-fade-in mt-3 text-xs font-semibold text-emerald-400">
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

        {/* ── Farming Goals Tab ─────────────────────────── */}
        {activeTab === 'farming' && (
          <div className="animate-fade-in flex flex-col gap-8">
            {/* Top row: Goals list + Today's Domains */}
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Goals List */}
              <div className="glass-panel flex-1 rounded-2xl p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
                    Your Goals
                  </h2>
                  {!showGoalForm && (
                    <button
                      id="btn-add-goal"
                      onClick={() => setShowGoalForm(true)}
                      className="bg-accent-500/10 border-accent-500/30 text-accent-400 hover:bg-accent-500/20 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all"
                    >
                      + Add Goal
                    </button>
                  )}
                </div>

                {showGoalForm && (
                  <>
                    {goalError && (
                      <p className="text-danger-400 bg-danger-950/20 border-danger-500/30 mb-3 rounded-lg border px-3 py-2 text-xs">
                        {goalError}
                      </p>
                    )}
                    <GoalForm
                      onSubmit={handleCreateGoal}
                      isPending={createGoalMutation.isPending}
                      onCancel={() => {
                        setShowGoalForm(false);
                        setGoalError(null);
                      }}
                    />
                  </>
                )}

                {goalsLoading && (
                  <div className="mt-4 flex flex-col gap-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="h-14 rounded-xl bg-white/5" />
                    ))}
                  </div>
                )}

                {!goalsLoading && goals.length === 0 && !showGoalForm && (
                  <div className="py-10 text-center text-zinc-600">
                    <p className="text-sm">No goals yet.</p>
                    <p className="mt-1 text-xs">
                      Add a goal to start tracking your farming progress.
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2">
                  {(goals as UpgradeGoal[]).map((goal) => (
                    <div
                      key={goal.id}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-white">{goal.targetKey}</p>
                        <p className="mt-0.5 text-xs text-zinc-500">
                          {goalTypeLabel(goal.goalType, goal.talentType)}
                          {' · '}
                          {phasesToLevelRange(goal.fromPhase, goal.toPhase)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (!deletingIds.has(goal.id)) {
                            deleteGoalMutation.mutate(goal.id);
                          }
                        }}
                        disabled={deletingIds.has(goal.id)}
                        className="hover:text-danger-400 text-xs font-medium text-zinc-600 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${goal.targetKey} goal`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Domains */}
              <div className="glass-panel flex w-full flex-col rounded-2xl p-6 lg:w-72">
                <h2 className="mb-1 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                  Today
                </h2>
                <p className="mb-5 text-xs text-zinc-600">
                  {todayData ? `${todayData.serverDay} · Asia server` : 'Asia server'}
                </p>

                {todayLoading && (
                  <div className="flex flex-col gap-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 rounded-xl bg-white/5" />
                    ))}
                  </div>
                )}

                {!todayLoading && todayData && (
                  <div className="flex flex-1 flex-col gap-3">
                    {todayData.domains.map((domain) => (
                      <div
                        key={`${domain.domainKey}-${domain.drops.join(',')}`}
                        className={`rounded-xl border px-4 py-3 transition-all ${
                          domain.relevantToGoals
                            ? 'border-accent-500/30 bg-accent-500/5'
                            : 'border-white/5 bg-white/[0.02] opacity-50'
                        }`}
                      >
                        <p className="text-sm font-semibold leading-tight text-white">
                          {domain.name}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{domain.location}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {domain.drops.map((drop) => (
                            <span
                              key={drop}
                              className="rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-zinc-400"
                            >
                              {drop}
                            </span>
                          ))}
                        </div>
                        {domain.relevantToGoals && (
                          <p className="text-accent-400 mt-2 text-[10px] font-semibold">
                            ✦ Needed for your goals
                          </p>
                        )}
                      </div>
                    ))}
                    {todayData.domains.filter((d) => d.relevantToGoals).length === 0 && (
                      <p className="py-4 text-center text-sm text-zinc-600">
                        Nothing farmable today matches your current goals.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Materials Delta Table */}
            {materialsLoading && (
              <div className="glass-panel rounded-2xl p-6">
                <div className="mb-6 h-4 w-40 rounded bg-white/5" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mb-3 h-12 rounded-xl bg-white/5" />
                ))}
              </div>
            )}

            {!materialsLoading && materialRows.length > 0 && (
              <div className="glass-panel rounded-2xl p-6">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                  Materials Still Needed
                </h2>
                <div>
                  {materialRows.map(({ key, needed, inventory, delta }) => (
                    <MaterialRow
                      key={key}
                      itemKey={key}
                      needed={needed}
                      inventory={inventory}
                      delta={delta}
                    />
                  ))}
                </div>
              </div>
            )}

            {!materialsLoading && goals.length > 0 && materialRows.length === 0 && (
              <div className="glass-panel rounded-2xl p-8 text-center">
                <p className="font-semibold text-emerald-400">✓ All materials collected!</p>
                <p className="mt-1 text-sm text-zinc-500">
                  You have everything needed for your current goals.
                </p>
              </div>
            )}

            {!materialsLoading && goals.length === 0 && (
              <div className="glass-panel rounded-2xl p-8 text-center text-zinc-600">
                <p className="text-sm">Add a goal above to see the materials you need.</p>
              </div>
            )}
          </div>
        )}
        {/* ── Weekly Tab ─────────────────────────────── */}
        {activeTab === 'weekly' && (
          <div className="animate-fade-in flex flex-col gap-5">
            {/* Summary bar */}
            {weeklyData && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
                {weeklyData.defeatedCount === weeklyData.bosses.length &&
                weeklyData.bosses.length > 0 ? (
                  <span className="text-sm font-bold text-emerald-400">
                    ✓ All bosses cleared this week!
                  </span>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-zinc-300">
                      {weeklyData.defeatedCount} / 3 discounted fights used
                    </span>
                    <span className="text-zinc-600">·</span>
                    <span
                      className={`text-sm font-semibold ${
                        weeklyData.discountedRemaining > 0 ? 'text-amber-400' : 'text-zinc-400'
                      }`}
                    >
                      Next fight costs {weeklyData.nextFightCost} Resin
                    </span>
                  </>
                )}
                <span className="text-zinc-600">·</span>
                <span className="text-sm text-zinc-500">
                  Resets in {formatWeeklyReset(weeklyData.nextResetAt)}
                </span>
              </div>
            )}

            {weeklyLoading && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="glass-panel h-36 animate-pulse rounded-2xl bg-white/[0.02] p-5"
                  />
                ))}
              </div>
            )}

            {weeklyData && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {weeklyData.bosses.map((boss) => (
                  <WeeklyBossCard
                    key={boss.key}
                    boss={boss}
                    isPending={pendingBosses.has(boss.key)}
                    onToggle={handleBossToggle}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Events Tab ─────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="animate-fade-in flex flex-col gap-5">
            {/* Summary chip */}
            {eventsData && (
              <div className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3">
                <span className="text-base font-bold text-amber-400">
                  {eventsData.totalUnclaimedPrimogems > 0
                    ? `${eventsData.totalUnclaimedPrimogems}✦ unclaimed`
                    : 'All Primogems collected ✓'}
                </span>
                <span className="text-sm text-zinc-600">·</span>
                <span className="text-sm text-zinc-500">Patch {eventsData.patch}</span>
              </div>
            )}

            {eventsLoading && (
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="glass-panel h-48 animate-pulse rounded-2xl bg-white/[0.02] p-5"
                  />
                ))}
              </div>
            )}

            {eventsData && eventsData.events.length === 0 && (
              <div className="glass-panel rounded-2xl p-10 text-center text-zinc-600">
                <p className="text-sm">No active events right now.</p>
                <p className="mt-1 text-xs">
                  Update <code className="text-zinc-500">events.json</code> for the current patch to
                  populate this tab.
                </p>
              </div>
            )}

            {eventsData &&
              eventsData.events.map((event) => (
                <EventCard
                  key={event.key}
                  event={event}
                  pendingTiers={pendingTiers}
                  onToggle={handleEventTierToggle}
                />
              ))}
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
  const now = new Date();
  const boundary = new Date(now);
  boundary.setUTCHours(20, 0, 0, 0);
  if (now >= boundary) {
    boundary.setUTCDate(boundary.getUTCDate() + 1);
  }

  const diffMs = boundary.getTime() - now.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${hours}h ${minutes}m`;
}

// -------------------------------------------------------
// Helper: time until the weekly boss reset (Sunday 20:00 UTC)
// Accepts the ISO string returned by the backend's nextResetAt field.
// Formats as "Xd Yh" (e.g. "4d 3h") so it fits the summary bar.
// -------------------------------------------------------
function formatWeeklyReset(isoString: string): string {
  const now = Date.now();
  const resetMs = new Date(isoString).getTime();
  const diffMs = Math.max(0, resetMs - now);

  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  return `${hours}h ${minutes}m`;
}
