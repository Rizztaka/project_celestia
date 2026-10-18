import type { RecordedStockSnapshot } from '@celestia/api-contracts';
import type { PrismaClient } from '@prisma/client';

import { prisma } from '@/core/db/prisma.js';

export class GenshinRecordedStockRepository {
  constructor(private readonly db: PrismaClient = prisma) {}

  async readForUser(userId: string): Promise<RecordedStockSnapshot> {
    const rows = await this.db.$queryRaw<
      {
        inventory: Record<string, number>;
        receipt: { importedAt: string; source: string | null; entryCount: number } | null;
      }[]
    >`
      SELECT COALESCE((SELECT jsonb_object_agg(m."itemKey", m.quantity)
        FROM genshin_materials m WHERE m."accountId" = a.id AND m.quantity > 0), '{}'::jsonb) AS inventory,
        (SELECT jsonb_build_object('importedAt', s."importedAt" AT TIME ZONE 'UTC', 'source', s.source, 'entryCount', s."entryCount")
        FROM genshin_import_sections s WHERE s."accountId" = a.id AND s.section = 'materials') AS receipt
      FROM genshin_accounts a WHERE a."userId" = ${userId}
    `;
    const receipt = rows[0]?.receipt;
    return {
      inventory: rows[0]?.inventory ?? {},
      stockBasis: {
        kind: 'recorded_import',
        importedAt: receipt ? new Date(receipt.importedAt).toISOString() : null,
        source: receipt?.source ?? null,
        scope: receipt ? 'replacement_section' : null,
        suppliedEntryCount: receipt?.entryCount ?? null,
      },
    };
  }
}
