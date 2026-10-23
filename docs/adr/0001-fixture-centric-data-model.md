# ADR-0001 Fixture-centric data model

**Date:** 2026-10-23 · **Status:** Accepted

## Context
Fans plan around a specific match, not a club or city.

## Decision
`Fixture` is the hub entity; attendance, stays, threads, recommendations and check-ins hang off it. City guides are reusable with fixture-level overrides. `Team` (club | national) and `Competition` (club | international) support internationals later.

## Consequences
Simple per-fixture pages and counts. Cross-fixture views (e.g. "popular with United fans") need aggregation queries.
