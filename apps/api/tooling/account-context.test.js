import { describe, expect, it } from 'vitest';

import { accountContextSchema } from '../../../packages/api-contracts/src/genshin/account-context.ts';
import {
  PUBLIC_BUILD_FRESHNESS,
  publicAccountContext,
} from '../../web/src/lib/account-context.calculator.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const uid = '800000001';
const now = Date.parse('2026-10-25T12:00:00Z');
function record(index = 0, observedAt = '2026-10-25T11:00:00Z') {
  return { uid, observedAt, character: analysisFixture(uid).snapshot.characters[index] };
}

describe('public account evidence', () => {
  it('keeps an empty or growing public roster partial and absent ownership unknown', () => {
    const empty = publicAccountContext(uid, [], now);
    const result = publicAccountContext(uid, [record()], now);
    for (const report of [empty, result]) {
      expect(accountContextSchema.safeParse(report.context).success).toBe(true);
      expect(report.context.rosterScope).toBe('partial');
      expect(report.context.scope).toBe('public_uid');
      expect(report.context.absentCharacterOwnership).toBe('unknown');
      expect(report.context.equipmentExclusivity).toBe('unverified');
    }
    expect(result.context.characters[0]).toMatchObject({
      ownership: 'observed_owned',
      buildState: 'observed',
      freshness: 'fresh',
    });
  });

  it('selects the newest whole build without blending stats, preserving unknown fields', () => {
    const older = record(0, '2026-10-20T11:00:00Z');
    const newer = record();
    newer.character.weapon = null;
    newer.character.level = null;
    const result = publicAccountContext(uid, [older, newer], now);
    expect(result.records).toEqual([newer]);
    expect(result.records[0].character.weapon).toBeNull();
    expect(result.records[0].character.level).toBeNull();
    expect(result.context.characters[0].observedAt).toBe('2026-10-25T11:00:00.000Z');
  });

  it('blocks equal-time conflicting builds until a newer observation resolves them', () => {
    const first = record();
    const conflict = structuredClone(first);
    conflict.character.level = 1;
    const result = publicAccountContext(uid, [first, conflict], now);
    expect(result.records).toEqual([]);
    expect(result.context.characters[0]).toMatchObject({
      ownership: 'observed_owned',
      buildState: 'conflicted',
      buildFingerprint: null,
    });
    expect(result.context.issues).toEqual([
      { code: 'conflicting_builds', formKey: first.character.key },
    ]);
    const refreshed = record(0, '2026-10-25T11:30:00Z');
    expect(publicAccountContext(uid, [first, conflict, refreshed], now).records).toEqual([
      refreshed,
    ]);
  });

  it('excludes future and undated records without losing an older valid observation', () => {
    const previous = record(0, '2026-10-01T00:00:00Z');
    const future = record(0, '2026-10-26T00:00:00Z');
    const invalid = record(0, 'unknown');
    const result = publicAccountContext(uid, [previous, future, invalid], now);
    expect(result.records).toEqual([previous]);
    expect(result.context.characters[0].freshness).toBe('stale');
    expect(result.context.issues.map((issue) => issue.code)).toEqual([
      'future_observation',
      'undated_observation',
    ]);
    const missing = publicAccountContext(uid, [future], now);
    expect(missing.context.characters[0]).toMatchObject({
      buildState: 'missing',
      observedAt: null,
      freshness: 'future_invalid',
      ownership: 'unknown',
    });
    expect(missing.context.sourceTimestamps[0]).toMatchObject({
      source: 'public_showcase',
      freshness: 'future_invalid',
    });
  });

  it('uses explicit freshness boundaries and changes the context when evidence ages out', () => {
    const input = [record()];
    const time = Date.parse(input[0].observedAt);
    const boundary = publicAccountContext(uid, input, time + PUBLIC_BUILD_FRESHNESS.maxAgeMs);
    const expired = publicAccountContext(uid, input, time + PUBLIC_BUILD_FRESHNESS.maxAgeMs + 1);
    expect(boundary.context.characters[0].freshness).toBe('fresh');
    expect(expired.context.characters[0].freshness).toBe('stale');
    expect(boundary.context.fingerprint).not.toBe(expired.context.fingerprint);
    expect(() => publicAccountContext(uid, input, NaN)).toThrow('INVALID_ACCOUNT_CLOCK_POLICY');
  });

  it('isolates UIDs, rejects mismatched forms and never infers missing depot identities', () => {
    const foreign = { ...record(), uid: '800000002' };
    const bad = record();
    bad.character.id += 1;
    const missingDepot = record(1);
    missingDepot.character.skillDepotId = null;
    missingDepot.character.key = `${missingDepot.character.id}:unknown`;
    const result = publicAccountContext(uid, [foreign, bad, missingDepot], now);
    expect(result.records).toEqual([missingDepot]);
    expect(result.context.characters[0].skillDepotId).toBeNull();
    expect(result.context.rejectedRecordCount).toBe(1);
    expect(result.context.issues[0].code).toBe('invalid_identity');
    expect(accountContextSchema.safeParse(result.context).success).toBe(true);
  });

  it('is order independent and non-mutating while detecting build and observation changes', () => {
    const inputs = [record(0), record(1, '2026-10-24T11:00:00Z')];
    const before = structuredClone(inputs);
    const result = publicAccountContext(uid, inputs, now);
    expect(result.context.mixedObservationTimes).toBe(true);
    expect(publicAccountContext(uid, [...inputs].reverse(), now).context).toEqual(result.context);
    expect(inputs).toEqual(before);
    inputs[0].character.constellation = 6;
    expect(publicAccountContext(uid, inputs, now).context.fingerprint).not.toBe(
      result.context.fingerprint,
    );
    expect(publicAccountContext(uid, before, now + 1).context.fingerprint).toBe(
      result.context.fingerprint,
    );
  });

  it('prevents public and hypothetical evidence from certifying a complete real roster', () => {
    const { context } = publicAccountContext(uid, [record()], now);
    expect(
      accountContextSchema.safeParse({ ...context, rosterScope: 'complete_snapshot' }).success,
    ).toBe(false);
    const hypothetical = structuredClone(context);
    hypothetical.characters[0].sources = ['hypothetical'];
    expect(accountContextSchema.safeParse(hypothetical).success).toBe(false);
    expect(
      accountContextSchema.safeParse({
        ...context,
        scope: 'private_authenticated',
        accountId: null,
      }).success,
    ).toBe(false);
  });

  it('requires explicit completeness evidence and consistent source provenance for other adapters', () => {
    const { context } = publicAccountContext(uid, [record()], now);
    const complete = structuredClone(context);
    complete.scope = 'private_authenticated';
    complete.accountId = null;
    complete.rosterScope = 'complete_snapshot';
    complete.sources = ['manual'];
    complete.characters[0].sources = ['manual'];
    expect(accountContextSchema.safeParse(complete).success).toBe(false);
    complete.completenessEvidence = {
      source: 'manual',
      kind: 'explicit_user_declaration',
      observedAt: '2026-10-25T11:00:00Z',
    };
    complete.sourceTimestamps = complete.sourceTimestamps.map((timestamp) => ({
      ...timestamp,
      source: 'manual',
    }));
    expect(accountContextSchema.safeParse(complete).success).toBe(true);
    complete.characters[0].sources = ['public_showcase'];
    expect(accountContextSchema.safeParse(complete).success).toBe(false);
  });
});
