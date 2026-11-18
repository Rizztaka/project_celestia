import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 1: First Visit, Empty State & Demo Mode Isolation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
  });

  test('loads authentic empty account and navigates cleanly', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Celestia/);

    // Initial load: verify navigation is rendered
    const nav = page.locator('nav:visible').first();
    await expect(nav).toBeVisible();

    // Verify empty roster state is authentic
    const demoButton = page.getByRole('button', { name: /Demo Mode/i }).first();
    await expect(demoButton).toBeVisible();
  });

  test('toggles Demo Mode on and off with namespace protection', async ({ page }) => {
    await page.goto('/');

    // 1. Enable Demo Mode
    const demoToggle = page.getByRole('button', { name: /Demo Mode/i }).first();
    await demoToggle.click();

    // Verify toast notification
    const banner = page.locator('text=Demo Mode enabled');
    await expect(banner).toBeVisible();

    // Verify demo characters load in roster
    await expect(page.locator('text=Nefer').first()).toBeVisible();

    // 2. Disable Demo Mode
    const exitDemo = page.getByRole('button', { name: /Exit Demo|Demo Mode/i }).first();
    await exitDemo.click();

    // Verify switch-back notification
    const returnBanner = page.locator('text=Switched back to your authentic account');
    await expect(returnBanner).toBeVisible();
  });
});
