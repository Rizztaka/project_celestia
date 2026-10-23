import { randomUUID } from 'node:crypto';

import type { HoyolabRole } from '@celestia/api-contracts';
import { Prisma, type PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';
import { AppError } from '@/core/errors/app-error.js';

import type { HoyolabSnapshot } from './hoyolab.types.js';
export class HoyolabRepository {
  constructor(private readonly db: PrismaClient = prisma) {}
  read(userId: string) {
    return this.db.genshinHoyolabConnection.findUnique({ where: { userId } });
  }
  async connect(
    userId: string,
    encryptedSession: string,
    roles: HoyolabRole[],
    now: Date,
    expectedGeneration: number | null,
  ) {
    return this.db.$transaction(async (tx) => {
      // The user row serializes link/disconnect/delete and prevents a late link reviving a deleted owner.
      const owner = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      if (!owner.length)
        throw new AppError('Sign in again to connect HoYoLAB.', 401, 'UNAUTHORIZED');
      const prior = await tx.genshinHoyolabConnection.findUnique({ where: { userId } });
      if ((prior?.generation ?? null) !== expectedGeneration)
        throw new AppError('Connection changed. Try connecting again.', 409, 'HOYOLAB_CHANGED');
      const account = await tx.genshinAccount.findUnique({ where: { userId } });
      const selected =
        roles.find((r) => account?.uid === r.uid) ??
        (!account?.uid && roles.length === 1 ? roles[0] : undefined);
      return tx.genshinHoyolabConnection.upsert({
        where: { userId },
        create: {
          userId,
          encryptedSession,
          roles: roles as unknown as Prisma.InputJsonValue,
          selectedUid: selected?.uid,
          selectedServer: selected?.server,
          state: selected ? 'ready' : 'choose_account',
          nextSyncAt: selected ? now : null,
        },
        update: {
          encryptedSession,
          roles: roles as unknown as Prisma.InputJsonValue,
          generation: { increment: 1 },
          selectedUid: selected?.uid ?? null,
          selectedServer: selected?.server ?? null,
          state: selected ? 'ready' : 'choose_account',
          leaseId: null,
          leaseUntil: null,
          nextSyncAt: selected ? now : null,
          lastError: null,
          ...(prior?.selectedUid && prior.selectedUid !== selected?.uid
            ? { notes: Prisma.DbNull, syncedAt: null }
            : {}),
        },
      });
    });
  }
  async select(userId: string, role: HoyolabRole, generation: number, now: Date) {
    return this.db.$transaction(async (tx) => {
      const owners = await tx.$queryRaw<
        { id: string }[]
      >`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      if (!owners.length)
        throw new AppError('Sign in again to select an account.', 401, 'UNAUTHORIZED');
      const account = await tx.genshinAccount.findUnique({ where: { userId } });
      if (account?.uid && account.uid !== role.uid)
        throw new AppError(
          'This Celestia account already has a different Genshin UID. Use its linked HoYoLAB account to keep builds separate.',
          409,
          'HOYOLAB_ACCOUNT_MISMATCH',
        );
      const changed = await tx.genshinHoyolabConnection.updateMany({
        where: {
          userId,
          generation,
          encryptedSession: { not: null },
          OR: [{ leaseId: null }, { leaseUntil: { lt: now } }],
        },
        data: {
          leaseId: null,
          leaseUntil: null,
          selectedUid: role.uid,
          selectedServer: role.server,
          generation: { increment: 1 },
          state: 'ready',
          nextSyncAt: now,
          lastError: null,
        },
      });
      if (!changed.count)
        throw new AppError('Connection changed. Refresh and try again.', 409, 'HOYOLAB_CHANGED');
    });
  }
  async disconnect(userId: string) {
    await this.db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
      await tx.genshinHoyolabConnection.upsert({
        where: { userId },
        create: { userId, state: 'disconnected' },
        update: {
          encryptedSession: null,
          generation: { increment: 1 },
          state: 'disconnected',
          roles: [],
          nextSyncAt: null,
          leaseId: null,
          leaseUntil: null,
          lastError: null,
        },
      });
    });
  }
  async claim(userId: string, generation: number, now: Date, automatic: boolean) {
    const leaseId = randomUUID();
    const changed = await this.db.genshinHoyolabConnection.updateMany({
      where: {
        userId,
        generation,
        encryptedSession: { not: null },
        selectedUid: { not: null },
        ...(automatic ? { nextSyncAt: { lte: now } } : {}),
        AND: [
          { OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] },
          {
            OR: [
              { lastAttemptAt: null },
              { lastAttemptAt: { lt: new Date(now.getTime() - 60_000) } },
            ],
          },
        ],
      },
      data: {
        lastAttemptAt: now,
        leaseId,
        leaseUntil: new Date(now.getTime() + 300_000),
        state: 'syncing',
        nextSyncAt: new Date(now.getTime() + 900_000),
      },
    });
    return changed.count ? leaseId : null;
  }
  async apply(
    userId: string,
    generation: number,
    leaseId: string,
    snapshot: HoyolabSnapshot,
    now: Date,
  ) {
    await this.db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
        // Lock the connection before touching any account data; disconnect/rotation invalidates this lease.
        const rows = await tx.$queryRaw<
          { userId: string }[]
        >`SELECT "userId" FROM genshin_hoyolab_connections WHERE "userId" = ${userId} AND generation = ${generation} AND "leaseId" = ${leaseId} AND "encryptedSession" IS NOT NULL AND "leaseUntil" > ${now} FOR UPDATE`;
        if (!rows.length)
          throw new AppError(
            'Connection changed while refreshing. Saved builds were kept.',
            409,
            'HOYOLAB_CHANGED',
          );
        const prior = await tx.genshinAccount.findUnique({ where: { userId } });
        if (prior?.uid && prior.uid !== snapshot.role.uid)
          throw new AppError(
            'The linked game account does not match these saved builds.',
            409,
            'HOYOLAB_ACCOUNT_MISMATCH',
          );
        const account = await tx.genshinAccount.upsert({
          where: { userId },
          create: {
            userId,
            uid: snapshot.role.uid,
            nickname: snapshot.role.nickname,
            adventureRank: snapshot.role.level,
          },
          update: {
            uid: snapshot.role.uid,
            nickname: snapshot.role.nickname,
            adventureRank: snapshot.role.level,
          },
        });
        const serverId = {
          os_asia: 'asia',
          os_usa: 'america',
          os_euro: 'europe',
          os_cht: 'tw_hk_mo',
        }[snapshot.role.server];
        // Initialize reset tracking from the verified owned role; preserve explicit settings.
        await tx.genshinRoutineState.upsert({
          where: { userId },
          create: { userId, serverId, revision: 1 },
          update: {},
        });
        await tx.genshinRoutineState.updateMany({
          where: { userId, serverId: null },
          data: { serverId, revision: { increment: 1 } },
        });
        // Archive old assignments by detaching them; keep their inventory rows recoverable.
        await tx.genshinCharacter.updateMany({
          where: { accountId: account.id },
          data: { active: false, equippedWeaponId: null },
        });
        await tx.genshinArtifact.updateMany({
          where: { accountId: account.id },
          data: { equippedCharacterId: null },
        });
        // Bounded round trips even for a complete roster; all payloads remain SQL parameters.
        const characters = snapshot.characters.map((c) => ({
          id: randomUUID(),
          characterKey: c.key,
          level: c.level,
          ascension: c.ascension,
          constellation: c.constellation,
          talentNormal: c.talents.normal,
          talentSkill: c.talents.skill,
          talentBurst: c.talents.burst,
        }));
        const saved = await tx.$queryRaw<{ id: string; characterKey: string }[]>`
          INSERT INTO genshin_characters
            (id, "accountId", "characterKey", level, ascension, constellation,
             "talentNormal", "talentSkill", "talentBurst", active, "dataSource", "createdAt", "updatedAt")
          SELECT x.id, ${account.id}, x."characterKey", x.level, x.ascension, x.constellation,
            x."talentNormal", x."talentSkill", x."talentBurst", true, 'hoyolab', ${now}::timestamp, ${now}::timestamp
          FROM jsonb_to_recordset(${JSON.stringify(characters)}::jsonb) AS x
            (id text, "characterKey" text, level integer, ascension integer, constellation integer,
             "talentNormal" integer, "talentSkill" integer, "talentBurst" integer)
          ON CONFLICT ("accountId", "characterKey") DO UPDATE SET
            level = EXCLUDED.level, ascension = EXCLUDED.ascension, constellation = EXCLUDED.constellation,
            "talentNormal" = EXCLUDED."talentNormal", "talentSkill" = EXCLUDED."talentSkill",
            "talentBurst" = EXCLUDED."talentBurst", active = true, "dataSource" = 'hoyolab',
            "updatedAt" = EXCLUDED."updatedAt"
          RETURNING id, "characterKey"`;
        const ids = new Map(saved.map((c) => [c.characterKey, c.id]));
        if (saved.length !== characters.length || snapshot.characters.some((c) => !ids.has(c.key)))
          throw new AppError(
            'Incomplete roster. Saved builds were kept.',
            502,
            'HOYOLAB_INCOMPLETE',
          );
        const weapons = snapshot.characters.map((c) => ({
          id: `hoyolab:weapon:${ids.get(c.key)!}`,
          weaponKey: c.weapon.key,
          level: c.weapon.level,
          ascension: c.weapon.ascension,
          refinement: c.weapon.refinement,
        }));
        const savedWeapons = await tx.$queryRaw<{ id: string }[]>`
          INSERT INTO genshin_weapons
            (id, "accountId", "weaponKey", level, ascension, refinement, locked, "createdAt", "updatedAt")
          SELECT x.id, ${account.id}, x."weaponKey", x.level, x.ascension, x.refinement, NULL,
            ${now}::timestamp, ${now}::timestamp
          FROM jsonb_to_recordset(${JSON.stringify(weapons)}::jsonb) AS x
            (id text, "weaponKey" text, level integer, ascension integer, refinement integer)
          ON CONFLICT (id) DO UPDATE SET
            "weaponKey" = EXCLUDED."weaponKey", level = EXCLUDED.level, ascension = EXCLUDED.ascension,
            refinement = EXCLUDED.refinement, locked = NULL, "updatedAt" = EXCLUDED."updatedAt"
          WHERE genshin_weapons."accountId" = EXCLUDED."accountId"
          RETURNING id`;
        if (savedWeapons.length !== weapons.length)
          throw new AppError(
            'Equipment ownership changed. Saved builds were kept.',
            409,
            'HOYOLAB_CHANGED',
          );
        await tx.$executeRaw`
          UPDATE genshin_characters SET "equippedWeaponId" = 'hoyolab:weapon:' || id
          WHERE "accountId" = ${account.id} AND active = true`;
        const artifacts = snapshot.characters.flatMap((c) =>
          c.artifacts.map((a) => ({
            id: `hoyolab:artifact:${ids.get(c.key)!}:${a.slot}`,
            setKey: a.key,
            slotKey: a.slot,
            level: a.level,
            rarity: a.rarity,
            mainStatKey: a.mainStatKey,
            mainStatValue: a.mainStatValue,
            subStats: a.subStats,
            equippedCharacterId: ids.get(c.key)!,
          })),
        );
        if (artifacts.length) {
          const savedArtifacts = await tx.$queryRaw<{ id: string }[]>`
            INSERT INTO genshin_artifacts
              (id, "accountId", "setKey", "slotKey", level, rarity, "mainStatKey", "mainStatValue",
               "subStats", locked, "equippedCharacterId", "createdAt", "updatedAt")
            SELECT x.id, ${account.id}, x."setKey", x."slotKey", x.level, x.rarity, x."mainStatKey",
              x."mainStatValue", x."subStats", NULL, x."equippedCharacterId", ${now}::timestamp, ${now}::timestamp
            FROM jsonb_to_recordset(${JSON.stringify(artifacts)}::jsonb) AS x
              (id text, "setKey" text, "slotKey" text, level integer, rarity integer,
               "mainStatKey" text, "mainStatValue" double precision, "subStats" jsonb, "equippedCharacterId" text)
            ON CONFLICT (id) DO UPDATE SET
              "setKey" = EXCLUDED."setKey", "slotKey" = EXCLUDED."slotKey", level = EXCLUDED.level,
              rarity = EXCLUDED.rarity, "mainStatKey" = EXCLUDED."mainStatKey", "mainStatValue" = EXCLUDED."mainStatValue",
              "subStats" = EXCLUDED."subStats", locked = NULL, "equippedCharacterId" = EXCLUDED."equippedCharacterId",
              "updatedAt" = EXCLUDED."updatedAt"
            WHERE genshin_artifacts."accountId" = EXCLUDED."accountId"
            RETURNING id`;
          if (savedArtifacts.length !== artifacts.length)
            throw new AppError(
              'Equipment ownership changed. Saved builds were kept.',
              409,
              'HOYOLAB_CHANGED',
            );
        }
        for (const section of ['characters', 'weapons', 'artifacts'] as const) {
          const entryCount =
            section === 'artifacts'
              ? snapshot.characters.reduce((n, c) => n + c.artifacts.length, 0)
              : snapshot.characters.length;
          await tx.genshinImportSectionState.upsert({
            where: { accountId_section: { accountId: account.id, section } },
            create: {
              accountId: account.id,
              section,
              importedAt: snapshot.observedAt,
              source: 'HoYoLAB Battle Chronicle',
              entryCount,
            },
            update: {
              importedAt: snapshot.observedAt,
              source: 'HoYoLAB Battle Chronicle',
              entryCount,
            },
          });
        }
        await tx.genshinHoyolabConnection.update({
          where: { userId },
          data: {
            state: 'ready',
            syncedAt: snapshot.observedAt,
            nextSyncAt: new Date(now.getTime() + 900_000),
            notes: (snapshot.notes as unknown as Prisma.InputJsonValue) ?? Prisma.DbNull,
            leaseId: null,
            leaseUntil: null,
            lastError: null,
          },
        });
      },
      { timeout: 30000 },
    );
  }
  async failure(userId: string, generation: number, leaseId: string, code: string, now: Date) {
    const state =
      code === 'HOYOLAB_RECONNECT'
        ? 'reconnect'
        : code === 'HOYOLAB_VERIFICATION'
          ? 'verification'
          : 'unavailable';
    await this.db.genshinHoyolabConnection.updateMany({
      where: { userId, generation, leaseId },
      data: {
        state,
        lastError: code,
        leaseId: null,
        leaseUntil: null,
        nextSyncAt: ['reconnect', 'verification'].includes(state)
          ? null
          : new Date(now.getTime() + 900_000),
      },
    });
  }
  due(now: Date) {
    return this.db.genshinHoyolabConnection.findMany({
      where: {
        encryptedSession: { not: null },
        selectedUid: { not: null },
        nextSyncAt: { lte: now },
      },
      select: { userId: true },
      take: 5,
      orderBy: { nextSyncAt: 'asc' },
    });
  }
}
