import { test, expect } from '@playwright/test';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 7: Endgame Solvers (Abyss & Theater)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('navigates to Endgame view, switches between Theater and Abyss, and inspects dual-half solver', async ({
    page,
  }) => {
    await enableDemoMode(page);
    await navigateToTab(page, /Endgame Helper/i);

    // 1. Verify Imaginarium Theater sub-tab
    const theaterTab = page.getByRole('tab', { name: /Imaginarium Theater/i }).first();
    await expect(theaterTab).toBeVisible();
    await expect(theaterTab).toHaveAttribute('aria-selected', 'true');

    // Check theater panel content
    const theaterPanel = page.locator('#endgame-panel-theater');
    await expect(theaterPanel).toBeVisible();

    // 2. Switch to Spiral Abyss sub-tab
    const abyssTab = page.getByRole('tab', { name: /Spiral Abyss/i }).first();
    await expect(abyssTab).toBeVisible();
    await abyssTab.click();
    await expect(abyssTab).toHaveAttribute('aria-selected', 'true');

    // 3. Check Abyss dual-team chamber view
    await expect(page.locator('text=Floor 12').first()).toBeVisible();
    await expect(page.locator('text=First Half').first()).toBeVisible();
    await expect(page.locator('text=Second Half').first()).toBeVisible();
  });
});
