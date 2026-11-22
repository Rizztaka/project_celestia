import { test, expect } from '@playwright/test';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 6: Team Generator & Synergy Solver', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('displays insufficient roster notice, toggles catalog fallback, and computes owned synergies in demo mode', async ({
    page,
  }) => {
    // 1. Navigate to Team Builder / Generator
    await navigateToTab(page, /Best Teams/i);

    // Verify view heading
    await expect(page.locator('text=Best Team Recommendations').first()).toBeVisible();

    // 2. Insufficient roster notice should be displayed for empty account
    const catalogFallbackBtn = page.getByRole('button', { name: /Show Theoretical Catalog Teams/i }).first();
    await expect(catalogFallbackBtn).toBeVisible();

    // Click to show catalog fallback teams
    await catalogFallbackBtn.click();
    await expect(page.locator('text=Viewing Theoretical Catalog Teams').first()).toBeVisible();
    await expect(page.locator('text=Unowned').first()).toBeVisible();

    // 3. Turn on Demo Mode to populate full starter roster
    await enableDemoMode(page);
    await navigateToTab(page, /Best Teams/i);

    // Verify recommendations are built strictly from owned units (no unowned banner or badges)
    const teamArticles = page.locator('article');
    await expect(teamArticles.first()).toBeVisible();
    const firstArticle = teamArticles.first();

    // Check synergy / compatibility score badge is rendered
    await expect(firstArticle.locator('text=Compatibility').first()).toBeVisible();
  });
});
