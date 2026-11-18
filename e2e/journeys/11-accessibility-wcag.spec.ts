import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 11: Automated WCAG 2.1 AA Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('scans initial view for critical accessibility violations', async ({ page }) => {
    // Wait for main content to settle
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // Color contrast evaluated in design token milestone
      .analyze();

    // Verify zero critical or serious accessibility violations
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('scans Account Backup Modal for accessibility compliance', async ({ page }) => {
    // Open backup modal
    const backupButton = page.locator('button:has(svg.lucide-database)').first();
    await backupButton.scrollIntoViewIfNeeded();
    await backupButton.click({ force: true });

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast'])
      .analyze();

    const criticalViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });
});
