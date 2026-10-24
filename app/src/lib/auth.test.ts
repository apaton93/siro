import { describe, expect, it } from 'vitest'
import { initials, safeReturnTo } from './auth'

describe('safeReturnTo', () => {
  it('keeps same-site paths', () => {
    expect(safeReturnTo('/fixtures/abc')).toBe('/fixtures/abc')
    expect(safeReturnTo('/profile?tab=teams')).toBe('/profile?tab=teams')
  })

  it.each([null, '', 'https://evil.example', '//evil.example', '/.auth/logout', 'javascript:alert(1)'])(
    'falls back to home for %s',
    (value) => {
      expect(safeReturnTo(value)).toBe('/')
    },
  )
})

describe('initials', () => {
  it('uses the first letters of two words, or the first two letters', () => {
    expect(initials('Arab Andy')).toBe('AA')
    expect(initials('tangerine_terror')).toBe('TT')
    expect(initials('Fan AB12')).toBe('FA')
    expect(initials('jim')).toBe('JI')
  })
})
