import { test, expect } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 2: Roster Management & Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('adds character to roster, steps constellation, persists across reload, and removes', async ({
    page,
  }) => {
    // Navigate to Roster tab
    await navigateToTab(page, /Roster/i);

    // Search for Mavuika
    const searchInput = page.getByPlaceholder(/Search by character name/i).first();
    await expect(searchInput).toBeVisible();
    await searchInput.fill('Mavuika');

    // Verify Mavuika card is found
    const card = page.locator('article[data-testid="character-card-Mavuika"]').first();
    await expect(card).toBeVisible();

    // 1. Mark as owned
    const markOwnedBtn = page.getByRole('button', { name: 'Mark Mavuika as owned' }).first();
    await markOwnedBtn.click();

    // Verify ownership state and base C0 constellation
    await expect(page.getByRole('button', { name: 'Mark Mavuika as unowned' }).first()).toBeVisible();
    await expect(card.locator('text=C0').first()).toBeVisible();

    // 2. Step constellation to C2
    const incBtn = page.getByRole('button', { name: 'Increase Mavuika constellation' }).first();
    await incBtn.click();
    await expect(card.locator('text=C1').first()).toBeVisible();
    await incBtn.click();
    await expect(card.locator('text=C2').first()).toBeVisible();

    // 3. Verify persistence across page reload
    await page.reload();
    await navigateToTab(page, /Roster/i);
    await page.getByPlaceholder(/Search by character name/i).first().fill('Mavuika');
    const reloadedCard = page.locator('article[data-testid="character-card-Mavuika"]').first();
    await expect(reloadedCard.locator('text=C2').first()).toBeVisible();

    // 4. Mark as unowned and verify removal
    const markUnownedBtn = page.getByRole('button', { name: 'Mark Mavuika as unowned' }).first();
    await markUnownedBtn.click();
    await expect(page.getByRole('button', { name: 'Mark Mavuika as owned' }).first()).toBeVisible();
  });
});
