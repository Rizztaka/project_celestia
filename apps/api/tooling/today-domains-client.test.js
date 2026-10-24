/* global document */
import { createRequire } from 'node:module';

import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { syntheticShowcase } from '../src/games/genshin/showcase/showcase.fixtures.js';
import { parseShowcase } from '../src/games/genshin/showcase/showcase.parser.js';
import { buildTodayDomainCatalog } from './build-today-domains.mjs';

const require = createRequire(new URL('../../web/package.json', import.meta.url));
const dataRequire = createRequire(import.meta.url);
const catalog = dataRequire('../src/games/genshin/static/progression-catalog.json');
const projected = dataRequire('../../web/src/lib/today-domain-matches.json');
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });
function installDom() {
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Event'])
    vi.stubGlobal(name, dom.window[name]);
}
installDom();
const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');
const { MemoryRouter } = require('react-router-dom');
const uid = '800000001';
const characters = parseShowcase(uid, syntheticShowcase()).snapshot.characters;
let TodayDomains, model, root;
beforeAll(async () => {
  ({ default: TodayDomains } = await import('../../web/src/components/TodayDomains.tsx'));
  model = await import('../../web/src/lib/today-domains.ts');
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  vi.stubGlobal('fetch', vi.fn());
  vi.useFakeTimers();
  // Tuesday at 20:00 in Asia. Hu Tao's talents are available today.
  vi.setSystemTime(new Date('2026-10-20T12:00:00Z'));
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => {
  await act(async () => root.unmount());
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
afterAll(() => dom.window.close());
const text = () => document.body.textContent;
async function mount(props = {}) {
  await act(async () => root.render(h(MemoryRouter, null, h(TodayDomains, props))));
}
async function click(label) {
  const button = [...document.querySelectorAll('button')].find(
    (element) => (element.getAttribute('aria-label') ?? element.textContent) === label,
  );
  expect(button).toBeTruthy();
  await act(async () => button.click());
}
async function server(value) {
  await act(async () => {
    const select = document.querySelector('select');
    select.value = value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

it('reproduces the offline catalog and joins Hu Tao, her weapon, and Columbina by game ID', () => {
  expect(projected).toEqual(buildTodayDomainCatalog(catalog));
  const diligence = model.todayDomains.find((domain) =>
    domain.dropKeys.includes('TeachingsOfDiligence'),
  );
  const aerosiderite = model.todayDomains.find((domain) =>
    domain.dropKeys.includes('GrainOfAerosiderite'),
  );
  expect(model.charactersForDomain(diligence, characters)).toHaveLength(1);
  expect(model.charactersForDomain(aerosiderite, characters)).toHaveLength(1);
  expect(projected.characters['10000125']).toEqual(
    expect.arrayContaining([expect.stringContaining('LightlessCapital')]),
  );
  const unknown = [
    { ...characters[0], id: 99999999, weapon: { ...characters[0].weapon, id: 99999 } },
  ];
  expect(model.charactersForDomain(diligence, unknown)).toHaveLength(0);
  expect(model.charactersForDomain(aerosiderite, unknown)).toHaveLength(0);
  expect(model.missingFarmingMappings(unknown)).toBe(true);
  expect(projected.characters['10000005']).toBeUndefined();
});

it.each([
  ['asia', '2026-10-24T20:00:00Z'],
  ['america', '2026-10-25T09:00:00Z'],
  ['europe', '2026-10-25T03:00:00Z'],
  ['tw_hk_mo', '2026-10-24T20:00:00Z'],
])('changes from Saturday to Sunday exactly at 04:00 on %s', (selectedServer, reset) => {
  const boundary = Date.parse(reset);
  expect(model.farmingClock(boundary - 1, selectedServer)).toEqual({
    weekday: 5,
    nextReset: boundary,
  });
  expect(model.farmingClock(boundary, selectedServer)).toEqual({
    weekday: 6,
    nextReset: boundary + 86400000,
  });
  expect(model.resetCountdown(boundary, boundary - 1)).toBe('00:00:01');
  expect(model.resetCountdown(boundary, boundary + 1)).toBe('00:00:00');
  expect(model.todayDomains.every((domain) => domain.days.includes(6))).toBe(true);
});

it('infers supported servers conservatively, including ten-digit Asia UIDs', () => {
  expect(
    ['600000001', '700000001', uid, '1800000001', '900000001'].map(model.farmingServer),
  ).toEqual(['america', 'europe', 'asia', 'asia', 'tw_hk_mo']);
  expect(model.farmingServer('100000001')).toBeNull();
  expect(model.farmingServer()).toBeNull();
});

it('shows roster material matches and build links; switching day and scope makes no API requests', async () => {
  await mount({ uid, characters });
  expect(text()).toContain('Available today');
  expect(text()).toContain('Diligence');
  expect(document.querySelector('.farming-matches a').getAttribute('href')).toBe(
    `/u/${uid}/character/10000046%3A4601`,
  );
  expect(text()).toContain('No matching materials on this day');
  await click('Wednesday');
  expect(text()).toContain('Plan for Wednesday');
  expect(text()).toContain('Staff of Homa');
  expect(
    document.querySelector('button[aria-label="Wednesday"]').getAttribute('aria-pressed'),
  ).toBe('true');
  await click('All materials');
  expect(document.querySelectorAll('.farming-domain').length).toBeGreaterThan(2);
  expect(document.querySelectorAll('.farming-expand')).toHaveLength(2);
  const expand = document.querySelector('.farming-expand');
  await act(async () => expand.click());
  expect(expand.getAttribute('aria-expanded')).toBe('true');
  await click('Sunday');
  expect(text()).toContain('All material families available');
  await click('Back to today');
  expect(text()).toContain('Available today');
  expect(fetch).not.toHaveBeenCalled();
});

it('allows guests and empty rosters to browse without a login or invented matches', async () => {
  await mount();
  expect(text()).toContain('Add your UID to find materials');
  expect(text()).toContain('Standard domain rotation');
  expect(document.querySelector('.farming-scope button').disabled).toBe(true);
  expect(document.querySelector('.farming-matches')).toBeNull();
  await server('america');
  expect(document.querySelector('select').value).toBe('america');
  expect(fetch).not.toHaveBeenCalled();
});

it('updates the live day at reset, retains an explicitly browsed day, and follows a server change', async () => {
  vi.setSystemTime(new Date('2026-10-24T19:59:59Z'));
  await mount({ uid, characters });
  expect(document.querySelector('[aria-label="Saturday (today)"]')).not.toBeNull();
  await act(async () => vi.advanceTimersByTime(1100));
  expect(
    document.querySelector('[aria-label="Sunday (today)"][aria-pressed="true"]'),
  ).not.toBeNull();
  expect(text()).toContain('All material families available');
  await click('Monday');
  await act(async () => vi.advanceTimersByTime(86400000));
  expect(text()).toContain('Plan for Monday');
  await server('america');
  expect(text()).toContain('Plan for Monday');
  await click('Back to today');
  expect(
    document.querySelector('[aria-label="Sunday (today)"][aria-pressed="true"]'),
  ).not.toBeNull();
});
