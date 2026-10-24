# ADR-0010 Visual design: light theme, Siro brand, team colours

**Date:** 2026-10-24 · **Status:** Accepted

## Context
The original wireframes were dark mode. Inspired by the bold, sporty feel of football club sites (tangerine/black blocks, heavy uppercase type, square corners, photo-led cards), we wanted Siro to feel like a matchday product while staying neutral across every club. Fans mostly use it on a phone, often outdoors.

## Decision
- **Light theme.** White backgrounds, near-black text (`#0B0B0C`), greys `#52525B` / `#E4E4E7` / `#F4F4F5`.
- **Siro brand = orange, black, white.** Orange `#F97316` for primary buttons (with black text), active-tab underlines and markers; dark orange `#C2410C` for small orange text (meets 4.5:1 on white).
- **Type:** Archivo 800 uppercase for headings and labels, Inter for body. Small "▸" kicker labels above headings.
- **Shape:** square corners everywhere; solid or outline rectangular buttons; 44px+ touch targets.
- **Motif:** diagonal stripes and an outlined "AWAY DAY" watermark. No club crests, patterns or other club identity.
- **Team colours:** fixture cards and fixture page headers use the **away team's** primary colour, with a stored text colour that reads on it.
- **City photos:** cards and headers show a city photo fading into the solid team colour; all text sits on the solid part so it is readable over any photo. Back/share buttons sit on white squares.
- **Fixture header:** ~330px on mobile, collapsing to a slim sticky team-colour bar on scroll. "I'm going" is a full-width orange button below the stats strip.

## Consequences
- `teams` gains `primary_colour` and `on_primary_colour`; `cities` gains `photo_url` and `photo_credit`.
- City photos must be licensed (e.g. Unsplash, Wikimedia Commons with attribution, or our own) and credited.
- Wireframes: "Siro MVP Wireframes" design canvas (screens 1–5, fixture page 2a/2b).
