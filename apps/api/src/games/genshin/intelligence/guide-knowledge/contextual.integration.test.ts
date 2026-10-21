import { randomUUID } from 'node:crypto';

import {
  artifactSlots,
  contextualAdviceSchema,
  contextualReleaseAdviceSchema,
  contextualReleaseMetadataSchema,
  contextualSets,
} from '@celestia/api-contracts';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import supertest from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { disposableTestDatabase } from '@/core/db/disposable-test-database.js';

import { GenshinImportRepository } from '../../importer/importer.repository.js';
import { GenshinImportService } from '../../importer/importer.service.js';

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
const secret = 'local-k2-test-secret-at-least-32-characters';
vi.mock('@/core/config/env.js', () => ({
  env: {
    NODE_ENV: 'test',
    JWT_SECRET: 'local-k2-test-secret-at-least-32-characters',
    JWT_EXPIRY: '1h',
  },
}));
import { app } from '@/app.js';

const url = disposableTestDatabase();
describe.skipIf(!url)('K2 actual PostgreSQL owned contextual guidance', () => {
  let db: PrismaClient, importer: GenshinImportService, owner: string;
  const owners: string[] = [],
    queries: string[] = [];
  const api = supertest(app);
  const endpoint = (key = 'Keqing', query = 'contractVersion=2') =>
    '/api/v1/games/genshin/characters/' + encodeURIComponent(key) + '/guide-advice/v2?' + query;
  const auth = (id = owner) => jwt.sign({ sid: id }, secret, { subject: id });
  const get = (key = 'Keqing', query = 'contractVersion=2', id = owner) =>
    api.get(endpoint(key, query)).auth(auth(id), { type: 'bearer' });
  const teamQuery = (members: { characterKey: string; selection: string }[]) =>
    'contractVersion=2&team=' + encodeURIComponent(JSON.stringify(members));
  const user = async () => {
    const id = randomUUID();
    owners.push(id);
    await db.user.create({
      data: { id, username: 'k2-' + id, email: id + '@test.invalid', password: 'synthetic-only' },
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
  const commit = async (id = owner, pieces = 4, refinement = 1) => {
    const keys = ['Keqing', 'Fischl', 'KaedeharaKazuha', 'HuTao'];
    const input = {
      requestVersion: 1,
      sections: ['characters', 'weapons', 'artifacts'],
      payload: {
        format: 'GOOD',
        version: 2,
        source: 'K2 synthetic integration',
        characters: keys.map((key) => ({
          key,
          level: 80,
          ascension: 6,
          constellation: 0,
          talent: { auto: 1, skill: 8, burst: 6 },
        })),
        weapons: [
          {
            key: 'HarbingerOfDawn',
            level: 80,
            ascension: 6,
            refinement,
            location: 'Keqing',
            lock: false,
          },
        ],
        artifacts: keys.slice(0, 3).flatMap((key, index) =>
          artifactSlots.slice(0, pieces).map((slotKey) => ({
            setKey: ['MarechausseeHunter', 'GoldenTroupe', 'ViridescentVenerer'][index],
            slotKey,
            rarity: 5,
            level: 20,
            mainStatKey: 'opaque',
            location: key,
            substats: [],
            lock: false,
          })),
        ),
      },
    };
    const preview = await importer.preview(id, input);
    await importer.importAccount(id, {
      ...input,
      previewToken: preview.previewToken,
      confirmClear: preview.clearSections,
    });
  };
  beforeAll(() => {
    const client = new PrismaClient({
      adapter: new PrismaPg({ connectionString: url! }),
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
  it('requires auth and keeps missing/foreign owned reads non-enumerating without initializing accounts', async () => {
    expect((await api.get(endpoint())).status).toBe(401);
    const missing = await get();
    const foreign = await user();
    await commit(foreign);
    expect(missing.status).toBe(404);
    expect((await get()).body).toEqual(missing.body);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
  });
  it('authenticates loaded release metadata and keeps its GET SELECT-only without account initialization', async () => {
    const path = '/api/v1/games/genshin/guide-knowledge/release';
    expect((await api.get(path)).status).toBe(401);
    queries.length = 0;
    const response = await api.get(path).auth(auth(), { type: 'bearer' });
    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    const metadata = contextualReleaseMetadataSchema.parse(response.body.data);
    expect(metadata.release.id).toBe('k3-approved-k2-baseline');
    expect(metadata.reviewerTypes).toEqual(['agent']);
    expect(JSON.stringify(metadata)).not.toMatch(/localPath|dataDir|staging-|D:\\\\/);
    expect(queries.some((query) => /\b(INSERT|UPDATE|DELETE)\b/i.test(query))).toBe(false);
    expect(await db.genshinAccount.findUnique({ where: { userId: owner } })).toBeNull();
    expect((await api.get(path + '?release=other').auth(auth(), { type: 'bearer' })).status).toBe(
      400,
    );
  });
  it('serves strict V3 identity aligned with metadata while preserving exact V1/V2 response shapes', async () => {
    await commit();
    queries.length = 0;
    const metadata = contextualReleaseMetadataSchema.parse(
      (
        await api
          .get('/api/v1/games/genshin/guide-knowledge/release')
          .auth(auth(), { type: 'bearer' })
      ).body.data,
    );
    const route = '/api/v1/games/genshin/characters/Keqing/guide-advice/v3?contractVersion=2';
    const response = await api.get(route).auth(auth(), { type: 'bearer' });
    expect(response.status).toBe(200);
    const current = contextualReleaseAdviceSchema.parse(response.body.data);
    expect(current.release).toEqual(metadata.release);
    expect(contextualAdviceSchema.safeParse(current).success).toBe(false);
    expect(contextualAdviceSchema.safeParse(current.advice).success).toBe(false);
    const legacy = contextualAdviceSchema.parse((await get()).body.data);
    expect(Object.keys(legacy)).not.toContain('release');
    expect(current.advice.cards).toEqual(legacy.cards);
    expect(current.advice.observationFingerprint).toBe(legacy.observationFingerprint);
    expect(current.advice.fingerprint).not.toBe(legacy.fingerprint);
    expect(queries.some((query) => /\b(INSERT|UPDATE|DELETE)\b/i.test(query))).toBe(false);
  });
  it('keeps V3 owned misses non-enumerating and rejects malformed V3 scenarios', async () => {
    const route = '/api/v1/games/genshin/characters/Keqing/guide-advice/v3';
    expect((await api.get(route + '?contractVersion=2')).status).toBe(401);
    expect(
      (await api.get(route + '?contractVersion=2').auth(auth(), { type: 'bearer' })).status,
    ).toBe(404);
    for (const query of [
      'contractVersion=3',
      'contractVersion=2&contractVersion=2',
      'contractVersion=2&release=ignored',
      'contractVersion=2&mhStacks=4',
    ])
      expect((await api.get(route + '?' + query).auth(auth(), { type: 'bearer' })).status).toBe(
        400,
      );
  });
  it.each([
    '',
    'contractVersion=1',
    'contractVersion=3',
    'contractVersion=2&contractVersion=2',
    'contractVersion=2&role=off_field&role=on_field',
    'contractVersion=2&userId=other',
    'contractVersion=2&ownerId=other',
    'contractVersion=2&mhStacks=4',
    'contractVersion=2&hpChange[x]=yes',
    'contractVersion=2&team=invalid',
    'contractVersion=2&examplePieces=4',
    'contractVersion=2&activeCharacter=Missing',
    'contractVersion=2&exampleFischlA4=unlocked',
  ])('strictly rejects malformed/versioned/duplicate scenario %s', async (query) => {
    expect((await get('Keqing', query)).status).toBe(400);
  });
  it('rejects duplicate/current/oversized teams and unsupported hypothetical or ability roles', async () => {
    for (const members of [
      [
        { characterKey: 'Fischl', selection: 'owned' },
        { characterKey: 'Fischl', selection: 'hypothetical' },
      ],
      [{ characterKey: 'Keqing', selection: 'owned' }],
      ['Fischl', 'KaedeharaKazuha', 'HuTao', 'X'].map((characterKey) => ({
        characterKey,
        selection: 'owned',
      })),
      [{ characterKey: 'HuTao', selection: 'hypothetical' }],
    ])
      expect((await get('Keqing', teamQuery(members))).status).toBe(400);
    expect((await get('Keqing', 'contractVersion=2&role=off_field')).status).toBe(400);
  });
  it('validates all three real owned pages and changes role reasoning without inventing talent deficits', async () => {
    await commit();
    for (const [key, role, claim] of [
      ['Keqing', 'on_field', 'talent-on-field'],
      ['Fischl', 'off_field', 'talent-oz-off-field'],
      ['KaedeharaKazuha', 'quickswap_support', 'talent-support-plunge'],
    ]) {
      const response = await get(key, 'contractVersion=2&role=' + role);
      expect(response.status).toBe(200);
      const data = contextualAdviceSchema.parse(response.body.data);
      expect(
        data.cards.find(
          (card) => card.effect.kind === 'talent_relevance' && card.presentation === 'card',
        )?.id,
      ).toBe(claim);
      expect(JSON.stringify(data)).not.toContain('talentDeficit');
      expect(data.coverage).toBe('supported');
    }
    const off = (await get('Fischl', 'contractVersion=2&role=off_field')).body.data;
    const on = (await get('Fischl', 'contractVersion=2&role=on_field')).body.data;
    expect(on.fingerprint).not.toBe(off.fingerprint);
    expect(on.cards.find((c: { id: string }) => c.id === 'talent-on-field').applicability).toBe(
      'true',
    );
  });
  it('keeps partial assignments as lower/upper bounds, with distinct trigger and unit evidence', async () => {
    await commit(owner, 2);
    const partial = (await get()).body.data;
    expect(partial.setBounds[0].recorded).toEqual({ min: 2, max: 5 });
    expect(
      partial.cards.find((c: { id: string }) => c.id === 'mh-four-piece-stacks').eligibility,
    ).toBe('unknown');
    const active = (
      await get(
        'Keqing',
        'contractVersion=2&setExample=MarechausseeHunter&examplePieces=4&hpChange=yes&mhOnField=yes&mhStacks=2&mhWindow=within_5s',
      )
    ).body.data;
    expect(active.cards.find((c: { id: string }) => c.id === 'mh-four-piece-stacks')).toMatchObject(
      {
        eligibility: 'true',
        modeledAmount: 24,
        potential: { unit: 'crit_rate_percentage_points' },
      },
    );
    expect(active.setBounds[0].recorded).toEqual({ min: 2, max: 5 });
    expect(
      (await get('Fischl', 'contractVersion=2&gtField=off_field')).body.data.cards.find(
        (c: { id: string }) => c.id === 'gt-four-piece-field',
      ).eligibility,
    ).toBe('unknown');
  });
  it('uses a single owned SELECT snapshot for all members and never writes hypothetical context', async () => {
    await commit();
    queries.length = 0;
    const query =
      teamQuery([
        { characterKey: 'Fischl', selection: 'owned' },
        { characterKey: 'KaedeharaKazuha', selection: 'hypothetical' },
      ]) + '&activeCharacter=Keqing&oz=yes&electroReaction=yes';
    const response = await get('Keqing', query);
    expect(response.status).toBe(200);
    expect(response.body.data.team).toHaveLength(3);
    expect(
      response.body.data.cards.find((c: { id: string }) => c.id === 'team-fischl-oz-reaction'),
    ).toMatchObject({ applicability: 'true' });
    expect(queries.filter((q) => q.includes('to_jsonb(c) AS character'))).toHaveLength(1);
    expect(queries.some((q) => /\b(INSERT|UPDATE|DELETE)\b/i.test(q))).toBe(false);
    const recorded = (await get()).body.data;
    expect(recorded.scenario.team).toBeUndefined();
    expect(recorded.setBounds[0].recorded.min).toBe(4);
  });
  it('does not infer reaction/passive activation from membership and distinguishes hypothetical unlock', async () => {
    await commit();
    const owned = teamQuery([{ characterKey: 'Fischl', selection: 'owned' }]);
    expect(
      (await get('Keqing', owned)).body.data.cards.find(
        (c: { id: string }) => c.id === 'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('unknown');
    const example =
      teamQuery([{ characterKey: 'Fischl', selection: 'hypothetical' }]) +
      '&activeCharacter=Keqing&oz=yes&electroReaction=yes';
    expect(
      (await get('Keqing', example)).body.data.cards.find(
        (c: { id: string }) => c.id === 'team-fischl-oz-reaction',
      ).applicability,
    ).toBe('unknown');
    const active = (await get('Keqing', example + '&exampleFischlA4=unlocked')).body.data;
    expect(
      active.cards.find((c: { id: string }) => c.id === 'team-fischl-oz-reaction').trace,
    ).toContainEqual(
      expect.objectContaining({ fact: 'team.fischlAscension', origin: 'assumed', value: 4 }),
    );
    expect(
      (await get('Keqing', teamQuery([{ characterKey: 'Missing', selection: 'owned' }]))).status,
    ).toBe(404);
  });
  it('normalizes team order, ignores unrelated routine writes and rekeys relevant re-imports', async () => {
    await commit();
    const members = [
      { characterKey: 'Fischl', selection: 'owned' },
      { characterKey: 'KaedeharaKazuha', selection: 'owned' },
    ];
    const first = (await get('Keqing', teamQuery(members))).body.data;
    expect((await get('Keqing', teamQuery([...members].reverse()))).body.data).toEqual(first);
    await db.genshinRoutineState.create({ data: { userId: owner, teapotChecked: true } });
    expect((await get('Keqing', teamQuery(members))).body.data).toEqual(first);
    await commit(owner, 2, 5);
    const next = (await get('Keqing', teamQuery(members))).body.data;
    expect(next.observationFingerprint).not.toBe(first.observationFingerprint);
    expect(next.setBounds[0].recorded).toEqual({ min: 2, max: 5 });
  });
  it('keeps team/current ascension coherent while atomic owned updates commit concurrently', async () => {
    await commit();
    const account = await db.genshinAccount.findUniqueOrThrow({ where: { userId: owner } });
    const writes = (async () => {
      for (let i = 0; i < 12; i++)
        await db.$transaction(async (tx) => {
          await tx.genshinCharacter.updateMany({
            where: { accountId: account.id, characterKey: 'Keqing' },
            data: { ascension: i % 2 ? 6 : 4 },
          });
          await tx.genshinCharacter.updateMany({
            where: { accountId: account.id, characterKey: 'Fischl' },
            data: { ascension: i % 2 ? 6 : 4 },
          });
        });
    })();
    for (let i = 0; i < 10; i++) {
      const response = await get(
        'Keqing',
        teamQuery([{ characterKey: 'Fischl', selection: 'owned' }]),
      );
      expect(response.status).toBe(200);
      expect(
        new Set(response.body.data.team.map((m: { ascension: number }) => m.ascension)).size,
      ).toBe(1);
    }
    await writes;
  });
  it('does not certify eligibility with foreign artifact relations', async () => {
    await commit();
    const other = await user();
    await commit(other);
    const own = await db.genshinCharacter.findFirstOrThrow({
      where: { account: { userId: owner }, characterKey: 'Keqing' },
    });
    const foreign = await db.genshinArtifact.findFirstOrThrow({
      where: { account: { userId: other } },
    });
    await db.genshinArtifact.updateMany({
      where: { equippedCharacterId: own.id, slotKey: foreign.slotKey },
      data: { equippedCharacterId: null },
    });
    await db.genshinArtifact.update({
      where: { id: foreign.id },
      data: { equippedCharacterId: own.id },
    });
    expect((await get()).body.data.setBounds[0].recorded).toEqual({ min: 0, max: 5 });
  });
  it('preserves exact V1 Harbinger semantics and unsupported equipment browsing', async () => {
    await commit(owner, 4, 5);
    const v1 = await api
      .get('/api/v1/games/genshin/characters/Keqing/guide-advice?contractVersion=1&hp=above_90')
      .auth(auth(), { type: 'bearer' });
    expect(v1.body.data).toMatchObject({
      contractVersion: 1,
      modeledCritRatePp: 28,
      refinement: 5,
    });
    expect((await get('HuTao')).body.data).toMatchObject({ coverage: 'unsupported', cards: [] });
    expect(
      (
        await api
          .get('/api/v1/games/genshin/characters/HuTao/equipment')
          .auth(auth(), { type: 'bearer' })
      ).status,
    ).toBe(200);
  });
  it.each(
    contextualSets.flatMap((setKey) =>
      ['0', '1', '2', '3', '4', '5', 'unknown'].map((count) => [setKey, count] as const),
    ),
  )(
    'preserves unspecified slots through the owned API for %s=%s without writes',
    async (selected, count) => {
      await commit();
      const equipmentPath = '/api/v1/games/genshin/characters/KaedeharaKazuha/equipment';
      const before = (await api.get(equipmentPath).auth(auth(), { type: 'bearer' })).body.data;
      queries.length = 0;
      const query = `contractVersion=2&setExample=${selected}&examplePieces=${count}`;
      const response = await get('KaedeharaKazuha', query);
      expect(response.status).toBe(200);
      const data = contextualAdviceSchema.parse(response.body.data);
      for (const [index, setKey] of contextualSets.entries()) {
        const bounds = data.setBounds[index]!;
        const modeled =
          count === 'unknown'
            ? { min: 0, max: 5 }
            : setKey === selected
              ? { min: Number(count), max: Number(count) }
              : { min: 0, max: 5 - Number(count) };
        const origin = count === 'unknown' ? 'unknown' : 'assumed';
        const eligibility = modeled.min >= 2 ? 'true' : modeled.max < 2 ? 'false' : 'unknown';
        const component = data.cards.find(
          (card) => card.id === ['mh-two-piece', 'gt-two-piece', 'vv-two-piece'][index],
        )!;
        expect(bounds).toMatchObject({ setKey, modeled, origin });
        expect(bounds.recorded).toEqual(
          setKey === 'ViridescentVenerer' ? { min: 4, max: 5 } : { min: 0, max: 1 },
        );
        expect(component).toMatchObject({
          eligibility,
          applicability: eligibility,
          conclusion:
            eligibility === 'true'
              ? 'applies'
              : eligibility === 'false'
                ? 'inactive'
                : 'conditional',
        });
        const leaf = {
          op: 'atLeast',
          fact: `set.${setKey}`,
          value: modeled,
          expected: 2,
          origin,
          result: eligibility,
        };
        expect(component.trace).toEqual([
          { ...leaf, path: 'eligibility' },
          { ...leaf, path: 'applicability.0' },
          { ...leaf, path: 'applicability.1' },
          {
            path: 'applicability',
            op: 'all',
            fact: null,
            value: null,
            expected: null,
            origin,
            result: eligibility,
          },
        ]);
        expect(component.modeledAmount).toBe(
          eligibility === 'true' ? component.potential!.amount : eligibility === 'false' ? 0 : null,
        );
        if (eligibility === 'unknown') expect(component.summary).toContain('Conditional');
      }
      expect((await get('KaedeharaKazuha', query)).body.data).toEqual(data);
      expect(queries.some((sql) => /\b(INSERT|UPDATE|DELETE)\b/i.test(sql))).toBe(false);
      expect((await api.get(equipmentPath).auth(auth(), { type: 'bearer' })).body.data).toEqual(
        before,
      );
    },
  );
  it('changes qualitative Burst context for each subject without issuing a numeric ER target', async () => {
    await commit();
    for (const key of ['Keqing', 'Fischl', 'KaedeharaKazuha']) {
      const use = (await get(key, 'contractVersion=2&burst=use')).body.data;
      const skip = (await get(key, 'contractVersion=2&burst=skip')).body.data;
      expect(
        use.cards.find(
          (c: { topic: string; presentation: string }) =>
            c.topic === 'energy' && c.presentation === 'card',
        ).summary,
      ).not.toBe(
        skip.cards.find(
          (c: { topic: string; presentation: string }) =>
            c.topic === 'energy' && c.presentation === 'card',
        ).summary,
      );
      expect(JSON.stringify(use)).not.toMatch(/"(erTarget|energyDeficit|score)":/);
    }
  });
});
