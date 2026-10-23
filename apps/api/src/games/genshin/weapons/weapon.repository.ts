import type { GenshinWeapon, Prisma } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class GenshinWeaponRepository {
  async create(data: Prisma.GenshinWeaponCreateInput): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.create({ data });
  }

  async findByAccountId(accountId: string): Promise<GenshinWeapon[]> {
    return prisma.genshinWeapon.findMany({
      where: { accountId },
      orderBy: { level: 'desc' },
    });
  }

  async findEquippedByAccountId(accountId: string) {
    return prisma.genshinWeapon.findMany({
      where: { accountId, equippedBy: { is: { accountId, active: true } } },
      include: { equippedBy: { select: { id: true, characterKey: true } } },
      orderBy: { level: 'desc' },
    });
  }

  async findById(id: string): Promise<GenshinWeapon | null> {
    return prisma.genshinWeapon.findUnique({ where: { id } });
  }

  async update(id: string, data: Prisma.GenshinWeaponUpdateInput): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinWeapon> {
    return prisma.genshinWeapon.delete({ where: { id } });
  }
}
