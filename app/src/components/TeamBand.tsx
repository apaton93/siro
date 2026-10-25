import type { ReactNode } from 'react'
import { bandFade, bandStripes, rgba } from '../lib/colour'

interface TeamBandProps {
  /** Away team's kit colour (#RRGGBB) and the text colour that reads on it. */
  colour: string
  textColour: string
  photoUrl: string | null
  photoCredit?: string | null
  /** % of the band (from the bottom) kept fully solid behind the text. */
  solidUntil?: number
  /** % of the band (from the top) left completely untinted, so more of the city shows. */
  clearTop?: number
  watermark?: boolean
  className?: string
  children: ReactNode
}

/**
 * City photo fading into solid team colour (ADR-0010).
 * Text always sits on the solid part, so it stays readable over any photo.
 */
export function TeamBand({
  colour,
  textColour,
  photoUrl,
  photoCredit,
  solidUntil = 45,
  clearTop,
  watermark = false,
  className = '',
  children,
}: TeamBandProps) {
  return (
    <div className={`team-band ${className}`} style={{ color: textColour }}>
      {photoUrl && <img className="band-photo" src={photoUrl} alt="" loading="lazy" decoding="async" />}
      <div className="band-fade" style={{ background: bandFade(colour, solidUntil, clearTop) }} aria-hidden="true" />
      <div className="band-stripes" style={{ backgroundImage: bandStripes(textColour) }} aria-hidden="true" />
      {watermark && (
        <div className="band-watermark" style={{ WebkitTextStroke: `1px ${rgba(textColour, 0.16)}` }} aria-hidden="true">
          AWAY DAY
        </div>
      )}
      {photoUrl && photoCredit && <small className="band-credit">Photo: {photoCredit}</small>}
      {children}
    </div>
  )
}
