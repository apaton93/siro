/**
 * API response contracts shared by `api` and `app`.
 * Dates are ISO 8601 strings (UTC) because they travel as JSON.
 */

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

/** Can fans attend? From UEFA sanctions. */
export type FanAccess = 'normal' | 'partial_closure' | 'no_away_fans' | 'behind_closed_doors'

/** Travelling fans are advised not to go, and "I'm going" is disabled. */
export const isTravelBlocked = (access: FanAccess) => access === 'no_away_fans' || access === 'behind_closed_doors'

export interface TeamRef {
  id: string
  name: string
  shortName: string
  crestUrl: string | null
  /** Kit colour as #RRGGBB – fixture cards/headers use the away team's (ADR-0010). */
  primaryColour: string
  /** Text colour that reads on primaryColour. */
  onPrimaryColour: string
}

export interface CityPhoto {
  photoUrl: string | null
  photoCredit: string | null
}

export interface CompetitionRef {
  id: string
  name: string
  /** e.g. UCL – used in URLs (/competitions/ucl). */
  code: string | null
}

/** GET /api/competitions */
export interface CompetitionInfo extends CompetitionRef {
  upcomingCount: number
}

export interface CompetitionsListResponse {
  competitions: CompetitionInfo[]
}

/** Max teams in one ?teams= filter (matches the most a fan can pick). */
export const MAX_TEAM_FILTER = 5

export interface FixtureSummary {
  id: string
  kickoffUtc: string
  status: FixtureStatus
  stage: string | null
  homeScore: number | null
  awayScore: number | null
  fanAccess: FanAccess
  fanAccessNote: string | null
  competition: CompetitionRef
  homeTeam: TeamRef
  awayTeam: TeamRef
  stadium: { id: string; name: string }
  city: { id: string; name: string; countryCode: string; timezone: string } & CityPhoto
  goingCount: number
}

export interface FixturesListResponse {
  fixtures: FixtureSummary[]
}

export interface AirportInfo {
  id: string
  name: string
  iata: string
  distanceKm: number
}

export interface GuideSectionInfo {
  id: string
  /** `fixture` sections are specific to this match; `city` sections are the reusable city guide. */
  scope: 'fixture' | 'city'
  type: string
  title: string
  content: string
}

export interface FixtureDetail extends FixtureSummary {
  stadium: {
    id: string
    name: string
    capacity: number | null
    awayEntranceNotes: string | null
    lat: number
    lng: number
  }
  city: {
    id: string
    name: string
    countryCode: string
    timezone: string
    currency: string
    language: string
  } & CityPhoto
  threadCount: number
  airports: AirportInfo[]
  guideSections: GuideSectionInfo[]
}

export interface ApiError {
  error: string
}

// ---------- Signed-in fan (/api/me) ----------

export type AuthProvider = 'github' | 'aad'

export interface MyTeam extends TeamRef {
  isPrimary: boolean
}

export interface Me {
  id: string
  displayName: string
  authProvider: AuthProvider
  isAdmin: boolean
  /** Profile photo, or null to show initials. */
  avatarUrl: string | null
  teams: MyTeam[]
}

export interface UpdateMeRequest {
  displayName: string
}

export interface SetMyTeamsRequest {
  teams: { teamId: string; isPrimary: boolean }[]
}

export interface GoingStatus {
  going: boolean
  goingCount: number
}

export interface TeamsListResponse {
  teams: TeamRef[]
}

/** Limits shared by the API (validation) and the app (form hints). */
export const LIMITS = {
  displayNameMin: 2,
  displayNameMax: 30,
  maxTeams: 5,
} as const

// ---------- Admin (/api/admin) ----------

export type AdminEntity = 'competitions' | 'cities' | 'stadiums' | 'teams' | 'airports' | 'fixtures' | 'guide-sections'

export interface CompetitionInput {
  name: string
  code: string | null
  type: 'club' | 'international'
}

export interface CityInput {
  name: string
  countryCode: string
  currency: string
  language: string
  timezone: string
  lat: number
  lng: number
  photoUrl: string | null
  photoCredit: string | null
}

export interface StadiumInput {
  name: string
  cityId: string
  capacity: number | null
  lat: number
  lng: number
  awayEntranceNotes: string | null
}

export interface TeamInput {
  name: string
  shortName: string
  type: 'club' | 'national'
  countryCode: string
  cityId: string | null
  homeStadiumId: string | null
  crestUrl: string | null
  primaryColour: string
  onPrimaryColour: string
}

export interface AirportInput {
  name: string
  iata: string
  cityId: string
  lat: number
  lng: number
}

export interface FixtureInput {
  competitionId: string
  stage: string | null
  homeTeamId: string
  awayTeamId: string
  stadiumId: string
  kickoffUtc: string
  status: FixtureStatus
  homeScore: number | null
  awayScore: number | null
  scoreNotes: string | null
  fanAccess: FanAccess
  fanAccessNote: string | null
}

export interface GuideSectionInput {
  cityId: string | null
  fixtureId: string | null
  type: string
  title: string
  content: string
  sortOrder: number
}

type WithId<T> = T & { id: string }

/** Everything the admin screens need, in one request (fine at MVP scale). */
export interface AdminReference {
  competitions: WithId<CompetitionInput>[]
  cities: WithId<CityInput>[]
  stadiums: WithId<StadiumInput>[]
  teams: WithId<TeamInput>[]
  airports: WithId<AirportInput>[]
  fixtures: WithId<FixtureInput>[]
  guideSections: WithId<GuideSectionInput>[]
}

export interface AdminSaveResponse {
  id: string
}

// ---------- Discussion ----------

export const THREAD_CATEGORIES = ['general', 'flights', 'hotels', 'pubs', 'transport', 'tickets', 'meetups'] as const
export type ThreadCategory = (typeof THREAD_CATEGORIES)[number]

export const DISCUSSION_LIMITS = {
  titleMin: 3,
  titleMax: 100,
  bodyMax: 2000,
  /** Seconds a fan must wait between posts. */
  cooldownSeconds: 20,
  /** Reports from different fans that hide a post automatically. */
  reportsToHide: 3,
}

export interface Author {
  id: string
  displayName: string
  /** Profile photo, or null to show initials. */
  avatarUrl: string | null
}

/** Profile photos: square JPEGs this size, made in the browser before upload. */
export const AVATAR = { size: 256, maxBytes: 200_000 }

export interface ThreadSummary {
  id: string
  fixtureId: string
  category: ThreadCategory
  title: string
  author: Author
  createdAt: string
  /** Replies plus the opening post. */
  postCount: number
  lastPostAt: string
}

export interface ThreadsListResponse {
  threads: ThreadSummary[]
}

export interface PostInfo {
  id: string
  author: Author
  /** Null when the post has been hidden by moderation. */
  body: string | null
  hidden: boolean
  createdAt: string
  /** Only set when signed in. */
  mine: boolean
  reportedByMe: boolean
}

export interface ThreadDetail {
  thread: ThreadSummary
  fixture: { id: string; homeTeam: string; awayTeam: string; kickoffUtc: string }
  posts: PostInfo[]
}

export interface CreateThreadRequest {
  fixtureId: string
  category: ThreadCategory
  title: string
  body: string
}

export interface CreatePostRequest {
  body: string
}

/** Admin moderation queue: posts with reports, or hidden. */
export interface ReportedPost {
  id: string
  body: string
  hidden: boolean
  reportedCount: number
  createdAt: string
  author: Author
  thread: { id: string; title: string; fixtureId: string }
}

export interface ReportedPostsResponse {
  posts: ReportedPost[]
}
