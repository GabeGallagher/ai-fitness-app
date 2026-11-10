# ADR-002: On-device database

> Status: **Accepted** (2026-11-10). NoSQL decided by the owner; Dexie proposed by Claude and confirmed by the owner.

## Context
- The app is local-first: the on-device database is the source of truth, and everything except food search and barcode lookup works offline ([SPEC.md §3, §7](../SPEC.md#7-data-and-units)).
- The code is TypeScript (Ionic + Angular + Capacitor, ADR-001). Storing plain TypeScript objects is simpler than mapping them to tables.
- The owner knows NoSQL well.
- In early development, losing data when the storage layer changes is acceptable. A formal migration process isn't needed yet.
- A backend and sync may come later ([SPEC.md §4](../SPEC.md#4-scope-by-phase)).

## Decision
Use a **NoSQL document store in IndexedDB, through [Dexie.js](https://dexie.org)**.

- All database access goes through repository services in `src/app/core/`. Features never call Dexie directly, so the store can be replaced by changing one layer.
- Every record carries an owner ID (ADR-004).

## Why Dexie
- **Plain TypeScript objects** in typed tables, with indexes for the queries this app needs (entries by date, days in a range).
- **The same storage in the browser and on the phone.** IndexedDB runs in desktop Chrome and in the Android WebView, so browser testing exercises the real database code.
- **Live queries** (`liveQuery`) update the screen when data changes, such as when an entry is logged or the day changes.
- Small, mature, free, and actively maintained.

## Alternatives considered
| Option | Why not now |
|---|---|
| RxDB | Reactive, with built-in replication that could help with sync later. But its Capacitor SQLite storage is a paid premium plugin, and its free storage is IndexedDB anyway. More than this app needs today; it can be adopted later on top of IndexedDB if sync calls for it. |
| PouchDB | Built for CouchDB sync, but older, with weaker TypeScript support. |
| Ionic Storage | Key-value only. It can't query entries by date. |
| SQLite (Capacitor plugin) | Relational. The owner prefers a document store, and it doesn't run in a plain browser without extra setup. |

## Consequences
- Schema changes are Dexie version bumps. Until real data matters, a breaking change may wipe local data instead of migrating it.
- Android clears the data if the user clears the app's storage or uninstalls the app, as it would for any on-device database. The JSON export is the backup until sync exists.
- If a backend is added, sync is built on top of the repository layer. That may mean moving to RxDB or a custom sync.
