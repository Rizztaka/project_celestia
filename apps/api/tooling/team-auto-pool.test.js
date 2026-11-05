import { expect, it } from 'vitest';

import { buildAutoTeamPool } from '../../web/src/lib/team-damage/auto-generator.calculator.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
function fixture() {
  return [0, 2, 4, 5].map((index) => ({
    uid,
    observedAt: '2026-10-25T10:00:00Z',
    character: analysisFixture(uid).snapshot.characters[index],
  }));
}
it('uses newest complete observations for both chosen driver and teammates', () => {
  const records = fixture();
  const old = structuredClone(records[0]);
  old.observedAt = '2026-10-01T00:00:00Z';
  old.character.weapon = null;
  const pool = buildAutoTeamPool(uid, records[0].character.key, [old, ...records]);
  expect(pool.driver).toEqual(records[0]);
  expect(pool.candidates).toHaveLength(1);
  expect(buildAutoTeamPool(uid, records[0].character.key, [...records, old]).candidates).toEqual(
    pool.candidates,
  );
});
it('keeps the chosen Traveler form and prevents all other Traveler forms from filling another slot', () => {
  const records = fixture();
  Object.assign(records[0].character, {
    id: 10000005,
    skillDepotId: 504,
    key: '10000005:504',
    element: 'Anemo',
  });
  const lumine = structuredClone(records[0]);
  lumine.observedAt = '2026-10-25T11:00:00Z';
  Object.assign(lumine.character, { id: 10000007, skillDepotId: 704, key: '10000007:704' });
  const pool = buildAutoTeamPool(uid, '10000005:504', [...records, lumine]);
  expect(pool.driver.character.key).toBe('10000005:504');
  expect(pool.eligibleTeammates).toHaveLength(3);
  expect(pool.candidates).toHaveLength(1);
  expect(pool.candidates[0].team.members.map((member) => member.characterKey)).not.toContain(
    '10000007:704',
  );
});
