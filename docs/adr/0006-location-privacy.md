# ADR-0006 Location privacy

**Date:** 2026-10-23 · **Status:** Accepted

## Context
Sharing where fans stay and drink creates safety and GDPR risk.

## Decision
- Stay locations are snapped to a ~500m grid on save; exact hotel/address is never stored.
- Stay visibility: fans of the fixture (default) / everyone / only me.
- Check-ins expire after 3 hours (configurable); counts only use active check-ins.

## Consequences
Useful aggregates without exposing individuals. Snapping must happen server-side.
