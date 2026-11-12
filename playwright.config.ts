import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests (ADR-005): the `e2e` build in Chromium with Android phone emulation.
 * Port 4300 keeps it clear of `npm start` on 4200.
 */
const PORT = 4300;

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Fixed so day labels and "today" don't depend on the machine running the tests.
    timezoneId: 'America/New_York',
    locale: 'en-US',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'android-chromium', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npx ng serve --configuration e2e --port ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
