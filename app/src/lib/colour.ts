/** Team colour helpers for the city-photo + team-colour bands (ADR-0010). */

const HEX_RE = /^#([0-9a-f]{6})$/i
const FALLBACK = '#0B0B0C'

/** Parse #RRGGBB, falling back to Siro ink for anything invalid. */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = HEX_RE.exec(hex.trim()) ?? HEX_RE.exec(FALLBACK)!
  const n = parseInt(match[1], 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/**
 * Bottom-up fade: solid team colour where the text sits, easing out so the city photo shows.
 * `solidUntil` is the % of height (from the bottom) that stays fully solid. With `clearTop`,
 * the top `clearTop`% has no tint at all; otherwise the top keeps a faint wash.
 */
export function bandFade(hex: string, solidUntil = 45, clearTop?: number): string {
  if (clearTop !== undefined) {
    const clearFrom = 100 - clearTop
    const mid = solidUntil + (clearFrom - solidUntil) * 0.4
    return `linear-gradient(to top, ${rgba(hex, 1)} 0%, ${rgba(hex, 1)} ${solidUntil}%, ${rgba(hex, 0.55)} ${mid}%, ${rgba(
      hex,
      0,
    )} ${clearFrom}%, ${rgba(hex, 0)} 100%)`
  }
  return `linear-gradient(to top, ${rgba(hex, 1)} 0%, ${rgba(hex, 1)} ${solidUntil}%, ${rgba(hex, 0.6)} ${
    solidUntil + 20
  }%, ${rgba(hex, 0.08)} 100%)`
}

/** Subtle diagonal stripe motif in the text colour. */
export function bandStripes(textHex: string, stripe = 12, gap = 14): string {
  return `repeating-linear-gradient(115deg, ${rgba(textHex, 0.14)} 0 ${stripe}px, transparent ${stripe}px ${
    stripe + gap
  }px)`
}
