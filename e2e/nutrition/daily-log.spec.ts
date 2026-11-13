import { expect, test, type Locator, type Page } from '@playwright/test';

import type { E2eSeedEntry } from '../../src/app/core/e2e/e2e-api';
import { openApp } from '../support/app';
import { pressAndroidBack, swipe } from '../support/gestures';

// Daily log (docs/features/nutrition/daily-log/spec.md), E2E rows of its Verification table.
// Today is Tue, Nov 10, 2026 in every test: the same dates as the spec's day-label table.
const TODAY = '2026-11-10';

const entry = (date: string, meal: E2eSeedEntry['meal'], kcal: number, carbsG = 0, proteinG = 0, fatG = 0): E2eSeedEntry => ({
  date,
  meal,
  foodName: 'x',
  kcal,
  carbsG,
  proteinG,
  fatG,
});

/** Today matches the mockup (660 kcal: 66 g carbs, 24 g protein, 33 g fat); yesterday has 900 kcal at lunch. */
const SAMPLE = [entry(TODAY, 'breakfast', 660, 66, 24, 33), entry('2026-11-09', 'lunch', 900, 90, 45, 40)];

// The daily log stays in the page while a stub is open, so scope its selectors to it.
const log = (page: Page) => page.locator('app-daily-log-page');
const dayLabel = (page: Page) => log(page).locator('.day-label');
const tracking = (page: Page) => log(page).locator('.side').nth(0).locator('.stat');
const meals = (page: Page) => log(page).locator('.side').nth(1).locator('.stat');
const mealValues = (page: Page) => meals(page).locator('.value');
const ringKind = (page: Page) => log(page).locator('app-apple-ring .kind');
const ringAmount = (page: Page) => log(page).locator('app-apple-ring .amount');
const selectedStripDay = (page: Page) => log(page).locator('app-week-strip .label.selected');
const openOverlays = (page: Page) => page.locator('ion-popover:not(.overlay-hidden)');

async function goBackDays(page: Page, days: number): Promise<void> {
  for (let i = 0; i < days; i++) await log(page).locator('ion-button.prev-day').click();
}

test.describe('Daily log', () => {
  test("opens on today and shows every region in the mockup's order", async ({ page }) => {
    await openApp(page, { today: TODAY });
    await expect(dayLabel(page)).toHaveText('Today');

    const box = async (target: Locator) => {
      const b = await target.boundingBox();
      if (!b) throw new Error(`not visible: ${target}`);
      return b;
    };

    // Header, left to right: hamburger, back arrow, day control, forward arrow, ⋮.
    const header = [
      log(page).locator('#nav-menu-trigger'),
      log(page).locator('ion-button.prev-day'),
      log(page).locator('#day-picker-trigger'),
      log(page).locator('ion-button.next-day'),
      log(page).getByRole('button', { name: 'More options' }),
    ];
    const headerX = await Promise.all(header.map(async (target) => (await box(target)).x));
    expect(headerX).toEqual([...headerX].sort((a, b) => a - b));

    // Top to bottom: header, calorie budget, ring, View All Meals, macro bars, pie, week strip.
    const column = ['ion-header', '.budget', 'app-apple-ring', 'ion-button.view-all', 'app-macro-bars', 'app-macro-pie', 'app-week-strip'];
    const columnY = await Promise.all(column.map(async (s) => (await box(log(page).locator(s))).y));
    expect(columnY).toEqual([...columnY].sort((a, b) => a - b));

    // Exercise/Steps/Water/Notes left of the ring, the four meals right of it.
    const ring = await box(log(page).locator('app-apple-ring'));
    expect((await box(tracking(page).first())).x).toBeLessThan(ring.x);
    expect((await box(meals(page).first())).x).toBeGreaterThan(ring.x + ring.width / 2);
    await expect(tracking(page).locator('.name')).toHaveText(['Exercise', 'Steps', 'Water', 'Notes']);
    await expect(meals(page).locator('.name')).toHaveText(['Breakfast', 'Lunch', 'Dinner', 'Snacks']);

    // Scan and Add float at the bottom right.
    const viewport = page.viewportSize()!;
    for (const fab of ['.fab.scan', '.fab.add']) {
      const b = await box(log(page).locator(fab));
      expect(b.x).toBeGreaterThan(viewport.width / 2);
      expect(b.y).toBeGreaterThan(viewport.height / 2);
    }

    // Seven days in the strip, today in the center.
    await expect(log(page).locator('app-week-strip .label')).toHaveCount(7);
    await expect(log(page).locator('app-week-strip .label').nth(3)).toHaveClass(/selected/);
  });

  test('the arrows change the day, and every section follows', async ({ page }) => {
    await openApp(page, { today: TODAY, entries: SAMPLE });
    await expect(mealValues(page)).toHaveText(['660', '0', '0', '0']);

    await log(page).locator('ion-button.next-day').click();
    await expect(dayLabel(page)).toHaveText('Tomorrow, Nov 11');
    await expect(mealValues(page)).toHaveText(['0', '0', '0', '0']);
    await expect(ringAmount(page)).toHaveText('2,000');
    await expect(log(page).locator('app-macro-pie dd')).toHaveText(['0g', '0g', '0g']);
    await expect(selectedStripDay(page)).toContainText('11');

    await goBackDays(page, 2);
    await expect(dayLabel(page)).toHaveText('Yesterday, Nov 9');
    await expect(mealValues(page)).toHaveText(['0', '900', '0', '0']);
    await expect(ringAmount(page)).toHaveText('1,100');
    await expect(log(page).locator('app-macro-pie dd')).toHaveText(['90g', '45g', '40g']);
    await expect(selectedStripDay(page)).toContainText('9');

    await goBackDays(page, 1);
    await expect(dayLabel(page)).toHaveText('Sun, Nov 8');
  });

  test('swiping the page left goes to the next day, and right to the previous day', async ({ page }) => {
    await openApp(page, { today: TODAY, entries: SAMPLE });
    const ring = log(page).locator('app-apple-ring');

    await swipe(page, ring, -200);
    await expect(dayLabel(page)).toHaveText('Tomorrow, Nov 11');
    await expect(mealValues(page)).toHaveText(['0', '0', '0', '0']);

    await swipe(page, ring, 200);
    await swipe(page, ring, 200);
    await expect(dayLabel(page)).toHaveText('Yesterday, Nov 9');
    await expect(mealValues(page)).toHaveText(['0', '900', '0', '0']);
  });

  test('swiping the week strip moves the selected day by one', async ({ page }) => {
    await openApp(page, { today: TODAY });
    const strip = log(page).locator('app-week-strip');

    await swipe(page, strip, -200);
    await expect(dayLabel(page)).toHaveText('Tomorrow, Nov 11');
    await expect(selectedStripDay(page)).toContainText('11');

    await swipe(page, strip, 200);
    await expect(dayLabel(page)).toHaveText('Today');
  });

  test('picking a date in the calendar shows that day', async ({ page }) => {
    await openApp(page, { today: TODAY, entries: [entry('2026-11-08', 'dinner', 450)] });

    await log(page).locator('#day-picker-trigger').click();
    await page.locator('ion-datetime button[data-year="2026"][data-month="11"][data-day="8"]').click();

    await expect(dayLabel(page)).toHaveText('Sun, Nov 8');
    await expect(mealValues(page)).toHaveText(['0', '0', '450', '0']);
    await expect(openOverlays(page)).toHaveCount(0);
  });

  test('the calendar shows a day a year ahead and a year back', async ({ page }) => {
    await openApp(page, { today: TODAY });
    const monthLabel = page.locator('ion-datetime .calendar-month-year-toggle');
    const calendarBody = page.locator('ion-datetime .calendar-body');

    /** "November 2026" → months since year 0, for comparing calendar positions. */
    const monthIndex = (label: string) => {
      const date = new Date(`1 ${label.trim()}`);
      return date.getFullYear() * 12 + date.getMonth();
    };

    /**
     * Steps the open calendar one month at a time until it shows `year`-`month` (1-12),
     * as a person would with the arrows. Ionic ignores taps while the calendar is still
     * sliding to the new month, so each step waits for the scroll to settle and retries
     * an ignored tap; if a late tap overshoots, the next step walks back.
     */
    async function stepTo(year: number, month: number) {
      const target = year * 12 + (month - 1);
      for (let guard = 0; guard < 40; guard++) {
        const before = (await monthLabel.textContent()) ?? '';
        const diff = target - monthIndex(before);
        if (diff === 0) return;
        const arrow = page.locator(`ion-datetime [aria-label="${diff > 0 ? 'Next month' : 'Previous month'}"]`);
        await expect(async () => {
          await arrow.click();
          await expect(monthLabel).not.toHaveText(before, { timeout: 1500 });
        }).toPass({ timeout: 10_000 });
        await calendarBody.evaluate(
          (el) =>
            new Promise<void>((resolve) => {
              let last = -1;
              let stableFrames = 0;
              const tick = () => {
                stableFrames = el.scrollLeft === last ? stableFrames + 1 : 0;
                last = el.scrollLeft;
                if (stableFrames >= 5) resolve();
                else requestAnimationFrame(tick);
              };
              tick();
            }),
        );
      }
      throw new Error(`calendar never reached ${year}-${month}`);
    }

    test.setTimeout(120_000); // two years of month-by-month steps

    await log(page).locator('#day-picker-trigger').click();
    await stepTo(2027, 11);
    await page.locator('ion-datetime button[data-year="2027"][data-month="11"][data-day="10"]').click();
    await expect(dayLabel(page)).toHaveText('Wed, Nov 10');

    // Start again from today, rather than stepping back two years from Nov 2027.
    await openApp(page, { today: TODAY });
    await log(page).locator('#day-picker-trigger').click();
    await stepTo(2025, 11);
    await page.locator('ion-datetime button[data-year="2025"][data-month="11"][data-day="10"]').click();
    await expect(dayLabel(page)).toHaveText('Mon, Nov 10');
  });

  test.describe('every Navigation row that opens a stub, and going back to the day it was opened from', () => {
    const openMenuLink = (label: string) => async (page: Page) => {
      await log(page).locator('#nav-menu-trigger').click();
      await page.locator('ion-popover ion-item').getByText(label, { exact: true }).click();
    };

    const STUBS: { tap: string; open: (page: Page) => Promise<void>; title: string; url: string }[] = [
      { tap: 'Calorie budget', open: (p) => log(p).locator('.budget').click(), title: 'Targets', url: '/nutrition/targets' },
      ...['Breakfast', 'Lunch', 'Dinner', 'Snacks'].map((meal) => ({
        tap: meal,
        open: (p: Page) => meals(p).filter({ hasText: meal }).click(),
        title: meal,
        url: `/nutrition/meal/${meal.toLowerCase()}`,
      })),
      ...['Exercise', 'Steps', 'Water', 'Notes'].map((item) => ({
        tap: item,
        open: (p: Page) => tracking(p).filter({ hasText: item }).click(),
        title: item,
        url: `/daily-tracking/${item.toLowerCase()}`,
      })),
      { tap: 'Add (+)', open: (p) => log(p).locator('.fab.add').click(), title: 'Log food', url: '/nutrition/log-food' },
      ...['Meals', 'Exercise', 'Weight'].map((link) => ({
        tap: `Hamburger menu › ${link}`,
        open: openMenuLink(link),
        title: link,
        url: `/${link.toLowerCase()}`,
      })),
    ];

    for (const stub of STUBS) {
      test(`${stub.tap} opens the ${stub.title} stub`, async ({ page }) => {
        await openApp(page, { today: TODAY });
        await goBackDays(page, 2);
        await expect(dayLabel(page)).toHaveText('Sun, Nov 8');

        await stub.open(page);
        await expect(page).toHaveURL(new RegExp(`${stub.url}$`));
        const stubPage = page.locator('app-stub-page');
        await expect(stubPage.locator('ion-title')).toHaveText(stub.title);

        // Back with the stub's back button...
        await stubPage.locator('ion-back-button').click();
        await expect(page).toHaveURL(/\/nutrition\/daily-log$/);
        await expect(stubPage).toHaveCount(0);
        await expect(dayLabel(page)).toHaveText('Sun, Nov 8');

        // ...and with the Android back button.
        await stub.open(page);
        await expect(stubPage.locator('ion-title')).toHaveText(stub.title);
        // A menu link's popover is still animating closed for a moment; Ionic gives a back
        // press to a closing popover first. Press once it's gone, as a person would.
        await expect(openOverlays(page)).toHaveCount(0);
        await pressAndroidBack(page);
        await expect(page).toHaveURL(/\/nutrition\/daily-log$/);
        await expect(stubPage).toHaveCount(0);
        await expect(dayLabel(page)).toHaveText('Sun, Nov 8');
      });
    }
  });

  test('the Android back button closes an open menu or calendar first, and stays on the daily log', async ({ page }) => {
    await openApp(page, { today: TODAY });
    await goBackDays(page, 2);

    await log(page).locator('#nav-menu-trigger').click();
    await expect(openOverlays(page)).toHaveCount(1);
    await pressAndroidBack(page);
    await expect(openOverlays(page)).toHaveCount(0);

    await log(page).locator('#day-picker-trigger').click();
    await expect(openOverlays(page)).toHaveCount(1);
    await pressAndroidBack(page);
    await expect(openOverlays(page)).toHaveCount(0);

    // Nothing open and nowhere to go back to: the app leaves on a phone (a manual check);
    // in the browser it stays put rather than going anywhere else.
    await pressAndroidBack(page);
    await expect(page).toHaveURL(/\/nutrition\/daily-log$/);
    await expect(dayLabel(page)).toHaveText('Sun, Nov 8');
  });

  test('the Diet Dashboard menu link closes the menu and stays on the daily log', async ({ page }) => {
    await openApp(page, { today: TODAY });
    await goBackDays(page, 2);

    await log(page).locator('#nav-menu-trigger').click();
    await page.locator('ion-popover ion-item').getByText('Diet Dashboard', { exact: true }).click();

    await expect(openOverlays(page)).toHaveCount(0);
    await expect(page).toHaveURL(/\/nutrition\/daily-log$/);
    await expect(page.locator('app-stub-page')).toHaveCount(0);
    await expect(dayLabel(page)).toHaveText('Sun, Nov 8');
  });

  test('View All Meals, the ⋮ menus, Scan, and the macro bars, pie, and legend do nothing', async ({ page }) => {
    await openApp(page, { today: TODAY, entries: SAMPLE });
    await expect(mealValues(page)).toHaveText(['660', '0', '0', '0']);

    // Ionic moves an ion-button's aria-label onto the native button inside it, so find those by name.
    const controls: [string, Locator][] = [
      ['View All Meals', log(page).locator('ion-button.view-all')],
      ['header ⋮', log(page).getByRole('button', { name: 'More options' })],
      ['calorie card ⋮', log(page).getByRole('button', { name: 'Summary options' })],
      ['pie ⋮', log(page).getByRole('button', { name: 'Macro options' })],
      ['Scan', log(page).locator('.fab.scan')],
      ['macro bars', log(page).locator('app-macro-bars')],
      ['pie', log(page).locator('app-macro-pie svg')],
      ['legend', log(page).locator('app-macro-pie dl')],
    ];
    for (const [name, control] of controls) {
      await control.click();
      await expect(openOverlays(page), name).toHaveCount(0);
      await expect(page, name).toHaveURL(/\/nutrition\/daily-log$/);
      await expect(page.locator('app-stub-page'), name).toHaveCount(0);
      await expect(dayLabel(page), name).toHaveText('Today');
      await expect(mealValues(page), name).toHaveText(['660', '0', '0', '0']);
    }
  });

  test('an empty day shows 0 everywhere, no strip bar, and the rest-day dot', async ({ page }) => {
    await openApp(page, { today: TODAY, entries: [entry('2026-11-09', 'lunch', 900, 90, 45, 40)] });

    await expect(mealValues(page)).toHaveText(['0', '0', '0', '0']);
    await expect(ringKind(page)).toHaveText('Left');
    await expect(ringAmount(page)).toHaveText('2,000');
    await expect(log(page).locator('app-macro-bars .row span')).toHaveText([
      'Carbs', '50%', '0g', 'left 250g',
      'Protein', '20%', '0g', 'left 100g',
      'Fat', '30%', '0g', 'left 67g',
    ]);
    await expect(log(page).locator('app-macro-pie circle.empty')).toHaveCount(1);
    await expect(log(page).locator('app-macro-pie dd')).toHaveText(['0g', '0g', '0g']);

    const columns = log(page).locator('app-week-strip .col');
    await expect(columns.nth(2).locator('.bar')).toHaveCount(1); // yesterday: logged
    await expect(columns.nth(3).locator('.bar')).toHaveCount(0); // today: empty
    await expect(columns.nth(3).locator('.dot')).toHaveAttribute('style', /--ft-day-rest/);
  });

  test('with the network off, the screen changes day and shows data, and no request leaves the app', async ({ page, context, baseURL }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await openApp(page, { today: TODAY, entries: SAMPLE });
    await expect(mealValues(page)).toHaveText(['660', '0', '0', '0']);

    await context.setOffline(true);
    await goBackDays(page, 1);
    await expect(dayLabel(page)).toHaveText('Yesterday, Nov 9');
    await expect(mealValues(page)).toHaveText(['0', '900', '0', '0']);
    await swipe(page, log(page).locator('app-apple-ring'), -200);
    await expect(dayLabel(page)).toHaveText('Today');
    await expect(mealValues(page)).toHaveText(['660', '0', '0', '0']);

    const external = requests.filter((url) => /^https?:/.test(url) && !url.startsWith(baseURL!));
    expect(external).toEqual([]);
  });
});
