# Project Celestia — Playwright E2E Setup Guide

This guide describes how to configure and execute real browser End-to-End (E2E) testing for Project Celestia using Playwright.

---

## 1. Dual-Tier Testing Strategy

Project Celestia employs a high-velocity, reliable two-tier testing architecture:

1. **Tier 1 — In-Memory Journey Tests (`src/tests/e2e-user-journeys.test.ts`)**:
   - Executes inside Vitest using simulated DOM and localStorage environments.
   - Covers all 8 core user journeys: Onboarding, Profiles, Weapon Transfers, Pull Budget Math, Team Generation, Abyss/Theater Drafting, Error Boundary, and Backup/Restore.
   - Runs in < 10 seconds without browser dependencies; integrated into our GitHub Actions Quality Gate.

2. **Tier 2 — Headless Browser Suite (`playwright.config.ts`)**:
   - Validates real rendering, browser layout, touch targets, and viewport responsiveness.
   - Configured for Chromium, Firefox, WebKit, and mobile viewport devices (Pixel 5, iPhone 13).

---

## 2. Installation & Prerequisites

To install Playwright browser binaries locally:

```bash
# 1. Install Playwright test package (if not already installed)
pnpm add -D @playwright/test

# 2. Install browser binaries and OS dependencies
pnpm exec playwright install --with-deps
```

---

## 3. Running Browser Tests Locally

### Run All Browser Tests
```bash
# Build the production bundle first
pnpm run build

# Run Playwright tests against Vite preview server (http://localhost:4173)
pnpm exec playwright test
```

### Interactive UI Mode (Debugging & Inspection)
```bash
pnpm exec playwright test --ui
```

### Run on Specific Viewport / Browser
```bash
# Mobile iPhone 13
pnpm exec playwright test --project="Mobile Safari (iPhone 13)"

# Mobile Android Pixel 5
pnpm exec playwright test --project="Mobile Chrome (Pixel 5)"

# Desktop 1080p
pnpm exec playwright test --project="Desktop Chrome"
```

---

## 4. Test Structure & Directory Conventions

Place Playwright spec files under the `e2e/` directory:

```
e2e/
├── onboarding.spec.ts         # First-time visit, demo toggle, empty roster
├── armory-swaps.spec.ts        # Drag-and-drop / weapon transfer modals
├── team-generator.spec.ts     # Character selection and team generation
└── backup-restore.spec.ts     # JSON file upload and download flows
```

Example test snippet (`e2e/onboarding.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';

test.describe('Onboarding & Demo Toggle', () => {
  test('starts with authentic empty roster and enables demo mode', async ({ page }) => {
    await page.goto('/');

    // Verify empty state
    await expect(page.locator('text=No characters selected')).toBeVisible();

    // Toggle demo mode
    await page.click('button:has-text("Demo Mode")');

    // Verify 11 demo characters loaded
    await expect(page.locator('[data-testid="character-card"]')).toHaveCount(11);
  });
});
```

---

## 5. Continuous Integration (CI) Workflow

To add real browser tests to GitHub Actions (`.github/workflows/quality-gate.yml`), append:

```yaml
      - name: Install Playwright Browsers
        run: pnpm exec playwright install --with-deps

      - name: Run Playwright E2E Tests
        run: pnpm exec playwright test
        env:
          CI: true

      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

---

## 6. Troubleshooting & Tips

- **Vite preview port in use**: Ensure port 4173 is free or configure a custom port in `playwright.config.ts`.
- **LocalStorage persistence**: Playwright runs in isolated incognito contexts per test by default, ensuring test isolation.
- **Viewing failure traces**: Run `pnpm exec playwright show-trace test-results/.../trace.zip` to step through network events and DOM snapshots.
