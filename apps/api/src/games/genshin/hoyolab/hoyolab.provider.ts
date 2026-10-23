import { createHash, randomBytes } from 'node:crypto';

import type { HoyolabNotes, HoyolabRole } from '@celestia/api-contracts';
import { z } from 'zod';

import { AppError } from '@/core/errors/app-error.js';

import { mapCharacters } from './hoyolab.mapper.js';
import type { HoyolabCookies } from './hoyolab.schema.js';
import { hoyolabServerSchema } from './hoyolab.schema.js';
import type { HoyolabSnapshot } from './hoyolab.types.js';
const chronicle = 'https://sg-public-api.hoyolab.com/event/game_record/genshin/api/';
const accountsUrl = 'https://api-os-takumi.mihoyo.com/binding/api/getUserGameRolesByCookie';
export function dynamicSecret(
  now = Date.now(),
  nonce = Array.from(
    randomBytes(6),
    (b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'[b % 52],
  ).join(''),
) {
  const t = Math.floor(now / 1000);
  return `${t},${nonce},${createHash('md5').update(`salt=6s25p5ox5y14umn1p61aqyyvbvvl3lrt&t=${t}&r=${nonce}`).digest('hex')}`;
}
const rolesSchema = z.object({
  list: z
    .array(
      z.object({
        game_biz: z.string(),
        game_uid: z.string(),
        region: z.string(),
        nickname: z.string().max(100),
        level: z.number().int().min(1).max(100),
      }),
    )
    .max(100),
});
const numeric = z.union([
  z.number().int().nonnegative().safe(),
  z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().nonnegative().safe()),
]);
const notesSchema = z.object({
  current_resin: numeric,
  max_resin: numeric,
  resin_recovery_time: numeric,
  finished_task_num: numeric,
  total_task_num: numeric,
  is_extra_task_reward_received: z.boolean(),
  expeditions: z
    .array(z.object({ status: z.enum(['Ongoing', 'Finished']), remained_time: numeric }))
    .max(10),
  current_home_coin: numeric.optional(),
  max_home_coin: numeric.optional(),
});
export class HoyolabProvider {
  constructor(
    private readonly request: typeof fetch = fetch,
    private readonly clock = () => new Date(),
  ) {}
  private async read(url: string, cookies: HoyolabCookies, body?: object): Promise<unknown> {
    try {
      const response = await this.request(url, {
        method: body ? 'POST' : 'GET',
        redirect: 'error',
        signal: AbortSignal.timeout(15000),
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Cookie: Object.entries(cookies)
            .map(([k, v]) => `${k}=${v}`)
            .join('; '),
          'x-rpc-app_version': '1.5.0',
          'x-rpc-client_type': '5',
          'x-rpc-language': 'en-us',
          'x-rpc-lang': 'en-us',
          DS: dynamicSecret(),
          Referer: 'https://act.hoyolab.com/',
          Origin: 'https://act.hoyolab.com',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      if (!response.ok || !response.body)
        throw new AppError(
          'HoYoLAB could not refresh. Your saved builds were kept.',
          502,
          'HOYOLAB_UNAVAILABLE',
        );
      const reader = response.body.getReader(),
        chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 2_000_000) {
          await reader.cancel();
          throw Error('Response too large');
        }
        chunks.push(value);
      }
      const envelope = z
        .object({ retcode: z.number(), data: z.unknown() })
        .parse(JSON.parse(Buffer.concat(chunks).toString()));
      if ([-100, 10001, -101, 1008].includes(envelope.retcode))
        throw new AppError('Reconnect HoYoLAB to refresh your account.', 409, 'HOYOLAB_RECONNECT');
      if ([1034, 10035, 5003, 10041].includes(envelope.retcode))
        throw new AppError(
          'Open HoYoLAB Battle Chronicle to complete verification, then refresh here.',
          409,
          'HOYOLAB_VERIFICATION',
        );
      if (envelope.retcode !== 0)
        throw new AppError(
          'HoYoLAB could not refresh. Your saved builds were kept.',
          502,
          'HOYOLAB_UNAVAILABLE',
        );
      return envelope.data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'HoYoLAB could not refresh. Your saved builds were kept.',
        502,
        'HOYOLAB_UNAVAILABLE',
      );
    }
  }
  async accounts(cookies: HoyolabCookies): Promise<HoyolabRole[]> {
    try {
      const parsed = rolesSchema.parse(
        await this.read(accountsUrl + '?game_biz=hk4e_global', cookies),
      );
      const roles = parsed.list
        .filter((r) => r.game_biz === 'hk4e_global')
        .map((r) => ({
          uid: z
            .string()
            .regex(/^\d{9,10}$/)
            .parse(r.game_uid),
          server: hoyolabServerSchema.parse(r.region),
          nickname: r.nickname,
          level: r.level,
        }));
      if (!roles.length || new Set(roles.map((r) => `${r.server}:${r.uid}`)).size !== roles.length)
        throw new AppError(
          'No supported Genshin account was found on this HoYoLAB session.',
          409,
          'HOYOLAB_NO_ACCOUNT',
        );
      return roles;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'HoYoLAB returned incomplete account details. Please try again.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    }
  }
  async snapshot(cookies: HoyolabCookies, role: HoyolabRole): Promise<HoyolabSnapshot> {
    try {
      return await this.readSnapshot(cookies, role);
    } catch (error) {
      if (!(error instanceof z.ZodError)) throw error;
      throw new AppError(
        'HoYoLAB returned incomplete builds. Your saved builds were kept.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    }
  }
  private async readSnapshot(cookies: HoyolabCookies, role: HoyolabRole): Promise<HoyolabSnapshot> {
    const owned = await this.accounts(cookies);
    const confirmed = owned.find((r) => r.uid === role.uid && r.server === role.server);
    if (!confirmed)
      throw new AppError(
        'This game account is no longer available in the linked HoYoLAB session.',
        409,
        'HOYOLAB_RECONNECT',
      );
    const payload = { role_id: role.uid, server: role.server };
    const listed = z
      .object({
        list: z
          .array(z.object({ id: z.number().int().positive() }))
          .min(1)
          .max(250),
      })
      .parse(await this.read(chronicle + 'character/list', cookies, payload));
    const ids = listed.list.map((c) => c.id);
    if (new Set(ids).size !== ids.length)
      throw new AppError(
        'HoYoLAB returned a partial roster. Your saved builds were kept.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    const characters = [];
    for (let i = 0; i < ids.length; i += 20) {
      const batch = ids.slice(i, i + 20);
      characters.push(
        ...mapCharacters(
          await this.read(chronicle + 'character/detail', cookies, {
            ...payload,
            character_ids: batch,
          }),
          batch,
        ),
      );
    }
    if (new Set(characters.map((c) => c.key)).size !== characters.length)
      throw new AppError(
        'HoYoLAB returned inconsistent character forms. Your saved builds were kept.',
        502,
        'HOYOLAB_INCOMPLETE',
      );
    const observedAt = this.clock();
    let notes: HoyolabNotes | null = null;
    try {
      const query = new URLSearchParams(payload);
      const n = notesSchema.parse(await this.read(chronicle + 'dailyNote?' + query, cookies));
      if (
        n.current_resin > n.max_resin ||
        n.max_resin < 1 ||
        n.finished_task_num > n.total_task_num
      )
        throw Error();
      notes = {
        observedAt: observedAt.toISOString(),
        resin: { current: n.current_resin, max: n.max_resin, fullInSeconds: n.resin_recovery_time },
        commissions: {
          completed: n.finished_task_num,
          total: n.total_task_num,
          rewardClaimed: n.is_extra_task_reward_received,
        },
        expeditions: {
          finished: n.expeditions.filter((e) => e.status === 'Finished').length,
          total: n.expeditions.length,
        },
        realmCurrency:
          n.current_home_coin !== undefined && n.max_home_coin !== undefined
            ? { current: n.current_home_coin, max: n.max_home_coin }
            : null,
      };
    } catch {
      /* Notes are optional. Never enable private notes or solve challenges on the player's behalf. */
    }
    return { role: confirmed, characters, observedAt, notes };
  }
}
