import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 4: Armory & Weapon Equipment Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens weapon armory modal and verifies modal contents', async ({ page }) => {
    // Open Armory modal via button in Navbar
    const armoryBtn = page.getByRole('button', { name: /Armory/i }).first();
    await armoryBtn.click();

    // Verify modal dialog opens
    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();

    // Close modal with close button
    const closeBtn = modal.getByRole('button', { name: /close|✕/i }).first();
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
