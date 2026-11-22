import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clearAllStorage } from '../fixtures/test-helpers';

test.describe('Journey 11: Automated WCAG 2.1 AA Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('provides a keyboard-accessible skip-to-content link and valid landmarks', async ({
    page,
  }) => {
    const skipLink = page.getByRole('link', { name: 'Skip to main content' });
    await skipLink.focus();
    await expect(skipLink).toBeFocused();
    await skipLink.click();

    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
  });

  test('respects prefers-reduced-motion media query', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const animationDuration = await page.evaluate(() => {
      const el = document.querySelector('header');
      return el ? getComputedStyle(el).transitionDuration : '0s';
    });
    expect(parseFloat(animationDuration)).toBeLessThanOrEqual(0.01);
  });

  test('scans initial view for critical accessibility violations', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('scans Account Backup Modal for accessibility compliance', async ({ page }) => {
    const backupButton = page.locator('button:has(svg.lucide-database)').first();
    await backupButton.scrollIntoViewIfNeeded();
    await backupButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('scans Weapon Armory Modal for accessibility compliance', async ({ page }) => {
    const armoryButton = page.getByRole('button', { name: /Armory/i }).first();
    await armoryButton.scrollIntoViewIfNeeded();
    await armoryButton.click();

    const modal = page.getByRole('dialog');
    await expect(modal).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('scans Character Detail Modal in Demo Mode for accessibility compliance', async ({ page }) => {
    const demoToggle = page.getByRole('button', { name: /Demo Mode/i }).first();
    await demoToggle.click();
    await expect(page.locator('text=Demo Mode enabled')).toBeVisible();

    await page.getByRole('button', { name: /My Roster/i }).first().click();

    const charCard = page.locator('text=Nefer').first();
    await expect(charCard).toBeVisible();
    await charCard.click();

    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();

    const scanResults = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalViolations = scanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations).toEqual([]);
  });

  test('scans Pull Advisor and Gacha Assumptions Modal for accessibility compliance', async ({ page }) => {
    await page.getByRole('button', { name: /Pull Advisor/i }).first().click();
    await expect(page.locator('text=Who Should You Pull Next?').first()).toBeVisible();

    // Scan Pull Advisor view
    const advisorScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const advisorViolations = advisorScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(advisorViolations).toEqual([]);

    // Open Assumptions & Methodology modal
    const assumptionsBtn = page.getByRole('button', { name: /Assumptions & Methodology/i }).first();
    await assumptionsBtn.click();

    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();

    const modalScan = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const modalViolations = modalScan.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(modalViolations).toEqual([]);
  });
});
