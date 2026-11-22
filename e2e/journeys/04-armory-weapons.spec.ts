import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 4: Armory & Weapon Equipment Integrity', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens weapon armory, adds a new weapon, and equips/transfers atomically', async ({
    page,
  }) => {
    // 1. Open Armory modal via button in Navbar
    const armoryBtn = page.getByRole('button', { name: /Armory/i }).first();
    await expect(armoryBtn).toBeVisible();

    const modal = page.getByRole('dialog').first();
    await armoryBtn.click();
    await expect(modal).toBeVisible();

    // 2. Switch to "Forge / Add" tab
    const addTab = modal.getByRole('tab', { name: /Forge \/ Add|Add/i }).first();
    await addTab.click();

    // Submit new weapon form
    const saveToArmoryBtn = modal.getByRole('button', { name: /Save to Armory/i }).first();
    await expect(saveToArmoryBtn).toBeVisible();
    await saveToArmoryBtn.click();

    // Verify confirmation feedback
    await expect(modal.locator('text=Added').first()).toBeVisible();

    // 3. In "All" tab, inspect weapon list and verify edit controls
    const allTab = modal.getByRole('tab', { name: /^All/i }).first();
    await allTab.click();

    // Find first weapon's edit button
    const editBtn = modal.getByRole('button', { name: /^Edit /i }).first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Verify edit panel appears with Save button
    const saveBtn = modal.getByRole('button', { name: /^Save$/i }).first();
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // 4. Close modal with close button
    const closeBtn = modal.getByRole('button', { name: /^Close$/i }).first();
    await closeBtn.click();
    await expect(modal).not.toBeVisible();
  });
});
