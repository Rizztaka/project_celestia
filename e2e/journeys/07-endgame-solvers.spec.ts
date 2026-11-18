import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 7: Endgame Solvers (Abyss & Theater)', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('navigates to Endgame view and displays Spiral Abyss & Theater tabs', async ({ page }) => {
    const endgameTab = page.getByRole('button', { name: /Endgame Helper/i }).first();
    await endgameTab.click();

    // Verify endgame view rendered with sub-tabs
    await expect(page.locator('text=Imaginarium Theater').first()).toBeVisible();
    await expect(page.locator('text=Spiral Abyss').first()).toBeVisible();
  });
});
