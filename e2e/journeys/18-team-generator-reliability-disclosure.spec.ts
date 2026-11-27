import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 18: Team Generator & Quick Swap Reliability Disclosure', () => {
  test('verifies Main Best Teams & Quick Swap reliability badges, banners, details panels, catalog sandbox, keyboard nav, Axe WCAG, and 320px responsiveness', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
    await clearAllStorage(page);
    await page.goto('/');
    await navigateToTab(page, /Best Teams/i);

    await expect(page.getByRole('heading', { name: /Best Team Recommendations/i })).toBeVisible();

    // 1. Empty account -> Awaiting 4+ Roster label, zero interactive buttons inside [role="status"]
    await expect(page.locator('text=Awaiting 4+ Roster').first()).toBeVisible();
    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    // 2. Theoretical Catalog Teams -> Sandbox reliability disclosure
    await page.getByRole('button', { name: /Show Theoretical Catalog Teams/i }).first().click();
    await expect(page.locator('text=Viewing Theoretical Catalog Teams').first()).toBeVisible();
    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    const sandboxBadge = page.getByRole('button', { name: /Toggle reliability details\./i }).first();
    await expect(sandboxBadge).toContainText('Sandbox');
    await expect(sandboxBadge).toContainText('Not Live-Actionable · Simulation');

    // 3. Demo Mode -> Reliable & Live-Actionable, details disclosure + Quick Swap modal
    await enableDemoMode(page);
    await expect(page.locator('article').first()).toBeVisible();

    const reliableBadge = page.getByRole('button', { name: /Toggle reliability details\./i }).first();
    await expect(reliableBadge).toContainText('Reliable');
    await expect(reliableBadge).toContainText('Live-Actionable');

    const teamPanelId = await reliableBadge.getAttribute('aria-controls');
    expect(teamPanelId).toBeTruthy();
    const teamPanel = page.locator(`[id="${teamPanelId}"]`);
    await expect(teamPanel).toBeHidden();

    await reliableBadge.focus();
    await page.keyboard.press('Enter');
    await expect(teamPanel).toBeVisible();
    await expect(teamPanel).toContainText('Team Synergy Solver — Reliability Details');
    await expect(teamPanel).toContainText('Data State: Verified');
    await page.keyboard.press('Space');
    await expect(teamPanel).toBeHidden();

    // Quick Swap Weapon Modal reliability disclosure (independent ID/state)
    const swapWeaponBtn = page.getByRole('button', { name: /Swap weapon for/i }).first();
    await swapWeaponBtn.click();
    const modal = page.getByRole('dialog').first();
    await expect(modal).toBeVisible();

    const swapBadge = modal.getByRole('button', { name: /Toggle reliability details\./i }).first();
    await expect(swapBadge).toContainText('Reliable');
    const swapPanelId = await swapBadge.getAttribute('aria-controls');
    expect(swapPanelId).toBeTruthy();
    expect(swapPanelId).not.toBe(teamPanelId);

    await swapBadge.click();
    await expect(modal.locator(`[id="${swapPanelId}"]`)).toBeVisible();
    await expect(modal.locator(`[id="${swapPanelId}"]`)).toContainText(
      'Quick Swap Weapon Ranking — Reliability Details',
    );
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();

    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    const axeResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(axeResults.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')).toEqual([]);

    // 4. 320px mobile overflow check with details open
    await page.setViewportSize({ width: 320, height: 720 });
    await reliableBadge.click();
    await expect(teamPanel).toBeVisible();
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(hasOverflow).toBe(false);
  });
});
