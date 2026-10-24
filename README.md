# Siro

Football away-day platform: plan your away day, find your fellow fans, know what to do when you get there.

Everything revolves around a **fixture** and the fans travelling to it.

## Status
MVP in development. Work is tracked in Jira (project **SIRO**).

## Repo layout
| Folder | Contents |
|---|---|
| `shared/` | `@siro/shared` – API response types used by both api and app |
| `app/` | Frontend – React + Vite + TypeScript (mobile-first) |
| `api/` | Backend – Azure Functions (Node + TypeScript) |
| `db/` | `@siro/db` – Drizzle ORM schema, migrations and seed data |
| `docs/` | Data model, architecture, user journeys and decision records (`docs/adr`) |

## Tech stack
React · TypeScript · Vite · Azure Static Web Apps · Azure Functions · PostgreSQL + PostGIS · Drizzle ORM · Static Web Apps auth (GitHub, Microsoft) · Leaflet + OpenStreetMap

## Getting started (Windows)

### Prerequisites (one-off)
- Git
- Node.js 22 LTS with **npm 11** (`npm install -g npm@11.16.0`, check: `npm -v`)
- Docker Desktop (WSL2 backend), running
- Azure Functions Core Tools v4: `winget install Microsoft.Azure.FunctionsCoreTools` (check: `func --version`)
- VS Code (accept the recommended extensions prompt)

### First run
```powershell
git clone https://github.com/apaton93/siro.git
cd siro
npm install          # installs db + app + api (npm workspaces)
npm run setup        # creates api/local.settings.json from the example
npm run db:up        # starts Postgres + PostGIS in Docker
npm run db:migrate   # creates the tables
npm run db:seed      # loads the example Barcelona v Dundee United data
npm run dev          # starts app + api behind the SWA CLI
```
Open **http://localhost:4280** – you should see the example fixture. `/status` checks the API, database and PostGIS.

Signing in locally shows the SWA CLI's mock login form: type any username to simulate a GitHub or Microsoft user.

### Everyday commands
| Command | What it does |
|---|---|
| `npm run dev` | App, API and SWA proxy together (labelled app/api/swa output) at http://localhost:4280 |
| `npm run db:up` / `db:down` | Start / stop the local database |
| `npm run db:reset` | Wipe and recreate the local database (then `db:migrate` + `db:seed`) |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Wipe tables and reload dev seed data |
| `npm run db:studio` | Browse the database in Drizzle Studio |
| `npm run db:generate` | Generate a migration after changing `db/src/schema.ts` |
| `npm run build` | Production build of db, app and API |
| `npm run typecheck` | TypeScript checks for db, app and API |
| `npm test` | API tests (in-memory Postgres + PostGIS, no Docker needed) |

### Local URLs
| URL | Service |
|---|---|
| http://localhost:4280 | Site (use this one) |
| http://127.0.0.1:5173 | Vite dev server (frontend only) |
| http://localhost:7071/api/health | Functions host directly |
| `127.0.0.1:5433` | Postgres in Docker (user/password/db: `siro`). Port 5433 avoids clashing with any local Postgres install on 5432. |

## Docs
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)
- [User journeys](docs/user-journeys.md)
- [Decision records](docs/adr/)

## Deployment
GitHub Actions (`.github/workflows/azure-static-web-apps.yml`) deploys to Azure Static Web Apps:
- **Pull request** → typecheck, lint, test, build, then a **preview site** (URL posted as a PR comment). Removed when the PR closes.
- **Merge to main** → same checks, then **production** deploy.

Requires the `AZURE_STATIC_WEB_APPS_API_TOKEN` repo secret. Runtime settings (`DATABASE_URL`, `APPLICATIONINSIGHTS_CONNECTION_STRING`) live in the Static Web App's environment variables, never in the repo.

Database migrations against Azure are run manually for now (`DATABASE_URL=... npm run db:migrate`).
