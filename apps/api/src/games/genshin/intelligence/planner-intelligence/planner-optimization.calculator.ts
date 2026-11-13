import type { OptimizationPlanAlternativeKind, PlannerActionType } from '@celestia/api-contracts';

// ---------------------------------------------------------------------------
// Execution Time & Budget Constants (Strict ADR-0011: Pure Math, Zero Prose)
// ---------------------------------------------------------------------------

export const ACTION_MINUTES_PER_RUN: Readonly<Record<PlannerActionType, number>> = Object.freeze({
  domain_talent: 2.5,
  domain_weapon: 2.5,
  domain_artifact: 2.5,
  world_boss: 3.5,
  weekly_boss: 4.0,
  leyline: 1.5,
  overworld_gather: 10.0,
});

export const CONDENSED_RESIN_COST = 40;
export const CONDENSED_DOMAIN_MINUTES = 2.0;
export const STANDARD_DOMAIN_RESIN = 20;
export const WORLD_BOSS_RESIN = 40;
export const MAX_RUNS_PER_ACTION = 5;
export const DEFAULT_TIME_BUDGET_MINUTES = 30;
export const SUNDAY_INDEX = 6;

// ---------------------------------------------------------------------------
// Calculator Input & Output Types
// ---------------------------------------------------------------------------

export interface PlannerCandidateInput {
  candidateId: string;
  goalId: string | null;
  actionType: PlannerActionType;
  targetKey: string;
  talentType?: string | null;
  domainKey?: string | null;
  domainName: string;
  resourceName: string;
  openDays: ReadonlyArray<number>;
  resinPerRun: number;
  requiredMaterials: Readonly<Record<string, number>>;
  domainDropKeys?: ReadonlyArray<string>;
  goalPriority: number;
  expectedScoreDelta: number;
  closesGap: boolean;
}

export interface EvaluatedPlannerCandidate {
  candidateId: string;
  goalId: string | null;
  actionType: PlannerActionType;
  targetKey: string;
  talentType: string | null;
  domainKey: string | null;
  domainName: string;
  resourceName: string;
  openDays: ReadonlyArray<number>;
  resinPerRun: number;
  minutesPerRun: number;
  goalPriority: number;
  priorityWeight: number;
  timeGatingFactor: number;
  isTimeGated: boolean;
  isOpenToday: boolean;
  isOpenTomorrow: boolean;
  materialDeficitRatio: number;
  totalRequiredCount: number;
  totalDeficitCount: number;
  deficitsByMaterial: Record<string, number>;
  marginalImpact: number;
  expectedScoreDelta: number;
  closesGap: boolean;
  efficiencyScore: number;
  desiredRuns: number;
  inventoryStatus?: 'observed' | 'unknown';
}

export interface CalculatedOptimizationAction {
  actionId: string;
  goalId: string | null;
  actionType: PlannerActionType;
  targetKey: string;
  talentType: string | null;
  domainName: string;
  resourceName: string;
  runs: number;
  resinCost: number;
  estimatedMinutes: number;
  efficiencyScore: number;
  timeGated: boolean;
  materialDeficitRatio: number;
  marginalScoreDelta: number;
  closesReadinessGap: boolean;
  priority: number;
  isCondensed?: boolean;
  inventoryStatus?: 'observed' | 'unknown';
}

export interface CalculatedOptimizationAlternative {
  kind: OptimizationPlanAlternativeKind;
  totalResinCost: number;
  totalEstimatedMinutes: number;
  actions: CalculatedOptimizationAction[];
}

export interface OptimizationPlannerCalculationInput {
  candidates: ReadonlyArray<PlannerCandidateInput>;
  recordedInventory: Readonly<Record<string, number>>;
  isInventoryKnown?: boolean;
  currentResin: number;
  dailyResinBudget?: number | null;
  customResinBudget?: number | null;
  timeBudgetMinutes?: number | null;
  dayOfWeek: number;
  focusGoalIds?: ReadonlyArray<string>;
}

export interface OptimizationPlannerCalculationResult {
  currentResin: number;
  effectiveResinBudget: number;
  allocatedResin: number;
  unallocatedResin: number;
  timeBudgetMinutes: number;
  totalEstimatedMinutes: number;
  dayOfWeek: number;
  evaluatedCandidates: EvaluatedPlannerCandidate[];
  rankedPlan: CalculatedOptimizationAction[];
  alternatives: CalculatedOptimizationAlternative[];
}

// ---------------------------------------------------------------------------
// Pure Mathematical Helper Functions
// ---------------------------------------------------------------------------

function roundToTwo(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * 1. Time-Gating Factor ($G_a$):
 * - Open today (Mon–Sat) on a rotating schedule (< 7 days): 1.35
 * - Open every day (Sunday, or 7-day source such as Boss / Leyline / Artifact): 1.0
 * - Closed today: 0.0
 */
export function calculateTimeGatingFactor(
  openDays: ReadonlyArray<number>,
  dayOfWeek: number,
  actionType: PlannerActionType = 'domain_talent',
): { factor: number; isTimeGated: boolean; isOpenToday: boolean } {
  const isAlwaysOpenType =
    actionType === 'world_boss' ||
    actionType === 'weekly_boss' ||
    actionType === 'domain_artifact' ||
    actionType === 'leyline' ||
    actionType === 'overworld_gather';

  if (isAlwaysOpenType || openDays.length >= 7) {
    return { factor: 1.0, isTimeGated: false, isOpenToday: true };
  }

  const isOpenToday = dayOfWeek === SUNDAY_INDEX || openDays.includes(dayOfWeek);
  if (!isOpenToday) {
    return { factor: 0.0, isTimeGated: false, isOpenToday: false };
  }

  if (dayOfWeek === SUNDAY_INDEX) {
    return { factor: 1.0, isTimeGated: false, isOpenToday: true };
  }

  return { factor: 1.35, isTimeGated: true, isOpenToday: true };
}

/**
 * 2. Material Deficit Weight ($D_a \in [0.0, 1.0]$):
 * Computes remaining material deficit against recorded inventory.
 * If all required materials are owned, returns deficitRatio = 0.0.
 */
export function calculateMaterialDeficitWeight(
  requiredMaterials: Readonly<Record<string, number>>,
  recordedInventory: Readonly<Record<string, number>>,
  relevantDropKeys?: ReadonlyArray<string>,
  isInventoryKnown = true,
): {
  deficitRatio: number;
  totalRequired: number;
  totalDeficit: number;
  deficitsByMaterial: Record<string, number>;
  inventoryStatus: 'observed' | 'unknown';
} {
  const inventoryStatus = isInventoryKnown ? 'observed' : 'unknown';
  const allEntries = Object.entries(requiredMaterials).filter(([, qty]) => qty > 0);
  if (allEntries.length === 0) {
    return {
      deficitRatio: 0,
      totalRequired: 0,
      totalDeficit: 0,
      deficitsByMaterial: {},
      inventoryStatus,
    };
  }

  const dropKeySet =
    relevantDropKeys && relevantDropKeys.length > 0 ? new Set(relevantDropKeys) : null;

  // Prefer filtering to the domain's specific drop keys if they appear in requiredMaterials;
  // otherwise evaluate all non-Mora materials (or all entries if only Mora is present).
  let targetEntries = dropKeySet
    ? allEntries.filter(([key]) => dropKeySet.has(key))
    : allEntries.filter(([key]) => key !== 'Mora');

  if (targetEntries.length === 0) {
    targetEntries = allEntries.filter(([key]) => key !== 'Mora');
  }
  if (targetEntries.length === 0) {
    targetEntries = allEntries;
  }

  let totalRequired = 0;
  let totalDeficit = 0;
  const deficitsByMaterial: Record<string, number> = {};

  for (const [matKey, reqQty] of targetEntries) {
    const ownedQty = Math.max(0, recordedInventory[matKey] ?? 0);
    const deficit = Math.max(0, reqQty - ownedQty);
    totalRequired += reqQty;
    totalDeficit += deficit;
    deficitsByMaterial[matKey] = deficit;
  }

  if (totalDeficit <= 0 || totalRequired <= 0) {
    return {
      deficitRatio: 0,
      totalRequired,
      totalDeficit: 0,
      deficitsByMaterial,
      inventoryStatus,
    };
  }

  const deficitRatio = roundToTwo(
    Math.min(1, Math.max(0, totalDeficit / Math.max(1, totalRequired))),
  );

  return {
    deficitRatio,
    totalRequired,
    totalDeficit,
    deficitsByMaterial,
    inventoryStatus,
  };
}

/**
 * 3. Marginal Readiness Impact ($\Delta R_a$):
 * $\Delta R_a = \text{expectedScoreDelta} \times (1.5 \text{ if closesGap else } 1.0)$
 */
export function calculateMarginalImpact(expectedScoreDelta: number, closesGap: boolean): number {
  const clampedDelta = Math.max(0, expectedScoreDelta);
  return roundToTwo(clampedDelta * (closesGap ? 1.5 : 1.0));
}

/**
 * 4. User Goal Priority Weight ($P_a$):
 * $P_a = \max(0.5, 2.0 - 0.25 \times (\text{priority} - 1))$
 */
export function calculatePriorityWeight(priority: number): number {
  const normalizedPriority = Math.max(1, Math.trunc(priority));
  return roundToTwo(Math.max(0.5, 2.0 - 0.25 * (normalizedPriority - 1)));
}

/**
 * 5. Multi-Objective Efficiency ($E_a$):
 * $E_a = \frac{(\Delta R_a \times 0.5 + 50 \times D_a + 20) \times G_a \times P_a}{\text{ResinCost}(a)}$
 * Returns 0 if $D_a = 0$ (materials already owned) or $G_a = 0$ (domain closed today).
 */
export function calculateMultiObjectiveEfficiency(params: {
  marginalImpact: number;
  deficitRatio: number;
  timeGatingFactor: number;
  priorityWeight: number;
  resinPerRun: number;
}): number {
  const { marginalImpact, deficitRatio, timeGatingFactor, priorityWeight, resinPerRun } = params;

  if (deficitRatio <= 0 || timeGatingFactor <= 0) {
    return 0;
  }

  const effectiveResin = resinPerRun > 0 ? resinPerRun : STANDARD_DOMAIN_RESIN;
  const rawNumerator =
    (marginalImpact * 0.5 + 50 * deficitRatio + 20) * timeGatingFactor * priorityWeight;

  return roundToTwo(rawNumerator / effectiveResin);
}

function estimateDesiredRuns(totalDeficitCount: number, actionType: PlannerActionType): number {
  if (totalDeficitCount <= 0) return 0;
  if (actionType === 'overworld_gather') return 1;
  const yieldPerRun = actionType === 'world_boss' ? 2.5 : 3;
  const estimated = Math.ceil(totalDeficitCount / yieldPerRun);
  return Math.max(1, Math.min(MAX_RUNS_PER_ACTION, estimated));
}

// ---------------------------------------------------------------------------
// Candidate Evaluation & Knapsack Optimizer
// ---------------------------------------------------------------------------

export function evaluatePlannerCandidate(
  candidate: PlannerCandidateInput,
  recordedInventory: Readonly<Record<string, number>>,
  dayOfWeek: number,
  isInventoryKnown = true,
): EvaluatedPlannerCandidate {
  const {
    factor: timeGatingFactor,
    isTimeGated,
    isOpenToday,
  } = calculateTimeGatingFactor(candidate.openDays, dayOfWeek, candidate.actionType);

  const tomorrowDay = (dayOfWeek + 1) % 7;
  const isOpenTomorrow =
    tomorrowDay === SUNDAY_INDEX ||
    candidate.openDays.length >= 7 ||
    candidate.openDays.includes(tomorrowDay);

  const deficitResult = calculateMaterialDeficitWeight(
    candidate.requiredMaterials,
    recordedInventory,
    candidate.domainDropKeys,
    isInventoryKnown,
  );

  const marginalImpact = calculateMarginalImpact(candidate.expectedScoreDelta, candidate.closesGap);

  const priorityWeight = calculatePriorityWeight(candidate.goalPriority);

  const efficiencyScore = calculateMultiObjectiveEfficiency({
    marginalImpact,
    deficitRatio: deficitResult.deficitRatio,
    timeGatingFactor,
    priorityWeight,
    resinPerRun: candidate.resinPerRun,
  });

  const minutesPerRun = ACTION_MINUTES_PER_RUN[candidate.actionType] ?? 2.5;
  const desiredRuns =
    deficitResult.deficitRatio > 0
      ? estimateDesiredRuns(deficitResult.totalDeficit, candidate.actionType)
      : 0;

  return {
    candidateId: candidate.candidateId,
    goalId: candidate.goalId,
    actionType: candidate.actionType,
    targetKey: candidate.targetKey,
    talentType: candidate.talentType ?? null,
    domainKey: candidate.domainKey ?? null,
    domainName: candidate.domainName,
    resourceName: candidate.resourceName,
    openDays: candidate.openDays,
    resinPerRun: candidate.resinPerRun,
    minutesPerRun,
    goalPriority: candidate.goalPriority,
    priorityWeight,
    timeGatingFactor,
    isTimeGated,
    isOpenToday,
    isOpenTomorrow,
    materialDeficitRatio: deficitResult.deficitRatio,
    totalRequiredCount: deficitResult.totalRequired,
    totalDeficitCount: deficitResult.totalDeficit,
    deficitsByMaterial: deficitResult.deficitsByMaterial,
    marginalImpact,
    expectedScoreDelta: candidate.expectedScoreDelta,
    closesGap: candidate.closesGap,
    efficiencyScore,
    desiredRuns,
    inventoryStatus: deficitResult.inventoryStatus,
  };
}

/**
 * Executes the multi-objective knapsack allocation across resin and session-time
 * constraints and synthesizes structured alternative pathways.
 */
export function optimizePlannerSchedule(
  input: OptimizationPlannerCalculationInput,
): OptimizationPlannerCalculationResult {
  const currentResin = Math.max(0, Math.trunc(input.currentResin));

  let effectiveResinBudget = currentResin;
  if (typeof input.dailyResinBudget === 'number' && Number.isFinite(input.dailyResinBudget)) {
    effectiveResinBudget = Math.min(
      effectiveResinBudget,
      Math.max(0, Math.trunc(input.dailyResinBudget)),
    );
  }
  if (typeof input.customResinBudget === 'number' && Number.isFinite(input.customResinBudget)) {
    effectiveResinBudget = Math.min(
      effectiveResinBudget,
      Math.max(0, Math.trunc(input.customResinBudget)),
    );
  }

  const timeBudgetMinutes =
    typeof input.timeBudgetMinutes === 'number' && Number.isFinite(input.timeBudgetMinutes)
      ? Math.max(5, input.timeBudgetMinutes)
      : DEFAULT_TIME_BUDGET_MINUTES;

  const focusSet =
    input.focusGoalIds && input.focusGoalIds.length > 0 ? new Set(input.focusGoalIds) : null;

  const filteredCandidates = focusSet
    ? input.candidates.filter((c) => c.goalId !== null && focusSet.has(c.goalId))
    : input.candidates;

  const isInventoryKnown = input.isInventoryKnown ?? true;
  const evaluatedCandidates = filteredCandidates.map((c) =>
    evaluatePlannerCandidate(c, input.recordedInventory, input.dayOfWeek, isInventoryKnown),
  );

  // Eligible for today's primary resin allocation: open today, positive deficit, positive efficiency
  const openViable = evaluatedCandidates
    .filter((c) => c.isOpenToday && c.materialDeficitRatio > 0 && c.efficiencyScore > 0)
    .sort(
      (a, b) =>
        b.efficiencyScore - a.efficiencyScore ||
        a.goalPriority - b.goalPriority ||
        (a.candidateId < b.candidateId ? -1 : a.candidateId > b.candidateId ? 1 : 0),
    );

  const rankedPlan: CalculatedOptimizationAction[] = [];
  let remainingResin = effectiveResinBudget;
  let remainingMinutes = timeBudgetMinutes;

  for (const cand of openViable) {
    if (remainingResin <= 0 || remainingMinutes <= 0) break;
    if (cand.resinPerRun <= 0) continue;

    const maxByResin = Math.floor(remainingResin / cand.resinPerRun);
    const maxByTime = Math.floor(remainingMinutes / cand.minutesPerRun);
    const runs = Math.min(MAX_RUNS_PER_ACTION, cand.desiredRuns, maxByResin, maxByTime);

    if (runs <= 0) continue;

    const resinCost = runs * cand.resinPerRun;
    const estimatedMinutes = roundToTwo(runs * cand.minutesPerRun);

    remainingResin -= resinCost;
    remainingMinutes = roundToTwo(Math.max(0, remainingMinutes - estimatedMinutes));

    rankedPlan.push({
      actionId: `plan_${cand.candidateId}`,
      goalId: cand.goalId,
      actionType: cand.actionType,
      targetKey: cand.targetKey,
      talentType: cand.talentType,
      domainName: cand.domainName,
      resourceName: cand.resourceName,
      runs,
      resinCost,
      estimatedMinutes,
      efficiencyScore: cand.efficiencyScore,
      timeGated: cand.isTimeGated,
      materialDeficitRatio: cand.materialDeficitRatio,
      marginalScoreDelta: cand.expectedScoreDelta,
      closesReadinessGap: cand.closesGap,
      priority: cand.goalPriority,
      inventoryStatus: cand.inventoryStatus,
    });
  }

  const allocatedResin = effectiveResinBudget - remainingResin;
  const totalEstimatedMinutes = roundToTwo(timeBudgetMinutes - remainingMinutes);

  // -------------------------------------------------------------------------
  // Synthesize Alternative Pathways (A: Condensed Speedrun, B: Overworld Prep, C: Secondary Goal)
  // -------------------------------------------------------------------------
  const alternatives: CalculatedOptimizationAlternative[] = [];

  // Alternative Path A: Speedrun / Condensed Resin on highest-E_a 20-resin domain
  const topDomainCandidate = openViable.find(
    (c) =>
      (c.actionType === 'domain_talent' ||
        c.actionType === 'domain_weapon' ||
        c.actionType === 'domain_artifact') &&
      c.resinPerRun === STANDARD_DOMAIN_RESIN,
  );
  if (topDomainCandidate && effectiveResinBudget >= CONDENSED_RESIN_COST) {
    const condensedRuns = Math.min(
      MAX_RUNS_PER_ACTION,
      Math.floor(effectiveResinBudget / CONDENSED_RESIN_COST),
      Math.max(1, Math.floor(timeBudgetMinutes / CONDENSED_DOMAIN_MINUTES)),
    );
    if (condensedRuns > 0) {
      const condensedResin = condensedRuns * CONDENSED_RESIN_COST;
      const condensedMinutes = roundToTwo(condensedRuns * CONDENSED_DOMAIN_MINUTES);
      alternatives.push({
        kind: 'speedrun_condensed',
        totalResinCost: condensedResin,
        totalEstimatedMinutes: condensedMinutes,
        actions: [
          {
            actionId: `alt_condensed_${topDomainCandidate.candidateId}`,
            goalId: topDomainCandidate.goalId,
            actionType: topDomainCandidate.actionType,
            targetKey: topDomainCandidate.targetKey,
            talentType: topDomainCandidate.talentType,
            domainName: topDomainCandidate.domainName,
            resourceName: topDomainCandidate.resourceName,
            runs: condensedRuns,
            resinCost: condensedResin,
            estimatedMinutes: condensedMinutes,
            efficiencyScore: topDomainCandidate.efficiencyScore,
            timeGated: topDomainCandidate.isTimeGated,
            materialDeficitRatio: topDomainCandidate.materialDeficitRatio,
            marginalScoreDelta: topDomainCandidate.expectedScoreDelta,
            closesReadinessGap: topDomainCandidate.closesGap,
            priority: topDomainCandidate.goalPriority,
            isCondensed: true,
          },
        ],
      });
    }
  }

  // Alternative Path B: Zero-Resin Overworld Preparation (for tomorrow's closed domain or top deficit goal)
  const tomorrowCandidate =
    evaluatedCandidates.find(
      (c) => !c.isOpenToday && c.isOpenTomorrow && c.materialDeficitRatio > 0,
    ) ?? evaluatedCandidates.find((c) => c.materialDeficitRatio > 0);

  if (tomorrowCandidate) {
    const prepMinutes = Math.min(timeBudgetMinutes, ACTION_MINUTES_PER_RUN.overworld_gather);
    alternatives.push({
      kind: 'overworld_prep',
      totalResinCost: 0,
      totalEstimatedMinutes: prepMinutes,
      actions: [
        {
          actionId: `alt_overworld_${tomorrowCandidate.candidateId}`,
          goalId: tomorrowCandidate.goalId,
          actionType: 'overworld_gather',
          targetKey: tomorrowCandidate.targetKey,
          talentType: tomorrowCandidate.talentType,
          domainName: tomorrowCandidate.domainName,
          resourceName: tomorrowCandidate.resourceName,
          runs: 1,
          resinCost: 0,
          estimatedMinutes: prepMinutes,
          efficiencyScore: roundToTwo(Math.max(10, tomorrowCandidate.materialDeficitRatio * 50)),
          timeGated: false,
          materialDeficitRatio: tomorrowCandidate.materialDeficitRatio,
          marginalScoreDelta: tomorrowCandidate.expectedScoreDelta,
          closesReadinessGap: tomorrowCandidate.closesGap,
          priority: tomorrowCandidate.goalPriority,
        },
      ],
    });
  }

  // Alternative Path C: Secondary Goal Focus (#2 ranked open candidate)
  if (openViable.length >= 2) {
    const secondary = openViable[1]!;
    const maxSecRuns = Math.min(
      MAX_RUNS_PER_ACTION,
      secondary.desiredRuns,
      Math.floor(effectiveResinBudget / secondary.resinPerRun),
      Math.floor(timeBudgetMinutes / secondary.minutesPerRun),
    );
    if (maxSecRuns > 0) {
      const secResin = maxSecRuns * secondary.resinPerRun;
      const secMinutes = roundToTwo(maxSecRuns * secondary.minutesPerRun);
      alternatives.push({
        kind: 'secondary_goal',
        totalResinCost: secResin,
        totalEstimatedMinutes: secMinutes,
        actions: [
          {
            actionId: `alt_secondary_${secondary.candidateId}`,
            goalId: secondary.goalId,
            actionType: secondary.actionType,
            targetKey: secondary.targetKey,
            talentType: secondary.talentType,
            domainName: secondary.domainName,
            resourceName: secondary.resourceName,
            runs: maxSecRuns,
            resinCost: secResin,
            estimatedMinutes: secMinutes,
            efficiencyScore: secondary.efficiencyScore,
            timeGated: secondary.isTimeGated,
            materialDeficitRatio: secondary.materialDeficitRatio,
            marginalScoreDelta: secondary.expectedScoreDelta,
            closesReadinessGap: secondary.closesGap,
            priority: secondary.goalPriority,
          },
        ],
      });
    }
  }

  return {
    currentResin,
    effectiveResinBudget,
    allocatedResin,
    unallocatedResin: remainingResin,
    timeBudgetMinutes,
    totalEstimatedMinutes,
    dayOfWeek: input.dayOfWeek,
    evaluatedCandidates,
    rankedPlan,
    alternatives,
  };
}
