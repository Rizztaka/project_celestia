import { prisma } from '@/core/db/prisma.js';
import type { DailyCompanion, Prisma } from '@prisma/client';

/** Scalar fields the caller can set on creation or update. */
export type CompanionScalars = {
  resinAmount?: number;
  resinUpdatedAt?: Date;
  commissionsDone?: boolean;
  teapotClaimed?: boolean;
  transformerClaimed?: boolean;
  dailyResetAt?: Date;
};

export class DailyCompanionRepository {
  /**
   * Returns the companion record for the given user, or null if it has
   * never been initialised (user has not visited the planner yet).
   */
  async findByUserId(userId: string): Promise<DailyCompanion | null> {
    return prisma.dailyCompanion.findUnique({ where: { userId } });
  }

  /**
   * Creates the companion record if it does not exist, otherwise applies
   * the given partial update atomically.
   *
   * Separating create/update arms avoids Prisma's strict discriminated-union
   * type conflict between DailyCompanionCreateInput and DailyCompanionUpdateInput.
   *
   * Using a single upsert rather than a create/update conditional means the
   * repository is completely idempotent and the service layer never needs to
   * check for existence before writing.
   */
  async upsert(userId: string, data: CompanionScalars): Promise<DailyCompanion> {
    return prisma.dailyCompanion.upsert({
      where: { userId },
      update: data,
      create: {
        user: { connect: { id: userId } },
        ...data,
      },
    });
  }
}
