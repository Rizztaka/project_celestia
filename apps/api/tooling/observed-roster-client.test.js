/* global indexedDB */
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { syntheticShowcase } from '../src/games/genshin/showcase/showcase.fixtures.js';
import { parseShowcase } from '../src/games/genshin/showcase/showcase.parser.js';

let history;
const uid = '800000001';
const otherUid = '800000002';
const first = '2026-10-24T10:00:00.000Z';
const second = '2026-10-24T10:02:00.000Z';
function result(target = uid, time = first, ids = [10000046, 10000114]) {
  const raw = syntheticShowcase(target);
  raw.avatarInfoList = ids.map((avatarId) => ({
    avatarId,
    propMap: { 4001: { val: time === first ? '80' : '90' } },
    fightPropMap: {},
  }));
  return {
    source: 'enka.network',
    delivery: 'fetched',
    fetchedAt: time,
    nextRefreshAt: time,
    issue: null,
    snapshot: parseShowcase(target, raw).snapshot,
  };
}
beforeAll(async () => {
  history = await import('../../web/src/lib/observed-roster.ts');
});
beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('upserts returned characters and retains missing characters through later and empty showcases', async () => {
  await history.recordObservedRoster(uid, result());
  const saved = await history.recordObservedRoster(uid, result(uid, second, [10000046, 10000021]));
  expect(saved.records.map((r) => r.character.id).sort()).toEqual([10000021, 10000046, 10000114]);
  expect(saved.records.find((r) => r.character.id === 10000046)).toMatchObject({
    observedAt: second,
    character: { level: 90 },
  });
  expect(saved.records.find((r) => r.character.id === 10000114)).toMatchObject({
    observedAt: first,
    character: { level: 80 },
  });
  const empty = await history.recordObservedRoster(uid, result(uid, second, []));
  expect(empty).toEqual(saved);
});
it('persists across database connections, isolates UIDs and never merges one UID into another', async () => {
  await history.recordObservedRoster(uid, result(uid, first));
  await history.recordObservedRoster(otherUid, result(otherUid, second, [10000046]));
  expect((await history.readObservedRoster(uid)).records).toHaveLength(2);
  expect((await history.readObservedRoster(otherUid)).records).toMatchObject([
    { uid: otherUid, character: { level: 90 } },
  ]);
  expect(
    (await history.readObservedRoster(uid)).records.every(
      (r) => r.uid === uid && r.character.level === 80,
    ),
  ).toBe(true);
});
it('ignores failures, stale results, foreign UIDs and responses without a successful retrieval time', async () => {
  const original = await history.recordObservedRoster(uid, result());
  for (const incoming of [
    {
      ...result(uid, second, []),
      issue: { code: 'ENKA_503', status: 503, message: 'Unavailable' },
      delivery: 'stale',
    },
    { ...result(uid, second), delivery: 'stale' },
    { ...result(uid, second), fetchedAt: null },
    result(otherUid, second),
  ])
    expect(await history.recordObservedRoster(uid, incoming)).toEqual(original);
});
it('deduplicates cached data and prevents older or concurrent requests from reverting newer builds', async () => {
  await history.recordObservedRoster(uid, result(uid, second, [10000046]));
  await history.recordObservedRoster(uid, result(uid, first, [10000046]));
  await Promise.all([
    history.recordObservedRoster(uid, result(uid, second, [10000046, 10000021])),
    history.recordObservedRoster(uid, result(uid, first, [10000046, 10000114])),
  ]);
  const saved = await history.recordObservedRoster(uid, {
    ...result(uid, second, [10000046]),
    delivery: 'cached',
  });
  expect(saved.records).toHaveLength(3);
  expect(saved.records.find((r) => r.character.id === 10000046)).toMatchObject({
    observedAt: second,
    character: { level: 90 },
  });
});
it('rolls back the complete refresh on storage failure and preserves all earlier observations', async () => {
  const original = await history.recordObservedRoster(uid, result());
  const put = IDBObjectStore.prototype.put;
  const failure = vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (...args) {
    const request = put.apply(this, args);
    this.transaction.abort();
    return request;
  });
  await expect(
    history.recordObservedRoster(uid, result(uid, second, [10000046, 10000021])),
  ).rejects.toThrow();
  failure.mockRestore();
  expect(await history.readObservedRoster(uid)).toEqual(original);
});
it('reports denied storage without deleting previously saved records', async () => {
  const original = await history.recordObservedRoster(uid, result());
  const denied = vi.spyOn(indexedDB, 'open').mockImplementation(() => {
    throw new Error('Synthetic storage denied');
  });
  await expect(history.recordObservedRoster(uid, result(uid, second))).rejects.toThrow('denied');
  denied.mockRestore();
  expect(await history.readObservedRoster(uid)).toEqual(original);
});

it('preserves equal-time build conflicts across reloads and resolves them only with a newer observation', async () => {
  const initial = result(uid, first, [10000046]);
  const conflicting = structuredClone(initial);
  conflicting.snapshot.characters[0].level = 1;
  await history.recordObservedRoster(uid, initial);
  await history.recordObservedRoster(uid, conflicting);
  const reloaded = await history.readObservedRoster(uid);
  expect(reloaded.records).toHaveLength(1);
  expect(reloaded.records[0]).toMatchObject({ conflicted: true, character: { level: 80 } });
  await history.recordObservedRoster(uid, initial);
  expect((await history.readObservedRoster(uid)).records[0].conflicted).toBe(true);
  const { publicAccountContext } = await import('../../web/src/lib/account-context.calculator.ts');
  expect(publicAccountContext(uid, reloaded.records, Date.parse(second)).records).toEqual([]);
  const refreshed = await history.recordObservedRoster(uid, result(uid, second, [10000046]));
  expect(refreshed.records[0].conflicted).toBeUndefined();
  expect(refreshed.records[0].character.level).toBe(90);
});

it('keeps a cache/showcase tie ambiguous while separating different UIDs', () => {
  const firstRecord = history.observationsFromResult(uid, result(uid, first, [10000046]))[0];
  const conflicting = structuredClone(firstRecord);
  conflicting.character.level = 1;
  const merged = history.mergeObservations([firstRecord], [conflicting]);
  expect(merged).toHaveLength(1);
  expect(merged[0].conflicted).toBe(true);
  expect(history.mergeObservations(merged, [firstRecord])[0].conflicted).toBe(true);
  const foreign = { ...firstRecord, uid: otherUid };
  expect(history.mergeObservations([firstRecord], [foreign])).toHaveLength(2);
});

it('does not let a future-dated refresh replace a valid retained build', async () => {
  const now = Date.parse(second);
  const original = await history.recordObservedRoster(uid, result(uid, first, [10000046]), now);
  const future = result(uid, '2027-01-01T00:00:00.000Z', [10000046]);
  expect(history.observationsFromResult(uid, future, now)).toEqual([]);
  expect(await history.recordObservedRoster(uid, future, now)).toEqual(original);
  const futureRecord = { ...original.records[0], observedAt: future.fetchedAt };
  expect(history.mergeObservations([futureRecord], original.records, now)).toEqual(
    original.records,
  );
});
