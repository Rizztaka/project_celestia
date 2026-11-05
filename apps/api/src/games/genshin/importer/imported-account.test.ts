import {
  accountContextSchema,
  defaultTeamSearchPreferences,
  importedAccountContextSchema,
  teamSearchPreferencesSchema,
} from '@celestia/api-contracts';
import { describe, expect, it } from 'vitest';

import { importedAccountContext } from './imported-account.calculator.js';
import { importedAccountFixture } from './imported-account.fixtures.js';

describe('stored imported-account evidence adapter', () => {
  it('preserves valid GOOD rows and instance identities without declaring a complete or fresh build', () => {
    const result = importedAccountContext(importedAccountFixture());
    expect(importedAccountContextSchema.safeParse(result).success).toBe(true);
    expect(result.context).toMatchObject({
      scope: 'private_authenticated',
      accountId: 'account-a',
      uid: null,
      rosterScope: 'partial',
      completenessEvidence: null,
      absentCharacterOwnership: 'unknown',
      equipmentExclusivity: 'unverified',
      oldestObservationAt: null,
      newestObservationAt: null,
    });
    expect(result.context.characters).toEqual([
      expect.objectContaining({
        avatarId: 10000046,
        skillDepotId: null,
        formKey: '10000046:unknown',
        buildState: 'stored',
        observedAt: null,
        freshness: 'unknown',
        ownership: 'unknown',
        sources: ['stored_account'],
      }),
    ]);
    expect(result.evidence.characters[0]).toMatchObject({
      id: 'character-a',
      characterKey: 'HuTao',
      equippedWeaponId: 'weapon-a',
      level: 80,
    });
    expect(result.evidence.weapons[0]).toMatchObject({
      id: 'weapon-a',
      weaponKey: 'StaffOfHoma',
      refinement: 1,
    });
    expect(result.evidence.artifacts[0]).toMatchObject({
      id: 'artifact-a',
      equippedCharacterId: 'character-a',
      mainStatValue: null,
    });
    expect(result.evidence.receipts[0]).toMatchObject({
      source: 'Synthetic GOOD exporter',
      importedAt: '2026-10-20T12:00:00.000Z',
    });
  });
  it('keeps missing ownership and roster completeness unknown, including an explicit empty import', () => {
    const state = importedAccountFixture();
    state.characters = [];
    state.weapons = [];
    state.artifacts = [];
    state.importStates[0]!.entryCount = 0;
    for (const input of [null, { ...state, importStates: [] }, state]) {
      const result = importedAccountContext(input);
      expect(result.context.characters).toEqual([]);
      expect(result.context.absentCharacterOwnership).toBe('unknown');
      expect(result.context.completenessEvidence).toBeNull();
      expect(result.context.rosterScope).toBe(input?.importStates.length ? 'partial' : 'unknown');
    }
  });
  it('does not backfill missing fields or synthesize totals, talents, gear, or a complete set', () => {
    const state = importedAccountFixture();
    Reflect.deleteProperty(state.characters[0]!, 'level');
    Reflect.deleteProperty(state.characters[0]!, 'talentSkill');
    state.characters[0]!.equippedWeaponId = null;
    state.weapons = [];
    state.artifacts = [];
    const result = importedAccountContext(state);
    expect(result.evidence.characters[0]).toMatchObject({
      level: null,
      talentSkill: null,
      equippedWeaponId: null,
    });
    expect(result.evidence.weapons).toEqual([]);
    expect(result.evidence.artifacts).toEqual([]);
    expect(result.evidence.characters[0]).not.toHaveProperty('stats');
  });
  it('keeps database update dates and section receipt dates distinct from unknown observation times', () => {
    const state = importedAccountFixture();
    state.importStates[0]!.importedAt = new Date('2026-10-26T12:00:00Z');
    state.characters[0]!.updatedAt = new Date('2026-10-25T12:00:00Z');
    const result = importedAccountContext(state);
    expect(result.context.characters[0]).toMatchObject({ observedAt: null, freshness: 'unknown' });
    expect(result.context.characters[0]!.timestamps).toMatchObject({
      importedAt: null,
      databaseUpdatedAt: '2026-10-25T12:00:00.000Z',
      observedAt: null,
    });
    expect(result.evidence.characters[0]!.updatedAt).toBe('2026-10-25T12:00:00.000Z');
    expect(result.evidence.receipts.find((r) => r.section === 'characters')!.importedAt).toBe(
      '2026-10-26T12:00:00.000Z',
    );
    expect(result.evidence.weapons[0]!.updatedAt).toBe('2026-10-20T12:00:00.000Z');
    // A recent partial roster receipt does not re-date preserved older character rows.
    expect(result.context.characters[0]!.sources).toEqual(['stored_account']);
    state.importStates = [];
    Reflect.deleteProperty(state.characters[0]!, 'updatedAt');
    expect(importedAccountContext(state).evidence.characters[0]!.updatedAt).toBeNull();
  });
  it('does not report valid stored rows as undated game observations', () => {
    const result = importedAccountContext(importedAccountFixture());
    expect(result.context.issues).toEqual([]);
    expect(result.context.characters[0]!.missingData).toContainEqual({
      dimension: 'observation',
      status: 'unknown',
      reason: 'import_has_no_game_observation_time',
    });
  });
  it('does not re-date a preserved character when a later partial import adds another row', () => {
    const state = importedAccountFixture();
    const before = importedAccountContext(state).context.characters[0]!;
    state.importStates[0]!.importedAt = new Date('2026-10-27T12:00:00Z');
    state.characters.push({
      ...state.characters[0]!,
      id: 'character-b',
      characterKey: 'Furina',
      equippedWeaponId: null,
    });
    const after = importedAccountContext(state);
    expect(
      after.context.characters.find((c) => c.formKey === '10000046:unknown')!.timestamps,
    ).toEqual(before.timestamps);
    expect(after.evidence.receipts.find((r) => r.section === 'characters')!.importedAt).toBe(
      '2026-10-27T12:00:00.000Z',
    );
  });
  it('never maps ambiguous Traveler keys to a default avatar or elemental depot', () => {
    const state = importedAccountFixture();
    state.characters = [
      'TravelerAnemo',
      'TravelerPyro',
      'Aether',
      'Lumine',
      'UnknownCharacter',
    ].map((characterKey, index) => ({
      ...state.characters[0]!,
      id: `character-${index}`,
      characterKey,
      equippedWeaponId: null,
    }));
    state.weapons = [];
    state.artifacts = [];
    const result = importedAccountContext(state);
    expect(result.evidence.characters.map((c) => c.characterKey)).toEqual([
      'TravelerAnemo',
      'TravelerPyro',
      'Aether',
      'Lumine',
      'UnknownCharacter',
    ]);
    expect(result.context.characters.map((c) => c.formKey)).toEqual([
      '10000005:unknown',
      '10000007:unknown',
    ]);
    expect(result.context.rejectedRecordCount).toBe(3);
    expect(result.evidence.characters.slice(0, 2).map((c) => c.formKey)).toEqual([null, null]);
  });
  it('preserves conflicting equipment claims rather than choosing a winner', () => {
    const state = importedAccountFixture();
    state.characters.push({
      ...state.characters[0]!,
      id: 'character-b',
      characterKey: 'Furina',
      equippedWeaponId: null,
    });
    state.artifacts.push({ ...state.artifacts[0]!, id: 'artifact-b', mainStatKey: 'atk' });
    const result = importedAccountContext(state);
    expect(result.context.characters.find((c) => c.formKey === '10000046:unknown')).toMatchObject({
      buildState: 'conflicted',
      buildFingerprint: null,
    });
    expect(result.context.characters.find((c) => c.formKey === '10000089:unknown')).toMatchObject({
      buildState: 'stored',
    });
    expect(result.evidence.artifacts).toHaveLength(2);
    expect(result.evidence.characters).toHaveLength(2);
    expect(result.context.issues.filter((i) => i.code === 'conflicting_builds')).toHaveLength(1);
  });
  it('scopes malformed and dangling equipment conflicts to the affected character only', () => {
    const state = importedAccountFixture();
    state.characters.push({
      ...state.characters[0]!,
      id: 'character-b',
      characterKey: 'Furina',
      equippedWeaponId: null,
    });
    state.artifacts.push({
      ...state.artifacts[0]!,
      id: 'artifact-unequipped',
      equippedCharacterId: null,
      subStats: { invalid: 'legacy value' },
    });
    state.artifacts.push({
      ...state.artifacts[0]!,
      id: 'artifact-dangling',
      equippedCharacterId: 'missing-character',
    });
    const result = importedAccountContext(state);
    expect(result.context.characters.find((c) => c.formKey === '10000046:unknown')).toMatchObject({
      buildState: 'stored',
    });
    expect(result.context.characters.find((c) => c.formKey === '10000089:unknown')).toMatchObject({
      buildState: 'stored',
    });
    expect(result.context.issues).toEqual([]);
    expect(result.evidence.issues).toEqual(
      expect.arrayContaining([
        { code: 'invalid_substats', recordId: 'artifact-unequipped' },
        { code: 'inconsistent_assignment', recordId: 'artifact-dangling' },
      ]),
    );
  });
  it('retains both conflicting character records without selecting the newest or filling a build', () => {
    const state = importedAccountFixture();
    state.characters.push({
      ...state.characters[0]!,
      id: 'character-b',
      level: 1,
      updatedAt: new Date('2026-10-26T12:00:00Z'),
    });
    const result = importedAccountContext(state);
    expect(result.evidence.characters.map((c) => c.level)).toEqual([80, 1]);
    expect(result.context.characters).toHaveLength(1);
    expect(result.context.characters[0]).toMatchObject({
      buildState: 'conflicted',
      buildFingerprint: null,
      observedAt: null,
    });
    expect(
      importedAccountContext({ ...state, characters: [...state.characters].reverse() }),
    ).toEqual(result);
  });
  it('keeps malformed substats unknown and reports the affected instance', () => {
    const state = importedAccountFixture();
    state.artifacts[0]!.subStats = { invalid: 'legacy value' };
    const result = importedAccountContext(state);
    expect(result.evidence.artifacts[0]!.subStats).toBeNull();
    expect(result.evidence.issues).toContainEqual({
      code: 'invalid_substats',
      recordId: 'artifact-a',
    });
    expect(result.context.characters[0]).toMatchObject({
      buildState: 'conflicted',
      buildFingerprint: null,
    });
  });
  it('does not label a future receipt or row date as a future game observation', () => {
    const state = importedAccountFixture();
    state.importStates[0]!.importedAt = new Date('2099-01-01T00:00:00Z');
    const result = importedAccountContext(state);
    expect(result.evidence.receipts.find((r) => r.section === 'characters')!.importedAt).toBe(
      '2099-01-01T00:00:00.000Z',
    );
    expect(result.context.characters[0]).toMatchObject({ observedAt: null, freshness: 'unknown' });
  });
  it('fails closed on foreign rows and retains a dangling equipment reference as a conflict without reading its target', () => {
    const state = importedAccountFixture();
    state.weapons[0]!.accountId = 'foreign-account';
    expect(() => importedAccountContext(state)).toThrow('account');
    state.weapons = [];
    const result = importedAccountContext(state);
    expect(result.evidence.weapons).toEqual([]);
    expect(result.context.characters[0]!.buildState).toBe('conflicted');
  });
  it('is nonmutating and invariant to repository order and JSON property order', () => {
    const state = importedAccountFixture();
    state.weapons.push({ ...state.weapons[0]!, id: 'weapon-b' });
    const before = structuredClone(state);
    const first = importedAccountContext(state);
    state.weapons.reverse();
    state.importStates.reverse();
    state.artifacts[0]!.subStats = [{ value: 3.9, key: 'critRate_' }];
    expect(importedAccountContext(state)).toEqual(first);
    expect(importedAccountContext(before)).toEqual(first);
    expect(before.characters).toEqual(state.characters);
  });
  it.each([
    'level',
    'equipment-instance',
    'assignment',
    'receipt',
    'unresolved-character',
    'missing-field',
    'uid',
    'artifact-slot',
    'artifact-content',
    'receipt-time',
    'conflict-state',
  ])('invalidates its fingerprint for changed %s evidence', (change) => {
    const state = importedAccountFixture();
    const first = importedAccountContext(state).context.fingerprint;
    if (change === 'level') state.characters[0]!.level = 81;
    if (change === 'equipment-instance') state.weapons[0]!.id = 'different-copy';
    if (change === 'assignment') state.artifacts[0]!.equippedCharacterId = null;
    if (change === 'receipt') state.importStates[0]!.source = 'Another exporter';
    if (change === 'unresolved-character')
      state.characters.push({ ...state.characters[0]!, id: 'unknown', characterKey: 'Unmapped' });
    if (change === 'missing-field') Reflect.deleteProperty(state.characters[0]!, 'talentSkill');
    if (change === 'uid') state.uid = '800000001';
    if (change === 'artifact-slot') state.artifacts[0]!.slotKey = 'circlet';
    if (change === 'artifact-content') state.artifacts[0]!.setKey = 'ShimenawasReminiscence';
    if (change === 'receipt-time')
      state.importStates[0]!.importedAt = new Date('2026-10-21T12:00:00Z');
    if (change === 'conflict-state')
      state.characters.push({ ...state.characters[0]!, id: 'conflict-character', level: 1 });
    expect(importedAccountContext(state).context.fingerprint).not.toBe(first);
  });
  it('does not invalidate build evidence for unrelated material or account metadata changes', () => {
    const state = importedAccountFixture();
    const first = importedAccountContext(state).context.fingerprint;
    state.nickname = 'Another nickname';
    state.updatedAt = new Date('2026-10-26T00:00:00Z');
    state.importStates.push({ ...state.importStates[0]!, id: 'materials', section: 'materials' });
    expect(importedAccountContext(state).context.fingerprint).toBe(first);
  });
  it('does not invalidate a character without gear when only unrelated gear sections re-import', () => {
    const state = importedAccountFixture();
    state.characters[0]!.equippedWeaponId = null;
    state.artifacts = [];
    const first = importedAccountContext(state).context.characters[0]!.buildFingerprint;
    state.importStates.push({
      ...state.importStates[0]!,
      id: 'weapons-receipt',
      section: 'weapons',
      importedAt: new Date('2026-10-27T12:00:00Z'),
    });
    state.importStates.push({
      ...state.importStates[0]!,
      id: 'artifacts-receipt',
      section: 'artifacts',
      importedAt: new Date('2026-10-27T12:00:00Z'),
    });
    expect(importedAccountContext(state).context.characters[0]!.buildFingerprint).toBe(first);
  });
  it('namespaces stored equipment so protected gear joins the shared identity', () => {
    const result = importedAccountContext(importedAccountFixture());
    const ids = result.context.characters[0]!.equipmentInstanceIds;
    expect(ids).toEqual(['weapon:weapon-a', 'artifact:artifact-a']);
    const preferences = defaultTeamSearchPreferences(null, {
      ownerId: 'owner-a',
      accountId: 'account-a',
    });
    expect(
      teamSearchPreferencesSchema.safeParse({ ...preferences, protectedGear: ids }).success,
    ).toBe(true);
    expect(
      teamSearchPreferencesSchema.safeParse({ ...preferences, protectedGear: ['weapon-a'] })
        .success,
    ).toBe(false);
  });
  it('rejects hypothetical/public provenance mixing and complete or observed claims on undated stored records', () => {
    const result = importedAccountContext(importedAccountFixture());
    const context = structuredClone(result.context);
    context.characters[0]!.sources = ['hypothetical'];
    expect(accountContextSchema.safeParse(context).success).toBe(false);
    expect(
      accountContextSchema.safeParse({ ...result.context, rosterScope: 'complete_snapshot' })
        .success,
    ).toBe(false);
    expect(
      accountContextSchema.safeParse({
        ...result.context,
        characters: [{ ...result.context.characters[0], buildState: 'observed' }],
      }).success,
    ).toBe(false);
    expect(
      importedAccountContextSchema.safeParse({
        ...result,
        context: { ...result.context, sources: ['public_showcase'] },
      }).success,
    ).toBe(false);
  });
  it('prevents stored provenance being relabeled as a dated owned observation through the shared contract', () => {
    const { context } = importedAccountContext(importedAccountFixture());
    const claimed = {
      ...context,
      characters: [
        {
          ...context.characters[0],
          buildState: 'observed',
          observedAt: '2026-10-26T00:00:00Z',
          freshness: 'within_policy',
          ownership: 'observed_owned',
        },
      ],
    };
    expect(accountContextSchema.safeParse(claimed).success).toBe(false);
  });

  it('requires an explicit private scope for null-UID stored contexts', () => {
    const result = importedAccountContext(importedAccountFixture());
    expect(accountContextSchema.safeParse({ ...result.context, scope: undefined }).success).toBe(
      false,
    );
    expect(
      accountContextSchema.safeParse({
        ...result.context,
        scope: 'public_uid',
        accountId: null,
        sources: ['good_import'],
      }).success,
    ).toBe(false);
    expect(
      importedAccountContextSchema.safeParse({
        ...result,
        context: { ...result.context, accountId: null, sources: ['good_import'] },
      }).success,
    ).toBe(false);
  });

  it('keeps a no-import response private and unknown without creating an account claim', () => {
    const result = importedAccountContext(null);
    expect(result.context).toMatchObject({
      scope: 'private_authenticated',
      accountId: null,
      uid: null,
      rosterScope: 'unknown',
      sources: ['stored_account'],
      characters: [],
    });
    expect(importedAccountContextSchema.safeParse(result).success).toBe(true);
  });
});
