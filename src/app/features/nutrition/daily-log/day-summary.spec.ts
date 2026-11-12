import type { LogEntry, MealSlot } from '../../../core/db/app-db';
import { DEFAULT_DAY_TARGET, type DayTarget } from '../targets/day-targets.service';
import {
  calorieBudget,
  consumedSplit,
  fillFraction,
  macroTargetGrams,
  remaining,
  statusOf,
  summarizeDay,
} from './day-summary';

function entry(meal: MealSlot, kcal: number, carbsG = 0, proteinG = 0, fatG = 0): LogEntry {
  return { id: crypto.randomUUID(), ownerId: 'local-user', date: '2026-11-10', meal, foodName: 'x', kcal, carbsG, proteinG, fatG, createdAt: 0 };
}

describe('day-summary', () => {
  describe('statusOf compares the whole numbers shown on screen', () => {
    it('is under below target', () => expect(statusOf(1999, 2000)).toBe('under'));
    it('is on target only when exactly equal', () => expect(statusOf(2000, 2000)).toBe('on'));
    it('treats values that round to the target as on target', () => expect(statusOf(1999.6, 2000)).toBe('on'));
    it('is over above target', () => expect(statusOf(2001, 2000)).toBe('over'));
  });

  it('shows Left, or Over and the amount', () => {
    expect(remaining(660, 2044)).toEqual({ kind: 'left', amount: 1384 });
    expect(remaining(2000, 2000)).toEqual({ kind: 'left', amount: 0 });
    expect(remaining(2120, 2000)).toEqual({ kind: 'over', amount: 120 });
  });

  it('stops filling at full', () => {
    expect(fillFraction(0, 2000)).toBe(0);
    expect(fillFraction(1000, 2000)).toBe(0.5);
    expect(fillFraction(5000, 2000)).toBe(1);
  });

  it('adds exercise calories to the budget', () => {
    expect(calorieBudget(DEFAULT_DAY_TARGET, 0)).toBe(2000);
    expect(calorieBudget(DEFAULT_DAY_TARGET, 300)).toBe(2300);
  });

  it('derives macro gram targets from the budget (spec: 2,000 kcal at 50/20/30 = 250/100/67 g)', () => {
    expect(macroTargetGrams(2000, DEFAULT_DAY_TARGET.split)).toEqual({ carbs: 250, protein: 100, fat: 67 });
  });

  it('raises macro targets in proportion to exercise', () => {
    expect(macroTargetGrams(2400, DEFAULT_DAY_TARGET.split)).toEqual({ carbs: 300, protein: 120, fat: 80 });
  });

  describe('consumedSplit', () => {
    it('matches the mockup: 66 g / 24 g / 33 g is 40% / 15% / 45%', () => {
      expect(consumedSplit({ carbs: 66, protein: 24, fat: 33 })).toEqual({ carbs: 40, protein: 15, fat: 45 });
    });

    it('always adds up to 100', () => {
      const split = consumedSplit({ carbs: 10, protein: 10, fat: 10 })!;
      expect(split.carbs + split.protein + split.fat).toBe(100);
    });

    it('is null when nothing is consumed', () => {
      expect(consumedSplit({ carbs: 0, protein: 0, fat: 0 })).toBeNull();
    });
  });

  describe('summarizeDay', () => {
    const mockupTarget: DayTarget = { ...DEFAULT_DAY_TARGET, kcal: 2044 };

    it('reproduces the mockup numbers', () => {
      const s = summarizeDay([entry('breakfast', 660, 66, 24, 33)], mockupTarget, 0);
      expect(s.budgetKcal).toBe(2044);
      expect(s.consumedKcal).toBe(660);
      expect(s.remaining).toEqual({ kind: 'left', amount: 1384 });
      expect(s.meals).toEqual({ breakfast: 660, lunch: 0, dinner: 0, snacks: 0 });
      expect(s.status).toBe('under');
      expect(s.consumedSplit).toEqual({ carbs: 40, protein: 15, fat: 45 });
    });

    it('totals each meal', () => {
      const s = summarizeDay([entry('lunch', 300), entry('lunch', 250.4), entry('snacks', 100)], DEFAULT_DAY_TARGET, 0);
      expect(s.meals.lunch).toBe(550);
      expect(s.meals.snacks).toBe(100);
      expect(s.consumedKcal).toBe(650);
    });

    it('shows the empty state when nothing is logged', () => {
      const s = summarizeDay([], DEFAULT_DAY_TARGET, 0);
      expect(s.consumedKcal).toBe(0);
      expect(s.fill).toBe(0);
      expect(s.remaining).toEqual({ kind: 'left', amount: 2000 });
      expect(s.consumedSplit).toBeNull();
      expect(s.macros.map((m) => m.remaining)).toEqual([
        { kind: 'left', amount: 250 },
        { kind: 'left', amount: 100 },
        { kind: 'left', amount: 67 },
      ]);
    });

    it('reports macros over target', () => {
      const s = summarizeDay([entry('dinner', 800, 10, 112, 20)], DEFAULT_DAY_TARGET, 0);
      const protein = s.macros.find((m) => m.macro === 'protein')!;
      expect(protein.remaining).toEqual({ kind: 'over', amount: 12 });
      expect(protein.status).toBe('over');
      expect(protein.fill).toBe(1);
      expect(protein.targetPercent).toBe(20);
    });
  });
});
