import { createRequire } from 'node:module';

import type { AdviceDomain, SupportedServerId } from '@celestia/api-contracts';

import { getServerWeekday } from './server-clock.js';

const require = createRequire(import.meta.url);
const data: {
  talentDomains: AdviceDomain[];
  weaponDomains: AdviceDomain[];
} = require('../static/domain-schedule.json');
export const domainSchedule = [...data.talentDomains, ...data.weaponDomains];
for (const domain of domainSchedule) {
  Object.freeze(domain.days);
  Object.freeze(domain.drops);
  Object.freeze(domain.dropKeys);
  Object.freeze(domain);
}
Object.freeze(domainSchedule);

export function getOpenDomains(now: Date, serverId: SupportedServerId): AdviceDomain[] {
  const weekday = getServerWeekday(now, serverId);
  return domainSchedule.filter((domain) => weekday === 6 || domain.days.includes(weekday));
}
