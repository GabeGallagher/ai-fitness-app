import { Injectable, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';

import { LogEntryRepository } from '../../../core/db/log-entry.repository';
import {
  addDays,
  dayLabel,
  dayOfMonth,
  daysBetween,
  todayLocal,
  weekdayAbbrev,
  type LocalDate,
} from '../../../core/dates/local-date';
import { DayTargetsService, type DayType } from '../targets/day-targets.service';
import { calorieBudget, statusOf, summarizeDay, totalKcal, type DaySummary, type Status } from './day-summary';
import { WEEK_STRIP_SCALE, heightFraction } from './week-strip-scale';

/** Exercise calories are 0 until the Daily tracking feature is built. */
const PLACEHOLDER_EXERCISE_KCAL = 0;

/** Days shown on each side of the selected day in the week strip. */
const WEEK_STRIP_SIDE_DAYS = 3;

export interface WeekStripDay {
  day: LocalDate;
  weekday: string;
  dayOfMonth: number;
  selected: boolean;
  dayType: DayType;
  budgetKcal: number;
  /** null when nothing is logged that day: no bar. */
  consumedKcal: number | null;
  status: Status | null;
  barHeight: number;
  dotHeight: number;
}

/** State for one Daily log screen: the selected day and everything derived from it. */
@Injectable()
export class DailyLogStore {
  private readonly repo = inject(LogEntryRepository);
  private readonly targets = inject(DayTargetsService);
  private readonly scaleRule = inject(WEEK_STRIP_SCALE);

  readonly today = signal<LocalDate>(todayLocal());
  readonly selectedDay = signal<LocalDate>(this.today());

  readonly dayLabel = computed(() => dayLabel(this.selectedDay(), this.today()));

  private readonly stripDays = computed(() => {
    const day = this.selectedDay();
    return daysBetween(addDays(day, -WEEK_STRIP_SIDE_DAYS), addDays(day, WEEK_STRIP_SIDE_DAYS));
  });

  /** Entries for every day in the strip, which includes the selected day. */
  private readonly entries = toSignal(
    toObservable(this.stripDays).pipe(
      switchMap((days) => this.repo.entriesInRange(days[0], days[days.length - 1])),
    ),
    { initialValue: [] },
  );

  readonly summary = computed<DaySummary>(() => {
    const day = this.selectedDay();
    return summarizeDay(
      this.entries().filter((e) => e.date === day),
      this.targets.targetFor(day),
      PLACEHOLDER_EXERCISE_KCAL,
    );
  });

  /** Calories the week strip's dotted midway line stands for. */
  readonly midwayKcal = computed(() =>
    this.scaleRule({ selectedDay: this.selectedDay(), budgetFor: (day) => this.budgetFor(day) }),
  );

  readonly weekStrip = computed<WeekStripDay[]>(() => {
    const selected = this.selectedDay();
    const midway = this.midwayKcal();
    const entries = this.entries();
    return this.stripDays().map((day) => {
      const dayEntries = entries.filter((e) => e.date === day);
      const budgetKcal = this.budgetFor(day);
      const consumedKcal = dayEntries.length ? totalKcal(dayEntries) : null;
      return {
        day,
        weekday: weekdayAbbrev(day),
        dayOfMonth: dayOfMonth(day),
        selected: day === selected,
        dayType: this.targets.targetFor(day).dayType,
        budgetKcal,
        consumedKcal,
        status: consumedKcal === null ? null : statusOf(consumedKcal, budgetKcal),
        barHeight: consumedKcal === null ? 0 : heightFraction(consumedKcal, midway),
        dotHeight: heightFraction(budgetKcal, midway),
      };
    });
  });

  previousDay(): void {
    this.selectedDay.update((day) => addDays(day, -1));
  }

  nextDay(): void {
    this.selectedDay.update((day) => addDays(day, 1));
  }

  selectDay(day: LocalDate): void {
    this.selectedDay.set(day);
  }

  /** Re-reads the clock, e.g. when the app returns to the foreground after midnight. */
  refreshToday(): void {
    this.today.set(todayLocal());
  }

  private budgetFor(day: LocalDate): number {
    return calorieBudget(this.targets.targetFor(day), PLACEHOLDER_EXERCISE_KCAL);
  }
}
