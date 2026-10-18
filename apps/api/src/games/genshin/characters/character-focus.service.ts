import { characterKeySchema, focusCommandSchema, type FocusRecord } from '@celestia/api-contracts';
import type { PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { BadRequestError, ConflictError, NotFoundError } from '@/core/errors/app-error.js';

import { GoalRepository } from '../../../platform/companion/goal.repository.js';

export class GenshinCharacterFocusService {
  constructor(private readonly db: PrismaClient = prisma) {}
  list(userId: string): Promise<FocusRecord[]> {
    return this.db.genshinCharacterFocus.findMany({
      where: { character: { account: { userId } } },
      select: { characterKey: true, focused: true, revision: true },
      orderBy: { characterKey: 'asc' },
    });
  }
  async set(userId: string, rawKey: unknown, input: unknown): Promise<FocusRecord> {
    const key = characterKeySchema.safeParse(rawKey);
    const command = focusCommandSchema.safeParse(input);
    if (!key.success || !command.success) throw new BadRequestError('Invalid focus request.');
    return new GoalRepository(this.db).write(userId, async (tx) => {
      const character = await tx.genshinCharacter.findFirst({
        where: { characterKey: key.data, account: { userId } },
      });
      if (!character) throw new NotFoundError('Character not found.');
      const where = {
        accountId_characterKey: { accountId: character.accountId, characterKey: key.data },
      };
      const previous = await tx.genshinCharacterFocus.findUnique({ where });
      if ((previous?.revision ?? 0) !== command.data.expectedRevision)
        throw new ConflictError('Focus changed in another tab. Refresh and review before saving.');
      const saved = await tx.genshinCharacterFocus.upsert({
        where,
        create: { ...where.accountId_characterKey, focused: command.data.focused, revision: 1 },
        update: { focused: command.data.focused, revision: { increment: 1 } },
      });
      return { characterKey: saved.characterKey, focused: saved.focused, revision: saved.revision };
    });
  }
}
