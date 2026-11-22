import { test, expect } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 12: Storage Migration & Resilience', () => {
  test('migrates legacy v1 storage to v2 with safety snapshot on page load', async ({ page }) => {
    // 1. Clear storage and seed legacy profiles without schema version
    await page.goto('/');
    await page.evaluate(() => {
      window.localStorage.clear();
      window.localStorage.setItem(
        'celestia_v2_roster_profiles',
        JSON.stringify({
          Mavuika: {
            id: 'Mavuika',
            level: 90,
            constellation: 2,
          },
        })
      );
    });

    // 2. Reload application to trigger migrateStorageIfNeeded
    await page.reload();

    // 3. Verify schema version is upgraded to 2
    const schemaVersion = await page.evaluate(() =>
      window.localStorage.getItem('celestia_schema_version')
    );
    expect(schemaVersion).toBe('2');

    // 4. Verify safety backup snapshot was created
    const snapshot = await page.evaluate(() => window.localStorage.getItem('celestia_backup_v1'));
    expect(snapshot).not.toBeNull();

    // 5. Verify migrated character profile appears in roster
    await navigateToTab(page, /Roster/i);
    await page.getByPlaceholder(/Search by character name/i).first().fill('Mavuika');
    const mavuikaCard = page.locator('article[data-testid="character-card-Mavuika"]').first();
    await expect(mavuikaCard).toBeVisible();
    await expect(mavuikaCard.locator('text=C2').first()).toBeVisible();
  });

  test('displays warning notification when browser storage is unavailable or blocked', async ({
    page,
  }) => {
    // Simulate blocked storage environment by making Storage.prototype.setItem throw SecurityError
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('Access is denied', 'SecurityError');
      };
    });

    await page.goto('/');

    // Verify warning notification appears
    await expect(
      page.locator('text=Browser storage is unavailable or restricted').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('handles storage quota exceeded gracefully without crashing the UI', async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');

    // Navigate to Roster
    await navigateToTab(page, /Roster/i);
    await page.getByPlaceholder(/Search by character name/i).first().fill('Mavuika');

    // Mock Storage.prototype.setItem to throw QuotaExceededError on next mutation
    await page.evaluate(() => {
      const origSetItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key: string, val: string) {
        if (key.includes('celestia_v2_roster_profiles')) {
          const err = new DOMException('QuotaExceededError', 'QuotaExceededError');
          throw err;
        }
        return origSetItem.call(this, key, val);
      };
    });

    // Mark Mavuika as owned to trigger saveProfiles
    const markOwnedBtn = page.getByRole('button', { name: 'Mark Mavuika as owned' }).first();
    await markOwnedBtn.click();

    // Verify error notification is surfaced to user
    await expect(page.locator('text=Storage quota exceeded').first()).toBeVisible({ timeout: 10000 });

    // Verify application remains functional and intact
    await expect(page.locator('header').first()).toBeVisible();
  });
});
