import type { GenshinAccount, Prisma } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class GenshinAccountRepository {
  async create(data: Prisma.GenshinAccountCreateInput): Promise<GenshinAccount> {
    return prisma.genshinAccount.create({ data });
  }

  async findByUserId(userId: string): Promise<GenshinAccount | null> {
    return prisma.genshinAccount.findUnique({ where: { userId } });
  }

  async findById(id: string): Promise<GenshinAccount | null> {
    return prisma.genshinAccount.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.GenshinAccountUpdateInput): Promise<GenshinAccount> {
    return prisma.genshinAccount.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinAccount> {
    return prisma.genshinAccount.delete({ where: { id } });
  }
}
