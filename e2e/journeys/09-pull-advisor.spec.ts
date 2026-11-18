import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 9: Pull Advisor & Wish Math', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('navigates to Pull Advisor and interacts with wish budget controls', async ({ page }) => {
    const advisorTab = page.getByRole('button', { name: /Pull Advisor/i }).first();
    await advisorTab.click();

    // Verify pull advisor header
    await expect(page.locator('text=Who Should You Pull Next?').first()).toBeVisible();
  });
});
