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
  city: { id: string; name: string; countryCode: string; timezone: string }
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
  }
  threadCount: number
  airports: AirportInfo[]
  guideSections: GuideSectionInfo[]
}

export interface ApiError {
  error: string
}
