import type { UpgradeGoal } from '@prisma/client';
import type { GoalType } from '@prisma/client';

import type { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import { compareGoals, duplicateGoalIds } from '../../../../platform/companion/goal-policy.js';
import type { CharacterRecommendation } from '../character-intelligence/character-intelligence.service.js';

// -------------------------------------------------------
// Public types
// -------------------------------------------------------

export interface ScoredGoal {
  goal: UpgradeGoal;
  totalScore: number;
  baseScore: number;
  timeGatedBonus: number;
  characterPriorityWeight: number;
  /** Resin cost per single domain/boss run */
  resinPerRun: number;
  /** Name of the domain or source to farm */
  sourceName: string;
  /** Whether the source is only available certain days (talent/weapon domains) */
  isTimeGated: boolean;
  /** Character key associated with this goal (for the explainer) */
  characterKey: string;
  /** Character intelligence score (lower = needs more work) */
  characterScore: number;
  /** The book or material group name (for the explainer) */
  resourceName: string;
}

export interface RouteItem {
  goalId: string;
  targetKey: string;
  goalType: GoalType;
  talentType: string | null;
  domainName: string;
  resinCost: number;
  runs: number;
  totalScore: number;
  isTimeGated: boolean;
  characterKey: string;
  characterScore: number;
  resourceName: string;
}

export interface PlannerCalculatorResult {
  route: RouteItem[];
  unallocatedResin: number;
}

// -------------------------------------------------------
// Constants
// -------------------------------------------------------

const MAX_RUNS_PER_GOAL = 5;
const BASE_SCORE = 50;
const TIME_GATE_BONUS = 20;
const SUNDAY = 6;

// -------------------------------------------------------
// Pure public API
// -------------------------------------------------------

/**
 * Filters an `UpgradeGoal[]` to only those that can be progressed today.
 * Returns `ScoredGoal[]` with scoring data attached.
 *
 * @param goals - All upgrade goals for the user.
 * @param dayOfWeek - UTC day index: 0=Monday … 6=Sunday.
 * @param characterRankings - Output from CharacterIntelligenceService.
 */
export function filterAndScoreGoals(
  goals: UpgradeGoal[],
  dayOfWeek: number,
  characterRankings: CharacterRecommendation[],
  provider: ICompanionProvider = companionRegistry.getProvider('genshin'),
): ScoredGoal[] {
  // Profile/ranking evidence is unverified; retain neutral priority.
  void characterRankings;

  const result: ScoredGoal[] = [];
  const duplicates = duplicateGoalIds(goals);

  for (const goal of goals) {
    if (goal.status !== 'active' || duplicates.has(goal.id)) continue;
    const advice = provider.getGoalAdvice(goal);
    if (!advice.available || !advice.route.available) continue;
    const domain = advice.route.domain;
    if (!domain.days.includes(dayOfWeek)) continue;
    const sourceName = domain.name;
    const resinPerRun = domain.resinPerClaim;
    const isTimeGated = domain.days.length < 7 && dayOfWeek !== SUNDAY;
    const characterKey = goal.targetKey;
    const resourceName = domain.drops.join(', ');
    const rawCharScore = 50;
    const characterPriorityWeight = 50;

    const timeGatedBonus = isTimeGated ? TIME_GATE_BONUS : 0;
    const totalScore = BASE_SCORE + timeGatedBonus + characterPriorityWeight;

    result.push({
      goal,
      totalScore,
      baseScore: BASE_SCORE,
      timeGatedBonus,
      characterPriorityWeight,
      resinPerRun,
      sourceName,
      isTimeGated,
      characterKey,
      characterScore: rawCharScore,
      resourceName,
    });
  }

  return result;
}

/**
 * Allocates available resin across the scored goals, from highest to lowest priority.
 * Each goal can receive up to MAX_RUNS_PER_GOAL runs before moving to the next.
 *
 * @param scoredGoals - Output of `filterAndScoreGoals`, already sorted descending.
 * @param currentResin - Projected current resin (0–200).
 */
export function allocateResin(
  scoredGoals: ScoredGoal[],
  currentResin: number,
): PlannerCalculatorResult {
  const sorted = [...scoredGoals].sort((a, b) => compareGoals(a.goal, b.goal));

  const route: RouteItem[] = [];
  let remainingResin = currentResin;

  for (const sg of sorted) {
    if (remainingResin <= 0) break;

    const maxAffordableRuns = Math.floor(remainingResin / sg.resinPerRun);
    const runs = Math.min(maxAffordableRuns, MAX_RUNS_PER_GOAL);
    if (runs === 0) continue;

    const resinCost = runs * sg.resinPerRun;
    remainingResin -= resinCost;

    route.push({
      goalId: sg.goal.id,
      targetKey: sg.goal.targetKey,
      goalType: sg.goal.goalType,
      talentType: sg.goal.talentType,
      domainName: sg.sourceName,
      resinCost,
      runs,
      totalScore: sg.totalScore,
      isTimeGated: sg.isTimeGated,
      characterKey: sg.characterKey,
      characterScore: sg.characterScore,
      resourceName: sg.resourceName,
    });
  }

  return {
    route,
    unallocatedResin: remainingResin,
  };
}
