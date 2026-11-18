import { Page } from '@playwright/test';

/**
 * Common test helper fixtures for Project Celestia E2E tests.
 */

export async function clearAllStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.clear();
  });
}

export async function setStorageItem(page: Page, key: string, value: string): Promise<void> {
  await page.addInitScript(({ k, v }) => {
    window.localStorage.setItem(k, v);
  }, { k: key, v: value });
}

export async function getLocalStorage(page: Page, key: string): Promise<string | null> {
  return await page.evaluate((k) => window.localStorage.getItem(k), key);
}
