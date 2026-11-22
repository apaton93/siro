# ADR-0010 Visual design: light theme, Siro brand, team colours

**Date:** 2026-10-24 (revised 2026-11-22) · **Status:** Accepted

## Context
The original wireframes were dark mode. Inspired by the bold, sporty feel of football club sites (tangerine/black blocks, heavy uppercase type, square corners, photo-led cards), we wanted Siro to feel like a matchday product while staying neutral across every club. Fans mostly use it on a phone, often outdoors.

## Decision
- **Light theme.** White backgrounds, near-black text (`#0B0B0C`), warm greys `#5A554F` / `#E6E2DD` / `#F5F2EE` (custom, not framework defaults).
- **Siro brand = orange, black, white.** Orange `#FA6B14` for primary buttons (with black text), active-tab underlines and markers; dark orange `#B4470B` for small orange text (5.5:1 on white).
- **Type:** Archivo throughout: 800 uppercase for headings and labels, 400–600 for body. Small uppercase kicker labels above headings only where they add context.
- **Shape:** square corners everywhere; solid or outline rectangular buttons; 44px+ touch targets.
- **Motif:** diagonal stripes (the outlined "AWAY DAY" watermark was dropped in Nov 2026). No club crests, patterns or other club identity.
- **Team colours:** fixture cards and fixture page headers use the **away team's** primary colour, with a stored text colour that reads on it.
- **City photos:** cards and headers show a city photo fading into the solid team colour; all text sits on the solid part so it is readable over any photo. Back/share buttons sit on white squares.
- **Fixture header:** ~330px on mobile, collapsing to a slim sticky team-colour bar on scroll. "I'm going" is a full-width orange button below the stats strip.

## Consequences
- `teams` gains `primary_colour` and `on_primary_colour`; `cities` gains `photo_url` and `photo_credit`.
- City photos must be licensed (e.g. Unsplash, Wikimedia Commons with attribution, or our own) and credited.
- Wireframes: "Siro MVP Wireframes" design canvas (screens 1–5, fixture page 2a/2b).
