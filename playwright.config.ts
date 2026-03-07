import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid dev server resource contention
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use 1 worker (sequential) to prevent parallel test timeouts
  reporter: 'html',
  timeout: 60000, // 60s per test (reduced from 120s after optimization)
  expect: { timeout: 10000 }, // 10s for assertions

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 30000, // 30s - preview server can be slow to respond
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchArgs: ['--mute-audio'],
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        launchArgs: ['-pref', 'media.volume_default=0'],
      },
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        launchArgs: ['--mute-audio'],
      },
    },
    {
      name: 'solver',
      use: {
        ...devices['Desktop Chrome'],
        screenshot: 'on',
        viewport: { width: 430, height: 932 },
      },
      testMatch: 'tests/e2e/pipe-solver.spec.ts',
    },
  ],
  webServer: {
    // Use preview (production build) instead of dev server to avoid Vite HMR
    // interfering with tests and causing page.goto timeouts
    command: 'npm run build && npm run preview -- --port 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: false, // Always start fresh — no HMR, no stale state
    timeout: 120000,
  }
});
