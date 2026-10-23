import { Prisma } from '@prisma/client';

import type { AccountDataDomain, AccountTable } from '@/core/contracts/account-data.js';
import { AppError } from '@/core/errors/app-error.js';

const user = (owner: string) => Prisma.sql`"userId" = ${owner}`;
const account = (owner: string) =>
  Prisma.sql`"accountId" IN (SELECT id FROM genshin_accounts WHERE "userId" = ${owner})`;
const table = (
  name: string,
  fields: string[],
  ownerWhere = account,
  maxRows = 10_000,
): AccountTable => ({ table: name, fields, ownerWhere, maxRows });
export const genshinAccountTables: readonly AccountTable[] = [
  table(
    'genshin_accounts',
    ['id', 'userId', 'uid', 'nickname', 'adventureRank', 'worldLevel', 'createdAt', 'updatedAt'],
    user,
    1,
  ),
  table('genshin_characters', [
    'id',
    'accountId',
    'characterKey',
    'active',
    'dataSource',
    'level',
    'ascension',
    'constellation',
    'talentNormal',
    'talentSkill',
    'talentBurst',
    'equippedWeaponId',
    'createdAt',
    'updatedAt',
  ]),
  table('genshin_weapons', [
    'id',
    'accountId',
    'weaponKey',
    'level',
    'ascension',
    'refinement',
    'locked',
    'createdAt',
    'updatedAt',
  ]),
  table('genshin_artifacts', [
    'id',
    'accountId',
    'setKey',
    'slotKey',
    'level',
    'rarity',
    'mainStatKey',
    'mainStatValue',
    'subStats',
    'locked',
    'equippedCharacterId',
    'createdAt',
    'updatedAt',
  ]),
  table('genshin_materials', ['id', 'accountId', 'itemKey', 'quantity', 'createdAt', 'updatedAt']),
  table(
    'genshin_import_sections',
    ['id', 'accountId', 'section', 'importedAt', 'source', 'entryCount'],
    account,
    4,
  ),
  table('genshin_character_focus', ['accountId', 'characterKey', 'focused', 'revision']),
  table(
    'upgrade_goals',
    [
      'id',
      'userId',
      'createdAt',
      'updatedAt',
      'goalType',
      'targetKey',
      'fromPhase',
      'toPhase',
      'talentType',
      'status',
      'priority',
      'revision',
      'completedAt',
      'completionReason',
      'createRequestId',
      'predecessorId',
    ],
    user,
  ),
  table(
    'genshin_routine_state',
    [
      'userId',
      'revision',
      'serverId',
      'dailyPeriodStart',
      'commissionsDone',
      'teapotChecked',
      'transformerLastUsedAt',
      'resinAmount',
      'resinRecordedAt',
      'weeklyPeriodStart',
      'weeklyRewardClaims',
      'createdAt',
      'updatedAt',
    ],
    user,
    1,
  ),
  table(
    'genshin_plan_preferences',
    [
      'userId',
      'revision',
      'dailyResinBudget',
      'commissions',
      'teapot',
      'transformer',
      'weeklyClaims',
    ],
    user,
    1,
  ),
  table(
    'genshin_plan_dismissals',
    [
      'userId',
      'sourceKey',
      'scope',
      'serverId',
      'periodId',
      'goalId',
      'goalRevision',
      'routineKind',
    ],
    user,
  ),
  table(
    'daily_companion',
    [
      'id',
      'userId',
      'resinAmount',
      'resinUpdatedAt',
      'commissionsDone',
      'teapotClaimed',
      'transformerClaimed',
      'dailyResetAt',
      'createdAt',
      'updatedAt',
    ],
    user,
    1,
  ),
  table(
    'weekly_boss_state',
    ['id', 'userId', 'defeatedBossKeys', 'weeklyResetAt', 'createdAt', 'updatedAt'],
    user,
    1,
  ),
  table(
    'event_progress',
    ['id', 'userId', 'createdAt', 'updatedAt', 'eventKey', 'tierId', 'claimed'],
    user,
  ),
  table('spiral_abyss_runs', [
    'id',
    'accountId',
    'cycleId',
    'floor',
    'chamber',
    'half',
    'stars',
    'team',
    'createdAt',
    'updatedAt',
  ]),
  table('imaginarium_theater_runs', [
    'id',
    'accountId',
    'seasonId',
    'difficulty',
    'actsCleared',
    'stars',
    'cast',
    'createdAt',
    'updatedAt',
  ]),
];

export async function checkGenshinOwnership(tx: Prisma.TransactionClient, owner: string) {
  const [result] = await tx.$queryRaw<{ invalid: boolean }[]>`SELECT
    EXISTS (SELECT 1 FROM upgrade_goals s JOIN upgrade_goals p ON p.id=s."predecessorId"
      WHERE s."userId" <> p."userId" AND (s."userId"=${owner} OR p."userId"=${owner}))
    OR EXISTS (SELECT 1 FROM genshin_characters c JOIN genshin_weapons w ON w.id=c."equippedWeaponId"
      JOIN genshin_accounts ca ON ca.id=c."accountId" JOIN genshin_accounts wa ON wa.id=w."accountId"
      WHERE c."accountId" <> w."accountId" AND (ca."userId"=${owner} OR wa."userId"=${owner}))
    OR EXISTS (SELECT 1 FROM genshin_artifacts a JOIN genshin_characters c ON c.id=a."equippedCharacterId"
      JOIN genshin_accounts aa ON aa.id=a."accountId" JOIN genshin_accounts ca ON ca.id=c."accountId"
      WHERE a."accountId" <> c."accountId" AND (aa."userId"=${owner} OR ca."userId"=${owner})) AS invalid`;
  if (result?.invalid)
    throw new AppError(
      'Stored relationships need local review. No account data was changed.',
      409,
      'ACCOUNT_RELATIONSHIPS_UNSUPPORTED',
    );
}
export const genshinAccountData: AccountDataDomain = {
  tables: genshinAccountTables,
  async lockAndCheckDeletion(tx, owner) {
    await tx.$queryRaw`SELECT id FROM genshin_accounts WHERE "userId"=${owner} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM upgrade_goals WHERE "userId"=${owner} ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM genshin_characters WHERE ${account(owner)} ORDER BY id FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM genshin_weapons WHERE ${account(owner)} ORDER BY id FOR UPDATE`;
    await checkGenshinOwnership(tx, owner);
  },
  async prepareDeletion(tx, owner) {
    await tx.upgradeGoal.updateMany({
      where: { userId: owner, predecessorId: { not: null } },
      data: { predecessorId: null },
    });
    await tx.upgradeGoal.deleteMany({ where: { userId: owner } });
  },
};

// Session credentials are deliberately excluded from account downloads and cascade on deletion.
export const genshinSecurityModelDisposition = {
  GenshinHoyolabConnection: 'exclude_from_export_cascade_on_delete',
} as const;
