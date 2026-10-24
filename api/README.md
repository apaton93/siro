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
| GET | `/api/teams?q=` | Team search for the profile picker |
| GET / PATCH | `/api/me` | 🔒 Signed-in fan (created on first visit); update display name |
| PUT | `/api/me/teams` | 🔒 Replace the fan's teams (max 5, one primary) |
| GET / PUT / DELETE | `/api/me/going/{fixtureId}` | 🔒 "I'm going" status / mark / unmark |

🔒 = signed-in only. `/api/me*` is locked to the `authenticated` role in `app/public/staticwebapp.config.json`; the API reads the user from the `x-ms-client-principal` header (see `src/auth.ts`, ADR-0009).

## Tests
`npm test` (repo root) – Vitest against an in-memory Postgres + PostGIS (PGlite) with the real migrations and seed. Runs in CI on every PR.
