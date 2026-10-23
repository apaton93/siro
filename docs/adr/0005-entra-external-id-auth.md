# ADR-0005 Authentication via Microsoft Entra External ID

**Date:** 2026-10-23 · **Status:** Accepted

## Context
Need social/email sign-in without building auth; already on Azure.

## Decision
Entra External ID (Google + email). The app stores only `entra_id` and profile fields.

## Consequences
Siro never stores passwords. Free tier covers MVP volumes.
