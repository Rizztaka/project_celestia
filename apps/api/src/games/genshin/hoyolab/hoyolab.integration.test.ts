import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@/core/errors/app-error.js';

import { fixtureCookies, fixtureDetailResponse, fixtureRole } from './hoyolab.fixtures.js';
import { mapCharacters } from './hoyolab.mapper.js';
import { HoyolabRepository } from './hoyolab.repository.js';
import { HoyolabService } from './hoyolab.service.js';
import type { HoyolabSnapshot } from './hoyolab.types.js';
import { HoyolabVault } from './hoyolab.vault.js';

const databaseUrl = process.env.CELESTIA_TEST_DATABASE_URL;
if (databaseUrl) {
  const u = new URL(databaseUrl);
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(u.hostname) ||
    !u.pathname.startsWith('/celestia_test_')
  )
    throw Error('Explicit disposable loopback database required.');
}
describe.skipIf(!databaseUrl)('HoYoLAB real PostgreSQL snapshot lifecycle', () => {
  let db: PrismaClient, repo: HoyolabRepository, owner: string;
  const owners: string[] = [];
  let now = new Date('2026-10-23T12:00:00Z');
  const vault = new HoyolabVault(Buffer.alloc(32, 33));
  const snapshot = (): HoyolabSnapshot => ({
    role: fixtureRole,
    characters: mapCharacters(fixtureDetailResponse(), [10000038]),
    observedAt: now,
    notes: null,
  });
  const provider = {
    accounts: vi.fn(async () => [fixtureRole]),
    snapshot: vi.fn(async () => snapshot()),
  };
  let service: HoyolabService;
  const makeUser = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, email: `${id}@test.invalid`, username: `hoyo-${id}`, password: 'synthetic-only' },
    });
    return id;
  };
  beforeAll(() => {
    db = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl! }) });
    repo = new HoyolabRepository(db);
  });
  beforeEach(async () => {
    owner = await makeUser();
    now = new Date('2026-10-23T12:00:00Z');
    provider.accounts.mockReset().mockResolvedValue([fixtureRole]);
    provider.snapshot.mockReset().mockImplementation(async () => snapshot());
    service = new HoyolabService(repo, provider, vault, () => now);
  });
  afterEach(async () => {
    await db.user.deleteMany({ where: { id: { in: owners } } });
    owners.length = 0;
  });
  afterAll(async () => {
    if (db) {
      await db.user.deleteMany({ where: { id: { in: owners } } });
      await db.$disconnect();
    }
  });
  it('persists encrypted credentials, never exposes them in status, and isolates owners', async () => {
    const result = await service.connect(owner, fixtureCookies);
    expect(result).toMatchObject({ connected: true, role: fixtureRole, state: 'ready' });
    expect(JSON.stringify(result)).not.toMatch(/encryptedSession|synthetic-token|leaseId/);
    const row = await repo.read(owner);
    expect(row!.encryptedSession).not.toContain('synthetic-token');
    expect((await service.status(await makeUser())).connected).toBe(false);
  });
  it('refreshes complete equipped assignments idempotently, stores real values and leaves unknowns null', async () => {
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    const account = await db.genshinAccount.findUniqueOrThrow({
      where: { userId: owner },
      include: { characters: true, artifacts: true, weapons: true },
    });
    expect(account.characters[0]).toMatchObject({
      active: true,
      dataSource: 'hoyolab',
      ascension: null,
      talentSkill: 9,
    });
    expect(account.artifacts[0]).toMatchObject({ mainStatValue: 4780, locked: null });
    const weaponId = account.weapons[0]!.id;
    now = new Date(now.getTime() + 900_000);
    await service.sync(owner);
    expect(await db.genshinWeapon.count({ where: { accountId: account.id } })).toBe(1);
    expect(
      (await db.genshinCharacter.findFirstOrThrow({ where: { accountId: account.id } }))
        .equippedWeaponId,
    ).toBe(weaponId);
    expect((await service.status(owner)).syncedAt).toBe(now.toISOString());
  });
  it('keeps historical inventory recoverable while replacing equipped assignments and archiving stale forms', async () => {
    const account = await db.genshinAccount.create({
      data: { userId: owner, uid: fixtureRole.uid },
    });
    const old = await db.genshinCharacter.create({
      data: {
        accountId: account.id,
        characterKey: 'TravelerAnemo',
        level: 20,
        ascension: 0,
        constellation: 0,
        talentNormal: 1,
        talentSkill: 1,
        talentBurst: 1,
      },
    });
    const artifact = await db.genshinArtifact.create({
      data: {
        accountId: account.id,
        setKey: 'OldSet',
        slotKey: 'flower',
        level: 0,
        rarity: 5,
        mainStatKey: 'hp',
        subStats: [],
        equippedCharacterId: old.id,
      },
    });
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    expect((await db.genshinCharacter.findUniqueOrThrow({ where: { id: old.id } })).active).toBe(
      false,
    );
    expect(
      (await db.genshinArtifact.findUniqueOrThrow({ where: { id: artifact.id } }))
        .equippedCharacterId,
    ).toBeNull();
    expect(
      await db.genshinCharacter.count({ where: { accountId: account.id, active: true } }),
    ).toBe(1);
  });
  it('saves 250 characters and 1,250 equipped artifacts with bounded database round trips and stable identities', async () => {
    const counted = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl! }),
      log: [{ emit: 'event', level: 'query' }],
    });
    let queries = 0;
    counted.$on('query', () => {
      queries++;
    });
    const bulkRepo = new HoyolabRepository(counted);
    const apply = async (next: HoyolabSnapshot) => {
      now = new Date(now.getTime() + 900_000);
      const row = (await bulkRepo.read(owner))!;
      const lease = (await bulkRepo.claim(owner, row.generation, now, false))!;
      const before = queries;
      await bulkRepo.apply(owner, row.generation, lease, { ...next, observedAt: now }, now);
      return queries - before;
    };
    try {
      await service.connect(owner, fixtureCookies);
      const one = snapshot();
      const smallCount = await apply(one);
      const initial = await db.genshinCharacter.findFirstOrThrow({
        where: { account: { userId: owner } },
      });
      const full = snapshot();
      full.characters = Array.from({ length: 250 }, (_, i) => ({
        ...one.characters[0]!,
        key: i ? `HoyolabTest${i}` : 'Albedo',
        artifacts: ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slot) => ({
          ...one.characters[0]!.artifacts[0]!,
          slot,
        })),
      }));
      const fullCount = await apply(full);
      expect(fullCount).toBeLessThanOrEqual(smallCount + 2);
      expect(fullCount).toBeLessThan(30);
      expect(
        await db.genshinCharacter.count({ where: { accountId: initial.accountId, active: true } }),
      ).toBe(250);
      expect(await db.genshinWeapon.count({ where: { accountId: initial.accountId } })).toBe(250);
      expect(
        await db.genshinArtifact.count({
          where: { accountId: initial.accountId, equippedCharacterId: { not: null } },
        }),
      ).toBe(1250);
      const before = await db.genshinCharacter.findUniqueOrThrow({ where: { id: initial.id } });
      expect(before.equippedWeaponId).toBe(initial.equippedWeaponId);
      full.characters[0]!.level = 81;
      full.characters[0]!.artifacts[0]!.mainStatValue = 4800;
      await apply(full);
      expect(
        await db.genshinCharacter.findUniqueOrThrow({ where: { id: initial.id } }),
      ).toMatchObject({ level: 81, createdAt: initial.createdAt });
      expect(await db.genshinArtifact.count({ where: { accountId: initial.accountId } })).toBe(
        1250,
      );
      expect(
        await db.genshinArtifact.findUniqueOrThrow({
          where: { id: `hoyolab:artifact:${initial.id}:flower` },
        }),
      ).toMatchObject({ mainStatValue: 4800 });
      expect(
        await db.genshinAccount.findUnique({ where: { userId: await makeUser() } }),
      ).toBeNull();
    } finally {
      await counted.$disconnect();
    }
  });
  it.each(['weapon', 'artifact'] as const)(
    'rejects a conflicting %s identity owned by another account without partial writes',
    async (kind) => {
      const account = await db.genshinAccount.create({
        data: { userId: owner, uid: fixtureRole.uid },
      });
      const original = await db.genshinCharacter.create({
        data: {
          accountId: account.id,
          characterKey: 'Albedo',
          level: 20,
          ascension: 0,
          constellation: 0,
          talentNormal: 1,
          talentSkill: 1,
          talentBurst: 1,
        },
      });
      const foreign = await db.genshinAccount.create({ data: { userId: await makeUser() } });
      const id = `hoyolab:${kind}:${original.id}${kind === 'artifact' ? ':flower' : ''}`;
      if (kind === 'weapon')
        await db.genshinWeapon.create({
          data: {
            id,
            accountId: foreign.id,
            weaponKey: 'UntouchedWeapon',
            level: 1,
            ascension: 0,
            refinement: 1,
          },
        });
      else
        await db.genshinArtifact.create({
          data: {
            id,
            accountId: foreign.id,
            setKey: 'UntouchedSet',
            slotKey: 'flower',
            level: 0,
            rarity: 5,
            mainStatKey: 'hp',
            subStats: [],
          },
        });
      await service.connect(owner, fixtureCookies);
      await expect(service.sync(owner)).rejects.toMatchObject({ errorCode: 'HOYOLAB_CHANGED' });
      expect(await db.genshinCharacter.findUniqueOrThrow({ where: { id: original.id } })).toEqual(
        original,
      );
      if (kind === 'weapon')
        expect(await db.genshinWeapon.findUniqueOrThrow({ where: { id } })).toMatchObject({
          accountId: foreign.id,
          weaponKey: 'UntouchedWeapon',
          level: 1,
        });
      else
        expect(await db.genshinArtifact.findUniqueOrThrow({ where: { id } })).toMatchObject({
          accountId: foreign.id,
          setKey: 'UntouchedSet',
          equippedCharacterId: null,
        });
      expect(await db.genshinWeapon.count({ where: { accountId: account.id } })).toBe(0);
      expect((await service.status(owner)).syncedAt).toBeNull();
    },
  );
  it('preserves last good builds on provider failure and reports reconnect accurately', async () => {
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    const before = await db.genshinCharacter.findMany({ where: { account: { userId: owner } } });
    now = new Date(now.getTime() + 900_000);
    provider.snapshot.mockRejectedValueOnce(
      new AppError('Reconnect HoYoLAB.', 409, 'HOYOLAB_RECONNECT'),
    );
    await expect(service.sync(owner)).rejects.toMatchObject({ errorCode: 'HOYOLAB_RECONNECT' });
    expect(await db.genshinCharacter.findMany({ where: { account: { userId: owner } } })).toEqual(
      before,
    );
    expect(await service.status(owner)).toMatchObject({
      state: 'reconnect',
      nextSyncAt: null,
      syncedAt: '2026-10-23T12:00:00.000Z',
    });
  });
  it('rejects concurrent refreshes and enforces refresh cooldown', async () => {
    await service.connect(owner, fixtureCookies);
    const row = (await repo.read(owner))!;
    const claims = await Promise.all([
      repo.claim(owner, row.generation, now, false),
      repo.claim(owner, row.generation, now, false),
    ]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    await expect(service.sync(owner)).rejects.toMatchObject({ errorCode: 'HOYOLAB_COOLDOWN' });
  });
  it('disconnect fences an in-flight snapshot before any build changes', async () => {
    await service.connect(owner, fixtureCookies);
    const row = (await repo.read(owner))!,
      lease = (await repo.claim(owner, row.generation, now, false))!;
    await service.disconnect(owner);
    await expect(repo.apply(owner, row.generation, lease, snapshot(), now)).rejects.toMatchObject({
      errorCode: 'HOYOLAB_CHANGED',
    });
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
    expect((await repo.read(owner))!.encryptedSession).toBeNull();
  });
  it('disconnect also fences a pending first connection and account deletion cascades secrets', async () => {
    const prior = await repo.read(owner);
    await service.disconnect(owner);
    await expect(
      repo.connect(
        owner,
        vault.seal(owner, fixtureCookies),
        [fixtureRole],
        now,
        prior?.generation ?? null,
      ),
    ).rejects.toMatchObject({ errorCode: 'HOYOLAB_CHANGED' });
    await service.connect(owner, fixtureCookies);
    await db.user.delete({ where: { id: owner } });
    expect(await repo.read(owner)).toBeNull();
    await expect(repo.connect(owner, 'encrypted', [fixtureRole], now, null)).rejects.toMatchObject({
      statusCode: 401,
    });
  });
  it('rejects switching UID over existing saved builds', async () => {
    await db.genshinAccount.create({ data: { userId: owner, uid: '800000002' } });
    await service.connect(owner, fixtureCookies);
    expect((await service.status(owner)).state).toBe('choose_account');
    await expect(service.select(owner, fixtureRole)).rejects.toMatchObject({
      errorCode: 'HOYOLAB_ACCOUNT_MISMATCH',
    });
    expect((await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } })).uid).toBe(
      '800000002',
    );
  });
  it('rolls back all changes if a snapshot fails during persistence', async () => {
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    const before = await db.genshinCharacter.findMany({ where: { account: { userId: owner } } });
    now = new Date(now.getTime() + 900_000);
    const row = (await repo.read(owner))!,
      lease = (await repo.claim(owner, row.generation, now, false))!;
    const invalid = snapshot();
    invalid.characters[0]!.level = NaN;
    await expect(repo.apply(owner, row.generation, lease, invalid, now)).rejects.toThrow();
    expect(await db.genshinCharacter.findMany({ where: { account: { userId: owner } } })).toEqual(
      before,
    );
  });
  it('enables RLS for credentials and has no browser policies', async () => {
    const tables = await db.$queryRaw<
      { relrowsecurity: boolean }[]
    >`SELECT relrowsecurity FROM pg_class WHERE relname = 'genshin_hoyolab_connections'`;
    expect(tables[0]!.relrowsecurity).toBe(true);
    const policies = await db.$queryRaw<
      unknown[]
    >`SELECT policyname::text FROM pg_policies WHERE tablename = 'genshin_hoyolab_connections'`;
    expect(policies).toHaveLength(0);
  });
  it('can disconnect a stored session even when its encryption key is unavailable', async () => {
    await service.connect(owner, fixtureCookies);
    const disabled = new HoyolabService(repo, provider, new HoyolabVault(null), () => now);
    expect(await disabled.status(owner)).toMatchObject({
      connected: true,
      available: false,
      state: 'not_configured',
    });
    await disabled.disconnect(owner);
    expect((await repo.read(owner))!.encryptedSession).toBeNull();
  });
  it('initializes the owned server without overwriting manual reset settings', async () => {
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    expect(
      (await db.genshinRoutineState.findUniqueOrThrow({ where: { userId: owner } })).serverId,
    ).toBe('asia');
    await db.genshinRoutineState.update({
      where: { userId: owner },
      data: { serverId: 'europe', revision: 2 },
    });
    now = new Date(now.getTime() + 900000);
    await service.sync(owner);
    expect(
      await db.genshinRoutineState.findUniqueOrThrow({ where: { userId: owner } }),
    ).toMatchObject({ serverId: 'europe', revision: 2 });
  });
  it('schedules only linked accounts that are due and honors automatic due-time claims', async () => {
    await service.connect(owner, fixtureCookies);
    await service.sync(owner);
    expect(
      await repo.claim(
        owner,
        (await repo.read(owner))!.generation,
        new Date(now.getTime() + 60000),
        true,
      ),
    ).toBeNull();
    now = new Date(now.getTime() + 900001);
    expect(await repo.due(now)).toContainEqual({ userId: owner });
    await service.disconnect(owner);
    expect(await repo.due(now)).not.toContainEqual({ userId: owner });
  });
  it('checks UID isolation after a concurrent first-account commit, rather than reading stale account state', async () => {
    const other = { ...fixtureRole, uid: '800000002' };
    provider.accounts.mockResolvedValue([fixtureRole, other]);
    await service.connect(owner, fixtureCookies);
    await service.select(owner, fixtureRole);
    const row = (await repo.read(owner))!;
    let ready!: () => void, release!: () => void;
    const started = new Promise<void>((resolve) => {
      ready = resolve;
    });
    const proceed = new Promise<void>((resolve) => {
      release = resolve;
    });
    let holderPid = 0;
    const writing = db.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM users WHERE id = ${owner} FOR UPDATE`;
        holderPid = (await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`)[0]!.pid;
        await tx.genshinAccount.create({ data: { userId: owner, uid: fixtureRole.uid } });
        await tx.genshinHoyolabConnection.update({
          where: { userId: owner },
          data: { state: 'ready' },
        });
        ready();
        await proceed;
      },
      { timeout: 15000 },
    );
    await started;
    const selecting = repo.select(owner, other, row.generation, now).then(
      () => null,
      (error) => error,
    );
    try {
      let blocked = false;
      for (let i = 0; i < 100 && !blocked; i++) {
        const [result] = await db.$queryRaw<
          { waiting: boolean }[]
        >`SELECT EXISTS(SELECT 1 FROM pg_stat_activity WHERE ${holderPid} = ANY(pg_blocking_pids(pid))) AS waiting`;
        blocked = result!.waiting;
        if (!blocked) await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(blocked).toBe(true);
    } finally {
      release();
    }
    await writing;
    expect(await selecting).toMatchObject({ errorCode: 'HOYOLAB_ACCOUNT_MISMATCH' });
    expect((await repo.read(owner))!.selectedUid).toBe(fixtureRole.uid);
  });
});
