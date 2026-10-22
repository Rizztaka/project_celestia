// Real API + disposable PostgreSQL + production frontend. Only event rewards are synthetic.
// Run via tsx with the same isolated environment as verify, an absolute Playwright
// package path and an absolute evidence directory. No ordinary database is accepted.
/* global document, innerWidth */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import { disposableTestDatabase } from '../src/core/db/disposable-test-database.ts';

assert.ok(disposableTestDatabase(), 'Explicit disposable database required');
const output = resolve(process.argv[3]);
mkdirSync(output, { recursive: true });
const { chromium } = createRequire(import.meta.url)(process.argv[2]);
const { app } = await import('../src/app.ts');
const { prisma, disconnectDatabase } = await import('../src/core/db/prisma.ts');
const { AuthService } = await import('../src/platform/auth/auth.service.ts');
const server = await new Promise((done) => {
  const instance = app.listen(45472, '127.0.0.1', () => done(instance));
});
const webRequire = createRequire(new URL('../../web/package.json', import.meta.url));
const web = spawn(
  process.execPath,
  [
    resolve(webRequire.resolve('vite/package.json'), '../bin/vite.js'),
    'preview',
    '--host',
    '127.0.0.1',
    '--port',
    '45471',
    '--strictPort',
  ],
  { cwd: new URL('../../web', import.meta.url), windowsHide: true, stdio: 'ignore' },
);
const base = 'http://127.0.0.1:45471';
const api = 'http://127.0.0.1:45472/api/v1';
const results = {
  status: 'running',
  backend: 'real API, isolated PostgreSQL, deterministic composition',
  events: 'synthetic active event and expired event',
  checks: [],
  viewports: [],
  pageErrors: [],
};
const ownerIds = [];
let browser;
try {
  const suffix = randomUUID();
  const auth = await new AuthService().register({
    email: `s5-${suffix}@example.invalid`,
    username: `S5${suffix.replaceAll('-', '').slice(0, 12)}`,
    password: 'Synthetic-section5-password-123!',
  });
  ownerIds.push(auth.user.id);
  const keys = ['Bennett', 'Xiangling', 'Xingqiu', 'RaidenShogun'];
  await prisma.genshinAccount.create({
    data: {
      userId: auth.user.id,
      characters: {
        create: keys.map((characterKey) => ({
          characterKey,
          level: 80,
          ascension: 6,
          constellation: 0,
          talentNormal: 6,
          talentSkill: 8,
          talentBurst: 8,
        })),
      },
    },
  });
  const call = (path, body, authorized = true) =>
    fetch(api + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authorized ? { Authorization: `Bearer ${auth.token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await call('/games/genshin/intelligence/teams/evaluate', { characterKeys: keys }, false))
      .status,
    401,
  );
  assert.equal(
    (await call('/games/genshin/intelligence/teams/evaluate', { characterKeys: ['Mavuika'] }))
      .status,
    422,
  );
  assert.equal(
    (
      await call('/games/genshin/intelligence/teams/evaluate', {
        characterKeys: ['Bennett', 'Bennett'],
      })
    ).status,
    400,
  );
  const evaluated = await (
    await call('/games/genshin/intelligence/teams/evaluate', { characterKeys: keys })
  ).json();
  assert.equal(evaluated.data.resonances[0].name, 'Fervent Flames');
  assert.ok(evaluated.data.recommendation.reactions.includes('Vaporize'));
  results.checks.push(
    'Real authenticated evaluation, duplicate and unowned character rejection, anonymous 401',
  );
  for (let attempt = 0; attempt < 50; attempt++) {
    try {
      if ((await fetch(base)).ok) break;
    } catch {
      /* preview starting */
    }
    await new Promise((done) => setTimeout(done, 100));
  }
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
    acceptDownloads: true,
  });
  await context.addInitScript((token) => {
    if (!localStorage.getItem('celestia_auth'))
      localStorage.setItem(
        'celestia_auth',
        JSON.stringify({ state: { token, isAuthenticated: true }, version: 0 }),
      );
  }, auth.token);
  await context.route('**/api/v1/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace('/api/v1', '');
    if (path === '/companion/events') {
      const event = (key, active) => ({
        key,
        name: active ? 'Synthetic active event' : 'Expired fixture event',
        startUtc: '2026-10-01T00:00:00Z',
        endUtc: '2026-10-31T23:59:59Z',
        isActive: active,
        isExpired: !active,
        isUpcoming: false,
        hoursRemaining: 100,
        totalPrimogems: 460,
        claimedPrimogems: 40,
        rewardTiers: [
          { tierId: 'claimed', label: 'Claimed', primogems: 40, claimed: true, other: [] },
          { tierId: 'unclaimed', label: 'Unclaimed', primogems: 420, claimed: false, other: [] },
        ],
      });
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            availability: { available: true, reason: null },
            patch: 'synthetic',
            totalUnclaimedPrimogems: 420,
            events: [event('active', true), event('expired', false)],
          },
        }),
      });
    }
    const response = await route.fetch({ url: api + path + new URL(route.request().url()).search });
    await route.fulfill({ response });
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => results.pageErrors.push(error.message));
  page.setDefaultTimeout(15_000);
  await page.goto(base + '/planner?tab=teams');
  await page.getByRole('heading', { name: 'Team Builder', exact: true }).waitFor();
  for (const [index, key] of keys.entries()) {
    await page
      .getByRole('button', { name: new RegExp(`Choose character for slot ${index + 1}`) })
      .click();
    await page.getByRole('dialog').waitFor();
    if (index === 0) {
      await page.getByLabel('Element', { exact: true }).selectOption('Pyro');
      await page.getByLabel('Search your roster').fill('Bennett');
    }
    await page
      .getByRole('dialog')
      .getByRole('button', { name: new RegExp(key === 'RaidenShogun' ? 'Raiden Shogun' : key) })
      .click();
  }
  await page.getByText('Fervent Flames', { exact: true }).click();
  await page.getByText('+25% ATK; affected by Cryo for 40% less time.', { exact: true }).waitFor();
  await page.getByLabel('Team name').fill('Raiden National');
  await page.getByRole('button', { name: 'Save team', exact: true }).click();
  await page.getByRole('button', { name: 'Load Raiden National' }).waitFor();
  await page.reload();
  await page.getByRole('button', { name: 'Load Raiden National' }).click();
  assert.equal(
    await page.getByRole('button', { name: /Choose character for slot.*currently/ }).count(),
    4,
  );
  const slotOne = page.getByRole('button', { name: /Choose character for slot 1/ });
  await slotOne.click();
  assert.equal(
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /Xiangling/ })
      .count(),
    0,
  );
  await page.keyboard.press('Escape');
  assert.equal(await slotOne.evaluate((element) => element === document.activeElement), true);
  await page.getByRole('status').filter({ hasText: 'Four slots filled' }).waitFor();
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export teams' }).click();
  const download = await downloadEvent;
  const teamFile = resolve(output, 'synthetic-team-export.json');
  await download.saveAs(teamFile);
  assert.equal(JSON.parse(readFileSync(teamFile, 'utf8')).teams[0].name, 'Raiden National');
  await page.getByRole('button', { name: 'Delete Raiden National' }).click();
  await page.getByLabel('Import teams').setInputFiles(teamFile);
  await page.getByRole('button', { name: 'Load Raiden National' }).waitFor();
  await page.getByLabel('Import teams').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"version":1,"teams":[{}]}'),
  });
  await page.getByRole('status').filter({ hasText: 'Use a version 1' }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Load Raiden National' }).count(), 1);
  results.checks.push(
    'Four roster picker slots, search/element filters, resonance explanation, save/reload/load, deterministic composition notes, JSON export/import and invalid import preservation',
  );
  for (const width of [1280, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
      clippedControls: [
        ...document.querySelectorAll('main button, main input, main select, main [role="img"]'),
      ].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).length,
    }));
    assert.ok(dimensions.scroll <= width, `Team Builder overflow at ${width}`);
    assert.equal(dimensions.clippedControls, 0, `Team Builder controls clipped at ${width}`);
    results.viewports.push({ surface: 'Teams', width, ...dimensions });
  }
  await page.screenshot({ path: resolve(output, 'teams-mobile.png'), fullPage: true });
  await page.getByRole('tab', { name: 'Wish Savings' }).click();
  await page.getByRole('button', { name: 'In 20 days', exact: true }).click();
  await page.getByLabel('Primogems', { exact: true }).fill('1600');
  await page.getByLabel('Intertwined Fates', { exact: true }).fill('2');
  const pulls = () =>
    page
      .locator('dl > div')
      .filter({ has: page.getByText('Projected pulls', { exact: true }) })
      .locator('dd')
      .textContent();
  assert.equal(await pulls(), '22');
  await page.getByLabel(/Welkin Moon/).check();
  assert.equal(await pulls(), '33');
  await page.getByLabel('Include unclaimed active event rewards').uncheck();
  assert.equal(await pulls(), '30');
  await page.getByText('Synthetic active event ·', { exact: false }).waitFor();
  assert.equal(await page.getByText('Expired fixture event', { exact: false }).count(), 0);
  await page.getByLabel('Target type').selectOption('weapon');
  await page.getByLabel('Target', { exact: true }).selectOption('StaffOfHoma');
  await page
    .getByRole('img', { name: /Staff of Homa/ })
    .first()
    .waitFor();
  for (const width of [1280, 640, 320]) {
    await page.setViewportSize({ width, height: 900 });
    const dimensions = await page.evaluate(() => ({
      viewport: innerWidth,
      scroll: document.documentElement.scrollWidth,
      clippedControls: [
        ...document.querySelectorAll('main button, main input, main select, main [role="img"]'),
      ].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && (rect.left < -1 || rect.right > innerWidth + 1);
      }).length,
    }));
    assert.ok(dimensions.scroll <= width, `Savings overflow at ${width}`);
    assert.equal(dimensions.clippedControls, 0, `Savings controls clipped at ${width}`);
    results.viewports.push({ surface: 'Savings', width, ...dimensions });
  }
  await page.screenshot({ path: resolve(output, 'savings-mobile.png'), fullPage: true });
  results.checks.push(
    'Savings reacts to inventory, Welkin and unclaimed event toggles; expired rewards excluded; weapon target artwork; 1280/640/320px reflow',
  );
  await page.goto(base + '/simulators');
  await page.getByRole('heading', { name: /Pity Tracker — Ancient Flame/ }).waitFor();
  await page
    .getByRole('img', { name: /Mavuika avatar/ })
    .first()
    .waitFor();
  await page.setViewportSize({ width: 1280, height: 900 });
  await page
    .getByRole('button', { name: /Wish ×10|Wish x10|10 Pull|10-pull/i })
    .first()
    .click();
  const totalPulls = page
    .getByText('Total Pulls', { exact: true })
    .locator('..')
    .locator('p')
    .last();
  await totalPulls.filter({ hasText: /^10$/ }).waitFor();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByText('Total Pulls', { exact: true }).waitFor({ state: 'hidden' });
  results.checks.push(
    'Simulator defaults past preserved expired Odette to Mavuika; real ten-pull endpoint succeeds',
  );
  assert.equal((await call('/games/genshin/intelligence/ai-summary', {})).status, 404);
  results.checks.push('Retired model endpoint is absent');
  assert.deepEqual(results.pageErrors, []);
  results.status = 'passed';
} catch (error) {
  results.status = 'failed';
  results.failure = error.message;
  throw error;
} finally {
  await browser?.close();
  web.kill();
  await new Promise((done) => server.close(done));
  if (ownerIds.length) await prisma.user.deleteMany({ where: { id: { in: ownerIds } } });
  await disconnectDatabase();
  writeFileSync(resolve(output, 'browser-results.json'), JSON.stringify(results, null, 2) + '\n');
}
console.log(JSON.stringify(results));
