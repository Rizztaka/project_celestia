import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BadRequestError, ConflictError } from '@/core/errors/app-error.js';

import { fingerprint } from './importer.preview.js';
import type { ImportSelection, ImportSnapshot } from './importer.repository.js';
import { GenshinImportService } from './importer.service.js';

vi.mock('@/core/config/env.js', () => ({
  env: { JWT_SECRET: 'local-import-test-secret-with-more-than-32-characters' },
}));
vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));

const character = {
  key: 'HuTao',
  level: 90,
  constellation: 1,
  ascension: 6,
  talent: { auto: 6, skill: 9, burst: 9 },
};
const weapon = {
  key: 'StaffOfHoma',
  level: 90,
  ascension: 6,
  refinement: 1,
  location: 'HuTao',
  lock: false,
};
const artifact = {
  setKey: 'GladiatorsFinale',
  slotKey: 'flower',
  level: 20,
  rarity: 5,
  mainStatKey: 'hp',
  location: 'HuTao',
  substats: [],
};
const date = new Date('2026-01-01T00:00:00Z');
const account: NonNullable<ImportSnapshot> = {
  id: 'account-a',
  userId: 'user-a',
  uid: null,
  nickname: null,
  adventureRank: null,
  worldLevel: null,
  createdAt: date,
  updatedAt: date,
  weapons: [],
  artifacts: [],
  materials: [],
  importStates: [],
  characters: [
    {
      id: 'character-a',
      accountId: 'account-a',
      active: true,
      dataSource: 'manual',
      characterKey: 'HuTao',
      level: 80,
      constellation: 0,
      ascension: 5,
      talentNormal: 1,
      talentSkill: 1,
      talentBurst: 1,
      equippedWeaponId: null,
      createdAt: date,
      updatedAt: date,
    },
  ],
};
const request = (payload: object, sections: string[]) => ({
  requestVersion: 1,
  payload: { format: 'GOOD', version: 2, ...payload },
  sections,
});
let state: ImportSnapshot;
let written: ImportSelection | undefined;
const repository = {
  readMetadata: vi.fn(async () => state?.importStates ?? []),
  readSnapshot: vi.fn(async () => state),
  commit: vi.fn(
    async (_userId: string, validate: (snapshot: ImportSnapshot) => ImportSelection) => {
      written = validate(state);
    },
  ),
};
const service = new GenshinImportService(repository);

beforeEach(() => {
  vi.clearAllMocks();
  state = structuredClone(account);
  written = undefined;
});
afterEach(() => vi.useRealTimers());

async function commit(input: ReturnType<typeof request>, confirmClear: string[] = []) {
  const preview = await service.preview('user-a', input);
  return service.importAccount('user-a', {
    ...input,
    previewToken: preview.previewToken,
    confirmClear,
  });
}

describe('Safe import contract and preview', () => {
  it('reports missing metadata as unknown without writing', async () => {
    const result = await service.status('user-a');
    expect(
      result.sections.every(
        (section) =>
          section.status === 'unknown' &&
          section.importedAt === null &&
          section.entryCount === null,
      ),
    ).toBe(true);
    expect(repository.commit).not.toHaveBeenCalled();
  });
  it('preserves absent sections and previews character merges without writing', async () => {
    const preview = await service.preview(
      'user-a',
      request({ characters: [character] }, ['characters']),
    );
    expect(preview.sections).toEqual([
      {
        section: 'characters',
        action: 'merge',
        currentCount: 1,
        incomingCount: 1,
        resultingCount: 1,
      },
      ...['weapons', 'artifacts', 'materials'].map((section) => ({
        section,
        action: 'preserve',
        currentCount: 0,
        incomingCount: null,
        resultingCount: 0,
      })),
    ]);
    expect(repository.commit).not.toHaveBeenCalled();
  });
  it('keeps an unselected present section out of the write selection', async () => {
    await commit(request({ characters: [character], weapons: [] }, ['characters']));
    expect(written?.sections).toEqual(['characters']);
  });
  it.each(['weapons', 'artifacts', 'materials'])('rejects selecting absent %s', async (section) => {
    await expect(service.preview('user-a', request({}, [section]))).rejects.toThrow('has no');
    expect(repository.readSnapshot).not.toHaveBeenCalled();
  });
  it.each([{ sections: [] }, { sections: ['weapons', 'weapons'] }, { sections: ['unknown'] }])(
    'rejects invalid selection $sections',
    async ({ sections }) => {
      await expect(service.preview('user-a', request({ weapons: [] }, sections))).rejects.toThrow();
    },
  );
  it('requires confirmation for empty replacement and zero-only materials', async () => {
    const input = request({ weapons: [], materials: { Mora: 0 } }, ['weapons', 'materials']);
    const preview = await service.preview('user-a', input);
    expect(preview.clearSections).toEqual(['weapons', 'materials']);
    await expect(
      service.importAccount('user-a', {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: ['weapons'],
      }),
    ).rejects.toThrow('Explicitly confirm');
    expect(written).toBeUndefined();
    const result = await commit(input, ['materials', 'weapons']);
    expect(result.materialsImported).toBe(0);
  });
  it('does not treat an empty character list as roster deletion', async () => {
    const preview = await service.preview('user-a', request({ characters: [] }, ['characters']));
    expect(preview.clearSections).toEqual([]);
    expect(preview.sections[0]).toMatchObject({ action: 'merge', resultingCount: 1 });
  });
  it('accepts equipment belonging to an existing character absent from the export', async () => {
    const result = await commit(
      request({ weapons: [weapon], artifacts: [artifact] }, ['weapons', 'artifacts']),
    );
    expect(result).toMatchObject({
      charactersImported: 0,
      weaponsImported: 1,
      artifactsImported: 1,
    });
  });
  it('rejects unresolved locations instead of silently unequipping items', async () => {
    state = null;
    await expect(
      service.preview('user-a', request({ weapons: [weapon] }, ['weapons'])),
    ).rejects.toThrow('Unresolved weapons location');
  });
  it('does not resolve a character from an unselected section', async () => {
    state = null;
    await expect(
      service.preview(
        'user-a',
        request({ characters: [character], artifacts: [artifact] }, ['artifacts']),
      ),
    ).rejects.toThrow('Unresolved artifacts location');
  });
  it.each([
    [{ characters: [character, character] }, ['characters'], 'Duplicate character'],
    [{ weapons: [weapon, weapon] }, ['weapons'], 'Multiple weapons'],
    [{ artifacts: [artifact, artifact] }, ['artifacts'], 'Multiple artifacts'],
  ] as const)('rejects conflicting assignments %#', async (payload, sections, message) => {
    await expect(service.preview('user-a', request(payload, [...sections]))).rejects.toThrow(
      message,
    );
  });
  it('accepts repeated unequipped items and distinct artifact slots', async () => {
    await commit(
      request(
        {
          weapons: [
            { ...weapon, location: '' },
            { ...weapon, location: '' },
          ],
          artifacts: [artifact, { ...artifact, slotKey: 'plume' }],
        },
        ['weapons', 'artifacts'],
      ),
    );
    expect(written?.payload.weapons).toHaveLength(2);
  });
  it('validates game field ranges before reading inventory', async () => {
    await expect(
      service.preview(
        'user-a',
        request({ characters: [{ ...character, level: 0 }] }, ['characters']),
      ),
    ).rejects.toThrow();
    expect(repository.readSnapshot).not.toHaveBeenCalled();
  });
  it('rejects material quantities outside the database integer range', async () => {
    await expect(
      service.preview('user-a', request({ materials: { Mora: 2147483648 } }, ['materials'])),
    ).rejects.toThrow();
  });
  it('requires a versioned preview for legacy raw GOOD imports', async () => {
    await expect(
      service.importAccount('user-a', { format: 'GOOD', version: 2, weapons: [] }),
    ).rejects.toBeInstanceOf(BadRequestError);
    expect(repository.commit).not.toHaveBeenCalled();
  });
});

describe('Preview integrity', () => {
  it.each(['user', 'payload', 'scope', 'token'])(
    'rejects changed %s before writes',
    async (change) => {
      const input = request({ characters: [character], weapons: [] }, ['characters']);
      const preview = await service.preview('user-a', input);
      const changed = {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: [],
        ...(change === 'payload' ? { payload: { ...input.payload, characters: [] } } : {}),
        ...(change === 'scope' ? { sections: ['weapons'] } : {}),
        ...(change === 'token' ? { previewToken: `x${preview.previewToken}` } : {}),
      };
      await expect(
        service.importAccount(change === 'user' ? 'user-b' : 'user-a', changed),
      ).rejects.toBeInstanceOf(ConflictError);
      expect(repository.commit).not.toHaveBeenCalled();
    },
  );
  it('rejects expired previews', async () => {
    vi.useFakeTimers();
    const input = request({ characters: [character] }, ['characters']);
    const preview = await service.preview('user-a', input);
    vi.advanceTimersByTime(601000);
    await expect(
      service.importAccount('user-a', {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });
  it('rejects inventory edits between preview and commit', async () => {
    const input = request({ characters: [character] }, ['characters']);
    const preview = await service.preview('user-a', input);
    state!.characters[0]!.level = 81;
    await expect(
      service.importAccount('user-a', {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: [],
      }),
    ).rejects.toThrow('changed since');
    expect(written).toBeUndefined();
  });
  it('fingerprints reordered object keys identically while detecting changed arrays', () => {
    expect(fingerprint({ b: 2, a: [{ y: 1, x: 0 }] })).toBe(
      fingerprint({ a: [{ x: 0, y: 1 }], b: 2 }),
    );
    expect(fingerprint([1, 2])).not.toBe(fingerprint([2, 1]));
  });
});
