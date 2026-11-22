import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration for Project Celestia.
 * Full 4-browser test matrix across Desktop & Mobile viewport presets.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Mobile Chromium (Pixel 5)',
      use: {
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile WebKit (iPhone 13)',
      use: {
        ...devices['iPhone 13'],
      },
    },
  ],
  webServer: {
    command: 'pnpm run preview --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
