# api

Backend: Azure Functions (Node v4 programming model, TypeScript), served under `/api` by Azure Static Web Apps.

- `src/index.ts` – entry point; imports every function module.
- `src/functions/` – one file per endpoint group, registered with `app.http(...)`.
- `src/fixtures/queries.ts` – Drizzle queries (uses `@siro/db`); response types come from `@siro/shared`.
- `src/db.ts` – shared pg pool (fast timeouts) and Drizzle client.
- Build: esbuild bundles everything (including `@siro/db`) into `dist/index.js`; only `@azure/functions` is installed at runtime. `npm run package:api` (repo root) creates the deploy folder.
- Local settings: copy `local.settings.example.json` to `local.settings.json` (git-ignored).

## Endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API + Postgres + PostGIS check |
| GET | `/api/fixtures?team=&competition=&q=` | Upcoming fixtures (from 6h ago), max 50 |
| GET | `/api/fixtures/{id}` | Fixture page: teams + colours, stadium, city + photo, nearby airports (km), guide sections |

## Tests
`npm test` (repo root) – Vitest against an in-memory Postgres + PostGIS (PGlite) with the real migrations and seed. Runs in CI on every PR.
