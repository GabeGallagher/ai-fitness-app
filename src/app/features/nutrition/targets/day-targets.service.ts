import { Injectable } from '@angular/core';

import type { LocalDate } from '../../../core/dates/local-date';
import type { MacroSplit } from '../../../core/nutrition/macros';

/** Day types, each with its own target set (SPEC.md §5.5). */
export type DayType = 'high-intensity' | 'normal' | 'rest';

export interface DayTarget {
  dayType: DayType;
  /** Calorie target before exercise. */
  kcal: number;
  /** Macro split as whole-number percents of calories. */
  split: MacroSplit;
}

/** Defaults used until the Targets subfeature is built (daily-log spec, Calories and Macros). */
export const DEFAULT_DAY_TARGET: DayTarget = {
  dayType: 'rest',
  kcal: 2000,
  split: { carbs: 50, protein: 20, fat: 30 },
};

/**
 * The target set that applies to each day.
 *
 * Placeholder: every day is a rest day with the default target. The Targets
 * subfeature replaces this with the user's target sets and day types.
 */
@Injectable({ providedIn: 'root' })
export class DayTargetsService {
  targetFor(_day: LocalDate): DayTarget {
    return DEFAULT_DAY_TARGET;
  }
}
