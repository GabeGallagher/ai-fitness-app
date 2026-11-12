import Dexie, { type EntityTable } from 'dexie';

import type { LocalDate } from '../dates/local-date';

/**
 * The owner of every user-owned record (ADR-004). v1 has a single local user and no
 * accounts, so this is a constant until the backend phase.
 */
export const LOCAL_OWNER_ID = 'local-user';

/** The four fixed meals (SPEC.md §5.3), in display order. */
export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export const MEAL_SLOTS: readonly MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snacks'];

export const MEAL_LABELS: Record<MealSlot, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snacks: 'Snacks',
};

/**
 * One logged food in a day's log.
 *
 * Nutrients are a snapshot taken when the entry is logged, so editing a food later
 * doesn't change entries already logged (SPEC.md §5.1).
 */
export interface LogEntry {
  id: string;
  ownerId: string;
  date: LocalDate;
  meal: MealSlot;
  foodName: string;
  kcal: number;
  carbsG: number;
  proteinG: number;
  fatG: number;
  /** Epoch milliseconds. */
  createdAt: number;
}

/**
 * The on-device database: IndexedDB through Dexie (ADR-002).
 *
 * Only repositories in `core/` use this class directly. Schema changes are version
 * bumps; while in early development a breaking change may wipe local data.
 */
export class AppDb extends Dexie {
  logEntries!: EntityTable<LogEntry, 'id'>;

  constructor(name = 'fitness-tracker') {
    super(name);
    this.version(1).stores({
      logEntries: 'id, [ownerId+date]',
    });
  }
}
