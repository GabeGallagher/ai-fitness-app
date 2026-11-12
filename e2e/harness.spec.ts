import { expect, test } from '@playwright/test';

import { countEntries, openApp } from './support/app';

// Checks the E2E setup itself (ADR-005), not any feature.
test.describe('e2e harness', () => {
  // In order, in one worker: the last test relies on running after the seeding test.
  test.describe.configure({ mode: 'serial' });

  test('starts with an empty database: the e2e build has no dev seed', async ({ page }) => {
    await openApp(page, { today: '2026-11-10' });
    // The dev seed runs at startup without being awaited; give it time to show up if it ran.
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);
    expect(await countEntries(page)).toBe(0);
  });

  test('seeds entries through the test hook', async ({ page }) => {
    await openApp(page, {
      today: '2026-11-10',
      entries: [{ date: '2026-11-10', meal: 'breakfast', foodName: 'Oats', kcal: 300, carbsG: 50, proteinG: 10, fatG: 5 }],
    });
    expect(await countEntries(page)).toBe(1);
  });

  test('fixes the clock on the given day in the test time zone', async ({ page }) => {
    await openApp(page, { today: '2026-11-10' });
    expect(await page.evaluate(() => new Date().toDateString())).toBe('Tue Nov 10 2026');
  });

  test('gives each test its own database', async ({ page }) => {
    // The previous test seeded an entry; this one must not see it.
    await openApp(page, { today: '2026-11-10' });
    expect(await countEntries(page)).toBe(0);
  });
});
