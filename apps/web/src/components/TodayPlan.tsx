import {
  type PlanCommand,
  type PlanScope,
  type PlanSource,
  SERVER_POLICIES,
} from '@celestia/api-contracts';
import { useIsMutating, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { captureSession, isCurrentSession } from '../lib/account-session';
import { fetchPlan, fetchPlanAdvice } from '../lib/api';
import { domainSchedule, materialCatalogEntry, targetDisplayName } from '../lib/catalog';
import {
  adviceMatches,
  newestPlan,
  PLAN_KEY,
  PLAN_SAVE_KEY,
  planExpired,
  planMutationOptions,
  type ReceivedPlan,
} from '../lib/plan-state';
import { planButton, routineLabels } from '../lib/plan-view';
import { serverDateLabel } from '../lib/routine-state';
import DomainSchedule from './DomainSchedule';
import { PlanPreferencesForm } from './PlanPreferencesForm';
import RoutinePanel from './RoutinePanel';

export default function TodayPlan() {
  const client = useQueryClient();
  const [session] = useState(captureSession);
  const [expanded, setExpanded] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(() => performance.now());
  const saveLock = useRef(false);
  const saveFocus = useRef<HTMLElement | null>(null);
  const saving = useIsMutating({ mutationKey: PLAN_SAVE_KEY }) > 0;
  const query = useQuery({
    queryKey: PLAN_KEY,
    queryFn: async ({ signal }): Promise<ReceivedPlan> => ({
      snapshot: await fetchPlan(signal, session),
      receivedAt: performance.now(),
    }),
    structuralSharing: (old, next) =>
      newestPlan(old as ReceivedPlan | undefined, next as ReceivedPlan),
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchOnReconnect: 'always',
  });
  const advice = useQuery({
    queryKey: ['companion', 'plan', 'advice'],
    queryFn: ({ signal }) => fetchPlanAdvice(signal, session),
    retry: false,
  });
  const options = planMutationOptions(client, session);
  const mutation = useMutation({
    ...options,
    onSuccess: async (response, command) => {
      await options.onSuccess(response);
      if (!isCurrentSession(session)) return;
      if (command.action === 'preferences') setFormEpoch((value) => value + 1);
      setMessage('Plan choices confirmed. Completion and inventory are unchanged.');
    },
    onError: (error) => {
      if (isCurrentSession(session))
        setMessage(
          error.message +
            ' Your draft and last confirmed choices are retained. Refresh, review, and save deliberately.',
        );
    },
    onSettled: () => {
      if (isCurrentSession(session)) saveLock.current = false;
    },
  });
  useEffect(() => {
    const timer = setInterval(() => setTick(performance.now()), 1000);
    const refresh = () => {
      if (document.visibilityState === 'visible')
        void client.invalidateQueries({ queryKey: ['companion', 'plan'] });
    };
    document.addEventListener('visibilitychange', refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, [client]);
  useEffect(() => {
    if (!query.data?.snapshot.period) return;
    const received = query.data;
    const delay =
      Date.parse(received.snapshot.period!.dailyEnd) -
      Date.parse(received.snapshot.serverNow) -
      Math.max(0, performance.now() - received.receivedAt);
    const timer = setTimeout(
      () => {
        void client.invalidateQueries({ queryKey: ['companion'] });
      },
      Math.min(Math.max(0, delay) + 50, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [client, query.data]);
  const plan = query.data?.snapshot;
  const expired = !!query.data && planExpired(query.data, tick);
  const disabled = saving || query.isFetching || query.isError || !navigator.onLine || expired;
  useEffect(() => {
    if (saving || query.isFetching || !saveFocus.current) return;
    const target = saveFocus.current;
    saveFocus.current = null;
    if (!isCurrentSession(session) || document.activeElement !== document.body) return;
    if (target.isConnected && !target.matches(':disabled')) target.focus();
    else document.querySelector<HTMLElement>('#plan-choices summary')?.focus();
  }, [saving, query.isFetching, session]);
  function handleSave(command: PlanCommand) {
    if (disabled || saveLock.current || client.isMutating({ mutationKey: PLAN_SAVE_KEY })) return;
    saveLock.current = true;
    saveFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setMessage(null);
    mutation.mutate(command);
  }
  function dismiss(source: PlanSource, scope: PlanScope, dismissed: boolean) {
    if (!plan?.period || !plan.serverId) return;
    handleSave({
      contractVersion: 1,
      expectedRevision: plan.revision,
      action: 'dismissal',
      expectedRoutineRevision: plan.routineRevision,
      serverId: plan.serverId,
      dailyPeriodId: plan.period.dailyPeriodId,
      weeklyPeriodId: plan.period.weeklyPeriodId,
      source,
      scope,
      dismissed,
    });
  }
  async function refresh() {
    const result = await query.refetch();
    void advice.refetch();
    if (isCurrentSession(session))
      setMessage(
        result.error
          ? 'Plan refresh failed. Your typed choices and last confirmed state are retained.'
          : 'Refreshed confirmed state. Your typed choices are retained; review before saving again.',
      );
  }
  const selected = plan?.goals.filter((item) => !item.dismissed.length) ?? [];
  const hidden = plan?.goals.filter((item) => item.dismissed.length) ?? [];
  const shown = expanded ? selected : selected.slice(0, 3);
  const matchingAdvice =
    plan && advice.data && adviceMatches(plan, advice.data) && !expired ? advice.data : null;
  const enabled = plan?.routines.filter((item) => !item.dismissed).map((item) => item.kind) ?? [];
  return (
    <div className="min-w-0 space-y-6">
      <section id="session-recording" className="space-y-4" aria-label="Manual session recording">
        <h2 className="text-xl font-semibold text-white">Your routine</h2>
        <p className="text-sm text-zinc-400">
          Record what you did, or update a resin checkpoint. These actions do not grant drops,
          change inventory or complete goals.
        </p>
        {plan && !plan.routines.length && (
          <p className="text-sm">
            No optional routines enabled. Open Plan choices below to choose some, or keep a quiet
            plan.
          </p>
        )}
        {plan &&
          plan.routines.length > 0 &&
          plan.routines.every((item) => item.dismissed || item.task?.done === true) && (
            <p className="text-sm">
              Your enabled routine reminders are recorded or set aside. Nothing else is due from
              these reminders; manual recording remains available.
            </p>
          )}
        <div className="flex flex-wrap gap-3">
          {plan?.routines
            .filter((item) => !item.dismissed)
            .map((item) => (
              <button
                key={item.kind}
                className={planButton}
                disabled={disabled || !plan.period}
                onClick={() =>
                  dismiss({ kind: 'routine', routineKind: item.kind }, item.scope, true)
                }
              >
                Dismiss {routineLabels[item.kind]} for{' '}
                {item.scope === 'day' ? 'today' : 'this week'}
              </button>
            ))}
        </div>
        <RoutinePanel view="daily" enabledKinds={enabled} />
      </section>

      <section
        aria-label="Today's goals and choices"
        className="companion-priority-card min-w-0 space-y-5 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="mb-2 inline-flex rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-1 text-xs font-medium text-indigo-200">
              Focus goals
            </span>
            <h2 className="text-xl font-semibold text-white">Your next few goals</h2>
          </div>
          <button
            className={planButton}
            disabled={saving || query.isFetching}
            onClick={() => void refresh()}
          >
            Refresh plan
          </button>
        </div>
        <p className="text-sm text-zinc-400">
          Your priority first. Declared ranges stay the same until you edit them; completing a goal
          is always your decision.
        </p>
        {query.isPending && <p role="status">Loading your plan…</p>}
        {query.error && (
          <p role="alert" className="text-amber-200">
            Could not refresh your plan: {query.error.message}.{' '}
            {plan
              ? 'Last confirmed plan remains below; refresh before saving.'
              : 'Manual recording below remains available.'}
          </p>
        )}
        {expired && (
          <p role="status" className="text-amber-200">
            The server day ended. Refresh before changing period choices.
          </p>
        )}
        {message && (
          <p
            role="status"
            className="rounded-lg border border-indigo-300/20 p-3 text-sm text-indigo-100"
          >
            {message}
          </p>
        )}
        {plan && (
          <>
            {!plan.goals.length && (
              <p>
                No active goals.{' '}
                <Link className="underline" to="/roster">
                  Choose a character
                </Link>{' '}
                or{' '}
                <Link className="underline" to="/planner?tab=farming&newType=CHARACTER_TALENT">
                  create a goal
                </Link>
                . You can start before importing.
              </p>
            )}
            {!!plan.goals.length && !selected.length && (
              <p>Your active goals are set aside for this period. Restore one whenever you want.</p>
            )}
            <ol className="space-y-3">
              {shown.map(({ goal }, index) => {
                const demand = matchingAdvice?.goalDemand.find((item) => item.goalId === goal.id);
                return (
                  <li
                    key={goal.id}
                    className={`${index === 0 ? 'companion-priority-card' : 'companion-info-card'} min-w-0 space-y-3 rounded-xl p-4`}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded bg-indigo-400/10 px-2 py-1 text-xs text-indigo-200">
                        Priority {goal.priority}
                      </span>
                      <h3 className="break-words font-semibold text-white">
                        {targetDisplayName(goal.targetKey)} ·{' '}
                        {goal.goalType === 'CHARACTER_TALENT'
                          ? `${goal.talentType ?? 'missing slot'} talent`
                          : 'ascension'}{' '}
                        {goal.fromPhase} → {goal.toPhase}
                      </h3>
                    </div>
                    {(goal.limitations.length > 0 || demand?.reason) && (
                      <p className="text-sm text-zinc-400">
                        {goal.limitations.join(' ') || demand?.reason}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Link
                        className={planButton}
                        to={`/planner?tab=farming&goal=${encodeURIComponent(goal.id)}`}
                      >
                        Edit goal
                      </Link>
                      {goal.goalType !== 'WEAPON_ASCENSION' && (
                        <Link
                          className={planButton}
                          to={`/roster/${encodeURIComponent(goal.targetKey)}`}
                        >
                          Character details
                        </Link>
                      )}
                      <button
                        className={planButton}
                        disabled={disabled || !plan.period}
                        onClick={() =>
                          dismiss(
                            { kind: 'goal', goalId: goal.id, expectedGoalRevision: goal.revision },
                            'day',
                            true,
                          )
                        }
                      >
                        Dismiss for today
                      </button>
                      <button
                        className={planButton}
                        disabled={disabled || !plan.period}
                        onClick={() =>
                          dismiss(
                            { kind: 'goal', goalId: goal.id, expectedGoalRevision: goal.revision },
                            'week',
                            true,
                          )
                        }
                      >
                        Dismiss for this week
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="flex flex-wrap gap-3">
              {selected.length > 3 && (
                <button className={planButton} onClick={() => setExpanded((value) => !value)}>
                  {expanded ? 'Show shortlist' : `Show all ${selected.length} active goals`}
                </button>
              )}
              <Link className={planButton} to="/planner?tab=farming">
                View all goals and history
              </Link>
              <Link className={planButton} to="/planner?tab=farming#farming-planning">
                Check domain farming days
              </Link>
            </div>
            {!plan.period && (
              <p className="text-sm text-amber-200">
                Period dismissal is unavailable until a supported server is selected above. Manual
                goals and plan choices still work.
              </p>
            )}
            <details id="plan-choices" className="rounded-xl border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold text-white">
                Plan choices ·{' '}
                {plan.preferences.dailyResinBudget === null
                  ? 'resin ceiling unset'
                  : `${plan.preferences.dailyResinBudget} resin / day`}
              </summary>
              <div className="mt-4">
                <PlanPreferencesForm
                  key={formEpoch}
                  initial={plan.preferences}
                  disabled={disabled}
                  saving={saving}
                  onRestore={() => setFormEpoch((value) => value + 1)}
                  onSave={(preferences) =>
                    handleSave({
                      contractVersion: 1,
                      expectedRevision: plan.revision,
                      action: 'preferences',
                      preferences,
                    })
                  }
                />
              </div>
            </details>
            <details className="rounded-xl border border-white/10 p-4">
              <summary className="cursor-pointer font-semibold text-white">
                Dismissed work ·{' '}
                {hidden.length + plan.routines.filter((item) => item.dismissed).length}
              </summary>
              <p className="my-3 text-sm text-zinc-400">
                Dismissal only changes this period's visibility. Active demand and goal history
                remain. Goal edits restore changed intent.
              </p>
              {!hidden.length && !plan.routines.some((item) => item.dismissed) && (
                <p className="text-sm">Nothing dismissed.</p>
              )}
              {hidden.map(({ goal, dismissed }) => (
                <div key={goal.id} className="my-2 flex flex-wrap items-center gap-3">
                  <span className="break-words">
                    {goal.targetKey} · {goal.talentType ?? 'ascension'}
                  </span>
                  {dismissed.map((scope) => (
                    <button
                      key={scope}
                      className={planButton}
                      disabled={disabled || !plan.period}
                      onClick={() =>
                        dismiss(
                          { kind: 'goal', goalId: goal.id, expectedGoalRevision: goal.revision },
                          scope,
                          false,
                        )
                      }
                    >
                      Restore {scope === 'day' ? 'today' : 'this week'}
                    </button>
                  ))}
                </div>
              ))}
              {plan.routines
                .filter((item) => item.dismissed)
                .map((item) => (
                  <div key={item.kind} className="my-2 flex flex-wrap items-center gap-3">
                    <span>{routineLabels[item.kind]}</span>
                    <button
                      className={planButton}
                      disabled={disabled || !plan.period}
                      onClick={() =>
                        dismiss({ kind: 'routine', routineKind: item.kind }, item.scope, false)
                      }
                    >
                      Restore {routineLabels[item.kind]}
                    </button>
                  </div>
                ))}
            </details>
          </>
        )}
      </section>

      <section
        aria-label="This week"
        className="companion-info-card space-y-3 rounded-2xl p-4 sm:p-6"
      >
        <h2 className="text-xl font-semibold text-white">This week</h2>
        {!plan ? (
          <p>Load your plan to see the supported weekly period.</p>
        ) : !plan.weekly.available ? (
          <p>A supported server is needed for this week's summary. No weekly count is assumed.</p>
        ) : (
          <>
            <p className="text-sm text-zinc-400">
              {plan.serverId ? SERVER_POLICIES[plan.serverId].label : 'Game'} server week ·{' '}
              {serverDateLabel(plan.period!.weeklyStart, plan.period!.serverId)} –{' '}
              {serverDateLabel(plan.period!.weeklyEnd, plan.period!.serverId)}
            </p>
            {!enabled.includes('weeklyClaims') ? (
              <p>
                Weekly reward-claim tracking is optional. Enable it in Plan choices or restore its
                dismissal.
              </p>
            ) : (
              <p>
                Recorded reward claims:{' '}
                <strong className="text-white">
                  {expired ? 'Refresh required' : (plan.weekly.rewardClaims ?? 'Unknown')}
                </strong>
                . This is your reported total, not a boss count or a completion target.
              </p>
            )}
          </>
        )}
        <Link className={planButton} to="/planner?tab=weekly">
          Record weekly claims
        </Link>
        <p className="text-sm text-zinc-400">
          No forecast of future resin, discounts, deadlines or guaranteed upgrades.
        </p>
      </section>

      <section
        aria-label="Supporting material advice"
        className="companion-info-card space-y-3 rounded-2xl p-4 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-white">Farm today</h2>
          <button
            className={planButton}
            disabled={advice.isFetching}
            onClick={() => void advice.refetch()}
          >
            Refresh advice
          </button>
        </div>
        {advice.isPending && <p>Loading supporting advice…</p>}
        {advice.error && (
          <p role="alert" className="text-amber-200">
            Supporting advice could not refresh: {advice.error.message}. Your routine remains
            usable.
            {advice.data && ' Last confirmed advice is retained; it is not a current allocation.'}
          </p>
        )}
        {advice.data && !matchingAdvice && (
          <p className="text-sm text-zinc-400">
            Retained advice belongs to an earlier plan snapshot. Refresh to compare consistent goal,
            stock and resin data.
          </p>
        )}
        {matchingAdvice && (
          <>
            <p>{matchingAdvice.reason}</p>
            <p className="text-sm text-zinc-400">
              {advice.error ? 'Last confirmed: ' : ''}Daily ceiling:{' '}
              {matchingAdvice.budget ?? 'unset'} · Estimated resin at this snapshot:{' '}
              {matchingAdvice.availableResin ?? 'unknown'} · Allocated:{' '}
              {matchingAdvice.allocatedResin} Original Resin.
            </p>
            {matchingAdvice.sources.map((source) => (
              <div key={source.domain.domainKey} className="rounded-lg border border-white/10 p-3">
                <p className="font-medium">
                  {source.domain.name} · {source.domain.location}
                </p>
                <p>
                  {source.claims} optional reward claims × {source.domain.resinPerClaim} Original
                  Resin
                </p>
                <p className="text-sm text-zinc-400">{source.reason}</p>
              </div>
            ))}
            <details>
              <summary className="cursor-pointer text-sm text-indigo-100">
                All active demand ·{' '}
                {!plan?.goals.length
                  ? 'no active goals'
                  : matchingAdvice.materials.neededComplete
                    ? 'catalog cost coverage'
                    : 'partial cost coverage'}
              </summary>
              <p className="my-3 text-sm text-zinc-400">
                Totals cover declared ranges for all eligible active goals, including collapsed and
                dismissed ones. Recorded stock is subtracted once, in goal order. Unknown stock does
                not mean zero. Deficits include 3:1 crafting from surplus lower tiers. Re-import
                does not advance goals.
              </p>
              <div className="space-y-2">
                {Object.entries(matchingAdvice.materials.needed).map(([key, amount]) => (
                  <p key={key} className="break-words text-sm">
                    {materialCatalogEntry(key)?.name ?? key}: needed {amount.toLocaleString()} ·
                    recorded{' '}
                    {matchingAdvice.materials.inventory[key]?.toLocaleString() ?? 'unknown'} ·
                    {matchingAdvice.materials.delta[key] === null ? 'plan ' : 'deficit '}
                    {(
                      matchingAdvice.materials.planningDelta?.[key] ??
                      matchingAdvice.materials.delta[key] ??
                      amount
                    ).toLocaleString()}
                    {matchingAdvice.materials.delta[key] === null &&
                      ' (no unrecorded stock credited)'}
                  </p>
                ))}
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Stock receipt:{' '}
                {matchingAdvice.materials.stockBasis.importedAt
                  ? new Date(matchingAdvice.materials.stockBasis.importedAt).toLocaleString()
                  : 'unknown'}{' '}
                · {matchingAdvice.materials.stockBasis.source ?? 'source unknown'}. An import
                receipt is not a live game observation.
              </p>
            </details>
          </>
        )}
        <Link className={planButton} to="/import">
          Update inventory by import
        </Link>
        <details open>
          <summary className="cursor-pointer font-semibold text-white">
            Talent books and weapon materials open today
          </summary>
          <DomainSchedule
            serverId={plan?.serverId ?? null}
            weekday={!expired && !query.isFetching ? (plan?.period?.serverWeekday ?? null) : null}
            goalDomainKeys={
              matchingAdvice
                ? domainSchedule
                    .filter((domain) =>
                      domain.dropKeys.some(
                        (key) => (matchingAdvice.materials.needed[key] ?? 0) > 0,
                      ),
                    )
                    .map((domain) => domain.domainKey)
                : undefined
            }
            initialDay="today"
            initialOnlyGoals={false}
          />
        </details>
      </section>
    </div>
  );
}
