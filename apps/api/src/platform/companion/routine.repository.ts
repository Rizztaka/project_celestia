/**
 * routine.repository.ts — Data access layer for GenshinRoutineState.
 *
 * All writes go through the service layer's atomic algorithm which:
 *   1. Acquires a SELECT ... FOR UPDATE lock on the User row
 *   2. Reads the routine row within the transaction
 *   3. Validates concurrency fields (revision, period IDs)
 *   4. Creates or updates the single routine row
 *
 * The repository methods here are thin wrappers; concurrency control
 * lives entirely in RoutineService.
 *
 * See docs/plans/c2a-clock-task-reliability/implementation_plan.md §Atomic write algorithm.
 */

import type { GenshinRoutineState, Prisma, PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

// ============================================================
// Types
// ============================================================

/** Fields that can be updated in a single atomic write. */
export type RoutineStateUpdate = {
  revision: number;
  serverId?: string | null;
  dailyPeriodStart?: Date | null;
  commissionsDone?: boolean;
  teapotChecked?: boolean;
  transformerLastUsedAt?: Date | null;
  resinAmount?: number | null;
  resinRecordedAt?: Date | null;
  weeklyPeriodStart?: Date | null;
  weeklyRewardClaims?: number | null;
};

/** Fields passed to the initial row creation. */
export type RoutineStateCreate = RoutineStateUpdate & {
  userId: string;
};

// ============================================================
// Repository
// ============================================================

export class RoutineRepository {
  constructor(private readonly db: PrismaClient = prisma) {}
  /**
   * Reads the routine state row for the given user, or null if no row exists.
   * This is a read-only SELECT — it never creates or updates the row.
   */
  async findByUserId(userId: string): Promise<GenshinRoutineState | null> {
    return this.db.genshinRoutineState.findUnique({ where: { userId } });
  }

  /**
   * Reads the routine state row within an existing Prisma transaction.
   * Used by the atomic write algorithm after the User lock is acquired.
   */
  async findByUserIdInTx(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<GenshinRoutineState | null> {
    return tx.genshinRoutineState.findUnique({ where: { userId } });
  }

  /**
   * Creates the first routine state row for a user, within a transaction.
   * Only called when no row exists — the caller is responsible for
   * checking existence before calling this.
   */
  async createInTx(
    tx: Prisma.TransactionClient,
    data: RoutineStateCreate,
  ): Promise<GenshinRoutineState> {
    return tx.genshinRoutineState.create({
      data: {
        user: { connect: { id: data.userId } },
        revision: data.revision,
        serverId: data.serverId ?? null,
        dailyPeriodStart: data.dailyPeriodStart ?? null,
        commissionsDone: data.commissionsDone ?? false,
        teapotChecked: data.teapotChecked ?? false,
        transformerLastUsedAt: data.transformerLastUsedAt ?? null,
        resinAmount: data.resinAmount ?? null,
        resinRecordedAt: data.resinRecordedAt ?? null,
        weeklyPeriodStart: data.weeklyPeriodStart ?? null,
        weeklyRewardClaims: data.weeklyRewardClaims ?? null,
      },
    });
  }

  /**
   * Updates an existing routine state row, within a transaction.
   * Only called when the row is known to exist — the caller checks.
   */
  async updateInTx(
    tx: Prisma.TransactionClient,
    userId: string,
    data: RoutineStateUpdate,
  ): Promise<GenshinRoutineState> {
    return tx.genshinRoutineState.update({
      where: { userId },
      data,
    });
  }

  /**
   * Reads the legacy DailyCompanion row for a user (read-only).
   * Used to build the V2 legacy summary on GET requests.
   * Returns null if the user has never visited the old planner.
   */
  async findLegacyCompanion(userId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? this.db).dailyCompanion.findUnique({ where: { userId } });
  }

  /**
   * Reads the legacy WeeklyBossState row for a user (read-only).
   * Used to build the V2 legacy summary on GET requests.
   */
  async findLegacyWeeklyBossState(userId: string, tx?: Prisma.TransactionClient) {
    return (tx ?? this.db).weeklyBossState.findUnique({ where: { userId } });
  }
}
