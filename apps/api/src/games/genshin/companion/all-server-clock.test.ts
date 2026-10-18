import { patchSettingsBodySchema, type SupportedServerId } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { GenshinCompanionProvider } from './genshin-companion.provider.js';
import { buildPeriodMetadata } from './routine-policy.js';
import {
  buildPeriodId,
  getLastDailyBoundary,
  getLastWeeklyBoundary,
  getNextDailyBoundary,
  getNextWeeklyBoundary,
  getServerWeekday,
} from './server-clock.js';

const regions: { server: SupportedServerId; monday: string; summer: string; winter: string }[] = [
  {
    server: 'asia',
    monday: '2026-10-18T20:00:00.000Z',
    summer: '2026-07-19T20:00:00.000Z',
    winter: '2026-01-25T20:00:00.000Z',
  },
  {
    server: 'america',
    monday: '2026-10-19T09:00:00.000Z',
    summer: '2026-07-20T09:00:00.000Z',
    winter: '2026-01-26T09:00:00.000Z',
  },
  {
    server: 'europe',
    monday: '2026-10-19T03:00:00.000Z',
    summer: '2026-07-20T03:00:00.000Z',
    winter: '2026-01-26T03:00:00.000Z',
  },
  {
    server: 'tw_hk_mo',
    monday: '2026-10-18T20:00:00.000Z',
    summer: '2026-07-19T20:00:00.000Z',
    winter: '2026-01-25T20:00:00.000Z',
  },
];
describe.each(regions)('$server reset policy', ({ server, monday, summer, winter }) => {
  it('changes the day and week exactly at Monday reset, never before it', () => {
    const at = new Date(monday);
    const before = new Date(at.getTime() - 1);
    expect(getLastDailyBoundary(at, server).toISOString()).toBe(monday);
    expect(getLastWeeklyBoundary(at, server).toISOString()).toBe(monday);
    expect(getNextDailyBoundary(before, server).toISOString()).toBe(monday);
    expect(getNextWeeklyBoundary(before, server).toISOString()).toBe(monday);
    expect(getLastDailyBoundary(before, server).getTime()).toBe(at.getTime() - 86400000);
    expect(getLastWeeklyBoundary(before, server).getTime()).toBe(at.getTime() - 7 * 86400000);
    expect(getServerWeekday(before, server)).toBe(6);
    expect(getServerWeekday(at, server)).toBe(0);
    expect(getNextDailyBoundary(at, server).getTime()).toBe(at.getTime() + 86400000);
    expect(getNextWeeklyBoundary(at, server).getTime()).toBe(at.getTime() + 7 * 86400000);
  });
  it('uses the same fixed UTC offset in summer and winter', () => {
    for (const reset of [summer, winter]) {
      expect(getLastDailyBoundary(new Date(reset), server).toISOString()).toBe(reset);
      expect(getServerWeekday(new Date(reset), server)).toBe(0);
    }
  });
  it('exposes matching metadata, provider periods and validated write identity', () => {
    const now = new Date(monday);
    const provider = new GenshinCompanionProvider();
    const meta = buildPeriodMetadata(server, now)!;
    expect(meta.serverId).toBe(server);
    expect(meta.dailyPeriodId).toBe(`genshin:${server}:v1:daily:${monday}`);
    expect(provider.getPeriodBoundaries(server, now)?.dailyPeriodId).toBe(meta.dailyPeriodId);
    expect(provider.getServerWeekday(server, now)).toBe(0);
    expect(
      patchSettingsBodySchema.parse({ contractVersion: 2, expectedRevision: 0, serverId: server })
        .serverId,
    ).toBe(server);
  });
});
it('keeps same-offset Asia and TW/HK/MO period identities separate', () => {
  const now = new Date('2026-10-18T20:00:00.000Z');
  expect(buildPeriodId('daily', now, 'asia')).not.toBe(buildPeriodId('daily', now, 'tw_hk_mo'));
  expect(buildPeriodId('daily', now)).toBe('genshin:asia:v1:daily:2026-10-18T20:00:00.000Z');
  expect(
    patchSettingsBodySchema.safeParse({ contractVersion: 2, expectedRevision: 0, serverId: 'mars' })
      .success,
  ).toBe(false);
});
