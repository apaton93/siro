# ADR-0005 Authentication via Microsoft Entra External ID

**Date:** 2026-10-23 · **Status:** Superseded for the MVP by [ADR-0009](0009-swa-built-in-auth.md)

## Context
Need social/email sign-in without building auth; already on Azure.

## Decision
Entra External ID (Google + email). The app stores only `entra_id` and profile fields.

## Consequences
Siro never stores passwords. Free tier covers MVP volumes.
