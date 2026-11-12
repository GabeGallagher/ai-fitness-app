/** The macros the app tracks (SPEC.md §5.1). */
export type Macro = 'carbs' | 'protein' | 'fat';

export const MACROS: readonly Macro[] = ['carbs', 'protein', 'fat'];

export const MACRO_LABELS: Record<Macro, string> = {
  carbs: 'Carbs',
  protein: 'Protein',
  fat: 'Fat',
};

/** kcal per gram (SPEC.md §5.5). */
export const KCAL_PER_GRAM: Record<Macro, number> = {
  carbs: 4,
  protein: 4,
  fat: 9,
};

/** Grams of each macro. */
export type MacroGrams = Record<Macro, number>;

/** Whole-number percent of calories for each macro; sums to 100. */
export type MacroSplit = Record<Macro, number>;
