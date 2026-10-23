# api

Backend: Azure Functions (Node v4 programming model, TypeScript), served under `/api` by Azure Static Web Apps.

- Functions live in `src/functions/` – one file per endpoint, registered with `app.http(...)`.
- Shared DB pool in `src/db.ts`, using `DATABASE_URL`.
- Local settings: copy `local.settings.example.json` to `local.settings.json` (git-ignored).

Endpoints:
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | API + Postgres + PostGIS check |
