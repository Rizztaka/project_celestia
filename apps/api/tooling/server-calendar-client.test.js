import { expect, it } from 'vitest';

import { serverDateLabel } from '../../web/src/lib/routine-state.ts';

it.each([
  ['asia', '10/19/2026'],
  ['tw_hk_mo', '10/19/2026'],
  ['america', '10/18/2026'],
  ['europe', '10/18/2026'],
])('formats calendar dates on %s rather than in the browser timezone', (serverId, expected) => {
  expect(serverDateLabel('2026-10-18T20:00:00.000Z', serverId, 'en-US')).toBe(expected);
});
