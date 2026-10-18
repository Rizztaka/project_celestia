import {
  PLAN_ROUTINE_KINDS,
  planCommandSchema,
  type PlanPreferences,
  type PlanRoutineKind,
  type PlanScope,
  type PlanSnapshot,
  type PlanSource,
} from '@celestia/api-contracts';

import type { ICompanionProvider } from '@/core/contracts/companion.interfaces.js';
import { BadRequestError, ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { GoalRepository } from './goal.repository.js';
import { GoalService } from './goal.service.js';
import { type PlanContext, PlanRepository } from './plan.repository.js';
import { composePlanAdvice } from './plan-composition.js';

const routineScope = (kind: PlanRoutineKind): PlanScope =>
  kind === 'commissions' || kind === 'teapot' ? 'day' : 'week';
const sourceKey = (source: PlanSource) =>
  source.kind === 'goal' ? `goal:${source.goalId}` : `routine:${source.routineKind}`;

export class PlanService {
  constructor(
    private readonly provider: ICompanionProvider,
    private readonly repository = new PlanRepository(),
    private readonly writes = new GoalRepository(),
    private readonly goals = new GoalService(),
    private readonly clock: () => Date = () => new Date(),
  ) {}

  project(context: PlanContext, now: Date): PlanSnapshot {
    const routine = this.provider.projectSnapshot({
      routineRow: context.routine,
      legacySummary: null,
      now,
    });
    const preferences: PlanPreferences = {
      enabledRoutineKinds: PLAN_ROUTINE_KINDS.filter((kind) => context.preferences?.[kind]),
      dailyResinBudget: context.preferences?.dailyResinBudget ?? null,
    };
    const dismissed = (key: string, scope: PlanScope, goalRevision: number | null = null) =>
      !!routine.period &&
      context.dismissals.some(
        (item) =>
          item.sourceKey === key &&
          item.scope === scope &&
          item.serverId === routine.serverId &&
          item.goalRevision === goalRevision &&
          item.periodId ===
            (scope === 'day' ? routine.period!.dailyPeriodId : routine.period!.weeklyPeriodId),
      );
    return {
      contractVersion: 1,
      revision: context.preferences?.revision ?? 0,
      serverNow: now.toISOString(),
      routineRevision: routine.revision,
      serverId: routine.serverId,
      period: routine.period,
      preferences,
      goalRevisions: context.goals.map((goal) => ({ id: goal.id, revision: goal.revision })),
      goals: this.goals
        .projectGoals(context.goals)
        .filter((goal) => goal.status === 'active')
        .map((goal) => ({
          goal,
          dismissed: (['day', 'week'] as const).filter((scope) =>
            dismissed(`goal:${goal.id}`, scope, goal.revision),
          ),
        })),
      routines: preferences.enabledRoutineKinds.map((kind) => ({
        kind,
        scope: routineScope(kind),
        task: routine.tasks.find((task) => task.id === kind) ?? null,
        dismissed: dismissed(`routine:${kind}`, routineScope(kind)),
      })),
      weekly: {
        available: routine.period !== null,
        rewardClaims: routine.period ? routine.weeklyClaims.rewardClaims : null,
      },
    };
  }
  async getSnapshot(userId: string) {
    const context = await this.repository.read(userId);
    return this.project(context, this.clock());
  }
  async getAdvice(userId: string) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const before = await this.repository.read(userId);
      const stock = await this.provider.getRecordedStock(userId);
      // Sample at the stock snapshot, not after a potentially slow verification read.
      const now = this.clock();
      const after = await this.repository.read(userId);
      if (JSON.stringify(before) !== JSON.stringify(after)) continue;
      const plan = this.project(before, now);
      const routine = this.provider.projectSnapshot({
        routineRow: before.routine,
        legacySummary: null,
        now,
      });
      return composePlanAdvice(plan, routine, stock, this.provider);
    }
    throw new ConflictError(
      'Your plan changed during this read. Refresh to get a consistent allocation.',
    );
  }
  async update(userId: string, input: unknown): Promise<PlanSnapshot> {
    const parsed = planCommandSchema.safeParse(input);
    if (!parsed.success)
      throw new BadRequestError(parsed.error.errors[0]?.message ?? 'Invalid plan command.');
    const command = parsed.data;
    return this.writes.write(userId, async (tx) => {
      const context = await this.repository.read(userId, tx);
      const now = this.clock(); // after stable owner lock and reads
      const plan = this.project(context, now);
      if (command.expectedRevision !== plan.revision)
        throw new ConflictError(
          'Plan choices changed. Refresh and review your draft before saving again.',
        );
      if (command.action === 'dismissal') {
        const source = command.source;
        if (source.kind === 'goal') {
          const goal = context.goals.find((row) => row.id === source.goalId);
          if (!goal) throw new NotFoundError('Goal not found.');
          if (goal.revision !== source.expectedGoalRevision || goal.status !== 'active')
            throw new ConflictError('This goal changed. Refresh before changing its dismissal.');
        } else if (command.scope !== routineScope(source.routineKind)) {
          throw new BadRequestError('This routine uses a different dismissal period.');
        }
        if (
          command.expectedRoutineRevision !== plan.routineRevision ||
          command.serverId !== plan.serverId
        )
          throw new ConflictError('Routine or server changed. Refresh before changing visibility.');
        if (!plan.period)
          throw new BadRequestError(
            'A supported server period is required for dismissal. Manual goals remain usable.',
          );
        if (
          command.dailyPeriodId !== plan.period.dailyPeriodId ||
          command.weeklyPeriodId !== plan.period.weeklyPeriodId
        )
          throw new ConflictError(
            'The server period changed. Refresh before dismissing or restoring work.',
          );
        const key = { userId, sourceKey: sourceKey(source), scope: command.scope };
        if (command.dismissed) {
          const data = {
            ...key,
            serverId: command.serverId,
            periodId:
              command.scope === 'day' ? plan.period.dailyPeriodId : plan.period.weeklyPeriodId,
            goalId: source.kind === 'goal' ? source.goalId : null,
            goalRevision: source.kind === 'goal' ? source.expectedGoalRevision : null,
            routineKind: source.kind === 'routine' ? source.routineKind : null,
          };
          await tx.genshinPlanDismissal.upsert({
            where: { userId_sourceKey_scope: key },
            create: data,
            update: data,
          });
        } else await tx.genshinPlanDismissal.deleteMany({ where: key });
      }
      const preferences = command.action === 'preferences' ? command.preferences : plan.preferences;
      const data = {
        revision: plan.revision + 1,
        dailyResinBudget: preferences.dailyResinBudget,
        commissions: preferences.enabledRoutineKinds.includes('commissions'),
        teapot: preferences.enabledRoutineKinds.includes('teapot'),
        transformer: preferences.enabledRoutineKinds.includes('transformer'),
        weeklyClaims: preferences.enabledRoutineKinds.includes('weeklyClaims'),
      };
      await tx.genshinPlanPreferences.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
      });
      return this.project(await this.repository.read(userId, tx), now);
    });
  }
}
