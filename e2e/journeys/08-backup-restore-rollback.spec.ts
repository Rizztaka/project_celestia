import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 8: Account Backup, Restore & Rollback', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('exports backup, rejects malformed JSON, and validates schema integrity', async ({ page }) => {
    // Open backup modal via database icon button
    const backupButton = page.locator('button:has(svg.lucide-database)').first();
    await backupButton.scrollIntoViewIfNeeded();
    await backupButton.click({ force: true });

    // Verify modal is visible
    const modal = page.getByRole('dialog', { name: /Account Backup & Restore/i }).first();
    await expect(modal).toBeVisible();

    // 1. Trigger backup download
    const downloadPromise = page.waitForEvent('download');
    await modal.getByRole('button', { name: /Download Celestia Backup/i }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('celestia-backup-');

    // Verify metadata indicator appears
    await expect(modal.locator('text=Last exported:').first()).toBeVisible();

    // 2. Switch to "Restore Backup" tab to expose file input
    const restoreTab = modal.getByRole('tab', { name: /Restore Backup/i }).first();
    await restoreTab.click();

    // 3. Test malformed JSON file rejection
    const fileInput = modal.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'corrupt-backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ invalid json broken syntax :'),
    });

    await expect(modal.locator('text=Failed to parse JSON file').first()).toBeVisible();

    // 4. Test invalid schema rejection
    await fileInput.setInputFiles({
      name: 'unsupported-schema.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify({ some_other_app: true })),
    });

    await expect(modal.locator('text=Validation Failed:').first()).toBeVisible();

    // 5. Dismiss modal cleanly
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
