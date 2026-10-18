import { type GoalCommand, type GoalRecord, goalStatuses } from '@celestia/api-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { invalidateIntentQueries } from '../lib/account-cache';
import { captureSession, isCurrentSession } from '../lib/account-session';
import { createGoal, type CreateGoalInput, fetchGoals, updateGoal } from '../lib/api';
import { targetDisplayName } from '../lib/catalog';
import { mergeConfirmedGoals } from '../lib/goal-state';
import GoalForm from './GoalForm';
import GoalPriorityForm from './GoalPriorityForm';

const button =
  'rounded-lg border border-white/20 px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50';
export default function GoalManager() {
  const [params, setParams] = useSearchParams();
  const client = useQueryClient();
  const [session] = useState(captureSession);
  const goals = useQuery({
    queryKey: ['companion', 'goals'],
    queryFn: ({ signal }) => fetchGoals(signal),
    retry: false,
  });
  const [adding, setAdding] = useState(params.has('newType'));
  const [editor, setEditor] = useState<{
    goal: GoalRecord;
    action: 'edit' | 'successor' | 'priority';
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const region = useRef<HTMLElement>(null);
  const addTrigger = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const errorNotice = useRef<HTMLParagraphElement>(null);
  const savedNotice = useRef<HTMLParagraphElement>(null);
  const editorKey = adding ? 'new' : editor ? `${editor.goal.id}-${editor.action}` : null;
  const previousEditor = useRef<string | null>(null);
  const filter = params.get('status') ?? 'all';
  const target = params.get('target');
  const goalId = params.get('goal');
  const records = goals.data ?? [];
  const visible = records.filter(
    (goal) =>
      (filter === 'all' || goal.status === filter) &&
      (!target || goal.targetKey === target) &&
      (!goalId || goal.id === goalId),
  );
  const save = useMutation({
    mutationFn: async (
      input: { create: CreateGoalInput } | { id: string; command: GoalCommand },
    ) =>
      'create' in input
        ? createGoal(input.create, session)
        : updateGoal(input.id, input.command, session),
    retry: false,
    networkMode: 'always',
    onMutate: () => {
      setNotice('');
      setError(null);
      return client.cancelQueries({ queryKey: ['companion', 'goals'] });
    },
    onSuccess: (response) => {
      if (!isCurrentSession(session)) return;
      client.setQueryData<GoalRecord[]>(['companion', 'goals'], (old) =>
        mergeConfirmedGoals(old, response),
      );
      setAdding(false);
      setEditor(null);
      setError(null);
      setNotice('Goal saved. Review its confirmed state below.');
      void invalidateIntentQueries(client);
    },
    onError: (error) => {
      if (isCurrentSession(session)) setError(error.message);
    },
  });
  useEffect(() => {
    if (save.isPending) return;
    if (editorKey && editorKey !== previousEditor.current) {
      region.current
        ?.querySelector<HTMLElement>('form select:not(:disabled), form input:not(:disabled)')
        ?.focus();
    } else if (!editorKey && previousEditor.current) {
      const trigger = returnFocus.current;
      (trigger?.isConnected ? trigger : addTrigger.current)?.focus();
      returnFocus.current = null;
    } else if (notice && document.activeElement === document.body) {
      savedNotice.current?.focus();
    }
    if (error) errorNotice.current?.focus();
    previousEditor.current = editorKey;
  }, [editorKey, save.isPending, error, notice]);
  async function refresh() {
    const fresh = await goals.refetch();
    if (!isCurrentSession(session) || !fresh.data || fresh.error) return;
    void invalidateIntentQueries(client);
    setEditor((old) =>
      old ? { ...old, goal: fresh.data.find((goal) => goal.id === old.goal.id) ?? old.goal } : null,
    );
    setError(null);
    setNotice(
      'Refreshed confirmed state. Review it against your retained draft before saving again.',
    );
  }
  function action(
    goal: GoalRecord,
    command: Omit<GoalCommand, 'contractVersion' | 'expectedRevision'>,
  ) {
    setError(null);
    save.mutate({
      id: goal.id,
      command: { contractVersion: 3, expectedRevision: goal.revision, ...command } as GoalCommand,
    });
  }
  function cancelEditor() {
    setAdding(false);
    setEditor(null);
    setError(null);
  }
  const initialType =
    params.get('newType') === 'WEAPON_ASCENSION'
      ? 'WEAPON_ASCENSION'
      : params.get('newType') === 'CHARACTER_TALENT'
        ? 'CHARACTER_TALENT'
        : 'CHARACTER_ASCENSION';
  return (
    <section
      ref={region}
      className="glass-panel min-w-0 flex-1 space-y-4 rounded-2xl p-4 sm:p-6"
      aria-label="Goal management"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="mr-auto font-semibold text-white">Your goals</h2>
        <button
          ref={addTrigger}
          className={button}
          disabled={save.isPending}
          onClick={(event) => {
            returnFocus.current = event.currentTarget;
            setAdding(true);
            setEditor(null);
            setError(null);
          }}
        >
          Add goal
        </button>
        <button
          className={button}
          disabled={goals.isFetching || save.isPending}
          onClick={() => void refresh()}
        >
          Refresh goals
        </button>
      </div>
      <p className="text-xs text-zinc-400">
        Priority 1 first; ties use creation time then ID. Focus membership is independent.
        Completion is your decision.
      </p>
      <p ref={savedNotice} tabIndex={-1} role="status" className="text-sm text-indigo-200">
        {notice}
      </p>
      <label className="block text-sm">
        Goal status{' '}
        <select
          className="ml-2 rounded-lg bg-zinc-900 p-2"
          value={filter}
          onChange={(event) => {
            const next = new URLSearchParams(params);
            next.set('status', event.target.value);
            setParams(next);
          }}
        >
          <option value="all">All history</option>
          {goalStatuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </label>
      {(target || goalId) && (
        <p className="text-sm">
          Filtered to {target ?? 'linked goal'}.{' '}
          <button
            className="underline"
            onClick={() => {
              const next = new URLSearchParams(params);
              next.delete('target');
              next.delete('goal');
              setParams(next);
            }}
          >
            Show all goals
          </button>
        </p>
      )}
      {(error || goals.error) && (
        <p
          ref={errorNotice}
          tabIndex={-1}
          role="alert"
          className="rounded-lg border border-amber-400/30 p-3 text-sm text-amber-200"
        >
          {error ?? goals.error?.message} {goals.data && 'Last confirmed records remain below.'}
        </p>
      )}
      {adding && (
        <GoalForm
          key="new"
          initial={{ goalType: initialType, targetKey: params.get('key') ?? '' }}
          isPending={save.isPending}
          onCancel={cancelEditor}
          onSubmit={(create) => save.mutate({ create })}
        />
      )}
      {editor && (
        <div>
          <p className="text-sm text-indigo-200">
            {editor.action === 'successor'
              ? 'Reopen as a new active goal. The closed record and completion stay in history.'
              : editor.action === 'priority'
                ? 'Edit priority without changing the stored intent.'
                : 'Edit this goal’s declared range and priority.'}{' '}
            Confirmed: {editor.goal.fromPhase} → {editor.goal.toPhase}, priority{' '}
            {editor.goal.priority}, {editor.goal.status}, revision {editor.goal.revision}.
          </p>
          {editor.action === 'priority' ? (
            <GoalPriorityForm
              key={`${editor.goal.id}-priority`}
              initialPriority={editor.goal.priority}
              isPending={save.isPending}
              onCancel={cancelEditor}
              onSubmit={(priority) =>
                save.mutate({
                  id: editor.goal.id,
                  command: {
                    contractVersion: 3,
                    expectedRevision: editor.goal.revision,
                    action: 'priority',
                    priority,
                  },
                })
              }
            />
          ) : (
            <GoalForm
              key={`${editor.goal.id}-${editor.action}`}
              initial={{
                ...editor.goal,
                talentType: editor.goal.talentType as CreateGoalInput['talentType'],
              }}
              fixedIdentity
              isPending={save.isPending}
              submitLabel={
                editor.action === 'successor' ? 'Create active successor' : 'Save changes'
              }
              onCancel={cancelEditor}
              onSubmit={(input) =>
                save.mutate({
                  id: editor.goal.id,
                  command: {
                    contractVersion: 3,
                    expectedRevision: editor.goal.revision,
                    action: editor.action === 'successor' ? 'successor' : 'edit',
                    fromPhase: input.fromPhase,
                    toPhase: input.toPhase,
                    priority: input.priority,
                  },
                })
              }
            />
          )}
        </div>
      )}
      {goals.isLoading && <p role="status">Loading goals…</p>}
      {!goals.isLoading &&
        !goals.error &&
        goalId &&
        !records.some((goal) => goal.id === goalId) && (
          <p>
            Linked goal not found in this account. Use Show all goals to return to your records.
          </p>
        )}
      {!goals.isLoading && !goals.error && !goalId && records.length === 0 && (
        <p>No goals yet. You can declare a catalog target before importing.</p>
      )}
      {records.length > 0 && !records.some((goal) => goal.status === 'active') && (
        <p>No active goals. Your routine remains available.</p>
      )}
      {records.length > 0 && visible.length === 0 && <p>No goals match this filter.</p>}
      {visible.map((goal) => (
        <article
          key={goal.id}
          id={`goal-${goal.id}`}
          className="space-y-3 rounded-xl border border-white/10 p-4"
        >
          <div className="flex flex-wrap gap-2">
            <h3 className="break-words font-semibold text-white">
              {targetDisplayName(goal.targetKey)}
            </h3>
            <span className="text-sm">
              {goal.status} · Priority {goal.priority}
            </span>
          </div>
          <p className="text-sm">
            {goal.goalType === 'CHARACTER_TALENT'
              ? `Base talent (${goal.talentType})`
              : goal.goalType === 'WEAPON_ASCENSION'
                ? 'Weapon type ascension'
                : 'Character ascension'}{' '}
            · Declared {goal.fromPhase} → {goal.toPhase}
          </p>
          {goal.goalType !== 'CHARACTER_ASCENSION' && (
            <p className="text-xs text-zinc-400">
              {goal.goalType === 'CHARACTER_TALENT'
                ? 'Stored talent convention is unknown; no base-level comparison.'
                : 'Type-level intent; no individual weapon-copy progress comparison.'}
            </p>
          )}
          {goal.completedAt && (
            <p className="text-sm">
              Completed {new Date(goal.completedAt).toLocaleString()} ·{' '}
              {goal.completionReason === 'good_enough' ? 'Good enough' : 'Marked achieved by you'}
            </p>
          )}
          {goal.predecessorId && (
            <Link
              className="block text-xs text-indigo-200"
              to={`/planner?tab=farming&goal=${encodeURIComponent(goal.predecessorId)}`}
            >
              View preceding closed goal
            </Link>
          )}
          {goal.limitations.map((reason) => (
            <p key={reason} className="text-sm text-amber-200">
              {reason}
            </p>
          ))}
          <div className="flex flex-wrap gap-2">
            {goal.goalType !== 'WEAPON_ASCENSION' && (
              <Link className={button} to={`/roster/${encodeURIComponent(goal.targetKey)}`}>
                Character details
              </Link>
            )}
            {(goal.status === 'active' || goal.status === 'paused') && (
              <>
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget;
                    setEditor({ goal, action: 'edit' });
                    setAdding(false);
                    setError(null);
                  }}
                >
                  Edit range / priority
                </button>
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget;
                    setEditor({ goal, action: 'priority' });
                    setAdding(false);
                    setError(null);
                  }}
                >
                  Edit priority only
                </button>
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={() =>
                    action(goal, { action: goal.status === 'active' ? 'pause' : 'resume' })
                  }
                >
                  {goal.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={() =>
                    action(goal, { action: 'complete', reason: 'achieved' } as Omit<
                      GoalCommand,
                      'contractVersion' | 'expectedRevision'
                    >)
                  }
                >
                  Mark complete
                </button>
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={() =>
                    action(goal, { action: 'complete', reason: 'good_enough' } as Omit<
                      GoalCommand,
                      'contractVersion' | 'expectedRevision'
                    >)
                  }
                >
                  Good enough
                </button>
              </>
            )}
            {goal.status !== 'archived' && (
              <button
                className={button}
                disabled={save.isPending}
                onClick={() => action(goal, { action: 'archive' })}
              >
                Archive
              </button>
            )}
            {(goal.status === 'completed' || goal.status === 'archived') &&
              !records.some((row) => row.predecessorId === goal.id) && (
                <button
                  className={button}
                  disabled={save.isPending}
                  onClick={(event) => {
                    returnFocus.current = event.currentTarget;
                    setEditor({ goal, action: 'successor' });
                    setAdding(false);
                    setError(null);
                  }}
                >
                  Reopen / restore as new goal
                </button>
              )}
          </div>
        </article>
      ))}
    </section>
  );
}
