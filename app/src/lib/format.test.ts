import { describe, expect, it } from 'vitest'
import { daysUntil, formatKickoff, formatKm, formatRelative, formatShortDate } from './format'

describe('formatKickoff', () => {
  it('shows local time and UK time when they differ', () => {
    // 19:00 UTC on 26 Nov = 20:00 in Barcelona (CET), 19:00 in the UK (GMT)
    expect(formatKickoff('2026-11-26T19:00:00Z', 'Europe/Madrid')).toBe('Thu 26 Nov 2026 · 20:00 CET (19:00 UK)')
  })

  it('shows one time when the host city is on UK time', () => {
    expect(formatKickoff('2026-12-10T20:00:00Z', 'Europe/London')).toBe('Thu 10 Dec 2026 · 20:00 GMT')
  })

  it('handles summer time', () => {
    // 18:45 UTC in August = 20:45 CEST in Madrid, 19:45 BST in the UK
    expect(formatKickoff('2026-08-20T18:45:00Z', 'Europe/Madrid')).toBe('Thu 20 Aug 2026 · 20:45 CEST (19:45 UK)')
  })

  it('uses the host city date, not UTC, near midnight', () => {
    // 23:30 UTC on 1 Oct = 01:30 on 2 Oct in Istanbul
    expect(formatShortDate('2026-10-01T23:30:00Z', 'Europe/Istanbul')).toBe('Fri 2 Oct')
  })
})

describe('daysUntil', () => {
  const now = new Date('2026-10-24T12:00:00Z')

  it('rounds up part days', () => {
    expect(daysUntil('2026-10-25T09:00:00Z', now)).toBe(1)
    expect(daysUntil('2026-11-26T19:00:00Z', now)).toBe(34)
  })

  it('never goes negative', () => {
    expect(daysUntil('2026-10-20T19:00:00Z', now)).toBe(0)
  })
})

describe('formatKm', () => {
  it('uses one decimal under 10 km and whole km above', () => {
    expect(formatKm(9.8)).toBe('9.8 km')
    expect(formatKm(78.5)).toBe('79 km')
  })
})

describe('formatRelative', () => {
  const now = Date.parse('2026-10-25T12:00:00Z')
  it('describes recent times', () => {
    expect(formatRelative('2026-10-25T11:59:30Z', now)).toBe('just now')
    expect(formatRelative('2026-10-25T11:55:00Z', now)).toBe('5m ago')
    expect(formatRelative('2026-10-25T09:00:00Z', now)).toBe('3h ago')
    expect(formatRelative('2026-10-23T12:00:00Z', now)).toBe('2d ago')
    expect(formatRelative('2026-09-01T12:00:00Z', now)).toBe('1 Sept')
  })
})
