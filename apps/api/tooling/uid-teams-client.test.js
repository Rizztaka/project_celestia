/* global document */
import { createRequire } from 'node:module';

import { IDBFactory } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { readUidTeams, writeUidTeams } from '../../web/src/lib/build-analysis/teams-storage.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });
function installDom() {
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Event'])
    vi.stubGlobal(name, dom.window[name]);
}
installDom();
const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter } = require('react-router-dom');
const { QueryClient, QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let Page, Context, root, client, transport;
const uid = '800000001';
const saved = {
  version: 1,
  uid,
  id: 'team-one',
  name: 'Synthetic team',
  members: [
    { characterKey: '10000089:8901', roleId: 'party_buff' },
    { characterKey: '10000043:4301', roleId: 'reaction_trigger' },
    { characterKey: '10000114:11401', roleId: 'on_field_damage' },
    { characterKey: '10000103:10301', roleId: 'healing_support' },
  ],
};
beforeAll(async () => {
  ({ default: Page } = await import('../../web/src/pages/UidTeamsPage.tsx'));
  ({ UidWorkspaceContext: Context } = await import('../../web/src/lib/uid-workspace.ts'));
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  transport = vi.fn();
  vi.stubGlobal('fetch', transport);
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  vi.unstubAllGlobals();
});
afterAll(() => dom.window.close());
async function mount(target = uid, path = `/u/${target}/teams?team=team-one`) {
  const result = analysisFixture(target);
  client.setQueryData(['observed-roster', target], {
    records: result.snapshot.characters.map((character) => ({
      uid: target,
      character,
      observedAt: result.fetchedAt,
    })),
    issue: null,
  });
  await act(async () =>
    root.render(
      h(
        QueryClientProvider,
        { client },
        h(
          MemoryRouter,
          { initialEntries: [path] },
          h(Context, { value: { uid: target, query: { data: result } } }, h(Page)),
        ),
      ),
    ),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 25)));
}
async function click(text) {
  const b = [...document.querySelectorAll('button')].find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent.trim()) === text,
  );
  expect(b).toBeTruthy();
  await act(async () => b.click());
}

it('loads the real IndexedDB team into portrait slots and a keyboard-accessible workspace without private requests', async () => {
  await writeUidTeams(uid, [saved]);
  await mount();
  expect(document.querySelectorAll('.team-slot-filled')).toHaveLength(4);
  expect(document.querySelector('[aria-label="Edit Sucrose"]')).toBeTruthy();
  for (const tab of document.querySelectorAll('[role="tab"]'))
    expect(document.getElementById(tab.getAttribute('aria-controls'))).toBeTruthy();
  await click('Sucrose');
  expect(document.querySelector('[role="tabpanel"]:not([hidden])').textContent).toContain(
    'Observed equipment',
  );
  expect(document.querySelector('select').value).toBe('team-one');
  const active = document.querySelector('[role="tab"][aria-selected="true"]');
  await act(async () =>
    active.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    ),
  );
  expect(document.activeElement.textContent).toBe('Furina');
  expect(document.querySelector('[aria-label="Build role"]')).toBeNull();
  expect(transport).not.toHaveBeenCalled();
});
it('updates roles in the draft, explicitly saves them and preserves equipment observations', async () => {
  await writeUidTeams(uid, [saved]);
  await mount();
  await click('Furina');
  const role = [...document.querySelectorAll('select')].find((s) =>
    s.closest('label')?.textContent.includes('Build role'),
  );
  await act(async () => {
    role.value = 'off_field_damage';
    role.dispatchEvent(new Event('change', { bubbles: true }));
  });
  expect((await readUidTeams(uid))[0].members[0].roleId).toBe('party_buff');
  await click('Save changes');
  await act(async () => new Promise((resolve) => setTimeout(resolve, 30)));
  expect((await readUidTeams(uid))[0].members[0].roleId).toBe('off_field_damage');
  expect(
    client
      .getQueryData(['observed-roster', uid])
      .records[0].character.stats.find((s) => s.id === '20').value,
  ).toBe(0.65);
});
it('switches UID without showing or attaching the other UID team, and reports missing local links', async () => {
  await writeUidTeams(uid, [saved]);
  await mount('800000002');
  expect(document.body.textContent).toContain('not saved in this browser');
  expect(document.body.textContent).not.toContain('Synthetic team');
  expect(document.querySelectorAll('.team-slot-filled')).toHaveLength(0);
  expect(await readUidTeams('800000002')).toEqual([]);
});
