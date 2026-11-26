import { test, expect } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 15: Artifact Stop Reliability Disclosure', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens via badge, closes via panel Close, reopens via banner, updates on 5-Slot Editor transition, and survives Encyclopedia sub-tab round-trip', async ({
    page,
  }) => {
    await navigateToTab(page, /Artifact Stop/i);
    await expect(
      page.getByRole('heading', { name: /When Is Artifact Farming No Longer Worth Your Resin\?/i }),
    ).toBeVisible();

    // 1. Verify default Sandbox badge & banner
    const badgeTrigger = page.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(badgeTrigger).toBeVisible();
    await expect(badgeTrigger).toContainText('Sandbox');

    const bannerRegion = page.getByRole('region', {
      name: 'Artifact Stop Optimizer reliability context',
    });
    await expect(bannerRegion).toBeVisible();
    await expect(bannerRegion).toContainText('Sandbox Simulation');

    const bannerTrigger = bannerRegion.getByRole('button', { name: /^(Details|Hide Details)$/i });
    await expect(bannerTrigger).toBeVisible();

    // 2. Verify both disclosure controls reference the same mounted details panel ID
    const initialPanelId = await badgeTrigger.getAttribute('aria-controls');
    const bannerControlsId = await bannerTrigger.getAttribute('aria-controls');
    expect(initialPanelId).toBeTruthy();
    expect(bannerControlsId).toBe(initialPanelId);

    const detailsPanel = page.locator(`[id="${initialPanelId}"]`);
    await expect(detailsPanel).toBeAttached();
    await expect(detailsPanel).toBeHidden();

    // 3. Verify both controls start with aria-expanded="false"
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    // 4. Open the panel using the badge
    await badgeTrigger.click();

    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');
    await expect(
      detailsPanel.getByRole('heading', { name: /Artifact Stop Optimizer — Reliability Details/i }),
    ).toBeVisible();
    await expect(detailsPanel).toContainText('Sandbox Simulation');
    await expect(detailsPanel).toContainText('artifact_weights_v7_2');
    await expect(detailsPanel).toContainText('characters_v7_2_batch7');
    await expect(detailsPanel).toContainText('Provenance Matched');
    await expect(detailsPanel).toContainText('DOMAIN_CONSTANTS');

    // 5. Close using the panel's Close button
    const closeButton = detailsPanel.getByRole('button', { name: 'Close' });
    await expect(closeButton).toBeVisible();
    await closeButton.click();

    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    // 6. Reopen through the banner's disclosure control
    await bannerTrigger.click();

    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');

    // 7. Switch to 5-Slot Editor and verify reliability transitions to Current / Advisory-Only
    const builderModeButton = page.getByRole('button', { name: '5-Slot Editor' });
    await builderModeButton.click();
    await expect(builderModeButton).toHaveAttribute('aria-pressed', 'true');

    await expect(badgeTrigger).toContainText('Qualified · Advisory Only');
    await expect(bannerRegion).toContainText('Advisory-Only Recommendation');
    await expect(detailsPanel).toBeVisible();
    await expect(detailsPanel).toContainText('Current (Live)');

    // 8. Verify disclosure remains functional after mode transition
    await closeButton.click();
    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');

    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');

    // 9. Switch to Master Artifact Encyclopedia and back, verifying clean remount & valid controls
    const encyclopediaTab = page.getByRole('tab', {
      name: /Master Artifact Encyclopedia/i,
    });
    await encyclopediaTab.click();
    await expect(encyclopediaTab).toHaveAttribute('aria-selected', 'true');
    await expect(badgeTrigger).toHaveCount(0);

    const optimizerTab = page.getByRole('tab', {
      name: /Resin & Roll Optimizer/i,
    });
    await optimizerTab.click();
    await expect(optimizerTab).toHaveAttribute('aria-selected', 'true');

    const remountedBadge = page.getByRole('button', { name: /Toggle reliability details\./i });
    const remountedBanner = page.getByRole('region', {
      name: 'Artifact Stop Optimizer reliability context',
    });
    const remountedBannerTrigger = remountedBanner.getByRole('button', {
      name: /^(Details|Hide Details)$/i,
    });

    const remountedPanelId = await remountedBadge.getAttribute('aria-controls');
    expect(remountedPanelId).toBeTruthy();
    await expect(remountedBannerTrigger).toHaveAttribute('aria-controls', remountedPanelId!);

    const remountedPanel = page.locator(`[id="${remountedPanelId}"]`);
    await expect(remountedPanel).toBeAttached();
    await expect(remountedPanel).toBeVisible();

    // Confirm toggle works after sub-tab remount
    await remountedBadge.click();
    await expect(remountedPanel).toBeHidden();
    await expect(remountedBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(remountedBannerTrigger).toHaveAttribute('aria-expanded', 'false');
  });
});
