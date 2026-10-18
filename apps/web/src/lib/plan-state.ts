import type { PlanAdvice, PlanCommand, PlanSnapshot } from '@celestia/api-contracts';
import type { QueryClient } from '@tanstack/react-query';

import { invalidateIntentQueries } from './account-cache';
import { type AccountSession, isCurrentSession } from './account-session';
import { patchPlan } from './api';

export const PLAN_KEY = ['companion', 'plan', 1] as const;
export const PLAN_SAVE_KEY = ['companion', 'plan-save'] as const;
export interface ReceivedPlan {
  snapshot: PlanSnapshot;
  receivedAt: number;
}
export function newestPlan(old: ReceivedPlan | undefined, next: ReceivedPlan): ReceivedPlan {
  if (!old) return next;
  const a = old.snapshot,
    b = next.snapshot;
  if (
    a.revision > b.revision ||
    a.routineRevision > b.routineRevision ||
    a.goalRevisions.some(
      (goal) =>
        !b.goalRevisions.some((other) => other.id === goal.id && other.revision >= goal.revision),
    ) ||
    Date.parse(a.serverNow) > Date.parse(b.serverNow)
  )
    return old;
  return next;
}
export function planExpired(plan: ReceivedPlan, elapsed: number): boolean {
  const period = plan.snapshot.period;
  return (
    !!period &&
    Date.parse(plan.snapshot.serverNow) + Math.max(0, elapsed - plan.receivedAt) >=
      Date.parse(period.dailyEnd)
  );
}
export function adviceMatches(plan: PlanSnapshot, advice: PlanAdvice): boolean {
  return (
    plan.revision === advice.revision &&
    plan.routineRevision === advice.routineRevision &&
    (plan.period?.dailyPeriodId ?? null) === advice.dailyPeriodId &&
    JSON.stringify(plan.goalRevisions) === JSON.stringify(advice.goalRevisions)
  );
}
/** Shared real mutation path, exercised with QueryClient in the client regressions. */
export function planMutationOptions(client: QueryClient, session: AccountSession) {
  return {
    mutationKey: PLAN_SAVE_KEY,
    mutationFn: async (command: PlanCommand) => {
      const received = client.getQueryData<ReceivedPlan>(PLAN_KEY);
      if (received && planExpired(received, performance.now()))
        throw new Error('The server period ended. Refresh before saving your choices.');
      return patchPlan(command, session);
    },
    retry: false as const,
    networkMode: 'always' as const,
    onMutate: () => client.cancelQueries({ queryKey: ['companion'] }),
    onSuccess: async (snapshot: PlanSnapshot) => {
      if (!isCurrentSession(session)) return;
      client.setQueryData<ReceivedPlan>(PLAN_KEY, (old) =>
        newestPlan(old, { snapshot, receivedAt: performance.now() }),
      );
      await invalidateIntentQueries(client);
    },
  };
}
