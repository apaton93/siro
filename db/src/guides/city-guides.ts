/**
 * City guides for travelling fans, plus where away fans sit at each stadium.
 * Written in our own words from the sources listed per city (checked Oct 2026). No prices –
 * they go stale. Anything that changes per match points fans to their club's official info.
 * Applied by `npm run db:import-guides` (only adds what's missing; edit in /admin).
 */

export interface GuideSectionData {
  type: 'transport' | 'areas' | 'safety' | 'general'
  title: string
  content: string
}

export interface CityGuide {
  city: string
  countryCode: string
  sections: GuideSectionData[]
  /** Stadium name → where away fans sit / how they get in. */
  awayNotes: Record<string, string>
  sources: string[]
}

const CHECK_CLUB = 'Your club’s travel page has the final details for this match – meeting points, entry times and any escorted transport.'

export const CITY_GUIDES: CityGuide[] = [
  {
    city: 'Istanbul',
    countryCode: 'TR',
    sections: [
      {
        type: 'transport',
        title: 'From the airport',
        content: [
          'Istanbul Airport (IST, European side): the M11 metro runs to Gayrettepe (about 40 minutes), where you change to the M2 for Taksim. Allow 60–80 minutes in total. Havaist buses also run to Taksim, Beşiktaş and Kadıköy.',
          'Sabiha Gökçen (SAW, Asian side): the M4 metro runs to Kadıköy, which is handy for Fenerbahçe. Havabus coaches go to Taksim and Kadıköy.',
          'Neither metro runs all night, so check the last train if you land late.',
        ].join('\n\n'),
      },
      {
        type: 'transport',
        title: 'Getting to the stadium',
        content: [
          'Fenerbahçe (Şükrü Saracoğlu, Kadıköy – Asian side): the nearest station is Söğütlüçeşme (Marmaray and metrobus), about a 15-minute walk. From the European side, cross by Marmaray or ferry to Kadıköy.',
          'Galatasaray (RAMS Park, Seyrantepe – European side): M2 metro to Seyrantepe, boarding at Taksim or Şişhane.',
          'For European games, away fans are often taken to the ground by escorted coaches at a set time. ' + CHECK_CLUB,
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Where to stay',
        content:
          'Most visiting fans base themselves around Taksim and Beyoğlu on the European side – lots of hotels, bars and good transport links to both grounds. For a Fenerbahçe game, remember the stadium is across the Bosphorus: allow an hour to get there.',
      },
      {
        type: 'safety',
        title: 'Away day tips',
        content: [
          '• Don’t wear colours on matchday, especially near the stadium. Bars around Kadıköy and Seyrantepe are for home fans.',
          '• Atmospheres are intense and hostile. Stay with the away group, and expect to be held in after the final whistle.',
          '• Alcohol isn’t sold inside Turkish stadiums.',
          '• Clubs ask for passport details to issue away tickets – bring the same passport on the day.',
        ].join('\n'),
      },
    ],
    awayNotes: {
      'Şükrü Saracoğlu Stadium':
        'Away fans are in a section of the north (Migros) stand – usually around 2,500 places, unreserved, so arrive early for a lower-tier seat.',
      'RAMS Park': 'Away fans are in blocks A and B of the south stand (gates 418–421). Expect a long hold-back after the match.',
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
        type: 'transport',
        title: 'From the airport',
        content: [
          'The Aerobús express runs from both terminals (T1 and T2) to Plaça Catalunya every 5–10 minutes – the simplest option.',
          'Metro L9 Sud stops at both terminals but needs a change to reach the centre. You need an airport ticket or an integrated card such as the T-usual – the cheaper T-casual isn’t valid at the airport stations.',
          'Rodalies R2 Nord trains leave from T2 (free shuttle from T1) for Sants and Passeig de Gràcia, about every 30 minutes.',
          'Late at night: N17 and N18 night buses run to Plaça Catalunya.',
        ].join('\n\n'),
      },
      {
        type: 'transport',
        title: 'Getting to the stadium',
        content: [
          'Spotify Camp Nou is in Les Corts, west of the centre. Metro L3 to Palau Reial, Les Corts or Maria Cristina, or L5 to Collblanc or Badal. Trams T1–T3 stop at Palau Reial and Avinguda de Xile.',
          'Gates open 90 minutes before kick-off – the club asks everyone to arrive early. There’s no left-luggage at the stadium.',
          CHECK_CLUB,
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Where to stay',
        content:
          'The Eixample and the streets around Plaça Catalunya put you on the airport bus and on metro lines L3 and L5 straight to the ground. The Gothic Quarter and El Born are atmospheric but busier and noisier.',
      },
      {
        type: 'safety',
        title: 'Away day tips',
        content: [
          '• Pickpockets work the metro, La Rambla and crowds around the stadium – keep phones and wallets zipped away.',
          '• Alcohol isn’t sold inside Spanish stadiums.',
          '• Have your ticket and ID ready at the gate. Digital tickets are issued from 24 hours before kick-off.',
        ].join('\n'),
      },
    ],
    awayNotes: {
      'Camp Nou':
        'Away fans are usually in the upper tier at the south end. Parts of the stadium are still being rebuilt, so the section can change – check your club’s ticket info.',
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
        type: 'transport',
        title: 'From the airport',
        content: [
          'Heathrow: the Elizabeth line or Piccadilly line into central London, or the Heathrow Express to Paddington.',
          'Gatwick: Gatwick Express to Victoria, or Thameslink to London Bridge and King’s Cross.',
          'Stansted and Luton: Stansted Express to Liverpool Street; Luton Airport DART to Luton Airport Parkway, then Thameslink.',
          'Contactless bank cards work on the Tube, buses and most trains – no need for a separate ticket.',
        ].join('\n\n'),
      },
      {
        type: 'transport',
        title: 'Getting to the stadium',
        content: [
          'Emirates Stadium (Arsenal, north London): Piccadilly line to Arsenal station, a few minutes’ walk. Finsbury Park and Highbury & Islington are also walkable. Holloway Road station is closed on matchdays.',
          'Stamford Bridge (Chelsea, and Shakhtar’s European home this season): District line to Fulham Broadway, or London Overground to West Brompton or Imperial Wharf (15–20 minutes’ walk).',
          'Stations are very busy after the match – expect queues.',
        ].join('\n\n'),
      },
      {
        type: 'areas',
        title: 'Where to stay',
        content:
          'For the Emirates, King’s Cross and Islington are a short Tube ride away. For Stamford Bridge, Earl’s Court, South Kensington and Victoria are all on or near the District line.',
      },
      {
        type: 'general',
        title: 'Away day tips',
        content: [
          '• You can’t drink alcohol in sight of the pitch in English grounds; concourse bars are usually open before kick-off and at half-time.',
          '• Pubs near the grounds are mostly for home fans – check your club’s advice on where away supporters are welcome.',
          '• ' + CHECK_CLUB,
        ].join('\n'),
      },
    ],
    awayNotes: {
      'Emirates Stadium': 'Away fans are in the lower tier of the south-east corner.',
      'Stamford Bridge':
        'Away fans are in the Shed End lower tier, next to the East Stand. For Shakhtar’s “home” games here, check which side each set of fans is given.',
    },
    sources: [
      'https://www.cpfc.co.uk/information/emirates-arsenal/',
      'https://cpfc.co.uk/matches/away-travel-guides/chelsea',
    ],
  },
]
