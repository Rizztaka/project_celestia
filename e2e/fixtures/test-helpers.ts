import { Page } from '@playwright/test';

/**
 * Common test helper fixtures for Project Celestia E2E tests.
 */

export async function clearAllStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => {
    window.localStorage.clear();
  });
}

export async function setStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.evaluate(
    ({ k, v }) => {
      window.localStorage.setItem(k, v);
    },
    { k: key, v: value }
  );
}

export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => window.localStorage.getItem(k), key);
}

export async function seedStorage(page: Page, data: Record<string, unknown>): Promise<void> {
  await page.evaluate((items) => {
    for (const [k, v] of Object.entries(items)) {
      window.localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
    }
  }, data);
}

export async function navigateToTab(page: Page, name: string | RegExp): Promise<void> {
  const nav = page.locator('nav:visible').first();
  const tabButton = nav.getByRole('button', { name }).first();
  await tabButton.click();
  // Wait for React transition to finish and progress bar to detach
  await page.locator('header [role="progressbar"]').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  // Ensure the target tab button has stabilized and is not in pending animation
  await tabButton.waitFor({ state: 'visible' });
  await page.waitForFunction(
    (el) => !el?.classList.contains('animate-pulse'),
    await tabButton.elementHandle()
  ).catch(() => {});
}

export async function enableDemoMode(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: /Demo Mode/i }).first();
  await toggle.click();
  await page.locator('text=Demo Mode enabled').first().waitFor({ state: 'visible' });
}

export async function disableDemoMode(page: Page): Promise<void> {
  const toggle = page.getByRole('button', { name: /Demo Mode/i }).first();
  await toggle.click();
  await page.locator('text=Demo Mode disabled').first().waitFor({ state: 'visible' });
}
