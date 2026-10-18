import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadSavedTeams, parseTeamFile, saveTeams } from '../../web/src/lib/saved-teams.ts';
import { calculateSavings, targetProbability } from '../../web/src/lib/wish-savings.calculator.ts';
import { savingsVerdict } from '../../web/src/lib/wish-savings.explainer.ts';

const base = {
  today: '2026-10-18',
  targetDate: '2026-11-29',
  primogems: 100,
  fates: 2,
  pity: 0,
  guaranteed: false,
  targetType: 'character',
  commissions: true,
  welkin: false,
  battlePass: false,
  abyss: 0,
  eventPrimogems: 0,
};
afterEach(() => vi.unstubAllGlobals());
describe('wish savings arithmetic and probability', () => {
  it('counts days, whole pulls and leftover Primogems', () => {
    expect(calculateSavings(base)).toMatchObject({
      days: 42,
      earned: 2520,
      primogems: 2620,
      pulls: 18,
      leftoverPrimogems: 60,
    });
  });
  it('handles same-day, past and empty dates', () => {
    expect(
      calculateSavings({
        ...base,
        targetDate: base.today,
        welkin: true,
        battlePass: true,
        abyss: 800,
      }),
    ).toMatchObject({ days: 0, earned: 0, resets: 0, cycles: 0 });
    expect(calculateSavings({ ...base, targetDate: '2026-10-17' })).toBeNull();
    expect(calculateSavings({ ...base, targetDate: '' })).toBeNull();
    expect(calculateSavings({ ...base, targetDate: '2027-02-30' })).toBeNull();
  });
  it('counts the 1st and 16th across month/year/leap boundaries, excluding today', () => {
    expect(
      calculateSavings({ ...base, today: '2026-12-16', targetDate: '2027-01-16', abyss: 800 }),
    ).toMatchObject({ resets: 2, abyss: 1600 });
    expect(
      calculateSavings({ ...base, today: '2028-02-28', targetDate: '2028-03-01', abyss: 400 }),
    ).toMatchObject({ days: 2, resets: 1, abyss: 400 });
  });
  it('adds Welkin and events, and credits Battle Pass only at full 40-day cycles', () => {
    expect(calculateSavings({ ...base, targetDate: '2026-11-26', battlePass: true })).toMatchObject(
      { cycles: 0, fates: 2 },
    );
    expect(
      calculateSavings({
        ...base,
        targetDate: '2026-11-27',
        battlePass: true,
        welkin: true,
        eventPrimogems: 420,
      }),
    ).toMatchObject({ cycles: 1, battlePass: 680, fates: 6, earned: 7100 });
  });
  it('accounts for pity and 50/50 guarantee without promising soft pity drops', () => {
    const result = calculateSavings({ ...base, commissions: false, primogems: 0, fates: 75 });
    expect(savingsVerdict(result)).toContain('no guarantee');
    expect(
      calculateSavings({
        ...base,
        pity: 89,
        guaranteed: true,
        commissions: false,
        primogems: 0,
        fates: 1,
      }),
    ).toMatchObject({ featuredNeeded: 1, featuredGuaranteed: true, probability: 1 });
    expect(
      calculateSavings({ ...base, pity: 89, commissions: false, primogems: 0, fates: 1 }),
    ).toMatchObject({ hardGuaranteed: true, featuredGuaranteed: false, probability: 0.5 });
  });
  it('models selected weapon path separately from character pity', () => {
    expect(
      calculateSavings({
        ...base,
        targetType: 'weapon',
        pity: 79,
        commissions: false,
        primogems: 0,
        fates: 1,
      }),
    ).toMatchObject({ hardNeeded: 1, featuredNeeded: 81, probability: 0.375 });
    expect(targetProbability(160, 0, false, true)).toBeCloseTo(1, 10);
  });
  it('has zero chance at zero pulls, monotonic probabilities, and hard guarantees', () => {
    expect(targetProbability(0, 40, false, false)).toBe(0);
    expect(targetProbability(90, 0, true, false)).toBeCloseTo(1, 10);
    expect(targetProbability(180, 0, false, false)).toBeCloseTo(1, 10);
    const values = [1, 20, 75, 90, 120, 180].map((pulls) =>
      targetProbability(pulls, 0, false, false),
    );
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });
});

const team = {
  id: 'national',
  name: 'National',
  characterKeys: ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'],
};
describe('saved team persistence and portable imports', () => {
  function storage() {
    const values = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    });
    return values;
  }
  it('persists on the required key and isolates signed-in accounts', () => {
    const values = storage();
    saveTeams('owner-a', [team]);
    saveTeams('owner-b', [{ ...team, name: 'Other account' }]);
    expect(values.has('celestia_saved_teams')).toBe(true);
    expect(loadSavedTeams('owner-a').teams).toEqual([team]);
    expect(loadSavedTeams('owner-b').teams[0].name).toBe('Other account');
    saveTeams('owner-a', []);
    expect(loadSavedTeams('owner-b').teams).toHaveLength(1);
  });
  it('round-trips a portable team file', () => {
    expect(parseTeamFile(JSON.stringify({ version: 1, teams: [team] }))).toEqual([team]);
  });
  it.each([
    { version: 2, teams: [team] },
    {
      version: 1,
      teams: [{ ...team, characterKeys: ['Bennett', 'Bennett', 'Xingqiu', 'RaidenShogun'] }],
    },
    {
      version: 1,
      teams: [{ ...team, characterKeys: ['Bennett', 'Unknown', 'Xingqiu', 'RaidenShogun'] }],
    },
    { version: 1, teams: [{ ...team, name: '' }] },
    { version: 1, teams: [team, team] },
  ])('rejects invalid imports %j', (file) =>
    expect(() => parseTeamFile(JSON.stringify(file))).toThrow(),
  );
  it('preserves damaged storage and reports a failed save', () => {
    const values = storage();
    values.set('celestia_saved_teams', '{damaged');
    expect(loadSavedTeams('owner').error).toContain('preserved');
    expect(() => saveTeams('owner', [team])).toThrow();
    expect(values.get('celestia_saved_teams')).toBe('{damaged');
  });
  it('reports unavailable browser storage without discarding saved state', () => {
    vi.stubGlobal('localStorage', {
      getItem() {
        throw new Error('denied');
      },
    });
    expect(loadSavedTeams('owner').error).not.toBe('');
  });
});
