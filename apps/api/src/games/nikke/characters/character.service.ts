import { prisma } from '@/core/db/prisma.js';
import { ConflictError, NotFoundError } from '@/core/errors/app-error.js';
import type { NikkeCharacter } from '@prisma/client';

export class NikkeCharacterService {
  async getCharactersForUser(userId: string): Promise<NikkeCharacter[]> {
    const account = await prisma.nikkeAccount.findUnique({
      where: { userId },
    });
    if (!account) return [];

    return prisma.nikkeCharacter.findMany({
      where: { accountId: account.id },
    });
  }

  async addCharacter(
    userId: string,
    characterKey: string,
    level = 1,
    limitBreak = 0,
    coreEnhance = 0,
  ): Promise<NikkeCharacter> {
    const account = await prisma.nikkeAccount.findUnique({
      where: { userId },
    });
    if (!account) throw new NotFoundError('NIKKE account not found for this user.');

    const existing = await prisma.nikkeCharacter.findUnique({
      where: {
        accountId_characterKey: {
          accountId: account.id,
          characterKey,
        },
      },
    });

    if (existing) throw new ConflictError('Nikke already exists in this roster.');

    return prisma.nikkeCharacter.create({
      data: {
        accountId: account.id,
        characterKey,
        level,
        limitBreak,
        coreEnhance,
        skill1: 1,
        skill2: 1,
        burstSkill: 1,
      },
    });
  }
}

export const nikkeCharacterService = new NikkeCharacterService();
