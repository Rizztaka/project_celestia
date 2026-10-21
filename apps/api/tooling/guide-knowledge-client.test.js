import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

vi.mock('@/core/db/prisma.js', () => ({ prisma: {} }));
const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const { QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let clientApi, cache, sessions, store, Card, service;
const clients = [];
const receipt = {
  status: 'unknown',
  importedAt: null,
  source: null,
  entryCount: null,
  scope: 'replacement_section',
};
const equipment = () => ({
  contractVersion: 1,
  character: { characterKey: 'Keqing' },
  weapon: { state: 'recorded_assigned', item: { weaponKey: 'HarbingerOfDawn', refinement: 1 } },
  provenance: { characters: { ...receipt, scope: 'merged_entries' }, weapons: receipt },
});
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  clientApi = await import('../../web/src/lib/guide-knowledge.ts');
  cache = await import('../../web/src/lib/account-cache.ts');
  sessions = await import('../../web/src/lib/account-session.ts');
  store = (await import('../../web/src/stores/auth.store.ts')).useAuthStore;
  Card = (await import('../../web/src/components/GuideAdviceCard.tsx')).GuideAdviceCard;
  service = (
    await import('../src/games/genshin/intelligence/guide-knowledge/guide-knowledge.service.ts')
  ).GuideKnowledgeService;
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});
function client() {
  const value = cache.createAccountQueryClient();
  clients.push(value);
  store.setState({ token: 'k1-a' });
  return value;
}
const scenario = { contractVersion: '1', hp: 'unknown' };
const response = async (snapshot = equipment(), assumptions = scenario) =>
  new service({ read: async () => snapshot }).read(
    'owner',
    snapshot.character.characterKey,
    assumptions,
  );
describe('K1 real client cache and rendering', () => {
  it('uses scenario, relevant snapshot, session and Genshin invalidation identity', () => {
    const snapshot = equipment();
    const session = sessions.captureSession();
    const before = clientApi.guideQueryOptions(snapshot, scenario, session).queryKey;
    expect(before[0]).toBe('genshin');
    expect(
      clientApi.guideQueryOptions(snapshot, { ...scenario, hp: 'above_90' }, session).queryKey,
    ).not.toEqual(before);
    snapshot.weapon.item.refinement = 5;
    expect(clientApi.guideQueryOptions(snapshot, scenario, session).queryKey).not.toEqual(before);
    expect(
      clientApi.guideQueryOptions(equipment(), scenario, {
        ...session,
        generation: session.generation + 1,
      }).queryKey,
    ).not.toEqual(before);
  });
  it('fetches encoded strict GET with cancellation and validates response', async () => {
    client();
    const data = await response();
    const snapshot = equipment();
    snapshot.character.characterKey = 'Opaque / 字';
    const fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true, data }),
      status: 200,
    }));
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const options = clientApi.guideQueryOptions(
      snapshot,
      { ...scenario, example: 'harbinger', refinement: '1' },
      sessions.captureSession(),
    );
    await options.queryFn({ signal: controller.signal });
    expect(fetch.mock.calls[0][0]).toContain(
      'Opaque%20%2F%20%E5%AD%97/guide-advice?contractVersion=1&hp=unknown&example=harbinger&refinement=1',
    );
    expect(fetch.mock.calls[0][1].signal).toBe(controller.signal);
  });
  it('keeps failed refresh data only in its original scenario; cancels on session change and invalidates imports', async () => {
    const queryClient = client();
    const snapshot = equipment();
    const original = sessions.captureSession();
    const options = clientApi.guideQueryOptions(snapshot, scenario, original);
    const data = await response();
    queryClient.setQueryData(options.queryKey, data);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('synthetic failure');
      }),
    );
    await expect(queryClient.fetchQuery(options)).rejects.toThrow('synthetic failure');
    expect(queryClient.getQueryData(options.queryKey)).toEqual(data);
    const other = clientApi.guideQueryOptions(snapshot, { ...scenario, hp: 'above_90' }, original);
    expect(queryClient.getQueryData(other.queryKey)).toBeUndefined();
    await cache.invalidateIntentQueries(queryClient);
    expect(queryClient.getQueryState(options.queryKey).isInvalidated).toBe(true);
    const unsubscribe = cache.bindAccountCache(queryClient);
    try {
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
      const pending = options.queryFn({ signal: new AbortController().signal });
      store.setState((state) => ({ token: 'k1-b', sessionEpoch: state.sessionEpoch + 1 }));
      deliver({ ok: true, status: 200, json: async () => ({ success: true, data }) });
      await expect(pending).rejects.toThrow('Session changed');
      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    } finally {
      unsubscribe();
    }
  });
  it('renders keyboard-native assumptions, original explanations, expandable evidence and honest unsupported state', async () => {
    const queryClient = client();
    const snapshot = equipment();
    const options = clientApi.guideQueryOptions(snapshot, scenario, sessions.captureSession());
    queryClient.setQueryData(options.queryKey, await response());
    const render = () =>
      renderToStaticMarkup(
        h(
          QueryClientProvider,
          { client: queryClient },
          h(Card, { equipment: snapshot, onRefresh() {} }),
        ),
      );
    const html = render();
    for (const text of [
      'HP assumption (not live HP)',
      'Reset assumptions',
      '<select',
      '<details',
      '<summary',
      '14 percentage points',
      'Unknown HP / uptime',
      'Evidence and coverage',
    ])
      expect(html).toContain(text);
    snapshot.character.characterKey = 'HuTao';
    const unsupported = clientApi.guideQueryOptions(snapshot, scenario, sessions.captureSession());
    queryClient.setQueryData(unsupported.queryKey, await response(snapshot));
    expect(render()).toContain('Tailored guidance unavailable');
    expect(render()).not.toContain('<select');
  });
});
