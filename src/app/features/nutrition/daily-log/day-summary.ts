import { MEAL_SLOTS, type LogEntry, type MealSlot } from '../../../core/db/app-db';
import { KCAL_PER_GRAM, MACROS, type Macro, type MacroGrams, type MacroSplit } from '../../../core/nutrition/macros';
import type { DayTarget } from '../targets/day-targets.service';

/** Consumed compared with target (daily-log spec, Status colors). */
export type Status = 'under' | 'on' | 'over';

/** Compares the whole numbers shown on screen, not unrounded values. */
export function statusOf(consumed: number, target: number): Status {
  const c = Math.round(consumed);
  const t = Math.round(target);
  return c < t ? 'under' : c === t ? 'on' : 'over';
}

/** "Left 1,384" or "Over 120". */
export interface Remaining {
  kind: 'left' | 'over';
  amount: number;
}

export function remaining(consumed: number, target: number): Remaining {
  const diff = Math.round(target) - Math.round(consumed);
  return diff >= 0 ? { kind: 'left', amount: diff } : { kind: 'over', amount: -diff };
}

/** How full a ring or bar is drawn: 0 to 1, stopping at full. */
export function fillFraction(consumed: number, target: number): number {
  if (target <= 0) {
    return consumed > 0 ? 1 : 0;
  }
  return Math.min(Math.max(consumed / target, 0), 1);
}

/** Calorie budget = calorie target + exercise calories (SPEC.md §5.5). */
export function calorieBudget(target: DayTarget, exerciseKcal: number): number {
  return target.kcal + exerciseKcal;
}

/** Gram targets from the budget and split, rounded to whole grams. */
export function macroTargetGrams(budgetKcal: number, split: MacroSplit): MacroGrams {
  const grams = {} as MacroGrams;
  for (const macro of MACROS) {
    grams[macro] = Math.round((budgetKcal * split[macro]) / 100 / KCAL_PER_GRAM[macro]);
  }
  return grams;
}

/**
 * The consumed split: each macro's calories as a percent of total macro calories.
 * Uses the gram values shown on screen, and largest-remainder rounding so the
 * percents add up to 100. Returns null when nothing has been consumed.
 */
export function consumedSplit(consumed: MacroGrams): MacroSplit | null {
  const kcal = MACROS.map((m) => Math.round(consumed[m]) * KCAL_PER_GRAM[m]);
  const total = kcal.reduce((a, b) => a + b, 0);
  if (total === 0) {
    return null;
  }
  const raw = kcal.map((k) => (k / total) * 100);
  const floors = raw.map(Math.floor);
  let shortfall = 100 - floors.reduce((a, b) => a + b, 0);
  const byRemainder = raw.map((r, i) => ({ i, rem: r - floors[i] })).sort((a, b) => b.rem - a.rem);
  for (const { i } of byRemainder) {
    if (shortfall <= 0) break;
    floors[i] += 1;
    shortfall -= 1;
  }
  const split = {} as MacroSplit;
  MACROS.forEach((m, i) => (split[m] = floors[i]));
  return split;
}

export interface MacroSummary {
  macro: Macro;
  targetPercent: number;
  consumedG: number;
  targetG: number;
  remaining: Remaining;
  fill: number;
  status: Status;
}

export interface DaySummary {
  budgetKcal: number;
  consumedKcal: number;
  remaining: Remaining;
  fill: number;
  status: Status;
  meals: Record<MealSlot, number>;
  macros: MacroSummary[];
  /** null when nothing is logged. */
  consumedSplit: MacroSplit | null;
  consumedG: MacroGrams;
}

export function totalKcal(entries: readonly LogEntry[]): number {
  return Math.round(entries.reduce((sum, e) => sum + e.kcal, 0));
}

/** Everything the daily log shows for one day. */
export function summarizeDay(entries: readonly LogEntry[], target: DayTarget, exerciseKcal: number): DaySummary {
  const budgetKcal = calorieBudget(target, exerciseKcal);
  const consumedKcal = totalKcal(entries);

  const meals = {} as Record<MealSlot, number>;
  for (const slot of MEAL_SLOTS) {
    meals[slot] = totalKcal(entries.filter((e) => e.meal === slot));
  }

  const consumedG: MacroGrams = {
    carbs: Math.round(entries.reduce((s, e) => s + e.carbsG, 0)),
    protein: Math.round(entries.reduce((s, e) => s + e.proteinG, 0)),
    fat: Math.round(entries.reduce((s, e) => s + e.fatG, 0)),
  };
  const targetG = macroTargetGrams(budgetKcal, target.split);

  const macros = MACROS.map<MacroSummary>((macro) => ({
    macro,
    targetPercent: target.split[macro],
    consumedG: consumedG[macro],
    targetG: targetG[macro],
    remaining: remaining(consumedG[macro], targetG[macro]),
    fill: fillFraction(consumedG[macro], targetG[macro]),
    status: statusOf(consumedG[macro], targetG[macro]),
  }));

  return {
    budgetKcal,
    consumedKcal,
    remaining: remaining(consumedKcal, budgetKcal),
    fill: fillFraction(consumedKcal, budgetKcal),
    status: statusOf(consumedKcal, budgetKcal),
    meals,
    macros,
    consumedSplit: consumedSplit(consumedG),
    consumedG,
  };
}
