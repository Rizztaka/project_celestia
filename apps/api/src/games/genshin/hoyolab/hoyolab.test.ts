import { createHash } from 'node:crypto';

import { describe, expect, it, vi } from 'vitest';

import {
  fixtureCookies,
  fixtureDetail,
  fixtureDetailResponse,
  fixtureNotes,
  fixtureRole,
} from './hoyolab.fixtures.js';
import { mapCharacters, observedAscension } from './hoyolab.mapper.js';
import { dynamicSecret, HoyolabProvider } from './hoyolab.provider.js';
import { hoyolabConnectSchema, hoyolabCookiesSchema } from './hoyolab.schema.js';
import { HoyolabVault, sessionKey } from './hoyolab.vault.js';

describe('HoYoLAB credential boundary', () => {
  it('requires explicit consent and rejects unrelated credentials and header injection', () => {
    expect(hoyolabConnectSchema.safeParse({ cookies: fixtureCookies }).success).toBe(false);
    expect(hoyolabCookiesSchema.safeParse({ ...fixtureCookies, stoken: 'unneeded' }).success).toBe(
      false,
    );
    for (const bad of ['a;b', 'a\r\nb', 'a b', '', 'x'.repeat(2049)])
      expect(hoyolabCookiesSchema.safeParse({ ...fixtureCookies, ltoken_v2: bad }).success).toBe(
        false,
      );
    expect(hoyolabCookiesSchema.parse(fixtureCookies)).toEqual(fixtureCookies);
    expect(hoyolabCookiesSchema.safeParse({ ltuid_v2: 'a', ltoken_v2: 'b' }).success).toBe(false);
  });
  it('encrypts with random IVs and binds ciphertext to the owner and key', () => {
    const vault = new HoyolabVault(Buffer.alloc(32, 17));
    const a = vault.seal('owner-a', fixtureCookies),
      b = vault.seal('owner-a', fixtureCookies);
    expect(a).not.toBe(b);
    expect(a).not.toContain(fixtureCookies.ltoken_v2);
    expect(vault.open('owner-a', a)).toEqual(fixtureCookies);
    expect(() => vault.open('owner-b', a)).toThrow('Reconnect');
    expect(() => new HoyolabVault(Buffer.alloc(32, 18)).open('owner-a', a)).toThrow('Reconnect');
    expect(() => vault.open('owner-a', a.slice(0, -8) + 'AAAAAAAA')).toThrow('Reconnect');
    expect(() => sessionKey('invalid')).toThrow('not configured');
    expect(new HoyolabVault(null).available).toBe(false);
  });
});
describe('HoYoLAB snapshot mapping', () => {
  it('joins game IDs to pinned catalog, preserves displayed talents and actual stats', () => {
    const [c] = mapCharacters(fixtureDetailResponse(), [10000038]);
    expect(c).toMatchObject({
      key: 'Albedo',
      level: 80,
      ascension: null,
      talents: { normal: 6, skill: 9, burst: 8 },
      weapon: { key: 'HarbingerOfDawn', ascension: 6, refinement: 5 },
    });
    expect(c!.artifacts[0]).toMatchObject({
      key: 'GildedDreams',
      slot: 'flower',
      mainStatKey: 'hp',
      mainStatValue: 4780,
      subStats: [
        { key: 'critRate_', value: 3.9 },
        { key: 'def_', value: 5.8 },
      ],
    });
  });
  it('does not guess ambiguous caps, source stat IDs or Traveler forms', () => {
    for (const cap of [20, 40, 50, 60, 70, 80, 100]) expect(observedAscension(cap)).toBeNull();
    expect(observedAscension(80, undefined, 90)).toBe(6);
    expect(observedAscension(80, 5)).toBe(5);
    expect(observedAscension(81)).toBe(6);
    const response = fixtureDetailResponse(10000005);
    response.list[0]!.base.element = 'unknown';
    response.property_map = {} as typeof response.property_map;
    const [c] = mapCharacters(response, [10000005]);
    expect(c!.key).toBe('HoyolabTraveler10000005');
    expect(c!.artifacts[0]!.mainStatKey).toBe('hoyolab_stat_2000');
    response.list[0]!.base.element = 'Grass';
    expect(mapCharacters(response, [10000005])[0]!.key).toBe('TravelerDendro');
  });
  it('rejects partial, duplicate, malformed and incomplete assignments', () => {
    expect(() => mapCharacters(fixtureDetailResponse(), [10000038, 10000039])).toThrow();
    const d = fixtureDetail();
    expect(() => mapCharacters({ list: [d, d] }, [10000038, 10000038])).toThrow();
    expect(() =>
      mapCharacters({ list: [{ ...d, skills: d.skills.slice(0, 2) }] }, [10000038]),
    ).toThrow();
    expect(() =>
      mapCharacters({ list: [{ ...d, relics: [d.relics[0], d.relics[0]] }] }, [10000038]),
    ).toThrow();
    expect(() => mapCharacters({ list: [{ ...d, weapon: null }] }, [10000038])).toThrow();
  });
});
describe('HoYoLAB fixed-host protocol', () => {
  const envelope = (data: unknown, retcode = 0) =>
    new Response(JSON.stringify({ retcode, data }), { status: 200 });
  function roleResponse() {
    return {
      list: [
        {
          game_biz: 'hk4e_global',
          game_uid: fixtureRole.uid,
          region: fixtureRole.server,
          nickname: fixtureRole.nickname,
          level: fixtureRole.level,
        },
      ],
    };
  }
  it('uses verified signature, endpoints, owned role, minimal cookies, and optional notes', async () => {
    expect(dynamicSecret(100000, 'AbCdEf')).toBe(
      `100,AbCdEf,${createHash('md5').update('salt=6s25p5ox5y14umn1p61aqyyvbvvl3lrt&t=100&r=AbCdEf').digest('hex')}`,
    );
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(envelope(roleResponse()))
      .mockResolvedValueOnce(envelope({ list: [{ id: 10000038 }] }))
      .mockResolvedValueOnce(envelope(fixtureDetailResponse()))
      .mockResolvedValueOnce(envelope(fixtureNotes));
    const snapshot = await new HoyolabProvider(request).snapshot(fixtureCookies, fixtureRole);
    expect(snapshot.characters).toHaveLength(1);
    expect(snapshot.notes).toMatchObject({
      commissions: { completed: 4, rewardClaimed: false },
      expeditions: { finished: 1 },
    });
    expect(request.mock.calls.map(([url]) => String(url))).toEqual([
      'https://api-os-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie?game_biz=hk4e_global',
      'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/list',
      'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/character/detail',
      'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/dailyNote?role_id=800000001&server=os_asia',
    ]);
    const options = request.mock.calls[2]![1]!;
    expect(options.redirect).toBe('error');
    expect(JSON.parse(String(options.body))).toEqual({
      role_id: fixtureRole.uid,
      server: 'os_asia',
      character_ids: [10000038],
    });
    expect(new Headers(options.headers).get('Cookie')).not.toMatch(/stoken|cookie_token/);
  });
  it('rejects unowned roles before fetching builds and maps verification without leaking upstream text', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(envelope(roleResponse()));
    await expect(
      new HoyolabProvider(request).snapshot(fixtureCookies, { ...fixtureRole, uid: '800000002' }),
    ).rejects.toMatchObject({ errorCode: 'HOYOLAB_RECONNECT' });
    expect(request).toHaveBeenCalledTimes(1);
    request.mockReset().mockResolvedValue(envelope({ secret: fixtureCookies.ltoken_v2 }, 1034));
    await expect(new HoyolabProvider(request).accounts(fixtureCookies)).rejects.toMatchObject({
      errorCode: 'HOYOLAB_VERIFICATION',
    });
  });
  it('fetches complete rosters in bounded detail batches and rejects a truncated later batch', async () => {
    const ids = Array.from({ length: 41 }, (_, i) => 19000000 + i);
    function requests(truncated = false) {
      const request = vi
        .fn<typeof fetch>()
        .mockResolvedValueOnce(envelope(roleResponse()))
        .mockResolvedValueOnce(envelope({ list: ids.map((id) => ({ id })) }));
      for (let i = 0; i < ids.length; i += 20) {
        const batch = ids.slice(i, i + 20);
        request.mockResolvedValueOnce(
          envelope({
            ...fixtureDetailResponse(),
            list: (truncated && i === 40 ? [] : batch).map((id) => fixtureDetail(id)),
          }),
        );
      }
      request.mockResolvedValueOnce(envelope(fixtureNotes));
      return request;
    }
    const request = requests();
    const result = await new HoyolabProvider(request).snapshot(fixtureCookies, fixtureRole);
    expect(result.characters).toHaveLength(41);
    expect(
      request.mock.calls
        .slice(2, 5)
        .map(([, options]) => JSON.parse(String(options!.body)).character_ids),
    ).toEqual([ids.slice(0, 20), ids.slice(20, 40), ids.slice(40)]);
    await expect(
      new HoyolabProvider(requests(true)).snapshot(fixtureCookies, fixtureRole),
    ).rejects.toMatchObject({ errorCode: 'HOYOLAB_INCOMPLETE' });
  });
  it('keeps a complete roster when optional notes fail, but rejects partial details', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(envelope(roleResponse()))
      .mockResolvedValueOnce(envelope({ list: [{ id: 10000038 }] }))
      .mockResolvedValueOnce(envelope(fixtureDetailResponse()))
      .mockRejectedValueOnce(Error('secret'));
    expect(
      (await new HoyolabProvider(request).snapshot(fixtureCookies, fixtureRole)).notes,
    ).toBeNull();
    request
      .mockReset()
      .mockResolvedValueOnce(envelope(roleResponse()))
      .mockResolvedValueOnce(envelope({ list: [{ id: 10000038 }, { id: 10000039 }] }))
      .mockResolvedValueOnce(envelope(fixtureDetailResponse()));
    await expect(
      new HoyolabProvider(request).snapshot(fixtureCookies, fixtureRole),
    ).rejects.toMatchObject({ errorCode: 'HOYOLAB_INCOMPLETE' });
  });
  it('rejects oversized and redirected responses without exposing raw bodies', async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response('x'.repeat(2_000_001)));
    await expect(new HoyolabProvider(request).accounts(fixtureCookies)).rejects.toMatchObject({
      errorCode: 'HOYOLAB_UNAVAILABLE',
    });
  });
  it('treats malformed upstream account details as an upstream failure, not a bad player request', async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(envelope({ list: [{ private: 'not-a-role' }] }));
    await expect(new HoyolabProvider(request).accounts(fixtureCookies)).rejects.toMatchObject({
      statusCode: 502,
      errorCode: 'HOYOLAB_INCOMPLETE',
    });
    expect(observedAscension(100, 6)).toBeNull();
  });
});
