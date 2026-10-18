import { Prisma } from '@prisma/client';

import type { AccountDataDomain, AccountTable } from '@/core/contracts/account-data.js';

const account = (owner: string) => Prisma.sql`"userId" = ${owner}`;
const character = (owner: string) =>
  Prisma.sql`"accountId" IN (SELECT id FROM "NikkeAccount" WHERE "userId" = ${owner})`;
const equipment = (owner: string) =>
  Prisma.sql`"characterId" IN (SELECT id FROM "NikkeCharacter" WHERE ${character(owner)})`;
export const nikkeAccountTables: readonly AccountTable[] = [
  {
    table: 'NikkeAccount',
    fields: ['id', 'userId', 'commanderName', 'commanderLevel', 'createdAt', 'updatedAt'],
    ownerWhere: account,
    maxRows: 1,
  },
  {
    table: 'NikkeCharacter',
    fields: [
      'id',
      'accountId',
      'characterKey',
      'level',
      'limitBreak',
      'coreEnhance',
      'skill1',
      'skill2',
      'burstSkill',
      'createdAt',
      'updatedAt',
    ],
    ownerWhere: character,
    maxRows: 10_000,
  },
  {
    table: 'NikkeEquipment',
    fields: [
      'id',
      'characterId',
      'slot',
      'tier',
      'manufacturer',
      'level',
      'isOverload',
      'createdAt',
      'updatedAt',
    ],
    ownerWhere: equipment,
    maxRows: 10_000,
  },
];
export const nikkeAccountData: AccountDataDomain = {
  tables: nikkeAccountTables,
  async lockAndCheckDeletion(tx, owner) {
    await tx.$queryRaw`SELECT id FROM "NikkeAccount" WHERE "userId" = ${owner} FOR UPDATE`;
  },
  async prepareDeletion() {
    /* All retained NIKKE edges cascade within one owner. */
  },
};
