import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E config for HealthStats (Task 22).
 * Runs against a production `vite preview` server on a dedicated port (separate
 * from the dev server on 8443) so tests are fast, deterministic and unaffected
 * by HMR/on-demand compilation.
 *
 * Tests intentionally avoid mutating the real Supabase database: they exercise
 * the demo-login bypass and read-only / UI flows so they are safe and
 * deterministic without an isolated test DB.
 */
const PORT = 4599
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testIgnore: '**/*.mobile.spec.ts',
    },
    {
      name: 'mobile',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/*.mobile.spec.ts',
    },
  ],
  webServer: {
    command: `./node_modules/.bin/vite build && ./node_modules/.bin/vite preview --port ${PORT} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
