import { prisma } from '@/core/db/prisma.js';
import type { GoalType, UpgradeGoal } from '@prisma/client';

export interface CreateGoalData {
  goalType: GoalType;
  targetKey: string;
  fromPhase: number;
  toPhase: number;
  talentType: string | null;
}

export class GoalRepository {
  async findAllByUserId(userId: string): Promise<UpgradeGoal[]> {
    return prisma.upgradeGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<UpgradeGoal | null> {
    return prisma.upgradeGoal.findFirst({ where: { id, userId } });
  }

  async create(userId: string, data: CreateGoalData): Promise<UpgradeGoal> {
    return prisma.upgradeGoal.create({
      data: { userId, ...data },
    });
  }

  async deleteById(id: string): Promise<void> {
    await prisma.upgradeGoal.delete({ where: { id } });
  }
}
