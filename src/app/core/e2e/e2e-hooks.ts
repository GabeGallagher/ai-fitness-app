import type { LogEntryRepository } from '../db/log-entry.repository';

/**
 * Installs the E2E test hook (`window.__e2e`). Does nothing in this version of the file.
 *
 * The `e2e` build replaces this file with `e2e-hooks.e2e.ts` (angular.json
 * `fileReplacements`), so development and production builds never contain the hook.
 * Keep the two files' signatures identical.
 */
export function installE2eHooks(_repo: LogEntryRepository): void {
  // Intentionally empty outside the e2e build.
}
