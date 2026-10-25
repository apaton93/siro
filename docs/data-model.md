# Project Siro – MVP Data Model

Jira: SIRO-15 · Database: Azure PostgreSQL Flexible Server + PostGIS

```mermaid
erDiagram
    COMPETITION ||--o{ FIXTURE : "has"
    TEAM ||--o{ FIXTURE : "home team"
    TEAM ||--o{ FIXTURE : "away team"
    STADIUM ||--o{ FIXTURE : "hosts"
    STADIUM ||--o{ TEAM : "home ground of"
    CITY ||--o{ TEAM : "based in"
    CITY ||--o{ STADIUM : "located in"
    CITY ||--o{ AIRPORT : "served by"
    CITY ||--o{ VENUE : "contains"
    CITY ||--o{ GUIDE_SECTION : "guide"
    FIXTURE ||--o{ GUIDE_SECTION : "override"

    USER ||--o{ USER_TEAM : "supports"
    TEAM ||--o{ USER_TEAM : "supported by"
    AIRPORT ||--o{ USER : "home airport"

    USER ||--o{ ATTENDANCE : "going to"
    FIXTURE ||--o{ ATTENDANCE : "attended by"
    ATTENDANCE ||--o| STAY : "stays at area"

    FIXTURE ||--o{ THREAD : "discussed in"
    USER ||--o{ THREAD : "starts"
    THREAD ||--o{ POST : "contains"
    USER ||--o{ POST : "writes"
    POST ||--o{ POST : "reply to"

    VENUE ||--o{ RECOMMENDATION : "recommended"
    USER ||--o{ RECOMMENDATION : "writes"
    FIXTURE ||--o{ RECOMMENDATION : "context"

    USER ||--o{ CHECK_IN : "checks in"
    VENUE ||--o{ CHECK_IN : "at"
    FIXTURE ||--o{ CHECK_IN : "for"

    COMPETITION {
        uuid id PK
        text name
        text type "club | international"
    }
    TEAM {
        uuid id PK
        text name
        text short_name
        text type "club | national"
        char country_code
        uuid city_id FK "nullable"
        uuid home_stadium_id FK "nullable"
        text crest_url
    }
    CITY {
        uuid id PK
        text name
        char country_code
        char currency
        text language
        text timezone
        geography centre "Point"
    }
    STADIUM {
        uuid id PK
        text name
        uuid city_id FK
        int capacity
        geography location "Point"
        text away_entrance_notes
    }
    AIRPORT {
        uuid id PK
        text name
        char iata
        uuid city_id FK
        geography location "Point"
    }
    FIXTURE {
        uuid id PK
        uuid competition_id FK
        uuid home_team_id FK
        uuid away_team_id FK
        uuid stadium_id FK
        timestamptz kickoff_utc
        text status "scheduled | live | finished | postponed"
        int home_score "nullable"
        int away_score "nullable"
        text score_notes "AET / pens, nullable"
        enum fan_access "normal | partial_closure | no_away_fans | behind_closed_doors"
        text fan_access_note "nullable"
    }
    GUIDE_SECTION {
        uuid id PK
        uuid city_id FK "nullable"
        uuid fixture_id FK "nullable, overrides city"
        text type "transport | safety | areas | ..."
        text content "markdown"
    }
    VENUE {
        uuid id PK
        text name
        text type "pub | restaurant | other"
        uuid city_id FK
        geography location "Point"
        bool away_friendly
    }
    USER {
        uuid id PK
        text entra_id UK
        text display_name
        uuid home_airport_id FK "nullable"
        timestamptz created_at
    }
    USER_TEAM {
        uuid user_id PK, FK
        uuid team_id PK, FK
        bool is_primary
    }
    ATTENDANCE {
        uuid id PK
        uuid user_id FK
        uuid fixture_id FK
        date arrive_date
        date depart_date
    }
    STAY {
        uuid id PK
        uuid attendance_id FK
        geography area "Point, snapped to ~500m grid"
        text visibility "public | fans_only | private"
    }
    THREAD {
        uuid id PK
        uuid fixture_id FK
        uuid user_id FK
        text category "flights | hotels | pubs | transport | tickets | meetups | general"
        text title
        timestamptz created_at
    }
    POST {
        uuid id PK
        uuid thread_id FK
        uuid user_id FK
        uuid parent_id FK "nullable"
        text body
        int reported_count
        timestamptz created_at
    }
    RECOMMENDATION {
        uuid id PK
        uuid venue_id FK
        uuid user_id FK
        uuid fixture_id FK "nullable"
        text text
        int upvotes
    }
    CHECK_IN {
        uuid id PK
        uuid user_id FK
        uuid venue_id FK
        uuid fixture_id FK
        text status "here | leaving | heading_to_stadium | ..."
        timestamptz expires_at
    }
```

## Key rules
- **Fixture is the hub** – most activity hangs off it.
- **No exact user locations** – `STAY.area` is snapped to a ~500m grid on save.
- **Check-ins expire** – counts only include rows where `expires_at > now()`; no deletes needed.
- **Guides are reusable** – city-level sections, with optional fixture-level overrides.
- **Stadiums can be shared** – Team → home stadium; Fixture has its own stadium (neutral venues/finals).
- **Internationals ready** – `TEAM.type` and `COMPETITION.type`; national teams have no city.

## Implementation notes (SIRO-22)
Source of truth is now `db/src/schema.ts`. Small additions made while implementing:
- `fixtures.stage` (e.g. "League phase"); check that home and away teams differ.
- `fixtures.fan_access` reflects UEFA sanctions ("Sanctions affecting supporter attendance"). `no_away_fans` and `behind_closed_doors` show a "don't travel" warning and the API refuses "I'm going"; `partial_closure` shows a caution only.
- `guide_sections.title` and `sort_order`; check that a section belongs to a city or a fixture.
- `users.is_admin` for the admin journey; table is `users` (`user` is reserved in Postgres).
- `posts.hidden` for moderation.
- `created_at` on all activity tables; unique attendance per user per fixture.
- Location columns are plain `geography` (SRID 4326 default) – drizzle-kit can't emit `geography(Point,4326)`.

## Sign-in (SIRO-6)
- `users.entra_id` replaced by `auth_provider` (`github` | `aad`) + `auth_user_id`, unique together (ADR-0009). No email addresses are stored.
