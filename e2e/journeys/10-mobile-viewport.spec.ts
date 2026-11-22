import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 10: Mobile Responsive Viewport & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('adapts layout cleanly across viewports without horizontal overflow', async ({
    page,
    isMobile,
  }) => {
    const header = page.locator('header').first();
    await expect(header).toBeVisible();

    // Ensure no unintended horizontal overflow
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(hasOverflow).toBe(false);

    if (isMobile) {
      const mobileNav = page.getByRole('navigation', { name: 'Mobile Navigation' });
      await expect(mobileNav).toBeVisible();

      // Verify crisp labels and >= 44px touch targets on all mobile nav buttons
      const navButtons = mobileNav.getByRole('button');
      await expect(navButtons).toHaveCount(5);

      for (let i = 0; i < 5; i++) {
        const box = await navButtons.nth(i).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }

      // Switch to Roster via mobile bottom bar and confirm active state
      const rosterBtn = mobileNav.getByRole('button', { name: /Roster/i });
      await rosterBtn.click();
      await expect(rosterBtn).toHaveAttribute('aria-current', 'page');
      await expect(page.getByPlaceholder(/Search by character name/i).first()).toBeVisible();

      // Open Armory modal on mobile and verify responsive containment
      const armoryBtn = page.getByRole('button', { name: /Armory/i }).first();
      await armoryBtn.click();
      const modal = page.getByRole('dialog').first();
      await expect(modal).toBeVisible();

      const modalBox = await modal.boundingBox();
      expect(modalBox).not.toBeNull();
      const viewportSize = page.viewportSize();
      if (viewportSize) {
        expect(modalBox!.width).toBeLessThanOrEqual(viewportSize.width + 1);
      }

      // Close modal
      const closeBtn = modal.getByRole('button', { name: /Close/i }).first();
      await closeBtn.click();
      await expect(modal).not.toBeVisible();
    } else {
      const desktopNav = page.getByRole('navigation', { name: 'Primary Navigation' });
      await expect(desktopNav).toBeVisible();
      const teamsBtn = desktopNav.getByRole('button', { name: /Best Teams/i });
      await expect(teamsBtn).toHaveAttribute('aria-current', 'page');
    }
  });
});
