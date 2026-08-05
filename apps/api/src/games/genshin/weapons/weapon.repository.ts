import { prisma } from "@/core/db/prisma.js";
import type { GenshinWeapon, Prisma } from "@prisma/client";

export class GenshinWeaponRepository {
  async create(data: Prisma.GenshinWeaponCreateInput): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.create({ data });
  }

  async findByAccountId(accountId: string): Promise<GenshinWeapon[]> {
    return prisma.genshinWeapon.findMany({ where: { accountId } });
  }

  async findById(id: string): Promise<GenshinWeapon | null> {
    return prisma.genshinWeapon.findUnique({ where: { id } });
  }

  async update(
    id: string,
    data: Prisma.GenshinWeaponUpdateInput,
  ): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.delete({ where: { id } });
  }
}
