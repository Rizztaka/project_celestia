import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import {
  parseUidTeamFile,
  readUidTeams,
  serializeUidTeams,
  writeUidTeams,
} from '../../web/src/lib/build-analysis/teams-storage.ts';

const uid = '800000001';
function team(id = 'team-one', target = uid) {
  return {
    version: 1,
    uid: target,
    id,
    name: 'Synthetic lineup',
    members: [
      { characterKey: '10000089:8901', roleId: 'party_buff' },
      { characterKey: '10000043:4301', roleId: 'reaction_trigger' },
      { characterKey: '10000114:11401', roleId: 'on_field_damage' },
      { characterKey: '10000103:10301', roleId: 'healing_support' },
    ],
  };
}
beforeEach(() => vi.stubGlobal('indexedDB', new IDBFactory()));
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it('saves, reloads, renames, duplicates and deletes only within the UID', async () => {
  await writeUidTeams(uid, [team()]);
  await writeUidTeams('800000002', [team('team-one', '800000002')]);
  await writeUidTeams(uid, [{ ...team(), name: 'Renamed' }, team('copy')]);
  expect((await readUidTeams(uid)).map((t) => t.name)).toEqual(['Renamed', 'Synthetic lineup']);
  await writeUidTeams(uid, [], 'team-one');
  expect((await readUidTeams(uid)).map((t) => t.id)).toEqual(['copy']);
  expect(await readUidTeams('800000002')).toEqual([team('team-one', '800000002')]);
});
it('round trips validated exports and refuses cross-UID attachment', async () => {
  expect(parseUidTeamFile(uid, serializeUidTeams(uid, [team()]))).toEqual([team()]);
  expect(() => parseUidTeamFile('800000002', serializeUidTeams(uid, [team()]))).toThrow(
    'different UID',
  );
});
it('rejects malformed, oversized, duplicate and impossible imports before any write', async () => {
  const bad = [
    { ...team(), members: team().members.slice(0, 3) },
    { ...team(), name: '' },
    { ...team(), members: [team().members[0], ...team().members.slice(0, 3)] },
    {
      ...team(),
      members: [{ ...team().members[0], roleId: 'invented' }, ...team().members.slice(1)],
    },
  ];
  for (const t of bad)
    expect(() => parseUidTeamFile(uid, JSON.stringify({ version: 1, uid, teams: [t] }))).toThrow();
  expect(() => parseUidTeamFile(uid, ' '.repeat(200001))).toThrow('200 KB');
  expect(() => parseUidTeamFile(uid, serializeUidTeams(uid, [team(), team()]))).toThrow();
  expect(await readUidTeams(uid)).toEqual([]);
});
it('atomically rejects conflicting imported IDs, retaining existing teams', async () => {
  await writeUidTeams(uid, [team()]);
  await expect(
    writeUidTeams(uid, [{ ...team(), name: 'Overwritten' }, team('new')], undefined, true),
  ).rejects.toThrow('conflicts');
  expect(await readUidTeams(uid)).toEqual([team()]);
  await writeUidTeams(uid, [team()], undefined, true);
  expect(await readUidTeams(uid)).toEqual([team()]);
});
it('serializes concurrent writes and rejects a count overflow without losing records', async () => {
  await Promise.all([writeUidTeams(uid, [team('one')]), writeUidTeams(uid, [team('two')])]);
  expect(await readUidTeams(uid)).toHaveLength(2);
  await writeUidTeams(
    uid,
    Array.from({ length: 98 }, (_, i) => team(`more-${i}`)),
  );
  await expect(writeUidTeams(uid, [team('overflow')])).rejects.toThrow('100 teams');
  expect(await readUidTeams(uid)).toHaveLength(100);
});
it('rolls back every write on a storage error', async () => {
  await writeUidTeams(uid, [team()]);
  const put = IDBObjectStore.prototype.put;
  vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (value, ...rest) {
    if (value.id === 'fail') throw new Error('disk full');
    return put.call(this, value, ...rest);
  });
  await expect(writeUidTeams(uid, [team('first'), team('fail')])).rejects.toThrow('disk full');
  expect(await readUidTeams(uid)).toEqual([team()]);
});
it('preserves corrupt stored rows and refuses subsequent mutation', async () => {
  await writeUidTeams(uid, [team()]);
  const db = await new Promise((resolve, reject) => {
    const r = globalThis.indexedDB.open('celestia-public-teams-v1', 1);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  const corrupt = { ...team('corrupt'), name: null };
  await new Promise((resolve, reject) => {
    const tx = db.transaction('teams', 'readwrite');
    tx.objectStore('teams').put(corrupt);
    tx.oncomplete = resolve;
    tx.onabort = () => reject(tx.error);
  });
  await expect(readUidTeams(uid)).rejects.toThrow('unreadable');
  await expect(writeUidTeams(uid, [team('new')])).rejects.toThrow('Unreadable');
  const stored = await new Promise((resolve) => {
    const r = db.transaction('teams', 'readonly').objectStore('teams').get([uid, 'corrupt']);
    r.onsuccess = () => resolve(r.result);
  });
  expect(stored).toEqual(corrupt);
  db.close();
});
it('reports unavailable browser storage', async () => {
  vi.stubGlobal('indexedDB', undefined);
  await expect(readUidTeams(uid)).rejects.toThrow('unavailable');
});
