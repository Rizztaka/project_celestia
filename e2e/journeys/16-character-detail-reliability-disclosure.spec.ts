import { test, expect } from '@playwright/test';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 16: CharacterDetailModal Reliability Disclosure', () => {
  test('opens details via badge, closes via Close, resets on Traveler switch & modal reopen, and preserves calibration', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
    await clearAllStorage(page);
    await enableDemoMode(page);
    await navigateToTab(page, /Roster/i);

    // 1. Open Nefer in Demo Mode
    const neferCard = page.locator('article[data-testid="character-card-Nefer"]').first();
    await expect(neferCard).toBeVisible();
    await neferCard.click();

    const modal = page.getByRole('dialog', { name: /Nefer Details/i }).first();
    await expect(modal).toBeVisible();

    // 2. Verify healthy badge and initially collapsed details panel (no banner when healthy)
    const badgeTrigger = modal.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(badgeTrigger).toBeVisible();
    await expect(badgeTrigger).toContainText('Reliable');
    await expect(badgeTrigger).toContainText('Live-Actionable');
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.locator('[data-reliability-container]')).toHaveCount(0);

    const panelId = await badgeTrigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();

    const detailsPanel = modal.locator(`[id="${panelId}"]`);
    await expect(detailsPanel).toBeAttached();
    await expect(detailsPanel).toBeHidden();

    // 3. Open the panel via the badge and verify provenance rows
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(
      detailsPanel.getByRole('heading', { name: /Weapon Suitability — Reliability Details/i }),
    ).toBeVisible();
    await expect(detailsPanel).toContainText('Evaluated UTC: 2026-11-23');
    await expect(detailsPanel).toContainText('characters_v7_2_batch7');
    await expect(detailsPanel).toContainText('weapons_v7_2_signatures');
    await expect(detailsPanel).toContainText('artifact_weights_v7_2');
    await expect(detailsPanel).toContainText('Provenance Matched');

    // 4. Close via panel Close button
    const closeDetailsBtn = detailsPanel.getByRole('button', { name: 'Close' });
    await expect(closeDetailsBtn).toBeVisible();
    await closeDetailsBtn.click();
    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');

    // 5. Reopen details, calibrate Nefer (Lv 80, C2), close modal, and verify reopen starts collapsed
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();

    const levelGroup = modal.getByRole('group', { name: 'Character level presets' });
    await levelGroup.getByRole('button', { name: '80', exact: true }).click();
    const constGroup = modal.getByRole('group', { name: 'Character constellation' });
    await constGroup.getByRole('button', { name: 'C2', exact: true }).click();

    await modal.getByRole('button', { name: /Close modal/i }).first().click();
    await expect(modal).toBeHidden();
    await expect(neferCard.locator('text=C2').first()).toBeVisible();

    await neferCard.click();
    await expect(modal).toBeVisible();
    const reopenedBadge = modal.getByRole('button', { name: /Toggle reliability details\./i });
    const reopenedPanelId = await reopenedBadge.getAttribute('aria-controls');
    expect(reopenedPanelId).toBeTruthy();
    await expect(reopenedBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(modal.locator(`[id="${reopenedPanelId}"]`)).toBeHidden();
    await modal.getByRole('button', { name: /Close modal/i }).first().click();
    await expect(modal).toBeHidden();

    // 6. Open Traveler, expand reliability panel, switch Traveler element, verify disclosure resets
    const searchInput = page.getByPlaceholder(/Search by character name/i).first();
    await searchInput.fill('Traveler');
    const travelerCard = page.locator('article[data-testid="character-card-TravelerPyro"]').first();
    await expect(travelerCard).toBeVisible();
    await travelerCard.click();

    const travelerModal = page.getByRole('dialog', { name: /Traveler.*Details/i }).first();
    await expect(travelerModal).toBeVisible();

    const travelerBadge = travelerModal.getByRole('button', {
      name: /Toggle reliability details\./i,
    });
    const travelerPanelId = await travelerBadge.getAttribute('aria-controls');
    const travelerPanel = travelerModal.locator(`[id="${travelerPanelId}"]`);

    await travelerBadge.click();
    await expect(travelerPanel).toBeVisible();
    await expect(travelerBadge).toHaveAttribute('aria-expanded', 'true');

    const travelerElementGroup = travelerModal.getByRole('group', { name: 'Traveler Element' });
    await travelerElementGroup.getByRole('button', { name: 'Anemo', exact: true }).click();
    await expect(
      travelerElementGroup.getByRole('button', { name: 'Anemo', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');

    await expect(travelerBadge).toHaveAttribute('aria-expanded', 'false');
    await expect(travelerPanel).toBeHidden();
    await expect(travelerBadge).toContainText('Reliable');
  });

  test('renders stale dependency banner with synchronized badge/banner disclosure under fixed clock past 42 days', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2027-01-10T12:00:00Z'));
    await clearAllStorage(page);
    await enableDemoMode(page);
    await navigateToTab(page, /Roster/i);

    const neferCard = page.locator('article[data-testid="character-card-Nefer"]').first();
    await expect(neferCard).toBeVisible();
    await neferCard.click();

    const modal = page.getByRole('dialog', { name: /Nefer Details/i }).first();
    await expect(modal).toBeVisible();

    const badgeTrigger = modal.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(badgeTrigger).toContainText('Qualified · Stale Dependency');
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');

    const bannerContainer = modal.locator('[data-reliability-container="status"]').first();
    await expect(bannerContainer).toBeVisible();
    await expect(bannerContainer).toContainText('Qualified Recommendation (Stale Dependency)');
    await expect(bannerContainer).toContainText('artifact_weights_v7_2');

    const bannerTrigger = bannerContainer.getByRole('button', {
      name: /^(Details|Hide Details)$/i,
    });
    await expect(bannerTrigger).toBeVisible();
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    const badgeControlsId = await badgeTrigger.getAttribute('aria-controls');
    const bannerControlsId = await bannerTrigger.getAttribute('aria-controls');
    expect(badgeControlsId).toBeTruthy();
    expect(bannerControlsId).toBe(badgeControlsId);

    const detailsPanel = modal.locator(`[id="${badgeControlsId}"]`);
    await expect(detailsPanel).toBeAttached();
    await expect(detailsPanel).toBeHidden();

    // Open via badge -> both triggers update
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');
    await expect(detailsPanel).toContainText('Evaluated UTC: 2027-01-10');

    // Close via panel Close button
    await detailsPanel.getByRole('button', { name: 'Close' }).click();
    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(bannerTrigger).toHaveText('Details');

    // Reopen via banner Details button
    await bannerTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerTrigger).toHaveText('Hide Details');
  });

  test('renders reliability badge, banner, and open details panel without horizontal overflow on mobile viewport', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2027-01-10T12:00:00Z'));
    await page.setViewportSize({ width: 375, height: 812 });
    await clearAllStorage(page);
    await enableDemoMode(page);
    await navigateToTab(page, /Roster/i);

    const neferCard = page.locator('article[data-testid="character-card-Nefer"]').first();
    await neferCard.scrollIntoViewIfNeeded();
    await neferCard.click();

    const modal = page.getByRole('dialog', { name: /Nefer Details/i }).first();
    await expect(modal).toBeVisible();

    const badgeTrigger = modal.getByRole('button', { name: /Toggle reliability details\./i });
    await badgeTrigger.scrollIntoViewIfNeeded();
    await badgeTrigger.click();

    const panelId = await badgeTrigger.getAttribute('aria-controls');
    const detailsPanel = modal.locator(`[id="${panelId}"]`);
    await expect(detailsPanel).toBeVisible();

    const overflowCheck = await detailsPanel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        panelOverflow: el.scrollWidth > el.clientWidth + 1,
        rightEdge: rect.right,
        viewportWidth: window.innerWidth,
      };
    });

    expect(overflowCheck.docOverflow).toBe(false);
    expect(overflowCheck.panelOverflow).toBe(false);
    expect(overflowCheck.rightEdge).toBeLessThanOrEqual(overflowCheck.viewportWidth + 1);
  });
});
