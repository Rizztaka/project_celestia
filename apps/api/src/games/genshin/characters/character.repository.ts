import { prisma } from "@/core/db/prisma.js";
import type { GenshinCharacter, Prisma } from "@prisma/client";

export class GenshinCharacterRepository {
  async create(
    data: Prisma.GenshinCharacterCreateInput,
  ): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.create({ data });
  }

  async findByAccountId(accountId: string): Promise<GenshinCharacter[]> {
    return prisma.genshinCharacter.findMany({ where: { accountId } });
  }

  async findById(id: string): Promise<GenshinCharacter | null> {
    return prisma.genshinCharacter.findUnique({ where: { id } });
  }

  async findByKey(
    accountId: string,
    characterKey: string,
  ): Promise<GenshinCharacter | null> {
    return prisma.genshinCharacter.findUnique({
      where: { accountId_characterKey: { accountId, characterKey } },
    });
  }

  async update(
    id: string,
    data: Prisma.GenshinCharacterUpdateInput,
  ): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.delete({ where: { id } });
  }
}
