import { sql } from 'drizzle-orm'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as s from './schema'
import { point } from './schema'

type AnyDb = PgDatabase<PgQueryResultHKT, typeof s>

/**
 * Development seed: one fictional fixture (Barcelona v Dundee United).
 * Real coordinates for stadiums, airports and city centres; venues are clearly labelled placeholders.
 * WIPES all tables first.
 */
export async function seed(db: AnyDb): Promise<void> {
  await db.execute(sql`
    TRUNCATE check_ins, recommendations, posts, threads, stays, attendances, user_teams, users,
             venues, guide_sections, fixtures, airports, teams, stadiums, cities, competitions
    RESTART IDENTITY CASCADE
  `)

  const [uel] = await db
    .insert(s.competitions)
    .values({ name: 'UEFA Europa League', code: 'UEL', type: 'club' })
    .returning()

  const [barcelona, dundee] = await db
    .insert(s.cities)
    .values([
      {
        name: 'Barcelona',
        countryCode: 'ES',
        currency: 'EUR',
        language: 'Catalan, Spanish',
        timezone: 'Europe/Madrid',
        centre: point(2.1701, 41.387), // Plaça de Catalunya
      },
      {
        name: 'Dundee',
        countryCode: 'GB',
        currency: 'GBP',
        language: 'English',
        timezone: 'Europe/London',
        centre: point(-2.9707, 56.462),
      },
    ])
    .returning()

  const [campNou, tannadice] = await db
    .insert(s.stadiums)
    .values([
      {
        name: 'Camp Nou',
        cityId: barcelona.id,
        capacity: null,
        location: point(2.1228, 41.3809),
        awayEntranceNotes: '[Away entrance TBC]',
      },
      {
        name: 'Tannadice Park',
        cityId: dundee.id,
        capacity: null,
        location: point(-2.969, 56.4747),
      },
    ])
    .returning()

  const [fcb, dufc] = await db
    .insert(s.teams)
    .values([
      {
        name: 'Barcelona',
        shortName: 'BAR',
        type: 'club',
        countryCode: 'ES',
        cityId: barcelona.id,
        homeStadiumId: campNou.id,
        primaryColour: '#A50044',
        onPrimaryColour: '#FFFFFF',
      },
      {
        name: 'Dundee United',
        shortName: 'DU',
        type: 'club',
        countryCode: 'GB',
        cityId: dundee.id,
        homeStadiumId: tannadice.id,
        primaryColour: '#F47920',
        onPrimaryColour: '#0B0B0C',
      },
    ])
    .returning()

  await db.insert(s.airports).values([
    { name: 'Barcelona El Prat', iata: 'BCN', cityId: barcelona.id, location: point(2.0833, 41.2974) },
    { name: 'Girona-Costa Brava', iata: 'GRO', cityId: barcelona.id, location: point(2.7606, 41.901) },
    { name: 'Dundee', iata: 'DND', cityId: dundee.id, location: point(-3.0258, 56.4525) },
  ])

  const [fixture] = await db
    .insert(s.fixtures)
    .values({
      competitionId: uel.id,
      stage: 'League phase',
      homeTeamId: fcb.id,
      awayTeamId: dufc.id,
      stadiumId: campNou.id,
      kickoffUtc: new Date('2026-11-26T19:00:00Z'), // 20:00 CET – fictional fixture
      status: 'scheduled',
    })
    .returning()

  await db.insert(s.guideSections).values([
    {
      cityId: barcelona.id,
      type: 'general',
      title: 'Basics',
      content: 'Currency: Euro (EUR). Languages: Catalan and Spanish.',
      sortOrder: 1,
    },
    {
      cityId: barcelona.id,
      type: 'transport',
      title: 'Getting to the stadium',
      content: 'Metro L3 (Palau Reial / Les Corts) and L5 (Collblanc / Badal) are the nearest stations.',
      sortOrder: 2,
    },
    {
      cityId: barcelona.id,
      type: 'safety',
      title: 'Safety',
      content: '[Placeholder] Keep phones and wallets secure in busy areas and on the metro.',
      sortOrder: 3,
    },
    {
      fixtureId: fixture.id,
      type: 'transport',
      title: 'Matchday travel',
      content: '[Placeholder] Matchday-specific travel notes for this fixture.',
      sortOrder: 1,
    },
  ])

  await db.insert(s.venues).values([
    {
      name: '[Placeholder] Fan pub – Gothic Quarter',
      type: 'pub',
      cityId: barcelona.id,
      location: point(2.1769, 41.3826),
      awayFriendly: true,
    },
    {
      name: '[Placeholder] Restaurant – Eixample',
      type: 'restaurant',
      cityId: barcelona.id,
      location: point(2.165, 41.3916),
    },
    {
      name: '[Placeholder] Bar near stadium – Les Corts',
      type: 'pub',
      cityId: barcelona.id,
      location: point(2.1283, 41.3836),
      awayFriendly: true,
    },
  ])
}
