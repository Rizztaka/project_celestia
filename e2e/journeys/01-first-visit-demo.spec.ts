import { test, expect } from '@playwright/test';
import { clearAllStorage, getLocalStorage, navigateToTab } from '../fixtures/test-helpers';

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
    await expect(demoButton).toHaveAttribute('aria-pressed', 'false');
  });

  test('toggles Demo Mode on and off with namespace protection', async ({ page }) => {
    await page.goto('/');

    // 1. Enable Demo Mode
    const demoToggle = page.getByRole('button', { name: /Demo Mode/i }).first();
    await demoToggle.click();

    // Verify toast notification
    const banner = page.locator('text=Demo Mode enabled').first();
    await expect(banner).toBeVisible();

    // Navigate to Roster to verify demo characters load as owned
    await navigateToTab(page, /Roster/i);
    await expect(page.getByRole('button', { name: 'Mark Nefer as unowned' }).first()).toBeVisible();

    // Verify real account localStorage is NOT polluted by Demo Mode
    const authenticProfiles = await getLocalStorage(page, 'celestia_v2_roster_profiles');
    expect(authenticProfiles === null || authenticProfiles === '{}').toBe(true);

    const demoFlag = await getLocalStorage(page, 'celestia_v2_demo_mode');
    expect(demoFlag).toBe('true');

    // 2. Disable Demo Mode
    const exitDemo = page.getByRole('button', { name: /Demo Mode/i }).first();
    await exitDemo.click();

    // Verify switch-back notification
    const returnBanner = page.locator('text=Demo Mode disabled').first();
    await expect(returnBanner).toBeVisible();

    // Verify demo characters are no longer marked as owned in authentic account
    await expect(page.getByRole('button', { name: 'Mark Nefer as owned' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Mark Nefer as unowned' })).not.toBeVisible();
  });
});
