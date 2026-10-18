import type { AdviceAvailability, MaterialAdviceResponse } from '@celestia/api-contracts';
import {
  createGoalSchema,
  type GoalAdvice,
  goalCommandSchema,
  type GoalRecord,
  type GoalWriteResponse,
} from '@celestia/api-contracts';
import type { Prisma, UpgradeGoal } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import {
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableError,
} from '@/core/errors/app-error.js';

import { companionRegistry } from './companion-registry.service.js';
import { GoalRepository } from './goal.repository.js';
import { duplicateGoalIds, duplicateGoalReason, isCurrentGoal, sameIntent } from './goal-policy.js';
import { projectMaterialAdvice } from './material-advice.js';

// -------------------------------------------------------
// Weekday names — the selected game provider supplies the index
// -------------------------------------------------------

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// -------------------------------------------------------
// Material aggregation helpers
// -------------------------------------------------------

// -------------------------------------------------------
// Public service types
// -------------------------------------------------------

export type MaterialDelta = MaterialAdviceResponse;

export interface TodayDomain {
  domainKey: string;
  name: string;
  location: string;
  drops: string[];
  dropKeys: string[];
  relevantToGoals: boolean;
}

export interface TodayResult {
  serverId: string | null;
  goals: AdviceAvailability[];
  availability: { available: boolean; reason: string | null };
  serverDay: string;
  domains: TodayDomain[];
}

// -------------------------------------------------------
// GoalService
// -------------------------------------------------------

export class GoalService {
  constructor(
    private readonly clock: () => Date = () => new Date(),
    private readonly repository: GoalRepository = new GoalRepository(),
  ) {}

  private intent(
    goal: Pick<UpgradeGoal, 'goalType' | 'targetKey' | 'talentType' | 'fromPhase' | 'toPhase'>,
  ) {
    return {
      goalType: goal.goalType,
      targetKey: goal.targetKey,
      talentType: goal.talentType,
      fromPhase: goal.fromPhase,
      toPhase: goal.toPhase,
    };
  }
  private advice(goal: UpgradeGoal, duplicates: Set<string>, gameId: string): GoalAdvice {
    if (duplicates.has(goal.id)) return { available: false, reason: duplicateGoalReason };
    const provider = companionRegistry.getProvider(gameId);
    try {
      provider.validateGoalIntent(this.intent(goal));
    } catch {
      return {
        available: false,
        reason: 'Legacy intent is outside supported type/slot/range limits. Preserved for review.',
      };
    }
    return provider.getGoalAdvice(goal);
  }
  private project(goal: UpgradeGoal, rows: UpgradeGoal[], gameId = 'genshin'): GoalRecord {
    const duplicates = duplicateGoalIds(rows);
    const advice = this.advice(goal, duplicates, gameId);
    return {
      id: goal.id,
      ...this.intent(goal),
      status: goal.status,
      priority: goal.priority,
      revision: goal.revision,
      createdAt: goal.createdAt.toISOString(),
      updatedAt: goal.updatedAt.toISOString(),
      completedAt: goal.completedAt?.toISOString() ?? null,
      completionReason: goal.completionReason as GoalRecord['completionReason'],
      predecessorId: goal.predecessorId,
      needsReview: duplicates.has(goal.id),
      limitations: advice.available ? [] : [advice.reason],
    };
  }
  private ensureUnique(
    rows: UpgradeGoal[],
    intent: Pick<UpgradeGoal, 'goalType' | 'targetKey' | 'talentType'>,
  ) {
    if (rows.some((goal) => isCurrentGoal(goal) && sameIntent(goal, intent)))
      throw new ConflictError(
        'An active or paused goal already has this intent. Review that goal before creating another.',
      );
  }
  async createGoal(userId: string, rawInput: unknown, gameId = 'genshin'): Promise<GoalRecord> {
    if (!rawInput || typeof rawInput !== 'object' || !('contractVersion' in rawInput))
      throw new ConflictError(
        'Goal client update required. Reload to use version 3 and a request ID.',
      );
    const parsed = createGoalSchema.safeParse(rawInput);
    if (!parsed.success)
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid goal input.');
    const { contractVersion: _version, requestId, ...data } = parsed.data;
    void _version;
    const provider = companionRegistry.getProvider(gameId);
    const intent = provider.validateGoalIntent(this.intent(data));
    return this.repository.write(userId, async (tx) => {
      const rows = await this.repository.findAllByUserId(userId, tx);
      if (rows.some((row) => row.createRequestId === requestId))
        throw new ConflictError(
          'This create request was already accepted. Refresh to see its goal.',
        );
      this.ensureUnique(rows, intent);
      if (
        !provider.hasGoalTarget(intent.goalType, intent.targetKey) &&
        !(await provider.ownsGoalTarget(userId, intent, tx))
      )
        throw new BadRequestError(
          'Target must be a supported catalog key or a key in your imported roster/inventory.',
        );
      const saved = await tx.upgradeGoal.create({
        data: { userId, ...data, createRequestId: requestId },
      });
      return this.project(saved, [...rows, saved], gameId);
    });
  }
  async listGoals(userId: string): Promise<GoalRecord[]> {
    const rows = await this.repository.findAllByUserId(userId);
    return this.projectGoals(rows);
  }
  projectGoals(rows: UpgradeGoal[]): GoalRecord[] {
    return rows.map((goal) => this.project(goal, rows));
  }
  async deleteGoal(userId: string, goalId: string): Promise<void> {
    if (!(await this.repository.findByIdAndUserId(goalId, userId)))
      throw new NotFoundError('Goal not found.');
    throw new ConflictError(
      'Goal deletion is retired. Reload and use explicit archive or revisioned edits.',
    );
  }
  async updateGoal(
    userId: string,
    goalId: string,
    input: unknown,
    gameId = 'genshin',
  ): Promise<GoalWriteResponse> {
    const parsed = goalCommandSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid goal command.');
    const command = parsed.data;
    return this.repository.write(userId, async (tx) => {
      const rows = await this.repository.findAllByUserId(userId, tx);
      const goal = rows.find((row) => row.id === goalId);
      if (!goal) throw new NotFoundError('Goal not found.');
      if (goal.revision !== command.expectedRevision)
        throw new ConflictError(
          'Goal changed in another tab. Refresh and review before saving your draft again.',
        );
      const current = isCurrentGoal(goal);
      const invalid = () => {
        throw new ConflictError('This action is not available for the current goal state.');
      };
      let data: Prisma.UpgradeGoalUpdateInput = { revision: { increment: 1 } };
      let successor: UpgradeGoal | null = null;
      switch (command.action) {
        case 'edit':
          if (!current) invalid();
          companionRegistry.getProvider(gameId).validateGoalIntent({
            ...this.intent(goal),
            fromPhase: command.fromPhase,
            toPhase: command.toPhase,
          });
          data = {
            ...data,
            fromPhase: command.fromPhase,
            toPhase: command.toPhase,
            priority: command.priority,
          };
          break;
        case 'priority':
          if (!current) invalid();
          data.priority = command.priority;
          break;
        case 'pause':
          if (goal.status !== 'active') invalid();
          data.status = 'paused';
          break;
        case 'resume':
          if (goal.status !== 'paused') invalid();
          data.status = 'active';
          break;
        case 'complete':
          if (!current) invalid();
          data = {
            ...data,
            status: 'completed',
            completedAt: this.clock(),
            completionReason: command.reason,
          };
          break;
        case 'archive':
          if (goal.status === 'archived') invalid();
          data.status = 'archived';
          break;
        case 'successor': {
          if (current || rows.some((row) => row.predecessorId === goal.id)) invalid();
          this.ensureUnique(rows, goal);
          const intent = companionRegistry.getProvider(gameId).validateGoalIntent({
            ...this.intent(goal),
            fromPhase: command.fromPhase,
            toPhase: command.toPhase,
          });
          successor = await tx.upgradeGoal.create({
            data: { userId, ...intent, priority: command.priority, predecessorId: goal.id },
          });
          break;
        }
      }
      const saved = await tx.upgradeGoal.update({
        where: { id: goal.id, userId, revision: command.expectedRevision },
        data,
      });
      const after = rows.map((row) => (row.id === saved.id ? saved : row));
      if (successor) after.push(successor);
      return {
        goal: this.project(saved, after, gameId),
        successor: successor ? this.project(successor, after, gameId) : null,
      };
    });
  }

  /**
   * Computes the full material delta across all active goals for the user.
   * Returns needed (total from goals), inventory (from GOOD import), and delta (needed - inventory).
   */
  async getMaterialDelta(userId: string, gameId: string = 'genshin'): Promise<MaterialDelta> {
    const rows = await this.repository.findAllByUserId(userId);
    const duplicates = duplicateGoalIds(rows);
    const goals = rows.filter((goal) => goal.status === 'active');
    const provider = companionRegistry.getProvider(gameId);
    return projectMaterialAdvice(
      goals.map((goal) => ({ goal, advice: this.advice(goal, duplicates, gameId) })),
      await provider.getRecordedStock(userId),
    );
  }

  /**
   * Returns today's open domains filtered by the user's active goals.
   * "Today" is determined by the selected server's 04:00 day boundary.
   */
  async getTodayDomains(userId: string, gameId: string = 'genshin'): Promise<TodayResult> {
    // Sample `now` once and pass explicitly — avoids multiple implicit clock reads.
    const now = this.clock();
    const provider = companionRegistry.getProvider(gameId);

    // Look up the user's routine state to determine their server selection.
    // getTodayDomains is a read-only GET — it must never write.
    const routineRow = await prisma.genshinRoutineState.findUnique({ where: { userId } });
    const serverId = routineRow?.serverId ?? null;

    // Use the provider interface to get the server weekday.
    // Returns null if no server is selected or if the clock gate is not closed.
    const todayIndex = provider.getServerWeekday(serverId, now);
    if (todayIndex === null) {
      throw new UnprocessableError(
        "Server reset tracking is unavailable. Check your server selection in the Daily tab; today's domains need a verified clock.",
      );
    }
    const serverDay = DAY_NAMES[todayIndex]!;
    const rows = await this.repository.findAllByUserId(userId);
    const duplicates = duplicateGoalIds(rows);
    const goals = rows.filter((goal) => goal.status === 'active');
    const availability: AdviceAvailability[] = [];
    const domains: TodayDomain[] = [];
    for (const goal of goals) {
      const advice = this.advice(goal, duplicates, gameId);
      const route = advice.available
        ? advice.route
        : { available: false as const, reason: advice.reason };
      const routes = advice.available
        ? (advice.routes ?? (route.available ? [route.domain] : []))
        : [];
      const openRoutes = routes.filter((domain) => domain.days.includes(todayIndex));
      const open = openRoutes.length > 0;
      availability.push({
        goalId: goal.id,
        targetKey: goal.targetKey,
        available: open,
        reason:
          !routes.length && !route.available
            ? route.reason
            : !open
              ? 'This verified source is closed on this server day.'
              : null,
      });
      for (const domain of openRoutes) {
        if (
          !domains.some(
            (d) =>
              d.domainKey === domain.domainKey &&
              d.dropKeys.join(',') === domain.dropKeys.join(','),
          )
        ) {
          const { domainKey, name, location, drops, dropKeys } = domain;
          domains.push({ domainKey, name, location, drops, dropKeys, relevantToGoals: true });
        }
      }
    }
    return {
      serverId,
      serverDay,
      domains,
      goals: availability,
      availability: {
        available: domains.length > 0,
        reason: domains.length
          ? null
          : goals.length === 0
            ? 'No active goals. Your routine remains available.'
            : 'No verified farming sources are available for these goals today. Cost totals remain available for supported upgrades.',
      },
    };
  }
}
