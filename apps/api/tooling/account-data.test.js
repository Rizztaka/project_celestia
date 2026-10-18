import { Prisma } from '@prisma/client';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/core/db/prisma.js', () => ({ prisma: {} }));
import { BoundedRateStore } from '../src/core/middleware/request-admission.ts';
import { genshinAccountData } from '../src/games/genshin/account-data/genshin-account-data.ts';
import { nikkeAccountData } from '../src/games/nikke/account-data/nikke-account-data.ts';
import { accountDataPolicy } from '../src/platform/account-data/account-data.policy.ts';
import {
  AccountExportWriter,
  profileTable,
} from '../src/platform/account-data/account-data.repository.ts';
import { authSecurityModelDisposition } from '../src/platform/auth/security-disposition.ts';

describe('C5d schema coverage and resource policy', () => {
  it('requires explicit table and scalar-field disposition for every Prisma model', () => {
    const tables = [profileTable, ...genshinAccountData.tables, ...nikkeAccountData.tables];
    const models = Prisma.dmmf.datamodel.models;
    expect(tables.length).toBe(20);
    expect(models.length).toBe(tables.length + Object.keys(authSecurityModelDisposition).length);
    for (const model of models) {
      if (Object.hasOwn(authSecurityModelDisposition, model.name)) {
        expect(authSecurityModelDisposition[model.name]).toBe(
          'exclude_from_export_cascade_on_delete',
        );
        continue;
      }
      const table = tables.find((item) => item.table === (model.dbName ?? model.name));
      expect(table).toBeDefined();
      const columns = model.fields
        .filter((field) => field.kind !== 'object')
        .map((field) => field.dbName ?? field.name);
      expect([...table.fields, ...(model.name === 'User' ? ['password'] : [])].sort()).toEqual(
        columns.sort(),
      );
      expect(table.fields.includes('password')).toBe(false);
    }
  });
  it('caps owner counter capacity without eviction and refills only expired debt', () => {
    let now = 0;
    const store = new BoundedRateStore(accountDataPolicy.rate, () => now);
    for (let i = 0; i < 1024; i++) expect(store.take(String(i))).toBeNull();
    expect(store.take('extra')).toBe(60);
    expect(store.size).toBe(1024);
    expect(store.take('0')).toBeNull();
    expect(store.take('0')).toBeNull();
    expect(store.take('0')).toBe(60);
    now = 60000;
    expect(store.take('extra')).toBeNull();
    expect(store.take('0')).toBeNull();
  });
  it('counts UTF-8 bytes including multibyte text at the exact inclusive output bound', () => {
    const writer = new AccountExportWriter();
    writer.append('雪'.repeat(5_592_405));
    writer.append('a');
    expect(writer.bytes).toBe(accountDataPolicy.outputBytes);
    expect(() => writer.append('a')).toThrow();
  });
});
