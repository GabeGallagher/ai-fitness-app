import type { Page } from '@playwright/test';

import type { E2eSeedEntry } from '../../src/app/core/e2e/e2e-api';

export interface OpenAppOptions {
  /** The day the app treats as today, `YYYY-MM-DD` in the test time zone (playwright.config.ts). */
  today: string;
  /** Entries to put in the database once the app has started. */
  entries?: E2eSeedEntry[];
  /** Route to open. Defaults to the start screen. */
  path?: string;
}

/**
 * Opens the app with the clock fixed on `today` and an otherwise empty database
 * (each test gets a fresh browser context), then seeds `entries` through the
 * `window.__e2e` hook. Screens update from the database's live queries, so seeded
 * entries appear without a reload.
 */
export async function openApp(page: Page, { today, entries = [], path = '/' }: OpenAppOptions): Promise<void> {
  // 17:00 UTC is midday in America/New_York, with or without daylight saving time.
  await page.clock.setFixedTime(new Date(`${today}T17:00:00Z`));
  await page.goto(path);
  await page.waitForFunction(() => window.__e2e !== undefined);
  if (entries.length > 0) {
    await page.evaluate((seed) => window.__e2e!.seed(seed), entries);
  }
}

/** Number of log entries in the app's database. */
export function countEntries(page: Page): Promise<number> {
  return page.evaluate(() => window.__e2e!.count());
}
