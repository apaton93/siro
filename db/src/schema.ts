/**
 * Siro MVP schema – see docs/data-model.md.
 * Fixture is the hub; user locations are never exact (see docs/adr/0006-location-privacy.md).
 */
import { sql } from 'drizzle-orm'
import {
  type AnyPgColumn,
  boolean,
  char,
  check,
  customType,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

// ---------- PostGIS ----------

/**
 * PostGIS geography (SRID 4326 by default). Plain `geography` because drizzle-kit quotes
 * custom type names, and "geography(Point,4326)" would not be valid quoted SQL.
 * Write values as EWKT strings via `point(lng, lat)`; read with ST_X/ST_Y or ST_AsGeoJSON.
 */
export const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography'
  },
})

/** Build an EWKT point. Note the order: longitude first, then latitude. */
export const point = (lng: number, lat: number): string => `SRID=4326;POINT(${lng} ${lat})`

// ---------- Enums ----------

export const competitionType = pgEnum('competition_type', ['club', 'international'])
export const teamType = pgEnum('team_type', ['club', 'national'])
export const fixtureStatus = pgEnum('fixture_status', ['scheduled', 'live', 'finished', 'postponed'])
/**
 * Can fans attend? Set from UEFA sanctions ("Sanctions affecting supporter attendance").
 * `no_away_fans` and `behind_closed_doors` disable "I'm going" – fans are advised not to travel.
 */
export const fanAccess = pgEnum('fan_access', ['normal', 'partial_closure', 'no_away_fans', 'behind_closed_doors'])
export const venueType = pgEnum('venue_type', ['pub', 'restaurant', 'other'])
export const stayVisibility = pgEnum('stay_visibility', ['fans_only', 'public', 'private'])
export const threadCategory = pgEnum('thread_category', [
  'general',
  'flights',
  'hotels',
  'pubs',
  'transport',
  'tickets',
  'meetups',
])
export const checkInStatus = pgEnum('check_in_status', [
  'here',
  'leaving',
  'heading_to_stadium',
  'looking_for_fans',
  'back_to_hotel',
])

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

// ---------- Reference data ----------

export const competitions = pgTable('competitions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  /** Short code used in URLs and for the home page cards, e.g. UCL, UEL, UECL. */
  code: text('code').unique(),
  type: competitionType('type').notNull(),
  createdAt: createdAt(),
})

export const cities = pgTable(
  'cities',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    countryCode: char('country_code', { length: 2 }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    language: text('language').notNull(),
    timezone: text('timezone').notNull(),
    centre: geographyPoint('centre').notNull(),
    /** Licensed city photo for cards/headers, with attribution (ADR-0010). */
    photoUrl: text('photo_url'),
    photoCredit: text('photo_credit'),
    createdAt: createdAt(),
  },
  (t) => [index('cities_centre_gix').using('gist', t.centre)],
)

export const stadiums = pgTable(
  'stadiums',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    capacity: integer('capacity'),
    location: geographyPoint('location').notNull(),
    awayEntranceNotes: text('away_entrance_notes'),
    createdAt: createdAt(),
  },
  (t) => [index('stadiums_location_gix').using('gist', t.location), index('stadiums_city_idx').on(t.cityId)],
)

export const teams = pgTable(
  'teams',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    shortName: text('short_name').notNull(),
    type: teamType('type').notNull(),
    countryCode: char('country_code', { length: 2 }).notNull(),
    cityId: uuid('city_id').references(() => cities.id), // null for national teams
    homeStadiumId: uuid('home_stadium_id').references(() => stadiums.id),
    crestUrl: text('crest_url'),
    /** Main kit colour, e.g. #F47920. Used for fixture cards/headers (ADR-0010). */
    primaryColour: char('primary_colour', { length: 7 }).notNull().default('#0B0B0C'),
    /** Text colour that reads on primaryColour (black or white). */
    onPrimaryColour: char('on_primary_colour', { length: 7 }).notNull().default('#FFFFFF'),
    createdAt: createdAt(),
  },
  (t) => [index('teams_city_idx').on(t.cityId)],
)

export const airports = pgTable(
  'airports',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    iata: char('iata', { length: 3 }).notNull(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    location: geographyPoint('location').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('airports_iata_uq').on(t.iata),
    index('airports_location_gix').using('gist', t.location),
    index('airports_city_idx').on(t.cityId),
  ],
)

export const fixtures = pgTable(
  'fixtures',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    competitionId: uuid('competition_id')
      .notNull()
      .references(() => competitions.id),
    stage: text('stage'), // e.g. "League phase"
    homeTeamId: uuid('home_team_id')
      .notNull()
      .references(() => teams.id),
    awayTeamId: uuid('away_team_id')
      .notNull()
      .references(() => teams.id),
    stadiumId: uuid('stadium_id')
      .notNull()
      .references(() => stadiums.id),
    kickoffUtc: timestamp('kickoff_utc', { withTimezone: true }).notNull(),
    status: fixtureStatus('status').notNull().default('scheduled'),
    homeScore: integer('home_score'),
    awayScore: integer('away_score'),
    scoreNotes: text('score_notes'), // AET / penalties
    fanAccess: fanAccess('fan_access').notNull().default('normal'),
    fanAccessNote: text('fan_access_note'), // e.g. "UEFA sanction – stands closed"
    createdAt: createdAt(),
  },
  (t) => [
    index('fixtures_kickoff_idx').on(t.kickoffUtc),
    index('fixtures_home_team_idx').on(t.homeTeamId),
    index('fixtures_away_team_idx').on(t.awayTeamId),
    check('fixtures_different_teams', sql`${t.homeTeamId} <> ${t.awayTeamId}`),
  ],
)

export const guideSections = pgTable(
  'guide_sections',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cityId: uuid('city_id').references(() => cities.id),
    fixtureId: uuid('fixture_id').references(() => fixtures.id, { onDelete: 'cascade' }), // overrides city section
    type: text('type').notNull(), // transport | safety | areas | general | ...
    title: text('title').notNull(),
    content: text('content').notNull(), // markdown
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('guide_sections_city_idx').on(t.cityId),
    index('guide_sections_fixture_idx').on(t.fixtureId),
    check('guide_sections_has_owner', sql`${t.cityId} is not null or ${t.fixtureId} is not null`),
  ],
)

export const venues = pgTable(
  'venues',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    type: venueType('type').notNull(),
    cityId: uuid('city_id')
      .notNull()
      .references(() => cities.id),
    location: geographyPoint('location').notNull(),
    awayFriendly: boolean('away_friendly').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('venues_location_gix').using('gist', t.location), index('venues_city_idx').on(t.cityId)],
)

// ---------- Users ----------

export const authProvider = pgEnum('auth_provider', ['github', 'aad'])

/**
 * A fan. Identified by sign-in provider + that provider's user id (ADR-0009).
 * No email addresses are stored – Microsoft sign-in returns the email as the username.
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  authProvider: authProvider('auth_provider').notNull(),
  /** Static Web Apps' stable per-app user id for this provider. */
  authUserId: text('auth_user_id').notNull(),
  displayName: text('display_name').notNull(),
  homeAirportId: uuid('home_airport_id').references(() => airports.id),
  isAdmin: boolean('is_admin').notNull().default(false),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex('users_auth_uq').on(t.authProvider, t.authUserId),
  // Display names are unique ignoring case ("Arab Andy" = "arab andy").
  uniqueIndex('users_display_name_uq').on(sql`lower(${t.displayName})`),
])

export const userTeams = pgTable(
  'user_teams',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    teamId: uuid('team_id')
      .notNull()
      .references(() => teams.id),
    isPrimary: boolean('is_primary').notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.userId, t.teamId] })],
)

// ---------- Fan activity (all keyed to a fixture) ----------

export const attendances = pgTable(
  'attendances',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fixtureId: uuid('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    arriveDate: date('arrive_date'),
    departDate: date('depart_date'),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('attendances_user_fixture_uq').on(t.userId, t.fixtureId), index('attendances_fixture_idx').on(t.fixtureId)],
)

export const stays = pgTable(
  'stays',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    attendanceId: uuid('attendance_id')
      .notNull()
      .unique()
      .references(() => attendances.id, { onDelete: 'cascade' }),
    area: geographyPoint('area').notNull(), // snapped to ~500m grid server-side; never exact
    visibility: stayVisibility('visibility').notNull().default('fans_only'),
    createdAt: createdAt(),
  },
  (t) => [index('stays_area_gix').using('gist', t.area)],
)

export const threads = pgTable(
  'threads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fixtureId: uuid('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    category: threadCategory('category').notNull().default('general'),
    title: text('title').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('threads_fixture_category_idx').on(t.fixtureId, t.category)],
)

export const posts = pgTable(
  'posts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    threadId: uuid('thread_id')
      .notNull()
      .references(() => threads.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    parentId: uuid('parent_id').references((): AnyPgColumn => posts.id, { onDelete: 'cascade' }),
    body: text('body').notNull(),
    reportedCount: integer('reported_count').notNull().default(0),
    hidden: boolean('hidden').notNull().default(false), // set by moderation
    createdAt: createdAt(),
  },
  (t) => [index('posts_thread_idx').on(t.threadId, t.createdAt)],
)

/** One report per fan per post; posts with enough reports are hidden automatically. */
export const postReports = pgTable(
  'post_reports',
  {
    postId: uuid('post_id')
      .notNull()
      .references(() => posts.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.postId, t.userId] })],
)

export const recommendations = pgTable(
  'recommendations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    fixtureId: uuid('fixture_id').references(() => fixtures.id, { onDelete: 'set null' }),
    text: text('text').notNull(),
    upvotes: integer('upvotes').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index('recommendations_venue_idx').on(t.venueId)],
)

export const checkIns = pgTable(
  'check_ins',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    venueId: uuid('venue_id')
      .notNull()
      .references(() => venues.id, { onDelete: 'cascade' }),
    fixtureId: uuid('fixture_id')
      .notNull()
      .references(() => fixtures.id, { onDelete: 'cascade' }),
    status: checkInStatus('status').notNull().default('here'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(), // now() + 3h by default, set by API
    createdAt: createdAt(),
  },
  (t) => [
    index('check_ins_venue_active_idx').on(t.venueId, t.expiresAt),
    index('check_ins_fixture_active_idx').on(t.fixtureId, t.expiresAt),
  ],
)
