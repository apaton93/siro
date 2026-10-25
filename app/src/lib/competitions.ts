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
  /** Floodlit-stadium photo (Wikimedia Commons), tinted with `colour`. */
  photo?: { url: string; credit: string }
}

/** Photos: Allianz Arena by Richard Bartz (Wikimedia Commons, CC BY-SA 2.5) – night, golden hour, daylight. */
export const COMPETITION_CARDS: CompetitionCardInfo[] = [
  {
    code: 'UCL',
    name: 'Champions League',
    tagline: 'Europe’s top club competition',
    colour: '#0B1D51',
    textColour: '#FFFFFF',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Allianz_arena_at_night_Richard_Bartz.jpg/1280px-Allianz_arena_at_night_Richard_Bartz.jpg',
      credit: 'Richard Bartz, CC BY-SA 2.5, via Wikimedia Commons',
    },
  },
  {
    code: 'UEL',
    name: 'Europa League',
    tagline: 'Thursday nights across Europe',
    colour: '#F26A1B',
    textColour: '#0B0B0C',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Allianz_arena_golden_hour_Richard_Bartz.jpg/1280px-Allianz_arena_golden_hour_Richard_Bartz.jpg',
      credit: 'Richard Bartz, CC BY-SA 2.5, via Wikimedia Commons',
    },
  },
  {
    code: 'UECL',
    name: 'Conference League',
    tagline: 'The road less travelled',
    colour: '#0E7C4A',
    textColour: '#FFFFFF',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Allianz_arena_daylight_Richard_Bartz.jpg/1280px-Allianz_arena_daylight_Richard_Bartz.jpg',
      credit: 'Richard Bartz, CC BY-SA 2.5, via Wikimedia Commons',
    },
  },
]

export const competitionCard = (code: string | undefined) =>
  COMPETITION_CARDS.find((c) => c.code === code?.toUpperCase()) ?? null

/** Card/hero background: the competition colour over its photo, strong enough that text always reads. */
export function compBandStyle(card: CompetitionCardInfo) {
  const tint = (alpha: number) => `color-mix(in srgb, ${card.colour} ${alpha}%, transparent)`
  return {
    color: card.textColour,
    backgroundColor: card.colour,
    backgroundImage: card.photo
      ? `linear-gradient(180deg, ${tint(55)} 0%, ${tint(80)} 55%, ${card.colour} 100%), url("${card.photo.url}")`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  }
}
