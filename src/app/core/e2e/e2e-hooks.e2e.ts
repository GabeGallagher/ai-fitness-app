import type { LogEntryRepository } from '../db/log-entry.repository';
import type { E2eApi } from './e2e-api';

/**
 * The `e2e` build's version of `e2e-hooks.ts`: exposes `window.__e2e` so Playwright
 * tests seed data through the repository, not by writing to IndexedDB directly
 * (ADR-005). Each Playwright test runs in a fresh browser context, so each starts with
 * an empty database and nothing needs clearing.
 */
export function installE2eHooks(repo: LogEntryRepository): void {
  const api: E2eApi = {
    seed: (entries) => repo.addMany(entries),
    count: () => repo.count(),
  };
  window.__e2e = api;
}
