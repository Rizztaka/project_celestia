import { describe, expect, it } from 'vitest';

import {
  defaultTeamSearchPreferences,
  teamSearchPreferencesSchema,
} from '../../../packages/api-contracts/src/genshin/team-preferences.ts';
import { buildAutoTeamPool } from '../../web/src/lib/team-damage/auto-generator.calculator.ts';
import {
  inaccessiblePreferences,
  parseTeamPreferences,
  readTeamPreferencesRaw,
  teamPreferencesKey,
  writeTeamPreferences,
} from '../../web/src/lib/team-preferences.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
function storage() {
  const data = new Map();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
  };
}
function records() {
  return analysisFixture(uid).snapshot.characters.map((character) => ({
    uid,
    character,
    observedAt: '2026-10-25T10:00:00Z',
  }));
}
const skirk = '10000114:11401';
const escoffier = '10000112:11201';
const furina = 'avatar:10000089';

describe('versioned per-UID team preferences', () => {
  it('validates bounded intent fields and scopes authenticated preferences by owner and account', () => {
    const base = defaultTeamSearchPreferences(uid, {
      ownerId: 'owner-a',
      accountId: 'account-a',
    });
    const preferences = teamSearchPreferencesSchema.parse({
      ...base,
      protectedGear: ['weapon:weapon-a', 'artifact:artifact-a'],
      comfort: 'execution_friendly',
      timeBudgetMinutes: 30,
      content: { mode: 'abyss', difficulty: '12', target: 'full_clear' },
    });
    expect(preferences).toMatchObject({
      ownerId: 'owner-a',
      accountId: 'account-a',
      protectedGear: ['weapon:weapon-a', 'artifact:artifact-a'],
      comfort: 'execution_friendly',
      timeBudgetMinutes: 30,
      content: { mode: 'abyss', difficulty: '12', target: 'full_clear' },
    });
    expect(
      teamSearchPreferencesSchema.safeParse({ ...preferences, protectedGear: ['x'.repeat(201)] })
        .success,
    ).toBe(false);
    expect(
      teamSearchPreferencesSchema.safeParse({ ...preferences, protectedGear: ['raw-uuid'] })
        .success,
    ).toBe(false);
    expect(
      teamSearchPreferencesSchema.safeParse({
        ...defaultTeamSearchPreferences(uid),
        protectedGear: ['weapon:weapon-a'],
      }).success,
    ).toBe(false);
    expect(
      teamSearchPreferencesSchema.safeParse({ ...preferences, timeBudgetMinutes: 10001 }).success,
    ).toBe(false);
    expect(
      teamSearchPreferencesSchema.safeParse({
        ...preferences,
        content: { ...preferences.content, difficulty: 'x'.repeat(81) },
      }).success,
    ).toBe(false);
  });

  it('persists choices independently and roundtrips source IDs without account observations', () => {
    const target = storage();
    const preferences = {
      ...defaultTeamSearchPreferences(uid),
      favoriteCharacters: [furina],
      requiredForms: [skirk],
      preferredDriverKey: skirk,
      verificationSamples: 10,
    };
    writeTeamPreferences(uid, preferences, null, target);
    expect(parseTeamPreferences(uid, readTeamPreferencesRaw(uid, target))).toEqual({
      preferences,
      state: 'saved',
    });
    expect(
      parseTeamPreferences('800000002', readTeamPreferencesRaw('800000002', target)).state,
    ).toBe('empty');
    expect(target.data.size).toBe(1);
    expect(() => writeTeamPreferences('800000002', preferences, null, target)).toThrow(
      'another UID',
    );
  });
  it('preserves malformed, oversized, foreign-UID and unknown-version saved data', () => {
    for (const raw of [
      'invalid',
      'x'.repeat(16001),
      JSON.stringify({ ...defaultTeamSearchPreferences('800000002') }),
      JSON.stringify({ ...defaultTeamSearchPreferences(uid), version: 2 }),
    ]) {
      const target = storage();
      target.setItem(teamPreferencesKey(uid), raw);
      expect(parseTeamPreferences(uid, raw).state).toBe('invalid');
      expect(() =>
        writeTeamPreferences(uid, defaultTeamSearchPreferences(uid), raw, target),
      ).toThrow('unreadable');
      expect(target.getItem(teamPreferencesKey(uid))).toBe(raw);
    }
  });
  it('rejects writes based on an older saved value', () => {
    const target = storage();
    const preferences = defaultTeamSearchPreferences(uid);
    writeTeamPreferences(uid, preferences, null, target);
    const original = target.getItem(teamPreferencesKey(uid));
    const concurrent = { ...preferences, favoriteCharacters: [furina] };
    writeTeamPreferences(uid, concurrent, original, target);
    expect(() => writeTeamPreferences(uid, preferences, original, target)).toThrow('another tab');
    expect(parseTeamPreferences(uid, target.getItem(teamPreferencesKey(uid))).preferences).toEqual(
      concurrent,
    );
  });
  it('provides session defaults on denied reads and preserves data on failed writes', () => {
    const denied = {
      getItem() {
        throw new Error('denied');
      },
      setItem() {
        throw new Error('denied');
      },
    };
    expect(readTeamPreferencesRaw(uid, denied)).toBe(inaccessiblePreferences);
    expect(parseTeamPreferences(uid, inaccessiblePreferences).state).toBe('unavailable');
    const target = storage();
    writeTeamPreferences(uid, defaultTeamSearchPreferences(uid), null, target);
    const raw = target.getItem(teamPreferencesKey(uid));
    const fail = {
      getItem: target.getItem,
      setItem() {
        throw new Error('quota');
      },
    };
    expect(() =>
      writeTeamPreferences(
        uid,
        { ...defaultTeamSearchPreferences(uid), priority: 'favorites' },
        raw,
        fail,
      ),
    ).toThrow('changes still apply');
    expect(target.getItem(teamPreferencesKey(uid))).toBe(raw);
  });
  it('rejects contradictory requirements, duplicate Traveler forms and unsafe identities', () => {
    const base = defaultTeamSearchPreferences(uid);
    for (const change of [
      { requiredForms: [skirk], excludedCharacters: ['avatar:10000114'] },
      { requiredForms: ['10000005:504', '10000007:704'] },
      { favoriteCharacters: ['avatar:10000005'] },
      { requiredForms: ['10000089:unknown'] },
      { verificationSamples: 999 },
    ])
      expect(teamSearchPreferencesSchema.safeParse({ ...base, ...change }).success).toBe(false);
    expect(
      teamSearchPreferencesSchema.safeParse({ ...base, requiredForms: ['10000089:'] }).success,
    ).toBe(false);
  });
});

describe('preference-constrained team candidates', () => {
  it('honors required and excluded members without modifying observed builds', () => {
    const input = records();
    const before = structuredClone(input);
    const preferences = {
      ...defaultTeamSearchPreferences(uid),
      requiredForms: [escoffier],
      excludedCharacters: ['avatar:10000115'],
    };
    const pool = buildAutoTeamPool(uid, skirk, input, preferences);
    expect(pool.candidates.length).toBeGreaterThan(0);
    for (const candidate of pool.candidates) {
      const keys = candidate.team.members.map((member) => member.characterKey);
      expect(keys).toContain(escoffier);
      expect(keys).not.toContain('10000115:11501');
      expect(keys).toContain(skirk);
    }
    expect(input).toEqual(before);
  });
  it('uses favorites as an explicit eligibility priority while preserving numeric DPS ranking inputs', () => {
    const preferences = {
      ...defaultTeamSearchPreferences(uid),
      favoriteCharacters: [furina],
      priority: 'favorites',
    };
    const favorites = buildAutoTeamPool(uid, skirk, records(), preferences);
    expect(favorites.maxFavoriteCount).toBe(1);
    expect(favorites.candidates.every((candidate) => candidate.favoriteCount === 1)).toBe(true);
    const damage = buildAutoTeamPool(uid, skirk, records(), { ...preferences, priority: 'damage' });
    expect(damage.candidates.some((candidate) => candidate.favoriteCount === 0)).toBe(true);
    for (const candidate of favorites.candidates) {
      const sameTeam = damage.candidates.find(
        (other) => JSON.stringify(other.team.members) === JSON.stringify(candidate.team.members),
      );
      expect(sameTeam.config).toBe(candidate.config);
    }
  });
  it('retains unavailable choices and explains impossible requirements instead of relaxing them', () => {
    const preferences = { ...defaultTeamSearchPreferences(uid), requiredForms: ['10000999:99901'] };
    const pool = buildAutoTeamPool(uid, skirk, records(), preferences);
    expect(pool.candidates).toEqual([]);
    expect(pool.missingRequiredKeys).toEqual(preferences.requiredForms);
    expect(pool.issues).toContain('required_unavailable');
    expect(
      buildAutoTeamPool(uid, skirk, records(), {
        ...defaultTeamSearchPreferences(uid),
        excludedCharacters: ['avatar:10000114'],
      }).issues,
    ).toContain('driver_excluded');
  });
  it('keeps an explicitly required older Traveler form rather than silently using the newest form', () => {
    const input = records();
    const traveler = structuredClone(input[0]);
    Object.assign(traveler.character, {
      id: 10000005,
      skillDepotId: 504,
      key: '10000005:504',
      element: 'Anemo',
    });
    const otherForm = structuredClone(traveler);
    otherForm.observedAt = '2026-10-25T11:00:00Z';
    Object.assign(otherForm.character, {
      id: 10000005,
      skillDepotId: 506,
      key: '10000005:506',
      element: 'Geo',
    });
    const pool = buildAutoTeamPool(uid, skirk, [...input, traveler, otherForm], {
      ...defaultTeamSearchPreferences(uid),
      requiredForms: [traveler.character.key],
    });
    expect(pool.candidates.length).toBeGreaterThan(0);
    expect(
      pool.candidates.every((candidate) =>
        candidate.team.members.some((member) => member.characterKey === traveler.character.key),
      ),
    ).toBe(true);
    expect(
      pool.candidates.every(
        (candidate) =>
          !candidate.team.members.some((member) => member.characterKey === otherForm.character.key),
      ),
    ).toBe(true);
  });
});
