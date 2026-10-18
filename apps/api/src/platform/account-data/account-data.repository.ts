import type { AccountExportV1, StoredAccountRow } from '@celestia/api-contracts';
import { Prisma, type PrismaClient } from '@prisma/client';

import type { AccountDataDomain, AccountTable } from '@/core/contracts/account-data.js';
import { prisma } from '@/core/db/prisma.js';
import { AppError, UnauthorizedError } from '@/core/errors/app-error.js';

import { accountDataPolicy as limits } from './account-data.policy.js';

export const profileTable: AccountTable = {
  table: 'users',
  fields: ['id', 'email', 'username', 'emailVerifiedAt', 'createdAt', 'updatedAt'],
  ownerWhere: (owner) => Prisma.sql`id = ${owner}`,
  maxRows: 1,
};
const identifier = (value: string) => Prisma.raw(`"${value.replaceAll('"', '""')}"`);
export function unsupportedAccount(): never {
  throw new AppError(
    'This account exceeds the local account-data limits. Nothing was truncated or changed. Larger accounts need a separately reviewed local procedure; no self-service workaround is available.',
    422,
    'ACCOUNT_DATA_LIMIT',
  );
}

/** Single-use bounded writer: never stringify the complete account in one call. */
export class AccountExportWriter {
  private chunks: string[] = [];
  bytes = 0;
  append(value: string) {
    this.bytes += Buffer.byteLength(value, 'utf8');
    if (this.bytes > limits.outputBytes) unsupportedAccount();
    this.chunks.push(value);
  }
  finish() {
    return this.chunks.join('');
  }
}

export class AccountDataRepository {
  readonly tables: readonly AccountTable[];
  constructor(
    private readonly domains: readonly AccountDataDomain[],
    private readonly db: PrismaClient = prisma,
  ) {
    this.tables = [profileTable, ...domains.flatMap((domain) => domain.tables)];
  }
  async credential(owner: string, tx?: Prisma.TransactionClient): Promise<string | null> {
    if (!tx)
      return this.db.$transaction(
        async (transaction) => {
          await this.configure(transaction, true);
          return this.credential(owner, transaction);
        },
        { maxWait: limits.lockMs, timeout: limits.transactionMs },
      );
    // Bounded even for malformed legacy credentials. Never select an arbitrary large hash.
    const [row] = await tx.$queryRaw<
      { password: string }[]
    >`SELECT password FROM users WHERE id=${owner} AND octet_length(password) <= 60`;
    return row?.password ?? null;
  }
  private async configure(tx: Prisma.TransactionClient, readOnly: boolean) {
    if (readOnly) await tx.$executeRaw`SET TRANSACTION READ ONLY`;
    await tx.$executeRaw`SET LOCAL statement_timeout = '5s'`;
    await tx.$executeRaw`SET LOCAL lock_timeout = '2s'`;
    await tx.$executeRaw`SET LOCAL timezone = 'UTC'`;
    await tx.$executeRaw`SET LOCAL datestyle = 'ISO,YMD'`;
    await tx.$executeRaw`SET LOCAL extra_float_digits = 3`;
  }
  private async counts(tx: Prisma.TransactionClient, owner: string) {
    let total = 0;
    for (const table of this.tables) {
      const [row] = await tx.$queryRaw<
        { count: number }[]
      >(Prisma.sql`SELECT count(*)::int AS count FROM
        (SELECT 1 FROM ${identifier(table.table)} WHERE ${table.ownerWhere(owner)} LIMIT ${table.maxRows + 1}) bounded`);
      total += row!.count;
      if (row!.count > table.maxRows || total > limits.rows) unsupportedAccount();
    }
  }
  export(owner: string, credential: string): Promise<string> {
    return this.db.$transaction(
      async (tx) => {
        await this.configure(tx, true);
        if ((await this.credential(owner, tx)) !== credential)
          throw new UnauthorizedError('Account credentials changed. Sign in again.');
        await this.counts(tx, owner);
        const [stamp] = await tx.$queryRaw<
          { at: string }[]
        >`SELECT to_char(transaction_timestamp() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at`;
        const metadata: Omit<AccountExportV1, 'tables'> = {
          exportVersion: 1,
          exportedAt: stamp!.at,
          encoding: 'postgresql-text-v1',
          scope:
            'Stored Celestia account data: profile, Genshin companion and retained NIKKE records. No live game progress. This is not GOOD or a supported restore/import format.',
          omissions: [
            'Passwords, hashes, tokens and secrets',
            'Static game catalogs and migration metadata',
            'External logs, historical backups and files already downloaded',
          ],
        };
        const writer = new AccountExportWriter();
        writer.append('{"success":true,"data":');
        writer.append(JSON.stringify(metadata).slice(0, -1));
        writer.append(',"tables":{');
        let rawBytes = 0;
        for (const [index, table] of this.tables.entries()) {
          const name = identifier(table.table);
          const fields = table.fields.map(identifier);
          // Reject compressed varlena before converting it: pg_column_size alone can
          // badly understate a decompression bomb. No compressed value is truncated.
          const sizes = fields.map(
            (field) =>
              Prisma.sql`CASE WHEN pg_column_compression(${field}) IS NOT NULL THEN ${limits.rowBytes + 1}::bigint ELSE GREATEST(64, COALESCE(pg_column_size(${field}), 0))::bigint END`,
          );
          const [physical] = await tx.$queryRaw<
            { largest: bigint | null }[]
          >(Prisma.sql`SELECT max(${Prisma.join(sizes, ' + ')}) AS largest FROM
          (SELECT ${Prisma.join(fields)} FROM ${name} WHERE ${table.ownerWhere(owner)} LIMIT ${table.maxRows + 1}) bounded`);
          if (Number(physical?.largest ?? 0) > limits.rowBytes) unsupportedAccount();
          // After bounded physical size, count exact encoded UTF-8 text on the server
          // before transferring or serializing any row from this section.
          const texts = fields.map(
            (field) => Prisma.sql`COALESCE(octet_length(${field}::text), 0)::bigint`,
          );
          const [size] = await tx.$queryRaw<
            { largest: bigint | null; total: bigint | null }[]
          >(Prisma.sql`SELECT max(n) AS largest, sum(n)::bigint AS total FROM
          (SELECT ${Prisma.join(texts, ' + ')} AS n FROM ${name} WHERE ${table.ownerWhere(owner)} LIMIT ${table.maxRows + 1}) bounded`);
          rawBytes += Number(size?.total ?? 0);
          if (Number(size?.largest ?? 0) > limits.rowBytes || rawBytes > limits.textBytes)
            unsupportedAccount();
          const rows = await tx.$queryRaw<
            StoredAccountRow[]
          >(Prisma.sql`SELECT ${Prisma.join(fields.map((field) => Prisma.sql`${field}::text AS ${field}`))}
          FROM ${name} WHERE ${table.ownerWhere(owner)} LIMIT ${table.maxRows + 1}`);
          if (rows.length > table.maxRows) unsupportedAccount();
          writer.append(`${index ? ',' : ''}${JSON.stringify(table.table)}:[`);
          for (const [i, row] of rows.entries())
            writer.append(`${i ? ',' : ''}${JSON.stringify(row)}`);
          writer.append(']');
        }
        writer.append('}}}');
        return writer.finish();
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        maxWait: limits.lockMs,
        timeout: limits.transactionMs,
      },
    );
  }
  async delete(owner: string, credential: string): Promise<void> {
    await this.db.$transaction(
      async (tx) => {
        await this.configure(tx, false);
        const owners = await tx.$queryRaw<
          { id: string }[]
        >`SELECT id FROM users WHERE id=${owner} FOR UPDATE`;
        if (owners.length !== 1 || (await this.credential(owner, tx)) !== credential)
          throw new UnauthorizedError('Account credentials changed. Sign in again.');
        await this.counts(tx, owner);
        for (const domain of this.domains) await domain.lockAndCheckDeletion(tx, owner);
        // Include child inserts that committed while parent locks were being acquired.
        await this.counts(tx, owner);
        for (const domain of this.domains) await domain.prepareDeletion(tx, owner);
        await tx.user.delete({ where: { id: owner } });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: limits.lockMs,
        timeout: limits.transactionMs,
      },
    );
  }
}
