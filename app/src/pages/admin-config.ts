import type { AdminEntity, AdminReference } from '@siro/shared'
import { formatShortDate } from '../lib/format'

export type FieldKind = 'text' | 'textarea' | 'number' | 'select' | 'colour' | 'kickoff'
export type Option = { value: string; label: string }

export interface Field {
  key: string
  label: string
  kind: FieldKind
  optional?: boolean
  help?: string
  options?: (ref: AdminReference) => Option[]
  /** Starting value for new records. */
  initial?: string
}

export interface EntityConfig {
  entity: AdminEntity
  /** Key in AdminReference. */
  list: keyof AdminReference
  title: string
  singular: string
  deletable: boolean
  fields: Field[]
  /** Row label and sub-label in the list. */
  describe: (row: Record<string, unknown>, ref: AdminReference) => { main: string; sub: string }
}

const byId = <T extends { id: string }>(rows: T[], id: unknown) => rows.find((r) => r.id === id)
const fixed = (...values: string[]) => () => values.map((v) => ({ value: v, label: v }))
const cityOptions = (ref: AdminReference) => ref.cities.map((c) => ({ value: c.id, label: `${c.name} (${c.countryCode})` }))
const stadiumOptions = (ref: AdminReference) =>
  ref.stadiums.map((s) => ({ value: s.id, label: `${s.name} – ${byId(ref.cities, s.cityId)?.name ?? '?'}` }))
const teamOptions = (ref: AdminReference) => ref.teams.map((t) => ({ value: t.id, label: t.name }))

export function fixtureLabel(f: { homeTeamId: string; awayTeamId: string; stadiumId: string; kickoffUtc: string }, ref: AdminReference) {
  const stadium = byId(ref.stadiums, f.stadiumId)
  const tz = byId(ref.cities, stadium?.cityId)?.timezone ?? 'UTC'
  return `${byId(ref.teams, f.homeTeamId)?.name ?? '?'} v ${byId(ref.teams, f.awayTeamId)?.name ?? '?'} · ${formatShortDate(f.kickoffUtc, tz)}`
}

const latLng: Field[] = [
  { key: 'lat', label: 'Latitude', kind: 'number', help: 'e.g. 41.3809 – right-click the spot in Google Maps to copy it' },
  { key: 'lng', label: 'Longitude', kind: 'number', help: 'e.g. 2.1228 (west of Greenwich is negative)' },
]

export const CONFIGS: EntityConfig[] = [
  {
    entity: 'fixtures',
    list: 'fixtures',
    title: 'Fixtures',
    singular: 'fixture',
    deletable: true,
    fields: [
      { key: 'competitionId', label: 'Competition', kind: 'select', options: (r) => r.competitions.map((c) => ({ value: c.id, label: c.name })) },
      { key: 'stage', label: 'Stage', kind: 'text', optional: true, help: 'e.g. League phase, Round of 16' },
      { key: 'homeTeamId', label: 'Home team', kind: 'select', options: teamOptions },
      { key: 'awayTeamId', label: 'Away team', kind: 'select', options: teamOptions },
      { key: 'stadiumId', label: 'Stadium', kind: 'select', options: stadiumOptions },
      { key: 'kickoffUtc', label: 'Kickoff (local time at the stadium)', kind: 'kickoff' },
      { key: 'status', label: 'Status', kind: 'select', options: fixed('scheduled', 'live', 'finished', 'postponed'), initial: 'scheduled' },
      { key: 'homeScore', label: 'Home score', kind: 'number', optional: true },
      { key: 'awayScore', label: 'Away score', kind: 'number', optional: true },
      { key: 'scoreNotes', label: 'Score notes', kind: 'text', optional: true, help: 'e.g. AET, 4–3 on penalties' },
      {
        key: 'fanAccess',
        label: 'Fan access',
        kind: 'select',
        options: () => [
          { value: 'normal', label: 'Normal' },
          { value: 'partial_closure', label: 'Partial closure (warning)' },
          { value: 'no_away_fans', label: 'No away fans (don’t travel)' },
          { value: 'behind_closed_doors', label: 'Behind closed doors (don’t travel)' },
        ],
        initial: 'normal',
        help: 'From UEFA’s “Sanctions affecting supporter attendance” list',
      },
      { key: 'fanAccessNote', label: 'Fan access note', kind: 'text', optional: true, help: 'e.g. UEFA sanction for crowd disturbances' },
    ],
    describe: (f, ref) => ({
      main: fixtureLabel(f as never, ref),
      sub: [byId(ref.competitions, f.competitionId)?.name, f.stage, f.status, f.fanAccess !== 'normal' && String(f.fanAccess).replaceAll('_', ' ')]
        .filter(Boolean)
        .join(' · '),
    }),
  },
  {
    entity: 'teams',
    list: 'teams',
    title: 'Teams',
    singular: 'team',
    deletable: false,
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'shortName', label: 'Short name', kind: 'text', help: 'e.g. DU, BAR' },
      { key: 'type', label: 'Type', kind: 'select', options: fixed('club', 'national'), initial: 'club' },
      { key: 'countryCode', label: 'Country code', kind: 'text', help: '2 letters, e.g. ES, GB' },
      { key: 'cityId', label: 'City', kind: 'select', optional: true, options: cityOptions },
      { key: 'homeStadiumId', label: 'Home stadium', kind: 'select', optional: true, options: stadiumOptions },
      { key: 'crestUrl', label: 'Crest URL', kind: 'text', optional: true, help: 'https:// only' },
      { key: 'primaryColour', label: 'Main kit colour', kind: 'colour', initial: '#0B0B0C' },
      { key: 'onPrimaryColour', label: 'Text colour on it', kind: 'colour', initial: '#FFFFFF', help: 'Usually black or white' },
    ],
    describe: (t) => ({ main: String(t.name), sub: `${t.shortName} · ${t.countryCode}` }),
  },
  {
    entity: 'stadiums',
    list: 'stadiums',
    title: 'Stadiums',
    singular: 'stadium',
    deletable: false,
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'cityId', label: 'City', kind: 'select', options: cityOptions },
      { key: 'capacity', label: 'Capacity', kind: 'number', optional: true },
      ...latLng,
      { key: 'awayEntranceNotes', label: 'Away entrance notes', kind: 'textarea', optional: true },
    ],
    describe: (s, ref) => ({ main: String(s.name), sub: byId(ref.cities, s.cityId)?.name ?? '' }),
  },
  {
    entity: 'cities',
    list: 'cities',
    title: 'Cities',
    singular: 'city',
    deletable: false,
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'countryCode', label: 'Country code', kind: 'text', help: '2 letters, e.g. ES' },
      { key: 'currency', label: 'Currency', kind: 'text', help: '3 letters, e.g. EUR' },
      { key: 'language', label: 'Language', kind: 'text', help: 'e.g. Spanish, Catalan' },
      { key: 'timezone', label: 'Timezone', kind: 'text', help: 'e.g. Europe/Madrid' },
      ...latLng,
      { key: 'photoUrl', label: 'Photo URL', kind: 'text', optional: true, help: 'https:// only – a photo you have the right to use' },
      { key: 'photoCredit', label: 'Photo credit', kind: 'text', optional: true, help: 'e.g. "Jane Smith / Unsplash"' },
    ],
    describe: (c) => ({ main: String(c.name), sub: `${c.countryCode} · ${c.timezone}` }),
  },
  {
    entity: 'airports',
    list: 'airports',
    title: 'Airports',
    singular: 'airport',
    deletable: false,
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'iata', label: 'IATA code', kind: 'text', help: '3 letters, e.g. BCN' },
      { key: 'cityId', label: 'City', kind: 'select', options: cityOptions },
      ...latLng,
    ],
    describe: (a, ref) => ({ main: `${a.iata} – ${a.name}`, sub: byId(ref.cities, a.cityId)?.name ?? '' }),
  },
  {
    entity: 'competitions',
    list: 'competitions',
    title: 'Competitions',
    singular: 'competition',
    deletable: false,
    fields: [
      { key: 'name', label: 'Name', kind: 'text' },
      { key: 'code', label: 'Code', kind: 'text', optional: true, help: 'UCL, UEL or UECL links it to the home page cards' },
      { key: 'type', label: 'Type', kind: 'select', options: fixed('club', 'international'), initial: 'club' },
    ],
    describe: (c) => ({ main: String(c.name), sub: [c.code, c.type].filter(Boolean).join(' · ') }),
  },
  {
    entity: 'guide-sections',
    list: 'guideSections',
    title: 'Guides',
    singular: 'guide section',
    deletable: true,
    fields: [
      { key: 'cityId', label: 'City', kind: 'select', optional: true, options: cityOptions, help: 'Shown for every fixture in this city…' },
      {
        key: 'fixtureId',
        label: 'Or one fixture',
        kind: 'select',
        optional: true,
        options: (r) => r.fixtures.map((f) => ({ value: f.id, label: fixtureLabel(f, r) })),
        help: '…or only for this fixture',
      },
      { key: 'type', label: 'Type', kind: 'select', options: fixed('transport', 'safety', 'areas', 'general'), initial: 'general' },
      { key: 'title', label: 'Title', kind: 'text' },
      { key: 'content', label: 'Content', kind: 'textarea' },
      { key: 'sortOrder', label: 'Order', kind: 'number', initial: '0', help: 'Lower numbers first' },
    ],
    describe: (g, ref) => {
      const fixture = byId(ref.fixtures, g.fixtureId)
      return {
        main: String(g.title),
        sub: fixture ? fixtureLabel(fixture, ref) : (byId(ref.cities, g.cityId)?.name ?? ''),
      }
    },
  },
]
