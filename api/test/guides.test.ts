import { fixtures, guideSections, stadiums, teams } from '@siro/db'
import { applyGuides, placeholderStadiums } from '@siro/db/src/guides/apply'
import { CITY_GUIDES } from '@siro/db/src/guides/city-guides'
import { importUcl } from '@siro/db/src/ucl/import'
import { CITIES, STADIUMS } from '@siro/db/src/ucl/ucl-2026-27'
import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { getFixture } from '../src/fixtures/queries'
import { createTestDb, type TestDb } from './test-db'

describe('guide content', () => {
  const stadiumNames = Object.values(STADIUMS).map((s) => s.name)
  const guided = CITY_GUIDES.flatMap((g) => Object.keys(g.stadiums))

  it('covers every Champions League stadium, once', () => {
    expect(new Set(guided).size).toBe(guided.length)
    expect(stadiumNames.filter((n) => !guided.includes(n))).toEqual([])
  })

  it('only uses cities and stadiums that exist in the fixture data', () => {
    const cities = new Set(Object.values(CITIES).map((c) => `${c.name}|${c.countryCode}`))
    for (const g of CITY_GUIDES) expect(cities.has(`${g.city}|${g.countryCode}`), g.city).toBe(true)
    for (const n of guided) expect(stadiumNames, n).toContain(n)
  })

  it('gives every city each section type once, with sources and no prices', () => {
    for (const g of CITY_GUIDES) {
      expect(g.sections.map((s) => s.type).sort(), g.city).toEqual(['areas', 'things-to-do', 'tips', 'to-centre'])
      expect(g.sources.length, g.city).toBeGreaterThan(0)
      const text = JSON.stringify(g)
      expect(text, g.city).not.toMatch(/[€£$]\s?\d|\d\s?(EUR|GBP|CZK|NOK|AZN|TRY)\b/)
      for (const st of Object.values(g.stadiums)) {
        expect(st.gettingThere.length, g.city).toBeLessThan(2000)
        expect(st.awayFans.length, g.city).toBeLessThan(2000)
      }
    }
  })
})

describe('applyGuides', () => {
  let t: TestDb

  beforeAll(async () => {
    t = await createTestDb()
    await importUcl(t.db)
  })

  it('adds sections and stadium notes, replacing the seed placeholders', async () => {
    const c = await applyGuides(t.db)
    expect(c.missingCities).toEqual([])
    expect(c.missingStadiums).toEqual([])
    expect(c.sections).toBe(CITY_GUIDES.length * 4)
    expect(c.stadiums).toBe(36)
    expect(c.seedRemoved).toBe(3)
    expect(await placeholderStadiums(t.db)).toEqual([{ name: 'Tannadice Park' }]) // not a UCL ground
  })

  it('is safe to re-run and keeps admin edits', async () => {
    await t.db.update(stadiums).set({ gettingThere: 'My own directions' }).where(eq(stadiums.name, 'Anfield'))
    const again = await applyGuides(t.db)
    expect(again).toMatchObject({ sections: 0, stadiums: 0, seedRemoved: 0 })
    const [anfield] = await t.db.select().from(stadiums).where(eq(stadiums.name, 'Anfield'))
    expect(anfield.gettingThere).toBe('My own directions')
  })

  it('shows the right stadium and city guide on a fixture', async () => {
    const [fen] = await t.db.select().from(teams).where(eq(teams.name, 'Fenerbahçe'))
    const [home] = await t.db.select().from(fixtures).where(eq(fixtures.homeTeamId, fen.id)).limit(1)
    const detail = (await getFixture(t.db, home.id))!
    expect(detail.stadium.gettingThere).toMatch(/Söğütlüçeşme/)
    expect(detail.stadium.awayEntranceNotes).toMatch(/north/)
    expect(detail.guideSections.map((s) => s.type).sort()).toEqual(['areas', 'things-to-do', 'tips', 'to-centre'])
    const sections = await t.db.select().from(guideSections)
    expect(sections.every((s) => s.cityId)).toBe(true)
  })
})
