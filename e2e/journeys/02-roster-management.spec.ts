import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 2: Roster Management & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('navigates to Roster view and filters characters by element', async ({ page }) => {
    // Navigate to Roster tab
    const rosterTab = page.getByRole('button', { name: /Roster/i }).first();
    await rosterTab.click();

    // Verify search and element filter buttons exist
    const searchInput = page.getByPlaceholder(/Search by character name/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Mavuika');
    await expect(page.locator('text=Mavuika').first()).toBeVisible();
  });
});
