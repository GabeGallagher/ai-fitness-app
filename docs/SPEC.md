# Fitness Tracker — Product Spec

> Status: **Draft v0.1** (from the spec interview, 2026-11-09). The owner edits this file; Claude implements it.
> This file covers *what* and *why*. Each feature's definition of done goes in `docs/features/`. Technical decisions go in `docs/decisions/`.
> Docs layout and image conventions: [docs/README.md](README.md). If a feature spec or image disagrees with this file, this file wins until it is updated.

## 1. Purpose
A personal fitness tracker that replaces a commercial app that has gotten worse over time, keeping only the features the owner actually uses. It tracks nutrition, cardio, strength training, and body metrics. It's built for one user first, but structured so it could be released publicly later without a rewrite.

## 2. Principles
1. **Every feature is free and has no ads.** No paywalls, upsells, nag screens, or ad slots, and nothing in the design that assumes them.
2. **The user owns their data.** Data lives on the device first, and a full export is a core feature, not an extra.
3. **Logging is fast.** Common actions (re-logging a recent food, copying yesterday's breakfast) take as few taps as possible.
4. **Only what's needed.** Anything not in this spec is out of scope until it's added here.

## 3. Platform and users
- **Platform:** Android phone only, used mostly at the gym or on the go. No iOS, desktop, or web front end planned.
- **Users:** a single user for now. The app may go public later, so every user-owned record carries a user/owner ID from day one, even though v1 has no accounts or login screen.
- **Connectivity:** everything works offline **except** food database search and barcode lookup, which need a network connection.

## 4. Scope by phase

| Phase | Area | Status |
|---|---|---|
| 1 | **Nutrition** | Specified below; build first |
| 2 | Body metrics | Notes only (§6) |
| 3 | Cardio | Notes only (§6) |
| 4 | Strength training | Notes only (§6) |
| Later | Backend + sync (multiple devices, public release) | Not started |

## 5. Phase 1: Nutrition

### 5.1 Foods
- **Search** foods by name using **USDA FoodData Central**.
- **Scan a barcode** to look up a packaged food using **Open Food Facts**.
- **Custom foods:** the user can create their own food (name, serving definition, calories, macros) when the database doesn't have it.
- Any food the user logs is **cached locally**, so recents, favorites, and logging work offline.
- Nutrients tracked: **calories, protein, carbohydrates, fat**. Nothing more for now.
- Open Food Facts data requires attribution in the app (see its license).

### 5.2 Portions
- Food can be logged by **weight in grams** (food scale) or by **package serving** ("1 serving", "2 bars"), using the serving definition from the food data.
- Nutrient values are stored per 100 g, and each serving definition maps to a gram weight, so both portion types scale from the same base.

### 5.3 Meals and the daily log
- Each entry in the day's log belongs to a **meal**.
- Meal names are **user-defined** (e.g. "Breakfast", "Pre-workout", "Meal 4"), and the user can reorder them.
- **Saved meals:** the user can save a group of foods and portions under a name and log the whole group in one action.

### 5.4 Logging shortcuts
- **Recents and favorites:** foods logged recently, and foods marked as favorites, are reachable without searching.
- **Copy previous:** copy a whole meal, or a whole day, from a previous day into today.
- Quick-add (logging bare calories or macros with no food attached) is **not needed**.

### 5.5 Targets
- There are **two target sets**: **Training day** and **Rest day**. Each sets calories, protein, carbs, and fat.
- The user **marks each day manually** as training or rest. It may default to rest; see open questions.
- Changing a target set must **not** rewrite history. Past days keep the targets that applied on that day.

### 5.6 Reviewing
- **Today:** consumed vs target, and **remaining**, for calories and each macro.
- **Per-meal breakdown:** how much each meal contributed.
- **Weekly averages:** average daily intake for the week, compared with the targets for those days.
- **Trend charts:** calories and macros over weeks or months.

## 6. Notes for later phases (from the interview; not specified yet)
- **Body metrics:** bodyweight in **lb**, possibly body fat % and measurements.
- **Cardio:** three ways to get data in: **manual entry**, **live GPS recording** on the phone (including in the background while the screen is off), and **import from Health Connect** (watch data).
- **Strength:** exercises, sets, reps, weight in **lb**.
- **Day type:** once workouts are logged, training vs rest could be set automatically. For now it is manual.

## 7. Data and units
- **Units:** grams for food; lb for bodyweight and lifting; miles for cardio. Values are stored in SI units (g, kg, m) and converted for display.
- **Storage:** a local database on the device is the source of truth. A backend and sync may come later; build so they can be added.
- **Export:** a full export of the user's data to an open format, early in Phase 1. This is the only backup until sync exists.

## 8. Non-goals
- Ads, subscriptions, paywalls, upsells.
- Social features: feeds, friends, challenges, sharing.
- Micronutrients (vitamins and minerals), fiber, sugar, sodium.
- iOS, web, or desktop clients.
- Importing history from the old app (starting fresh).
- Accounts or login (until the backend phase).

## 9. Quality requirements
- Opening the app to today's log should feel instant (target to be defined once it can be measured).
- Re-logging a recent food: **3 taps or fewer** from today's screen (proposed; owner to confirm).
- No data loss: an entry is saved the moment it's made, with no separate save step.

## 10. Decisions to record (ADRs)
- **ADR-001:** Mobile stack: Ionic + Angular + Capacitor (decided). Check background-GPS plugin options and licensing before Phase 3.
- **ADR-002:** Local-first storage, with a backend and sync later (decided). Choose the on-device database.
- **ADR-003:** Food data: USDA FoodData Central for search, Open Food Facts for barcodes, cached locally (decided).
- **ADR-004:** Data model ready for multiple users: an owner ID on every record (decided).
- **ADR-005:** Testing and tooling: test runner, lint, typecheck commands, Claude hooks (to decide).

## 11. Open questions
1. **Saved meals vs recipes:** is a "saved meal" enough, or do you need **recipes**? A recipe is cooked in bulk, yields N servings, and is logged by the portion.
2. **Default day type:** should a new day start as Rest, start as whatever yesterday was, or make you choose before logging?
3. **Week boundary:** which day does a week start on, for weekly averages?
4. **Day boundary:** does a "day" end at midnight local time, or at a custom time (for late-night eating)?
5. **Targets:** do you enter calories directly, or derive them from macros (4/4/9 kcal per gram)? If both, which wins when they disagree?
6. **Editing a logged food:** if a cached food's data changes (a custom food is edited, or the database is corrected), should past entries change or stay as logged?
7. **Export format:** JSON (complete and easy to re-import), CSV (opens in a spreadsheet), or both?
8. **Health Connect, nutrition direction:** should the app also *write* nutrition to Health Connect, or only read cardio data in Phase 3?
