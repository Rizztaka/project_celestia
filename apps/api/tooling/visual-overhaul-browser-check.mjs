/* global document */
// Synthetic API interception against the real production UI. No backend writes.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { calculateTheaterCast } from '../src/games/genshin/endgame/theater-rules.calculator.ts';
import { PullSimulatorService } from '../src/games/genshin/simulators/pull-simulator.service.ts';
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const output = resolve(process.argv[3]);
mkdirSync(output, { recursive: true });
const require = createRequire(new URL('../../web/package.json', import.meta.url));
const vite = resolve(require.resolve('vite/package.json'), '../bin/vite.js');
const base = 'http://127.0.0.1:45470';
const server = spawn(
  process.execPath,
  [vite, 'preview', '--host', '127.0.0.1', '--port', '45470', '--strictPort'],
  { cwd: new URL('../../web', import.meta.url), windowsHide: true, stdio: 'pipe' },
);
const elements = JSON.parse(
  readFileSync(new URL('../src/games/genshin/static/character-elements.json', import.meta.url)),
);
const keys = [
  'Mavuika',
  'Citlali',
  'Xilonen',
  'Chasca',
  'Bennett',
  'Xiangling',
  'Diluc',
  'HuTao',
  'Arlecchino',
  'Yoimiya',
  'Gaming',
  'Yanfei',
  'Dehya',
  'Neuvillette',
  'Mualani',
  'Xingqiu',
  'Yelan',
  'Furina',
  'Barbara',
  'Mona',
  'SangonomiyaKokomi',
  'Tartaglia',
  'RaidenShogun',
  'Fischl',
  'YaeMiko',
  'KukiShinobu',
  'Keqing',
  'Cyno',
  'Ororon',
  'Kachina',
];
const characters = keys.map((key) => ({
  id: key,
  characterKey: key,
  level: key === 'Kachina' ? 69 : 80,
  ascension: 6,
  constellation: 0,
  talentNormal: 6,
  talentSkill: 8,
  talentBurst: 8,
  equippedWeapon: null,
}));
const user = {
  id: 'synthetic-owner',
  username: 'Traveler',
  email: 'visual@example.invalid',
  createdAt: '2026-10-18T00:00:00Z',
  emailVerifiedAt: '2026-10-18T00:00:00Z',
};
const results = {
  fixture: 'Synthetic authenticated API responses; no real backend or account writes.',
  viewport: [],
  interactions: [],
  artwork: [],
  pageErrors: [],
};
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
  'base64',
);
let browser;
async function setup(width, artwork = 'blocked') {
  const context = await browser.newContext({
    viewport: { width, height: 960 },
    reducedMotion: 'reduce',
  });
  await context.addInitScript(() =>
    localStorage.setItem(
      'celestia_auth',
      JSON.stringify({ state: { token: 'synthetic-only', isAuthenticated: true }, version: 0 }),
    ),
  );
  const attempts = [];
  let pulls = 0;
  let failNext = false;
  await context.route('**/api/v1/**', async (route) => {
    const request = route.request(),
      path = new URL(request.url()).pathname;
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204 });
    let data;
    if (path.endsWith('/auth/me')) data = user;
    else if (path.endsWith('/characters')) data = { characters, total: characters.length };
    else if (path.endsWith('/auth/oauth/providers')) data = { discord: false, google: false };
    else if (path.endsWith('/endgame/abyss')) data = { cycles: [] };
    else if (path.endsWith('/endgame/theater')) data = { runs: [] };
    else if (path.endsWith('/simulators/banners')) data = new PullSimulatorService().getBanners();
    else if (path.endsWith('/endgame/theater/cast-preview')) {
      assert.equal(request.method(), 'POST');
      const input = request.postDataJSON();
      const result = calculateTheaterCast(
        characters.map((c) => ({ ...c, element: elements[c.characterKey] ?? null })),
        input,
      );
      data = {
        result,
        explanations: ['Synthetic response using the real pure Theater calculator.'],
      };
    } else if (path.endsWith('/simulators/simulate-pulls')) {
      assert.equal(request.method(), 'POST');
      pulls++;
      if (failNext) {
        failNext = false;
        return route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: { code: 'FIXTURE', message: 'Synthetic outage' },
          }),
        });
      }
      let index = 0;
      const stream = pulls === 1 ? [0, 0.1, 0.99] : pulls === 2 ? [0] : [];
      data = new PullSimulatorService(() => stream[index++] ?? 0.99).simulatePulls(
        request.postDataJSON(),
      );
    } else {
      assert.equal(
        request.method(),
        'GET',
        'Only synthetic cast previews and wish simulations can POST',
      );
    }
    await route.fulfill({
      status: data === undefined ? 503 : 200,
      contentType: 'application/json',
      body: JSON.stringify(
        data === undefined
          ? { success: false, error: { code: 'FIXTURE', message: 'Synthetic service unavailable' } }
          : { success: true, data },
      ),
    });
  });
  await context.route(
    /https:\/\/(enka\.network\/ui|upload-os-bbs\.mihoyo\.com\/game_record\/genshin|gi\.yatta\.moe\/assets\/UI)\//,
    async (route) => {
      const url = route.request().url();
      attempts.push(url);
      if (artwork === 'live') return route.continue();
      if (artwork === 'secondary' && url.includes('mihoyo.com'))
        return route.fulfill({ contentType: 'image/png', body: png });
      if (artwork === 'mirror' && url.includes('yatta.moe'))
        return route.fulfill({ contentType: 'image/png', body: png });
      if (artwork === 'stalled' && url.includes('enka.network'))
        await new Promise((done) => setTimeout(done, 10000));
      return route.abort();
    },
  );
  const page = await context.newPage();
  page.on('pageerror', (e) => results.pageErrors.push(e.message));
  return {
    context,
    page,
    attempts,
    pullCount: () => pulls,
    fail: () => {
      failNext = true;
    },
  };
}
async function visit(page, path) {
  await page.goto(base + path);
  await page.locator('#companion-content h1').waitFor();
}
async function reflow(page, label, width) {
  const scroll = await page.evaluate(() => document.documentElement.scrollWidth);
  const clipped = await page
    .locator('main button, main input, main select, main [role="img"]')
    .evaluateAll((elements) =>
      elements
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            (rect.left < -1 || rect.right > document.documentElement.clientWidth + 1)
          );
        })
        .map((element) => element.textContent.slice(0, 50)),
    );
  assert.deepEqual(clipped, [], label + ': interactive content must remain within the viewport');
  results.viewport.push({ label, width, scroll });
  assert.ok(scroll <= width, `${label} horizontal scroll at ${width}: ${scroll}`);
}
try {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* Preview is starting. */
    }
    await new Promise((done) => setTimeout(done, 200));
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (const width of [320, 1280]) {
    const fixture = await setup(width);
    const { context, page } = fixture;
    await visit(page, '/simulators');
    await page.getByRole('button', { name: /Epitome Invocation/ }).click();
    await page.getByLabel('Path target').waitFor();
    await reflow(page, 'Weapon simulator', width);
    await page.getByRole('button', { name: 'Wish ×1', exact: true }).click();
    await page.getByText('Fate Points: 1 / 1').waitFor();
    assert.equal(fixture.pullCount(), 1);
    await page.getByRole('button', { name: 'Wish ×1', exact: true }).click();
    await page.getByText('Fate Points: 0 / 1').waitFor();
    await page.getByRole('button', { name: 'Wish ×1', exact: true }).click();
    await page.getByText('1 / 80', { exact: true }).waitFor();
    await page.getByLabel('Path target').selectOption('StarcallersWatch');
    await page.getByText('1 / 80', { exact: true }).waitFor();
    fixture.fail();
    await page.getByRole('button', { name: 'Wish ×10', exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Synthetic outage' }).waitFor();
    await page.getByText('1 / 80', { exact: true }).waitFor();
    await page.getByRole('button', { name: 'Wish ×10', exact: true }).click();
    await page
      .getByRole('region', { name: 'Latest pull' })
      .locator('[role="img"]')
      .first()
      .waitFor();
    await page.getByRole('button', { name: /Ode to the Dawn Breeze/ }).click();
    await page.getByLabel('Path target').selectOption('Klee');
    await page.getByText('0 / 90', { exact: true }).waitFor();
    await page.screenshot({ path: resolve(output, `simulator-${width}.png`), fullPage: false });
    results.interactions.push(
      `${width}px weapon path miss→1 Fate→target guarantee, target reset retains pity, failed request preserves pity, 1x/10x controls, independent Chronicled scenario passed`,
    );
    await visit(page, '/endgame');
    await page.getByRole('button', { name: 'Imaginarium Theater', exact: true }).click();
    const workshop = page.getByRole('region', { name: 'Build your principal cast' });
    await workshop.getByRole('button', { name: 'Select qualified cast' }).click();
    await workshop.getByText('Cast ready for this preset', { exact: false }).waitFor();
    await workshop.getByLabel('Opening Cast (up to six owned characters)').selectOption('Citlali');
    await workshop
      .getByLabel('Special Guests (up to eight owned characters)')
      .selectOption('Xilonen');
    await workshop.getByText('Opening Cast', { exact: true }).waitFor();
    await workshop.getByText('Special Guest', { exact: true }).waitFor();
    assert.ok(await workshop.getByRole('button', { name: /Kachina/ }).isDisabled());
    await reflow(page, 'Theater builder', width);
    await workshop.screenshot({ path: resolve(output, `theater-${width}.png`) });
    await visit(page, '/planner?tab=farming');
    await page.getByText('48 material families', { exact: false }).waitFor();
    await reflow(page, 'Domain cards', width);
    await page.getByText('Boss atlas · Weekly and world boss drops', { exact: true }).click();
    await page.getByRole('heading', { name: 'The Knave', exact: true }).waitFor();
    await reflow(page, 'Boss atlas', width);
    await page.screenshot({ path: resolve(output, `domains-${width}.png`), fullPage: false });
    results.interactions.push(
      `${width}px Theater eligibility, opening/guest badges, level cutoff, domain cards and boss atlas passed`,
    );
    await context.close();
  }
  for (const scenario of ['secondary', 'mirror', 'blocked', 'stalled', 'live']) {
    const { context, page, attempts } = await setup(1280, scenario);
    await visit(page, '/roster?q=Mavuika');
    const frame = page.getByRole('img', {
      name: 'Mavuika avatar, Pyro, Constellation 0, 5 star',
      exact: true,
    });
    await frame.scrollIntoViewIfNeeded();
    if (scenario === 'blocked' || scenario === 'stalled') {
      await page.waitForFunction(
        () => !document.querySelector('img[alt^="Mavuika avatar"]'),
        {},
        { timeout: 30000 },
      );
      assert.match(await frame.innerText(), /M/);
    } else {
      await page.waitForFunction(
        () => {
          const img = document.querySelector('img[alt^="Mavuika avatar"]');
          return img?.complete && img.naturalWidth > 0;
        },
        {},
        { timeout: 30000 },
      );
    }
    const loaded = (await frame.locator('img').count()) > 0;
    results.artwork.push({ scenario, loaded, attempts });
    if (scenario === 'secondary') assert.ok(attempts.some((url) => url.includes('mihoyo.com')));
    if (scenario === 'mirror' || scenario === 'stalled')
      assert.ok(attempts.some((url) => url.includes('yatta.moe')));
    await page.screenshot({ path: resolve(output, `artwork-${scenario}.png`), fullPage: false });
    await context.close();
  }
  const live = await setup(1280, 'live');
  await visit(live.page, '/simulators');
  await live.page.waitForFunction(
    () => {
      const image = document.querySelector('img[src*="UI_Gacha_AvatarImg_Mavuika"]');
      return (
        image?.complete &&
        image.naturalWidth > 0 &&
        (image.alt.endsWith('regional scenery') || image.classList.contains('opacity-100'))
      );
    },
    {},
    { timeout: 30000 },
  );
  await live.page.screenshot({ path: resolve(output, 'banners-live.png'), fullPage: false });
  await visit(live.page, '/planner?tab=farming');
  const landscape = live.page.getByRole('img', { name: 'Mondstadt regional scenery' }).first();
  await landscape.scrollIntoViewIfNeeded();
  await live.page.waitForFunction(
    () => {
      const image = document.querySelector('img[alt="Mondstadt regional scenery"]');
      return image?.complete && image.naturalWidth > 0;
    },
    {},
    { timeout: 30000 },
  );
  await landscape
    .locator('..')
    .locator('..')
    .screenshot({ path: resolve(output, 'domain-live.png') });
  await live.page.getByText('Boss atlas · Weekly and world boss drops', { exact: true }).click();
  const knave = live.page
    .getByRole('article')
    .filter({ has: live.page.getByRole('heading', { name: 'The Knave', exact: true }) });
  await knave.scrollIntoViewIfNeeded();
  await live.page.waitForFunction(
    () => {
      const image = document.querySelector('img[src*="UI_MonsterIcon_Nihil"]');
      return image?.complete && image.naturalWidth > 0;
    },
    {},
    { timeout: 30000 },
  );
  await knave.screenshot({ path: resolve(output, 'boss-live.png') });
  await live.context.close();
  results.interactions.push(
    'Live character splash, regional scenery, and boss CDN artwork loaded.',
  );
  assert.deepEqual(results.pageErrors, []);
  results.status = 'passed';
} catch (error) {
  results.status = 'failed';
  results.failure = error.stack;
  throw error;
} finally {
  writeFileSync(
    resolve(output, 'visual-browser-results.json'),
    JSON.stringify(results, null, 2) + '\n',
  );
  await browser?.close();
  server.kill();
}
console.log(
  JSON.stringify({
    status: results.status,
    viewports: results.viewport.length,
    interactions: results.interactions,
    artwork: results.artwork.map(({ scenario, loaded }) => ({ scenario, loaded })),
  }),
);
