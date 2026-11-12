import type { LogEntry } from '../db/app-db';

/** A log entry as a test seeds it: the repository fills in id, owner, and createdAt. */
export type E2eSeedEntry = Omit<LogEntry, 'id' | 'ownerId' | 'createdAt'>;

/**
 * The test hook the `e2e` build exposes as `window.__e2e` (ADR-005). Shared by the
 * app (`e2e-hooks.e2e.ts`) and the Playwright tests (`e2e/support/`), so both sides
 * agree on its shape. Types only: nothing here is bundled into the app.
 */
export interface E2eApi {
  /** Adds entries through `LogEntryRepository`, as the app itself would. */
  seed(entries: E2eSeedEntry[]): Promise<void>;
  /** Number of log entries in the database. */
  count(): Promise<number>;
}

declare global {
  interface Window {
    /** Set only in the e2e build. */
    __e2e?: E2eApi;
  }
}
