import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 6: Team Generator & Synergy Solver', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('navigates to Team Generator and renders synergy controls', async ({ page }) => {
    // Navigate to Team Builder / Generator
    const teamTab = page.getByRole('button', { name: /Best Teams/i }).first();
    await teamTab.click();

    // Verify view heading
    await expect(page.locator('text=Best Team Recommendations').first()).toBeVisible();
  });
});
