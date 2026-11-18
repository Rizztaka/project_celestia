import { test, expect } from '@playwright/test';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 10: Mobile Responsive Viewport & Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('adapts layout cleanly across mobile viewports', async ({ page, isMobile }) => {
    // Check header and core navigation are accessible
    const header = page.locator('header, nav').first();
    await expect(header).toBeVisible();

    if (isMobile) {
      // On mobile viewports, verify that mobile navigation is visible and accessible
      const mobileNav = page.getByRole('navigation', { name: 'Mobile Navigation' });
      await expect(mobileNav).toBeVisible();
      // Verify mobile navigation tabs exist and can be clicked
      const rosterBtn = mobileNav.getByRole('button', { name: /Roster/i });
      await expect(rosterBtn).toBeVisible();
      await rosterBtn.click();
      await expect(page.getByPlaceholder(/Search by character name/i).first()).toBeVisible();
    } else {
      // On desktop viewports, verify that desktop navigation is visible
      const desktopNav = page.locator('header nav').first();
      await expect(desktopNav).toBeVisible();
    }
  });
});
