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
const uid = '800000001';
const snapshot = parseShowcase(uid, syntheticShowcase()).snapshot;
const result = {
  source: 'enka.network',
  delivery: 'fetched',
  fetchedAt: '2026-10-24T00:00:00Z',
  nextRefreshAt: '2026-10-24T00:01:00Z',
  snapshot,
  issue: null,
};
let Workspace,
  Today,
  Roster,
  Equipment,
  Detail,
  Welcome,
  workspaceClient,
  showcaseClient,
  DialogContext;
beforeAll(async () => {
  ({ default: Workspace } = await import('../../web/src/components/UidWorkspace.tsx'));
  ({ default: Today } = await import('../../web/src/pages/UidDashboardPage.tsx'));
  ({ default: Roster } = await import('../../web/src/pages/UidRosterPage.tsx'));
  ({ default: Equipment } = await import('../../web/src/pages/UidEquipmentPage.tsx'));
  ({ default: Detail } = await import('../../web/src/pages/PublicShowcasePage.tsx'));
  ({ default: Welcome } = await import('../../web/src/components/DashboardWelcome.tsx'));
  workspaceClient = await import('../../web/src/lib/uid-workspace.ts');
  showcaseClient = await import('../../web/src/lib/showcase.ts');
  ({ UidDialogContext: DialogContext } = await import('../../web/src/lib/uid-dialog.ts'));
});
afterEach(() => vi.unstubAllGlobals());

function page(path = `/u/${uid}`, data = result) {
  const transport = vi.fn();
  vi.stubGlobal('fetch', transport);
  const qc = new QueryClient();
  qc.setQueryData(showcaseClient.showcaseQueryKey(uid), data);
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
            h(
              Route,
              { path: '/u/:uid', element: h(Workspace) },
              h(Route, { index: true, element: h(Today) }),
              h(Route, { path: 'roster', element: h(Roster) }),
              h(Route, { path: 'inventory', element: h(Equipment) }),
              h(Route, { path: 'showcase', element: h(Detail) }),
              h(Route, { path: 'character/:id', element: h(Detail) }),
            ),
          ),
        ),
      ),
    ),
  );
  const keys = qc
    .getQueryCache()
    .getAll()
    .map((query) => query.queryKey);
  qc.clear();
  return { html, transport, keys };
}

it('opens a farming-focused Today with connected UID navigation and no private account queries', () => {
  const { html, transport, keys } = page();
  for (const text of [
    'Today, at your pace.',
    'Available today',
    'Farming day',
    'Talents',
    'Weapons',
    'companion-header',
    'companion-workspace',
    'Synthetic Traveler',
    'UID 800000001',
    'Open characters',
  ])
    expect(html).toContain(text);
  for (const path of [`/u/${uid}/roster`, `/u/${uid}/showcase`])
    expect(html).toContain(`href="${path.replace('&', '&amp;')}"`);
  expect(html).toMatch(/<button[^>]*>Switch UID<\/button>/);
  expect(html).not.toContain(`href="/u/${uid}/inventory"`);
  expect(html).not.toContain('Your equipped gear');
  expect(html).not.toContain('Sign out');
  expect(html).not.toContain('href="/login"');
  expect(html).not.toContain('href="/import"');
  for (const text of [
    'Adventure Rank',
    'Public account overview',
    'Your showcased characters',
    'Refresh Showcase',
    'locally cached',
  ])
    expect(html).not.toContain(text);
  expect(html).not.toContain('Every great build');
  expect(keys.every((key) => ['enka-showcase', 'observed-roster'].includes(key[0]))).toBe(true);
  expect(transport).not.toHaveBeenCalled();
});

it('uses the connected characters in the main collection cards and keeps search scoped to that UID', () => {
  const { html } = page(`/u/${uid}/roster`);
  for (const text of [
    'collection-card',
    'Your characters',
    'Hu Tao',
    'Level 80',
    'C1',
    'Staff of Homa',
    'Base talents',
    'Search characters',
    `/u/${uid}/character/10000046%3A4601`,
  ])
    expect(html).toContain(text);
  expect(page(`/u/${uid}/roster?q=unknown`).html).toContain('No observed characters match');
  expect(page(`/u/${uid}/roster?q=10000046`).html).toContain('Hu Tao');
});

it('combines character element, weapon type, rarity and search filters while retaining unknown metadata in All', () => {
  const raw = syntheticShowcase();
  for (const avatarId of [10000021, 10000114, 99999999])
    raw.avatarInfoList.push({ avatarId, propMap: {}, fightPropMap: {} });
  const multiple = { ...result, snapshot: parseShowcase(uid, raw).snapshot };
  const base = `/u/${uid}/roster`;
  const filtered = page(`${base}?element=Pyro&weapon=Bow&rarity=4&q=amber`, multiple);
  expect(filtered.html).toContain('1 of 4 observed characters');
  expect(filtered.html).toContain('Amber');
  for (const name of ['Hu Tao', 'Skirk', 'Character 99999999'])
    expect(filtered.html).not.toContain(name);
  expect(filtered.transport).not.toHaveBeenCalled();
  expect(page(`${base}?element=Pyro&weapon=Polearm&rarity=5`, multiple).html).toContain('Hu Tao');
  expect(page(`${base}?element=Cryo&weapon=Sword&rarity=5`, multiple).html).toContain('Skirk');
  expect(page(`${base}?element=Hydro&weapon=Bow&rarity=4`, multiple).html).toContain(
    'No observed characters match',
  );
  const all = page(base, multiple).html;
  expect(all).toContain('4 of 4 observed characters');
  expect(all).toContain('Character 99999999');
  expect(page(`${base}?element=invalid&weapon=invalid&rarity=invalid`, multiple).html).toContain(
    '4 of 4 observed characters',
  );
});

it('connects the same equipped weapon and artifact data to the main equipment tabs', () => {
  const weapons = page(`/u/${uid}/inventory`).html;
  for (const text of [
    'Weapons (1)',
    'Artifacts (1)',
    'Staff of Homa',
    '66.2%',
    'Equipped by Hu Tao',
    'Unequipped inventory and materials are not provided',
  ])
    expect(weapons).toContain(text);
  const artifacts = page(`/u/${uid}/inventory?tab=artifacts`).html;
  for (const text of ['Crimson Witch of Flames', '+20', '4,780', '10.5%', 'Equipped by Hu Tao'])
    expect(artifacts).toContain(text);
});

it('opens the reported build inside the main shell and links back to the UID character collection', () => {
  const { html, keys, transport } = page(`/u/${uid}/character/10000046`);
  for (const text of [
    'companion-workspace',
    'Hu Tao',
    'Base 9',
    'bonus +3',
    'Staff of Homa',
    'Crimson Witch of Flames',
    '73.1%',
    '← All characters',
    `href="/u/${uid}/roster"`,
  ])
    expect(html).toContain(text);
  expect(keys).toEqual([
    ['enka-showcase', uid],
    ['observed-roster', uid],
    ['public-teams', uid],
  ]);
  expect(transport).not.toHaveBeenCalled();
  expect(html).not.toContain('Refresh Showcase');
  expect(html).not.toContain('id="refresh-help"');
});

it('never substitutes another UID data while a different workspace is loading', () => {
  const { html } = page('/u/800000002/roster');
  expect(html).toContain('UID 800000002');
  for (const text of ['Hu Tao', 'Staff of Homa', 'Synthetic Traveler'])
    expect(html).not.toContain(text);
});

it('keeps Today clean and empty or hidden data explicit in the data views', () => {
  const empty = { ...result, snapshot: { ...snapshot, characters: [] } };
  expect(page(`/u/${uid}`, empty).html).toContain('Today, at your pace.');
  expect(page(`/u/${uid}/roster`, empty).html).toContain('public showcase is empty or private');
  expect(page(`/u/${uid}/inventory`, empty).html).toContain('No equipped weapons were reported');
});

it('retains connected workspace data and disables refresh during provider backoff', () => {
  const stale = {
    ...result,
    delivery: 'stale',
    nextRefreshAt: new Date(Date.now() + 60000).toISOString(),
    issue: { code: 'ENKA_429', status: 429, message: 'Please wait for Enka.' },
  };
  const { html } = page(`/u/${uid}/showcase`, stale);
  expect(html).toContain('last successful snapshot');
  expect(html).toContain('Hu Tao');
  expect(html).toMatch(/<button[^>]*disabled=""[^>]*>Refresh Showcase/);
});

it('uses a timer instead of cache diagnostics in the public profile and links character identities to details', () => {
  const cached = {
    ...result,
    delivery: 'cached',
    nextRefreshAt: new Date(Date.now() + 60000).toISOString(),
  };
  const { html } = page(`/u/${uid}/showcase`, cached);
  expect(html).toContain('Refresh available in');
  expect(html).not.toContain('View build');
  expect(html).not.toContain('Hu Tao build overview');
  expect(html).not.toContain('Equipped in this public snapshot');
  expect(html).toContain(`href="/u/${uid}/character/10000046%3A4601"`);
  expect(html).toContain('aria-label="View Hu Tao details"');
  expect(html).toMatch(
    /<a[^>]*aria-label="View Hu Tao details"[^>]*>[\s\S]*?<h3[^>]*>Hu Tao<\/h3>[\s\S]*?Staff of Homa[\s\S]*?<\/a>/,
  );
  for (const text of [
    'locally cached',
    'Received a response',
    'Next upstream request',
    'Last successful Enka response',
    'Open Hu Tao build page',
  ])
    expect(html).not.toContain(text);
  expect(html).not.toContain('<summary');
});

it('retains the original account Today actions in the shared welcome component', () => {
  const html = render(h(MemoryRouter, null, h(Welcome)));
  for (const text of [
    'Record my session',
    'href="#session-recording"',
    'href="/planner"',
    'href="/roster"',
    'href="/import"',
  ])
    expect(html).toContain(text);
});

it('keeps new character metadata and absent observations accurate in the main collection', () => {
  const raw = {
    ...syntheticShowcase(),
    avatarInfoList: [{ avatarId: 10000125, propMap: {}, fightPropMap: {} }],
  };
  const columbina = { ...result, snapshot: parseShowcase(uid, raw).snapshot };
  const html = page(`/u/${uid}/roster`, columbina).html;
  for (const text of ['Columbina', 'Level not reported', 'Weapon not reported'])
    expect(html).toContain(text);
  expect(html).not.toContain('Level 0');
  expect(html).not.toContain('Metadata unavailable');
});

it('resolves UID navigation accurately and preserves opaque character keys', () => {
  const { uidNavigationActive: active, uidCharacterPath: path } = workspaceClient;
  expect(active(`/u/${uid}`, `/u/${uid}/roster`, uid)).toBe(false);
  expect(active(`/u/${uid}/roster`, `/u/${uid}/character/10000125`, uid)).toBe(true);
  expect(active(`/u/${uid}/inventory`, '/u/800000002/inventory', uid)).toBe(false);
  expect(path(uid, '10000007:701')).toBe(`/u/${uid}/character/10000007%3A701`);
});
