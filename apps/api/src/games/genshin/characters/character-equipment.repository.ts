import type {
  GenshinArtifact,
  GenshinCharacter,
  GenshinWeapon,
  PrismaClient,
} from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export interface CharacterEquipmentRow {
  character: GenshinCharacter;
  weapon: GenshinWeapon | null;
  artifacts: GenshinArtifact[];
  receipts: { section: string; importedAt: string; source: string | null; entryCount: number }[];
  weaponRelationConsistent: boolean;
  artifactRelationsConsistent: boolean;
}
export class GenshinCharacterEquipmentRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async readForUser(userId: string, characterKey: string): Promise<CharacterEquipmentRow | null> {
    // One SELECT = one MVCC snapshot, including every section receipt. No locks, writes or
    // account initialization; imports cannot interleave the constituent relation reads.
    const rows = await this.db.$queryRaw<CharacterEquipmentRow[]>`
      SELECT to_jsonb(c) AS character,
        (SELECT to_jsonb(w) FROM genshin_weapons w
          WHERE w.id = c."equippedWeaponId" AND w."accountId" = a.id) AS weapon,
        COALESCE((SELECT jsonb_agg(to_jsonb(ar) ORDER BY ar."slotKey")
          FROM genshin_artifacts ar
          WHERE ar."equippedCharacterId" = c.id AND ar."accountId" = a.id), '[]'::jsonb) AS artifacts,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('section', s.section, 'importedAt', s."importedAt" AT TIME ZONE 'UTC', 'source', s.source, 'entryCount', s."entryCount"))
          FROM genshin_import_sections s WHERE s."accountId" = a.id
          AND s.section IN ('characters', 'weapons', 'artifacts')), '[]'::jsonb) AS receipts,
        (c."equippedWeaponId" IS NULL OR EXISTS (SELECT 1 FROM genshin_weapons w
          WHERE w.id = c."equippedWeaponId" AND w."accountId" = a.id)) AS "weaponRelationConsistent",
        NOT EXISTS (SELECT 1 FROM genshin_artifacts ar
          WHERE ar."equippedCharacterId" = c.id AND ar."accountId" <> a.id) AS "artifactRelationsConsistent"
      FROM genshin_accounts a JOIN genshin_characters c ON c."accountId" = a.id
      WHERE a."userId" = ${userId} AND c."characterKey" = ${characterKey}
    `;
    return rows[0] ?? null;
  }
}
