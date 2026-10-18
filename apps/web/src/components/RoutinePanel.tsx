import {
  isSupportedServerId,
  type PlanRoutineKind,
  SERVER_POLICIES,
  SUPPORTED_SERVER_IDS,
} from '@celestia/api-contracts';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { captureSession, isCurrentSession } from '../lib/account-session';
import { fetchRoutine, patchRoutine, type RoutineCommand } from '../lib/api';
import { formatRemaining, projectResin } from '../lib/resin';
import {
  newestRoutine,
  type ReceivedRoutine,
  routineExpired,
  routineNow,
} from '../lib/routine-state';

const KEY = ['companion', 'routine', 2] as const;
const SAVE_KEY = ['companion', 'routine-save'] as const;
const button =
  'rounded-lg bg-indigo-500/20 px-4 py-2 text-sm text-indigo-100 hover:bg-indigo-500/30 disabled:cursor-not-allowed disabled:opacity-40';
const input = 'rounded-lg border border-white/15 bg-zinc-900 px-3 py-2 text-white';

export default function RoutinePanel({
  view,
  enabledKinds,
}: {
  view: 'daily' | 'weekly';
  enabledKinds?: PlanRoutineKind[];
}) {
  const client = useQueryClient();
  const [session] = useState(captureSession);
  const [tick, setTick] = useState(() => performance.now());
  const [online, setOnline] = useState(() => navigator.onLine);
  const saving = useIsMutating({ mutationKey: SAVE_KEY }) > 0;
  const saveLock = useRef(false);
  const saveFocus = useRef<HTMLElement | null>(null);
  const refreshButton = useRef<HTMLButtonElement>(null);
  const query = useQuery({
    queryKey: KEY,
    queryFn: async ({ signal }): Promise<ReceivedRoutine> => ({
      snapshot: await fetchRoutine(signal),
      receivedAt: performance.now(),
    }),
    structuralSharing: (old, next) =>
      newestRoutine(old as ReceivedRoutine | undefined, next as ReceivedRoutine),
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
  const mutation = useMutation({
    mutationKey: SAVE_KEY,
    mutationFn: (command: RoutineCommand) => patchRoutine(command, session),
    retry: false,
    // Never queue offline writes with yesterday's revision or period.
    networkMode: 'always',
    onMutate: () => client.cancelQueries({ queryKey: KEY }),
    onSuccess: (snapshot) => {
      if (!isCurrentSession(session)) return;
      client.setQueryData<ReceivedRoutine>(KEY, (old) =>
        newestRoutine(old, { snapshot, receivedAt: performance.now() }),
      );
    },
    onSettled: async () => {
      if (!isCurrentSession(session)) return;
      await Promise.all([
        client.invalidateQueries({ queryKey: KEY }),
        client.invalidateQueries({ queryKey: ['companion', 'today'] }),
        client.invalidateQueries({ queryKey: ['companion', 'plan'] }),
        client.invalidateQueries({ queryKey: ['intelligence', 'planner'] }),
      ]);
      saveLock.current = false;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => setTick(performance.now()), 1000);
    const onNetwork = () => setOnline(navigator.onLine);
    const onResume = () => {
      if (document.visibilityState === 'visible') void client.invalidateQueries({ queryKey: KEY });
    };
    window.addEventListener('online', onNetwork);
    window.addEventListener('offline', onNetwork);
    window.addEventListener('focus', onResume);
    document.addEventListener('visibilitychange', onResume);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', onNetwork);
      window.removeEventListener('offline', onNetwork);
      window.removeEventListener('focus', onResume);
      document.removeEventListener('visibilitychange', onResume);
    };
  }, [client]);

  useEffect(() => {
    const received = query.data;
    if (!received?.snapshot.period) return;
    const end = Math.min(
      Date.parse(received.snapshot.period.dailyEnd),
      Date.parse(received.snapshot.period.weeklyEnd),
    );
    const delay = Math.max(0, end - routineNow(received, performance.now()));
    // One request per received snapshot, never per local countdown tick.
    // On failure the expired controls stay disabled and Refresh stays available.
    const timer = setTimeout(
      () => {
        void client.invalidateQueries({ queryKey: KEY });
        void client.invalidateQueries({ queryKey: ['companion', 'today'] });
        void client.invalidateQueries({ queryKey: ['companion', 'plan'] });
        void client.invalidateQueries({ queryKey: ['intelligence', 'planner'] });
      },
      Math.min(delay + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [client, query.data]);

  const snapshot = query.data?.snapshot;
  const now = query.data ? routineNow(query.data, tick) : 0;
  const expired = snapshot ? routineExpired(snapshot, now) : false;
  const disabled = saving || query.isFetching || query.isError || !online || expired;
  const clockDisabled = disabled || !snapshot?.period;
  useEffect(() => {
    if (saving || query.isFetching || !saveFocus.current) return;
    const target = saveFocus.current;
    saveFocus.current = null;
    if (!isCurrentSession(session) || document.activeElement !== document.body) return;
    if (target.isConnected && !target.matches(':disabled')) target.focus();
    else refreshButton.current?.focus();
  }, [saving, query.isFetching, session]);
  function save(command: RoutineCommand) {
    // Ref handles double clicks before React renders; cache handles remounts.
    if (disabled || saveLock.current || client.isMutating({ mutationKey: SAVE_KEY })) return;
    // Recheck elapsed time at submission in case a background tab's tick was delayed.
    if (
      query.data &&
      routineExpired(query.data.snapshot, routineNow(query.data, performance.now()))
    ) {
      void client.invalidateQueries({ queryKey: KEY });
      return;
    }
    saveLock.current = true;
    saveFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    mutation.mutate(command);
  }

  if (!snapshot)
    return (
      <section className="glass-panel rounded-2xl p-6" aria-live="polite">
        {!online ? (
          'Offline — reconnect to load your routine.'
        ) : query.isPending ? (
          'Loading your routine…'
        ) : (
          <>
            <p role="alert">{query.error?.message ?? 'Routine unavailable.'}</p>
            <button className={button} onClick={() => void query.refetch()}>
              Retry
            </button>
          </>
        )}
      </section>
    );

  const common = {
    contractVersion: 2 as const,
    expectedRevision: snapshot.revision,
    serverId: snapshot.serverId,
    dailyPeriodId: snapshot.period?.dailyPeriodId ?? null,
  };
  const resin = projectResin(snapshot.resin, now);
  const transformer = snapshot.tasks.find((task) => task.id === 'transformer');

  return (
    <section className="space-y-5" aria-label={`${view} routine`}>
      <div
        id="routine-settings"
        className="glass-panel flex flex-wrap items-center gap-4 rounded-2xl p-5"
      >
        <label htmlFor="routine-server" className="text-sm font-semibold text-white">
          Game server
        </label>
        <select
          id="routine-server"
          className={input}
          value={snapshot.serverId ?? ''}
          disabled={disabled}
          onChange={(event) =>
            save({
              kind: 'settings',
              body: {
                contractVersion: 2,
                expectedRevision: snapshot.revision,
                serverId: isSupportedServerId(event.target.value) ? event.target.value : null,
              },
            })
          }
        >
          <option value="">Not selected</option>
          {SUPPORTED_SERVER_IDS.map((serverId) => (
            <option key={serverId} value={serverId}>
              {SERVER_POLICIES[serverId].label}
            </option>
          ))}
        </select>
        <button
          ref={refreshButton}
          className={button}
          disabled={saving || query.isFetching || !online}
          onClick={() => void query.refetch()}
        >
          Refresh
        </button>
        <p className="text-sm text-zinc-400" aria-live="polite">
          {saving
            ? 'Saving…'
            : query.isFetching
              ? 'Refreshing…'
              : !online
                ? 'Offline — reconnect before saving.'
                : query.isError
                  ? 'Refresh required before saving.'
                  : expired
                    ? 'The reset period ended. Refresh before saving.'
                    : 'Changes save after confirmation from the server.'}
        </p>
      </div>
      {snapshot.period && (
        <p className="text-sm font-medium text-indigo-100">
          {SERVER_POLICIES[snapshot.period.serverId].label} · Next daily reset in{' '}
          {expired ? 'refresh required' : formatRemaining(snapshot.period.dailyEnd, now)} · Weekly
          reset in {expired ? 'refresh required' : formatRemaining(snapshot.period.weeklyEnd, now)}
        </p>
      )}
      <p className="text-sm text-zinc-400">
        Daily reset: 04:00
        {snapshot.serverId
          ? ` ${SERVER_POLICIES[snapshot.serverId].timezone}`
          : ' on your game server'}
        . Weekly reset: Monday at the same time. Server times use fixed offsets and do not follow
        daylight saving time. Changing server starts fresh daily and weekly records; resin and
        manual-use checkpoints stay.
      </p>
      {!snapshot.period && (
        <p className="rounded-xl border border-amber-400/20 p-4 text-sm text-amber-200">
          {snapshot.clockStatus === 'unselected'
            ? 'Select your game server to set up reset tracking. '
            : ''}
          {snapshot.clockStatus === 'unsupported'
            ? 'This server is not supported. '
            : snapshot.clockStatus === 'unverified'
              ? 'Server reset tracking is unavailable. '
              : ''}
          Daily and weekly records are unavailable. You can still record resin and Transformer use.
        </p>
      )}
      {query.error && (
        <p role="alert" className="rounded-xl border border-red-400/30 p-4 text-sm text-red-200">
          Could not refresh your routine: {query.error.message}. Cached values may be stale. Refresh
          before saving.
        </p>
      )}
      {mutation.error && (
        <p role="alert" className="rounded-xl border border-red-400/30 p-4 text-sm text-red-200">
          {mutation.error.message} The save was not confirmed and will not be retried automatically.
        </p>
      )}

      {view === 'daily' ? (
        <div className="grid gap-5 md:grid-cols-2">
          <div className="glass-panel space-y-4 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white">Original Resin</h2>
            <p className="text-4xl font-bold tabular-nums text-indigo-200">
              {resin === null
                ? 'Unknown'
                : `${resin} / ${snapshot.resin.known ? snapshot.resin.cap : 200}`}
            </p>
            <p className="text-sm text-zinc-400">
              {resin === null
                ? 'Enter your current in-game amount to start an estimate.'
                : 'Estimate from your last manual entry. Spending resin in-game is not tracked.'}
            </p>
            {snapshot.resin.known && resin !== null && (
              <p className="text-sm text-zinc-400">
                {resin >= snapshot.resin.cap
                  ? 'At cap'
                  : snapshot.resin.capAt
                    ? `Full in ${formatRemaining(snapshot.resin.capAt, now)}`
                    : ''}
              </p>
            )}
            <form
              className="flex flex-wrap gap-3"
              onSubmit={(event) => {
                event.preventDefault();
                const amount = Number(new FormData(event.currentTarget).get('amount'));
                if (Number.isInteger(amount) && amount >= 0 && amount <= 200)
                  save({ kind: 'resin', body: { ...common, amount } });
              }}
            >
              <label className="flex flex-col gap-2 text-sm">
                Current resin
                <input
                  name="amount"
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  required
                  className={`${input} w-32`}
                  disabled={disabled}
                />
              </label>
              <button className={`${button} self-end`} disabled={disabled}>
                Record resin
              </button>
            </form>
          </div>
          {(!enabledKinds ||
            enabledKinds.some((kind) => kind === 'commissions' || kind === 'teapot')) && (
            <div className="glass-panel space-y-4 rounded-2xl p-6">
              <h2 className="text-lg font-semibold text-white">Daily reminders</h2>
              {snapshot.period && (
                <p className="text-sm text-zinc-400">
                  Reset in {formatRemaining(snapshot.period.dailyEnd, now)}
                </p>
              )}
              {snapshot.tasks
                .filter((task) => task.cadence === 'daily' || task.cadence === 'daily_reminder')
                .filter(
                  (task) => !enabledKinds || enabledKinds.includes(task.id as PlanRoutineKind),
                )
                .map((task) => (
                  <label key={task.id} className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={!expired && task.done === true}
                      disabled={clockDisabled}
                      onChange={(event) =>
                        save({
                          kind: 'checklist',
                          body: {
                            ...common,
                            action: 'setDaily',
                            ...(task.id === 'commissions'
                              ? { commissionsDone: event.target.checked }
                              : { teapotChecked: event.target.checked }),
                          },
                        })
                      }
                    />
                    {task.label}
                  </label>
                ))}
              <p className="text-xs text-zinc-500">
                Teapot is a reminder to check today. It does not estimate currency capacity.
              </p>
            </div>
          )}
          {(!enabledKinds || enabledKinds.includes('transformer')) && (
            <div className="glass-panel space-y-4 rounded-2xl p-6 md:col-span-2">
              <h2 className="text-lg font-semibold text-white">Parametric Transformer</h2>
              <p className="text-sm text-zinc-400">
                {transformer?.lastRecordedAt
                  ? `Last recorded use: ${new Date(transformer.lastRecordedAt).toLocaleString()}`
                  : 'No use recorded.'}{' '}
                Manual record; no cooldown estimate.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  className={button}
                  disabled={disabled}
                  onClick={() =>
                    save({ kind: 'checklist', body: { ...common, action: 'recordTransformerUse' } })
                  }
                >
                  Record use now
                </button>
                <button
                  className={button}
                  disabled={disabled || !transformer?.lastRecordedAt}
                  onClick={() =>
                    save({ kind: 'checklist', body: { ...common, action: 'clearTransformerUse' } })
                  }
                >
                  Clear record
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-panel space-y-4 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white">Weekly reward claims</h2>
          <p className="text-3xl text-indigo-200">
            {expired ? 'Unknown' : (snapshot.weeklyClaims.rewardClaims ?? 'Unknown')}
          </p>
          <p className="text-sm text-zinc-400">
            Enter the total rewards you claimed this game week. Defeating a boss without claiming
            rewards does not count. This does not spend resin or add materials.
          </p>
          {snapshot.period && (
            <p className="text-sm text-zinc-400">
              Weekly reset in {formatRemaining(snapshot.period.weeklyEnd, now)}
            </p>
          )}
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!snapshot.period || !snapshot.serverId || clockDisabled) return;
              const rewardClaims = Number(new FormData(event.currentTarget).get('claims'));
              if (Number.isInteger(rewardClaims) && rewardClaims >= 0 && rewardClaims <= 1000)
                save({
                  kind: 'weekly-claims',
                  body: {
                    ...common,
                    serverId: snapshot.serverId,
                    dailyPeriodId: snapshot.period.dailyPeriodId,
                    weeklyPeriodId: snapshot.period.weeklyPeriodId,
                    rewardClaims,
                  },
                });
            }}
          >
            <label className="flex flex-col gap-2 text-sm">
              Rewards claimed
              <input
                name="claims"
                type="number"
                min="0"
                max="1000"
                step="1"
                required
                className={`${input} w-32`}
                disabled={clockDisabled}
              />
            </label>
            <button className={button} disabled={clockDisabled}>
              Save total
            </button>
            <button
              type="button"
              className={button}
              disabled={clockDisabled}
              onClick={() => {
                if (snapshot.period && snapshot.serverId)
                  save({
                    kind: 'weekly-claims',
                    body: {
                      ...common,
                      serverId: snapshot.serverId,
                      dailyPeriodId: snapshot.period.dailyPeriodId,
                      weeklyPeriodId: snapshot.period.weeklyPeriodId,
                      rewardClaims: null,
                    },
                  });
              }}
            >
              Mark unknown
            </button>
          </form>
          <p className="text-sm text-zinc-500">
            Discount and claim-cost estimates are unavailable pending verification.
          </p>
        </div>
      )}

      {snapshot.legacy && (
        <details className="glass-panel rounded-2xl p-5 text-sm text-zinc-400">
          <summary className="cursor-pointer font-semibold text-zinc-200">
            Previous companion records (read only)
          </summary>
          <div className="mt-3 space-y-2">
            <p>
              These records have not been converted into current resin, daily completions, or reward
              claims. Re-enter values you can confirm in-game.
            </p>
            <p>
              Old resin: {snapshot.legacy.legacyResinAmount ?? 'Unknown'}
              {snapshot.legacy.legacyResinUpdatedAt
                ? `, recorded ${new Date(snapshot.legacy.legacyResinUpdatedAt).toLocaleString()}`
                : ''}
            </p>
            <p>
              Old flags — commissions:{' '}
              {snapshot.legacy.legacyCommissionsDone ? 'checked' : 'unchecked'}; teapot:{' '}
              {snapshot.legacy.legacyTeapotClaimed ? 'checked' : 'unchecked'}; Transformer:{' '}
              {snapshot.legacy.legacyTransformerClaimed ? 'checked' : 'unchecked'}.
            </p>
            <p>
              Old defeated-boss keys: {snapshot.legacy.legacyDefeatedBossKeys.join(', ') || 'None'}.
            </p>
          </div>
        </details>
      )}
    </section>
  );
}
