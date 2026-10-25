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
const { MemoryRouter, Routes, Route, useLocation } = require('react-router-dom');
const { QueryClient, QueryClientProvider } =
  await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js');
let Page, DetailsPage, Context, root, client, transport;
function LocationProbe() {
  const location = useLocation();
  return h('span', { 'data-current-path': '' }, location.pathname + location.search);
}
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
  ({ default: DetailsPage } = await import('../../web/src/pages/UidTeamDetailsPage.tsx'));
  ({ UidWorkspaceContext: Context } = await import('../../web/src/lib/uid-workspace.ts'));
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('localStorage', dom.window.localStorage);
  dom.window.localStorage.clear();
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
async function mount(target = uid, path = `/u/${target}/teams/team-one`) {
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
          h(
            Context,
            { value: { uid: target, query: { data: result } } },
            h(
              'div',
              {},
              h(LocationProbe),
              h(
                Routes,
                {},
                h(Route, { path: '/u/:uid/teams', element: h(Page) }),
                h(Route, { path: '/u/:uid/teams/:teamId', element: h(DetailsPage) }),
              ),
            ),
          ),
        ),
      ),
    ),
  );
  await act(async () => new Promise((resolve) => setTimeout(resolve, 25)));
}
async function click(text) {
  const b = [...document.querySelectorAll('button,a')].find(
    (b) => (b.getAttribute('aria-label') ?? b.textContent.trim()) === text,
  );
  expect(b).toBeTruthy();
  await act(async () => b.click());
}

async function chooseRotation(mode) {
  const radio = [...document.querySelectorAll('input[type="radio"]')].find((input) =>
    input.closest('label')?.textContent.includes(mode),
  );
  expect(radio).toBeTruthy();
  await act(async () => radio.click());
}

it('shows a fixed read-only enemy and lets the player choose default or custom without losing edits', async () => {
  await writeUidTeams(uid, [saved]);
  await mount();
  await click('Damage lab');
  const enemy = document.querySelector('[aria-label="Benchmark enemy details"]');
  expect(enemy.textContent).toContain('100');
  expect(enemy.textContent).toContain('0%');
  expect(enemy.querySelectorAll('input,select,textarea,button')).toHaveLength(0);
  expect(document.querySelector('.rotation-search-controls')).toBeNull();
  expect(document.querySelector('[aria-label="Default rotation steps"]').children).toHaveLength(5);
  expect(document.querySelector('[aria-label="Default rotation steps"]').textContent).toContain(
    'Skirk: Normal attack ×6',
  );
  await chooseRotation('Custom rotation');
  await click('Add Furina Skill');
  await click('Choose Skirk for rotation');
  await click('Add Skirk Burst');
  expect(document.querySelectorAll('.rotation-builder-steps > li')).toHaveLength(7);
  await click('Move step 7 earlier');
  const before = document.querySelector('[aria-label="Rotation preview"]').textContent;
  await chooseRotation('Default rotation');
  expect(document.querySelector('.rotation-composer')).toBeNull();
  await chooseRotation('Custom rotation');
  expect(document.querySelector('[aria-label="Rotation preview"]').textContent).toBe(before);
  expect(document.querySelector('[aria-label="Step 1 wait seconds"]')).toBeTruthy();
  expect(dom.window.localStorage.length).toBe(0);
});

it('ignores legacy target overrides, runs the chosen rotation on the fixed benchmark and shows average DPS', async () => {
  const requests = [];
  class DpsWorker {
    postMessage(message) {
      requests.push(message);
      queueMicrotask(() =>
        this.onmessage({
          data: {
            type: 'result',
            results: message.jobs.map((job) => ({
              id: job.id,
              runs: Array.from({ length: job.samples }, (_, i) => ({
                seed: String(i + 1),
                durationFrames: 3600,
                totalDamage: 6000,
                dps: 100,
                members: ['furina', 'sucrose', 'skirk', 'xilonen'].map((key, index) => ({
                  key,
                  damage: index === 0 ? 6000 : 0,
                  actions: 1,
                  activeFrames: 0,
                  failedIntervals: 0,
                })),
              })),
            })),
          },
        }),
      );
    }
    terminate() {}
  }
  vi.stubGlobal('Worker', DpsWorker);
  const legacySteps = [
    {
      characterKey: saved.members[0].characterKey,
      action: 'skill',
      repeat: 1,
      waitFrames: 90,
      params: '',
    },
  ];
  dom.window.localStorage.setItem(
    `celestia.team-rotation.v1:${uid}:team-one`,
    JSON.stringify({
      version: 1,
      uid,
      teamId: 'team-one',
      settings: { duration: 180, enemyLevel: 50, resistance: 80, samples: 1, steps: legacySteps },
    }),
  );
  await writeUidTeams(uid, [saved]);
  await mount();
  await click('Damage lab');
  expect(document.querySelector('[aria-label="Step 1 wait seconds"]').value).toBe('1.5');
  await click('Show DPS');
  await act(async () => new Promise((resolve) => setTimeout(resolve, 25)));
  expect(requests).toHaveLength(1);
  expect(requests[0].jobs[0].samples).toBe(20);
  expect(requests[0].jobs[0].config).toContain('options iteration=1 duration=60');
  expect(requests[0].jobs[0].config).toContain('target lvl=100 resist=0 pos=0,0 radius=1;');
  expect(requests[0].jobs[0].config).toContain('wait(90)');
  const result = document.querySelector('[aria-label="Team damage results"]');
  expect(result.textContent).toContain('AVERAGE TEAM DPS100damage / second');
  expect(result.textContent).toContain('not only the opening second');
  expect(result.textContent).toContain(
    new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(6000) +
      ' over 60 seconds',
  );
  await click('Save rotation');
  const stored = JSON.parse(
    dom.window.localStorage.getItem(`celestia.team-rotation.v1:${uid}:team-one`),
  );
  expect(stored.rotationMode).toBe('custom');
  expect(stored.settings.steps).toEqual(legacySteps);
  expect(stored.settings.enemyLevel).toBe(100);
  expect(stored.settings.resistance).toBe(0);
  await click('Add Furina Burst');
  expect(document.querySelector('[aria-label="Team damage results"]')).toBeNull();
  expect(requests).toHaveLength(1);
  expect((await readUidTeams(uid))[0]).toEqual(saved);
});

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
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(0);
  expect(document.querySelector('[data-current-path]').textContent).toBe(
    `/u/${uid}/teams/team-one`,
  );
  expect(document.querySelector('[aria-label="Team maker"]')).toBeNull();
  expect(document.querySelector('.team-library-bar')).toBeNull();
  expect(
    [...document.querySelectorAll('button')].some(
      (button) => button.textContent.trim() === 'New team',
    ),
  ).toBe(false);
  const active = document.querySelector(
    '[aria-label="Team workspace"] [role="tab"][aria-selected="true"]',
  );
  await act(async () =>
    active.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    ),
  );
  expect(document.activeElement.textContent).toBe('Furina');
  expect(document.querySelector('[aria-label="Build role"]')).toBeNull();
  expect(transport).not.toHaveBeenCalled();
});
it('keeps lineup drafts, rotation edits and an in-flight simulation when switching page sections', async () => {
  const workers = [];
  class PendingWorker {
    terminated = false;
    constructor() {
      workers.push(this);
    }
    postMessage() {}
    terminate() {
      this.terminated = true;
    }
  }
  vi.stubGlobal('Worker', PendingWorker);
  await writeUidTeams(uid, [saved]);
  await mount();
  const buildPanel = document.querySelector('[role="tabpanel"][id$="-panel-builds"]');
  const labPanel = document.querySelector('[role="tabpanel"][id$="-panel-damage"]');
  expect(buildPanel.hidden).toBe(false);
  expect(labPanel.hidden).toBe(true);
  expect(
    [...document.querySelectorAll('button')].find((button) =>
      button.textContent.includes('Save changes'),
    ).disabled,
  ).toBe(true);
  await click('Furina');
  const role = [...document.querySelectorAll('select')].find((select) =>
    select.closest('label')?.textContent.includes('Build role'),
  );
  await act(async () => {
    role.value = 'off_field_damage';
    role.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await click('Damage lab');
  expect(buildPanel.hidden).toBe(true);
  expect(labPanel.hidden).toBe(false);
  await chooseRotation('Custom rotation');
  await click('Add Furina Skill');
  await click('Show DPS');
  expect(workers).toHaveLength(1);
  await click('Lineup & builds');
  expect(role.value).toBe('off_field_damage');
  expect(workers[0].terminated).toBe(false);
  expect((await readUidTeams(uid))[0].members[0].roleId).toBe('party_buff');
  await click('Damage lab');
  expect(document.querySelectorAll('.rotation-builder-steps > li')).toHaveLength(6);
  await click('Cancel calculation');
  expect(workers[0].terminated).toBe(true);
  expect(document.body.textContent).toContain('Simulation cancelled.');
  const primary = document.querySelector('[aria-label="Team page"] [aria-selected="true"]');
  await act(async () =>
    primary.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Home', bubbles: true })),
  );
  expect(document.activeElement.textContent).toBe('Lineup & builds');
  expect(buildPanel.hidden).toBe(false);
  expect(dom.window.localStorage.length).toBe(0);
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
  await act(async () => {
    for (let attempt = 0; attempt < 100 && client.isMutating(); attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
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
it('opens a separate team page with all four builds and returns to the compact collection', async () => {
  await writeUidTeams(uid, [saved, { ...saved, id: 'team-two', name: 'Second team' }]);
  await mount(uid, `/u/${uid}/teams`);
  expect(document.querySelectorAll('.saved-team-card')).toHaveLength(2);
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(0);
  expect(
    document
      .querySelector('[aria-label="Team maker"]')
      .compareDocumentPosition(document.querySelector('.saved-team-collection')) &
      dom.window.Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  await click('Open Synthetic team');
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(4);
  expect(document.querySelector('[aria-label="Team maker"]')).toBeNull();
  expect(document.querySelector('[data-current-path]').textContent).toBe(
    `/u/${uid}/teams/team-one`,
  );
  for (const region of document.querySelectorAll('.saved-member-build'))
    expect(region.textContent).toContain('Observed equipment');
  await click('← Back to teams');
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(0);
  expect(document.querySelector('[aria-label="Team maker"]')).toBeTruthy();
  await click('Open Second team');
  expect(document.querySelector('[data-current-path]').textContent).toBe(
    `/u/${uid}/teams/team-two`,
  );
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(4);
  expect(await readUidTeams(uid)).toHaveLength(2);
});
it('keeps legacy team-context links working by redirecting to the dedicated page', async () => {
  await writeUidTeams(uid, [saved]);
  await mount(uid, `/u/${uid}/teams?team=team-one`);
  expect(document.querySelector('[data-current-path]').textContent).toBe(
    `/u/${uid}/teams/team-one`,
  );
  expect(document.querySelectorAll('.saved-member-build')).toHaveLength(4);
});
it('saves a second lineup as a compact card and resets the maker without changing existing teams', async () => {
  await writeUidTeams(uid, [saved]);
  await mount();
  await click('Duplicate to maker');
  expect(
    document.querySelector('[aria-label="Team maker"]').querySelectorAll('.team-slot-filled'),
  ).toHaveLength(4);
  await click('Save team');
  await act(async () => new Promise((resolve) => setTimeout(resolve, 40)));
  expect(document.querySelectorAll('.saved-team-card')).toHaveLength(2);
  expect(document.querySelectorAll('.saved-team-card.is-expanded')).toHaveLength(0);
  expect(
    document.querySelector('[aria-label="Team maker"]').querySelectorAll('.team-slot-filled'),
  ).toHaveLength(0);
  const stored = await readUidTeams(uid);
  expect(stored.find((team) => team.id === saved.id)).toEqual(saved);
  expect(stored.some((team) => team.name === 'Synthetic team (copy)')).toBe(true);
  expect(document.activeElement.getAttribute('aria-label')).toBe('Open Synthetic team (copy)');
  expect(transport).not.toHaveBeenCalled();
});
