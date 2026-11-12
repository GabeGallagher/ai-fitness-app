// Polyfills for running unit tests under jsdom (the default Vitest environment).

// IndexedDB, which jsdom doesn't have: an in-memory implementation, so integration
// tests (*.integration.spec.ts) run the real Dexie database code (ADR-005). Give each
// test its own database name so tests don't share data.
import 'fake-indexeddb/auto';

// Ionic components such as ion-menu and ion-split-pane query `window.matchMedia`,
// which jsdom does not implement.
if (!window.matchMedia) {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
