import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavController, provideIonicAngular } from '@ionic/angular';

import { addDays, todayLocal } from '../../../core/dates/local-date';
import { AppDb, type LogEntry } from '../../../core/db/app-db';
import { APP_DB, LogEntryRepository } from '../../../core/db/log-entry.repository';
import { DailyLogPage } from './daily-log.page';

type NewEntry = Omit<LogEntry, 'id' | 'ownerId' | 'createdAt'>;

const entry = (date: string, meal: LogEntry['meal'], kcal: number): NewEntry => ({
  date,
  meal,
  foodName: 'x',
  kcal,
  carbsG: 0,
  proteinG: 0,
  fatG: 0,
});

// Integration (ADR-005): the real page, store, repository, and Dexie database, on an
// in-memory IndexedDB. Nothing between the database and the screen is faked.
describe('DailyLog (integration)', () => {
  let db: AppDb;
  let repo: LogEntryRepository;
  let fixture: ComponentFixture<DailyLogPage>;
  const today = todayLocal();

  const el = () => fixture.nativeElement as HTMLElement;
  const text = (selector: string) =>
    Array.from(el().querySelectorAll(selector)).map((node) => (node.textContent ?? '').replace(/\s+/g, ' ').trim());
  const meals = () => text('.side:last-child .stat .value');

  /** Waits for the database's live query to reach the screen. */
  const until = (assertion: () => void) =>
    vi.waitFor(async () => {
      await fixture.whenStable();
      assertion();
    });

  beforeEach(async () => {
    db = new AppDb(`test-${crypto.randomUUID()}`);
    await TestBed.configureTestingModule({
      imports: [DailyLogPage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        { provide: APP_DB, useValue: db },
        { provide: NavController, useValue: { navigateForward: vi.fn() } },
      ],
    }).compileComponents();
    repo = TestBed.inject(LogEntryRepository);
  });

  afterEach(async () => {
    fixture?.destroy();
    await db.delete();
  });

  async function open(entries: NewEntry[]): Promise<void> {
    await repo.addMany(entries);
    fixture = TestBed.createComponent(DailyLogPage);
    await fixture.whenStable();
  }

  it("changing the day shows that day's entries from the database", async () => {
    await open([entry(today, 'breakfast', 500), entry(addDays(today, -1), 'dinner', 700), entry(addDays(today, -1), 'snacks', 1500)]);
    await until(() => expect(meals()).toEqual(['500', '0', '0', '0']));
    expect(text('app-apple-ring .kind')).toEqual(['Left']);
    expect(text('app-apple-ring .amount')).toEqual(['1,500']);

    (el().querySelector('ion-button.prev-day') as HTMLElement).click();

    await until(() => expect(meals()).toEqual(['0', '0', '700', '1,500']));
    expect(text('.day-label')[0]).toMatch(/^Yesterday, /);
    expect(text('app-apple-ring .kind')).toEqual(['Over']);
    expect(text('app-apple-ring .amount')).toEqual(['200']);
  });

  it('shows an entry written to the database without reopening the screen', async () => {
    await open([]);
    await until(() => expect(meals()).toEqual(['0', '0', '0', '0']));

    await repo.addMany([entry(today, 'lunch', 640)]);

    await until(() => expect(meals()).toEqual(['0', '640', '0', '0']));
    expect(text('app-apple-ring .amount')).toEqual(['1,360']);
  });

  it('strip bars and dots come from the database: a bar per logged day, none on an empty day, a rest-day dot on every day', async () => {
    await open([entry(today, 'lunch', 1200), entry(addDays(today, -2), 'lunch', 900), entry(addDays(today, 3), 'lunch', 2400)]);

    // Seven columns, three days either side of today.
    const hasBar = () =>
      Array.from(el().querySelectorAll('app-week-strip .col')).map((col) => col.querySelector('.bar') !== null);
    await until(() => expect(hasBar()).toEqual([false, true, false, true, false, false, true]));

    const dots = Array.from(el().querySelectorAll<HTMLElement>('app-week-strip .dot'));
    expect(dots.map((d) => d.style.getPropertyValue('background'))).toEqual(Array(7).fill('var(--ft-day-rest)'));
    // Every day's budget is the 2,000 default, which is also the midway value: half height.
    expect(dots.map((d) => d.style.getPropertyValue('bottom'))).toEqual(Array(7).fill('50%'));
  });
});
