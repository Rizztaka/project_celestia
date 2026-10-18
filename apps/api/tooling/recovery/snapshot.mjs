import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { quote, requireSafe, sha256 } from './policy.mjs';
import { apiRoot } from './process.mjs';
import { applicationTables } from './seed.mjs';

export async function snapshot(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query(
      "SET LOCAL timezone='UTC'; SET LOCAL datestyle='ISO,YMD'; SET LOCAL extra_float_digits=3",
    );
    const { rows: tables } = await client.query(
      "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('pg_catalog','information_schema') AND table_type='BASE TABLE' ORDER BY table_schema,table_name",
    );
    const expected = [...applicationTables, '_prisma_migrations'].sort();
    requireSafe(
      tables.length === expected.length &&
        tables.every((t) => t.table_schema === 'public') &&
        JSON.stringify(tables.map((t) => t.table_name).sort()) === JSON.stringify(expected),
      'UNINVENTORIED_OR_MISSING_TABLE',
    );
    const summaries = [],
      canonical = [];
    for (const { table_name: name } of tables) {
      const { rows: columns } = await client.query(
        'SELECT column_name, udt_name, is_nullable FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 ORDER BY ordinal_position',
        ['public', name],
      );
      // PostgreSQL textual values preserve exact timestamps, bigint/numeric and
      // null; no JS Date/Number parsing or null-to-zero normalization.
      const result = await client.query({
        text: `SELECT ${columns.map((c) => `${quote(c.column_name)}::text`).join(',')} FROM public.${quote(name)}`,
        rowMode: 'array',
      });
      const rows = result.rows.map((r) => JSON.stringify(r)).sort();
      requireSafe(rows.length > 0, 'REPRESENTATIVE_TABLE_EMPTY');
      const value = JSON.stringify({ name, columns, rows });
      canonical.push(value);
      summaries.push({ name, rows: rows.length, columns: columns.length, sha256: sha256(value) });
    }
    const { rows: sequences } = await client.query(
      "SELECT schemaname, sequencename FROM pg_sequences WHERE schemaname !~ '^pg_' AND schemaname <> 'information_schema' ORDER BY schemaname,sequencename",
    );
    const sequenceStates = [];
    for (const s of sequences) {
      const { rows } = await client.query(
        `SELECT last_value::text, is_called::text FROM ${quote(s.schemaname)}.${quote(s.sequencename)}`,
      );
      sequenceStates.push({ ...s, ...rows[0] });
    }
    const { rows: constraints } = await client.query(
      "SELECT c.relname, con.conname, pg_get_constraintdef(con.oid) AS definition FROM pg_constraint con JOIN pg_class c ON con.conrelid=c.oid JOIN pg_namespace n ON c.relnamespace=n.oid WHERE n.nspname='public' ORDER BY c.relname,con.conname",
    );
    canonical.push(JSON.stringify(sequenceStates), JSON.stringify(constraints));
    const value = JSON.stringify(canonical);
    await client.query('COMMIT');
    return {
      canonical: value,
      summary: {
        tables: summaries,
        sequences: { count: sequences.length, sha256: sha256(JSON.stringify(sequenceStates)) },
        constraints: { count: constraints.length, sha256: sha256(JSON.stringify(constraints)) },
        sha256: sha256(value),
      },
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function migrationCompatibility(client) {
  const directory = join(apiRoot, 'prisma/migrations');
  const names = readdirSync(directory, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const { rows } = await client.query(
    'SELECT migration_name, checksum, finished_at IS NOT NULL AS finished, rolled_back_at IS NULL AS not_rolled_back, applied_steps_count FROM _prisma_migrations ORDER BY migration_name',
  );
  requireSafe(
    // Historical migrations plus the named server and account-security expansions.
    // Keep an exact inventory, never a permissive minimum or receipt bypass.
    names.length === 15 &&
      names.at(-1) === '20261018100000_account_security_sessions' &&
      rows.length === names.length &&
      rows.every(
        (r, i) =>
          r.migration_name === names[i] &&
          r.checksum === sha256(readFileSync(join(directory, names[i], 'migration.sql'))) &&
          r.finished &&
          r.not_rolled_back &&
          r.applied_steps_count === 1,
      ),
    'MIGRATION_HISTORY_INCOMPATIBLE',
  );
  return { applied: rows.length, checksumsMatch: true, restoredMigrationsApplied: false };
}
