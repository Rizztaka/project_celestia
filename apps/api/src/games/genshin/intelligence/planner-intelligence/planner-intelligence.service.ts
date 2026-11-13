import {
  type AdviceAvailability,
  type OptimizationPlannerRequestInput,
  optimizationPlannerRequestSchema,
  type OptimizationPlannerResponse,
  optimizationPlannerResponseSchema,
  type PlannerActionType,
} from '@celestia/api-contracts';
import type { UpgradeGoal } from '@prisma/client';

import type { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';
import { prisma } from '@/core/db/prisma.js';
import { NotFoundError, UnprocessableError } from '@/core/errors/app-error.js';

import { companionRegistry } from '../../../../platform/companion/companion-registry.service.js';
import {
  duplicateGoalIds,
  duplicateGoalReason,
} from '../../../../platform/companion/goal-policy.js';
import { RoutineRepository } from '../../../../platform/companion/routine.repository.js';
import { RoutineService } from '../../../../platform/companion/routine.service.js';
import {
  AccountContextProvider,
  type Artifact,
} from '../../account-data/account-context-provider.service.js';
import type { CharacterWithWeapon } from '../../characters/character.repository.js';
import { GenshinRecordedStockRepository } from '../../companion/recorded-stock.repository.js';
import { calculateMarginalInvestment } from '../marginal-investment/marginal-investment.calculator.js';
import { buildAuthenticatedReadinessInput } from '../readiness-intelligence/readiness-input.adapter.js';
import { TeamIntelligenceService } from '../team-intelligence/team-intelligence.service.js';
import { discoverAutonomousProgression } from './autonomous-progression.calculator.js';
import {
  optimizePlannerSchedule,
  type PlannerCandidateInput,
  WORLD_BOSS_RESIN,
} from './planner-optimization.calculator.js';
import {
  explainOptimizationAlternative,
  explainOptimizationSummary,
  toOptimizationPlanAction,
} from './planner-optimization.explainer.js';

// -------------------------------------------------------
// Response types
// -------------------------------------------------------

export interface PlannerRouteItem {
  goalId: string;
  targetKey: string;
  goalType: string;
  talentType: string | null;
  domainName: string;
  resinCost: number;
  runs: number;
  efficiencyScore?: number;
  estimatedMinutes?: number;
  materialDeficitRatio?: number;
  explanations: string[];
}

export interface PlannerIntelligenceResponse {
  goals: AdviceAvailability[];
  allocationBasis: 'resin_budget';
  currentResin: number;
  effectiveResinBudget?: number;
  timeUntilCapped: string;
  route: PlannerRouteItem[];
  unallocatedResin: number;
  analysedAt: string;
  optimization?: OptimizationPlannerResponse;
}

// -------------------------------------------------------
// Helpers
// -------------------------------------------------------

function formatTimeUntilCapped(capTime: string | null, now: Date): string {
  if (capTime === null) return 'Capped';
  const msRemaining = new Date(capTime).getTime() - now.getTime();
  if (msRemaining <= 0) return 'Capped';
  const totalMinutes = Math.ceil(msRemaining / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h === 0 ? `${m}m` : `${h}h ${m}m`;
}

function resolveActionType(goalType: string): PlannerActionType {
  if (goalType === 'WEAPON_ASCENSION') return 'domain_weapon';
  if (goalType === 'CHARACTER_ASCENSION') return 'world_boss';
  return 'domain_talent';
}

function evaluateGoalMarginalDelta(params: {
  goal: UpgradeGoal;
  rawRoster: ReadonlyArray<CharacterWithWeapon>;
  artifacts: ReadonlyArray<Artifact>;
}): { expectedScoreDelta: number; closesGap: boolean } {
  const { goal, rawRoster, artifacts } = params;

  const targetChar =
    goal.goalType === 'WEAPON_ASCENSION'
      ? rawRoster.find((c) => c.equippedWeapon?.weaponKey === goal.targetKey)
      : rawRoster.find((c) => c.characterKey === goal.targetKey);

  if (!targetChar) {
    return { expectedScoreDelta: 12, closesGap: false };
  }

  try {
    const readinessInput = buildAuthenticatedReadinessInput(targetChar, artifacts);
    const margResult = calculateMarginalInvestment({
      character: readinessInput.character,
    });

    const matchedCandidate = margResult.rankedUpgrades.find((u) => {
      if (goal.goalType === 'CHARACTER_TALENT') {
        return u.category === 'talent' && (!goal.talentType || u.target === goal.talentType);
      }
      if (goal.goalType === 'WEAPON_ASCENSION') {
        return u.category === 'weapon_level' || u.category === 'weapon_ascension';
      }
      if (goal.goalType === 'CHARACTER_ASCENSION') {
        return u.category === 'character_ascension' || u.category === 'character_level';
      }
      return false;
    });

    if (matchedCandidate) {
      return {
        expectedScoreDelta: Math.max(0, matchedCandidate.expectedScoreDelta),
        closesGap: matchedCandidate.closesGap,
      };
    }

    if (margResult.recommendedNextAction) {
      return {
        expectedScoreDelta: Math.max(0, margResult.recommendedNextAction.expectedScoreDelta),
        closesGap: margResult.recommendedNextAction.closesGap,
      };
    }
  } catch {
    // Safe fallback if character benchmark is not modeled
  }

  return { expectedScoreDelta: 10, closesGap: false };
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class PlannerIntelligenceService {
  private _routineService: RoutineService | null;
  private readonly accountContextProvider: AccountContextProvider;
  private readonly stockRepository: GenshinRecordedStockRepository;
  private readonly teamService: TeamIntelligenceService;

  constructor(
    accountContextProvider = new AccountContextProvider(),
    stockRepository = new GenshinRecordedStockRepository(),
    routineService: RoutineService | null = null,
    teamService = new TeamIntelligenceService(),
  ) {
    this.accountContextProvider = accountContextProvider;
    this.stockRepository = stockRepository;
    this._routineService = routineService;
    this.teamService = teamService;
  }

  private get routineService(): RoutineService {
    if (!this._routineService) {
      const provider: ICompanionProvider = companionRegistry.getProvider('genshin');
      this._routineService = new RoutineService(new RoutineRepository(), provider);
    }
    return this._routineService;
  }

  /**
   * Computes the full multi-objective optimization plan (`OptimizationPlannerResponse`)
   * incorporating resin budgets, time budgets, recorded material inventory deficits,
   * weekday domain time-gating, goal priorities/dismissals, and marginal readiness ROI.
   */
  async getOptimizedPlan(
    userId: string,
    options?: OptimizationPlannerRequestInput,
  ): Promise<OptimizationPlannerResponse> {
    const parsedOptions = optimizationPlannerRequestSchema.parse(options ?? {});
    const { optimization } = await this.computeUnifiedPlannerState(userId, parsedOptions, false);
    return optimization;
  }

  /**
   * Returns an optimised daily farming route for the authenticated user.
   * Retains full backwards compatibility with the `GET /intelligence/planner` contract
   * while powered by the real multi-objective optimization engine.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if server not selected, resin unknown, or no active goals
   *    exist when stored goals are present.
   */
  async getRecommendations(
    userId: string,
    options?: OptimizationPlannerRequestInput,
  ): Promise<PlannerIntelligenceResponse> {
    const parsedOptions = optimizationPlannerRequestSchema.parse(options ?? {});
    const { response } = await this.computeUnifiedPlannerState(userId, parsedOptions, true);
    return response;
  }

  private async computeUnifiedPlannerState(
    userId: string,
    options: OptimizationPlannerRequestInput,
    requireActiveGoalsIfStored = false,
  ): Promise<{
    response: PlannerIntelligenceResponse;
    optimization: OptimizationPlannerResponse;
  }> {
    // 1. Resolve account context & roster (throws NotFoundError if no Genshin account exists)
    let rawRoster: CharacterWithWeapon[] = [];
    let artifacts: Artifact[] = [];

    try {
      const accountCtx = await this.accountContextProvider.getForUser(userId);
      rawRoster = accountCtx.rawRoster;
      artifacts = accountCtx.artifacts;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      const account = await prisma.genshinAccount.findUnique({ where: { userId } });
      if (!account) {
        throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
      }
    }

    // 2. Fetch V2 routine snapshot & verify server weekday and known resin
    const snapshot = await this.routineService.getSnapshot(userId);
    const now = new Date(snapshot.serverNow);

    const provider = companionRegistry.getProvider('genshin');
    const dayOfWeek = provider.getServerWeekday(snapshot.serverId, now);
    if (dayOfWeek === null) {
      throw new UnprocessableError(
        'Server reset tracking is unavailable. Check your server selection in the Daily tab; recommendations need a verified clock.',
      );
    }

    if (!snapshot.resin.known) {
      throw new UnprocessableError(
        'Resin amount is unknown. Open the Daily tab and record your current resin before viewing Planner recommendations.',
      );
    }
    const currentResin = snapshot.resin.currentAmount;

    // 3. Fetch recorded material stock inventory
    let recordedInventory: Record<string, number> = {};
    let isInventoryKnown = false;
    try {
      const stockSnapshot = await this.stockRepository.readForUser(userId);
      if (stockSnapshot?.inventory) {
        recordedInventory = stockSnapshot.inventory;
        isInventoryKnown = Boolean(
          stockSnapshot.stockBasis?.importedAt ||
            stockSnapshot.stockBasis?.source ||
            Object.keys(stockSnapshot.inventory).length > 0,
        );
      }
    } catch {
      recordedInventory = {};
      isInventoryKnown = false;
    }

    // 4. Fetch user plan preferences (dailyResinBudget) & active period goal dismissals
    let dailyResinBudget: number | null = null;
    try {
      const prefs = await prisma.genshinPlanPreferences?.findUnique?.({ where: { userId } });
      if (prefs && typeof prefs.dailyResinBudget === 'number') {
        dailyResinBudget = prefs.dailyResinBudget;
      }
    } catch {
      dailyResinBudget = null;
    }

    const dismissedGoalIds = new Set<string>();
    try {
      const dismissals = await prisma.genshinPlanDismissal?.findMany?.({
        where: { userId },
      });
      if (Array.isArray(dismissals)) {
        const dailyPeriodId = snapshot.period?.dailyPeriodId ?? null;
        const weeklyPeriodId = snapshot.period?.weeklyPeriodId ?? null;
        for (const d of dismissals) {
          if (!d.goalId) continue;
          if (
            (d.scope === 'day' && dailyPeriodId && d.periodId === dailyPeriodId) ||
            (d.scope === 'week' && weeklyPeriodId && d.periodId === weeklyPeriodId)
          ) {
            dismissedGoalIds.add(d.goalId);
          }
        }
      }
    } catch {
      // Non-fatal if dismissals table is not mocked
    }

    // 5. Fetch active upgrade goals
    const rows = await prisma.upgradeGoal.findMany({
      where: { userId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const duplicates = duplicateGoalIds(rows);
    const goals = rows.filter((goal) => goal.status === 'active');

    // If user has existing stored goals in the database but none of them are active,
    // preserve backwards compatibility for legacy goal-based routes
    if (goals.length === 0 && rows.length > 0 && requireActiveGoalsIfStored) {
      throw new UnprocessableError(
        'No active goals. Your routine remains available; manage goals in the Planner.',
      );
    }

    // 6. Build goal availability & optimization candidates
    // 6.1 Derive core team members and endgame bottlenecks for progression priorities
    let teamMemberKeys: string[] = [];
    const bottleneckCharacterKeys = new Set<string>();
    try {
      const topTeams = this.teamService.getRecommendationsForRoster(rawRoster, { limit: 1 });
      if (topTeams.length > 0 && topTeams[0]?.roster) {
        teamMemberKeys = topTeams[0].roster
          .map((slot) => slot.characterKey)
          .filter((key): key is string => typeof key === 'string' && key.length > 0);
      }
      if (rawRoster.length >= 8) {
        const candidateEndgame = this.teamService.buildCandidateEndgameTeams(
          topTeams,
          rawRoster,
          artifacts,
        );
        for (let i = 1; i < candidateEndgame.length; i++) {
          for (const key of candidateEndgame[i]!.memberKeys) {
            if (!teamMemberKeys.includes(key)) {
              bottleneckCharacterKeys.add(key);
            }
          }
        }
      }
    } catch {
      teamMemberKeys = [];
    }

    const availability: AdviceAvailability[] = [];
    const candidates: PlannerCandidateInput[] = [];

    if (goals.length === 0) {
      // Zero manual goals: scan roster autonomously to discover progression upgrades
      const autoDiscovery = discoverAutonomousProgression({
        rawRoster,
        artifacts,
        teamMemberKeys,
        bottleneckCharacterKeys,
      });

      for (const autoCand of autoDiscovery.candidates) {
        candidates.push(autoCand);

        const availableToday = dayOfWeek === 6 || autoCand.openDays.includes(dayOfWeek);

        availability.push({
          goalId: autoCand.candidateId,
          targetKey: autoCand.targetKey,
          available: availableToday,
          reason: availableToday ? null : 'This verified source is closed today.',
        });
      }
    } else {
      for (const goal of goals) {
        if (duplicates.has(goal.id)) {
          availability.push({
            goalId: goal.id,
            targetKey: goal.targetKey,
            available: false,
            reason: duplicateGoalReason,
          });
          continue;
        }

        if (dismissedGoalIds.has(goal.id)) {
          availability.push({
            goalId: goal.id,
            targetKey: goal.targetKey,
            available: false,
            reason: 'Goal is dismissed for the current period.',
          });
          continue;
        }

        const advice = provider.getGoalAdvice(goal);
        const route = advice.available
          ? advice.route
          : { available: false as const, reason: advice.reason };
        const availableToday =
          route.available && (dayOfWeek === 6 || route.domain.days.includes(dayOfWeek));

        availability.push({
          goalId: goal.id,
          targetKey: goal.targetKey,
          available: availableToday,
          reason: !route.available
            ? route.reason
            : !availableToday
              ? 'This verified source is closed today.'
              : null,
        });

        if (!advice.available) continue;

        const { expectedScoreDelta, closesGap } = evaluateGoalMarginalDelta({
          goal,
          rawRoster,
          artifacts,
        });

        if (route.available) {
          candidates.push({
            candidateId: goal.id,
            goalId: goal.id,
            actionType: resolveActionType(goal.goalType),
            targetKey: goal.targetKey,
            talentType: goal.talentType,
            domainKey: route.domain.domainKey,
            domainName: route.domain.name,
            resourceName: route.domain.drops.join(', '),
            openDays: route.domain.days,
            resinPerRun: route.domain.resinPerClaim,
            requiredMaterials: advice.costs,
            domainDropKeys: route.domain.dropKeys,
            goalPriority: goal.priority,
            expectedScoreDelta,
            closesGap,
          });
        } else if (goal.goalType === 'CHARACTER_ASCENSION') {
          candidates.push({
            candidateId: goal.id,
            goalId: goal.id,
            actionType: 'world_boss',
            targetKey: goal.targetKey,
            talentType: null,
            domainKey: 'WorldBoss',
            domainName: 'World Boss',
            resourceName: `${goal.targetKey} Ascension Materials`,
            openDays: [0, 1, 2, 3, 4, 5, 6],
            resinPerRun: WORLD_BOSS_RESIN,
            requiredMaterials: advice.costs,
            goalPriority: goal.priority,
            expectedScoreDelta,
            closesGap,
          });
        }
      }

      // Discover additional autonomous candidates to fill remaining resin/time budget
      const autoDiscovery = discoverAutonomousProgression({
        rawRoster,
        artifacts,
        manualGoals: goals,
        teamMemberKeys,
        bottleneckCharacterKeys,
        yieldToManualGoals: true,
      });

      for (const autoCand of autoDiscovery.candidates) {
        candidates.push(autoCand);
      }
    }

    // 7. Run pure multi-objective knapsack optimization calculator
    const calcResult = optimizePlannerSchedule({
      candidates,
      recordedInventory,
      isInventoryKnown,
      currentResin,
      dailyResinBudget,
      customResinBudget: options.customResinBudget,
      timeBudgetMinutes: options.timeBudgetMinutes,
      dayOfWeek,
      focusGoalIds: options.focusGoalIds,
    });

    // 8. Translate calculator results via pure explainer
    const rankedPlan = calcResult.rankedPlan.map(toOptimizationPlanAction);
    const alternatives = calcResult.alternatives.map(explainOptimizationAlternative);
    const summaryText = explainOptimizationSummary(calcResult);

    const capTime = snapshot.resin.known ? snapshot.resin.capAt : null;
    const timeUntilCapped = formatTimeUntilCapped(capTime, now);
    const analysedAt = now.toISOString();

    const parsedOptimization = optimizationPlannerResponseSchema.parse({
      summary: summaryText,
      currentResin: calcResult.currentResin,
      effectiveResinBudget: calcResult.effectiveResinBudget,
      timeBudgetMinutes: calcResult.timeBudgetMinutes,
      timeUntilCapped,
      rankedPlan,
      alternatives,
      unallocatedResin: calcResult.unallocatedResin,
      totalEstimatedMinutes: calcResult.totalEstimatedMinutes,
      analysedAt,
    });

    const optimization: OptimizationPlannerResponse & { allocatedPlan: typeof rankedPlan } =
      Object.assign(parsedOptimization, { allocatedPlan: rankedPlan });

    const goalById = new Map<string, UpgradeGoal>(goals.map((g) => [g.id, g]));
    const candidateById = new Map<string, PlannerCandidateInput>(
      candidates.map((c) => [c.candidateId, c]),
    );
    const route: PlannerRouteItem[] = rankedPlan.map((action) => {
      const matchedGoal = action.goalId ? goalById.get(action.goalId) : undefined;
      const matchedCand = candidateById.get(action.actionId);
      const resolvedGoalType =
        matchedGoal?.goalType ??
        (action.actionType === 'domain_weapon'
          ? 'WEAPON_ASCENSION'
          : action.actionType === 'world_boss'
            ? 'CHARACTER_ASCENSION'
            : 'CHARACTER_TALENT');
      const resolvedTalentType = matchedGoal?.talentType ?? matchedCand?.talentType ?? null;

      return {
        goalId: action.goalId ?? action.actionId,
        targetKey: action.targetKey,
        goalType: resolvedGoalType,
        talentType: resolvedTalentType,
        domainName: action.domainName,
        resinCost: action.resinCost,
        runs: action.runs,
        efficiencyScore: action.efficiencyScore,
        estimatedMinutes: action.estimatedMinutes,
        materialDeficitRatio: action.materialDeficitRatio,
        explanations: action.explanations,
      };
    });

    const response: PlannerIntelligenceResponse = {
      goals: availability,
      allocationBasis: 'resin_budget',
      currentResin: calcResult.currentResin,
      effectiveResinBudget: calcResult.effectiveResinBudget,
      timeUntilCapped,
      route,
      unallocatedResin: calcResult.unallocatedResin,
      analysedAt,
      optimization,
    };

    return { response, optimization };
  }
}
