import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E configuration template for Project Celestia.
 * Supports headless multi-browser execution across Desktop & Mobile viewport presets.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 15000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'html',
  use: {
    actionTimeout: 0,
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Mobile Chrome (Pixel 5)',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  webServer: {
    command: 'pnpm run preview --port 4173 --host',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
