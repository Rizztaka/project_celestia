import { describe, expect, it } from 'vitest';

import {
  accountContextSchema,
  accountContextSourcePolicy,
} from '../../../packages/api-contracts/src/genshin/account-context.ts';
import { publicAccountContext } from '../../web/src/lib/account-context.calculator.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
const now = Date.parse('2026-10-25T12:00:00Z');
const record = (observedAt = '2026-10-25T11:00:00Z') => ({
  uid,
  observedAt,
  retrievedAt: '2026-10-25T11:01:00Z',
  character: analysisFixture(uid).snapshot.characters[0],
});

describe('unified account-context policy', () => {
  it('marks a source unavailable when no usable evidence was retrieved', () => {
    const source = publicAccountContext(uid, [], now).context.sourceTimestamps[0];
    expect(source.freshness).toBe('unavailable');
    expect(source.retrievedAt).toBeNull();
  });

  it('exposes independent timestamp categories and deterministic missing-data reasons', () => {
    const { context } = publicAccountContext(uid, [record()], () => now);
    expect(context.characters[0]).toMatchObject({
      freshness: 'fresh',
      timestamps: {
        observedAt: '2026-10-25T11:00:00.000Z',
        retrievedAt: '2026-10-25T11:01:00Z',
        importedAt: null,
        databaseUpdatedAt: null,
        sourceUpdatedAt: null,
      },
    });
    expect(context.missingData).toEqual(
      expect.arrayContaining([
        { dimension: 'roster', status: 'unknown', reason: 'public_showcase_is_partial' },
        { dimension: 'ownership', status: 'unknown', reason: 'absence_is_not_ownership_evidence' },
      ]),
    );
    expect(context.characters[0].missingData).toEqual(
      expect.arrayContaining([
        { dimension: 'mechanics', status: 'not_modeled', reason: 'mechanics_are_not_in_context' },
      ]),
    );
    expect(context.sourceTimestamps[0].retrievedAt).toBe('2026-10-25T11:01:00Z');
    expect(accountContextSchema.safeParse(context).success).toBe(true);
  });

  it('rejects future observations as invalid without allowing them to replace valid evidence', () => {
    const { context, records } = publicAccountContext(
      uid,
      [record('2026-10-25T11:00:00Z'), record('2099-01-01T00:00:00Z')],
      () => now,
    );
    expect(records).toHaveLength(1);
    expect(context.characters[0]).toMatchObject({
      freshness: 'fresh',
      buildState: 'observed',
    });
    expect(context.issues).toContainEqual({
      code: 'future_observation',
      formKey: context.characters[0].formKey,
    });
  });

  it('keeps source families separate and does not allow hypothetical evidence to become owned', () => {
    expect(accountContextSourcePolicy.mergeableSourceFamilies).toEqual([
      ['public_showcase'],
      ['good_import', 'stored_account', 'manual'],
      ['hypothetical'],
    ]);
    const { context } = publicAccountContext(uid, [record()], now);
    const hypothetical = accountContextSchema.safeParse({
      ...context,
      scope: 'hypothetical',
      uid: null,
      sources: ['hypothetical'],
      sourceTimestamps: [
        {
          source: 'hypothetical',
          observedAt: null,
          importedAt: null,
          databaseUpdatedAt: null,
          sourceUpdatedAt: null,
          retrievedAt: null,
        },
      ],
      characters: context.characters.map((character) => ({
        ...character,
        ownership: 'hypothetical',
        buildState: 'hypothetical',
        sources: ['hypothetical'],
      })),
    });
    expect(hypothetical.success).toBe(true);
    expect(
      accountContextSchema.safeParse({
        ...hypothetical.data,
        characters: hypothetical.data.characters.map((character) => ({
          ...character,
          ownership: 'observed_owned',
        })),
      }).success,
    ).toBe(false);
  });
});
