/**
 * The competitions shown as cards on the home page. Our own colours and wording,
 * no official logos or branding (ADR-0010).
 */
export interface CompetitionCardInfo {
  code: 'UCL' | 'UEL' | 'UECL'
  name: string
  tagline: string
  colour: string
  textColour: string
  /** Photo of this season's final venue (Wikimedia Commons), tinted with `colour`. */
  photo?: { url: string; credit: string }
}

/** Photos: each competition's 2026/27 final venue (Wikimedia Commons). */
export const COMPETITION_CARDS: CompetitionCardInfo[] = [
  {
    code: 'UCL',
    name: 'Champions League',
    tagline: 'Final: Metropolitano, Madrid',
    colour: '#0B1D51',
    textColour: '#FFFFFF',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Atleti_vs_Villarreal_-_September_2025.jpg/1280px-Atleti_vs_Villarreal_-_September_2025.jpg',
      credit: 'Elwin594, CC0, via Wikimedia Commons',
    },
  },
  {
    code: 'UEL',
    name: 'Europa League',
    tagline: 'Final: Stadion Frankfurt',
    colour: '#F26A1B',
    textColour: '#0B0B0C',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Deutsche_bank_park.jpg/1280px-Deutsche_bank_park.jpg',
      credit: 'Patrik Meyer, CC BY-SA 4.0, via Wikimedia Commons',
    },
  },
  {
    code: 'UECL',
    name: 'Conference League',
    tagline: 'Final: Beşiktaş Park, Istanbul',
    colour: '#0E7C4A',
    textColour: '#FFFFFF',
    photo: {
      url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/T%C3%BCpra%C5%9F_Stadyumu_20231011_2.jpg/1280px-T%C3%BCpra%C5%9F_Stadyumu_20231011_2.jpg',
      credit: 'Beşiktaş JK, CC BY 2.0, via Wikimedia Commons',
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
