import type { UpgradeGoal } from '@prisma/client';

export const isCurrentGoal = (goal: Pick<UpgradeGoal, 'status'>) =>
  goal.status === 'active' || goal.status === 'paused';
export function compareGoals(a: UpgradeGoal, b: UpgradeGoal): number {
  return (
    a.priority - b.priority ||
    a.createdAt.getTime() - b.createdAt.getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
  );
}
export function sameIntent(
  a: UpgradeGoal,
  b: Pick<UpgradeGoal, 'goalType' | 'targetKey' | 'talentType'>,
): boolean {
  return a.goalType === b.goalType && a.targetKey === b.targetKey && a.talentType === b.talentType;
}
export function duplicateGoalIds(goals: UpgradeGoal[]): Set<string> {
  const groups = new Map<string, string[]>();
  for (const goal of goals.filter(isCurrentGoal)) {
    const key = JSON.stringify([goal.userId, goal.goalType, goal.targetKey, goal.talentType]);
    groups.set(key, [...(groups.get(key) ?? []), goal.id]);
  }
  return new Set([...groups.values()].filter((ids) => ids.length > 1).flat());
}
export const duplicateGoalReason =
  'Needs review: multiple active or paused goals share this intent. Archive or complete extras; all ambiguous demand is excluded.';
