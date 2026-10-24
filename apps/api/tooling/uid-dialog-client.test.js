/* global document, window, HTMLDialogElement, HTMLInputElement */
// Component interaction tests use synthetic responses; this is not a visual browser check.
import { createRequire } from 'node:module';

import { IDBFactory } from 'fake-indexeddb';
import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { syntheticShowcase } from '../src/games/genshin/showcase/showcase.fixtures.js';
import { parseShowcase } from '../src/games/genshin/showcase/showcase.parser.js';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
// Keep the Node transform for server-only fixture parsing, with a DOM for React interactions.
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });
function installDom() {
  for (const name of [
    'window',
    'document',
    'navigator',
    'HTMLElement',
    'HTMLInputElement',
    'HTMLDialogElement',
    'HTMLDetailsElement',
    'MutationObserver',
    'Event',
    'localStorage',
  ])
    vi.stubGlobal(name, dom.window[name]);
}
installDom();
const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');
let App, root;
const uid = '800000001';
const otherUid = '1800000001';
const storageKey = 'celestia.showcase.uid.v2';
function data(target = uid, empty = false) {
  const raw = syntheticShowcase(target);
  if (target === otherUid) {
    raw.playerInfo.nickname = 'Second Synthetic Traveler';
    raw.avatarInfoList = [
      {
        avatarId: 10000114,
        skillDepotId: 11401,
        propMap: {},
        fightPropMap: {},
        skillLevelMap: { 11141: 1, 11142: 9, 11145: 9 },
      },
    ];
  }
  if (empty) raw.avatarInfoList = [];
  return {
    source: 'enka.network',
    delivery: 'fetched',
    fetchedAt: new Date().toISOString(),
    nextRefreshAt: new Date(Date.now() + 60000).toISOString(),
    snapshot: parseShowcase(target, raw).snapshot,
    issue: null,
  };
}
const response = (value) =>
  new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });
const text = () => document.body.textContent;
const buttons = (label) =>
  [...document.querySelectorAll('button')].filter((button) => button.textContent.trim() === label);
async function click(button) {
  expect(button).toBeTruthy();
  await act(async () => button.click());
}
async function input(value) {
  await until(() => document.getElementById('uid-dialog-input'));
  await act(async () => {
    const field = document.getElementById('uid-dialog-input');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(field, value);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
}
async function submit() {
  await act(async () =>
    document
      .querySelector('.uid-search-form')
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })),
  );
}
async function until(predicate) {
  for (let i = 0; i < 100; i++) {
    if (predicate()) return;
    await act(async () => new Promise((resolve) => setTimeout(resolve, 10)));
  }
  throw new Error(`Expected UI did not appear: ${text().slice(0, 600)}`);
}
async function mount(path = '/') {
  window.history.replaceState({}, '', path);
  await act(async () => root.render(h(App)));
  await until(
    () =>
      document.querySelector('.sidebar-bottom button') &&
      document.querySelector('#companion-content h1'),
  );
}
beforeAll(async () => {
  ({ default: App } = await import('../../web/src/App.tsx'));
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('indexedDB', new IDBFactory());
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  window.matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  });
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  // jsdom has no native top layer; stub only those browser-owned dialog methods.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
    this.querySelector('input')?.focus();
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
  localStorage.clear();
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterAll(() => dom.window.close());

it.each(['/login', '/register'])(
  'opens the UID-first home from the old %s bookmark without restoring a credential session',
  async (path) => {
    const transport = vi.fn();
    vi.stubGlobal('fetch', transport);
    await mount(path);
    await until(() => window.location.pathname === '/');
    expect(text()).toContain('Today, at your pace.');
    expect(buttons('Add UID').length).toBeGreaterThan(0);
    expect(buttons('Switch UID')).toHaveLength(0);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(transport).not.toHaveBeenCalled();
  },
);

it.each(['/login', '/register'])(
  'resumes the saved UID from the old %s bookmark and offers Switch UID without sign-in',
  async (path) => {
    localStorage.setItem(storageKey, JSON.stringify({ version: 2, uid }));
    const transport = vi.fn(async () => response(data()));
    vi.stubGlobal('fetch', transport);
    await mount(path);
    await until(() => window.location.pathname === `/u/${uid}` && buttons('Switch UID').length);
    expect(document.querySelector('input[type="password"]')).toBeNull();
    expect(transport).toHaveBeenCalledTimes(1);
    expect(transport.mock.calls[0][0]).toContain(`/games/genshin/showcase/${uid}`);
    expect(transport.mock.calls[0][1].credentials).toBe('omit');
  },
);

it('keeps the existing private workspace guarded with its own credential route', async () => {
  const transport = vi.fn(async () => response({ success: false }));
  vi.stubGlobal('fetch', transport);
  window.history.replaceState({}, '', '/workspace');
  await act(async () => root.render(h(App)));
  await until(() => document.querySelector('input[type="password"]'));
  expect(window.location.pathname).toBe('/workspace/login');
  expect(document.querySelector('a[href="/workspace/register"]')).toBeTruthy();
  expect(transport.mock.calls[0][0]).toContain('/auth/refresh');
});

it('refresh adds and updates the saved roster, keeps removed builds accessible, and preserves it after empty responses, failures and reloads', async () => {
  const raw = syntheticShowcase(uid);
  raw.avatarInfoList.push({
    avatarId: 10000114,
    propMap: { 4001: { val: '80' } },
    fightPropMap: {},
  });
  const initial = {
    ...data(),
    fetchedAt: '2026-10-24T10:00:00.000Z',
    nextRefreshAt: '2020-01-01T00:00:00.000Z',
    snapshot: parseShowcase(uid, raw).snapshot,
  };
  const updatedRaw = syntheticShowcase(uid);
  updatedRaw.avatarInfoList[0].propMap[4001] = { val: '90' };
  const updated = {
    ...initial,
    fetchedAt: '2026-10-24T10:02:00.000Z',
    snapshot: parseShowcase(uid, updatedRaw).snapshot,
  };
  const empty = {
    ...updated,
    fetchedAt: '2026-10-24T10:04:00.000Z',
    snapshot: { ...updated.snapshot, characters: [] },
  };
  const transport = vi
    .fn()
    .mockResolvedValueOnce(response(initial))
    .mockResolvedValueOnce(response(updated))
    .mockResolvedValueOnce(response(empty))
    .mockRejectedValueOnce(new Error('Synthetic network failure'))
    .mockImplementation(async () => response(empty));
  vi.stubGlobal('fetch', transport);
  const history = await import('../../web/src/lib/observed-roster.ts');
  await mount(`/u/${uid}/roster`);
  await until(() => document.querySelectorAll('.collection-card').length === 2);
  // Wait for the actual IndexedDB transaction before replacing the upstream showcase.
  await act(async () => {
    for (let i = 0; i < 50 && (await history.readObservedRoster(uid)).records.length < 2; i++)
      await new Promise((resolve) => setTimeout(resolve, 10));
  });
  await click(buttons('Refresh Showcase')[0]);
  await until(() => text().includes('Level 90') && text().includes('Previously observed'));
  expect(document.querySelectorAll('.collection-card')).toHaveLength(2);
  const savedPath = document.querySelector('a[aria-label="Open Skirk"]').getAttribute('href');
  await click(
    [...document.querySelectorAll('a')].find(
      (link) => link.textContent.trim() === 'Public profile',
    ),
  );
  await until(() => document.querySelector('[aria-label="View Hu Tao details"]'));
  expect(document.querySelector('[aria-label="View Skirk details"]')).toBeNull();
  await click(
    [...document.querySelectorAll('a')].find((link) => link.textContent.trim() === 'Characters'),
  );
  await until(() => document.querySelector('a[aria-label="Open Skirk"]'));
  await click(document.querySelector('a[aria-label="Open Skirk"]'));
  await until(() => document.querySelector('.character-build-detail'));
  expect(window.location.pathname).toBe(savedPath);
  expect(text()).toContain('Previously observed build');
  await click(
    [...document.querySelectorAll('a')].find((link) => link.textContent.includes('All characters')),
  );
  await until(() => buttons('Refresh Showcase')[0]);
  await click(buttons('Refresh Showcase')[0]);
  await until(() => transport.mock.calls.length === 3 && !buttons('Refreshing…').length);
  expect(document.querySelectorAll('.collection-card')).toHaveLength(2);
  await click(buttons('Refresh Showcase')[0]);
  await until(() => text().includes('Could not reach'));
  expect(document.querySelectorAll('.collection-card')).toHaveLength(2);
  await act(async () => root.unmount());
  root = createRoot(document.getElementById('root'));
  await mount(`/u/${uid}/roster`);
  await until(() => document.querySelectorAll('.collection-card').length === 2);
  expect(text()).toContain('Level 90');
  expect(text()).toContain('Skirk');
  expect((await history.readObservedRoster(uid)).records).toHaveLength(2);
});

it('filters the current showcase locally, combines controls, persists them on reload and clears only filter parameters', async () => {
  const raw = syntheticShowcase();
  for (const avatarId of [10000021, 10000114])
    raw.avatarInfoList.push({ avatarId, propMap: {}, fightPropMap: {} });
  const transport = vi.fn(async () =>
    response({ ...data(), snapshot: parseShowcase(uid, raw).snapshot }),
  );
  vi.stubGlobal('fetch', transport);
  await mount(`/u/${uid}/roster?view=grid`);
  await until(() => document.querySelectorAll('.collection-card').length === 3);
  async function select(label, value) {
    await act(async () => {
      const control = document.querySelector(`select[aria-label="${label}"]`);
      control.value = value;
      control.dispatchEvent(new Event('change', { bubbles: true }));
    });
  }
  await select('Element', 'Pyro');
  expect(document.querySelectorAll('.collection-card')).toHaveLength(2);
  await select('Weapon type', 'Bow');
  await select('Character rarity', '4');
  expect(document.querySelectorAll('.collection-card')).toHaveLength(1);
  expect(document.querySelector('.collection-card').textContent).toContain('Amber');
  expect(window.location.search).toContain('element=Pyro');
  expect(window.location.search).toContain('weapon=Bow');
  expect(window.location.search).toContain('rarity=4');
  const reloadPath = window.location.pathname + window.location.search;
  await act(async () => {
    const field = document.querySelector('input[aria-label="Search characters"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(
      field,
      'no-match',
    );
    field.dispatchEvent(new Event('input', { bubbles: true }));
  });
  expect(document.querySelectorAll('.collection-card')).toHaveLength(0);
  expect(text()).toContain('No observed characters match');
  await click(buttons('Clear filters')[0]);
  expect(document.querySelectorAll('.collection-card')).toHaveLength(3);
  expect(window.location.search).toBe('?view=grid');
  expect(transport).toHaveBeenCalledTimes(1);
  await act(async () => root.unmount());
  root = createRoot(document.getElementById('root'));
  await mount(reloadPath);
  await until(() => document.querySelectorAll('.collection-card').length === 1);
  expect(document.querySelector('select[aria-label="Element"]').value).toBe('Pyro');
  expect(document.querySelector('select[aria-label="Weapon type"]').value).toBe('Bow');
  expect(document.querySelector('select[aria-label="Character rarity"]').value).toBe('4');
  expect(document.querySelector('.collection-card').textContent).toContain('Amber');
});

it('opens the UID dialog from mobile navigation and returns focus to the menu after cancelling', async () => {
  vi.stubGlobal('fetch', vi.fn());
  await mount();
  const menu = document.querySelector('.companion-menu-toggle');
  await click(menu);
  const drawer = document.querySelector('.companion-drawer');
  expect(drawer.open).toBe(true);
  await click(
    [...drawer.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === 'Add UID',
    ),
  );
  await until(() => document.querySelector('dialog.uid-dialog[open]'));
  expect(drawer.open).toBe(false);
  await click(buttons('Cancel')[0]);
  expect(document.activeElement).toBe(menu);
  expect(document.body.style.overflow).toBe('');
});

it('keeps legacy showcase links usable with the shared UID popup', async () => {
  vi.stubGlobal('fetch', vi.fn());
  await mount('/showcase?switch=1');
  await until(() => document.querySelector('dialog.uid-dialog[open]'));
  expect(window.location.pathname).toBe('/');
  await click(buttons('Cancel')[0]);
  expect(window.location.search).toBe('');
  expect(document.querySelector('.uid-dialog')).toBeNull();
});

it('opens the normal Celestia home for a new visitor, previews a UID and only connects when Add UID is clicked', async () => {
  const transport = vi.fn(async () => response(data()));
  vi.stubGlobal('fetch', transport);
  await mount();
  expect(text()).toContain('Today, at your pace.');
  expect(buttons('Add UID').length).toBeGreaterThan(0);
  expect(buttons('Switch UID')).toHaveLength(0);
  expect(transport).not.toHaveBeenCalled();
  await click(document.querySelector('.sidebar-bottom button'));
  await until(() => document.querySelector('dialog.uid-dialog[open]'));
  expect(document.querySelector('dialog.uid-dialog[open]')).toBeTruthy();
  expect(document.querySelector('.uid-dialog').getAttribute('aria-labelledby')).toBe(
    'uid-dialog-title',
  );
  expect(document.activeElement.id).toBe('uid-dialog-input');
  expect(document.querySelector('.uid-dialog-footer .button-primary').disabled).toBe(true);
  await input(` ${uid} `);
  await submit();
  await until(() => !!document.querySelector('.uid-preview'));
  expect(document.querySelector('.uid-preview').textContent).toContain('Hu Tao');
  expect(localStorage.getItem(storageKey)).toBeNull();
  expect(window.location.pathname).toBe('/');
  await click(document.querySelector('.uid-dialog-footer .button-primary'));
  await until(() => window.location.pathname === `/u/${uid}` && buttons('Switch UID').length > 0);
  expect(JSON.parse(localStorage.getItem(storageKey)).uid).toBe(uid);
  expect(document.querySelector('.uid-dialog')).toBeNull();
  expect(transport).toHaveBeenCalledTimes(1);
  expect(transport.mock.calls[0][0]).toContain(`/showcase/${uid}`);
  expect(transport.mock.calls[0][1].credentials).toBe('omit');
});

it('resumes the last added UID; switching previews and cancellation preserve the current build and UID', async () => {
  localStorage.setItem(storageKey, JSON.stringify({ version: 2, uid }));
  const transport = vi.fn(async (url) => response(data(url.endsWith(otherUid) ? otherUid : uid)));
  vi.stubGlobal('fetch', transport);
  await mount();
  await until(
    () => text().includes('Synthetic Traveler') && window.location.pathname === `/u/${uid}`,
  );
  await click(
    [...document.querySelectorAll('a')].find(
      (link) => link.textContent.trim() === 'Public profile',
    ),
  );
  await until(() => document.querySelector('[aria-label="View Hu Tao details"]'));
  await click(document.querySelector('[aria-label="View Hu Tao details"]'));
  await until(() => !!document.querySelector('.character-build-detail'));
  expect(document.querySelectorAll('.character-build-detail h1')).toHaveLength(1);
  expect(document.querySelectorAll('.build-artifact')).toHaveLength(5);
  expect(document.querySelector('#companion-content').textContent).not.toContain('Switch UID');
  expect(document.querySelector('#companion-content').textContent).not.toContain(
    'Refresh Showcase',
  );
  const previousPath = window.location.pathname;
  const trigger = document.querySelector('.sidebar-bottom button');
  trigger.focus();
  await click(trigger);
  await input(otherUid);
  await submit();
  await until(() => document.querySelector('.uid-preview')?.textContent.includes('Skirk'));
  expect(window.location.pathname).toBe(previousPath);
  expect(JSON.parse(localStorage.getItem(storageKey)).uid).toBe(uid);
  await click(buttons('Cancel')[0]);
  expect(document.querySelector('.uid-dialog')).toBeNull();
  expect(document.activeElement).toBe(trigger);
  expect(window.location.pathname).toBe(previousPath);
  await click(trigger);
  await input(otherUid);
  await submit();
  await until(() => !!document.querySelector('.uid-preview'));
  await click(document.querySelector('.uid-dialog-footer .button-primary'));
  await until(() => window.location.pathname === `/u/${otherUid}`);
  expect(JSON.parse(localStorage.getItem(storageKey)).uid).toBe(otherUid);
  await click(
    [...document.querySelectorAll('a')].find((link) => link.textContent.trim() === 'Characters'),
  );
  await until(() => document.querySelector('.collection-card'));
  expect(document.querySelector('#companion-content').textContent).toContain('Skirk');
  expect(document.querySelector('#companion-content').textContent).not.toContain('Hu Tao');
  expect(transport).toHaveBeenCalledTimes(2);
});

it('validates input, handles network and rate-limit errors, and never enables Add on a failed lookup', async () => {
  const transport = vi
    .fn()
    .mockRejectedValueOnce(new Error('Synthetic offline'))
    .mockResolvedValueOnce(
      response({
        ...data(),
        snapshot: null,
        delivery: 'unavailable',
        issue: { code: 'ENKA_429', status: 429, message: 'Please wait for Enka.' },
      }),
    );
  vi.stubGlobal('fetch', transport);
  await mount();
  await click(document.querySelector('.sidebar-bottom button'));
  await input('invalid');
  await submit();
  expect(text()).toContain('9- or 10-digit');
  expect(transport).not.toHaveBeenCalled();
  await input(uid);
  await submit();
  await until(() => text().includes('Could not reach'));
  expect(document.querySelector('.uid-dialog-footer .button-primary').disabled).toBe(true);
  await submit();
  await until(() => text().includes('Please wait for Enka.'));
  expect(document.querySelector('.uid-search-row button').disabled).toBe(true);
  expect(document.querySelector('.uid-dialog-footer .button-primary').disabled).toBe(true);
  await submit();
  expect(transport).toHaveBeenCalledTimes(2);
  await input(otherUid);
  expect(document.querySelector('.uid-search-row button').disabled).toBe(false);
  expect(localStorage.getItem(storageKey)).toBeNull();
});

it('explains empty or hidden showcases and allows adding the profile without fabricated characters', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response(data(uid, true))),
  );
  await mount('/?add=characters');
  await until(() => document.querySelector('.uid-dialog'));
  await input(uid);
  await submit();
  await until(() => !!document.querySelector('.uid-preview'));
  expect(document.querySelector('.uid-preview').textContent).toContain('empty or private');
  expect(document.querySelector('.uid-preview-grid')).toBeNull();
  await click(document.querySelector('.uid-dialog-footer .button-primary'));
  await until(() => window.location.pathname === `/u/${uid}`);
  expect(window.location.search).toBe('');
});

it('deduplicates repeated submits and closing an in-flight search never adds the UID', async () => {
  let finish;
  const transport = vi.fn(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  vi.stubGlobal('fetch', transport);
  await mount();
  await click(document.querySelector('.sidebar-bottom button'));
  await input(uid);
  await submit();
  await submit();
  expect(transport).toHaveBeenCalledTimes(1);
  expect(document.getElementById('uid-dialog-input').disabled).toBe(true);
  await act(async () =>
    document.querySelector('.uid-dialog').dispatchEvent(new Event('cancel', { cancelable: true })),
  );
  expect(document.querySelector('.uid-dialog')).toBeNull();
  await act(async () => finish(response(data())));
  expect(window.location.pathname).toBe('/');
  expect(localStorage.getItem(storageKey)).toBeNull();
});

it('rejects a mismatched provider UID and invalidates a successful preview when the input changes', async () => {
  const transport = vi
    .fn()
    .mockResolvedValueOnce(response(data(otherUid)))
    .mockResolvedValueOnce(response(data()));
  vi.stubGlobal('fetch', transport);
  await mount();
  await click(document.querySelector('.sidebar-bottom button'));
  await input(uid);
  await submit();
  await until(() => text().includes('Could not reach'));
  expect(document.querySelector('.uid-dialog-footer .button-primary').disabled).toBe(true);
  await submit();
  await until(() => !!document.querySelector('.uid-preview'));
  await input(otherUid);
  expect(document.querySelector('.uid-preview')).toBeNull();
  expect(document.querySelector('.uid-dialog-footer .button-primary').disabled).toBe(true);
  expect(localStorage.getItem(storageKey)).toBeNull();
});
