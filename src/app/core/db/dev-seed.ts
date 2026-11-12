import { addDays, todayLocal, type LocalDate } from '../dates/local-date';
import type { LogEntry, MealSlot } from './app-db';
import type { LogEntryRepository } from './log-entry.repository';

type SeedEntry = Omit<LogEntry, 'id' | 'ownerId' | 'createdAt'>;

/** An entry whose macros follow a carbs/protein/fat split of its calories. */
function entry(date: LocalDate, meal: MealSlot, foodName: string, kcal: number, split = [50, 20, 30]): SeedEntry {
  const [c, p, f] = split;
  return {
    date,
    meal,
    foodName,
    kcal,
    carbsG: (kcal * c) / 100 / 4,
    proteinG: (kcal * p) / 100 / 4,
    fatG: (kcal * f) / 100 / 9,
  };
}

/** Sample days relative to today, covering each state the daily log shows. */
function sampleEntries(today: LocalDate): SeedEntry[] {
  const day = (offset: number) => addDays(today, offset);
  return [
    // Today: matches the mockup (660 kcal at breakfast: 66 g carbs, 24 g protein, 33 g fat).
    { date: day(0), meal: 'breakfast', foodName: 'Oatmeal with peanut butter', kcal: 660, carbsG: 66, proteinG: 24, fatG: 33 },
    // Under target.
    entry(day(-1), 'breakfast', 'Eggs and toast', 450),
    entry(day(-1), 'lunch', 'Chicken rice bowl', 650, [45, 30, 25]),
    entry(day(-1), 'dinner', 'Salmon and potatoes', 750, [40, 30, 30]),
    // Exactly on target (2,000 kcal): yellow.
    entry(day(-2), 'breakfast', 'Greek yogurt and granola', 500),
    entry(day(-2), 'lunch', 'Turkey sandwich', 700),
    entry(day(-2), 'dinner', 'Pasta', 650),
    entry(day(-2), 'snacks', 'Apple', 150, [100, 0, 0]),
    // Over target.
    entry(day(-3), 'breakfast', 'Pancakes', 800, [65, 10, 25]),
    entry(day(-3), 'lunch', 'Burger and fries', 1100, [40, 15, 45]),
    entry(day(-3), 'dinner', 'Pizza', 450),
    // day(-4): nothing logged.
    // Far over: the bar stops at the top of the chart.
    entry(day(-5), 'lunch', 'Holiday lunch', 2400, [45, 15, 40]),
    entry(day(-5), 'dinner', 'Holiday dinner', 2200, [45, 15, 40]),
    entry(day(-6), 'breakfast', 'Smoothie', 400, [60, 25, 15]),
    entry(day(-6), 'dinner', 'Stir fry', 1300),
    entry(day(-7), 'lunch', 'Burrito', 1000),
    entry(day(-7), 'dinner', 'Steak and salad', 900, [10, 45, 45]),
  ];
}

/**
 * Development builds only: fills an empty database with sample days so the
 * daily log can be checked before food logging exists.
 */
export async function seedDevData(repo: LogEntryRepository, today: LocalDate = todayLocal()): Promise<void> {
  if ((await repo.count()) > 0) {
    return;
  }
  await repo.addMany(sampleEntries(today));
}
