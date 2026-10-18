import type { AdviceAvailability } from '@celestia/api-contracts';

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
import { allocateResin, filterAndScoreGoals } from './planner-intelligence.calculator.js';
import { explainRouteItem } from './planner-intelligence.explainer.js';

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
  explanations: string[];
}

export interface PlannerIntelligenceResponse {
  goals: AdviceAvailability[];
  allocationBasis: 'resin_budget';
  currentResin: number;
  timeUntilCapped: string;
  route: PlannerRouteItem[];
  unallocatedResin: number;
  analysedAt: string;
}

// -------------------------------------------------------
// Service
// -------------------------------------------------------

export class PlannerIntelligenceService {
  /**
   * Lazy-initialized RoutineService. The provider is resolved on the first
   * request rather than in the constructor, which avoids a bootstrap race
   * where the Genshin route module is imported before the provider is
   * registered in app.ts.
   */
  private _routineService: RoutineService | null = null;

  private get routineService(): RoutineService {
    if (!this._routineService) {
      const provider: ICompanionProvider = companionRegistry.getProvider('genshin');
      this._routineService = new RoutineService(new RoutineRepository(), provider);
    }
    return this._routineService;
  }

  /**
   * Returns an optimised daily farming route for the authenticated user.
   *
   * Throws:
   *  - NotFoundError (404) if the user has no Genshin account.
   *  - UnprocessableError (422) if server not selected, resin unknown, or no goals.
   */
  async getRecommendations(userId: string): Promise<PlannerIntelligenceResponse> {
    // 1. Verify Genshin account exists
    const account = await prisma.genshinAccount.findUnique({ where: { userId } });
    if (!account) {
      throw new NotFoundError('No Genshin Impact account found. Please import your data first.');
    }

    // 2. Fetch the V2 routine snapshot.
    // Sample `now` once and reuse for both the resin projection and the domain weekday.
    const snapshot = await this.routineService.getSnapshot(userId);
    const now = new Date(snapshot.serverNow);

    // 3. Require a selected and available server for domain weekday.
    // provider.getServerWeekday() returns null for unselected or unsupported servers.
    const provider = companionRegistry.getProvider('genshin');
    const dayOfWeek = provider.getServerWeekday(snapshot.serverId, now);
    if (dayOfWeek === null) {
      throw new UnprocessableError(
        'Server reset tracking is unavailable. Check your server selection in the Daily tab; recommendations need a verified clock.',
      );
    }

    // 4. Require a confirmed resin checkpoint.
    // Unknown resin must not be silently treated as zero — that would manufacture advice.
    if (!snapshot.resin.known) {
      throw new UnprocessableError(
        'Resin amount is unknown. Open the Daily tab and record your current resin before viewing Planner recommendations.',
      );
    }
    const currentResin = snapshot.resin.currentAmount;

    // 5. Fetch upgrade goals
    const rows = await prisma.upgradeGoal.findMany({
      where: { userId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
    const duplicates = duplicateGoalIds(rows);
    const goals = rows.filter((goal) => goal.status === 'active');
    if (goals.length === 0) {
      throw new UnprocessableError(
        'No active goals. Your routine remains available; manage goals in the Planner.',
      );
    }

    const availability: AdviceAvailability[] = goals.map((goal) => {
      if (duplicates.has(goal.id))
        return {
          goalId: goal.id,
          targetKey: goal.targetKey,
          available: false,
          reason: duplicateGoalReason,
        };
      const advice = provider.getGoalAdvice(goal);
      const route = advice.available
        ? advice.route
        : { available: false as const, reason: advice.reason };
      const available = route.available && route.domain.days.includes(dayOfWeek);
      return {
        goalId: goal.id,
        targetKey: goal.targetKey,
        available,
        reason: !route.available
          ? route.reason
          : !available
            ? 'This verified source is closed today.'
            : null,
      };
    });
    const scoredGoals = filterAndScoreGoals(
      goals.filter((goal) => !duplicates.has(goal.id)),
      dayOfWeek,
      [],
      provider,
    );

    // 8. Allocate resin
    const { route: rawRoute, unallocatedResin } = allocateResin(scoredGoals, currentResin);

    // 9. Attach explanations
    const route: PlannerRouteItem[] = rawRoute.map((item) => ({
      goalId: item.goalId,
      targetKey: item.targetKey,
      goalType: item.goalType,
      talentType: item.talentType,
      domainName: item.domainName,
      resinCost: item.resinCost,
      runs: item.runs,
      explanations: explainRouteItem(item),
    }));

    // Preserve the checkpoint's partial tick by using the snapshot cap time.
    const capTime = snapshot.resin.known ? snapshot.resin.capAt : null;
    const timeDisplay =
      capTime === null
        ? 'Capped'
        : (() => {
            const msRemaining = new Date(capTime).getTime() - now.getTime();
            if (msRemaining <= 0) return 'Capped';
            const totalMinutes = Math.ceil(msRemaining / 60000);
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return h === 0 ? `${m}m` : `${h}h ${m}m`;
          })();

    return {
      goals: availability,
      allocationBasis: 'resin_budget',
      currentResin,
      timeUntilCapped: timeDisplay,
      route,
      unallocatedResin,
      analysedAt: now.toISOString(),
    };
  }
}
