import { test, expect } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 9: Pull Advisor & Wish Math', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('interacts with wish budget, toggles guarantee, and persists across reload', async ({
    page,
  }) => {
    // 1. Navigate to Pull Advisor tab
    await navigateToTab(page, /Pull Advisor/i);

    // Verify view heading
    await expect(page.locator('text=Who Should You Pull Next?').first()).toBeVisible();

    // 2. Set Primogems to 16000 (100 pulls)
    const primoInput = page.locator('input[type="number"]').first();
    await primoInput.fill('16000');

    // Set Fates to 10
    const fatesInput = page.locator('input[type="number"]').nth(1);
    await fatesInput.fill('10');

    // Verify available pulls shows 110 Pulls
    await expect(page.locator('text=110 Pulls').first()).toBeVisible();

    // 3. Toggle Featured Guarantee ON
    const guaranteeBtn = page.getByRole('button', { name: /50\/50|Guaranteed Featured/i }).first();
    await guaranteeBtn.click();
    await expect(guaranteeBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(guaranteeBtn).toContainText('Guaranteed Featured');

    // 4. Reload page and verify state persistence
    await page.reload();
    await navigateToTab(page, /Pull Advisor/i);

    const reloadedPrimoInput = page.locator('input[type="number"]').first();
    await expect(reloadedPrimoInput).toHaveValue('16000');
    await expect(page.locator('text=110 Pulls').first()).toBeVisible();

    const reloadedGuaranteeBtn = page.getByRole('button', { name: /50\/50|Guaranteed Featured/i }).first();
    await expect(reloadedGuaranteeBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
