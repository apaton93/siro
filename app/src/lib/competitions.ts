/**
 * The competitions shown as cards on the home page. Our own colours and wording –
 * no official logos or branding (ADR-0010).
 */
export interface CompetitionCardInfo {
  code: 'UCL' | 'UEL' | 'UECL'
  name: string
  tagline: string
  colour: string
  textColour: string
}

export const COMPETITION_CARDS: CompetitionCardInfo[] = [
  { code: 'UCL', name: 'Champions League', tagline: 'Europe’s top club competition', colour: '#0B1D51', textColour: '#FFFFFF' },
  { code: 'UEL', name: 'Europa League', tagline: 'Thursday nights across Europe', colour: '#F26A1B', textColour: '#0B0B0C' },
  { code: 'UECL', name: 'Conference League', tagline: 'The road less travelled', colour: '#0E7C4A', textColour: '#FFFFFF' },
]

export const competitionCard = (code: string | undefined) =>
  COMPETITION_CARDS.find((c) => c.code === code?.toUpperCase()) ?? null
