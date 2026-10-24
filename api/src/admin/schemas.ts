import { z } from 'zod'

/** Treat blank strings from forms as "not set". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((v) => (v ? v : null))

const name = z.string().trim().min(1, 'is required').max(120)
const uuid = z.string().uuid('must be a valid id')
const optionalUuid = z
  .union([uuid, z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null)
const lat = z.number().min(-90).max(90)
const lng = z.number().min(-180).max(180)
const hex = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'must be a colour like #F47920').transform((v) => v.toUpperCase())
const httpsUrl = z
  .union([z.string().trim().url().startsWith('https://', 'must start with https://').max(500), z.literal(''), z.null()])
  .optional()
  .transform((v) => v || null)

const timezone = z.string().refine((tz) => {
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone: tz })
    return tz.includes('/') || tz === 'UTC'
  } catch {
    return false
  }
}, 'must be an IANA timezone like Europe/Madrid')

const score = z.number().int().min(0).max(99).nullable().optional().transform((v) => v ?? null)

export const competitionSchema = z.object({
  name,
  type: z.enum(['club', 'international']),
})

export const citySchema = z.object({
  name,
  countryCode: z.string().regex(/^[A-Za-z]{2}$/, 'must be a 2-letter country code').transform((v) => v.toUpperCase()),
  currency: z.string().regex(/^[A-Za-z]{3}$/, 'must be a 3-letter currency code').transform((v) => v.toUpperCase()),
  language: z.string().trim().min(1, 'is required').max(60),
  timezone,
  lat,
  lng,
  photoUrl: httpsUrl,
  photoCredit: optionalText(200),
})

export const stadiumSchema = z.object({
  name,
  cityId: uuid,
  capacity: z.number().int().min(0).max(200_000).nullable().optional().transform((v) => v ?? null),
  lat,
  lng,
  awayEntranceNotes: optionalText(2000),
})

export const teamSchema = z.object({
  name,
  shortName: z.string().trim().min(1, 'is required').max(12),
  type: z.enum(['club', 'national']),
  countryCode: z.string().regex(/^[A-Za-z]{2}$/, 'must be a 2-letter country code').transform((v) => v.toUpperCase()),
  cityId: optionalUuid,
  homeStadiumId: optionalUuid,
  crestUrl: httpsUrl,
  primaryColour: hex,
  onPrimaryColour: hex,
})

export const airportSchema = z.object({
  name,
  iata: z.string().regex(/^[A-Za-z]{3}$/, 'must be a 3-letter IATA code').transform((v) => v.toUpperCase()),
  cityId: uuid,
  lat,
  lng,
})

export const fixtureSchema = z
  .object({
    competitionId: uuid,
    stage: optionalText(60),
    homeTeamId: uuid,
    awayTeamId: uuid,
    stadiumId: uuid,
    kickoffUtc: z.string().datetime({ offset: true, message: 'must be a date and time' }),
    status: z.enum(['scheduled', 'live', 'finished', 'postponed']).default('scheduled'),
    homeScore: score,
    awayScore: score,
    scoreNotes: optionalText(60),
  })
  .refine((f) => f.homeTeamId !== f.awayTeamId, { message: 'Home and away teams must be different', path: ['awayTeamId'] })
  .refine((f) => (f.homeScore === null) === (f.awayScore === null), {
    message: 'Enter both scores or neither',
    path: ['awayScore'],
  })

export const guideSectionSchema = z
  .object({
    cityId: optionalUuid,
    fixtureId: optionalUuid,
    type: z.string().trim().min(1, 'is required').max(30),
    title: z.string().trim().min(1, 'is required').max(120),
    content: z.string().trim().min(1, 'is required').max(20_000),
    sortOrder: z.number().int().min(0).max(1000).default(0),
  })
  .refine((g) => g.cityId || g.fixtureId, { message: 'Pick a city or a fixture', path: ['cityId'] })

/** Turn the first zod issue into a readable message, e.g. "kickoffUtc must be a date and time". */
export function firstIssue(error: z.ZodError): string {
  const issue = error.issues[0]
  const field = issue.path.join('.')
  if (issue.code === 'custom' || !field) return issue.message
  if (issue.code === 'invalid_type' && issue.received === 'undefined') return `${field} is required`
  return `${field} ${issue.message.replace(/^String /, '').replace(/^[A-Z]/, (c) => c.toLowerCase())}`
}
