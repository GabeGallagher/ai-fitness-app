# ADR-005: Testing and verification

> Status: **Accepted** (2026-11-12). Decided by the owner: test layers, the E2E target, E2E test data, spec verification, no CI for now, and a Claude Stop hook that runs every automated check.

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
- An **`e2e` build configuration** (angular.json) turns off the dev seed (`devSeed: false` in [environment.e2e.ts](../../src/environments/environment.e2e.ts)), so every test starts with an empty database.
- In that build only, a test hook, `window.__e2e`, seeds data **through the repositories**, so E2E tests don't depend on the Dexie schema. Its shape is in [e2e-api.ts](../../src/app/core/e2e/e2e-api.ts). The build swaps the empty [e2e-hooks.ts](../../src/app/core/e2e/e2e-hooks.ts) for [e2e-hooks.e2e.ts](../../src/app/core/e2e/e2e-hooks.e2e.ts) (`fileReplacements`), so production and dev builds don't contain the hook. Nothing needs clearing: Playwright gives every test a fresh browser context, and so a fresh database.
- Every test fixes the clock (`page.clock`) to a known date, in a fixed time zone (America/New_York), so day labels and the week strip are deterministic.
- Tests open the app with `openApp(page, { today, entries })` from [e2e/support/app.ts](../../e2e/support/app.ts). [e2e/harness.spec.ts](../../e2e/harness.spec.ts) checks the setup itself: no dev seed, seeding works, the clock is fixed, and tests don't share a database.
- Config: [playwright.config.ts](../../playwright.config.ts). Playwright starts `ng serve --configuration e2e` on port 4300, or reuses one already running there.

### Integration test setup
- [src/test-setup.ts](../../src/test-setup.ts) loads `fake-indexeddb/auto`, so Vitest tests have an in-memory IndexedDB.
- Each integration test provides its own `AppDb` with a unique name through the `APP_DB` token, and deletes it afterwards. Example: [log-entry.repository.integration.spec.ts](../../src/app/core/db/log-entry.repository.integration.spec.ts).

### Verification in specs
- Every spec has a **Verification** section ([template](../features/_template.md)) that maps each Definition of done item to the tests that prove it, or to a manual check. Tests not written yet are marked *(planned)*.
- Every spec's Definition of done ends with: *every item is covered in Verification, and every test listed there passes.* A subfeature is **Done** only when that item and the manual checks are ticked.
- Claude proposes the Verification section alongside the code, and the owner reviews it.

### Commands
| Command | Runs | Status |
|---|---|---|
| `npm run lint` | ESLint | Exists |
| `npm run typecheck` | `ngc` on the app, which also checks templates (`strictTemplates`), and `tsc` on the spec files and the E2E tests | Exists |
| `npm test` | Unit, component, and integration tests (Vitest), in watch mode | Exists |
| `npm run test:integration` | Integration tests only, once | Exists |
| `npm run e2e` | Playwright E2E tests against the `e2e` build | Exists |
| `npm run verify` | Everything automated, run once: lint, typecheck, Vitest, and Playwright | Exists |

First-time setup on a new machine: `npm install`, then `npx playwright install chromium` (Playwright's browser isn't installed by npm).

### Claude hook
A **Stop hook** ([.claude/settings.json](../../.claude/settings.json), script [.claude/hooks/verify-on-stop.mjs](../../.claude/hooks/verify-on-stop.mjs)) runs `npm run verify` whenever Claude is about to finish a task.
- If anything fails, Claude is blocked from finishing and gets the failing output to fix.
- Manual checks aren't part of it; they stay in each spec's phone checklist.
- It skips when only `docs/` or `*.md` files changed, or when the same changes already passed.
- After 3 failed attempts in a row it lets Claude stop and warns the owner, so a failure Claude can't fix doesn't loop forever.
- New automated test layers are added to `npm run verify`, not to the hook.

## Deferred
- **Screenshot comparisons** (Playwright `toHaveScreenshot`): not now. The mockup's layout is binding but its colors and fonts are placeholders, so baselines would churn. Revisit when the UI is finalized.
- **Coverage threshold:** not now. Revisit when the test suite is more complete. A coverage report with no threshold may be added in the meantime.
- **CI (GitHub Actions):** not now. The Stop hook covers Claude's work locally. Revisit if the repo gets other contributors or a release process.

## Alternatives considered
| Option | Why not now |
|---|---|
| Playwright on an Android emulator (`_android`, WebView) | Experimental, slower, and needs an emulator running for every test run. Can be added for a few smoke tests later if browser tests miss real bugs. |
| Vitest browser mode for integration tests | Real IndexedDB, but slower and heavier than fake-indexeddb. The E2E layer already covers the real browser. |
| E2E tests writing straight to IndexedDB | Ties every E2E test to the Dexie schema, which may change without migrations in early development (ADR-002). |
