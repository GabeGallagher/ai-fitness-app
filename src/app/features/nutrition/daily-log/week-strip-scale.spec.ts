import { addDays } from '../../../core/dates/local-date';
import { averageBudgetScale, heightFraction } from './week-strip-scale';

describe('week-strip-scale', () => {
  it('uses the average budget over the 28 days ending on the selected day', () => {
    const selectedDay = '2026-11-10';
    const windowStart = addDays(selectedDay, -27);
    // 14 training days at 2,400 and 14 rest days at 1,800 average to 2,100.
    const budgetFor = (day: string) => {
      if (day < windowStart || day > selectedDay) return 99999; // outside the window: must be ignored
      return Number(day.slice(-2)) % 2 === 0 ? 2400 : 1800;
    };
    expect(averageBudgetScale({ selectedDay, budgetFor })).toBe(2100);
  });

  it('is the default target when every day has it', () => {
    expect(averageBudgetScale({ selectedDay: '2026-11-10', budgetFor: () => 2000 })).toBe(2000);
  });

  it('puts the midway value at half height and stops at the top', () => {
    expect(heightFraction(2000, 2000)).toBe(0.5);
    expect(heightFraction(2400, 2000)).toBeCloseTo(0.6);
    expect(heightFraction(1800, 2000)).toBeCloseTo(0.45);
    expect(heightFraction(4600, 2000)).toBe(1);
    expect(heightFraction(0, 2000)).toBe(0);
  });
});
