import { describe, expect, it } from 'vitest'
import { utcToZonedInput, zonedTimeToUtc } from './zoned'

describe('zonedTimeToUtc', () => {
  it('handles winter and summer time', () => {
    expect(zonedTimeToUtc('2026-11-26T20:00', 'Europe/Madrid')).toBe('2026-11-26T19:00:00.000Z')
    expect(zonedTimeToUtc('2026-08-20T21:00', 'Europe/Madrid')).toBe('2026-08-20T19:00:00.000Z')
    expect(zonedTimeToUtc('2026-08-20T19:45', 'Europe/London')).toBe('2026-08-20T18:45:00.000Z')
    expect(zonedTimeToUtc('2027-02-18T18:45', 'Europe/Istanbul')).toBe('2027-02-18T15:45:00.000Z')
  })

  it('handles the days the clocks change', () => {
    // UK clocks go forward 01:00 → 02:00 on 28 Mar 2027 and back on 31 Oct 2027.
    expect(zonedTimeToUtc('2027-03-28T15:00', 'Europe/London')).toBe('2027-03-28T14:00:00.000Z')
    expect(zonedTimeToUtc('2027-10-31T15:00', 'Europe/London')).toBe('2027-10-31T15:00:00.000Z')
  })

  it('rejects incomplete input', () => {
    expect(zonedTimeToUtc('2026-11-26', 'Europe/Madrid')).toBeNull()
  })
})

describe('utcToZonedInput', () => {
  it('round-trips', () => {
    expect(utcToZonedInput('2026-11-26T19:00:00Z', 'Europe/Madrid')).toBe('2026-11-26T20:00')
    expect(utcToZonedInput(zonedTimeToUtc('2027-05-01T12:30', 'Europe/Lisbon')!, 'Europe/Lisbon')).toBe('2027-05-01T12:30')
  })
})
