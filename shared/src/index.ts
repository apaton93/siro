/**
 * API response contracts shared by `api` and `app`.
 * Dates are ISO 8601 strings (UTC) because they travel as JSON.
 */

export type FixtureStatus = 'scheduled' | 'live' | 'finished' | 'postponed'

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
}

export interface FixtureSummary {
  id: string
  kickoffUtc: string
  status: FixtureStatus
  stage: string | null
  homeScore: number | null
  awayScore: number | null
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
