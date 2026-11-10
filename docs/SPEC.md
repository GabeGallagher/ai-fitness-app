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
| 1 | Daily tracking (exercise, steps, water, notes): manual entry | Notes only (§6) |
| Later | Backend + sync (multiple devices, public release) | Not started |

## 5. Phase 1: Nutrition

### 5.1 Foods
- **Search** foods by name using **USDA FoodData Central**.
- **Scan a barcode** to look up a packaged food using **Open Food Facts**.
- **Custom foods:** the user can create their own food (name, serving definition, calories, macros) when the database doesn't have it.
- Any food the user logs is **cached locally**, so recents, favorites, and logging work offline.
- Nutrients tracked: **calories, protein, carbohydrates, fat**. Nothing more for now.
- Open Food Facts data requires attribution in the app (see its license).
- **Editing a food** (a custom food is edited, or the database is corrected) doesn't change entries already logged. Entries logged after the change, including entries added to past days, use the new data.

### 5.2 Portions
- Food can be logged by **weight in grams** (food scale) or by **package serving** ("1 serving", "2 bars"), using the serving definition from the food data.
- Nutrient values are stored per 100 g, and each serving definition maps to a gram weight, so both portion types scale from the same base.

### 5.3 Meals and the daily log
- Each entry in the day's log belongs to a **meal**.
- v1 has **four fixed meals**: Breakfast, Lunch, Dinner, Snacks. User-defined meal names and counts (e.g. "Pre-workout", "Meal 4") may come in a later iteration.
- **Saved meals:** the user can save a group of foods and portions under a name and log the whole group in one action. Saved meals are enough for now; **recipes** (cooked in bulk, logged by the portion) are a possible later addition.

### 5.4 Logging shortcuts
- **Recents and favorites:** foods logged recently, and foods marked as favorites, are reachable without searching.
- **Copy previous:** copy a whole meal, or a whole day, from a previous day into today.
- Quick-add (logging bare calories or macros with no food attached) is **not needed**.

### 5.5 Targets
- There are **three day types**, each with its own target set: **High-intensity training day**, **Normal training day**, and **Rest day**.
- Each target set has a **calorie target** and a **macro split** (carbs, protein, fat). The user can enter calories directly, or derive them from macros (4 kcal/g carbs and protein, 9 kcal/g fat). **If the two disagree, calories win.** Macro targets are kept as percentages of calories, and gram targets are derived from them.
- **Calorie budget** for a day = that day's calorie target + exercise calories logged that day. Macro targets are a percentage of the budget, so exercise raises them in proportion.
- The user **marks each day's type manually**. The default for a new day is a rest day.
- Changing a target set must **not** rewrite history. Past days keep the targets that applied on that day.

### 5.6 Reviewing
- **Today:** consumed vs target, and **remaining**, for calories and each macro.
- **Per-meal breakdown:** how much each meal contributed.
- **Weekly averages:** average daily intake for the week, compared with the targets for those days. A week starts on **Sunday**; a setting to change this may come in a polish pass.
- **Trend charts:** calories and macros over weeks or months.

## 6. Notes for later phases (from the interview; not specified yet)
- **Body metrics:** bodyweight in **lb**, possibly body fat % and measurements.
- **Cardio:** three ways to get data in: **manual entry**, **live GPS recording** on the phone (including in the background while the screen is off), and **import from Health Connect** (watch data). Health Connect is read-only: the app doesn't write nutrition or anything else to it.
- **Strength:** exercises, sets, reps, weight in **lb**.
- **Day type:** once workouts are logged, the day type could be set automatically. For now it is manual.
- **Daily tracking** (separate feature, Phase 1): exercise, steps, water, and notes for a day. **Manual entry is in scope; device sync is out of scope** for now. Device sync will apply across several parts of the app, so it isn't tied to one feature. The nutrition daily log shows these values, and exercise calories add to the calorie budget (§5.5).

## 7. Data and units
- **Units:** grams for food; lb for bodyweight and lifting; miles for cardio. Values are stored in SI units (g, kg, m) and converted for display.
- **Day boundary:** a day runs from midnight to midnight, local time. A setting to change this may come in a polish pass.
- **Storage:** a local database on the device is the source of truth. A backend and sync may come later; build so they can be added.
- **Export:** a full export of the user's data to **JSON**, early in Phase 1. This is the only backup until sync exists.

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
All answered. Numbers are kept so links from feature specs still resolve.

1. ~~Saved meals vs recipes~~ **Answered:** saved meals are enough; recipes maybe later. See §5.3.
2. ~~Default day type~~ **Answered:** Rest. See §5.5.
3. ~~Week boundary~~ **Answered:** Sunday. See §5.6.
4. ~~Day boundary~~ **Answered:** midnight local. See §7.
5. ~~Calories entered or derived from macros~~ **Answered:** both; calories win. See §5.5.
6. ~~Editing a logged food~~ **Answered:** existing entries stay as logged. See §5.1.
7. ~~Export format~~ **Answered:** JSON. See §7.
8. ~~Health Connect direction~~ **Answered:** read only. See §6.
