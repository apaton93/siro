# ADR-0009 MVP sign-in via Static Web Apps built-in auth

**Date:** 2026-10-24 · **Status:** Accepted (supersedes ADR-0005 for the MVP)

## Context
ADR-0005 chose Microsoft Entra External ID (Google + email). Using a custom identity provider with Azure Static Web Apps needs the paid Standard plan; the MVP should stay on the Free plan.

## Decision
- Use Static Web Apps' **pre-configured providers: GitHub and Microsoft** (`/.auth/login/github`, `/.auth/login/aad`, `/.auth/logout`).
- The API reads the signed-in user from the `x-ms-client-principal` header (base64 JSON).
- `/api/me*` is restricted to the `authenticated` role in `staticwebapp.config.json`, so the platform blocks anonymous requests before they reach the API. All personal endpoints live under `/api/me`.
- Users are keyed on `(auth_provider, auth_user_id)` – SWA's stable per-app user id. A user row is created on first visit to `/api/me`.
- **No email addresses are stored.** Microsoft returns the email as `userDetails`, so those fans start as "Fan XXXX" and choose a display name. GitHub fans start with their GitHub username.
- Sign-in return paths are restricted to same-site paths (no open redirects).

## Consequences
- Free; very little auth code. Fans need a GitHub or Microsoft account for now.
- Adding Google/email later (Entra External ID / custom OIDC) needs the Standard plan, and registering a custom provider disables the pre-configured ones – existing users would need linking by provider id.
- Locally, the SWA CLI emulates sign-in with a mock login form.
- Admins are set manually for now (`users.is_admin`), until an admin UI exists (SIRO-31).
