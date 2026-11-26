import { test, expect } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 14: Pull Advisor Reliability Disclosure', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-25T12:00:00Z'));
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens via badge, synchronizes ARIA controls with banner, closes via Close button, and reopens via banner control', async ({
    page,
  }) => {
    await navigateToTab(page, /Pull Advisor/i);
    await expect(
      page.getByRole('heading', { name: /Who Should You Pull Next\?/i }).first(),
    ).toBeVisible();

    // Confirm date-deterministic default banner selection for 2026-11-25
    const activePhaseButton = page.getByRole('button', { name: '7.2 P2: Zibai & Linnea' });
    await expect(activePhaseButton).toHaveAttribute('aria-pressed', 'true');

    // Locate the reliability badge and banner disclosure control
    const badgeTrigger = page.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(badgeTrigger).toBeVisible();

    const bannerRegion = page.getByRole('region', { name: 'Pull Advisor reliability context' });
    await expect(bannerRegion).toBeVisible();
    const bannerTrigger = bannerRegion.getByRole('button', { name: /^(Details|Hide Details)$/i });
    await expect(bannerTrigger).toBeVisible();

    // Verify both controls reference the same mounted details panel via aria-controls
    const badgeControlsId = await badgeTrigger.getAttribute('aria-controls');
    const bannerControlsId = await bannerTrigger.getAttribute('aria-controls');
    expect(badgeControlsId).toBeTruthy();
    expect(bannerControlsId).toBe(badgeControlsId);

    const detailsPanel = page.locator(`[id="${badgeControlsId}"]`);
    await expect(detailsPanel).toBeAttached();
    await expect(detailsPanel).toBeHidden();

    // Verify both controls initially report aria-expanded="false"
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    // Click the reliability badge to open the details panel
    await badgeTrigger.click();

    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');
    await expect(
      detailsPanel.getByRole('heading', { name: /Pull Advisor — Reliability Details/i }),
    ).toBeVisible();
    await expect(detailsPanel).toContainText('Evaluated UTC: 2026-11-25');
    await expect(detailsPanel).toContainText('banner_7_2_phase_2');

    // Click the panel's Close button
    const closeButton = detailsPanel.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    // Reopen the panel using the banner disclosure control
    await bannerTrigger.click();

    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');
  });
});
