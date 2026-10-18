import type { GoalRecord, GoalWriteResponse } from '@celestia/api-contracts';

/** Only confirmed server responses enter the cache; older revisions cannot replace newer ones. */
export function mergeConfirmedGoals(
  previous: GoalRecord[] | undefined,
  response: GoalRecord | GoalWriteResponse,
): GoalRecord[] {
  const updates =
    'goal' in response
      ? [response.goal, ...(response.successor ? [response.successor] : [])]
      : [response];
  const rows = new Map((previous ?? []).map((goal) => [goal.id, goal]));
  for (const goal of updates) {
    const existing = rows.get(goal.id);
    if (!existing || existing.revision <= goal.revision) rows.set(goal.id, goal);
  }
  return [...rows.values()].sort(
    (a, b) =>
      a.priority - b.priority ||
      Date.parse(a.createdAt) - Date.parse(b.createdAt) ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
}
