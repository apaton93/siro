# Project Siro – Core User Journeys (MVP)

Jira: SIRO-17

**Access rule:** browsing is open without login (shareable links, SEO). Login is required to post, mark attendance, set stay, recommend or check in.

| # | Journey | Steps | Login |
|---|---|---|---|
| 1 | Find a fixture | Home → search / browse by team or competition → fixture page | No |
| 2 | Plan the trip | Fixture page → stadium, city guide, airports, getting around → outbound flight/hotel links | No |
| 3 | "I'm going" | Sign in → "I'm going" → arrive/depart dates → see "X fans going" | Yes |
| 4 | Set stay | Drop pin → snapped to ~500m → see "X fans staying nearby" | Yes |
| 5 | Discuss | Fixture → category tab → read → post/reply → report | Read: No · Post: Yes |
| 6 | Recommend | Map → venue → add recommendation / upvote | Yes |
| 7 | Matchday check-in | Map → venue → check in with status → expires after 3 hours → live counts | Yes |
| 8 | Admin | Add fixture / city / stadium / airport / venue / guide section → moderate reported posts | Admin |

## Decisions
- Check-ins expire after **3 hours** (configurable).
- Stay locations are never exact; snapped to ~500m on save.
