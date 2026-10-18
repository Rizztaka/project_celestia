import { randomUUID } from 'node:crypto';

import type { ImportPreviewRequest } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConflictError } from '@/core/errors/app-error.js';

import { GenshinImportRepository } from './importer.repository.js';
import { GenshinImportService } from './importer.service.js';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
vi.mock('@/core/config/env.js', () => ({
  env: { JWT_SECRET: 'local-import-integration-secret-at-least-32-characters' },
}));

const databaseUrl = process.env.CELESTIA_TEST_DATABASE_URL;
// Never use DATABASE_URL: it may point to a developer's real account database.
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !url.pathname.startsWith('/celestia_test_')
  ) {
    throw new Error('Import integration tests require a loopback celestia_test_* database.');
  }
}

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
  lock: true,
};
const artifact = {
  setKey: 'GladiatorsFinale',
  slotKey: 'flower',
  level: 20,
  rarity: 5,
  mainStatKey: 'hp',
  location: 'HuTao',
  substats: [{ key: 'critRate_', value: 3.9 }],
};
const full: ImportPreviewRequest = {
  requestVersion: 1,
  payload: {
    format: 'GOOD',
    version: 2,
    characters: [character],
    weapons: [weapon],
    artifacts: [artifact],
    materials: { Mora: 120, SilkFlower: 0 },
  },
  sections: ['characters', 'weapons', 'artifacts', 'materials'],
};
function request(
  payload: object,
  sections: ImportPreviewRequest['sections'],
): ImportPreviewRequest {
  return { requestVersion: 1, payload: { format: 'GOOD', version: 2, ...payload }, sections };
}

describe.skipIf(!databaseUrl)('Import transactions on disposable PostgreSQL', () => {
  let db: PrismaClient;
  let service: GenshinImportService;
  let repository: GenshinImportRepository;
  const owners: string[] = [];
  let owner: string;
  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    repository = new GenshinImportRepository(db);
    service = new GenshinImportService(repository);
  });
  beforeEach(async () => {
    owner = randomUUID();
    owners.push(owner);
    await db.user.create({
      data: {
        id: owner,
        username: `import-${owner}`,
        email: `${owner}@test.invalid`,
        password: 'test-only-not-an-account-login',
      },
    });
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });
  async function commit(input: ImportPreviewRequest, userId = owner) {
    const preview = await service.preview(userId, input);
    return service.importAccount(userId, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  }
  it('creates all data atomically and preserves GOOD field mappings and equipment', async () => {
    await commit(full);
    const state = (await repository.readSnapshot(owner))!;
    expect(state.characters[0]).toMatchObject({
      characterKey: 'HuTao',
      talentNormal: 6,
      talentSkill: 9,
      talentBurst: 9,
      equippedWeaponId: state.weapons[0]!.id,
    });
    expect(state.weapons[0]).toMatchObject({ weaponKey: 'StaffOfHoma', locked: true });
    expect(state.artifacts[0]).toMatchObject({
      equippedCharacterId: state.characters[0]!.id,
      subStats: artifact.substats,
    });
    expect(state.materials.map(({ itemKey, quantity }) => ({ itemKey, quantity }))).toEqual([
      { itemKey: 'Mora', quantity: 120 },
    ]);
  });
  it('preview does not create a first account', async () => {
    await service.preview(owner, full);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
  });
  it('leaves legacy inventory provenance unknown, without fabricating a date', async () => {
    const account = await db.genshinAccount.create({ data: { userId: owner } });
    await db.genshinMaterial.create({
      data: { accountId: account.id, itemKey: 'Mora', quantity: 10 },
    });
    const before = await repository.readSnapshot(owner);
    const status = await service.status(owner);
    expect(
      status.sections.every(
        (section) => section.status === 'unknown' && section.importedAt === null,
      ),
    ).toBe(true);
    expect(await repository.readSnapshot(owner)).toEqual(before);
  });
  it('updates only selected provenance and distinguishes cleared inventory from unknown', async () => {
    await commit({ ...full, payload: { ...(full.payload as object), source: 'Test exporter' } });
    const before = await service.status(owner);
    await commit(request({ materials: {}, source: 'Second exporter' }, ['materials']));
    const after = await service.status(owner);
    expect(after.sections.filter((section) => section.section !== 'materials')).toEqual(
      before.sections.filter((section) => section.section !== 'materials'),
    );
    expect(after.sections.find((section) => section.section === 'materials')).toMatchObject({
      status: 'imported',
      source: 'Second exporter',
      entryCount: 0,
      scope: 'replacement_section',
      importedAt: expect.any(String),
    });
    expect(after.sections[0]).toMatchObject({ scope: 'merged_entries', entryCount: 1 });
  });
  it('preserves user goals through equipment replacement', async () => {
    await commit(full);
    const goal = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'StaffOfHoma',
        fromPhase: 5,
        toPhase: 6,
      },
    });
    await commit(request({ weapons: [weapon] }, ['weapons']));
    expect(await db.upgradeGoal.findUnique({ where: { id: goal.id } })).toEqual(goal);
  });
  it('keeps omitted equipment, materials, their IDs, and weapon assignments unchanged', async () => {
    await commit(full);
    const before = (await repository.readSnapshot(owner))!;
    await commit(request({ characters: [{ ...character, level: 89 }] }, ['characters']));
    const after = (await repository.readSnapshot(owner))!;
    expect(after.weapons).toEqual(before.weapons);
    expect(after.artifacts).toEqual(before.artifacts);
    expect(after.materials).toEqual(before.materials);
    expect(after.characters[0]!.equippedWeaponId).toBe(before.characters[0]!.equippedWeaponId);
    expect(after.characters[0]!.level).toBe(89);
  });
  it('preserves a present but unselected inventory', async () => {
    await commit(full);
    const before = (await repository.readSnapshot(owner))!;
    await commit(request({ materials: {}, weapons: [] }, ['materials']));
    const after = (await repository.readSnapshot(owner))!;
    expect(after.materials).toEqual([]);
    expect(after.weapons).toEqual(before.weapons);
    expect(after.characters).toEqual(before.characters);
  });
  it('resolves equipment-only imports using existing owned characters', async () => {
    await commit(full);
    const before = (await repository.readSnapshot(owner))!;
    await commit(
      request({ weapons: [{ ...weapon, refinement: 2 }], artifacts: [artifact] }, [
        'weapons',
        'artifacts',
      ]),
    );
    const after = (await repository.readSnapshot(owner))!;
    expect(after.weapons[0]!.id).not.toBe(before.weapons[0]!.id);
    expect(after.characters[0]!.id).toBe(before.characters[0]!.id);
    expect(after.characters[0]!.equippedWeaponId).toBe(after.weapons[0]!.id);
    expect(after.artifacts[0]!.equippedCharacterId).toBe(before.characters[0]!.id);
  });
  it('clears only a confirmed inventory and leaves the character roster', async () => {
    await commit(full);
    const input = request({ weapons: [] }, ['weapons']);
    const preview = await service.preview(owner, input);
    await expect(
      service.importAccount(owner, {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: [],
      }),
    ).rejects.toThrow('Explicitly confirm');
    expect((await repository.readSnapshot(owner))!.weapons).toHaveLength(1);
    await service.importAccount(owner, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: ['weapons'],
    });
    const state = (await repository.readSnapshot(owner))!;
    expect(state.weapons).toEqual([]);
    expect(state.characters[0]!.equippedWeaponId).toBeNull();
    expect(state.artifacts).toHaveLength(1);
    expect(state.materials).toHaveLength(1);
  });
  it('rolls back account creation if a later inventory write fails', async () => {
    // Invoke the persistence layer with an invalid DB integer to force failure after earlier writes.
    await expect(
      repository.commit(owner, () => ({
        payload: {
          format: 'GOOD',
          version: 2,
          characters: [character],
          materials: { Mora: 2147483648 },
        },
        sections: ['characters', 'materials'],
      })),
    ).rejects.toThrow();
    expect(await repository.readSnapshot(owner)).toBeNull();
  });
  it('restores replaced equipment and all earlier writes when a later write fails', async () => {
    await commit(full);
    const before = await repository.readSnapshot(owner);
    await expect(
      repository.commit(owner, () => ({
        payload: {
          format: 'GOOD',
          version: 2,
          weapons: [],
          artifacts: [],
          materials: { Mora: 2147483648 },
        },
        sections: ['weapons', 'artifacts', 'materials'],
      })),
    ).rejects.toThrow();
    expect(await repository.readSnapshot(owner)).toEqual(before);
  });
  it('rejects stale previews after non-import inventory edits', async () => {
    await commit(full);
    const input = request({ materials: { Mora: 1 } }, ['materials']);
    const preview = await service.preview(owner, input);
    const state = (await repository.readSnapshot(owner))!;
    await db.genshinWeapon.update({ where: { id: state.weapons[0]!.id }, data: { refinement: 2 } });
    await expect(
      service.importAccount(owner, {
        ...input,
        previewToken: preview.previewToken,
        confirmClear: [],
      }),
    ).rejects.toBeInstanceOf(ConflictError);
    expect((await repository.readSnapshot(owner))!.materials[0]!.quantity).toBe(120);
  });
  it('rejects replay even for an empty import', async () => {
    const input = request({ characters: [] }, ['characters']);
    const preview = await service.preview(owner, input);
    const command = { ...input, previewToken: preview.previewToken, confirmClear: [] };
    await service.importAccount(owner, command);
    await expect(service.importAccount(owner, command)).rejects.toBeInstanceOf(ConflictError);
  });
  it.each([false, true])(
    'allows only one simultaneous import (existing account: %s)',
    async (existing) => {
      if (existing) await commit(full);
      const input = request({ materials: { Mora: 17 } }, ['materials']);
      const preview = await service.preview(owner, input);
      const command = { ...input, previewToken: preview.previewToken, confirmClear: [] };
      const results = await Promise.allSettled([
        service.importAccount(owner, command),
        service.importAccount(owner, command),
      ]);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      const failure = results.find((result) => result.status === 'rejected');
      expect(failure?.status === 'rejected' && failure.reason).toBeInstanceOf(ConflictError);
      expect((await repository.readSnapshot(owner))!.materials).toHaveLength(1);
    },
  );
  it('cannot resolve a character owned by a different account', async () => {
    await commit(full);
    const otherOwner = randomUUID();
    owners.push(otherOwner);
    await db.user.create({
      data: {
        id: otherOwner,
        username: otherOwner,
        email: `${otherOwner}@test.invalid`,
        password: 'test-only',
      },
    });
    const before = await repository.readSnapshot(owner);
    await expect(
      service.preview(otherOwner, request({ weapons: [weapon] }, ['weapons'])),
    ).rejects.toThrow('Unresolved');
    expect(await repository.readSnapshot(otherOwner)).toBeNull();
    expect(await repository.readSnapshot(owner)).toEqual(before);
  });
});
