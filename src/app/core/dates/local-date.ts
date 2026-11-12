/**
 * A calendar day in the user's local time zone, as `YYYY-MM-DD`.
 *
 * A day runs from midnight to midnight local time (SPEC.md §7). Storing days as
 * strings keeps them independent of time zones and DST, and they sort correctly.
 */
export type LocalDate = string;

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

export function toLocalDate(date: Date): LocalDate {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Local midnight at the start of the given day. */
export function fromLocalDate(day: LocalDate): Date {
  if (!ISO_DAY.test(day)) {
    throw new Error(`Not a local date: ${day}`);
  }
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayLocal(now: Date = new Date()): LocalDate {
  return toLocalDate(now);
}

export function addDays(day: LocalDate, days: number): LocalDate {
  const date = fromLocalDate(day);
  // Constructing from y/m/d (not adding milliseconds) keeps DST from shifting the day.
  return toLocalDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

/** The days from `start` to `end`, inclusive. */
export function daysBetween(start: LocalDate, end: LocalDate): LocalDate[] {
  const days: LocalDate[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}

const weekdayMonthDay = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const weekdayShort = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

/**
 * The header label for a day (daily-log spec, "Day label"). Never includes the year.
 * `Today`, `Yesterday, Nov 9`, `Tomorrow, Nov 11`, otherwise `Sun, Nov 8`.
 */
export function dayLabel(day: LocalDate, today: LocalDate): string {
  const date = fromLocalDate(day);
  if (day === today) {
    return 'Today';
  }
  if (day === addDays(today, -1)) {
    return `Yesterday, ${monthDay.format(date)}`;
  }
  if (day === addDays(today, 1)) {
    return `Tomorrow, ${monthDay.format(date)}`;
  }
  return weekdayMonthDay.format(date);
}

/** Two-letter weekday, e.g. `Th`, for the week strip. */
export function weekdayAbbrev(day: LocalDate): string {
  return weekdayShort.format(fromLocalDate(day)).slice(0, 2);
}

export function dayOfMonth(day: LocalDate): number {
  return fromLocalDate(day).getDate();
}
