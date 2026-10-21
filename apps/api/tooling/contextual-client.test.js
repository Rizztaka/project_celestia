import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const { QueryClientProvider, QueryObserver, focusManager, onlineManager } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let clientApi,
  releaseClient,
  loadedMetadata,
  activeClient,
  cache,
  sessions,
  store,
  Panel,
  Router,
  service;
const clients = [];

const receipt = {
  status: 'unknown',
  importedAt: null,
  source: null,
  entryCount: null,
  scope: 'replacement_section',
};
const equipment = (key = 'Keqing') => ({
  contractVersion: 1,
  character: {
    characterKey: key,
    level: 80,
    ascension: 6,
    constellation: 0,
    talents: { normal: 1, skill: 8, burst: 6 },
    talentBasis: 'stored_convention_unknown',
  },
  weapon: { state: 'unknown', item: null, reason: 'provenance_unknown' },
  artifacts: Object.fromEntries(
    ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slot) => [
      slot,
      { state: 'unknown', item: null, reason: 'provenance_unknown' },
    ]),
  ),
  artifactRelationsConsistent: true,
  unrecognizedSlots: [],
  provenance: {
    characters: { ...receipt, scope: 'merged_entries' },
    weapons: receipt,
    artifacts: receipt,
  },
});
const roster = [
  { characterKey: 'Keqing', ascension: 6 },
  { characterKey: 'Fischl', ascension: 6 },
  { characterKey: 'KaedeharaKazuha', ascension: 6 },
];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  const legacy = await import('../../web/src/lib/contextual-advice.ts');
  releaseClient = await import('../../web/src/lib/contextual-release-client.ts');
  cache = await import('../../web/src/lib/account-cache.ts');
  sessions = await import('../../web/src/lib/account-session.ts');
  store = (await import('../../web/src/stores/auth.store.ts')).useAuthStore;
  Panel = (await import('../../web/src/components/ContextualAdvicePanel.tsx'))
    .ContextualAdvicePanel;
  Router = webRequire('react-router-dom').MemoryRouter;
  service = (
    await import('../src/games/genshin/intelligence/guide-knowledge/contextual.service.ts')
  ).ContextualAdviceService;
  loadedMetadata = new service({ read: async () => [] }).metadata();
  // Same retained K2 cases, now through the real V3 client with authenticated metadata.
  clientApi = {
    ...legacy,
    ...releaseClient,
    contextualQueryOptions: (...args) => {
      const options = releaseClient.contextualQueryOptions(...args, loadedMetadata.release, 1);
      return {
        ...options,
        queryFn: ({ signal, client = activeClient }) => options.queryFn({ signal, client }),
      };
    },
  };
});
afterEach(() => {
  clients.splice(0).forEach((c) => c.clear());
  vi.unstubAllGlobals();
});
function client() {
  const c = cache.createAccountQueryClient();
  clients.push(c);
  store.setState({ token: 'k2-a' });
  activeClient = c;
  seedRelease(c);
  return c;
}
function seedRelease(c) {
  const session = sessions.captureSession();
  c.setQueryData(releaseClient.contextualReleaseKey(session), loadedMetadata);
  c.setQueryData(releaseClient.contextualSelectionKey(session), {
    release: loadedMetadata.release,
    revision: 1,
    rejected: false,
    refreshAttempted: false,
    alignedQueries: [],
  });
}
const response = async (snapshot = equipment(), scenario = clientApi.defaultContextualScenario()) =>
  new service({
    read: async (_id, keys) =>
      keys.map((key) => (key === snapshot.character.characterKey ? snapshot : equipment(key))),
  }).readV3('owner', snapshot.character.characterKey, {
    ...scenario,
    ...(scenario.team ? { team: JSON.stringify(scenario.team) } : {}),
  });
function renderPanel(queryClient, snapshot) {
  return renderToStaticMarkup(
    h(
      QueryClientProvider,
      { client: queryClient },
      h(Router, null, h(Panel, { equipment: snapshot, onRefresh() {} })),
    ),
  );
}
async function cachedPanel() {
  const queryClient = client(),
    snapshot = equipment(),
    scenario = clientApi.defaultContextualScenario();
  const options = clientApi.contextualQueryOptions(
    snapshot,
    scenario,
    sessions.captureSession(),
    roster,
  );
  const data = await response(snapshot);
  queryClient.setQueryData(['genshin', 'characters'], { characters: roster, total: 3 });
  queryClient.setQueryData(options.queryKey, data);
  return { queryClient, snapshot, scenario, options, data };
}
function serve(data) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data }) })),
  );
}
describe('K2 real client query/cache/rendering boundary', () => {
  it('keeps rejected observation cards hidden through pending, transport, focus and reconnect retries', async () => {
    const { queryClient: c, snapshot, options } = await cachedPanel();
    const observer = new QueryObserver(c, { ...options, staleTime: Infinity });
    c.mount();
    const unsubscribe = observer.subscribe(() => {});
    try {
      const next = structuredClone(snapshot);
      next.character.talents.skill = 9;
      serve(await response(next));
      await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(
        clientApi.ContextualSnapshotChanged,
      );
      expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
      let deliver;
      vi.stubGlobal(
        'fetch',
        vi.fn(
          () =>
            new Promise((resolve) => {
              deliver = resolve;
            }),
        ),
      );
      const pending = c.fetchQuery(options);
      expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
      deliver(Promise.reject(new Error('correction transport unavailable')));
      await expect(pending).rejects.toThrow('correction transport unavailable');
      let html = renderPanel(c, snapshot);
      expect(html).not.toContain('Choose an ability-use role');
      expect(html).toContain('Refresh records and reset');
      expect(html).not.toContain('Showing previously loaded guidance');
      const fetch = vi.fn(async () => {
        throw new Error('correction transport unavailable');
      });
      vi.stubGlobal('fetch', fetch);
      await c.invalidateQueries({ queryKey: options.queryKey, exact: true, refetchType: 'none' });
      focusManager.setFocused(false);
      focusManager.setFocused(true);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
      await vi.waitFor(() => expect(c.isFetching()).toBe(0));
      expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
      onlineManager.setOnline(false);
      onlineManager.setOnline(true);
      await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
      await vi.waitFor(() => expect(c.isFetching()).toBe(0));
      html = renderPanel(c, snapshot);
      expect(html).not.toContain('Choose an ability-use role');
      expect(html).toContain('Refresh records and reset');
    } finally {
      unsubscribe();
      c.unmount();
      focusManager.setFocused(undefined);
      onlineManager.setOnline(true);
    }
  });
  it('keeps mismatch disposition across changed/reset assumptions and recovers with coherent parent records', async () => {
    const { queryClient: c, snapshot, scenario, options } = await cachedPanel();
    const roleOptions = clientApi.contextualQueryOptions(
      snapshot,
      { ...scenario, role: 'on_field' },
      sessions.captureSession(),
      roster,
    );
    serve(await response(snapshot, { ...scenario, role: 'on_field' }));
    await c.fetchQuery(roleOptions);
    const next = structuredClone(snapshot);
    next.character.talents.skill = 9;
    serve(await response(next));
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unavailable');
      }),
    );
    await expect(c.fetchQuery(roleOptions)).rejects.toThrow('unavailable');
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    const reset = clientApi.contextualQueryOptions(
      snapshot,
      clientApi.defaultContextualScenario(),
      sessions.captureSession(),
      roster,
    );
    await expect(c.fetchQuery(reset)).rejects.toThrow('unavailable');
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    const refreshed = clientApi.contextualQueryOptions(
      next,
      clientApi.defaultContextualScenario(),
      sessions.captureSession(),
      roster,
    );
    serve(await response(next));
    await c.fetchQuery(refreshed);
    expect(renderPanel(c, next)).toContain('Choose an ability-use role');
    expect(renderPanel(c, next)).not.toContain('Refresh records and reset');
  });
  it('recovers only freshly aligned scenarios within a rejected observation', async () => {
    const { queryClient: c, snapshot, scenario, options } = await cachedPanel();
    const roleOptions = clientApi.contextualQueryOptions(
      snapshot,
      { ...scenario, role: 'on_field' },
      sessions.captureSession(),
      roster,
    );
    serve(await response(snapshot, { ...scenario, role: 'on_field' }));
    await c.fetchQuery(roleOptions);
    const next = structuredClone(snapshot);
    next.character.talents.skill = 9;
    serve(await response(next));
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    serve(await response(snapshot, { ...scenario, role: 'on_field' }));
    await c.fetchQuery(roleOptions);
    // An aligned different scenario does not make this scenario's old cached success trustworthy.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('unavailable');
      }),
    );
    await expect(c.fetchQuery(options)).rejects.toThrow('unavailable');
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    serve(await response(snapshot));
    await c.fetchQuery(options);
    expect(renderPanel(c, snapshot)).toContain('Choose an ability-use role');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('ordinary unavailable after recovery');
      }),
    );
    await expect(c.fetchQuery(options)).rejects.toThrow('ordinary unavailable after recovery');
    expect(renderPanel(c, snapshot)).toContain('Choose an ability-use role');
    expect(renderPanel(c, snapshot)).toContain(
      'Showing previously loaded guidance for these assumptions and snapshot.',
    );
  });
  it('does not let a pre-mismatch in-flight validation reopen rejected guidance', async () => {
    const { queryClient: c, snapshot, scenario, options, data } = await cachedPanel();
    const roleOptions = clientApi.contextualQueryOptions(
      snapshot,
      { ...scenario, role: 'on_field' },
      sessions.captureSession(),
      roster,
    );
    let deliver;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            deliver = resolve;
          }),
      ),
    );
    const delayed = c.fetchQuery(roleOptions);
    const next = structuredClone(snapshot);
    next.character.talents.skill = 9;
    serve(await response(next));
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    deliver({ ok: true, status: 200, json: async () => ({ success: true, data }) });
    await expect(delayed).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
  });
  it('retains valid panel data on ordinary failures and isolates mismatch disposition on account switch', async () => {
    const { queryClient: c, snapshot, options } = await cachedPanel();
    const unsubscribe = cache.bindAccountCache(c);
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new Error('ordinary unavailable');
        }),
      );
      await expect(c.fetchQuery(options)).rejects.toThrow('ordinary unavailable');
      let html = renderPanel(c, snapshot);
      expect(html).toContain('Choose an ability-use role');
      expect(html).toContain(
        'Showing previously loaded guidance for these assumptions and snapshot.',
      );
      const next = structuredClone(snapshot);
      next.character.talents.skill = 9;
      serve(await response(next));
      await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(
        clientApi.ContextualSnapshotChanged,
      );
      expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
      store.setState((state) => ({ token: 'k2-b', sessionEpoch: state.sessionEpoch + 1 }));
      expect(c.getQueryData(options.queryKey)).toBeUndefined();
      const other = equipment();
      other.character.talents.skill = 4;
      c.setQueryData(['genshin', 'characters'], { characters: roster, total: 3 });
      seedRelease(c);
      const otherOptions = clientApi.contextualQueryOptions(
        other,
        clientApi.defaultContextualScenario(),
        sessions.captureSession(),
        roster,
      );
      const otherData = await response(other);
      serve(otherData);
      await c.fetchQuery(otherOptions);
      html = renderPanel(c, other);
      expect(html).toContain('Choose an ability-use role');
      expect(html).not.toContain('Refresh records and reset');
      expect(c.getQueryData(otherOptions.queryKey)).toEqual(otherData);
    } finally {
      unsubscribe();
    }
  });
  it('keys pack, scenario, normalized team, snapshot and session while ignoring unrelated levels', () => {
    client();
    const snapshot = equipment(),
      session = sessions.captureSession(),
      scenario = clientApi.defaultContextualScenario();
    const options = clientApi.contextualQueryOptions(snapshot, scenario, session, roster);
    expect(options.queryKey.slice(0, 3)).toEqual([
      'genshin',
      'guide-advice-v3',
      loadedMetadata.release,
    ]);
    expect(
      clientApi.contextualQueryOptions(snapshot, { ...scenario, role: 'on_field' }, session, roster)
        .queryKey,
    ).not.toEqual(options.queryKey);
    snapshot.character.level = 90;
    expect(clientApi.contextualQueryOptions(snapshot, scenario, session, roster).queryKey).toEqual(
      options.queryKey,
    );
    snapshot.character.talents.skill = 9;
    expect(
      clientApi.contextualQueryOptions(snapshot, scenario, session, roster).queryKey,
    ).not.toEqual(options.queryKey);
    const team = [
      { characterKey: 'Fischl', selection: 'owned' },
      { characterKey: 'KaedeharaKazuha', selection: 'hypothetical' },
    ];
    expect(
      clientApi.contextualQueryOptions(snapshot, { ...scenario, team }, session, roster).queryKey,
    ).toEqual(
      clientApi.contextualQueryOptions(
        snapshot,
        { ...scenario, team: [...team].reverse() },
        session,
        [...roster].reverse(),
      ).queryKey,
    );
    expect(
      clientApi.contextualQueryOptions(
        snapshot,
        scenario,
        { ...session, generation: session.generation + 1 },
        roster,
      ).queryKey,
    ).not.toEqual(options.queryKey);
  });
  it('fetches encoded V3 GET, preserves AbortSignal and validates the real response snapshot', async () => {
    client();
    const snapshot = equipment('Opaque / 字'),
      scenario = clientApi.defaultContextualScenario(),
      data = await response(snapshot);
    const fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data }),
    }));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const actual = await clientApi
      .contextualQueryOptions(snapshot, scenario, sessions.captureSession(), roster)
      .queryFn({ signal: controller.signal });
    expect(actual).toEqual(data);
    expect(fetch.mock.calls[0][0]).toContain(
      'Opaque%20%2F%20%E5%AD%97/guide-advice/v3?contractVersion=2',
    );
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { ...data, contractVersion: 1 } }),
    });
    await expect(
      clientApi
        .contextualQueryOptions(snapshot, scenario, sessions.captureSession(), roster)
        .queryFn({ signal: controller.signal }),
    ).rejects.toThrow();
  });
  it('fetches encoded V2 GET, preserves AbortSignal and validates the real response snapshot', async () => {
    client();
    const legacy = await import('../../web/src/lib/contextual-advice.ts');
    const snapshot = equipment('Opaque / 字'),
      scenario = legacy.defaultContextualScenario();
    const data = await new service({ read: async () => [snapshot] }).read(
      'owner',
      snapshot.character.characterKey,
      scenario,
    );
    serve(data);
    const controller = new AbortController();
    const options = legacy.contextualQueryOptions(
      snapshot,
      scenario,
      sessions.captureSession(),
      roster,
    );
    expect(await options.queryFn({ signal: controller.signal })).toEqual(data);
    expect(fetch.mock.calls[0][0]).toContain(
      'Opaque%20%2F%20%E5%AD%97/guide-advice/v2?contractVersion=2',
    );
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
    expect(options.queryKey.slice(0, 3)).toEqual(['genshin', 'guide-advice-v2', 'k2-1']);
  });
  it('rejects relevant current or owned-teammate mismatches instead of showing mixed evidence', async () => {
    client();
    const snapshot = equipment(),
      scenario = {
        ...clientApi.defaultContextualScenario(),
        team: [{ characterKey: 'Fischl', selection: 'owned' }],
      };
    const changed = equipment();
    changed.character.talents.skill = 9;
    const data = await response(changed, scenario);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data }) })),
    );
    await expect(
      clientApi
        .contextualQueryOptions(snapshot, scenario, sessions.captureSession(), roster)
        .queryFn({ signal: new AbortController().signal }),
    ).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    const original = await response(snapshot, scenario);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: original }),
      })),
    );
    await expect(
      clientApi
        .contextualQueryOptions(
          snapshot,
          scenario,
          sessions.captureSession(),
          roster.map((m) => (m.characterKey === 'Fischl' ? { ...m, ascension: 3 } : m)),
        )
        .queryFn({ signal: new AbortController().signal }),
    ).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
  });
  it('retains failed refresh data only for its original assumptions and invalidates successful imports', async () => {
    const c = client(),
      snapshot = equipment(),
      scenario = clientApi.defaultContextualScenario(),
      session = sessions.captureSession(),
      data = await response(snapshot);
    const options = clientApi.contextualQueryOptions(snapshot, scenario, session, roster);
    c.setQueryData(options.queryKey, data);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('synthetic K2 failure');
      }),
    );
    await expect(c.fetchQuery(options)).rejects.toThrow('synthetic K2 failure');
    expect(c.getQueryData(options.queryKey)).toEqual(data);
    expect(
      c.getQueryData(
        clientApi.contextualQueryOptions(snapshot, { ...scenario, burst: 'use' }, session, roster)
          .queryKey,
      ),
    ).toBeUndefined();
    await cache.invalidateIntentQueries(c);
    expect(c.getQueryState(options.queryKey).isInvalidated).toBe(true);
  });
  it('cancels outstanding queries and refuses delayed responses across account switches', async () => {
    const c = client(),
      snapshot = equipment(),
      scenario = clientApi.defaultContextualScenario(),
      session = sessions.captureSession(),
      data = await response(snapshot);
    const options = clientApi.contextualQueryOptions(snapshot, scenario, session, roster);
    const unsubscribe = cache.bindAccountCache(c);
    let deliver, signal;
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn((_url, init) => {
          signal = init.signal;
          return new Promise((resolve) => {
            deliver = resolve;
          });
        }),
      );
      const pending = c.fetchQuery(options);
      store.setState((state) => ({ token: 'k2-b', sessionEpoch: state.sessionEpoch + 1 }));
      expect(signal.aborted).toBe(true);
      deliver({ ok: true, status: 200, json: async () => ({ success: true, data }) });
      await expect(pending).rejects.toThrow();
      expect(c.getQueryData(options.queryKey)).toBeUndefined();
    } finally {
      unsubscribe();
    }
  });
  it('refuses a session change during asynchronous snapshot hashing', async () => {
    client();
    const snapshot = equipment(),
      scenario = clientApi.defaultContextualScenario();
    const data = await response(snapshot),
      session = sessions.captureSession();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data }) })),
    );
    let deliver;
    vi.stubGlobal('crypto', {
      subtle: {
        digest: () =>
          new Promise((resolve) => {
            deliver = resolve;
          }),
      },
    });
    const pending = clientApi
      .contextualQueryOptions(snapshot, scenario, session, roster)
      .queryFn({ signal: new AbortController().signal });
    await vi.waitFor(() => expect(deliver).toBeTypeOf('function'));
    store.setState((state) => ({ token: 'k2-b', sessionEpoch: state.sessionEpoch + 1 }));
    deliver(new Uint8Array(32).buffer);
    await expect(pending).rejects.toThrow('Session changed');
  });
  it('renders concise native controls, optional evidence, raw talent limits and unsupported browsing', async () => {
    const c = client(),
      snapshot = equipment(),
      scenario = clientApi.defaultContextualScenario();
    c.setQueryData(['genshin', 'characters'], { characters: roster, total: 3 });
    c.setQueryData(
      clientApi.contextualQueryOptions(snapshot, scenario, sessions.captureSession(), roster)
        .queryKey,
      await response(snapshot),
    );
    const render = () =>
      renderToStaticMarkup(
        h(
          QueryClientProvider,
          { client: c },
          h(Router, null, h(Panel, { equipment: snapshot, onRefresh() {} })),
        ),
      );
    const html = render();
    for (const text of [
      'Guidance for your scenario',
      'Ability-use role',
      'Burst plan',
      'Reset guidance assumptions',
      'Add temporary member',
      '<select',
      '<details',
      '<summary',
      'Why, conditions and sources',
      'Stored talent convention is unknown',
      '0–5',
      'Coverage and review limits',
    ])
      expect(html).toContain(text);
    expect(html).not.toContain('Neglected talent');
    snapshot.character.characterKey = 'HuTao';
    expect(render()).toContain('Tailored guidance unavailable');
  });
  it('quarantines a metadata/advice release race and bounds automatic metadata recovery', async () => {
    const { queryClient: c, snapshot, options, data } = await cachedPanel();
    const newer = structuredClone(data);
    newer.release.id = 'fixture-newer';
    newer.release.digest = '1'.repeat(64);
    let metadataCalls = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (url.includes('/guide-knowledge/release')) {
          metadataCalls++;
          throw Error('metadata transport failure');
        }
        return { ok: true, status: 200, json: async () => ({ success: true, data: newer }) };
      }),
    );
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(
      releaseClient.ContextualReleaseChanged,
    );
    expect(metadataCalls).toBe(1);
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(
      releaseClient.ContextualReleaseChanged,
    );
    expect(metadataCalls).toBe(1);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Error('advice unavailable');
      }),
    );
    await expect(c.fetchQuery(options)).rejects.toThrow('advice unavailable');
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    expect(renderPanel(c, snapshot)).toContain('Refresh release and retry');
  });
  it('partitions activation and exact rollback into fresh epochs and rejects delayed earlier advice', async () => {
    const { queryClient: c, snapshot, scenario, options, data } = await cachedPanel();
    const session = sessions.captureSession();
    let deliver;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise((resolve) => {
            deliver = resolve;
          }),
      ),
    );
    const delayed = c.fetchQuery(options);
    const newerMetadata = structuredClone(loadedMetadata);
    newerMetadata.release.id = 'fixture-newer';
    newerMetadata.release.digest = '2'.repeat(64);
    serve(newerMetadata);
    await c.fetchQuery(releaseClient.contextualReleaseQueryOptions(session));
    expect(c.getQueryData(releaseClient.contextualSelectionKey(session)).revision).toBe(2);
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    deliver({ ok: true, status: 200, json: async () => ({ success: true, data }) });
    await expect(delayed).rejects.toBeInstanceOf(releaseClient.ContextualReleaseChanged);
    serve(loadedMetadata);
    await c.fetchQuery(releaseClient.contextualReleaseQueryOptions(session));
    const selection = c.getQueryData(releaseClient.contextualSelectionKey(session));
    expect(selection.revision).toBe(3);
    const rolledBack = releaseClient.contextualQueryOptions(
      snapshot,
      scenario,
      session,
      roster,
      loadedMetadata.release,
      selection.revision,
    );
    expect(rolledBack.queryKey).not.toEqual(options.queryKey);
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    serve(data);
    await c.fetchQuery(rolledBack);
    expect(renderPanel(c, snapshot)).toContain('Choose an ability-use role');
  });
  it('preserves rejected records through release refresh, release switch, failure and scenario reset', async () => {
    const { queryClient: c, snapshot, scenario, options } = await cachedPanel();
    const changed = structuredClone(snapshot);
    changed.character.talents.skill = 10;
    serve(await response(changed));
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(clientApi.ContextualSnapshotChanged);
    const session = sessions.captureSession(),
      newerMetadata = structuredClone(loadedMetadata);
    newerMetadata.release.id = 'fixture-record-boundary';
    newerMetadata.release.digest = '3'.repeat(64);
    serve(newerMetadata);
    await c.fetchQuery(releaseClient.contextualReleaseQueryOptions(session));
    const nextOptions = releaseClient.contextualQueryOptions(
      snapshot,
      scenario,
      session,
      roster,
      newerMetadata.release,
      2,
    );
    c.setQueryData(nextOptions.queryKey, await response(snapshot)); // retained cards cannot release the independent guard
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Error('offline');
      }),
    );
    await expect(c.fetchQuery(nextOptions)).rejects.toThrow('offline');
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
    expect(renderPanel(c, snapshot)).toContain('Refresh records and reset');
    const guard = c.getQueryData(releaseClient.contextualRecordGuardKey(snapshot, session, roster));
    expect(guard.revision).toBe(1);
    expect(guard.alignedQueries).toEqual([]);
  });
  it('rejects same-label advice with a mismatched release content fingerprint', async () => {
    const { queryClient: c, snapshot, options, data } = await cachedPanel();
    const wrong = structuredClone(data);
    wrong.advice.fingerprint = '0'.repeat(64);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => ({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: url.includes('/guide-knowledge/release') ? loadedMetadata : wrong,
        }),
      })),
    );
    await expect(c.fetchQuery(options)).rejects.toBeInstanceOf(
      releaseClient.ContextualReleaseChanged,
    );
    expect(renderPanel(c, snapshot)).not.toContain('Choose an ability-use role');
  });
  it('cancels delayed release metadata across account switches without leaking identity', async () => {
    const c = client(),
      session = sessions.captureSession(),
      unsubscribe = cache.bindAccountCache(c);
    let deliver, signal;
    try {
      vi.stubGlobal(
        'fetch',
        vi.fn((_url, init) => {
          signal = init.signal;
          return new Promise((resolve) => {
            deliver = resolve;
          });
        }),
      );
      const pending = c.fetchQuery(releaseClient.contextualReleaseQueryOptions(session));
      store.setState((state) => ({ token: 'k3-other', sessionEpoch: state.sessionEpoch + 1 }));
      expect(signal.aborted).toBe(true);
      deliver({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: loadedMetadata }),
      });
      await expect(pending).rejects.toThrow();
      expect(c.getQueryData(releaseClient.contextualReleaseKey(session))).toBeUndefined();
      expect(
        c.getQueryData(releaseClient.contextualSelectionKey(sessions.captureSession())),
      ).toBeUndefined();
    } finally {
      unsubscribe();
    }
  });
  it('versions human-review payloads explicitly and never relabels them for strict legacy clients', async () => {
    const { contextualReleaseSnapshot } =
      await import('../src/games/genshin/intelligence/guide-knowledge/contextual.data.ts');
    const release = structuredClone(contextualReleaseSnapshot);
    const claim = release.pack.claims.find((claim) => claim.id === 'talent-role-unknown');
    claim.review = {
      ...claim.review,
      type: 'human',
      reviewer: 'Synthetic schema fixture, not actual human approval',
    };
    const engine = new service({ read: async () => [equipment()] }, release);
    const scenario = clientApi.defaultContextualScenario();
    const current = await engine.readV3('owner', 'Keqing', scenario);
    expect(current.advice.cards.find((card) => card.id === claim.id).review.type).toBe('human');
    const legacy = await engine.read('owner', 'Keqing', scenario);
    expect(legacy.cards.some((card) => card.id === claim.id)).toBe(false);
    expect(legacy.excluded.find((entry) => entry.id === claim.id).reason).toContain('version-3');
    expect(legacy.cards.every((card) => card.review.type === 'agent')).toBe(true);
  });
});
