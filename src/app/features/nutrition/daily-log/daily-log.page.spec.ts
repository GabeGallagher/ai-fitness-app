import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavController, provideIonicAngular } from '@ionic/angular';
import { BehaviorSubject, map } from 'rxjs';

import type { LogEntry } from '../../../core/db/app-db';
import { addDays, todayLocal } from '../../../core/dates/local-date';
import { LogEntryRepository } from '../../../core/db/log-entry.repository';
import { DailyLogPage } from './daily-log.page';

class FakeLogEntryRepository {
  readonly entries$ = new BehaviorSubject<LogEntry[]>([]);
  entriesInRange(start: string, end: string) {
    return this.entries$.pipe(map((all) => all.filter((e) => e.date >= start && e.date <= end)));
  }
}

function entry(date: string, meal: LogEntry['meal'], kcal: number, carbsG: number, proteinG: number, fatG: number): LogEntry {
  return { id: crypto.randomUUID(), ownerId: 'local-user', date, meal, foodName: 'x', kcal, carbsG, proteinG, fatG, createdAt: 0 };
}

describe('DailyLogPage', () => {
  let fixture: ComponentFixture<DailyLogPage>;
  let repo: FakeLogEntryRepository;
  const navigateForward = vi.fn();
  const today = todayLocal();

  const text = (selector: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector)).map((el) =>
      (el.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );

  beforeEach(async () => {
    repo = new FakeLogEntryRepository();
    navigateForward.mockReset();
    await TestBed.configureTestingModule({
      imports: [DailyLogPage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        { provide: LogEntryRepository, useValue: repo },
        { provide: NavController, useValue: { navigateForward } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DailyLogPage);
    await fixture.whenStable();
  });

  it('opens on today with the empty state', () => {
    expect(text('.day-label')).toEqual(['Today']);
    expect(text('.budget .value')).toEqual(['2,000']);
    expect(text('app-apple-ring .kind')).toEqual(['Left']);
    expect(text('app-apple-ring .amount')).toEqual(['2,000']);
  });

  it("shows the selected day's meals, Left, and macros", async () => {
    repo.entries$.next([entry(today, 'breakfast', 660, 66, 24, 33), entry(addDays(today, -1), 'lunch', 900, 1, 1, 1)]);
    await fixture.whenStable();

    expect(text('.side:last-child .stat .value')).toEqual(['660', '0', '0', '0']);
    expect(text('app-apple-ring .amount')).toEqual(['1,340']);
    expect(text('app-macro-bars .row span')).toEqual([
      'Carbs', '50%', '66g', 'left 184g',
      'Protein', '20%', '24g', 'left 76g',
      'Fat', '30%', '33g', 'left 34g',
    ]);
  });

  it('moves between days with the arrows and keeps the selected day centered', async () => {
    const next = fixture.nativeElement.querySelector('ion-button.next-day') as HTMLElement;
    next.click();
    await fixture.whenStable();
    expect(text('.day-label')[0]).toMatch(/^Tomorrow, /);

    const labels = fixture.nativeElement.querySelectorAll('app-week-strip .label');
    expect(labels.length).toBe(7);
    expect(labels[3].classList).toContain('selected');
  });

  it('selects a day tapped in the week strip', async () => {
    const labels = fixture.nativeElement.querySelectorAll('app-week-strip .label') as NodeListOf<HTMLElement>;
    labels[2].click(); // the day before the selected (centered) day
    await fixture.whenStable();
    expect(text('.day-label')[0]).toMatch(/^Yesterday, /);
  });

  it('routes meals, budget, tracking, and Add to their stubs', () => {
    const el = fixture.nativeElement as HTMLElement;
    (el.querySelector('.budget') as HTMLElement).click();
    (el.querySelectorAll('.side:last-child .stat')[1] as HTMLElement).click();
    (el.querySelectorAll('.side:first-child .stat')[2] as HTMLElement).click();
    (el.querySelector('.fab.add') as HTMLElement).click();
    expect(navigateForward.mock.calls.map((c) => c[0])).toEqual([
      '/nutrition/targets',
      '/nutrition/meal/lunch',
      '/daily-tracking/water',
      '/nutrition/log-food',
    ]);
  });

  it('does nothing when the scan button is tapped', () => {
    (fixture.nativeElement.querySelector('.fab.scan') as HTMLElement).click();
    expect(navigateForward).not.toHaveBeenCalled();
  });
});
