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

## Getting started
Local setup instructions will be added in SIRO-21 (local dev environment).

## Docs
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)
- [User journeys](docs/user-journeys.md)
- [Decision records](docs/adr/)
