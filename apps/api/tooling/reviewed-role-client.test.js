/* global document */
import { createRequire } from 'node:module';

import { IDBFactory } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

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
const uid = '800000001';
let Analysis, root, client;
beforeAll(async () => {
  ({ default: Analysis } = await import('../../web/src/components/PublicCharacterAnalysis.tsx'));
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('indexedDB', new IDBFactory());
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(['uid-teams', uid], []);
});
afterEach(async () => {
  await act(async () => root.unmount());
  client.clear();
  vi.unstubAllGlobals();
});
afterAll(() => dom.window.close());
async function render(index = 5, conflicted = false, unknownForm = false) {
  const fixture = analysisFixture(uid);
  const character = fixture.snapshot.characters[index];
  if (unknownForm) {
    character.skillDepotId = 999999;
    character.key = `${character.id}:999999`;
  }
  const records = fixture.snapshot.characters.map((entry) => ({
    uid,
    character: entry,
    observedAt: fixture.fetchedAt,
    conflicted: entry.key === character.key && conflicted,
  }));
  await act(async () =>
    root.render(
      h(
        QueryClientProvider,
        { client },
        h(MemoryRouter, {}, h(Analysis, { uid, character, records })),
      ),
    ),
  );
}
async function selectRole(role) {
  await act(async () => {
    const select = document.querySelector('select');
    select.value = role;
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
}

it('applies Dahlia shield guidance automatically and displays its source-guide version', async () => {
  await render();
  expect(document.body.textContent).toContain('Using the reviewed default role: Shield support');
  expect(document.querySelector('select').value).toBe('unspecified');
  expect(document.body.textContent).toContain('Dahlia quick guide · guide v5.7');
  expect(document.body.textContent).toContain('Reviewed priority: burst');
});
it('lets an explicit role override the default and restores automatic guidance on request', async () => {
  await render(0);
  expect(document.body.textContent).toContain('Using the reviewed default role: Party support');
  await selectRole('off_field_damage');
  expect(document.body.textContent).toContain('Using your selected role');
  expect(document.querySelector('select').value).toBe('off_field_damage');
  await selectRole('unspecified');
  expect(document.body.textContent).toContain('Using the reviewed default role: Party support');
});
it('keeps unreviewed forms visible without automatically assigning tailored guidance', async () => {
  await render(5, false, true);
  expect(document.body.textContent).not.toContain('Using the reviewed default role');
  expect(document.body.textContent).toContain('Tailored role guidance is not reviewed');
});
it('explains conflicting observations instead of giving confident automatic advice', async () => {
  await render(5, true);
  expect(document.body.textContent).not.toContain('Using the reviewed default role');
  expect(document.body.textContent).toContain('Different builds were observed at the same time');
  expect(document.querySelector('.analysis-disclosure').open).toBe(true);
});
it('lets players disable default role assumptions for a different playstyle', async () => {
  await render(0);
  await selectRole('general_checks');
  expect(document.body.textContent).toContain('Automatic role assumptions are disabled');
  expect(document.querySelector('select').value).toBe('general_checks');
  expect(document.body.textContent).not.toContain("This role's reviewed choices");
});
