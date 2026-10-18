import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CharacterEquipmentView } from '../../web/src/components/CharacterEquipmentView.tsx';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');

let createAccountQueryClient;
let bindAccountCache;
let useAuthStore;
let fetchCharacterEquipment;
const cleanups = [];
beforeAll(async () => {
  const storage = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  });
  ({ createAccountQueryClient, bindAccountCache } =
    await import('../../web/src/lib/account-cache.ts'));
  ({ useAuthStore } = await import('../../web/src/stores/auth.store.ts'));
  ({ fetchCharacterEquipment } = await import('../../web/src/lib/api.ts'));
});
afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  vi.unstubAllGlobals();
});
const receipt = {
  status: 'unknown',
  importedAt: null,
  source: null,
  entryCount: null,
  scope: 'replacement_section',
};
const slots = ['flower', 'plume', 'sands', 'goblet', 'circlet'];
function fixture() {
  return {
    contractVersion: 1,
    character: {
      characterKey: 'OpaqueCharacter',
      level: 80,
      ascension: 6,
      constellation: 3,
      talents: { normal: 9, skill: 12, burst: 15 },
      talentBasis: 'stored_convention_unknown',
    },
    provenance: {
      characters: { ...receipt, scope: 'merged_entries' },
      weapons: receipt,
      artifacts: receipt,
    },
    weapon: { state: 'unknown', item: null, reason: 'provenance_unknown' },
    artifacts: Object.fromEntries(
      slots.map((slot) => [slot, { state: 'unknown', item: null, reason: 'provenance_unknown' }]),
    ),
    unrecognizedSlots: [],
    artifactRelationsConsistent: true,
  };
}
const render = (data) => renderToStaticMarkup(createElement(CharacterEquipmentView, { data }));
describe('C3a actual web presentation and session cache', () => {
  it('renders five explicit unknown slots and preserves stored talent semantics', () => {
    const html = render(fixture());
    for (const slot of slots) expect(html).toContain(`</span>${slot}</h3>`);
    expect(html).toContain('Base versus constellation-adjusted');
    expect(html).toContain('Assignment unknown');
    expect(html).not.toContain('No weapon equipped');
    expect(html).toContain('cannot tell whether this slot is empty or equipped in-game');
  });
  it('shows recorded-empty input as unrecorded assignments and section receipt, never known-empty', () => {
    const data = fixture();
    data.provenance.artifacts = {
      ...receipt,
      status: 'imported',
      entryCount: 0,
      importedAt: '2026-10-02T12:00:00Z',
      source: 'Synthetic empty section',
    };
    for (const slot of slots)
      data.artifacts[slot] = { state: 'unrecorded', item: null, reason: 'no_recorded_assignment' };
    const html = render(data);
    expect(html).toContain('No assignment in recorded data');
    expect(html).toContain('Synthetic empty section');
    expect(html).toContain('does not prove a complete game scan');
    expect(html).not.toMatch(/confirmed unequipped|Known empty/);
  });
  it('shows opaque stored values without main-stat estimates, set bonuses or quality scores', () => {
    const data = fixture();
    data.artifacts.flower = {
      state: 'recorded_assigned',
      item: {
        setKey: 'UnknownSet',
        slotKey: 'flower',
        level: 20,
        rarity: 5,
        mainStatKey: 'unknown_main_',
        mainStatValue: null,
        subStats: [{ key: 'opaque_substat', value: 0 }],
        locked: false,
      },
    };
    const html = render(data);
    expect(html).toContain('unknown_main_');
    expect(html).toContain('opaque_substat');
    expect(html).toContain('Amount unavailable');
    expect(html).toContain('1 recorded piece');
    expect(html).not.toMatch(/AES|efficiency score|damage score|bonus activated/);
  });
  it('uses encoded natural keys, bearer identity and query cancellation in the actual API client', async () => {
    useAuthStore.setState({ token: 'synthetic-session-a' });
    const fetcher = vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ success: true, data: fixture() }) });
    vi.stubGlobal('fetch', fetcher);
    const controller = new AbortController();
    await fetchCharacterEquipment('Legacy / ? 字', controller.signal);
    expect(fetcher.mock.calls[0][0]).toContain(
      '/characters/Legacy%20%2F%20%3F%20%E5%AD%97/equipment',
    );
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer synthetic-session-a');
    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
  });
  it('success invalidation refreshes detail under the existing genshin prefix; a failure retains data', async () => {
    const client = createAccountQueryClient();
    cleanups.push(() => client.clear());
    const key = ['genshin', 'character-equipment', 'HuTao'];
    client.setQueryData(key, fixture());
    await client.invalidateQueries({ queryKey: ['genshin'] });
    expect(client.getQueryState(key).isInvalidated).toBe(true);
    await expect(
      client.fetchQuery({
        queryKey: key,
        queryFn: () => Promise.reject(new Error('failed read')),
        retry: false,
      }),
    ).rejects.toThrow('failed read');
    expect(client.getQueryData(key)).toEqual(fixture());
  });
  it('clears detail and blocks a delayed old-session response from entering a new client', async () => {
    useAuthStore.setState({ token: 'session-a' });
    const client = createAccountQueryClient();
    const unsubscribe = bindAccountCache(client);
    cleanups.push(() => {
      unsubscribe();
      client.clear();
    });
    let finish;
    const delayed = new Promise((resolve) => {
      finish = resolve;
    });
    const key = ['genshin', 'character-equipment', 'HuTao'];
    const oldRequest = client
      .fetchQuery({ queryKey: key, queryFn: () => delayed })
      .catch(() => undefined);
    useAuthStore.setState({ token: 'session-b' });
    expect(client.getQueryCache().getAll()).toHaveLength(0);
    const next = createAccountQueryClient();
    cleanups.push(() => next.clear());
    next.setQueryData(key, { character: 'account-b' });
    finish(fixture());
    await oldRequest;
    expect(next.getQueryData(key)).toEqual({ character: 'account-b' });
  });
});
