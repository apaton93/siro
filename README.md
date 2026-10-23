# Siro

Football away-day platform: plan your away day, find your fellow fans, know what to do when you get there.

Everything revolves around a **fixture** and the fans travelling to it.

## Status
MVP in development. Work is tracked in Jira (project **SIRO**).

## Repo layout
| Folder | Contents |
|---|---|
| `app/` | Frontend – React + Vite + TypeScript (mobile-first) |
| `api/` | Backend – Azure Functions (Node + TypeScript) |
| `db/` | Drizzle ORM schema, migrations and seed data |
| `docs/` | Data model, architecture, user journeys and decision records (`docs/adr`) |

## Tech stack
React · TypeScript · Vite · Azure Static Web Apps · Azure Functions · PostgreSQL + PostGIS · Drizzle ORM · Microsoft Entra External ID · Leaflet + OpenStreetMap

## Getting started (Windows)

### Prerequisites (one-off)
- Git
- Node.js 22 LTS
- Docker Desktop (WSL2 backend), running
- Azure Functions Core Tools v4: `winget install Microsoft.Azure.FunctionsCoreTools` (check: `func --version`)
- VS Code (accept the recommended extensions prompt)

### First run
```powershell
git clone https://github.com/apaton93/siro.git
cd siro
npm install          # installs app + api (npm workspaces)
npm run setup        # creates api/local.settings.json from the example
npm run db:up        # starts Postgres + PostGIS in Docker
npm run dev          # starts app + api behind the SWA CLI
```
Open **http://localhost:4280** – the System check should show API, Database and PostGIS ticks.

### Everyday commands
| Command | What it does |
|---|---|
| `npm run dev` | App + API with hot reload at http://localhost:4280 |
| `npm run db:up` / `db:down` | Start / stop the local database |
| `npm run db:reset` | Wipe and recreate the local database |
| `npm run build` | Production build of app and API |
| `npm run typecheck` | TypeScript checks for app and API |

### Local URLs
| URL | Service |
|---|---|
| http://localhost:4280 | Site (use this one) |
| http://localhost:5173 | Vite dev server (frontend only) |
| http://localhost:7071/api/health | Functions host directly |
| `localhost:5432` | Postgres (user/password/db: `siro`) |

## Docs
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)
- [User journeys](docs/user-journeys.md)
- [Decision records](docs/adr/)
