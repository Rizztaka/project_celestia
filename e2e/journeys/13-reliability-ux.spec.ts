import { test, expect, type Locator, type Page } from '@playwright/test';
import { clearAllStorage, navigateToTab } from '../fixtures/test-helpers';

async function openAssumptionsModal(page: Page): Promise<Locator> {
  await navigateToTab(page, /Pull Advisor/i);
  await expect(page.locator('text=Who Should You Pull Next?').first()).toBeVisible();

  const assumptionsBtn = page.getByRole('button', { name: /Assumptions & Methodology/i }).first();
  await assumptionsBtn.click();

  const modal = page.getByRole('dialog').first();
  await expect(modal).toBeVisible();
  return modal;
}

async function getFirstFreshnessDisclosure(modal: Locator) {
  const trigger = modal.getByRole('button', { name: /Data Freshness Status:/i }).first();
  await expect(trigger).toBeVisible();

  const popoverId = await trigger.getAttribute('aria-controls');
  expect(popoverId).toBeTruthy();

  const popover = modal.locator(`[id="${popoverId}"]`);
  return { trigger, popover };
}

async function expectPopoverWithinViewport(
  popover: Locator,
  viewportWidth: number,
  margin = 16,
): Promise<{ x: number; y: number; width: number; height: number }> {
  let measured: { x: number; y: number; width: number; height: number } | null = null;

  await expect(async () => {
    const box = await popover.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.x).toBeGreaterThanOrEqual(margin - 1);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewportWidth - margin + 1);
    expect(box!.width).toBeLessThanOrEqual(viewportWidth - margin * 2 + 1);
    measured = box;
  }).toPass({ timeout: 5000 });

  return measured!;
}

test.describe('Journey 13: Reliability & DataFreshnessBadge UX', () => {
  test.beforeEach(async ({ page }) => {
    await clearAllStorage(page);
    await page.goto('/');
  });

  test('opens and closes the disclosure via mouse click', async ({ page }) => {
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popover).toBeHidden();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popover).toBeVisible();

    await trigger.click();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popover).toBeHidden();
  });

  test('operates the trigger with Enter and Space keys', async ({ page }) => {
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.focus();
    await expect(trigger).toBeFocused();

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popover).toBeVisible();

    await page.keyboard.press('Enter');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popover).toBeHidden();

    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(popover).toBeVisible();

    await page.keyboard.press('Space');
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(popover).toBeHidden();
  });

  test('closes disclosure on first Escape without closing modal, and closes modal on second Escape', async ({
    page,
  }) => {
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.click();
    await expect(popover).toBeVisible();
    await expect(modal).toBeVisible();

    // First Escape closes only the disclosure
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(modal).toBeVisible();

    // Second Escape closes the parent modal
    await page.keyboard.press('Escape');
    await expect(modal).toBeHidden();
  });

  test('close button dismisses the disclosure and restores focus to the trigger', async ({
    page,
  }) => {
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.click();
    await expect(popover).toBeVisible();

    const closeBtn = popover.getByRole('button', { name: 'Close data freshness details' });
    await closeBtn.click();

    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).toBeFocused();
  });

  test('outside click closes the disclosure without stealing focus back to the trigger', async ({
    page,
  }) => {
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.click();
    await expect(popover).toBeVisible();

    const closeBtn = popover.getByRole('button', { name: 'Close data freshness details' });
    await closeBtn.focus();
    await expect(closeBtn).toBeFocused();

    // Click outside the badge container onto the modal heading
    const outsideHeading = modal.locator('#assumptions-modal-title');
    await outsideHeading.click();

    await expect(popover).toBeHidden();
    await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    await expect(trigger).not.toBeFocused();
    await expect(modal).toBeVisible();
  });

  test('keeps popover within 16px viewport bounds at narrow and wide viewport widths', async ({
    page,
  }) => {
    // Narrow mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(popover).toBeVisible();
    await expectPopoverWithinViewport(popover, 375);

    // Close and verify at wide desktop viewport
    await trigger.click();
    await expect(popover).toBeHidden();

    await page.setViewportSize({ width: 1280, height: 800 });
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(popover).toBeVisible();
    await expectPopoverWithinViewport(popover, 1280);
  });

  test('recalculates horizontal position cleanly without accumulated offset on resize in both directions', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    const modal = await openAssumptionsModal(page);
    const { trigger, popover } = await getFirstFreshnessDisclosure(modal);

    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(popover).toBeVisible();
    await expectPopoverWithinViewport(popover, 375);

    // Resize wider while open: stale positive offset must clear so popover realigns with right-0
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(async () => {
      const triggerBox = await trigger.boundingBox();
      const popoverBox = await popover.boundingBox();
      expect(triggerBox).not.toBeNull();
      expect(popoverBox).not.toBeNull();
      expect(popoverBox!.x).toBeGreaterThanOrEqual(15);
      expect(popoverBox!.x + popoverBox!.width).toBeLessThanOrEqual(1280 - 15);
      // Right-aligned popover edge should match trigger right edge (offset reset to 0)
      expect(
        Math.abs(popoverBox!.x + popoverBox!.width - (triggerBox!.x + triggerBox!.width)),
      ).toBeLessThanOrEqual(2);
    }).toPass({ timeout: 5000 });

    // Resize narrower while still open: popover must clamp cleanly inside narrow viewport
    await page.setViewportSize({ width: 320, height: 700 });
    await trigger.scrollIntoViewIfNeeded();
    await expectPopoverWithinViewport(popover, 320);

    // Resize back to wide once more to confirm no drift across consecutive resizes
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(async () => {
      const triggerBox = await trigger.boundingBox();
      const popoverBox = await popover.boundingBox();
      expect(triggerBox).not.toBeNull();
      expect(popoverBox).not.toBeNull();
      expect(
        Math.abs(popoverBox!.x + popoverBox!.width - (triggerBox!.x + triggerBox!.width)),
      ).toBeLessThanOrEqual(2);
    }).toPass({ timeout: 5000 });
  });
});
