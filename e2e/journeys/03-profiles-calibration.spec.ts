import { test, expect } from '@playwright/test';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 3: Character Profiles & Calibration', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('calibrates level, constellation, and inspects talents in character detail modal', async ({
    page,
  }) => {
    // Enable Demo Mode to populate characters
    await enableDemoMode(page);

    // Navigate to Roster tab
    await navigateToTab(page, /Roster/i);

    // Click on Nefer to open CharacterDetailModal
    const charCard = page.locator('article[data-testid="character-card-Nefer"]').first();
    await expect(charCard).toBeVisible();
    await charCard.click();

    // Verify modal is open with proper dialog attributes
    const modal = page.getByRole('dialog', { name: /Nefer Details/i }).first();
    await expect(modal).toBeVisible();

    // 1. Calibrate Character Level to 80
    const levelGroup = modal.getByRole('group', { name: 'Character level presets' });
    await expect(levelGroup).toBeVisible();
    const btn80 = levelGroup.getByRole('button', { name: '80', exact: true });
    await btn80.click();
    await expect(btn80).toHaveAttribute('aria-pressed', 'true');

    // 2. Calibrate Constellation to C2
    const constGroup = modal.getByRole('group', { name: 'Character constellation' });
    await expect(constGroup).toBeVisible();
    const btnC2 = constGroup.getByRole('button', { name: 'C2', exact: true });
    await btnC2.click();
    await expect(btnC2).toHaveAttribute('aria-pressed', 'true');

    // 3. Switch to Talents tab inside modal
    const talentsTab = modal.getByRole('tab', { name: /Talents/i }).first();
    if (await talentsTab.isVisible()) {
      await talentsTab.click();
      await expect(modal.locator('text=Normal Attack').first()).toBeVisible();
    }

    // 4. Dismiss modal using the close button
    const closeBtn = modal.getByRole('button', { name: /Close modal/i }).first();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();

    // Verify calibrated constellation C2 is reflected on Nefer's roster card
    await expect(charCard.locator('text=C2').first()).toBeVisible();
  });
});
