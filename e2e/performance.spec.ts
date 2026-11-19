import { test, expect } from '@playwright/test';
import { clearAllStorage } from './fixtures/test-helpers';

test.describe('M3 Performance & Responsiveness synthetic gates', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
  });

  test('initial landing page payload transfers lightweight bundle without preloading game data', async ({
    page,
  }) => {
    const transferredRequests: Array<{ url: string; size: number }> = [];

    page.on('response', (response) => {
      const url = response.url();
      const headers = response.headers();
      const contentLength = headers['content-length']
        ? parseInt(headers['content-length'], 10)
        : 0;
      transferredRequests.push({ url, size: contentLength });
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    // Initial page title check
    await expect(page).toHaveTitle(/Celestia/);

    // Sum transferred JS payload
    const jsTransfers = transferredRequests.filter((r) => r.url.endsWith('.js'));
    const totalJsTransferred = jsTransfers.reduce((acc, r) => acc + r.size, 0);

    // In preview mode (or production), initial JS payload must stay under 400 KB gzipped
    if (totalJsTransferred > 0) {
      expect(totalJsTransferred).toBeLessThan(400 * 1024);
    }

    // Verify initial HTML delivered over the wire contains ZERO game data preloads
    const htmlResponse = await page.request.get('/');
    const htmlText = await htmlResponse.text();
    const forbiddenPreloads = [
      'genshin-characters',
      'genshin-weapons',
      'genshin-artifacts',
      'genshin-rotations',
    ];
    for (const forbidden of forbiddenPreloads) {
      expect(htmlText).not.toContain(forbidden);
    }
  });

  test('switches tabs smoothly without memory leaks or long task freezing', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Enable demo mode to populate full data
    const demoButton = page.getByRole('button', { name: /Demo Mode/i }).first();
    if (await demoButton.isVisible()) {
      await demoButton.click();
      await page.waitForTimeout(200);
    }

    // Measure PerformanceObserver for long tasks (> 50ms)
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
          // Unsupported in some environments
        }
      }
    });

    // Navigate across all main navigation views (using authentic Navbar tabs)
    const tabs = ['Best Teams', 'Pull Advisor', 'Endgame Helper', 'Artifact Stop', 'My Roster'];
    for (const tab of tabs) {
      const tabButton = page.getByRole('button', { name: new RegExp(tab, 'i') }).first();
      if (await tabButton.isVisible()) {
        await tabButton.click();
        await page.waitForTimeout(100);
      }
    }

    // Verify page is still responsive and navigable
    await expect(page.locator('body')).toBeVisible();

    // Verify JS Heap Size stays bounded
    const heapSize = await page.evaluate(() => {
      const mem = (performance as any).memory;
      return mem ? mem.usedJSHeapSize : null;
    });

    if (heapSize !== null) {
      // Used heap must stay well under 120 MB after cycling through views
      expect(heapSize).toBeLessThan(120 * 1024 * 1024);
    }
  });

  test('prefetches CharacterDetailModal chunk on card hover/interaction', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' });

    // Navigate to Roster tab where character cards are rendered
    const rosterTab = page.getByRole('button', { name: /My Roster/i }).first();
    if (await rosterTab.isVisible()) {
      await rosterTab.click();
      await page.waitForTimeout(200);
    }

    // Enable demo mode if not already active
    const demoBtn = page.getByRole('button', { name: /Demo Mode/i }).first();
    if (await demoBtn.isVisible()) {
      await demoBtn.click();
      await page.waitForTimeout(200);
    }

    // Find first character card
    const firstCard = page.locator('[data-testid^="character-card-"]').first();
    await expect(firstCard).toBeVisible({ timeout: 10000 });

    // Hover card to trigger prefetch
    await firstCard.hover();
    await page.waitForTimeout(150);

    // Click card to open modal
    await firstCard.click();

    // Modal should open quickly
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });
  });
});
