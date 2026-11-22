import { test, expect } from '@playwright/test';
import { clearAllStorage, enableDemoMode, navigateToTab } from './fixtures/test-helpers';

test.describe('M3 Performance & Responsiveness Gates', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
  });

  test('initial landing page avoids loading deferred encyclopedia chunks and keeps HTML preload-free', async ({
    page,
  }) => {
    const jsRequests: Array<{ url: string; size: number }> = [];

    page.on('response', (response) => {
      const url = response.url();
      if (!url.endsWith('.js')) return;
      const headers = response.headers();
      const contentLength = headers['content-length']
        ? parseInt(headers['content-length'], 10)
        : 0;
      jsRequests.push({ url, size: contentLength });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveTitle(/Celestia/);

    // Encyclopedia chunk must NOT be downloaded on initial landing
    const fetchedUrls = jsRequests.map((r) => r.url);
    expect(fetchedUrls.some((u) => u.includes('genshin-artifacts-master'))).toBe(false);

    // Initial HTML delivered over the wire must contain zero game-data modulepreloads
    const htmlResponse = await page.request.get('/');
    const htmlText = await htmlResponse.text();
    for (const forbidden of [
      'genshin-characters',
      'genshin-weapons',
      'genshin-artifacts',
      'genshin-rotations',
    ]) {
      expect(htmlText).not.toContain(forbidden);
    }
  });

  test('loads interactive shell quickly on a throttled Slow 4G mobile connection', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'CDP network throttling is Chromium-only');

    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: 150, // 150ms RTT
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps Slow 4G
      uploadThroughput: (750 * 1024) / 8,
    });

    const navStart = Date.now();
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('nav:visible').first()).toBeVisible();
    const shellInteractiveMs = Date.now() - navStart;

    const fcp = await page.evaluate(() => {
      const entry = performance.getEntriesByName('first-contentful-paint')[0];
      return entry ? entry.startTime : 0;
    });

    console.info(
      `[M3 Perf · Slow 4G] Shell interactive: ${shellInteractiveMs}ms | FCP: ${fcp.toFixed(0)}ms`
    );

    // Must render interactive navigation under 4.5s even on Slow 4G
    expect(shellInteractiveMs).toBeLessThan(4500);
    if (fcp > 0) {
      expect(fcp).toBeLessThan(3500);
    }
  });

  test('switches all 5 tabs smoothly without long-task freezing or unbounded heap growth', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await enableDemoMode(page);

    await page.evaluate(() => {
      (window as any).__longTaskCount = 0;
      if (typeof PerformanceObserver !== 'undefined') {
        try {
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                (window as any).__longTaskCount++;
              }
            }
          });
          observer.observe({ entryTypes: ['longtask'] });
        } catch {
          // Unsupported in some browsers
        }
      }
    });

    const tabs: Array<{ name: RegExp; label: string }> = [
      { name: /Pull Advisor/i, label: 'Pull Advisor' },
      { name: /Endgame Helper/i, label: 'Endgame Helper' },
      { name: /Artifact Stop/i, label: 'Artifact Stop' },
      { name: /My Roster/i, label: 'My Roster' },
      { name: /Best Teams/i, label: 'Best Teams' },
    ];

    const timings: Record<string, number> = {};
    for (const tab of tabs) {
      const t0 = Date.now();
      await navigateToTab(page, tab.name);
      await page.waitForTimeout(100);
      timings[tab.label] = Date.now() - t0;
    }

    console.info('[M3 Perf · Tab Switch Timings (ms)]:', JSON.stringify(timings));

    const longTaskCount = await page.evaluate(() => (window as any).__longTaskCount ?? 0);
    expect(longTaskCount).toBeLessThanOrEqual(2);

    const heapSize = await page.evaluate(() => {
      const mem = (performance as any).memory;
      return mem ? mem.usedJSHeapSize : null;
    });
    if (heapSize !== null) {
      expect(heapSize).toBeLessThan(120 * 1024 * 1024);
    }
  });

  test('keeps 128-character Roster search responsive and prefetches CharacterDetailModal on hover', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await navigateToTab(page, /My Roster/i);

    const searchInput = page.getByPlaceholder(/Search by character name/i).first();
    await expect(searchInput).toBeVisible();

    // Rapid filter input across full 128-character roster
    const filterStart = Date.now();
    await searchInput.fill('Nefer');
    const neferCard = page.locator('[data-testid="character-card-Nefer"]');
    await expect(neferCard).toBeVisible();
    const filterLatencyMs = Date.now() - filterStart;
    console.info(`[M3 Perf · 128-Card Filter]: ${filterLatencyMs}ms`);
    expect(filterLatencyMs).toBeLessThan(1500);

    // Hover to prefetch modal chunk, then click
    await neferCard.hover();
    await page.waitForTimeout(120);
    await neferCard.getByRole('button', { name: /View Nefer build and profile details/i }).click();
    await expect(page.getByRole('dialog').first()).toBeVisible({ timeout: 5000 });
  });
});
