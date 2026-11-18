import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 8: Account Backup, Restore & Rollback', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens backup modal, exports backup, and checks last exported metadata', async ({ page }) => {
    // Open backup modal via database icon button in navbar/footer
    const backupButton = page.locator('button:has(svg.lucide-database)').first();
    await backupButton.scrollIntoViewIfNeeded();
    await backupButton.click({ force: true });

    // Verify modal is visible
    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Account Backup & Restore')).toBeVisible();

    // Trigger backup download
    const downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: /Download Celestia Backup/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('celestia-backup-');

    // Verify metadata indicator appears
    await expect(modal.locator('text=Last exported:')).toBeVisible();

    // Dismiss with Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
