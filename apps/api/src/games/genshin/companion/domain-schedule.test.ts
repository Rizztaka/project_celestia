import { SUPPORTED_SERVER_IDS } from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import targets from '../../../../../web/src/lib/progression-targets.json' with { type: 'json' };
import { domainSchedule, getOpenDomains } from './domain-schedule.js';
import { getNextDailyBoundary, getServerWeekday } from './server-clock.js';

describe('shared server-day domain schedule', () => {
  it('keeps the browser catalog and API schedule joined to the same existing data', () => {
    expect(new Map(domainSchedule.map((domain) => [domain.domainKey, domain]))).toEqual(
      new Map(targets.domains.map((domain) => [domain.domainKey, domain])),
    );
    expect(domainSchedule).toHaveLength(48);
    expect(domainSchedule.every((domain) => domain.days.includes(6))).toBe(true);
  });
  it.each(SUPPORTED_SERVER_IDS)(
    'uses the selected %s day across reset for Sunday and Monday',
    (server) => {
      const reset = getNextDailyBoundary(new Date('2026-10-18T12:00:00Z'), server);
      // Move to the Monday boundary even when Asia's next boundary is already Monday.
      while (getServerWeekday(reset, server) !== 0) reset.setUTCDate(reset.getUTCDate() + 1);
      expect(getOpenDomains(new Date(reset.getTime() - 1), server)).toHaveLength(48);
      const monday = getOpenDomains(reset, server);
      expect(monday).toHaveLength(16);
      expect(monday.some((domain) => domain.dropKeys.includes('TeachingsOfFreedom'))).toBe(true);
      expect(monday.some((domain) => domain.dropKeys.includes('TileOfDecarabiansTower'))).toBe(
        true,
      );
      expect(monday.some((domain) => domain.dropKeys.includes('TeachingsOfBallad'))).toBe(false);
    },
  );
  it.each(SUPPORTED_SERVER_IDS)('repeats Mon/Thu, Tue/Fri and Wed/Sat for %s', (server) => {
    const start = new Date('2026-10-19T12:00:00Z');
    for (let offset = 0; offset < 3; offset++) {
      const first = new Date(start.getTime() + offset * 86400000);
      const second = new Date(first.getTime() + 3 * 86400000);
      expect(getOpenDomains(first, server)).toEqual(getOpenDomains(second, server));
    }
  });
  it('shows different materials at the same instant for different servers', () => {
    const now = new Date('2026-10-19T05:00:00Z');
    expect(getOpenDomains(now, 'america')).toHaveLength(48);
    expect(getOpenDomains(now, 'europe')).toHaveLength(16);
    expect(getOpenDomains(now, 'asia')).toHaveLength(16);
    expect(getOpenDomains(now, 'tw_hk_mo')).toEqual(getOpenDomains(now, 'asia'));
  });
});
