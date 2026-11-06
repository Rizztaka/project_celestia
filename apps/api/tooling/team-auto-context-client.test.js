/* global document */
import { createRequire } from 'node:module';

import { JSDOM } from 'jsdom';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';

import { defaultTeamSearchPreferences } from '../../../packages/api-contracts/src/genshin/team-preferences.ts';
import { teamPreferencesKey, writeTeamPreferences } from '../../web/src/lib/team-preferences.ts';
import { analysisFixture } from './build-analysis-fixtures.mjs';

const mocked = vi.hoisted(() => ({ search: vi.fn() }));
vi.mock('../../web/src/lib/team-damage/service.ts', () => ({
  searchTeamCandidates: (...args) => mocked.search(...args),
}));
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:3000/' });
function installDom() {
  for (const name of ['window', 'document', 'navigator', 'HTMLElement', 'Event'])
    vi.stubGlobal(name, dom.window[name]);
}
installDom();
const { createElement: h, act } = require('react');
const { createRoot } = require('react-dom/client');
const uid = '800000001';
const observedAt = '2026-10-25T10:00:00Z';
let Generator, QueryClient, QueryClientProvider, queryClient, root, records, onSave, pending;
beforeAll(async () => {
  ({ default: Generator } = await import('../../web/src/components/TeamAutoGenerator.tsx'));
  ({ QueryClient, QueryClientProvider } =
    await import('../../web/node_modules/@tanstack/react-query/build/modern/index.js'));
});
beforeEach(() => {
  installDom();
  vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
  dom.window.localStorage.clear();
  vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-25T12:00:00Z'));
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  records = analysisFixture(uid).snapshot.characters.map((character) => ({
    uid,
    observedAt,
    character,
  }));
  onSave = vi.fn().mockResolvedValue(undefined);
  pending = [];
  mocked.search.mockReset();
  mocked.search.mockImplementation((candidates, samples) => {
    let resolve, reject;
    const promise = new Promise((done, fail) => {
      resolve = done;
      reject = fail;
    });
    const job = { promise, cancel: vi.fn(), candidates, samples, resolve, reject };
    pending.push(job);
    return job;
  });
});
afterEach(async () => {
  await act(async () => root.unmount());
  queryClient.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
afterAll(() => dom.window.close());
async function render(targetUid = uid, input = records) {
  await act(async () =>
    root.render(
      h(
        QueryClientProvider,
        { client: queryClient },
        h(Generator, { uid: targetUid, records: input, onSave }),
      ),
    ),
  );
}
async function click(label) {
  const button = [...document.querySelectorAll('button')].find(
    (entry) => entry.textContent === label,
  );
  expect(button, label).toBeTruthy();
  await act(async () => button.click());
}
async function finish(job, dps = 12345) {
  await act(async () =>
    job.resolve({
      tested: job.candidates.length,
      failed: 0,
      samples: job.samples,
      ranked: [{ id: job.candidates[0].id, result: { dps } }],
    }),
  );
}
async function openPreferences() {
  await act(async () => document.querySelector('.team-preferences > summary').click());
}
function checkbox(label) {
  return [...document.querySelectorAll('input[type="checkbox"]')].find((input) =>
    [...input.labels].some((element) => element.textContent.replace(/\s+/g, ' ').trim() === label),
  );
}
async function toggle(label) {
  const input = checkbox(label);
  expect(input, label).toBeTruthy();
  await act(async () => {
    input.focus();
    input.click();
  });
}
async function select(selector, value) {
  await act(async () => {
    const input = document.querySelector(selector);
    if (input.tagName === 'INPUT')
      Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, 'value').set.call(
        input,
        value,
      );
    else input.value = value;
    input.dispatchEvent(
      new dom.window.Event(input.tagName === 'INPUT' ? 'input' : 'change', { bubbles: true }),
    );
  });
}

it('discloses partial account scope and clears completed results when a build changes', async () => {
  await render();
  expect(document.body.textContent).toContain('partial public roster');
  expect(document.body.textContent).toContain('may still be owned');
  await click('Generate best teams');
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results')).toBeTruthy();
  const next = structuredClone(records);
  next[0].character.constellation = 6;
  await render(uid, next);
  expect(document.querySelector('.team-auto-results')).toBeNull();
  expect(onSave).not.toHaveBeenCalled();
});

it('cancels searches on refresh and ignores late results from the previous evidence', async () => {
  await render();
  await click('Generate best teams');
  const previous = pending[0];
  const next = records.map((record) => ({ ...record, observedAt: '2026-10-25T11:00:00Z' }));
  await render(uid, next);
  expect(previous.cancel).toHaveBeenCalledOnce();
  await click('Generate best teams');
  await finish(previous);
  expect(document.querySelector('.team-auto-results')).toBeNull();
  expect(document.body.textContent).toContain('Generating…');
  await finish(pending[1], 20000);
  expect(document.querySelector('.team-auto-results').textContent).toContain(
    `${(20000).toLocaleString(undefined, { maximumFractionDigits: 0 })} DPS`,
  );
});

it('preserves controls across refresh, and sample changes clear results before relabelling', async () => {
  await render();
  const select = document.querySelector('select[name="verificationSamples"]');
  await act(async () => {
    select.value = '10';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  await click('Generate best teams');
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results').textContent).toContain('10 samples');
  await act(async () => {
    select.value = '20';
    select.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  });
  expect(document.querySelector('.team-auto-results')).toBeNull();
  await render(
    uid,
    records.map((record) => ({ ...record, observedAt: '2026-10-25T11:00:00Z' })),
  );
  expect(document.querySelector('select[name="verificationSamples"]').value).toBe('20');
});

it('keeps a cancelled search from clearing the running state of a new search', async () => {
  await render();
  await click('Generate best teams');
  const previous = pending[0];
  await click('Cancel search');
  expect(previous.cancel).toHaveBeenCalledOnce();
  await click('Generate best teams');
  await act(async () => previous.reject(new Error('Cancelled')));
  expect(document.body.textContent).toContain('Generating…');
  expect(document.querySelector('[role="alert"]')).toBeNull();
  await finish(pending[1]);
  expect(document.querySelector('.team-auto-results')).toBeTruthy();
});

it('cancels on UID switches and unmount without saving an automatic result', async () => {
  await render();
  await click('Generate best teams');
  await render(
    '800000002',
    records.map((record) => ({ ...record, uid: '800000002' })),
  );
  expect(pending[0].cancel).toHaveBeenCalledOnce();
  await click('Generate best teams');
  await render('800000002', []);
  expect(pending[1].cancel).toHaveBeenCalledOnce();
  await finish(pending[1]);
  expect(document.querySelector('.team-auto-results')).toBeNull();
  expect(onSave).not.toHaveBeenCalled();
});

it('recovers from synchronous setup failure and allows a retry', async () => {
  await render();
  mocked.search.mockImplementationOnce(() => {
    throw new Error('Simulator unavailable');
  });
  await click('Generate best teams');
  expect(document.querySelector('[role="alert"]').textContent).toBe('Simulator unavailable');
  expect(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Generate best teams',
    ).disabled,
  ).toBe(false);
  await click('Generate best teams');
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results')).toBeTruthy();
});

it('persists favorites, hard constraints and controls per UID and uses them for generation', async () => {
  await render();
  await openPreferences();
  await toggle('Favorite Furina');
  await toggle('Require Escoffier');
  await toggle('Exclude Dahlia');
  await select('.team-preferences select', 'favorites');
  await select('select[name="mainDps"]', '10000114:11401');
  await select('select[name="verificationSamples"]', '10');
  await click('Save preferences');
  await click('Generate best teams');
  expect(pending[0].candidates).toHaveLength(2);
  expect(
    pending[0].candidates.every((candidate) => !candidate.config.includes('dahlia char')),
  ).toBe(true);
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results').textContent).toContain('1 favorite');
  await act(async () => root.unmount());
  root = createRoot(document.getElementById('root'));
  await render();
  await openPreferences();
  expect(checkbox('Favorite Furina').checked).toBe(true);
  expect(checkbox('Require Escoffier').checked).toBe(true);
  expect(checkbox('Exclude Dahlia').checked).toBe(true);
  expect(document.querySelector('select[name="mainDps"]').value).toBe('10000114:11401');
  expect(document.querySelector('select[name="verificationSamples"]').value).toBe('10');
  await render(
    '800000002',
    records.map((record) => ({ ...record, uid: '800000002' })),
  );
  expect(checkbox('Favorite Furina').checked).toBe(false);
  expect(checkbox('Require Escoffier').checked).toBe(false);
  expect(document.querySelector('select[name="verificationSamples"]').value).toBe('5');
});

it('cancels a running search on preference changes while preserving editor focus and search', async () => {
  await render();
  await openPreferences();
  await select('.team-preferences input[type="search"]', 'Furina');
  await click('Generate best teams');
  await toggle('Favorite Furina');
  expect(pending[0].cancel).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(checkbox('Favorite Furina'));
  expect(document.querySelector('.team-preferences').open).toBe(true);
  expect(document.querySelector('.team-preferences input[type="search"]').value).toBe('Furina');
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results')).toBeNull();
});

it('retains local edits when another tab saves preferences and requires an explicit reload', async () => {
  await render();
  await openPreferences();
  await toggle('Favorite Furina');
  const remote = { ...defaultTeamSearchPreferences(uid), favoriteCharacters: ['avatar:10000112'] };
  await act(async () => writeTeamPreferences(uid, remote, null));
  await toggle('Exclude Dahlia');
  expect(checkbox('Favorite Furina').checked).toBe(true);
  expect(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Save preferences',
    ).disabled,
  ).toBe(true);
  expect(JSON.parse(dom.window.localStorage.getItem(teamPreferencesKey(uid)))).toEqual(remote);
  await click('Use saved preferences');
  expect(checkbox('Favorite Furina').checked).toBe(false);
  expect(checkbox('Favorite Escoffier').checked).toBe(true);
  expect(checkbox('Exclude Dahlia').checked).toBe(false);
});

it('keeps unreadable saved preferences while allowing temporary search choices', async () => {
  dom.window.localStorage.setItem(teamPreferencesKey(uid), 'unreadable');
  await render();
  await openPreferences();
  await toggle('Favorite Furina');
  expect(checkbox('Favorite Furina').checked).toBe(true);
  expect(
    [...document.querySelectorAll('button')].find(
      (button) => button.textContent === 'Save preferences',
    ).disabled,
  ).toBe(true);
  await click('Generate best teams');
  await finish(pending[0]);
  expect(document.querySelector('.team-auto-results')).toBeTruthy();
  expect(dom.window.localStorage.getItem(teamPreferencesKey(uid))).toBe('unreadable');
});

it('renders statistical tie badge, error margin, and rotation timeline in recommendation cards', async () => {
  await render();
  await click('Generate best teams');
  expect(pending.length).toBe(1);
  const job = pending[0];
  await act(async () =>
    job.resolve({
      tested: job.candidates.length,
      failed: 0,
      samples: job.samples,
      ranked: [
        {
          id: job.candidates[0].id,
          dps: 54000,
          isStatisticallyTied: true,
          result: { dps: 54000, errorMargin: 850 },
        },
      ],
    }),
  );
  expect(document.querySelector('.stat-tie-pill')).toBeTruthy();
  expect(document.querySelector('.stat-tie-pill').textContent).toBe('Statistical Tie');
  expect(document.querySelector('.team-stats-row strong').textContent).toContain('± 850');
  expect(document.querySelector('.rotation-timeline-wrapper')).toBeTruthy();
  expect(document.querySelector('.rotation-timeline-title').textContent).toContain(
    'Synthesized Defensible Rotation',
  );
});
