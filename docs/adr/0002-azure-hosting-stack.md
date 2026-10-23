# ADR-0002 Azure hosting stack

**Date:** 2026-10-23 · **Status:** Accepted

## Context
Solo developer, student Azure credits, low budget, must be able to scale.

## Decision
Azure Static Web Apps (frontend + PR previews), Azure Functions (API, Node/TS), PostgreSQL Flexible Server B1ms with PostGIS, Blob Storage, Application Insights. IONOS domain via CNAME.

## Consequences
Near-zero cost at start. Scaling is additive (Front Door, Container Apps, read replicas, Redis, Web PubSub). Some Azure lock-in.
