import { randomUUID } from 'node:crypto';

import type { ImportSection } from '@celestia/api-contracts';
import { Prisma, type PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { ConflictError, UnauthorizedError } from '@/core/errors/app-error.js';

import { assertImportCounts, importLimits } from './importer.limits.js';
import type { GoodPayload } from './importer.schema.js';

const snapshotInclude = {
  // Fetch at most one sentinel beyond each support ceiling. If present, reject
  // the state below; never fingerprint, preview or commit a truncated snapshot.
  characters: { orderBy: { id: 'asc' }, take: importLimits.characters + 1 },
  weapons: { orderBy: { id: 'asc' }, take: importLimits.weapons + 1 },
  artifacts: { orderBy: { id: 'asc' }, take: importLimits.artifacts + 1 },
  materials: { orderBy: { id: 'asc' }, take: importLimits.materials + 1 },
  importStates: { orderBy: { section: 'asc' } },
} satisfies Prisma.GenshinAccountInclude;
export type ImportSnapshot = Prisma.GenshinAccountGetPayload<{
  include: typeof snapshotInclude;
}> | null;
export interface ImportSelection {
  payload: GoodPayload;
  sections: ImportSection[];
}

export class GenshinImportRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async readMetadata(userId: string) {
    const account = await this.db.genshinAccount.findUnique({
      where: { userId },
      select: { importStates: true },
    });
    return account?.importStates ?? [];
  }

  readSnapshot(userId: string): Promise<ImportSnapshot> {
    return this.db.$transaction((tx) => this.snapshot(tx, userId), {
      isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
    });
  }
  async commit(
    userId: string,
    validate: (state: ImportSnapshot) => ImportSelection,
  ): Promise<void> {
    try {
      await this.db.$transaction(
        async (tx) => {
          // Lock the owner row even before a Genshin account exists.
          const owners = await tx.$queryRaw<
            { id: string }[]
          >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
          if (owners.length !== 1) throw new UnauthorizedError();
          const state = await this.snapshot(tx, userId);
          const selection = validate(state);
          const account = state ?? (await tx.genshinAccount.create({ data: { userId } }));
          await this.apply(tx, account.id, state, selection);
          const importedAt = new Date();
          for (const section of selection.sections) {
            const data = selection.payload[section]!;
            const entryCount =
              section === 'materials'
                ? Object.values(selection.payload.materials!).filter((quantity) => quantity > 0)
                    .length
                : (data as unknown[]).length;
            const metadata = { importedAt, source: selection.payload.source ?? null, entryCount };
            await tx.genshinImportSectionState.upsert({
              where: { accountId_section: { accountId: account.id, section } },
              create: { accountId: account.id, section, ...metadata },
              update: metadata,
            });
          }
          // Advance even for an empty import to invalidate replayed previews.
          await tx.genshinAccount.update({
            where: { id: account.id },
            data: { updatedAt: new Date(Math.max(Date.now(), account.updatedAt.getTime() + 1)) },
          });
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          maxWait: 10000,
          timeout: 120000,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        ['P2034', 'P2002'].includes(error.code)
      ) {
        throw new ConflictError('Your account changed during import. Preview your import again.');
      }
      throw error;
    }
  }
  private async snapshot(tx: Prisma.TransactionClient, userId: string) {
    const state = await tx.genshinAccount.findUnique({
      where: { userId },
      include: snapshotInclude,
    });
    if (state)
      assertImportCounts({
        characters: state.characters.length,
        weapons: state.weapons.length,
        artifacts: state.artifacts.length,
        materials: state.materials.length,
      });
    return state;
  }
  private async apply(
    tx: Prisma.TransactionClient,
    accountId: string,
    state: ImportSnapshot,
    { payload, sections }: ImportSelection,
  ) {
    const selected = new Set(sections);
    const characterMap = new Map(
      state?.characters.map((character) => [character.characterKey, character.id]),
    );
    if (selected.has('characters')) {
      for (const character of payload.characters ?? []) {
        const data = {
          level: character.level,
          ascension: character.ascension,
          constellation: character.constellation,
          talentNormal: character.talent.auto,
          talentSkill: character.talent.skill,
          talentBurst: character.talent.burst,
        };
        const saved = await tx.genshinCharacter.upsert({
          where: { accountId_characterKey: { accountId, characterKey: character.key } },
          create: { accountId, characterKey: character.key, ...data },
          update: data,
        });
        characterMap.set(character.key, saved.id);
      }
    }
    if (selected.has('weapons')) {
      await tx.genshinCharacter.updateMany({
        where: { accountId },
        data: { equippedWeaponId: null },
      });
      await tx.genshinWeapon.deleteMany({ where: { accountId } });
      const weapons = (payload.weapons ?? []).map((weapon) => ({ id: randomUUID(), weapon }));
      if (weapons.length)
        await tx.genshinWeapon.createMany({
          data: weapons.map(({ id, weapon }) => ({
            id,
            accountId,
            weaponKey: weapon.key,
            level: weapon.level,
            ascension: weapon.ascension,
            refinement: weapon.refinement,
            locked: weapon.lock,
          })),
        });
      for (const { id, weapon } of weapons) {
        if (weapon.location)
          await tx.genshinCharacter.update({
            where: { id: characterMap.get(weapon.location)!, accountId },
            data: { equippedWeaponId: id },
          });
      }
    }
    if (selected.has('artifacts')) {
      await tx.genshinArtifact.deleteMany({ where: { accountId } });
      const artifacts = (payload.artifacts ?? []).map((artifact) => ({
        id: randomUUID(),
        accountId,
        setKey: artifact.setKey,
        slotKey: artifact.slotKey,
        level: artifact.level,
        rarity: artifact.rarity,
        mainStatKey: artifact.mainStatKey,
        subStats: artifact.substats,
        locked: artifact.lock,
        equippedCharacterId: artifact.location ? characterMap.get(artifact.location)! : null,
      }));
      if (artifacts.length) await tx.genshinArtifact.createMany({ data: artifacts });
    }
    if (selected.has('materials')) {
      await tx.genshinMaterial.deleteMany({ where: { accountId } });
      const materials = Object.entries(payload.materials ?? {})
        .filter(([, quantity]) => quantity > 0)
        .map(([itemKey, quantity]) => ({ accountId, itemKey, quantity }));
      if (materials.length) await tx.genshinMaterial.createMany({ data: materials });
    }
  }
}
