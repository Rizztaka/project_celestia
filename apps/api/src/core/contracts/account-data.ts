import type { Prisma } from '@prisma/client';

/** Static, code-owned SQL only. Request values never become identifiers or SQL. */
export interface AccountTable {
  table: string;
  fields: readonly string[];
  ownerWhere: (owner: string) => Prisma.Sql;
  maxRows: number;
}
export interface AccountDataDomain {
  tables: readonly AccountTable[];
  lockAndCheckDeletion(tx: Prisma.TransactionClient, owner: string): Promise<void>;
  prepareDeletion(tx: Prisma.TransactionClient, owner: string): Promise<void>;
}
