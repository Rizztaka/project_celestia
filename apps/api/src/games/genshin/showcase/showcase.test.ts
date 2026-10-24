import { showcaseUidSchema } from '@celestia/api-contracts';
import express from 'express';
import request from 'supertest';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { syntheticShowcase } from './showcase.fixtures.js';
import { enkaIcon, formatShowcaseStat, parseShowcase } from './showcase.parser.js';
import { createShowcaseRoutes } from './showcase.routes.js';
import { ShowcaseService } from './showcase.service.js';

const uid = '800000001';
const ok = () =>
  new Response(JSON.stringify(syntheticShowcase()), {
    headers: { 'Content-Type': 'application/json' },
  });
afterEach(() => vi.restoreAllMocks());
describe('Public showcase data contract', () => {
  it.each(['800000001', '1800000001'])('accepts numeric UID %s', (value) =>
    expect(showcaseUidSchema.safeParse(value).success).toBe(true),
  );
  it.each([
    '',
    ' 800000001',
    '000000000',
    '123',
    '80000000a',
    '../800000001',
    '800000001?info',
    '12345678901',
  ])('rejects unsafe UID %s', (value) =>
    expect(showcaseUidSchema.safeParse(value).success).toBe(false),
  );
  it('maps identity, explicit progression, weapon refinement and artifact level/slot without importing a roster', () => {
    const { snapshot } = parseShowcase(uid, syntheticShowcase());
    expect(snapshot.characters).toHaveLength(1);
    expect(snapshot.characters[0]).toMatchObject({
      name: 'Hu Tao',
      element: 'Pyro',
      weaponType: 'Polearm',
      rarity: 5,
      level: 80,
      ascension: 6,
      constellation: 1,
      weapon: { name: 'Staff of Homa', refinement: 1, level: 90, ascension: 6 },
      artifacts: [
        {
          level: 20,
          slot: 'Flower',
          setName: 'Crimson Witch of Flames',
          mainStat: { id: 'FIGHT_PROP_HP', value: 4780, formatted: '4,780' },
        },
      ],
      talents: [
        {
          id: '10461',
          label: 'Secret Spear of Wangsheng',
          kind: 'normal',
          baseLevel: 8,
          bonusLevel: null,
        },
        { id: '10462', label: 'Guide to Afterlife', kind: 'skill', baseLevel: 9, bonusLevel: 3 },
        { id: '10463', label: 'Spirit Soother', kind: 'burst', baseLevel: 10 },
      ],
    });
  });
  it('uses the skill-depot metadata for Traveler and retains unknown characters', () => {
    const raw = syntheticShowcase();
    raw.avatarInfoList[0]!.avatarId = 10000005;
    raw.avatarInfoList[0]!.skillDepotId = 504;
    expect(parseShowcase(uid, raw).snapshot.characters[0]!.portrait).toContain('PlayerBoy');
    raw.avatarInfoList[0]!.avatarId = 99999999;
    expect(parseShowcase(uid, raw).snapshot.characters[0]).toMatchObject({
      name: 'Character 99999999',
      metadataAvailable: false,
      portrait: null,
      element: null,
      weaponType: null,
      rarity: null,
    });
  });
  it.each([
    [10000021, 'Bow', 4],
    [10000046, 'Polearm', 5],
    [10000114, 'Sword', 5],
    [10000125, 'Catalyst', 5],
  ])(
    'maps character weapon type and rarity for %s even without equipped gear',
    (avatarId, weaponType, rarity) => {
      const raw = {
        ...syntheticShowcase(),
        avatarInfoList: [{ avatarId, propMap: {}, fightPropMap: {} }],
      };
      expect(parseShowcase(uid, raw).snapshot.characters[0]).toMatchObject({
        weaponType,
        rarity,
        weapon: null,
      });
    },
  );
  it.each([
    [
      10000005,
      504,
      { '10068': 7, '100543': 6, '10067': 8 },
      ['Foreign Ironwind', 'Palm Vortex', 'Gust Surge'],
    ],
    [
      10000007,
      706,
      { '10078': 7, '100555': 6, '10077': 8 },
      ['Foreign Rockblade', 'Starfell Sword', 'Wake of Earth'],
    ],
    [
      10000005,
      502,
      { '10098': 7, '100541': 6, '10097': 8 },
      ['Foreign Blaze', 'Flowfire Blade', 'Plains Scorcher'],
    ],
    [
      10000114,
      11401,
      { '11145': 7, '11141': 6, '11142': 8 },
      ['Havoc: Sunder', 'Havoc: Warp', 'Havoc: Ruin'],
    ],
  ])(
    'names reported talents for avatar %s depot %s independently of response order',
    (avatarId, skillDepotId, skillLevelMap, names) => {
      const raw = {
        ...syntheticShowcase(),
        avatarInfoList: [{ avatarId, skillDepotId, propMap: {}, fightPropMap: {}, skillLevelMap }],
      };
      const talents = parseShowcase(uid, raw).snapshot.characters[0]!.talents;
      expect(talents.map((talent) => talent.label)).toEqual(names);
      expect(talents.map((talent) => talent.kind)).toEqual(['normal', 'skill', 'burst']);
      expect(talents.map((talent) => talent.baseLevel)).toEqual([6, 8, 7]);
    },
  );
  it('keeps partial talents matched by skill ID and does not invent names for unknown skills or characters', () => {
    const raw = {
      ...syntheticShowcase(),
      avatarInfoList: [
        {
          avatarId: 10000046,
          propMap: {},
          fightPropMap: {},
          skillLevelMap: { '10463': 7, '999999': 2 },
        },
      ],
    };
    expect(parseShowcase(uid, raw).snapshot.characters[0]!.talents).toEqual([
      { id: '10463', label: 'Spirit Soother', kind: 'burst', baseLevel: 7, bonusLevel: null },
      { id: '999999', label: 'Skill 999999', kind: null, baseLevel: 2, bonusLevel: null },
    ]);
    raw.avatarInfoList[0]!.avatarId = 99999999;
    expect(
      parseShowcase(uid, raw).snapshot.characters[0]!.talents.map((talent) => talent.kind),
    ).toEqual([null, null]);
    expect(
      parseShowcase(uid, raw).snapshot.characters[0]!.talents.map((talent) => talent.label),
    ).toEqual(['Skill 10463', 'Skill 999999']);
  });
  it('recognizes Columbina 10000125 from current Enka metadata without inventing progression', () => {
    const raw = {
      ...syntheticShowcase(),
      avatarInfoList: [
        {
          avatarId: 10000125,
          skillDepotId: 12501,
          propMap: {},
          fightPropMap: {},
          skillLevelMap: { '11255': 7, '11251': 6, '11252': 8 },
          proudSkillExtraLevelMap: { '12532': 3 },
        },
      ],
    };
    const character = parseShowcase(uid, raw).snapshot.characters[0]!;
    expect(character).toMatchObject({
      name: 'Columbina',
      element: 'Hydro',
      metadataAvailable: true,
      portrait: 'https://enka.network/ui/UI_AvatarIcon_Side_Columbina.png',
      level: null,
      ascension: null,
      talents: [
        { id: '11251', label: 'Moondew Cascade', baseLevel: 6 },
        { id: '11252', label: 'Eternal Tides', kind: 'skill', baseLevel: 8, bonusLevel: 3 },
        { id: '11255', label: 'Moonlit Melancholy', baseLevel: 7 },
      ],
    });
  });
  it('accepts modern icon paths and costumes without widening the image origin', () => {
    expect(enkaIcon('/ui/UI_AvatarIcon_Side_Columbina.png')).toBe(
      'https://enka.network/ui/UI_AvatarIcon_Side_Columbina.png',
    );
    for (const path of [
      '/ui/../secret.png',
      '//evil.invalid/ui/UI_Test.png',
      '/ui/UI_Test.png?redirect=evil',
    ])
      expect(enkaIcon(path)).toBeNull();
    const raw = {
      ...syntheticShowcase(),
      avatarInfoList: [{ ...syntheticShowcase().avatarInfoList[0]!, costumeId: 204601 }],
    };
    expect(parseShowcase(uid, raw).snapshot.characters[0]!.portrait).toBe(
      'https://enka.network/ui/UI_AvatarIcon_HutaoCostumeWinter.png',
    );
  });
  it('keeps missing observations unknown and handles absent/empty private showcases', () => {
    const raw = syntheticShowcase();
    const minimal = {
      ...raw,
      avatarInfoList: [{ avatarId: 10000046, propMap: {}, fightPropMap: {} }],
    };
    expect(parseShowcase(uid, minimal).snapshot.characters[0]).toMatchObject({
      level: null,
      ascension: null,
      constellation: 0,
      talents: [],
      equipmentAvailable: false,
      weapon: null,
      artifacts: [],
    });
    for (const avatarInfoList of [undefined, []])
      expect(parseShowcase(uid, { ...raw, avatarInfoList }).snapshot.characters).toEqual([]);
  });
  it('keeps a missing artifact main stat unknown instead of promoting the first substat', () => {
    const raw = syntheticShowcase();
    const artifact = raw.avatarInfoList[0]!.equipList.find(
      (item) => item.flat.itemType === 'ITEM_RELIQUARY',
    )!;
    delete artifact.flat.reliquaryMainstat;
    const item = parseShowcase(uid, raw).snapshot.characters[0]!.artifacts[0]!;
    expect(item.mainStat).toBeNull();
    expect(item.stats).toHaveLength(artifact.flat.reliquarySubstats!.length);
  });
  it.each([
    ['20', 0.731, 'combat', '73.1%'],
    ['23', 1.3, 'combat', '130%'],
    ['FIGHT_PROP_CRITICAL', 10.5, 'equipment', '10.5%'],
    ['2000', 31234, 'combat', '31,234'],
    ['28', 0, 'combat', '0'],
  ] as const)('formats %s using its documented units', (id, value, context, formatted) =>
    expect(formatShowcaseStat(id, value, context).formatted).toBe(formatted),
  );
  it('does not invent names or units for unknown statistics, or accept hostile icon paths', () => {
    expect(formatShowcaseStat('9999', 1.2, 'combat')).toMatchObject({
      name: 'Combat property 9999',
      formatted: '1.2',
    });
    expect(enkaIcon('https://evil.invalid/foo')).toBeNull();
    expect(enkaIcon('UI_/../private')).toBeNull();
  });
  it('accepts documented propValue and observed statValue without silently choosing conflicting values', () => {
    const raw = syntheticShowcase();
    const current = raw.avatarInfoList[0]!.equipList[0]!.flat.weaponStats![0]!;
    const documented = {
      ...raw,
      avatarInfoList: [
        {
          ...raw.avatarInfoList[0],
          equipList: [
            {
              ...raw.avatarInfoList[0]!.equipList[0],
              flat: {
                ...raw.avatarInfoList[0]!.equipList[0]!.flat,
                weaponStats: [
                  { appendPropId: 'FIGHT_PROP_BASE_ATTACK', propValue: current.statValue },
                ],
              },
            },
          ],
        },
      ],
    };
    expect(parseShowcase(uid, documented).snapshot.characters[0]!.weapon!.stats[0]!.value).toBe(
      608,
    );
    expect(() =>
      parseShowcase(uid, {
        ...documented,
        avatarInfoList: [
          {
            ...documented.avatarInfoList[0],
            equipList: [
              {
                ...documented.avatarInfoList[0]!.equipList[0],
                flat: {
                  ...documented.avatarInfoList[0]!.equipList[0]!.flat,
                  weaponStats: [
                    { appendPropId: 'FIGHT_PROP_BASE_ATTACK', propValue: 608, statValue: 609 },
                  ],
                },
              },
            ],
          },
        ],
      }),
    ).toThrow();
  });
  it('rejects mismatched UIDs, malformed responses and duplicate characters or slots atomically', () => {
    const raw = syntheticShowcase();
    expect(() => parseShowcase('800000002', raw)).toThrow();
    expect(() => parseShowcase(uid, { ttl: 60 })).toThrow();
    expect(() => parseShowcase(uid, { ...raw, ttl: -1 })).toThrow();
    expect(() =>
      parseShowcase(uid, {
        ...raw,
        avatarInfoList: [...raw.avatarInfoList, ...raw.avatarInfoList],
      }),
    ).toThrow();
    raw.avatarInfoList[0]!.equipList.push(raw.avatarInfoList[0]!.equipList[1]!);
    expect(() => parseShowcase(uid, raw)).toThrow();
  });
});
describe('Bounded Enka reads and TTL cache', () => {
  it('identifies the application, fixes the destination and reuses the TTL without a new upstream request', async () => {
    let now = 1_800_000_000_000;
    const transport = vi.fn(async () => ok());
    const service = new ShowcaseService(transport, () => now);
    const first = await service.lookup(uid);
    expect(first.delivery).toBe('fetched');
    expect((await service.lookup(uid)).delivery).toBe('cached');
    now += 59999;
    expect((await service.lookup(uid)).fetchedAt).toBe(first.fetchedAt);
    expect(transport).toHaveBeenCalledTimes(1);
    now += 1;
    expect((await service.lookup(uid)).delivery).toBe('fetched');
    expect(transport).toHaveBeenCalledTimes(2);
    expect(transport.mock.calls[0]).toMatchObject([
      'https://enka.network/api/uid/800000001/',
      { redirect: 'error', headers: { 'User-Agent': expect.stringContaining('ProjectCelestia') } },
    ]);
  });
  it('coalesces simultaneous requests for the same UID and bounds different-UID concurrency', async () => {
    let resolve!: (response: Response) => void;
    const transport = vi.fn(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const service = new ShowcaseService(transport);
    const first = service.lookup(uid);
    const duplicate = service.lookup(uid);
    expect((await service.lookup('800000002')).issue?.code).toBe('SHOWCASE_BUSY');
    resolve(ok());
    expect((await first).delivery).toBe('fetched');
    expect((await duplicate).delivery).toBe('cached');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it.each([400, 404, 424, 429, 500, 503])(
    'handles provider %s and retains the prior snapshot',
    async (status) => {
      let now = 1_800_000_000_000;
      const transport = vi
        .fn()
        .mockResolvedValueOnce(ok())
        .mockImplementation(async () => new Response('', { status }));
      const service = new ShowcaseService(transport, () => now);
      const good = await service.lookup(uid);
      now += 60000;
      const failed = await service.lookup(uid);
      expect(failed).toMatchObject({
        delivery: 'stale',
        snapshot: good.snapshot,
        fetchedAt: good.fetchedAt,
        issue: { code: `ENKA_${status}` },
      });
      await service.lookup(uid);
      expect(transport).toHaveBeenCalledTimes(2);
    },
  );
  it.each(['120', 'Wed, 15 Jan 2031 08:00:00 GMT'])(
    'honors dynamic Retry-After %s across UIDs',
    async (header) => {
      const now = Date.parse('2031-01-15T07:00:00Z');
      const transport = vi.fn(
        async () => new Response('', { status: 429, headers: { 'Retry-After': header } }),
      );
      const service = new ShowcaseService(transport, () => now);
      const first = await service.lookup(uid);
      const other = await service.lookup('800000002');
      expect(Date.parse(first.nextRefreshAt)).toBe(now + (header === '120' ? 120000 : 3600000));
      expect(other.issue?.code).toBe('ENKA_429');
      expect(transport).toHaveBeenCalledTimes(1);
    },
  );
  it.each(['network', 'json', 'shape', 'oversized'])(
    'preserves a successful snapshot on %s failure',
    async (mode) => {
      let now = 1_800_000_000_000;
      const transport = vi
        .fn()
        .mockResolvedValueOnce(ok())
        .mockImplementation(async () => {
          if (mode === 'network') throw new Error('private transport diagnostic');
          return new Response(
            mode === 'json' ? 'invalid' : mode === 'shape' ? '{}' : 'x'.repeat(2_000_001),
          );
        });
      const service = new ShowcaseService(transport, () => now);
      const good = await service.lookup(uid);
      now += 60000;
      const failed = await service.lookup(uid);
      expect(failed.snapshot).toEqual(good.snapshot);
      expect(failed.delivery).toBe('stale');
      expect(JSON.stringify(failed)).not.toContain('private transport diagnostic');
    },
  );
  it('reports timeout safely and bounds cache capacity without evicting live TTLs', async () => {
    vi.spyOn(AbortSignal, 'timeout').mockReturnValue(AbortSignal.abort());
    const failed = await new ShowcaseService(async () => {
      throw new Error('timeout');
    }).lookup(uid);
    expect(failed).toMatchObject({
      delivery: 'unavailable',
      snapshot: null,
      issue: { code: 'ENKA_TIMEOUT' },
    });
    vi.restoreAllMocks();
    let now = 1_800_000_000_000;
    const transport = vi.fn(async () => ok());
    const service = new ShowcaseService(transport, () => now, 1);
    await service.lookup(uid);
    now += 2000;
    expect((await service.lookup('800000002')).issue?.code).toBe('SHOWCASE_BUSY');
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('allows a validated successful empty showcase to replace only the cached showcase', async () => {
    let now = 1_800_000_000_000;
    const transport = vi
      .fn()
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...syntheticShowcase(), avatarInfoList: [] })),
      );
    const service = new ShowcaseService(transport, () => now);
    await service.lookup(uid);
    now += 60000;
    expect((await service.lookup(uid)).snapshot?.characters).toEqual([]);
  });
});
describe('Public HTTP boundary', () => {
  it('serves without credentials and never accepts writes', async () => {
    const transport = vi.fn(async () => ok());
    const app = express().use(createShowcaseRoutes(new ShowcaseService(transport)));
    expect((await request(app).get('/showcase/800000001')).status).toBe(200);
    expect((await request(app).get('/showcase/800000001')).body.delivery).toBe('cached');
    expect(
      (await request(app).post('/showcase/800000001').send({ userId: 'foreign' })).status,
    ).toBe(404);
    expect(transport).toHaveBeenCalledTimes(1);
  });
  it('returns a typed no-snapshot rate-limit response with Retry-After', async () => {
    const app = express().use(
      createShowcaseRoutes(
        new ShowcaseService(
          async () => new Response('', { status: 429, headers: { 'Retry-After': '90' } }),
        ),
      ),
    );
    const result = await request(app).get('/showcase/800000001');
    expect(result.status).toBe(429);
    expect(result.headers['retry-after']).toBeDefined();
    expect(result.headers['cache-control']).toBe('no-store');
    expect(result.body).toMatchObject({ snapshot: null, issue: { code: 'ENKA_429' } });
  });
});
