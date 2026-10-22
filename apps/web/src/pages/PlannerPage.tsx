import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { AccessibleTabs, TabPanel } from '../components/AccessibleTabs';
import EventCard from '../components/EventCard';
import FarmingPanel from '../components/FarmingPanel';
import GoalManager from '../components/GoalManager';
import MaterialRow from '../components/MaterialRow';
import RoutinePanel from '../components/RoutinePanel';
import TeamBuilder from '../components/TeamBuilder';
import WishSavingsPlanner from '../components/WishSavingsPlanner';
import { assertCurrentSession, captureSession, isCurrentSession } from '../lib/account-session';
import {
  type EventsResponse,
  fetchEvents,
  fetchGoals,
  fetchMaterialDelta,
  patchEventTier,
} from '../lib/api';
import { progressionCoverage } from '../lib/catalog';

// -------------------------------------------------------
// Constants
// -------------------------------------------------------
const GOALS_KEY = ['companion', 'goals'] as const;
const MATERIALS_KEY = ['companion', 'materials'] as const;
const EVENTS_KEY = ['companion', 'events'] as const;

// -------------------------------------------------------
// Nav
// -------------------------------------------------------

// -------------------------------------------------------
// PlannerPage — main export
// -------------------------------------------------------
export default function PlannerPage() {
  const queryClient = useQueryClient();
  const [session] = useState(captureSession);

  // ── Tab state ─────────────────────────────────────────
  type Tab = 'daily' | 'weekly' | 'farming' | 'teams' | 'savings' | 'events';
  const [params, setParams] = useSearchParams();
  const rawTab = params.get('tab');
  const activeTab: Tab =
    rawTab === 'weekly' ||
    rawTab === 'farming' ||
    rawTab === 'teams' ||
    rawTab === 'savings' ||
    rawTab === 'events'
      ? rawTab
      : 'daily';
  const setActiveTab = (tab: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', tab);
    setParams(next);
  };

  // ── Server state — Goals / Materials / Today ──────────
  const { data: goals = [] } = useQuery({
    queryKey: GOALS_KEY,
    queryFn: ({ signal }) => fetchGoals(signal),
  });
  const {
    data: materialsData,
    isLoading: materialsLoading,
    error: materialsError,
    refetch: refreshMaterials,
    isFetching: materialsFetching,
  } = useQuery({
    queryKey: MATERIALS_KEY,
    queryFn: ({ signal }) => fetchMaterialDelta(signal),
    retry: false,
  });
  // ── Server state — Events ────────────────────────────
  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refreshEvents,
    isFetching: eventsFetching,
  } = useQuery({
    queryKey: EVENTS_KEY,
    queryFn: ({ signal }) => fetchEvents(signal),
    retry: false,
  });

  // Sorted material delta rows (only items with remaining delta > 0 shown at top)
  const materialRows = materialsData
    ? Object.entries(materialsData.needed)
        .map(([key, needed]) => ({
          key,
          needed,
          inventory: materialsData.inventory[key] ?? null,
          delta: materialsData.delta[key] ?? null,
        }))
        .sort(
          (a, b) =>
            ((b.delta ?? 0) > 0 ? 1 : -1) - ((a.delta ?? 0) > 0 ? 1 : -1) || b.needed - a.needed,
        )
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
    }) => patchEventTier(eventKey, tierId, claimed, session),
    retry: false,
    networkMode: 'always',

    // Optimistic update: flip the tier in the cached query data immediately
    onMutate: async ({ eventKey, tierId, claimed }) => {
      assertCurrentSession(session);
      const compositeKey = `${eventKey}|${tierId}`;
      setPendingTiers((prev) => new Set(prev).add(compositeKey));

      await queryClient.cancelQueries({ queryKey: EVENTS_KEY });
      assertCurrentSession(session);
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
      if (!isCurrentSession(session)) return;
      // Roll back to the snapshot taken in onMutate
      if (context?.previous) {
        queryClient.setQueryData(EVENTS_KEY, context.previous);
      }
    },

    onSettled: (_data, _err, { eventKey, tierId }) => {
      if (!isCurrentSession(session)) return;
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

  // ── Render ────────────────────────────────────────────
  return (
    <div className="relative min-h-screen overflow-hidden text-zinc-300">
      {/* Ambient background */}
      <div className="pointer-events-none absolute left-1/3 top-0 h-[400px] w-[500px] rounded-full bg-indigo-500/5 mix-blend-screen blur-[120px]" />
      <div className="bg-accent-500/5 pointer-events-none absolute bottom-0 right-1/3 h-[300px] w-[400px] rounded-full mix-blend-screen blur-[100px]" />

      <main
        id="companion-content"
        tabIndex={-1}
        className="relative z-10 mx-auto max-w-5xl px-6 py-12"
      >
        {/* Page heading */}
        <div className="animate-fade-in mb-8">
          <p className="eyebrow">MAKE ROOM FOR PROGRESS</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-white">Planner</h1>
          <p className="mt-2 text-base text-zinc-400">
            Plan your routine, build teams, and budget your next wishes.
          </p>
        </div>

        {/* ── Tab Switcher ───────────────────────────────── */}
        <AccessibleTabs
          label="Planner sections"
          prefix="planner"
          active={activeTab}
          onChange={setActiveTab}
          tabs={[
            { id: 'daily', label: 'Daily' },
            { id: 'farming', label: 'Farming' },
            { id: 'teams', label: 'Teams' },
            { id: 'savings', label: 'Wish Savings' },
            {
              id: 'events',
              label: (
                <span>
                  Events
                  {eventsData && eventsData.totalUnclaimedPrimogems > 0 ? (
                    <span className="ml-2 text-amber-300">
                      {eventsData.totalUnclaimedPrimogems}✦
                    </span>
                  ) : null}
                </span>
              ),
            },
            { id: 'weekly', label: 'Weekly Bosses' },
          ]}
        />
        <TabPanel prefix="planner" id="daily" active={activeTab}>
          <RoutinePanel view="daily" />
        </TabPanel>
        <TabPanel prefix="planner" id="weekly" active={activeTab}>
          <RoutinePanel view="weekly" />
        </TabPanel>
        <TabPanel prefix="planner" id="teams" active={activeTab}>
          <TeamBuilder />
        </TabPanel>
        <TabPanel prefix="planner" id="savings" active={activeTab}>
          <WishSavingsPlanner />
        </TabPanel>

        {/* ── Farming Goals Tab ─────────────────────────── */}
        <TabPanel prefix="planner" id="farming" active={activeTab}>
          <div className="animate-fade-in flex flex-col gap-8">
            <p className="text-sm text-zinc-400">
              Set your targets and see the materials you need. Ascension costs cover{' '}
              {progressionCoverage.characters} characters and {progressionCoverage.weapons} weapons;{' '}
              {progressionCoverage.talents} characters have base talent costs through level 10. No
              import required to plan.
            </p>
            <button
              className="self-start rounded-lg border border-white/20 px-3 py-2 text-sm"
              disabled={materialsFetching}
              onClick={() => {
                void refreshMaterials();
                void queryClient.invalidateQueries({ queryKey: ['companion', 'farming'] });
              }}
            >
              Refresh material advice
            </button>
            <FarmingPanel />
            <GoalManager />

            {materialsError && (
              <p role="alert" className="text-amber-300">
                {materialsError.message}{' '}
                {materialsData && 'Last confirmed material totals remain below; refresh failed.'}
              </p>
            )}
            {materialsData && (
              <div className="companion-info-card min-w-0 rounded-2xl p-5 text-sm text-zinc-400">
                <p>
                  {materialsData.neededComplete
                    ? 'Declared-range costs for active supported goals'
                    : 'Partial costs — unavailable goals are excluded from totals.'}
                </p>
                <p className="mt-2">
                  Costs use your declared from → target range; re-import does not measure a new
                  remaining-upgrade cost. Stock is recorded from imports; it is not live inventory.
                  No inventory entry is required: planning counts the full requirement for
                  unrecorded items, then credits recorded stock and 3:1 crafting from surplus lower
                  tiers. Missing stock observations remain unknown.
                </p>
                <p className="mt-1">
                  Import basis: {materialsData.stockBasis.source ?? 'source unknown'} ·{' '}
                  {materialsData.stockBasis.importedAt
                    ? new Date(materialsData.stockBasis.importedAt).toLocaleString()
                    : 'receipt time unknown'}
                  .
                </p>
              </div>
            )}
            {/* Materials Delta Table */}
            {materialsLoading && (
              <div className="companion-info-card min-w-0 rounded-2xl p-6">
                <div className="mb-6 h-4 w-40 rounded bg-white/5" />
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="mb-3 h-12 rounded-xl bg-white/5" />
                ))}
              </div>
            )}

            {!materialsLoading && materialRows.length > 0 && (
              <div className="companion-info-card min-w-0 rounded-2xl p-6">
                <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-zinc-500">
                  Upgrade Cost Totals
                </h2>
                <div>
                  {materialRows.map(({ key, needed, inventory, delta }) => (
                    <MaterialRow
                      key={key}
                      itemKey={key}
                      needed={needed}
                      inventory={inventory}
                      delta={delta}
                      planningDelta={materialsData?.planningDelta?.[key]}
                    />
                  ))}
                </div>
              </div>
            )}

            {!materialsLoading &&
              !materialsError &&
              goals.some((goal) => goal.status === 'active') &&
              materialRows.length === 0 && (
                <div className="companion-info-card min-w-0 rounded-2xl p-8 text-center">
                  <p className="font-semibold text-amber-300">Material advice unavailable</p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Your goals are preserved. No supported cost totals are available for these
                    upgrades.
                  </p>
                </div>
              )}

            {!materialsLoading && !materialsError && goals.length === 0 && (
              <div className="companion-info-card min-w-0 rounded-2xl p-8 text-center text-zinc-600">
                <p className="text-sm">Add a goal above to see the materials you need.</p>
              </div>
            )}
          </div>
        </TabPanel>
        {/* ── Events Tab ─────────────────────────────── */}
        <TabPanel prefix="planner" id="events" active={activeTab}>
          <div className="animate-fade-in flex flex-col gap-5">
            <button
              className="self-start rounded-lg border border-white/20 px-3 py-2 text-sm"
              disabled={eventsFetching}
              onClick={() => void refreshEvents()}
            >
              Refresh events
            </button>
            {/* Summary chip */}
            {eventsData?.availability.available && !eventsError && (
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

            {eventsData && !eventsError && eventsData.events.length === 0 && (
              <div className="companion-info-card min-w-0 rounded-2xl p-10 text-center text-zinc-600">
                <p className="text-sm">Current event advice unavailable.</p>
                <p className="mt-1 text-xs">
                  {eventsData.availability.reason ?? 'No verified current events are available.'}
                </p>
              </div>
            )}

            {eventsError && (
              <p role="alert" className="text-amber-300">
                {eventsError.message}
              </p>
            )}
            {eventsData &&
              !eventsError &&
              eventsData.events.map((event) => (
                <EventCard
                  key={event.key}
                  event={event}
                  pendingTiers={pendingTiers}
                  onToggle={handleEventTierToggle}
                />
              ))}
          </div>
        </TabPanel>
      </main>
    </div>
  );
}
