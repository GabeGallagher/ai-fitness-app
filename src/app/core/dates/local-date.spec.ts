import { addDays, dayLabel, dayOfMonth, daysBetween, fromLocalDate, toLocalDate, weekdayAbbrev } from './local-date';

describe('local-date', () => {
  it('round-trips a local date', () => {
    expect(toLocalDate(fromLocalDate('2026-11-08'))).toBe('2026-11-08');
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-11-30', 1)).toBe('2026-12-01');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('adds days across a DST change without skipping or repeating a day', () => {
    // US DST ends 2026-11-01 and starts 2027-03-14.
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(addDays('2026-11-01', 1)).toBe('2026-11-02');
    expect(addDays('2027-03-14', 1)).toBe('2027-03-15');
  });

  it('lists days inclusively', () => {
    expect(daysBetween('2026-11-09', '2026-11-11')).toEqual(['2026-11-09', '2026-11-10', '2026-11-11']);
  });

  describe('dayLabel (spec: Today / Yesterday, Nov 9 / Tomorrow, Nov 11 / Sun, Nov 8)', () => {
    const today = '2026-11-10';

    it('labels today', () => expect(dayLabel(today, today)).toBe('Today'));
    it('labels yesterday with the date', () => expect(dayLabel('2026-11-09', today)).toBe('Yesterday, Nov 9'));
    it('labels tomorrow with the date', () => expect(dayLabel('2026-11-11', today)).toBe('Tomorrow, Nov 11'));
    it('labels other days with weekday and date', () => expect(dayLabel('2026-11-08', today)).toBe('Sun, Nov 8'));
    it('never includes the year', () => expect(dayLabel('2025-11-08', today)).toBe('Sat, Nov 8'));
  });

  it('abbreviates weekdays to two letters', () => {
    expect(weekdayAbbrev('2026-11-05')).toBe('Th');
    expect(weekdayAbbrev('2026-11-09')).toBe('Mo');
    expect(dayOfMonth('2026-11-09')).toBe(9);
  });
});
