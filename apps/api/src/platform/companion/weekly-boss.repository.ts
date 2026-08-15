import { prisma } from '@/core/db/prisma.js';
import type { WeeklyBossState } from '@prisma/client';

export class WeeklyBossRepository {
  /**
   * Returns the user's WeeklyBossState row, or null if it has never been created.
   * The service is responsible for interpreting null as "no defeats this week".
   */
  async findByUserId(userId: string): Promise<WeeklyBossState | null> {
    return prisma.weeklyBossState.findUnique({ where: { userId } });
  }

  /**
   * Upserts the WeeklyBossState row for the given user, setting the
   * defeatedBossKeys and weeklyResetAt to the provided values.
   *
   * Called in two scenarios:
   *  1. Lazy weekly reset: both defeatedBossKeys (→ []) and weeklyResetAt are updated.
   *  2. Boss toggle: only defeatedBossKeys is updated (weeklyResetAt unchanged).
   */
  async upsert(
    userId: string,
    defeatedBossKeys: string[],
    weeklyResetAt: Date,
  ): Promise<WeeklyBossState> {
    return prisma.weeklyBossState.upsert({
      where: { userId },
      create: { userId, defeatedBossKeys, weeklyResetAt },
      update: { defeatedBossKeys, weeklyResetAt },
    });
  }
}
