# ADR-005: Testing and verification

> Status: **Accepted in part** (2026-11-12). Test layers, the E2E target, E2E test data, and spec verification are decided by the owner. CI and Claude hooks are still open (see [Open](#open)).

## Context
- The app is Android only ([SPEC.md §3](../SPEC.md#3-platform-and-users)), but it's an Ionic web app in a Capacitor WebView. IndexedDB runs the same in desktop Chrome and in the Android WebView ([ADR-002](002-local-storage.md)), so browser tests exercise the real database code.
- The first code pass (the [Daily log](../features/nutrition/daily-log/spec.md)) shipped with unit tests and one component test. Nothing tested the real database through to the screen, or ran the app in a browser.
- Each spec's definition of done needs to show how each item is proven, not just that the code exists.

## Decision

### Test layers
| Layer | What it tests | Tool | Where |
|---|---|---|---|
| **Unit** | Pure functions (date math, day summaries, scale rules) | Vitest + jsdom (Angular `unit-test` builder) | `*.spec.ts` next to the code |
| **Component** | One page or component in Angular's TestBed, with the repository and navigation faked | Vitest + jsdom | `*.spec.ts` next to the code |
| **Integration** | The real repositories and Dexie database, the store, and the page together, on an in-memory IndexedDB. Covers live queries updating the screen. | Vitest + [fake-indexeddb](https://github.com/dumbmatter/fakeIndexedDB); a fresh database per test through the `APP_DB` token | `*.integration.spec.ts` next to the code |
| **E2E** | The built app in a browser: real IndexedDB, real touch gestures, a fixed clock, no network | [Playwright](https://playwright.dev), Chromium with Android phone emulation (Pixel viewport, touch) | `e2e/<feature>/<subfeature>.spec.ts`, mirroring `docs/features/` |
| **Manual** | What a browser can't prove: the real Android WebView, airplane mode, how gestures feel | A checklist in each spec | The spec's Verification section |

### E2E target
Every E2E test runs in **desktop Chromium with phone emulation**, not on an Android emulator or device. Playwright's Android support is experimental and needs a running emulator. Each spec gets a short **manual checklist** for a real phone instead.

### E2E test data
- An **`e2e` build configuration** turns off the dev seed, so every test starts with an empty database.
- In that build only, a small test hook (e.g. `window.__e2e`) seeds and clears data **through the repositories**, so E2E tests don't depend on the Dexie schema. Production and dev builds don't include it.
- Every test fixes the clock (`page.clock`) to a known date, so day labels and the week strip are deterministic.

### Verification in specs
- Every spec has a **Verification** section ([template](../features/_template.md)) that maps each Definition of done item to the tests that prove it, or to a manual check. Tests not written yet are marked *(planned)*.
- Every spec's Definition of done ends with: *every item is covered in Verification, and every test listed there passes.* A subfeature is **Done** only when that item and the manual checks are ticked.
- Claude proposes the Verification section alongside the code, and the owner reviews it.

### Commands
Proposed, to be added when the tools are installed:

| Command | Runs |
|---|---|
| `npm test` | Unit, component, and integration tests (Vitest) |
| `npm run test:integration` | Integration tests only |
| `npm run e2e` | Playwright E2E tests against the `e2e` build |
| `npm run lint` | ESLint (exists) |

## Deferred
- **Screenshot comparisons** (Playwright `toHaveScreenshot`): not now. The mockup's layout is binding but its colors and fonts are placeholders, so baselines would churn. Revisit when the UI is finalized.
- **Coverage threshold:** not now. Revisit when the test suite is more complete. A coverage report with no threshold may be added in the meantime.

## Open
- **CI:** run the tests on GitHub Actions on push?
- **Claude hooks:** e.g. run lint, typecheck, and unit tests before Claude reports a task finished.

## Alternatives considered
| Option | Why not now |
|---|---|
| Playwright on an Android emulator (`_android`, WebView) | Experimental, slower, and needs an emulator running for every test run. Can be added for a few smoke tests later if browser tests miss real bugs. |
| Vitest browser mode for integration tests | Real IndexedDB, but slower and heavier than fake-indexeddb. The E2E layer already covers the real browser. |
| E2E tests writing straight to IndexedDB | Ties every E2E test to the Dexie schema, which may change without migrations in early development (ADR-002). |
