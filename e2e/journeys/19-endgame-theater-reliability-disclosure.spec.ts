import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 19: Endgame Chamber Guide & Imaginarium Theater Reliability Disclosure', () => {
  test('verifies Imaginarium Theater (Schedule & Borrow Advisor) and Endgame Chamber Guide disclosures, season transitions, Axe WCAG, and 320px responsiveness', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
    await clearAllStorage(page);
    await enableDemoMode(page);
    await navigateToTab(page, /Endgame Helper/i);

    // 1. Imaginarium Theater panel (Surfaces #7 & #8)
    const theaterPanel = page.locator('#endgame-panel-theater');
    await expect(theaterPanel).toBeVisible();

    const theaterBadges = theaterPanel.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(theaterBadges).toHaveCount(2);

    const mainBadge = theaterBadges.nth(0);
    const borrowBadge = theaterBadges.nth(1);
    await expect(mainBadge).toContainText('Qualified');
    await expect(borrowBadge).toContainText('Qualified');

    const mainPanelId = await mainBadge.getAttribute('aria-controls');
    const borrowPanelId = await borrowBadge.getAttribute('aria-controls');
    expect(mainPanelId).toBeTruthy();
    expect(borrowPanelId).toBeTruthy();
    expect(mainPanelId).not.toBe(borrowPanelId);

    await mainBadge.click();
    const mainDetails = theaterPanel.locator(`[id="${mainPanelId}"]`);
    await expect(mainDetails).toBeVisible();
    await expect(mainDetails).toContainText('Imaginarium Theater — Reliability Details');
    await expect(mainDetails).toContainText('Data State: Estimated');
    await mainDetails.getByRole('button', { name: 'Close' }).click();
    await expect(mainDetails).toBeHidden();

    // Switch to upcoming December season -> Preview badge
    const seasonSelect = theaterPanel.locator('#theater-season-select');
    await seasonSelect.selectOption('season-7-2-dec-pyro-hydro-geo');
    await expect(mainBadge).toContainText('Preview');
    await expect(borrowBadge).toContainText('Preview');

    // Switch to historical season -> Historical badge
    await seasonSelect.selectOption('season-natlan-pyro-hydro-anemo');
    await expect(mainBadge).toContainText('Historical');
    await expect(borrowBadge).toContainText('Historical');

    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    // 2. Switch to Spiral Abyss tab -> Chamber Reference Guide (Surface #6)
    await page.getByRole('tab', { name: /Spiral Abyss/i }).first().click();
    const abyssPanel = page.locator('#endgame-panel-abyss');
    await expect(abyssPanel).toBeVisible();

    const chamberToggle = abyssPanel.getByRole('button', {
      name: /Enemy Lineup, Resistances & Positioning Reference Guide/i,
    });
    await expect(chamberToggle).toHaveAttribute('aria-expanded', 'false');
    const chamberRefId = await chamberToggle.getAttribute('aria-controls');
    expect(chamberRefId).toBe('abyss-chamber-reference');
    await expect(abyssPanel.locator('#abyss-chamber-reference')).toBeAttached();
    await expect(abyssPanel.locator('#abyss-chamber-reference')).toBeHidden();

    const abyssBadges = abyssPanel.getByRole('button', { name: /Toggle reliability details\./i });
    await expect(abyssBadges).toHaveCount(2);
    const guideBadge = abyssBadges.nth(1);
    await expect(guideBadge).toContainText('Reliable');

    const guidePanelId = await guideBadge.getAttribute('aria-controls');
    expect(guidePanelId).toBeTruthy();
    await guideBadge.click();
    const guideDetails = abyssPanel.locator(`[id="${guidePanelId}"]`);
    await expect(guideDetails).toBeVisible();
    await expect(guideDetails).toContainText('Abyss Chamber Reference — Reliability Details');
    await expect(guideDetails).toContainText('Data State: Verified');

    await chamberToggle.click();
    await expect(abyssPanel.locator('#abyss-chamber-reference')).toBeVisible();

    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axeResults.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);

    await page.setViewportSize({ width: 320, height: 720 });
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });
});
