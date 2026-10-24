/**
 * Kickoffs are entered in the stadium city's local time ("20:00 in Madrid") and stored in UTC.
 * Small helpers so admins never have to work out offsets or daylight saving themselves.
 */

/** Wall-clock parts of `date` in `timeZone`. */
function wallParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') }
}

/** Minutes `timeZone` is ahead of UTC at `date`. */
function offsetMinutes(date: Date, timeZone: string): number {
  const w = wallParts(date, timeZone)
  const asUtc = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute)
  return Math.round((asUtc - Math.floor(date.getTime() / 60_000) * 60_000) / 60_000)
}

/** "2026-11-26T20:00" in Europe/Madrid → "2026-11-26T19:00:00.000Z". Returns null for bad input. */
export function zonedTimeToUtc(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number)
  const guess = Date.UTC(y, mo - 1, d, h, mi)
  // Apply the offset, then re-check it at the result (handles the hours around clock changes).
  let utc = guess - offsetMinutes(new Date(guess), timeZone) * 60_000
  utc = guess - offsetMinutes(new Date(utc), timeZone) * 60_000
  return new Date(utc).toISOString()
}

/** "2026-11-26T19:00:00Z" → "2026-11-26T20:00" in Europe/Madrid (for a datetime-local input). */
export function utcToZonedInput(iso: string, timeZone: string): string {
  const w = wallParts(new Date(iso), timeZone)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${w.year}-${pad(w.month)}-${pad(w.day)}T${pad(w.hour)}:${pad(w.minute)}`
}
