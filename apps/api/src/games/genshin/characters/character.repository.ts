import type { GenshinArtifact, GenshinCharacter, GenshinWeapon, Prisma } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

/**
 * A GenshinCharacter row with its equippedWeapon relation eagerly loaded.
 * Used by the roster read API (Milestone 2D).
 */
export type CharacterWithWeapon = GenshinCharacter & {
  equippedWeapon: GenshinWeapon | null;
};

export type CharacterWithArtifacts = GenshinCharacter & {
  equippedArtifacts: GenshinArtifact[];
};

export class GenshinCharacterRepository {
  async create(data: Prisma.GenshinCharacterCreateInput): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.create({ data });
  }

  async findByAccountId(accountId: string): Promise<GenshinCharacter[]> {
    return prisma.genshinCharacter.findMany({ where: { accountId } });
  }

  /**
   * Returns all characters for an account with their equipped weapon eagerly loaded.
   * Characters are ordered by level descending (highest-level characters first).
   */
  async findByAccountIdWithWeapon(accountId: string): Promise<CharacterWithWeapon[]> {
    return prisma.genshinCharacter.findMany({
      where: { accountId },
      include: { equippedWeapon: true },
      orderBy: { level: 'desc' },
    });
  }

  /**
   * Returns all characters for an account with their equipped artifacts eagerly loaded.
   * Characters are ordered by level descending.
   */
  async findByAccountIdWithArtifacts(accountId: string) {
    return prisma.genshinCharacter.findMany({
      where: { accountId },
      include: { equippedArtifacts: true },
      orderBy: { level: 'desc' },
    });
  }

  async findById(id: string): Promise<GenshinCharacter | null> {
    return prisma.genshinCharacter.findUnique({ where: { id } });
  }

  async findByKey(accountId: string, characterKey: string): Promise<GenshinCharacter | null> {
    return prisma.genshinCharacter.findUnique({
      where: { accountId_characterKey: { accountId, characterKey } },
    });
  }

  async update(id: string, data: Prisma.GenshinCharacterUpdateInput): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.update({ where: { id }, data });
  }

  async delete(id: string): Promise<GenshinCharacter> {
    return prisma.genshinCharacter.delete({ where: { id } });
  }
}
