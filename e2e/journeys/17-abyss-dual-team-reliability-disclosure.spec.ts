import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { clearAllStorage, enableDemoMode, navigateToTab } from '../fixtures/test-helpers';

test.describe('Journey 17: Abyss Dual Team Reliability Disclosure & Swap Halves', () => {
  test('verifies badge/banner/details disclosure, keyboard nav, cycle & pairing transitions, healthy Swap Halves, Axe WCAG, and 320px responsiveness', async ({
    page,
  }) => {
    await page.clock.setFixedTime(new Date('2026-11-23T12:00:00Z'));
    await clearAllStorage(page);
    await enableDemoMode(page);
    await navigateToTab(page, /Endgame Helper/i);

    const abyssTab = page.getByRole('tab', { name: /Spiral Abyss/i }).first();
    await expect(abyssTab).toBeVisible();
    await abyssTab.click();
    await expect(abyssTab).toHaveAttribute('aria-selected', 'true');

    const abyssPanel = page.locator('#endgame-panel-abyss');
    await expect(abyssPanel).toBeVisible();
    await expect(
      abyssPanel.getByRole('heading', { name: /Spiral Abyss Floor 12 Deployment/i }),
    ).toBeVisible();

    // 1. Healthy active cycle (cycle-7-2): Reliable badge, omitted banner, collapsed details panel
    const dualTeamHeader = abyssPanel.locator('> div').first().locator('> div').first();
    const badgeTrigger = dualTeamHeader.getByRole('button', {
      name: /Toggle reliability details\./i,
    });
    await expect(badgeTrigger).toBeVisible();
    await expect(badgeTrigger).toContainText('Reliable');
    await expect(badgeTrigger).toContainText('Live-Actionable');
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(abyssPanel.locator('[data-reliability-container]')).toHaveCount(0);

    const panelId = await badgeTrigger.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    const detailsPanel = abyssPanel.locator(`[id="${panelId}"]`);
    await expect(detailsPanel).toBeAttached();
    await expect(detailsPanel).toBeHidden();

    // Keyboard interaction: Enter opens, Space closes, preserving focus
    await badgeTrigger.focus();
    await expect(badgeTrigger).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(detailsPanel).toBeVisible();
    await expect(detailsPanel).toContainText('Spiral Abyss Floor 12 — Reliability Details');
    await expect(detailsPanel).toContainText('Evaluated UTC: 2026-11-23');
    await expect(detailsPanel).toContainText('cycle-7-2');

    await page.keyboard.press('Space');
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');
    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toBeFocused();

    // Mouse open + Close button
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await detailsPanel.getByRole('button', { name: 'Close' }).click();
    await expect(detailsPanel).toBeHidden();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'false');

    // Assert zero interactive controls inside live regions
    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    // 2. Healthy production Swap Halves & Recommended Lineups pairing transition
    const swapBtn = abyssPanel.getByRole('button', { name: /^(Swap Halves|Swapped Halves)$/i });
    await expect(swapBtn).toBeEnabled();
    await expect(swapBtn).toHaveAttribute('aria-pressed', 'false');

    const lineupsGroup = abyssPanel.getByRole('group', { name: 'Recommended Abyss Lineups' });
    if ((await lineupsGroup.count()) > 0) {
      const lineupButtons = lineupsGroup.getByRole('button');
      if ((await lineupButtons.count()) > 1) {
        await lineupButtons.nth(1).click();
        await expect(lineupButtons.nth(1)).toHaveAttribute('aria-pressed', 'true');
        await expect(badgeTrigger).toContainText('Reliable');
        await lineupButtons.nth(0).click();
        await expect(lineupButtons.nth(0)).toHaveAttribute('aria-pressed', 'true');
      }
    }

    const teamHeadings = abyssPanel.locator('article h3');
    await expect(teamHeadings).toHaveCount(2);
    const originalFirstTeamName = (await teamHeadings.nth(0).innerText()).trim();
    const originalSecondTeamName = (await teamHeadings.nth(1).innerText()).trim();

    await swapBtn.click();
    await expect(swapBtn).toHaveAttribute('aria-pressed', 'true');
    await expect(swapBtn).toContainText('Swapped Halves');
    await expect(teamHeadings.nth(0)).toHaveText(originalSecondTeamName);
    await expect(teamHeadings.nth(1)).toHaveText(originalFirstTeamName);
    await expect(badgeTrigger).toContainText('Reliable');

    // Details drawer still toggles cleanly while swapped
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();
    await badgeTrigger.click();
    await expect(detailsPanel).toBeHidden();

    // Clicking Swapped Halves again restores original unswapped halves
    await swapBtn.click();
    await expect(swapBtn).toHaveAttribute('aria-pressed', 'false');
    await expect(swapBtn).toContainText('Swap Halves');
    await expect(teamHeadings.nth(0)).toHaveText(originalFirstTeamName);
    await expect(teamHeadings.nth(1)).toHaveText(originalSecondTeamName);

    // 3. Cycle transitions: Historical (cycle-5-3) & Sandbox (custom-sandbox)
    const cycleSelect = abyssPanel.locator('#abyss-cycle-select');
    await cycleSelect.selectOption('cycle-5-3');

    await expect(badgeTrigger).toContainText('Historical');
    await expect(badgeTrigger).toContainText('Not Live-Actionable · Archive');

    const contextBanner = abyssPanel.getByRole('region', {
      name: 'Spiral Abyss Floor 12 reliability context',
    });
    await expect(contextBanner).toBeVisible();
    const bannerDetailsBtn = contextBanner.getByRole('button', { name: /^(Details|Hide Details)$/i });
    await expect(bannerDetailsBtn).toHaveAttribute('aria-controls', panelId!);
    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    // Synchronized Banner Details <-> Badge disclosure
    await bannerDetailsBtn.click();
    await expect(detailsPanel).toBeVisible();
    await expect(badgeTrigger).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerDetailsBtn).toHaveAttribute('aria-expanded', 'true');
    await expect(bannerDetailsBtn).toHaveText('Hide Details');
    await expect(detailsPanel).toContainText('cycle-5-3');

    // Axe WCAG 2.1 AA scan with Historical context banner & details panel expanded
    const historicalAxeScan = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    expect(
      historicalAxeScan.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      ),
    ).toEqual([]);

    await bannerDetailsBtn.click();
    await expect(detailsPanel).toBeHidden();

    // Switch to Custom Sandbox and verify Sandbox Editor stays mounted while editing enemy name
    await cycleSelect.selectOption('custom-sandbox');
    await expect(badgeTrigger).toContainText('Sandbox');
    await expect(badgeTrigger).toContainText('Not Live-Actionable · Simulation');
    await expect(page.locator('[role="alert"] button, [role="status"] button')).toHaveCount(0);

    const enemyInput = abyssPanel.getByLabel('Chamber 12-1 first half enemy name');
    await expect(enemyInput).toBeVisible();
    await enemyInput.fill('Sandbox Abyss Boss');
    await expect(enemyInput).toBeVisible();
    await expect(enemyInput).toHaveValue('Sandbox Abyss Boss');
    await expect(badgeTrigger).toContainText('Sandbox');

    // 4. Mobile 320px viewport overflow check with details panel expanded
    await cycleSelect.selectOption('cycle-5-3');
    await expect(badgeTrigger).toContainText('Historical');
    await page.setViewportSize({ width: 320, height: 700 });
    await badgeTrigger.scrollIntoViewIfNeeded();
    await badgeTrigger.click();
    await expect(detailsPanel).toBeVisible();

    const overflowCheck = await detailsPanel.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      return {
        docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        panelRight: rect.right,
        panelLeft: rect.left,
        viewportWidth: window.innerWidth,
      };
    });
    expect(overflowCheck.docOverflow).toBe(false);
    expect(overflowCheck.panelLeft).toBeGreaterThanOrEqual(-1);
    expect(overflowCheck.panelRight).toBeLessThanOrEqual(overflowCheck.viewportWidth + 1);
  });
});
