// The `e2e` build (Playwright, ADR-005). Every E2E test starts with an empty database
// and seeds exactly the data it needs through the test hook (core/e2e/e2e-hooks.e2e.ts).
export const environment = {
  production: false,
  devSeed: false,
};
