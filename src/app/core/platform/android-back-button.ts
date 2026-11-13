import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { IonRouterOutlet, Platform } from '@ionic/angular';

/**
 * Where this handler sits in Ionic's back-button chain: above Ionic's page stack
 * (0, goes back one screen), below side menus (99) and overlays such as popovers and
 * modals (100), which close first.
 */
export const LEAVE_APP_PRIORITY = 1;

/** Leaves the app the way Android's own screens do: to the background, not closed. */
export function minimizeOnAndroid(): void {
  if (Capacitor.isNativePlatform()) {
    void App.minimizeApp();
  }
}

/**
 * The Android back button (SPEC.md §3):
 * 1. An open popup, menu, or modal closes first (Ionic's overlays and menus).
 * 2. Otherwise it goes back one screen (Ionic's page stack).
 * 3. On a screen with nowhere to go back to, it leaves the app.
 */
export function setUpAndroidBackButton(
  platform: Pick<Platform, 'backButton'>,
  outlet: () => Pick<IonRouterOutlet, 'canGoBack'>,
  leaveApp: () => void = minimizeOnAndroid,
): void {
  if (Capacitor.isNativePlatform()) {
    // Capacitor passes the back button to the page, where Ionic handles it, only while
    // something listens for it. Without this, Ionic never sees the button.
    void App.addListener('backButton', () => undefined);
  }

  platform.backButton.subscribeWithPriority(LEAVE_APP_PRIORITY, (processNextHandler) => {
    if (outlet().canGoBack()) {
      processNextHandler();
    } else {
      leaveApp();
    }
  });
}
