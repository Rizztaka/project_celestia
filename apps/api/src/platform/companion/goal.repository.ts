import { Prisma, type PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { ConflictError, UnauthorizedError } from '@/core/errors/app-error.js';

export class GoalRepository {
  constructor(private readonly db: PrismaClient = prisma) {}
  findAllByUserId(userId: string, db: Prisma.TransactionClient = this.db) {
    return db.upgradeGoal.findMany({
      where: { userId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    });
  }

  findByIdAndUserId(id: string, userId: string) {
    return this.db.upgradeGoal.findFirst({ where: { id, userId } });
  }

  async write<T>(userId: string, apply: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.db.$transaction(
        async (tx) => {
          const owners = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
          if (owners.length !== 1) throw new UnauthorizedError();
          return apply(tx);
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
          maxWait: 10000,
          timeout: 20000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2002', 'P2034'].includes(error.code)
      )
        throw new ConflictError(
          'This intent changed or the request was already used. Refresh and review before saving again.',
        );
      throw error;
    }
  }
}
