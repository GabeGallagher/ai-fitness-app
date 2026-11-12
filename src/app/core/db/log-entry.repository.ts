import { Injectable, InjectionToken, inject } from '@angular/core';
import { liveQuery } from 'dexie';
import { from, type Observable } from 'rxjs';

import type { LocalDate } from '../dates/local-date';
import { AppDb, LOCAL_OWNER_ID, type LogEntry } from './app-db';

export const APP_DB = new InjectionToken<AppDb>('APP_DB', {
  providedIn: 'root',
  factory: () => new AppDb(),
});

/** Reads and writes log entries. Features use this, never Dexie directly (ADR-002). */
@Injectable({ providedIn: 'root' })
export class LogEntryRepository {
  private readonly db = inject(APP_DB);

  /**
   * Entries from `start` to `end` (inclusive), re-emitting whenever they change.
   */
  entriesInRange(start: LocalDate, end: LocalDate): Observable<LogEntry[]> {
    return from(
      liveQuery(() =>
        this.db.logEntries
          .where('[ownerId+date]')
          .between([LOCAL_OWNER_ID, start], [LOCAL_OWNER_ID, end], true, true)
          .toArray(),
      ),
    );
  }

  async count(): Promise<number> {
    return this.db.logEntries.count();
  }

  async addMany(entries: Omit<LogEntry, 'id' | 'ownerId' | 'createdAt'>[]): Promise<void> {
    const now = Date.now();
    await this.db.logEntries.bulkAdd(
      entries.map((entry) => ({ ...entry, id: crypto.randomUUID(), ownerId: LOCAL_OWNER_ID, createdAt: now })),
    );
  }
}
