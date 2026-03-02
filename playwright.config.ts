import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run tests sequentially to avoid dev server resource contention
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Use 1 worker (sequential) to prevent parallel test timeouts
  reporter: 'html',
  timeout: 120000, // 120s per test (increased from 60s)
  expect: { timeout: 15000 }, // Increased from 10s

  use: {
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    navigationTimeout: 45000, // Increased from 30s
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
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
     command: 'npm run dev',
     url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
     timeout: 220000,
  }
});
