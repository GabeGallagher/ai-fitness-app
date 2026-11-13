import type { Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavController, provideIonicAngular } from '@ionic/angular';
import { BehaviorSubject, map } from 'rxjs';

import type { LogEntry } from '../../../core/db/app-db';
import { addDays, todayLocal } from '../../../core/dates/local-date';
import { LogEntryRepository } from '../../../core/db/log-entry.repository';
import { DailyLogPage } from './daily-log.page';
import { WEEK_STRIP_SCALE } from './week-strip-scale';

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

  /** Inline style values of each element matched, e.g. the color var a bar is drawn with. */
  const styles = (selector: string, property: string) =>
    Array.from((fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(selector)).map((el) =>
      el.style.getPropertyValue(property),
    );

  async function render(extraProviders: Provider[] = []): Promise<void> {
    repo = new FakeLogEntryRepository();
    navigateForward.mockReset();
    await TestBed.configureTestingModule({
      imports: [DailyLogPage],
      providers: [
        provideIonicAngular(),
        provideRouter([]),
        { provide: LogEntryRepository, useValue: repo },
        { provide: NavController, useValue: { navigateForward } },
        ...extraProviders,
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(DailyLogPage);
    await fixture.whenStable();
  }

  beforeEach(() => render());

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

  it('shows Over and the amount when over budget', async () => {
    repo.entries$.next([entry(today, 'dinner', 2120, 0, 0, 0)]);
    await fixture.whenStable();

    expect(text('app-apple-ring .kind')).toEqual(['Over']);
    expect(text('app-apple-ring .amount')).toEqual(['120']);
  });

  it('the pie and legend show the consumed split and grams', async () => {
    // Empty: a blank pie, and 0 g of each macro.
    expect(fixture.nativeElement.querySelectorAll('app-macro-pie circle.empty').length).toBe(1);
    expect(text('app-macro-pie dd')).toEqual(['0g', '0g', '0g']);

    // The mockup: 66 g carbs, 24 g protein, 33 g fat is 40% / 15% / 45% of macro calories.
    repo.entries$.next([entry(today, 'breakfast', 660, 66, 24, 33)]);
    await fixture.whenStable();

    expect(text('app-macro-pie text')).toEqual(['40%', '15%', '45%']);
    expect(text('app-macro-pie dt')).toEqual(['Carbs', 'Protein', 'Fat']);
    expect(text('app-macro-pie dd')).toEqual(['66g', '24g', '33g']);
  });

  it('the ring, macro bars, and week-strip bars show the under, on, and over states', async () => {
    repo.entries$.next([
      // Today: calories exactly on the 2,000 budget; carbs on (250 g), protein under (100 g), fat over (67 g).
      entry(today, 'lunch', 2000, 250, 50, 80),
      entry(addDays(today, -1), 'lunch', 2500, 0, 0, 0), // over
      entry(addDays(today, -2), 'lunch', 1000, 0, 0, 0), // under
    ]);
    await fixture.whenStable();

    expect(styles('app-apple-ring .progress', 'stroke')).toEqual(['var(--ft-status-on)']);
    expect(styles('app-macro-bars .fill', 'background')).toEqual([
      'var(--ft-status-on)',
      'var(--ft-status-under)',
      'var(--ft-status-over)',
    ]);
    // The strip's seven columns, three days either side of today; days with nothing logged have no bar.
    const bars = Array.from(fixture.nativeElement.querySelectorAll('app-week-strip .col') as NodeListOf<HTMLElement>).map(
      (col) => col.querySelector<HTMLElement>('.bar')?.style.getPropertyValue('background') ?? null,
    );
    expect(bars).toEqual([null, 'var(--ft-status-under)', 'var(--ft-status-over)', 'var(--ft-status-on)', null, null, null]);
  });

  it("providing a different WEEK_STRIP_SCALE rule changes the strip's scale", async () => {
    // Default rule: the midway line is the average budget (2,000), so each day's 2,000 dot sits at half height.
    expect(styles('app-week-strip .dot', 'bottom')).toEqual(Array(7).fill('50%'));

    // A rule putting the midway line at 1,000 puts the 2,000 dots at the top (2 × midway).
    TestBed.resetTestingModule();
    await render([{ provide: WEEK_STRIP_SCALE, useValue: () => 1000 }]);
    expect(styles('app-week-strip .dot', 'bottom')).toEqual(Array(7).fill('100%'));
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
