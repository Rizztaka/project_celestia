import { describe, expect, it, vi } from 'vitest';

import { assertImportCounts, assertImportResources, importLimits } from './importer.limits.js';
import { GoodPayloadSchema } from './importer.schema.js';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
vi.mock('@/core/config/env.js', () => ({
  env: { JWT_SECRET: 'c5c-synthetic-resource-test-secret-long-enough' },
}));
import { GenshinImportService } from './importer.service.js';

describe('GOOD resource envelope', () => {
  it.each(['characters', 'weapons', 'artifacts', 'materials'] as const)(
    'accepts exact %s count and rejects the next item',
    (section) => {
      const counts = {
        characters: 0,
        weapons: 0,
        artifacts: 0,
        materials: 0,
        [section]: importLimits[section],
      };
      expect(() => assertImportCounts(counts)).not.toThrow();
      expect(() =>
        assertImportCounts({ ...counts, [section]: importLimits[section] + 1 }),
      ).toThrowError(expect.objectContaining({ errorCode: 'IMPORT_RESOURCE_LIMIT' }));
    },
  );
  it('enforces the combined item budget even when all individual sections fit', () => {
    expect(() =>
      assertImportCounts({ characters: 0, weapons: 0, artifacts: 5000, materials: 5000 }),
    ).not.toThrow();
    expect(() =>
      assertImportCounts({ characters: 1, weapons: 0, artifacts: 5000, materials: 5000 }),
    ).toThrow();
  });
  it('counts zero material entries and unselected sections', () => {
    const payload = {
      materials: Object.fromEntries(Array.from({ length: 5001 }, (_, i) => [`Opaque${i}`, 0])),
    };
    expect(() => assertImportResources({ payload, sections: ['characters'] })).toThrow();
  });
  it('bounds unknown exporter strings, keys, depth, nodes and non-finite numbers before schema cloning', () => {
    for (const value of [
      { unknown: 'x'.repeat(2049) },
      { ['x'.repeat(129)]: 1 },
      { unknown: Infinity },
      { unknown: Array.from({ length: 10000 }, () => Array(20).fill(1)) },
    ])
      expect(() => assertImportResources(value)).toThrow();
    let nested: unknown = {};
    for (let i = 0; i < 17; i++) nested = { nested };
    expect(() => assertImportResources(nested)).toThrow();
    expect(() => assertImportResources({ unknown: 'x'.repeat(2048) })).not.toThrow();
  });
  it('accepts opaque 128-character keys and rejects known key/source string overflow', () => {
    const payload = {
      format: 'GOOD',
      version: 2,
      source: 's'.repeat(128),
      materials: { ['k'.repeat(128)]: 1 },
    };
    expect(GoodPayloadSchema.parse(payload)).toEqual(payload);
    expect(() => GoodPayloadSchema.parse({ ...payload, source: 's'.repeat(129) })).toThrow();
    expect(() =>
      GoodPayloadSchema.parse({ ...payload, materials: { ['k'.repeat(129)]: 1 } }),
    ).toThrow();
  });
  it('preserves absent versus empty sections', () => {
    expect(GoodPayloadSchema.parse({ format: 'GOOD', version: 2 })).not.toHaveProperty('artifacts');
    expect(
      GoodPayloadSchema.parse({ format: 'GOOD', version: 2, artifacts: [] }).artifacts,
    ).toEqual([]);
  });
  it.each(['preview', 'importAccount'] as const)(
    'rejects before any repository work in %s',
    async (operation) => {
      const repository = { readSnapshot: vi.fn(), readMetadata: vi.fn(), commit: vi.fn() };
      const service = new GenshinImportService(repository);
      await expect(
        service[operation]('owner', {
          requestVersion: 1,
          payload: { format: 'GOOD', version: 2, artifacts: Array(5001).fill({}) },
          sections: ['artifacts'],
          ...(operation === 'importAccount' ? { previewToken: 'synthetic', confirmClear: [] } : {}),
        }),
      ).rejects.toMatchObject({ errorCode: 'IMPORT_RESOURCE_LIMIT' });
      expect(repository.readSnapshot).not.toHaveBeenCalled();
      expect(repository.commit).not.toHaveBeenCalled();
    },
  );
});
