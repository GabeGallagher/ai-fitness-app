import { InjectionToken } from '@angular/core';

import { addDays, daysBetween, type LocalDate } from '../../../core/dates/local-date';

/** What a scale rule can look at. */
export interface ScaleInput {
  selectedDay: LocalDate;
  /** Calorie budget for any day. */
  budgetFor: (day: LocalDate) => number;
}

/**
 * Picks the week strip's midway value: the calories the dotted mid-height line
 * stands for. The top of the chart is 2 × midway (daily-log spec, Week strip > Scale).
 *
 * Kept behind a token so the rule can be swapped for one based on calories
 * consumed (the planned change) without touching the strip.
 */
export type WeekStripScaleRule = (input: ScaleInput) => number;

export const SCALE_WINDOW_DAYS = 28;

/** Current rule: the average calorie budget over the 28 days ending on the selected day. */
export const averageBudgetScale: WeekStripScaleRule = ({ selectedDay, budgetFor }) => {
  const days = daysBetween(addDays(selectedDay, -(SCALE_WINDOW_DAYS - 1)), selectedDay);
  return days.reduce((sum, day) => sum + budgetFor(day), 0) / days.length;
};

export const WEEK_STRIP_SCALE = new InjectionToken<WeekStripScaleRule>('WEEK_STRIP_SCALE', {
  providedIn: 'root',
  factory: () => averageBudgetScale,
});

/** Height as a fraction of the chart (0 to 1), stopping at the top. */
export function heightFraction(kcal: number, midway: number): number {
  if (midway <= 0) {
    return 0;
  }
  return Math.min(Math.max(kcal / (2 * midway), 0), 1);
}
