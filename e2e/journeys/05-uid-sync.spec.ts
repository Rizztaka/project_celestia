import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 5: UID Sync & Enka Integration', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('syncs characters via valid UID, verifies toast, and preserves UID across reload', async ({
    page,
  }) => {
    // Mock Enka API endpoint for valid UID
    await page.route('https://enka.network/api/uid/800000000', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playerInfo: {
            nickname: 'Traveler',
            level: 60,
            signature: 'Celestia E2E Test',
            finishAchievementNum: 1000,
            showAvatarInfoList: [{ avatarId: 10000104, level: 90 }],
          },
          avatarInfoList: [
            {
              avatarId: 10000104,
              propMap: {
                '4001': { type: 4001, ival: '90', val: '90' },
              },
              fightPropMap: {},
              equipList: [],
            },
          ],
        }),
      });
    });

    // Locate UID input in header/nav
    const uidInput = page.getByPlaceholder(/UID/i).first();
    await expect(uidInput).toBeVisible();
    await uidInput.fill('800000000');
    await expect(uidInput).toHaveValue('800000000');

    const syncBtn = page.getByRole('button', { name: /Sync/i }).first();
    await expect(syncBtn).toBeVisible();
    await syncBtn.click({ force: true });

    // Assert that the synchronization success notification appears and roster count updates
    await expect(page.locator('text=Synced 1 characters from Traveler').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /My Roster \(1\)/i }).first()).toBeVisible();

    // Verify persistence across page reload
    await page.reload();
    const reloadedUidInput = page.getByPlaceholder(/UID/i).first();
    await expect(reloadedUidInput).toHaveValue('800000000');
    await expect(page.getByRole('button', { name: /My Roster \(1\)/i }).first()).toBeVisible();
  });

  test('handles Enka 404 player not found error cleanly', async ({ page }) => {
    await page.route('https://enka.network/api/uid/999999999', async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Player not found' }),
      });
    });

    const uidInput = page.getByPlaceholder(/UID/i).first();
    await uidInput.fill('999999999');

    const syncBtn = page.getByRole('button', { name: /Sync/i }).first();
    await syncBtn.click({ force: true });

    // Assert error toast is shown
    await expect(page.locator('text=Player UID not found on Enka').first()).toBeVisible({ timeout: 10000 });
  });

  test('tolerates unknown avatar IDs without crashing the application', async ({ page }) => {
    await page.route('https://enka.network/api/uid/811111111', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          playerInfo: {
            nickname: 'FutureTraveler',
            level: 60,
            showAvatarInfoList: [{ avatarId: 99999999, level: 90 }],
          },
          avatarInfoList: [],
        }),
      });
    });

    const uidInput = page.getByPlaceholder(/UID/i).first();
    await uidInput.fill('811111111');

    const syncBtn = page.getByRole('button', { name: /Sync/i }).first();
    await syncBtn.click({ force: true });

    // App should not crash; either 0 characters synced or success toast appears
    await expect(page.locator('header').first()).toBeVisible();
  });
});
