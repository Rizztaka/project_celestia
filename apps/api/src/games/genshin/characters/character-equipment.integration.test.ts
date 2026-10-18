import { randomUUID } from 'node:crypto';

import { artifactSlots, type CharacterEquipmentResponse } from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { GenshinImportRepository } from '../importer/importer.repository.js';
import { GenshinImportService } from '../importer/importer.service.js';

const shared = vi.hoisted(() => ({ db: null as PrismaClient | null }));
vi.mock('@/core/db/prisma.js', () => ({
  prisma: new Proxy(
    {},
    {
      get(_target, key) {
        if (!shared.db) throw new Error('Disposable database not initialized');
        const value = Reflect.get(shared.db, key);
        return typeof value === 'function' ? value.bind(shared.db) : value;
      },
    },
  ),
}));
const secret = 'local-c3a-test-secret-at-least-32-characters';
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-c3a-test-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { app } from '@/app.js';

const databaseUrl = process.env.CELESTIA_TEST_DATABASE_URL;
if (databaseUrl) {
  const url = new URL(databaseUrl);
  if (
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    !url.pathname.startsWith('/celestia_test_')
  )
    throw new Error('C3a requires an explicit disposable loopback celestia_test_* database.');
}
const character = (key = 'HuTao', level = 80) => ({
  key,
  level,
  ascension: 6,
  constellation: 3,
  talent: { auto: 9, skill: 12, burst: 15 },
});
const weapon = (key = 'StaffOfHoma', level = 90) => ({
  key,
  level,
  ascension: 6,
  refinement: 2,
  location: 'HuTao',
  lock: true,
});
const pieces = () =>
  artifactSlots.map((slotKey) => ({
    setKey: 'OpaqueSet',
    slotKey,
    rarity: 5,
    level: 20,
    mainStatKey: 'opaque_stat_',
    location: 'HuTao',
    substats: [{ key: 'unknown_substat', value: 7.7 }],
    lock: false,
  }));

describe.skipIf(!databaseUrl)('C3a actual PostgreSQL owned equipment read', () => {
  let db: PrismaClient;
  let owner: string;
  let importer: GenshinImportService;
  const owners: string[] = [];
  const queries: string[] = [];
  const api = supertest(app);
  const auth = (id = owner) => jwt.sign({ sid: id }, secret, { subject: id });
  const endpoint = (key = 'HuTao') =>
    `/api/v1/games/genshin/characters/${encodeURIComponent(key)}/equipment`;
  const read = async (key = 'HuTao', id = owner) => {
    const response = await api.get(endpoint(key)).auth(auth(id), { type: 'bearer' });
    expect(response.status, JSON.stringify(response.body)).toBe(200);
    return response.body.data as CharacterEquipmentResponse;
  };
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: `c3a-${id}`, email: `${id}@test.invalid`, password: 'test-only' },
    });
    await db.session.create({
      data: {
        id,
        userId: id,
        tokenHash: id.replaceAll('-', '').repeat(2),
        expiresAt: new Date('2099-01-01'),
      },
    });
    return id;
  };
  const request = (payload: Record<string, unknown>, source = 'C3a fixture') => ({
    requestVersion: 1,
    sections: Object.keys(payload),
    payload: { format: 'GOOD', version: 2, source, ...payload },
  });
  const commit = async (
    payload: Record<string, unknown>,
    source = 'C3a fixture',
    service = importer,
    id = owner,
  ) => {
    const input = request(payload, source);
    const preview = await service.preview(id, input);
    return service.importAccount(id, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  const full = () =>
    commit({ characters: [character()], weapons: [weapon()], artifacts: pieces() });
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    client.$on('query', (event) => queries.push(event.query));
    db = client;
    shared.db = db;
    importer = new GenshinImportService(new GenshinImportRepository(db));
  });
  beforeEach(async () => {
    owner = await user();
    queries.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });

  it('requires authentication and uses identical 404s without initializing an account', async () => {
    expect((await api.get(endpoint())).status).toBe(401);
    const missing = await api.get(endpoint()).auth(auth(), { type: 'bearer' });
    const other = await user();
    await commit({ characters: [character()] }, 'other', importer, other);
    const foreign = await api.get(endpoint()).auth(auth(), { type: 'bearer' });
    expect(missing.status).toBe(404);
    expect(foreign.status).toBe(404);
    expect(foreign.body).toEqual(missing.body);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
  });
  it('rejects unsafe keys but parameterizes and addresses opaque legacy keys', async () => {
    for (const key of ['x'.repeat(201), 'bad\nkey'])
      expect((await api.get(endpoint(key)).auth(auth(), { type: 'bearer' })).status).toBe(400);
    const key = "Legacy / ' OR 1=1 -- ? 字";
    await commit({ characters: [character(key)] });
    expect((await read(key)).character.characterKey).toBe(key);
    expect((await api.get(endpoint('NotOwned')).auth(auth(), { type: 'bearer' })).status).toBe(404);
  });
  it('returns all five pieces, opaque keys, stored talent convention and unavailable main amounts', async () => {
    await full();
    const data = await read();
    expect(data.character).toMatchObject({
      level: 80,
      constellation: 3,
      talents: { normal: 9, skill: 12, burst: 15 },
      talentBasis: 'stored_convention_unknown',
    });
    expect(data.weapon).toMatchObject({
      state: 'recorded_assigned',
      item: { weaponKey: 'StaffOfHoma', level: 90, ascension: 6, refinement: 2, locked: true },
    });
    expect(Object.keys(data.artifacts)).toEqual([...artifactSlots]);
    for (const slot of artifactSlots)
      expect(data.artifacts[slot]).toMatchObject({
        state: 'recorded_assigned',
        item: {
          slotKey: slot,
          setKey: 'OpaqueSet',
          rarity: 5,
          level: 20,
          mainStatKey: 'opaque_stat_',
          mainStatValue: null,
          subStats: [{ key: 'unknown_substat', value: 7.7 }],
        },
      });
    expect(data.provenance.artifacts).toMatchObject({
      status: 'imported',
      source: 'C3a fixture',
      entryCount: 5,
      scope: 'replacement_section',
    });
  });
  it('keeps recorded assignments separate from missing legacy provenance', async () => {
    await full();
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    await db.genshinImportSectionState.deleteMany({ where: { accountId: account.id } });
    await db.genshinArtifact.deleteMany({ where: { accountId: account.id, slotKey: 'circlet' } });
    const data = await read();
    expect(data.weapon.state).toBe('recorded_assigned');
    expect(data.artifacts.flower.state).toBe('recorded_assigned');
    expect(data.provenance.characters.status).toBe('unknown');
    expect(data.artifacts.circlet).toEqual({
      state: 'unknown',
      item: null,
      reason: 'provenance_unknown',
    });
  });
  it('distinguishes absent sections from explicit empty replacements without claiming unequipped', async () => {
    await commit({ characters: [character()] });
    expect((await read()).weapon).toEqual({
      state: 'unknown',
      item: null,
      reason: 'provenance_unknown',
    });
    await commit({ weapons: [], artifacts: [] });
    const data = await read();
    expect(data.weapon).toEqual({
      state: 'unrecorded',
      item: null,
      reason: 'no_recorded_assignment',
    });
    for (const slot of artifactSlots) expect(data.artifacts[slot].state).toBe('unrecorded');
    expect(data.provenance.artifacts.entryCount).toBe(0);
  });
  it('does not confuse inventory pieces without assignments with this character’s equipment', async () => {
    await commit({
      characters: [character()],
      weapons: [{ ...weapon(), location: '' }],
      artifacts: [{ ...pieces()[0]!, location: '' }],
    });
    const data = await read();
    expect(data.weapon.state).toBe('unrecorded');
    expect(data.artifacts.flower.state).toBe('unrecorded');
    expect(data.provenance.artifacts.entryCount).toBe(1);
  });
  it('suppresses cross-account legacy relations in both detail and roster', async () => {
    const other = await user();
    await full();
    await commit(
      {
        characters: [character('PrivateCharacter')],
        weapons: [{ ...weapon('PrivateWeapon'), location: 'PrivateCharacter' }],
        artifacts: [{ ...pieces()[0]!, setKey: 'PrivateSet', location: 'PrivateCharacter' }],
      },
      'PrivateSource',
      importer,
      other,
    );
    const owned = await db.genshinCharacter.findFirstOrThrow({
      where: { account: { userId: owner } },
    });
    const foreign = await db.genshinCharacter.findFirstOrThrow({
      where: { account: { userId: other } },
    });
    await db.genshinCharacter.update({
      where: { id: foreign.id },
      data: { equippedWeaponId: null },
    });
    await db.genshinCharacter.update({
      where: { id: owned.id },
      data: { equippedWeaponId: foreign.equippedWeaponId },
    });
    await db.genshinArtifact.deleteMany({
      where: { accountId: owned.accountId, slotKey: 'flower' },
    });
    await db.genshinArtifact.updateMany({
      where: { accountId: foreign.accountId },
      data: { equippedCharacterId: owned.id },
    });
    const data = await read();
    expect(data.weapon).toEqual({ state: 'unknown', item: null, reason: 'inconsistent_relation' });
    expect(data.artifacts.flower).toEqual({
      state: 'unknown',
      item: null,
      reason: 'inconsistent_relation',
    });
    expect(JSON.stringify(data)).not.toMatch(/PrivateWeapon|PrivateSet|PrivateSource/);
    const roster = await api
      .get('/api/v1/games/genshin/characters')
      .auth(auth(), { type: 'bearer' });
    expect(roster.body.data.characters[0].equippedWeapon).toBeNull();
    expect(roster.body.data.characters[0].equippedWeaponId).toBeNull();
    expect(
      (await api.get(endpoint('PrivateCharacter')).auth(auth(), { type: 'bearer' })).status,
    ).toBe(404);
  });
  it('preserves equipment and its receipt through newer character-only and unrelated imports', async () => {
    await full();
    const before = await read();
    await commit({ characters: [character('Sethos')] }, 'newer character section');
    await commit({ materials: { Mora: 99 } }, 'materials only');
    const after = await read();
    expect(after.character).toEqual(before.character);
    expect(after.weapon).toEqual(before.weapon);
    expect(after.artifacts).toEqual(before.artifacts);
    expect(after.provenance.weapons).toEqual(before.provenance.weapons);
    expect(after.provenance.artifacts).toEqual(before.provenance.artifacts);
    expect(after.provenance.characters.source).toBe('newer character section');
    expect(after.provenance.characters.entryCount).toBe(1);
  });
  it('replacement IDs change while natural-key URLs, existing goals and routines survive', async () => {
    await full();
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    const ids = await db.genshinWeapon.findMany({ where: { accountId: account.id } });
    const goal = await db.upgradeGoal.create({
      data: {
        userId: owner,
        goalType: 'WEAPON_ASCENSION',
        targetKey: 'StaffOfHoma',
        fromPhase: 0,
        toPhase: 6,
      },
    });
    const routine = await db.genshinRoutineState.create({
      data: { userId: owner, serverId: 'asia', weeklyRewardClaims: 3 },
    });
    await commit(
      { weapons: [weapon('OpaqueReplacement', 70)], artifacts: pieces().slice(0, 2) },
      'replacement',
    );
    const data = await read();
    expect(data.weapon).toMatchObject({ item: { weaponKey: 'OpaqueReplacement', level: 70 } });
    expect(data.artifacts.circlet.state).toBe('unrecorded');
    expect((await db.genshinWeapon.findMany({ where: { accountId: account.id } }))[0]!.id).not.toBe(
      ids[0]!.id,
    );
    expect(await db.upgradeGoal.findUnique({ where: { id: goal.id } })).toEqual(goal);
    expect(await db.genshinRoutineState.findUnique({ where: { userId: owner } })).toEqual(routine);
  });
  it('rolls back real partial writes on a failed replacement, preserving the entire read view', async () => {
    await full();
    const before = await read();
    const failingDb = db.$extends({
      query: {
        genshinArtifact: {
          async createMany() {
            throw new Error('Injected artifact write failure');
          },
        },
      },
    });
    const failingImporter = new GenshinImportService(
      new GenshinImportRepository(failingDb as unknown as PrismaClient),
    );
    await expect(
      commit(
        {
          characters: [character('HuTao', 50)],
          weapons: [weapon('NewWeapon', 50)],
          artifacts: pieces(),
        },
        'failed replacement',
        failingImporter,
      ),
    ).rejects.toThrow('Injected artifact write failure');
    expect(await read()).toEqual(before);
  });
  it('reads a coherent old snapshot while an actual import has uncommitted equipment writes', async () => {
    await full();
    const before = await read();
    let release!: () => void;
    let reached!: () => void;
    const paused = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const pausedDb = db.$extends({
      query: {
        genshinArtifact: {
          async createMany({ args, query }) {
            reached();
            await gate;
            return query(args);
          },
        },
      },
    });
    const service = new GenshinImportService(
      new GenshinImportRepository(pausedDb as unknown as PrismaClient),
    );
    const input = request(
      {
        characters: [character('HuTao', 50)],
        weapons: [weapon('NewWeapon', 50)],
        artifacts: pieces().slice(0, 1),
      },
      'coherent replacement',
    );
    const preview = await service.preview(owner, input);
    const saving = service.importAccount(owner, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
    try {
      await paused;
      expect(await read()).toEqual(before);
    } finally {
      release();
      await saving;
    }
    const after = await read();
    expect(after.character.level).toBe(50);
    expect(after.weapon).toMatchObject({ item: { weaponKey: 'NewWeapon', level: 50 } });
    expect(after.provenance.characters.source).toBe('coherent replacement');
    expect(after.provenance.artifacts.entryCount).toBe(1);
  });
  it('keeps malformed legacy substats unavailable and unknown slot records readable', async () => {
    await full();
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    await db.genshinArtifact.updateMany({
      where: { accountId: account.id, slotKey: 'flower' },
      data: { subStats: { invalid: 'legacy' } },
    });
    await db.genshinArtifact.updateMany({
      where: { accountId: account.id, slotKey: 'circlet' },
      data: { slotKey: 'legacySlot' },
    });
    const data = await read();
    expect(data.artifacts.flower).toMatchObject({ item: { subStats: null, mainStatValue: null } });
    expect(data.unrecognizedSlots[0]!.slotKey).toBe('legacySlot');
    expect(data.artifacts.circlet.state).toBe('unrecorded');
  });
  it('equipment GETs execute domain, subject and session SELECTs and leave storage untouched', async () => {
    await full();
    const before = await new GenshinImportRepository(db).readSnapshot(owner);
    queries.length = 0;
    await read();
    await read();
    expect(queries).toHaveLength(6);
    expect(queries.filter((query) => query.includes('FROM "public"."sessions"'))).toHaveLength(2);
    expect(
      queries.filter((query) =>
        /^SELECT "public"\."users"\."id" FROM "public"\."users"/.test(query),
      ),
    ).toHaveLength(2);
    expect(queries.every((query) => /^SELECT\b/i.test(query.trim()))).toBe(true);
    expect(await new GenshinImportRepository(db).readSnapshot(owner)).toEqual(before);
  });
});
