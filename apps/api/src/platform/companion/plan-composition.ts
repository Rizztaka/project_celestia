import {
  dailyResinBudgetSchema,
  type GoalAdvice,
  type PlanAdvice,
  type PlanGoalDemand,
  type PlanSnapshot,
  type PlanSourceAllocation,
  type RecordedStockSnapshot,
  type RoutineSnapshotV2,
} from '@celestia/api-contracts';

import type { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';

import { duplicateGoalReason } from './goal-policy.js';
import { projectMaterialAccounting } from './material-advice.js';

/** Pure bounded session accounting. No rewards, writes, score, run cap or completion inference. */
export function composePlanAdvice(
  plan: PlanSnapshot,
  routine: RoutineSnapshotV2,
  stock: RecordedStockSnapshot,
  provider: ICompanionProvider,
): PlanAdvice {
  const budget = dailyResinBudgetSchema.parse(plan.preferences.dailyResinBudget);
  const availableResin = routine.resin.known ? routine.resin.currentAmount : null;
  const ceiling =
    budget === null || availableResin === null ? null : Math.min(budget, availableResin);
  const ordered = [...plan.goals]
    .filter(({ goal }) => goal.status === 'active')
    .sort(
      (a, b) =>
        a.goal.priority - b.goal.priority ||
        Date.parse(a.goal.createdAt) - Date.parse(b.goal.createdAt) ||
        (a.goal.id < b.goal.id ? -1 : a.goal.id > b.goal.id ? 1 : 0),
    );
  const entries = ordered.map(({ goal, dismissed }) => {
    let advice: GoalAdvice;
    try {
      provider.validateGoalIntent({
        goalType: goal.goalType,
        targetKey: goal.targetKey,
        talentType: goal.talentType,
        fromPhase: goal.fromPhase,
        toPhase: goal.toPhase,
      });
      advice = goal.needsReview
        ? { available: false, reason: duplicateGoalReason }
        : provider.getGoalAdvice(goal);
    } catch {
      advice = {
        available: false,
        reason: 'Legacy intent is outside supported type/slot/range limits. Preserved for review.',
      };
    }
    return { goal, advice, dismissed };
  });
  // Full demand first. Attribution spends this stock pool once, even for dismissed goals.
  const { materials, goalDeficits } = projectMaterialAccounting(entries, stock);
  const goalDemand: PlanGoalDemand[] = [];
  const grouped = new Map<string, PlanSourceAllocation>();
  const signatures = new Map<string, string>();
  const conflicting = new Set<string>();
  for (const [index, { goal, advice, dismissed }] of entries.entries()) {
    const deficits = goalDeficits[index]!;
    if (!advice.available) {
      goalDemand.push({ goalId: goal.id, deficits, state: 'unavailable', reason: advice.reason });
      continue;
    }
    const unknown = Object.values(deficits).some((value) => value === null);
    const state = unknown
      ? 'unknown'
      : Object.values(deficits).some((value) => value! > 0)
        ? 'deficit'
        : 'covered';
    const { route } = advice;
    const routes = advice.routes ?? (route.available ? [route.domain] : []);
    const openRoutes = plan.period
      ? routes.filter((domain) => domain.days.includes(plan.period!.serverWeekday))
      : [];
    const reason = !routes.length
      ? route.available
        ? null
        : route.reason
      : !plan.period
        ? 'Select a supported server to check farming availability.'
        : !openRoutes.length
          ? 'This verified source is closed on this server day.'
          : unknown
            ? 'Some recorded stock is unknown; no required-run count can be inferred.'
            : state === 'covered'
              ? 'Recorded stock covers this declared demand. Completion remains your decision.'
              : null;
    goalDemand.push({ goalId: goal.id, deficits, state, reason });
    if (dismissed.length || state === 'covered') continue;
    for (const domain of openRoutes) {
      if (!Number.isSafeInteger(domain.resinPerClaim) || domain.resinPerClaim <= 0) continue;
      const keys = domain.dropKeys.filter(
        (key) => (advice.costs[key] ?? 0) > 0 && deficits[key] !== 0,
      );
      if (!keys.length) continue;
      const signature = JSON.stringify([
        domain.name,
        domain.location,
        domain.resinPerClaim,
        [...domain.days].sort(),
        [...domain.dropKeys].sort(),
        [...domain.drops].sort(),
      ]);
      if (signatures.has(domain.domainKey) && signatures.get(domain.domainKey) !== signature)
        conflicting.add(domain.domainKey);
      signatures.set(domain.domainKey, signature);
      const group = grouped.get(domain.domainKey) ?? {
        domain,
        goalIds: [],
        materialKeys: [],
        claims: 0,
        resin: 0,
        reason: '',
      };
      group.goalIds.push(goal.id);
      group.materialKeys = [...new Set([...group.materialKeys, ...keys])];
      grouped.set(domain.domainKey, group);
    }
  }
  let remaining = ceiling ?? 0;
  const assigned = new Set<string>();
  const sources: PlanSourceAllocation[] = [];
  for (const [key, group] of grouped) {
    if (conflicting.has(key)) continue;
    group.materialKeys = group.materialKeys.filter((material) => !assigned.has(material));
    if (!group.materialKeys.length) continue;
    group.materialKeys.forEach((material) => assigned.add(material));
    const knownNeed = goalDemand.some(
      (demand) =>
        group.goalIds.includes(demand.goalId) &&
        group.materialKeys.some(
          (material) =>
            typeof demand.deficits[material] === 'number' && demand.deficits[material]! > 0,
        ),
    );
    group.claims = knownNeed ? Math.floor(remaining / group.domain.resinPerClaim) : 0;
    group.resin = group.claims * group.domain.resinPerClaim;
    remaining -= group.resin;
    group.reason = !knownNeed
      ? 'Route information only: stock is unknown, so required farming is unknown.'
      : ceiling === null
        ? 'Choose a budget and record current resin before allocating claims.'
        : group.claims === 0
          ? 'No whole claim fits the remaining ceiling.'
          : 'Optional claims within your current ceiling; no guaranteed drops or required-run estimate.';
    sources.push(group);
  }
  return {
    contractVersion: 1,
    revision: plan.revision,
    routineRevision: plan.routineRevision,
    goalRevisions: plan.goalRevisions,
    serverNow: plan.serverNow,
    dailyPeriodId: plan.period?.dailyPeriodId ?? null,
    materials,
    goalDemand,
    budget,
    availableResin,
    ceiling,
    allocatedResin: sources.reduce((sum, source) => sum + source.resin, 0),
    sources,
    reason: !entries.length
      ? 'No active goals. Manual tracking remains available.'
      : !plan.period
        ? 'Farming availability needs a supported server period. Manual goals remain usable.'
        : !sources.length
          ? 'No qualifying verified farming routes for selected work. This does not mean your goals are finished.'
          : budget === null
            ? 'Your recurring daily resin ceiling is unset.'
            : availableResin === null
              ? 'Current resin is unknown. Record a checkpoint to qualify an allocation.'
              : 'This is a feasible session, not a loot forecast. Spending is not tracked automatically.',
  };
}
