import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { AppDb, LOCAL_OWNER_ID, type LogEntry } from './app-db';
import { APP_DB, LogEntryRepository } from './log-entry.repository';

type NewEntry = Omit<LogEntry, 'id' | 'ownerId' | 'createdAt'>;

const entry = (date: string, kcal: number): NewEntry => ({
  date,
  meal: 'lunch',
  foodName: 'x',
  kcal,
  carbsG: 0,
  proteinG: 0,
  fatG: 0,
});

// Integration: the real repository and Dexie database on an in-memory IndexedDB
// (fake-indexeddb, loaded in src/test-setup.ts). Also proves that setup works.
describe('LogEntryRepository (integration)', () => {
  let db: AppDb;
  let repo: LogEntryRepository;

  beforeEach(() => {
    db = new AppDb(`test-${crypto.randomUUID()}`);
    TestBed.configureTestingModule({ providers: [{ provide: APP_DB, useValue: db }] });
    repo = TestBed.inject(LogEntryRepository);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('stores entries with an id, the local owner, and a timestamp', async () => {
    await repo.addMany([entry('2026-11-10', 300)]);

    const [stored] = await db.logEntries.toArray();
    expect(await repo.count()).toBe(1);
    expect(stored.id).toBeTruthy();
    expect(stored.ownerId).toBe(LOCAL_OWNER_ID);
    expect(stored.createdAt).toBeGreaterThan(0);
  });

  it('reads entries in a date range, including both ends', async () => {
    await repo.addMany([entry('2026-11-08', 1), entry('2026-11-09', 2), entry('2026-11-11', 3), entry('2026-11-12', 4)]);

    const entries = await firstValueFrom(repo.entriesInRange('2026-11-09', '2026-11-11'));
    expect(entries.map((e) => e.kcal).sort()).toEqual([2, 3]);
  });

  it('re-emits the range when an entry is added (live query)', async () => {
    const counts: number[] = [];
    const sub = repo.entriesInRange('2026-11-10', '2026-11-10').subscribe((entries) => counts.push(entries.length));

    await vi.waitFor(() => expect(counts).toEqual([0]));
    await repo.addMany([entry('2026-11-10', 300)]);
    await vi.waitFor(() => expect(counts.at(-1)).toBe(1));

    sub.unsubscribe();
  });
});
