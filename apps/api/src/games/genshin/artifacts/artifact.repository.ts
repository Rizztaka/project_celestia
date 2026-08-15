import type { GenshinArtifact, Prisma } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class GenshinArtifactRepository {
  async create(data: Prisma.GenshinArtifactCreateInput): Promise<GenshinArtifact> {
    return prisma.genshinArtifact.create({ data });
  }

  async findByAccountId(accountId: string): Promise<GenshinArtifact[]> {
    return prisma.genshinArtifact.findMany({
      where: { accountId },
      orderBy: [{ level: 'desc' }, { rarity: 'desc' }],
    });
  }

  async findById(id: string): Promise<GenshinArtifact | null> {
    return prisma.genshinArtifact.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.GenshinArtifactUpdateInput): Promise<GenshinArtifact> {
    return prisma.genshinArtifact.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinArtifact> {
    return prisma.genshinArtifact.delete({ where: { id } });
  }
}
