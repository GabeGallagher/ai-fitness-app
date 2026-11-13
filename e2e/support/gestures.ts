import type { Locator, Page } from '@playwright/test';

/**
 * Presses the Android back button: sends the `backbutton` event that Capacitor sends
 * the page on a phone. Needs the e2e build (`browserBackButton: true`). Leaving the
 * app from the daily log only happens on the phone, so it's a manual check.
 */
export async function pressAndroidBack(page: Page): Promise<void> {
  await page.evaluate(() => document.dispatchEvent(new Event('backbutton')));
}

/**
 * Swipes horizontally across `target` with real touch events (Chromium DevTools
 * protocol), the way a finger on a phone screen does. Negative `dx` swipes left.
 */
export async function swipe(page: Page, target: Locator, dx: number): Promise<void> {
  const box = await target.boundingBox();
  if (!box) throw new Error('swipe: target is not visible');
  const y = box.y + box.height / 2;
  const startX = box.x + box.width / 2 - dx / 2;
  const steps = 12;

  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', x: number) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] });

  await touch('touchStart', startX);
  for (let i = 1; i <= steps; i++) {
    await touch('touchMove', startX + (dx * i) / steps);
  }
  await touch('touchEnd', startX + dx);
  await cdp.detach();
}
