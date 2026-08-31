import { prisma } from '@/core/db/prisma.js';
import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';
import type { NikkeAccount } from '@prisma/client';

export class NikkeAccountService {
  async getAccountByUserId(userId: string): Promise<NikkeAccount> {
    const account = await prisma.nikkeAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      throw new NotFoundError('NIKKE account not found for this user.');
    }
    return account;
  }

  async createAccount(
    userId: string,
    commanderName?: string,
    commanderLevel?: number,
  ): Promise<NikkeAccount> {
    const existing = await prisma.nikkeAccount.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictError('User already has a NIKKE account.');
    }

    return prisma.nikkeAccount.create({
      data: {
        userId,
        commanderName,
        commanderLevel,
      },
    });
  }
}

export const nikkeAccountService = new NikkeAccountService();
