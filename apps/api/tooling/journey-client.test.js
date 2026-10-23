import { createRequire } from 'node:module';

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = webRequire('react');
const { renderToStaticMarkup } = webRequire('react-dom/server');
const { MemoryRouter } = webRequire('react-router-dom');
const { QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let api, session, cache, store, Navigation, Roster, Inventory, Profile;
const clients = [];
beforeAll(async () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {}, removeItem() {} });
  api = await import('../../web/src/lib/api.ts');
  session = await import('../../web/src/lib/account-session.ts');
  cache = await import('../../web/src/lib/account-cache.ts');
  store = (await import('../../web/src/stores/auth.store.ts')).useAuthStore;
  Navigation = (await import('../../web/src/components/CompanionLayout.tsx')).CompanionNavigation;
  Roster = (await import('../../web/src/pages/RosterPage.tsx')).default;
  Inventory = (await import('../../web/src/pages/InventoryPage.tsx')).default;
  Profile = (await import('../../web/src/pages/ProfilePage.tsx')).default;
});
afterEach(() => {
  clients.splice(0).forEach((client) => client.clear());
  vi.unstubAllGlobals();
});
function client() {
  store.setState({ token: 'c5-owner-a' });
  const result = cache.createAccountQueryClient();
  clients.push(result);
  return result;
}
function render(Component, route, queryClient = client()) {
  return renderToStaticMarkup(
    h(
      QueryClientProvider,
      { client: queryClient },
      h(MemoryRouter, { initialEntries: [route] }, h(Component)),
    ),
  );
}
const character = (key) => ({
  id: key,
  characterKey: key,
  level: 80,
  ascension: 5,
  constellation: 0,
  talentNormal: 1,
  talentSkill: 1,
  talentBurst: 1,
  equippedWeapon: null,
});
function rosterClient() {
  const result = client();
  result.setQueryData(['genshin', 'characters'], {
    characters: [character('HuTao'), character('Opaque / 字')],
    total: 2,
  });
  result.setQueryData(
    ['genshin', 'focus'],
    [{ characterKey: 'HuTao', focused: true, revision: 1 }],
  );
  result.setQueryData(['genshin', 'import-status'], { sections: [] });
  return result;
}
describe('C5 real navigation, rendering and transport regressions', () => {
  it.each([
    ['/', 'Today'],
    ['/roster/Opaque%20%2F%20%E5%AD%97', 'Characters'],
    ['/planner?tab=farming&goal=opaque%2Fid&status=paused', 'Planner'],
    ['/profile', 'Settings &amp; profile'],
    ['/connect', 'Account'],
    ['/characters/Albedo', 'Characters'],
  ])(
    'marks the correct destination for %s and preserves supported destinations',
    (route, label) => {
      const html = render(Navigation, route);
      expect(html).toMatch(
        new RegExp(String.raw`aria-current="page"[^>]*>(?:(?!</a>)[\s\S])*?${label}<`),
      );
      for (const path of ['/connect', '/inventory', '/profile', '/endgame'])
        expect(html).toContain(`href="${path}"`);
      expect(html).toContain('href="#companion-content"');
      expect(html).not.toContain('href="/simulators"');
      expect(html).not.toContain('<main');
    },
  );
  it('combines persisted URL search and focus without changing opaque character links', () => {
    const qc = rosterClient();
    const focused = render(Roster, '/roster?q=hu%20tao&focus=true', qc);
    expect(focused).toContain('href="/roster/HuTao"');
    expect(focused).not.toContain('href="/roster/Opaque');
    const opaque = render(Roster, '/roster?q=opaque', qc);
    expect(opaque).toContain('href="/roster/Opaque%20%2F%20%E5%AD%97"');
    expect(opaque).not.toContain('href="/roster/HuTao"');
  });
  it('distinguishes a no-match filter from an account with no recorded characters', () => {
    const qc = rosterClient();
    expect(render(Roster, '/roster?q=missing&focus=true', qc)).toContain('No characters match');
    expect(render(Roster, '/roster?q=missing&focus=true', qc)).not.toContain(
      'No character observations yet',
    );
    qc.setQueryData(['genshin', 'characters'], { characters: [], total: 0 });
    expect(render(Roster, '/roster', qc)).toContain('Create a goal');
  });
  it('renders labeled retained roster records after the actual query cache receives a failure', async () => {
    const qc = rosterClient();
    await qc
      .fetchQuery({
        queryKey: ['genshin', 'characters'],
        retry: false,
        queryFn: () => Promise.reject(new Error('synthetic refresh failure')),
      })
      .catch(() => {});
    const html = render(Roster, '/roster', qc);
    expect(html).toContain('last confirmed character records');
    expect(html).toContain('href="/roster/HuTao"');
    expect(html).not.toContain('No character observations yet');
  });
  it('keeps an unavailable inventory count unknown, instead of rendering numeric zero', async () => {
    const qc = client();
    for (const part of ['weapons', 'artifacts']) {
      qc.setQueryDefaults(['genshin', part], { retryOnMount: false });
      await qc
        .fetchQuery({
          queryKey: ['genshin', part],
          retry: false,
          queryFn: () => Promise.reject(new Error('synthetic failure')),
        })
        .catch(() => {});
    }
    const html = render(Inventory, '/inventory', qc);
    expect(html).toContain('Equipped weapons: unknown');
    expect(html).not.toContain('No weapons found');
  });
  it('profile recovery keeps confirmed owner details and existing settings routes', async () => {
    const qc = client();
    qc.setQueryData(['me'], {
      username: 'owner-a',
      email: 'a@test.invalid',
      id: 'a',
      createdAt: '2026-10-07',
    });
    await qc
      .fetchQuery({
        queryKey: ['me'],
        retry: false,
        queryFn: () => Promise.reject(new Error('offline')),
      })
      .catch(() => {});
    const html = render(Profile, '/profile', qc);
    expect(html).toContain('Last confirmed account details');
    expect(html).toContain('a@test.invalid');
    expect(html).toContain('/planner?tab=daily#routine-settings');
    expect(html).toContain('/#plan-choices');
  });
  it.each([
    'fetchImportStatus',
    'fetchGenshinRoster',
    'fetchGenshinWeapons',
    'fetchGenshinArtifacts',
    'fetchMaterialDelta',
    'fetchTodayDomains',
    'fetchEvents',
    'fetchNikkeRoster',
  ])('%s carries cancellation and rejects a delayed originating-owner response', async (name) => {
    client();
    let finish;
    const fetcher = vi.fn(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    vi.stubGlobal('fetch', fetcher);
    const controller = new AbortController();
    const reading = api[name](controller.signal);
    expect(fetcher.mock.calls[0][1].signal).toBe(controller.signal);
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe('Bearer c5-owner-a');
    store.setState({ token: 'c5-owner-b' });
    finish({ ok: true, json: async () => ({ success: true, data: ['owner-a-private'] }) });
    await expect(reading).rejects.toThrow('Session changed');
    expect(session.captureSession().token).toBe('c5-owner-b');
  });
});
