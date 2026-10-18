// Synthetic read-only browser checks against the normal production web build.
// Usage: node tooling/ui-browser-check.mjs <absolute playwright package> <evidence directory>
/* global document, innerWidth, getComputedStyle, DOMMatrix, devicePixelRatio, location */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { createInterface } from 'node:readline';

const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const output = resolve(process.argv[3]);
const nativeZoom = process.argv[4] === '--native-zoom';
mkdirSync(output, { recursive: true });
const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const vite = resolve(webRequire.resolve('vite/package.json'), '../bin/vite.js');
const base = 'http://127.0.0.1:45469';
const web = spawn(
  process.execPath,
  [vite, 'preview', '--host', '127.0.0.1', '--port', '45469', '--strictPort'],
  {
    cwd: new URL('../../web', import.meta.url),
    windowsHide: true,
    stdio: 'pipe',
  },
);
const results = {
  build: 'production Vite preview',
  fixture: 'Synthetic API interception; no backend writes',
  viewportChecks: [],
  interactions: [],
  artwork: [],
  pageErrors: [],
};
const user = {
  id: 'synthetic-ui-owner',
  username: 'Traveler',
  email: 'ui@example.invalid',
  createdAt: '2026-10-18T00:00:00Z',
  emailVerifiedAt: '2026-10-18T00:00:00Z',
};
const keys = [
  'Bennett',
  'Neuvillette',
  'Navia',
  'Jean',
  'Noelle',
  'Arlecchino',
  'Mavuika',
  'Xilonen',
  'Mualani',
  'Xiangling',
  'Xingqiu',
  'TravelerGeo',
];
const characters = keys.map((key, i) => ({
  id: key,
  characterKey: key,
  level: 80,
  ascension: 6,
  constellation: i % 7,
  talentNormal: 6,
  talentSkill: 8,
  talentBurst: 9,
  equippedWeapon: { weaponKey: 'TheCatch', level: 90, ascension: 6, refinement: 5 },
}));
const weapons = ['StaffOfHoma', 'TheCatch', 'ThrillingTalesOfDragonSlayers', 'FavoniusSword'].map(
  (weaponKey) => ({
    id: weaponKey,
    weaponKey,
    level: 80,
    ascension: 6,
    refinement: 5,
    locked: true,
    equippedCharacterId: null,
  }),
);
const now = Date.parse('2026-10-18T12:00:00Z');
const iso = (offset) => new Date(now + offset).toISOString();
const period = {
  serverId: 'asia',
  serverNow: iso(0),
  dailyPeriodId: 'synthetic-day',
  weeklyPeriodId: 'synthetic-week',
  dailyStart: iso(-16 * 3600000),
  dailyEnd: iso(8 * 3600000),
  weeklyStart: iso(-6 * 86400000),
  weeklyEnd: iso(8 * 3600000),
  serverWeekday: 6,
};
const tasks = [
  { id: 'commissions', label: 'Daily commissions', cadence: 'daily', done: false },
  { id: 'teapot', label: 'Check Teapot', cadence: 'daily_reminder', done: true },
];
let resinAmount = 160;
const routine = () => ({
  contractVersion: 2,
  revision: 1,
  serverNow: iso(0),
  serverId: 'asia',
  period,
  clockStatus: 'available',
  tasks,
  legacy: null,
  resin: {
    known: true,
    checkpointAmount: resinAmount,
    recordedAt: iso(0),
    regenIntervalMs: 480000,
    cap: 200,
    capAt: iso((200 - resinAmount) * 480000),
  },
  weeklyClaims: { rewardClaims: 2 },
});
const goal = {
  id: 'synthetic-goal',
  revision: 1,
  targetKey: 'Neuvillette',
  goalType: 'CHARACTER_ASCENSION',
  fromPhase: 5,
  toPhase: 6,
  priority: 1,
  status: 'active',
  limitations: [],
};
const plan = () => ({
  contractVersion: 1,
  revision: 1,
  routineRevision: 1,
  serverNow: iso(0),
  serverId: 'asia',
  period,
  preferences: { dailyResinBudget: null, enabledRoutineKinds: ['commissions', 'teapot'] },
  goals: [{ goal, dismissed: [] }],
  goalRevisions: [{ id: goal.id, revision: 1 }],
  routines: tasks.map((task) => ({ kind: task.id, task, scope: 'day', dismissed: false })),
  weekly: { available: true, rewardClaims: 2 },
});
const receipt = { status: 'unknown', importedAt: null, source: null, entryCount: null };
const apiData = (path) => {
  if (path.endsWith('/auth/me')) return user;
  if (path.endsWith('/auth/sessions')) return [];
  if (path.endsWith('/auth/oauth/providers')) return { discord: false, google: false };
  if (path.endsWith('/characters')) return { characters, total: characters.length };
  if (path.endsWith('/weapons')) return { weapons, total: weapons.length };
  if (path.endsWith('/artifacts')) return { artifacts: [], total: 0 };
  if (path.endsWith('/focus')) return [];
  if (path.endsWith('/import/status')) return { sections: [] };
  if (path.endsWith('/companion/routine')) return routine();
  if (path.endsWith('/companion/plan')) return plan();
  if (path.endsWith('/companion/goals')) return [];
  if (path.endsWith('/companion/events'))
    return {
      availability: { available: false, reason: 'Synthetic fixture' },
      events: [],
      patch: 'fixture',
      totalUnclaimedPrimogems: 0,
    };
  if (path.endsWith('/equipment'))
    return {
      contractVersion: 1,
      character: {
        characterKey: 'Bennett',
        level: 80,
        ascension: 6,
        constellation: 3,
        talents: { normal: 6, skill: 8, burst: 9 },
      },
      provenance: { characters: receipt, weapons: receipt, artifacts: receipt },
      weapon: { state: 'recorded_assigned', item: weapons[1] },
      artifacts: Object.fromEntries(
        ['flower', 'plume', 'sands', 'goblet', 'circlet'].map((slot) => [
          slot,
          { state: 'unknown', item: null },
        ]),
      ),
      artifactRelationsConsistent: true,
      unrecognizedSlots: [],
    };
};
let browser;
const check = (condition, message) => assert.ok(condition, message);
async function setup(width, artwork = 'blocked') {
  const context = await browser.newContext({
    viewport: nativeZoom ? null : { width, height: 900 },
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() =>
    localStorage.setItem(
      'celestia_auth',
      JSON.stringify({ state: { token: 'synthetic-ui-only', isAuthenticated: true }, version: 0 }),
    ),
  );
  await context.route('**/api/v1/**', async (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204 });
    assert.equal(route.request().method(), 'GET', 'Browser check must not mutate any API state');
    const data = apiData(new URL(route.request().url()).pathname);
    await route.fulfill({
      status: data === undefined ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        data === undefined
          ? { success: false, error: { message: 'Synthetic advice unavailable', code: 'FIXTURE' } }
          : { success: true, data },
      ),
    });
  });
  const attempts = [];
  await context.route(
    /https:\/\/(enka\.network\/ui|upload-os-bbs\.mihoyo\.com\/game_record\/genshin|gi\.yatta\.moe\/assets\/UI)\//,
    async (route) => {
      attempts.push(route.request().url());
      if (artwork === 'live') return route.continue();
      if (artwork === 'secondary' && route.request().url().includes('upload-os-bbs.mihoyo.com'))
        return route.fulfill({
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
            'base64',
          ),
        });
      if (artwork === 'stalled' && route.request().url().includes('enka.network'))
        await new Promise((done) => setTimeout(done, 10000));
      return route.abort();
    },
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => results.pageErrors.push(error.message));
  return { context, page, attempts };
}
async function visit(page, path) {
  await page.goto(base + path);
  await page.locator('#companion-content h1').waitFor();
}
async function reflow(page, label, width) {
  const dimensions = await page.evaluate(() => ({
    viewport: innerWidth,
    scroll: document.documentElement.scrollWidth,
    header: document.querySelector('.companion-header').getBoundingClientRect().height,
    clipping: [...document.querySelectorAll('main *')]
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          (rect.left < -1 || rect.right > innerWidth + 1) &&
          getComputedStyle(element).position !== 'absolute'
        );
      })
      .map((element) => ({ tag: element.tagName, text: element.textContent.slice(0, 70) })),
  }));
  results.viewportChecks.push({ width, page: label, ...dimensions });
  check(dimensions.scroll <= width, `${label}: horizontal scroll at ${width}px`);
  check(
    dimensions.clipping.length === 0,
    `${label}: clipped content at ${width}px: ${JSON.stringify(dimensions.clipping)}`,
  );
  if (width === 320) check(dimensions.header < 90, 'Mobile header must remain compact');
}
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* preview starting */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  browser = await chromium.launch({
    channel: 'msedge',
    headless: !nativeZoom,
    args: nativeZoom ? ['--window-size=1296,1000'] : [],
  });
  if (nativeZoom) {
    const { page } = await setup(1280, 'live');
    await visit(page, '/roster');
    console.log('Native zoom browser ready; read-only snapshot commands accepted on stdin.');
    results.nativeMeasurements = [];
    const input = createInterface({ input: process.stdin, crlfDelay: Infinity });
    for await (const command of input) {
      if (command === 'stop') {
        input.close();
        break;
      }
      if (!/^snapshot-[a-z0-9-]+$/.test(command)) continue;
      const measurement = await page.evaluate(() => ({
        viewport: innerWidth,
        scroll: document.documentElement.scrollWidth,
        devicePixelRatio,
        header: document.querySelector('.companion-header').getBoundingClientRect().height,
        path: location.pathname,
        drawer: !!document.querySelector('dialog[open]'),
      }));
      await page.screenshot({ path: resolve(output, command + '.png') });
      results.nativeMeasurements.push({ label: command, ...measurement });
      console.log(JSON.stringify({ label: command, ...measurement }));
    }
  } else {
    for (const width of [1280, 640, 320]) {
      const { context, page } = await setup(width);
      for (const [path, label] of [
        ['/', 'Today'],
        ['/roster', 'Characters'],
        ['/inventory', 'Inventory'],
        ['/roster/Bennett', 'Character equipment'],
        ['/planner?tab=daily', 'Planner daily'],
        ['/planner?tab=weekly', 'Planner weekly'],
        ['/planner?tab=farming', 'Planner farming'],
        ['/planner?tab=events', 'Planner events'],
        ['/profile', 'Settings'],
      ]) {
        await visit(page, path);
        await reflow(page, label, width);
        if (path === '/roster' || path === '/')
          await page.screenshot({
            path: resolve(output, `${label.toLowerCase()}-${width}.png`),
            fullPage: false,
          });
        if (path === '/profile') {
          for (const [trigger, form] of [
            ['Export account data', 'Authorize account export'],
            ['Review account deletion', 'Confirm account deletion'],
          ]) {
            const button = page.getByRole('button', { name: trigger, exact: true });
            await button.click();
            const region = page.getByRole('form', { name: form });
            await region.waitFor();
            check(
              await region
                .getByLabel('Current password')
                .evaluate((element) => element === document.activeElement),
              'Password must receive focus',
            );
            await reflow(page, form, width);
            await region.getByRole('button', { name: 'Cancel', exact: true }).click();
            check(
              await button.evaluate((element) => element === document.activeElement),
              'Cancel must restore trigger focus',
            );
          }
        }
      }
      if (width === 320) {
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        const drawer = page.getByRole('dialog', { name: 'Navigation' });
        check(await drawer.isVisible(), 'Drawer must open');
        await page.screenshot({ path: resolve(output, 'drawer-320.png') });
        for (let i = 0; i < 16; i++) {
          await page.keyboard.press('Tab');
          check(
            await drawer.evaluate((element) => element.contains(document.activeElement)),
            'Tab focus must remain trapped in drawer',
          );
        }
        await page.keyboard.press('Escape');
        check(!(await drawer.isVisible()), 'Escape must close drawer');
        check(
          await page
            .getByRole('button', { name: 'Menu', exact: true })
            .evaluate((element) => element === document.activeElement),
          'Escape must restore Menu focus',
        );
        await page.getByRole('button', { name: 'Menu', exact: true }).click();
        await drawer.getByRole('link', { name: 'Planner', exact: true }).click();
        await page.getByRole('heading', { name: 'Planner', exact: true }).waitFor();
        check(!(await drawer.isVisible()), 'Navigation must close drawer');
        results.interactions.push(
          '320px native modal focus trap, Escape restore and route close passed',
        );
      }
      await visit(page, '/planner?tab=daily');
      const tabs = page.getByRole('tablist', { name: 'Planner sections' });
      await tabs.getByRole('tab', { name: 'Daily', exact: true }).focus();
      for (const [key, label] of [
        ['ArrowRight', 'Weekly'],
        ['End', 'Events'],
        ['Home', 'Daily'],
        ['ArrowLeft', 'Events'],
      ]) {
        await page.keyboard.press(key);
        const selected = tabs.getByRole('tab', { selected: true });
        check((await selected.innerText()).includes(label), `Tab ${key} must select ${label}`);
        check(
          await selected.evaluate((element) => element === document.activeElement),
          'Selected tab must receive focus',
        );
        const id = await selected.getAttribute('aria-controls');
        check(await page.locator(`#${id}`).isVisible(), 'Controlled panel must be visible');
      }
      await visit(page, '/inventory');
      await page.getByRole('tab', { name: /Weapons/ }).focus();
      await page.keyboard.press('ArrowRight');
      check(
        await page.getByRole('tab', { name: /Artifacts/, selected: true }).isVisible(),
        'Inventory tab keyboard selection',
      );
      results.interactions.push(
        `${width}px account cancellations and Planner/Inventory tab keys passed`,
      );
      await context.close();
    }
    for (const amount of [119, 120, 159, 160, 200]) {
      resinAmount = amount;
      const { context, page } = await setup(320);
      await visit(page, '/');
      const meter = page.getByRole('meter', { name: 'Estimated Original Resin' });
      await meter.waitFor();
      assert.equal(await meter.getAttribute('value'), String(amount));
      const color =
        amount >= 160 ? 'text-rose-300' : amount >= 120 ? 'text-amber-300' : 'text-emerald-300';
      check(
        await meter.evaluate((element, value) => element.classList.contains(value), color),
        'Resin threshold color',
      );
      const announcement = page
        .locator('[aria-live="polite"]')
        .filter({ hasText: 'Resin will cap' });
      if (amount < 200)
        check(
          (await announcement.innerText()).includes('hours'),
          'Recovery ETA needs human-readable units',
        );
      await context.close();
    }
    results.interactions.push(
      'Resin 119/120/159/160/200 thresholds and named meters passed; cap remains 200',
    );
    for (const scenario of ['secondary', 'blocked', 'stalled', 'live']) {
      const { context, page, attempts } = await setup(320, scenario);
      await visit(page, '/roster?q=Bennett');
      const avatar = page.getByRole('img', {
        name: 'Bennett avatar, Pyro, Constellation 0, 4 star',
        exact: true,
      });
      await avatar.scrollIntoViewIfNeeded();
      if (scenario === 'secondary') {
        await page.waitForFunction(() => {
          const img = document.querySelector('img[alt^="Bennett avatar"]');
          return (
            img?.complete && img.naturalWidth > 0 && img.src.includes('upload-os-bbs.mihoyo.com')
          );
        });
      } else if (scenario === 'blocked' || scenario === 'stalled') {
        await page.waitForFunction(
          () => !document.querySelector('img[alt^="Bennett avatar"]'),
          {},
          { timeout: 20000 },
        );
        check((await avatar.locator('svg').count()) > 0, 'Crest must survive total CDN failure');
      } else {
        await page.waitForFunction(
          () => {
            const img = document.querySelector('img[alt^="Bennett avatar"]');
            return !img || (img.complete && img.naturalWidth > 0);
          },
          {},
          { timeout: 20000 },
        );
      }
      const loaded = (await avatar.locator('img').count()) > 0;
      await page.screenshot({
        path: resolve(output, `artwork-${scenario}-320.png`),
        fullPage: true,
      });
      results.artwork.push({
        scenario,
        loaded,
        attempts,
        note:
          scenario === 'secondary'
            ? 'Synthetic 1px PNG proves retry; not artwork fidelity'
            : undefined,
      });
      if (scenario === 'stalled')
        check(
          attempts.some((url) => url.includes('upload-os-bbs.mihoyo.com')),
          'Stall timeout must attempt secondary',
        );
      if (scenario === 'blocked') {
        const motion = await avatar.evaluate((element) => ({
          // Minification can combine the individual none transforms into an identity matrix.
          stationary:
            getComputedStyle(element).transform === 'none' ||
            new DOMMatrix(getComputedStyle(element).transform).isIdentity,
          transition: getComputedStyle(element).transitionDuration,
          animation: getComputedStyle(element).animationName,
        }));
        assert.deepEqual(motion, { stationary: true, transition: '0s', animation: 'none' });
      }
      await context.close();
    }
  }
  assert.deepEqual(results.pageErrors, []);
  results.status = nativeZoom
    ? results.nativeMeasurements.length
      ? 'observations-recorded'
      : 'not-performed'
    : 'passed';
} catch (error) {
  results.status = 'failed';
  results.failure = error.message;
  throw error;
} finally {
  writeFileSync(
    resolve(output, nativeZoom ? 'native-zoom-results.json' : 'browser-results.json'),
    JSON.stringify(results, null, 2) + '\n',
  );
  await browser?.close();
  web.kill();
}
console.log(
  JSON.stringify({
    status: results.status,
    viewportChecks: results.viewportChecks.length,
    interactions: results.interactions,
    artwork: results.artwork.map(({ scenario, loaded }) => ({ scenario, loaded })),
    evidence: output,
  }),
);
