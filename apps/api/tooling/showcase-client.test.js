import { createRequire } from 'node:module';

import { afterEach, beforeAll, expect, it, vi } from 'vitest';

import { syntheticShowcase } from '../src/games/genshin/showcase/showcase.fixtures.js';
import { parseShowcase } from '../src/games/genshin/showcase/showcase.parser.js';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const { createElement: h } = require('react');
const { renderToStaticMarkup: render } = require('react-dom/server');
const { MemoryRouter, Route, Routes } = require('react-router-dom');
const { QueryClient, QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let Snapshot, Status, Page, PublicPage, client, DialogContext;
const uid = '800000001';
const snapshot = parseShowcase(uid, syntheticShowcase()).snapshot;
const result = {
  source: 'enka.network',
  delivery: 'fetched',
  fetchedAt: '2026-10-23T18:00:00Z',
  nextRefreshAt: '2026-10-23T18:01:00Z',
  snapshot,
  issue: null,
};
beforeAll(async () => {
  ({ default: Snapshot, ShowcaseStatus: Status } =
    await import('../../web/src/components/ShowcaseSnapshot.tsx'));
  ({ default: Page } = await import('../../web/src/pages/ShowcasePage.tsx'));
  ({ default: PublicPage } = await import('../../web/src/pages/PublicShowcasePage.tsx'));
  client = await import('../../web/src/lib/showcase.ts');
  ({ UidDialogContext: DialogContext } = await import('../../web/src/lib/uid-dialog.ts'));
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('renders character bars as full-area links without inline build controls or content', () => {
  const html = render(h(MemoryRouter, null, h(Snapshot, { result, characterLinks: true })));
  for (const text of [
    'Synthetic Traveler',
    uid,
    'Hu Tao',
    'Staff of Homa',
    'Level 80',
    'Base talents 8 / 9 / 10',
    `href="/u/${uid}/character/10000046%3A4601"`,
  ])
    expect(html).toContain(text);
  expect(html).not.toContain('Talent 1');
  expect(html).not.toContain('(ID 10461)');
  for (const text of [
    'Equipped in this public snapshot',
    'Reported combat statistics',
    'View build',
    'Close build',
    '<summary',
    '<details',
    'build overview',
    'Crimson Witch of Flames',
    '66.2%',
    '10.5%',
    '+20',
  ])
    expect(html).not.toContain(text);
  expect(html).toMatch(
    /<article[^>]*aria-label="Hu Tao build"[^>]*>\s*<a[^>]*>[\s\S]*?<h3[^>]*>Hu Tao<\/h3>[\s\S]*?<\/a>\s*<\/article>/,
  );
});
it('distinguishes empty/private showcase from owned-roster data and unavailable observations', () => {
  const empty = render(
    h(Snapshot, { result: { ...result, snapshot: { ...snapshot, characters: [] } } }),
  );
  expect(empty).toContain('may be empty or private');
  expect(empty).toContain('does not mean the account owns no characters');
  const missing = renderPublic(`/u/${uid}/character/10000046`, {
    ...result,
    snapshot: {
      ...snapshot,
      characters: [
        {
          ...snapshot.characters[0],
          level: null,
          ascension: null,
          talents: [],
          equipmentAvailable: false,
          stats: [],
        },
      ],
    },
  });
  for (const text of [
    'Level not reported',
    'Ascension not reported',
    'Talent levels not reported',
    'Equipment details not reported',
    'Statistics not reported',
  ])
    expect(missing).toContain(text);
});
it.each([
  ['fetched', 'Received a response from Enka.Network'],
  ['cached', 'locally cached'],
  ['stale', 'Refresh failed'],
  ['unavailable', 'Showcase unavailable'],
])('labels %s freshness accurately', (delivery, text) => {
  const html = render(h(Status, { result: { ...result, delivery }, loading: false }));
  expect(html).toContain(text);
  expect(html).toContain('does not establish when the game data changed');
});
it('renders initial/loading/network/rate-limit states accessibly and never prints upstream diagnostics', () => {
  expect(render(h(Status, { loading: false }))).toContain('Enter a UID');
  expect(render(h(Status, { loading: true }))).toContain('role="status"');
  expect(render(h(Status, { loading: false, error: 'Connection unavailable.' }))).toContain(
    'role="alert"',
  );
  expect(
    render(
      h(Status, {
        loading: false,
        result: {
          ...result,
          delivery: 'stale',
          issue: { code: 'ENKA_429', status: 429, message: 'Please wait.' },
        },
      }),
    ),
  ).toContain('Please wait.');
});
it('saves only a versioned UID preference; corrupt or denied storage does not crash', () => {
  const values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  });
  expect(client.saveShowcaseUid(uid)).toBe(true);
  expect(client.readShowcaseUid()).toBe(uid);
  expect([...values.values()]).toEqual([JSON.stringify({ version: 2, uid })]);
  values.set('celestia.showcase.uid.v2', '{"version":2,"uid":"unsafe"}');
  expect(client.readShowcaseUid()).toBe('');
  vi.stubGlobal('localStorage', {
    getItem() {
      throw new Error();
    },
    setItem() {
      throw new Error();
    },
  });
  expect(client.readShowcaseUid()).toBe('');
  expect(client.saveShowcaseUid(uid)).toBe(false);
});
it('uses legacy UID preferences only as prefill until a lookup succeeds', () => {
  const values = new Map([['celestia.showcase.uid.v1', JSON.stringify({ version: 1, uid })]]);
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  });
  expect(client.readShowcaseUid()).toBe('');
  expect(client.readShowcaseInput()).toBe(uid);
  expect(client.rememberSuccessfulShowcase(result)).toBe(true);
  expect(client.readShowcaseUid()).toBe(uid);
  expect(values.has('celestia.showcase.uid.v1')).toBe(true);
});
it('handles typed provider failures and rejects malformed/foreign snapshots without authenticating', async () => {
  const transport = vi.fn(
    async () =>
      new Response(
        JSON.stringify({
          ...result,
          snapshot: null,
          delivery: 'unavailable',
          issue: { code: 'ENKA_429', status: 429, message: 'Wait.' },
        }),
        { status: 429 },
      ),
  );
  vi.stubGlobal('fetch', transport);
  expect((await client.fetchShowcase(uid)).issue.code).toBe('ENKA_429');
  expect(transport.mock.calls[0][1]).toMatchObject({ credentials: 'omit', cache: 'no-store' });
  expect(transport.mock.calls[0][1].headers).toBeUndefined();
  transport.mockImplementation(
    async () =>
      new Response(JSON.stringify({ ...result, snapshot: { ...snapshot, uid: '800000002' } })),
  );
  await expect(client.fetchShowcase(uid)).rejects.toThrow('unsupported');
});
it('keeps showcase queries and UI separate from roster/import/account actions', () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} });
  const queryClient = new QueryClient();
  const html = render(
    h(
      QueryClientProvider,
      { client: queryClient },
      h(MemoryRouter, null, h(DialogContext, { value: () => {} }, h(Page))),
    ),
  );
  expect(html).toContain('Today, at your pace.');
  expect(html).toContain('Add UID');
  expect(html).not.toContain('Switch UID');
  expect(html).not.toContain('/import');
  expect(html).not.toContain('HoYoLAB password');
  expect(
    queryClient
      .getQueryCache()
      .getAll()
      .every((query) => query.queryKey[0] === 'enka-showcase'),
  ).toBe(true);
  queryClient.clear();
});
it('keeps UID entry free of workspace registration and sign-in links', () => {
  vi.stubGlobal('localStorage', { getItem: () => null, setItem() {} });
  const queryClient = new QueryClient();
  const html = render(
    h(
      QueryClientProvider,
      { client: queryClient },
      h(MemoryRouter, null, h(DialogContext, { value: () => {} }, h(Page))),
    ),
  );
  expect(html).toContain('No sign-in or registration needed');
  expect(html).not.toContain('Open workspace');
  expect(html).toContain('Genshin UID');
  queryClient.clear();
});

it('remembers only successful public lookups, preserving the previous UID on errors or stale results', () => {
  const values = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key) => values.get(key),
    setItem: (key, value) => values.set(key, value),
  });
  expect(client.rememberSuccessfulShowcase(result)).toBe(true);
  const other = { ...result, snapshot: { ...snapshot, uid: '800000002' } };
  for (const failed of [
    { ...other, delivery: 'stale', issue: { code: 'ENKA_503', status: 503, message: 'Wait' } },
    { ...other, snapshot: null, delivery: 'unavailable' },
  ]) {
    expect(client.rememberSuccessfulShowcase(failed)).toBe(false);
    expect(client.readShowcaseUid()).toBe(uid);
  }
  expect(client.rememberSuccessfulShowcase({ ...other, delivery: 'cached' })).toBe(true);
  expect(client.readShowcaseUid()).toBe('800000002');
});

it.each([
  ['600000001', 'America'],
  ['700000001', 'Europe'],
  ['800000001', 'Asia'],
  ['1800000001', 'Asia'],
  ['900000001', 'TW / HK / MO'],
  ['1234567890', null],
  ['invalid', null],
])(
  'identifies the server from the complete UID prefix %s without inventing unknown ranges',
  (value, expected) => {
    expect(client.showcaseServer(value)).toBe(expected);
  },
);

it('enforces TTL and retry deadlines through the exact refresh boundary', () => {
  const deadline = Date.parse(result.nextRefreshAt);
  expect(client.refreshSeconds(result, deadline - 1001)).toBe(2);
  expect(client.refreshSeconds(result, deadline - 1)).toBe(1);
  expect(client.refreshSeconds(result, deadline)).toBe(0);
  expect(client.refreshSeconds(result, deadline + 1)).toBe(0);
  expect(client.refreshSeconds(undefined)).toBe(0);
});

it('retains an earlier successful snapshot even when a restarted API has lost its cache', () => {
  const failure = {
    ...result,
    snapshot: null,
    fetchedAt: null,
    delivery: 'unavailable',
    issue: { code: 'ENKA_503', status: 503, message: 'Wait' },
  };
  expect(client.retainShowcaseSnapshot(result, failure)).toEqual({
    ...failure,
    snapshot,
    fetchedAt: result.fetchedAt,
    delivery: 'stale',
  });
  expect(client.retainShowcaseSnapshot(undefined, failure)).toBe(failure);
  const empty = { ...result, snapshot: { ...snapshot, characters: [] } };
  expect(client.retainShowcaseSnapshot(result, empty)).toBe(empty);
});

it('deduplicates client lookup and dashboard requests for one UID and separates UID caches', async () => {
  let finish;
  const transport = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('fetch', transport);
  const qc = new QueryClient();
  const first = qc.fetchQuery(client.showcaseQueryOptions(uid));
  const duplicate = qc.fetchQuery(client.showcaseQueryOptions(uid));
  finish(new Response(JSON.stringify(result)));
  await Promise.all([first, duplicate]);
  expect(transport).toHaveBeenCalledTimes(1);
  expect(qc.getQueryData(client.showcaseQueryKey(uid)).snapshot.uid).toBe(uid);
  expect(qc.getQueryData(client.showcaseQueryKey('800000002'))).toBeUndefined();
  qc.clear();
});

function renderPublic(path, data = result) {
  const qc = new QueryClient();
  qc.setQueryData(client.showcaseQueryKey(uid), data);
  const html = render(
    h(
      QueryClientProvider,
      { client: qc },
      h(
        MemoryRouter,
        { initialEntries: [path] },
        h(
          DialogContext,
          { value: () => {} },
          h(
            Routes,
            null,
            h(Route, { path: '/u/:uid', element: h(PublicPage) }),
            h(Route, { path: '/u/:uid/character/:id', element: h(PublicPage) }),
          ),
        ),
      ),
    ),
  );
  qc.clear();
  return html;
}
it('renders UID dashboard links and a character deep link from the same current snapshot', () => {
  const html = renderPublic(`/u/${uid}`);
  for (const text of [
    'My Showcase',
    'Adventure Rank',
    'Server (from UID)',
    'Asia',
    'Staff of Homa',
    'Switch UID',
    `/u/${uid}/character/10000046%3A4601`,
  ])
    expect(html).toContain(text);
  const detail = renderPublic(`/u/${uid}/character/10000046`);
  for (const text of [
    'Hu Tao',
    'Base 9',
    'bonus +3',
    'Staff of Homa',
    'Crimson Witch of Flames',
    '73.1%',
    '66.2%',
    '10.5%',
    '+20',
    'Key statistics',
    'Artifacts',
    'Guide to Afterlife',
    'Secret Spear of Wangsheng',
    'Spirit Soother',
    'Normal Attack',
    'Elemental Skill',
    'Elemental Burst',
    'Back to showcase',
  ])
    expect(detail).toContain(text);
  expect(detail).not.toContain('Hu Tao build overview');
  expect(detail).not.toContain('View build');
  expect(detail).not.toContain('Close build');
  expect(detail).toContain('All combat statistics');
  expect(detail.match(/<h1/g)).toHaveLength(1);
  expect(detail).not.toContain('Switch UID');
  for (const text of [
    'Refresh Showcase',
    'Refresh available in',
    'Ready to refresh.',
    'id="refresh-help"',
  ])
    expect(detail).not.toContain(text);
});
it('shows missing character and invalid UID links clearly, without substituting private or historical data', () => {
  expect(renderPublic(`/u/${uid}/character/10000125`)).toContain(
    'not in the current public showcase',
  );
  expect(renderPublic('/u/invalid')).toContain('valid 9- or 10-digit');
  expect(
    renderPublic(`/u/${uid}`, { ...result, snapshot: { ...snapshot, characters: [] } }),
  ).toContain('empty or private');
});
it('disables refresh during provider TTL and Retry-After, and retains old data on a rate limit', () => {
  const nextRefreshAt = new Date(Date.now() + 60000).toISOString();
  const html = renderPublic(`/u/${uid}`, {
    ...result,
    delivery: 'stale',
    nextRefreshAt,
    issue: { code: 'ENKA_429', status: 429, message: 'Please wait for Enka.' },
  });
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Refresh Showcase/);
  expect(html).toContain('Refresh available in');
  expect(html).toContain('last successful snapshot');
  expect(html).toContain('Hu Tao');
});
