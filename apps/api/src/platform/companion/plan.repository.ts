import type {
  GenshinPlanDismissal,
  GenshinPlanPreferences,
  GenshinRoutineState,
  Prisma,
  PrismaClient,
  UpgradeGoal,
} from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export interface PlanContext {
  preferences: GenshinPlanPreferences | null;
  dismissals: GenshinPlanDismissal[];
  goals: UpgradeGoal[];
  routine: GenshinRoutineState | null;
}
type JsonRow<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K];
};

export class PlanRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  /** A single MVCC statement: no transactions, locks, initialization or cleanup on GET. */
  async read(userId: string, db: Prisma.TransactionClient = this.db): Promise<PlanContext> {
    const [row] = await db.$queryRaw<
      {
        preferences: GenshinPlanPreferences | null;
        dismissals: GenshinPlanDismissal[];
        goals: JsonRow<UpgradeGoal>[];
        routine: JsonRow<GenshinRoutineState> | null;
      }[]
    >`
      SELECT (SELECT to_jsonb(p) FROM genshin_plan_preferences p WHERE p."userId" = u.id) AS preferences,
        COALESCE((SELECT jsonb_agg(d ORDER BY d."sourceKey", d.scope) FROM genshin_plan_dismissals d WHERE d."userId" = u.id), '[]'::jsonb) AS dismissals,
        COALESCE((SELECT jsonb_agg(g ORDER BY g.priority, g."createdAt", g.id) FROM upgrade_goals g WHERE g."userId" = u.id), '[]'::jsonb) AS goals,
        (SELECT to_jsonb(r) FROM genshin_routine_state r WHERE r."userId" = u.id) AS routine
      FROM users u WHERE u.id = ${userId}
    `;
    if (!row) return { preferences: null, dismissals: [], goals: [], routine: null };
    // Prisma's timestamp-without-time-zone columns store UTC. PostgreSQL JSON
    // omits the zone; parsing that as local time would shift reset/checkpoint dates.
    const date = (value: string | null) =>
      value === null ? null : new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`);
    return {
      ...row,
      goals: row.goals.map((goal) => ({
        ...goal,
        createdAt: date(goal.createdAt)!,
        updatedAt: date(goal.updatedAt)!,
        completedAt: date(goal.completedAt),
      })),
      routine: row.routine
        ? {
            ...row.routine,
            createdAt: date(row.routine.createdAt)!,
            updatedAt: date(row.routine.updatedAt)!,
            dailyPeriodStart: date(row.routine.dailyPeriodStart),
            weeklyPeriodStart: date(row.routine.weeklyPeriodStart),
            resinRecordedAt: date(row.routine.resinRecordedAt),
            transformerLastUsedAt: date(row.routine.transformerLastUsedAt),
          }
        : null,
    };
  }
}
