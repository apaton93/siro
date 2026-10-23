# db (`@siro/db`)

Drizzle ORM schema, migrations and seed data for PostgreSQL + PostGIS. See [docs/data-model.md](../docs/data-model.md).

| File | Purpose |
|---|---|
| `src/schema.ts` | All tables, enums and indexes (single source of truth) |
| `src/index.ts` | `createDb()` client + schema exports, used by the API |
| `src/seed-data.ts` | Dev seed: Barcelona v Dundee United (fictional) |
| `migrations/` | Generated SQL migrations – commit these, never edit applied ones |

## Commands (run from repo root)
| Command | What it does |
|---|---|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | **Wipe** all tables and load dev seed data (local DB only) |
| `npm run db:studio` | Browse tables in Drizzle Studio |
| `npm run db:generate` | After editing `schema.ts`, generate a new migration |

Connection: `DATABASE_URL` if set, otherwise the local Docker DB (`127.0.0.1:5433`).

## Changing the schema
1. Edit `src/schema.ts`.
2. `npm run db:generate` – review the new SQL in `migrations/`.
3. `npm run db:migrate`.
4. Commit schema + migration together.

## PostGIS notes
- Location columns are `geography` (SRID 4326). Write with `point(lng, lat)` – **longitude first**.
- Distances from `ST_Distance` / `ST_DWithin` on geography are in **metres**.
- `0000_enable_postgis` creates the extension. On Azure, allow-list `POSTGIS` in server parameters before migrating.
