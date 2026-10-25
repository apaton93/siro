/**
 * City guides for travelling fans, plus where away fans sit at each stadium.
 * Written in our own words from the sources listed per city (checked Oct 2026). No prices –
 * they go stale. Anything that changes per match points fans to their club's official info.
 * Applied by `npm run db:import-guides` (only adds what's missing; edit in /admin).
 */

export interface GuideSectionData {
  /** to-centre: airport → city centre · areas: where to stay · tips: matchday tips · things-to-do: longer stays */
  type: 'to-centre' | 'areas' | 'tips' | 'things-to-do'
  title: string
  content: string
}

export interface StadiumGuide {
  /** Ways to get from the city centre to the ground. */
  gettingThere: string
  /** Where away fans sit and get in. */
  awayFans: string
}

export interface CityGuide {
  city: string
  countryCode: string
  /** Airport → city centre, where to stay, tips. */
  sections: GuideSectionData[]
  /** By stadium name. */
  stadiums: Record<string, StadiumGuide>
  sources: string[]
}

const CHECK_CLUB = 'Your club’s travel page has the final details for this match – meeting points, entry times and any escorted transport.'

export const CITY_GUIDES: CityGuide[] = [
  {
    city: 'Istanbul',
    countryCode: 'TR',
    sections: [
      {
        type: 'to-centre',
        title: 'Airport to the city centre',
        content: [
          'Istanbul Airport (IST, European side): the M11 metro runs to Gayrettepe (about 40 minutes), where you change to the M2 for Taksim. Allow 60–80 minutes in total. Havaist buses also run to Taksim, Beşiktaş and Kadıköy.',
          'Sabiha Gökçen (SAW, Asian side): the M4 metro runs to Kadıköy, which is handy for Fenerbahçe. Havabus coaches go to Taksim and Kadıköy.',
          'Neither metro runs all night, so check the last train if you land late.',
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Best areas for fans',
        content:
          'Most visiting fans base themselves around Taksim and Beyoğlu on the European side – lots of hotels, bars and good transport links to both grounds. For a Fenerbahçe game, remember the stadium is across the Bosphorus: allow an hour to get there.',
      },
      {
        type: 'tips',
        title: 'Matchday tips',
        content: [
          '• Don’t wear colours on matchday, especially near the stadium. Bars around Kadıköy and Seyrantepe are for home fans.',
          '• Atmospheres are intense and hostile. Stay with the away group, and expect to be held in after the final whistle.',
          '• Alcohol isn’t sold inside Turkish stadiums.',
          '• Clubs ask for passport details to issue away tickets – bring the same passport on the day.',
        ].join('\n'),
      },
      {
        type: 'things-to-do',
        title: 'If you’re staying a few days',
        content: [
          '• Sultanahmet: Hagia Sophia, the Blue Mosque and Topkapı Palace are all within a short walk of each other.',
          '• The Grand Bazaar and the Spice Bazaar for shopping and food.',
          '• A Bosphorus ferry – the public ones from Eminönü are cheap and give the best views between Europe and Asia.',
          '• Galata Tower and the streets of Karaköy for cafés and the view across the Golden Horn.',
        ].join('\n'),
      },
    ],
    stadiums: {
      'Şükrü Saracoğlu Stadium': {
        gettingThere: [
          '• Marmaray or metrobus to Söğütlüçeşme, then about 15 minutes on foot.',
          '• From the European side: ferry to Kadıköy (from Karaköy, Eminönü or Beşiktaş) or the Marmaray under the Bosphorus.',
          '• Allow about an hour from Taksim.',
          '• For European games, away fans are often taken in escorted coaches at a set time. ' + CHECK_CLUB,
        ].join('\n'),
        awayFans:
          'In a section of the north (Migros) stand – usually around 2,500 places, unreserved, so arrive early for a lower-tier seat.',
      },
      'RAMS Park': {
        gettingThere: [
          '• M2 metro to Seyrantepe, boarding at Taksim or Şişhane.',
          '• Away fans are often taken in escorted coaches at a set time. ' + CHECK_CLUB,
        ].join('\n'),
        awayFans: 'Blocks A and B of the south stand (gates 418–421). Expect a long hold-back after the match.',
      },
    },
    sources: [
      'https://istanbul.com/blog/airport-transportation/istanbul-airport-city-center-transportation-guide',
      'https://footballgroundguide.com/leagues/others/fenerbahce-sukru-saracoglu-stadium.html',
      'https://footballgroundguide.com/leagues/row/galatasaray-stadium-rams-park',
      'https://www.liverpoolfc.com/tickets/ticket-info/2026-27/ticket-info-european-cup-away/fenerbahce-away-cl-2627',
    ],
  },
  {
    city: 'Barcelona',
    countryCode: 'ES',
    sections: [
      {
        type: 'to-centre',
        title: 'Airport to the city centre',
        content: [
          'The Aerobús express runs from both terminals (T1 and T2) to Plaça Catalunya every 5–10 minutes – the simplest option.',
          'Metro L9 Sud stops at both terminals but needs a change to reach the centre. You need an airport ticket or an integrated card such as the T-usual – the cheaper T-casual isn’t valid at the airport stations.',
          'Rodalies R2 Nord trains leave from T2 (free shuttle from T1) for Sants and Passeig de Gràcia, about every 30 minutes.',
          'Late at night: N17 and N18 night buses run to Plaça Catalunya.',
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Best areas for fans',
        content:
          'The Eixample and the streets around Plaça Catalunya put you on the airport bus and on metro lines L3 and L5 straight to the ground. The Gothic Quarter and El Born are atmospheric but busier and noisier.',
      },
      {
        type: 'tips',
        title: 'Matchday tips',
        content: [
          '• Pickpockets work the metro, La Rambla and crowds around the stadium – keep phones and wallets zipped away.',
          '• Alcohol isn’t sold inside Spanish stadiums.',
          '• Have your ticket and ID ready at the gate. Digital tickets are issued from 24 hours before kick-off.',
        ].join('\n'),
      },
      {
        type: 'things-to-do',
        title: 'If you’re staying a few days',
        content: [
          '• Gaudí: the Sagrada Família (book ahead), Park Güell and Casa Batlló.',
          '• Walk the Gothic Quarter and El Born, then the seafront at Barceloneta.',
          '• Montjuïc for views over the city and port – take the cable car up.',
          '• La Boqueria market off La Rambla for lunch.',
        ].join('\n'),
      },
    ],
    stadiums: {
      'Camp Nou': {
        gettingThere: [
          '• Metro L3 to Palau Reial, Les Corts or Maria Cristina.',
          '• Metro L5 to Collblanc or Badal.',
          '• Tram T1–T3 to Palau Reial or Avinguda de Xile.',
          '• Gates open 90 minutes before kick-off and there’s no left-luggage. ' + CHECK_CLUB,
        ].join('\n'),
        awayFans:
          'Usually the upper tier at the south end. Parts of the stadium are still being rebuilt, so the section can change – check your club’s ticket info.',
      },
    },
    sources: [
      'https://www.atm.cat/com-arribar-a-barcelona-des-de-l-aeroport',
      'https://www.fcbarcelona.com/en/news/4562313/getting-to-spotify-camp-nou',
      'https://footballgroundguide.com/leagues/europe-1/spain/fc-barcelona.html',
    ],
  },
  {
    city: 'London',
    countryCode: 'GB',
    sections: [
      {
        type: 'to-centre',
        title: 'Airport to the city centre',
        content: [
          'Heathrow: the Elizabeth line or Piccadilly line into central London, or the Heathrow Express to Paddington.',
          'Gatwick: Gatwick Express to Victoria, or Thameslink to London Bridge and King’s Cross.',
          'Stansted and Luton: Stansted Express to Liverpool Street; Luton Airport DART to Luton Airport Parkway, then Thameslink.',
          'Contactless bank cards work on the Tube, buses and most trains – no need for a separate ticket.',
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Best areas for fans',
        content:
          'For the Emirates, King’s Cross and Islington are a short Tube ride away. For Stamford Bridge, Earl’s Court, South Kensington and Victoria are all on or near the District line.',
      },
      {
        type: 'tips',
        title: 'Matchday tips',
        content: [
          '• You can’t drink alcohol in sight of the pitch in English grounds; concourse bars are usually open before kick-off and at half-time.',
          '• Pubs near the grounds are mostly for home fans – check your club’s advice on where away supporters are welcome.',
          '• ' + CHECK_CLUB,
        ].join('\n'),
      },
      {
        type: 'things-to-do',
        title: 'If you’re staying a few days',
        content: [
          '• The South Bank walk from Westminster to Tower Bridge – Big Ben, the London Eye, Tate Modern and Borough Market.',
          '• Free museums: the British Museum, the Natural History Museum and the National Gallery.',
          '• The Tower of London and St Paul’s Cathedral.',
          '• Camden Market or Covent Garden in the evening.',
        ].join('\n'),
      },
    ],
    stadiums: {
      'Emirates Stadium': {
        gettingThere: [
          '• Piccadilly line to Arsenal – a few minutes’ walk.',
          '• Victoria line to Highbury & Islington, or Piccadilly/Overground to Finsbury Park – both walkable.',
          '• Holloway Road station is closed on matchdays. Expect queues after the game.',
        ].join('\n'),
        awayFans: 'Lower tier of the south-east corner.',
      },
      'Stamford Bridge': {
        gettingThere: [
          '• District line to Fulham Broadway.',
          '• London Overground to West Brompton or Imperial Wharf, then 15–20 minutes on foot.',
          '• Expect queues at Fulham Broadway after the game.',
        ].join('\n'),
        awayFans:
          'Usually the Shed End lower tier, next to the East Stand. For Shakhtar’s “home” games here, check which end each set of fans is given.',
      },
    },
    sources: [
      'https://www.cpfc.co.uk/information/emirates-arsenal/',
      'https://cpfc.co.uk/matches/away-travel-guides/chelsea',
    ],
  },
]
