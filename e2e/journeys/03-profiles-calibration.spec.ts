import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 3: Character Profiles & Calibration', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('enables demo mode and opens character detail modal', async ({ page }) => {
    // Enable Demo Mode to populate characters
    const demoToggle = page.getByRole('button', { name: /Demo Mode/i }).first();
    await demoToggle.click();
    await expect(page.locator('text=Demo Mode enabled')).toBeVisible();

    // Navigate to Roster tab to interact with character cards
    await page.getByRole('button', { name: /My Roster/i }).first().click();

    // Click on a character portrait in Roster
    const charCard = page.locator('text=Nefer').first();
    await expect(charCard).toBeVisible();
    await charCard.click();

    // Verify modal opens with character details
    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();
    await expect(modal.locator('text=Nefer').first()).toBeVisible();

    // Dismiss modal using Escape key
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });
});
