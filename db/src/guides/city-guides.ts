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

/** One bullet per line. */
const bullets = (...lines: string[]) => lines.map((l) => `• ${l}`).join('\n')

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
  // ---------------------------------------------------------------- England
  {
    city: 'Manchester',
    countryCode: 'GB',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Trains from Manchester Airport to Piccadilly take about 15–20 minutes and run all day.',
        'The Metrolink tram also runs from the airport into the centre (slower, about 45 minutes).',
        'Contactless bank cards work on trains, trams and buses.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Northern Quarter and Piccadilly: lots of bars and close to trams for the Etihad.',
        'Deansgate, Spinningfields and Castlefield: handy for Old Trafford by tram.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'You can’t drink alcohol in sight of the pitch; concourse bars open before kick-off and at half-time.',
        'Pubs near both grounds are mainly for home fans – most away fans drink in the city centre.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The National Football Museum and the Science and Industry Museum.',
        'Stadium tours at Old Trafford or the Etihad.',
        'The Northern Quarter’s independent shops, cafés and street art.',
        'Day trips: Liverpool is under an hour by train; the Peak District is close by.',
      ) },
    ],
    stadiums: {
      'Etihad Stadium': {
        gettingThere: bullets(
          'Metrolink to Etihad Campus (about 8 minutes from Piccadilly), then a 5-minute walk. Trams run about every 6 minutes on matchdays.',
          'Train one stop from Piccadilly to Ashburys, then about 15 minutes on foot.',
          'Walking from Piccadilly takes 20–25 minutes.',
        ),
        awayFans: 'Right-hand side of the South Stand behind the goal, across three tiers. Turnstiles L1–L3, depending on your tier.',
      },
      'Old Trafford': {
        gettingThere: bullets(
          'Metrolink to Old Trafford (Altrincham-line trams) or Trafford Bar, then 10–15 minutes on foot. Wharfside, on the Trafford Centre line, is closest.',
          'Buses 255, 256 and 263 from Piccadilly Gardens along Chester Road, about 15–20 minutes.',
        ),
        awayFans: 'The corner between the Sir Bobby Charlton Stand and the East Stand – safe standing for most of the section.',
      },
    },
    sources: [
      'https://footballgroundguide.com/leagues/england/premier-league/etihad-stadium-manchester-city.html',
      'https://footballgroundguide.com/leagues/england/premier-league/old-trafford-manchester-united.html',
    ],
  },
  {
    city: 'Liverpool',
    countryCode: 'GB',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Liverpool John Lennon Airport: buses run to the city centre (about 30–40 minutes), or take a short bus to Liverpool South Parkway for trains into Lime Street and Central.',
        'Many fans fly into Manchester Airport instead – direct trains to Liverpool Lime Street take about an hour.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The city centre around Lime Street, Ropewalks and the Albert Dock – pubs, restaurants and a short trip to Anfield.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'You can’t drink alcohol in sight of the pitch; the away concourse sells food and drink before kick-off and at half-time.',
        'Pubs around Anfield are home fans’ territory – drink in town and travel up together.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The waterfront: the Royal Albert Dock, the Beatles Story, Tate Liverpool and the Museum of Liverpool.',
        'Mathew Street and the Cavern Club.',
        'The two cathedrals on Hope Street.',
        'A ferry across the Mersey.',
      ) },
    ],
    stadiums: {
      Anfield: {
        gettingThere: bullets(
          'Merseyrail from Liverpool Central to Sandhills, then the matchday Soccerbus to the ground (runs before and after games).',
          'Kirkdale station is just under a mile away on foot.',
          'Buses and taxis from the city centre take about 15–20 minutes, longer near kick-off.',
        ),
        awayFans: 'The Anfield Road Stand, segregated from home fans who sit beside and above. Food and drink kiosks on the away concourse.',
      },
    },
    sources: ['https://footballgroundguide.com/leagues/england/premier-league/anfield-liverpool.html'],
  },
  {
    city: 'Birmingham',
    countryCode: 'GB',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Birmingham Airport links to Birmingham International station by the free Air-Rail Link; trains to New Street take 10–15 minutes and run very frequently.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Around New Street and Broad Street, or the canal-side bars of Brindleyplace – trains to Villa Park leave from New Street.',
        'The Jewellery Quarter for quieter pubs and restaurants.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Alcohol is served in the lower away block only, and not in sight of the pitch.',
        'The North Stand is closed all season for rebuilding – your club will confirm the away allocation.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The canals around Gas Street Basin and Brindleyplace.',
        'Birmingham Museum and Art Gallery, and the Library of Birmingham’s roof gardens.',
        'The Bullring and the Balti Triangle for food.',
        'Day trips to Stratford-upon-Avon or Warwick Castle.',
      ) },
    ],
    stadiums: {
      'Villa Park': {
        gettingThere: bullets(
          'Train from New Street to Witton (closest to the away end – a few minutes’ walk along Witton Lane) or Aston (about 10 minutes’ walk). About 10–15 minutes; extra trains on matchdays.',
        ),
        awayFans: 'The north end of the Doug Ellis Stand (along the side of the pitch), in lower Block Q and upper Block P.',
      },
    },
    sources: [
      'https://footballgroundguide.com/leagues/england/premier-league/villa-park-aston-villa.html',
      'https://footballgroundguide.com/news/villa-park-expansion-everything-aston-villa-fans-need-to-know-about-north-stand-closure-in-2026-27.html',
    ],
  },
  // ---------------------------------------------------------------- Spain
  {
    city: 'Madrid',
    countryCode: 'ES',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Metro line 8 runs from all terminals to Nuevos Ministerios (about 25 minutes), where you can change to the rest of the network – the Bernabéu is one stop away on line 10.',
        'Cercanías trains (C1) run from Terminal 4 to Atocha and Chamartín.',
        'The Exprés Aeropuerto bus runs 24 hours to Cibeles and Atocha.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Sol and around Plaza Mayor – the usual meeting point for away fans, with bars everywhere.',
        'Huertas and La Latina for tapas bars; Malasaña for a younger crowd.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Alcohol isn’t sold inside Spanish stadiums.',
        'Away fans usually gather in Plaza Mayor before heading to the ground – keep it respectful and locals are friendly.',
        'Kick-offs are late by UK standards (usually 9pm), so plan your metro home.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Prado, the Reina Sofía (Picasso’s Guernica) and the Thyssen – the “golden triangle” of art.',
        'Retiro Park and the Royal Palace.',
        'Mercado de San Miguel for food.',
        'Stadium tours at the Bernabéu.',
      ) },
    ],
    stadiums: {
      'Santiago Bernabéu': {
        gettingThere: bullets(
          'Metro line 10 to Santiago Bernabéu station, right by the ground.',
          'Buses 27, 40, 43, 126, 147 and 150 stop at the stadium.',
          'Walking from Sol takes over an hour.',
        ),
        awayFans: 'Top tier of the north end (Fondo Norte), wrapping round the north-east corner. It’s high up, and netting is often fitted in front.',
      },
      'Riyadh Air Metropolitano': {
        gettingThere: bullets(
          'Metro line 7 to Estadio Metropolitano station, next to the ground. It’s about 11 km from the centre – too far to walk.',
          'Plan your route before the day: trains are packed after the match.',
        ),
        awayFans: 'Top tier of the North Stand (blocks 313–315 and 413–416), segregated, with netting in front.',
      },
    },
    sources: [
      'https://footballgroundguide.com/news/real-madrid-away-section-guide',
      'https://footballgroundguide.com/news/riyadh-air-metropolitano-away-section-guide.html',
    ],
  },
  {
    city: 'Seville',
    countryCode: 'ES',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'The EA airport bus runs to Santa Justa station and Plaza de Armas in about 35 minutes.',
        'Taxis charge a fixed fare to the centre.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Santa Cruz and around the cathedral – lively and central.',
        'Alameda de Hércules: bars and a short walk over the Barqueta bridge to La Cartuja.',
        'Triana, across the river, for tapas and flamenco.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Alcohol isn’t sold inside Spanish stadiums.',
        'Police close the roads onto La Cartuja island about 90 minutes before kick-off, so taxis can’t get close.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Real Alcázar and the cathedral with the Giralda tower.',
        'Plaza de España and María Luisa Park.',
        'The Setas (Metropol Parasol) rooftop walkway.',
        'An evening flamenco show in Triana.',
      ) },
    ],
    stadiums: {
      'Estadio de La Cartuja': {
        gettingThere: bullets(
          'Matchday shuttle (Lanzadera Betis): Metro line 1 to Blas Infante, then shuttles about every 5 minutes.',
          'TUSSAM C1 and C2 circular buses, about 30–40 minutes – look for the “E” special services.',
          'Cercanías C-2 from Santa Justa to Estadio Olímpico, about 15 minutes.',
          'Walk from Alameda de Hércules over the Barqueta bridge, 30–45 minutes.',
        ),
        awayFans: 'Betis play at La Cartuja while the Benito Villamarín is rebuilt. The away section is set per match – check your club’s ticket info.',
      },
    },
    sources: ['https://www.seville-traveller.com/la-cartuja-stadium/', 'https://www.seville-traveller.com/betis-matches/'],
  },
  {
    city: 'Villarreal',
    countryCode: 'ES',
    sections: [
      { type: 'to-centre', title: 'Getting there', content: bullets(
        'Villarreal (Vila-real) is a small town. Most fans fly into Valencia: take the metro from the airport into Valencia, then the train to Vila-real (about an hour).',
        'Castellón airport is closer, with buses to Castellón, one stop from Vila-real by train.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Most fans stay in Valencia for its hotels, beaches and nightlife, and take the train to the match.',
        'Staying in Vila-real itself means a short walk to the ground, but there are far fewer hotels.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Alcohol isn’t sold inside Spanish stadiums.',
        'Check the last train back to Valencia before kick-off – 9pm games finish late.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'In Valencia: the City of Arts and Sciences, the old town and Central Market, and paella by the beach at Malvarrosa.',
        'The Turia Gardens – a park in the old riverbed that runs right across Valencia.',
      ) },
    ],
    stadiums: {
      'Estadio de la Cerámica': {
        gettingThere: bullets(
          'About 20 minutes on foot from Vila-real railway station, or 10 minutes from the town centre.',
        ),
        awayFans: 'Upper tier of the North Stand, behind the goal – a section for away fans only.',
      },
    },
    sources: ['https://footballgroundguide.com/away-fans-guide-to-Villarreal'],
  },
  // ---------------------------------------------------------------- Italy
  {
    city: 'Milan',
    countryCode: 'IT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Malpensa: the Malpensa Express train to Cadorna or Centrale, about 40–50 minutes.',
        'Linate: metro line M4 into the centre in about 15 minutes.',
        'Bergamo (Orio al Serio): coaches to Milano Centrale, about an hour.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Around the Duomo for the sights, Navigli for canal-side bars, or near Centrale for transport links.',
        'The M5 metro to San Siro runs from Garibaldi, so Porta Garibaldi and Isola are handy too.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Italian tickets are named – bring the photo ID that matches your ticket.',
        'Expect several ticket and search checkpoints before the turnstiles.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Duomo (go up on the roof) and the Galleria Vittorio Emanuele II.',
        'Leonardo’s Last Supper – book weeks ahead.',
        'An evening aperitivo along the Navigli canals.',
        'Lake Como is about an hour away by train.',
      ) },
    ],
    stadiums: {
      'San Siro': {
        gettingThere: bullets(
          'Metro M5 (lilac) to San Siro Stadio, right by the ground.',
          'Tram 16 to Piazzale Axum, a short walk.',
          'Allow at least 40 minutes from the centre on matchdays.',
        ),
        awayFans: 'Top tier of the Curva Sud, behind the goal (blocks 301–318 for a full allocation). Netting can affect the view.',
      },
    },
    sources: ['https://footballgroundguide.com/news/inter-milan-away-section'],
  },
  {
    city: 'Rome',
    countryCode: 'IT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Fiumicino: the Leonardo Express train to Termini (about 30 minutes), or regional trains to Trastevere and Ostiense.',
        'Ciampino: buses to Termini, about 40 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Around Termini and Monti for transport links; the centro storico and Trastevere for atmosphere.',
        'Prati, near the Vatican, is close to the stadium side of the city.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Italian tickets are named – carry photo ID that matches your ticket.',
        'Travel to and from the ground in a group: there have been attacks on visiting fans in Rome.',
        'Keep your ticket to hand – there are several checkpoints before the turnstiles.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Colosseum, Roman Forum and Palatine Hill (book ahead).',
        'The Vatican Museums, Sistine Chapel and St Peter’s.',
        'The Pantheon, Trevi Fountain and Piazza Navona on foot.',
        'Trastevere in the evening for food.',
      ) },
    ],
    stadiums: {
      'Stadio Olimpico': {
        gettingThere: bullets(
          'Metro A to Flaminio, then tram 2 to Mancini and walk over the bridge.',
          'Or Metro A to Ottaviano, then bus 32 to Farnesina.',
          'Away clubs sometimes arrange police-escorted buses from the centre.',
        ),
        awayFans: 'Usually at the north end, opposite Roma’s Curva Sud. Your club confirms the exact sector.',
      },
    },
    sources: ['https://footballgroundguide.com/news/celtic-fans-in-rome-stadio-olimpico.html'],
  },
  {
    city: 'Naples',
    countryCode: 'IT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'The Alibus runs from Capodichino airport to Piazza Garibaldi (central station) and the port at Molo Beverello in about 20 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The historic centre and Chiaia/the seafront are the most popular places to stay.',
        'Near Piazza Garibaldi is handy for the metro to the stadium, but it’s rough around the edges at night.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Italian tickets are named – carry matching photo ID.',
        'Stay in groups on matchday and keep a low profile; avoid outlying districts such as Scampia and Secondigliano.',
        'Watch your phone and wallet in crowds.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Pizza in its home city – the old centre’s pizzerias are a must.',
        'Pompeii and Herculaneum, both easy by train.',
        'The National Archaeological Museum and the underground tunnels of Napoli Sotterranea.',
        'A ferry to Capri or along the Amalfi Coast.',
      ) },
    ],
    stadiums: {
      'Stadio Diego Armando Maradona': {
        gettingThere: bullets(
          'The stadium is in Fuorigrotta, about 7 km from the centre.',
          'Metro line 2 from Napoli Centrale (Garibaldi) to Campi Flegrei.',
          'Metro line 6 to Mostra.',
        ),
        awayFans: 'North-east corner, between Curva A and the Tribuna Posillipo, across both lower tiers.',
      },
    },
    sources: ['https://footballgroundguide.com/news/away-fans-guide-to-naples.html'],
  },
  {
    city: 'Como',
    countryCode: 'IT',
    sections: [
      { type: 'to-centre', title: 'Getting there', content: bullets(
        'Fly to Milan: from Malpensa, Linate or Bergamo get into Milan, then take a train to Como – from Milano Cadorna to Como Nord Lago (about an hour), or from Milano Centrale to Como San Giovanni (about 40 minutes).',
        'Como Nord Lago station is right by the lake and a short walk from the stadium.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Como’s old town and lakefront are small and walkable, with the stadium on the lake shore.',
        'Hotels are limited and pricey – many fans stay in Milan and take the train.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'The away end has little cover – bring waterproofs if rain is forecast.',
        'Italian tickets are named – carry matching photo ID.',
        'The away allocation is small, so don’t travel without a ticket.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The funicular up to Brunate for views over the lake.',
        'A boat to Bellagio or Varenna.',
        'Como Cathedral and the lakeside walk to Villa Olmo.',
      ) },
    ],
    stadiums: {
      'Stadio Giuseppe Sinigaglia': {
        gettingThere: bullets(
          'Walk along the lakeside promenade from the town centre – about 10–20 minutes.',
          'Local ASF buses stop at Como–Recchi, a short walk away.',
        ),
        awayFans: 'The Curva Monumento, opposite the home end. It’s steep and close to the pitch, with limited cover.',
      },
    },
    sources: ['https://footballgroundguide.com/news/como-away-end-key-information'],
  },
  // ---------------------------------------------------------------- Germany
  {
    city: 'Munich',
    countryCode: 'DE',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'S-Bahn S1 or S8 from the airport to Hauptbahnhof and Marienplatz, about 40 minutes.',
        'The Lufthansa Express Bus runs to Hauptbahnhof too.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Altstadt around Marienplatz – beer halls and the U6 to the stadium.',
        'Near Hauptbahnhof for cheaper hotels and good links.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Arrive early – there are security checks, and the walk from the station takes 15 minutes.',
        'Expect crowded trains back into town after the match.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Hofbräuhaus and the Viktualienmarkt.',
        'The English Garden and its river surfers.',
        'Nymphenburg Palace, and a stadium tour at the Allianz Arena.',
        'Day trips to Neuschwanstein Castle or Dachau memorial.',
      ) },
    ],
    stadiums: {
      'Allianz Arena': {
        gettingThere: bullets(
          'U6 from Marienplatz to Fröttmaning (about 30 minutes), then a 15-minute walk.',
        ),
        awayFans: 'Usually the upper tier of the North Stand (blocks 340–347). Follow the away-fan signs from Fröttmaning.',
      },
    },
    sources: ['https://footballgroundguide.com/news/allianz-arena-bayern-munich-away-end-guide.html'],
  },
  {
    city: 'Dortmund',
    countryCode: 'DE',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Dortmund Airport: the AirportExpress bus runs to Dortmund Hauptbahnhof in about 25 minutes.',
        'Düsseldorf Airport is the bigger hub – trains from its station to Dortmund Hbf take about an hour.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Around Hauptbahnhof and the Alter Markt – bars, hotels and the U45 straight to the ground.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Food and drink are sold on the concourse, but at UEFA games you can’t take alcohol into the stands.',
        'Dortmund match tickets usually double as a return public transport ticket on the day – check yours.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The German Football Museum, opposite the Hauptbahnhof.',
        'A stadium tour of Signal Iduna Park and the Yellow Wall.',
        'The Dortmunder U art centre, and the Zollverein colliery (in nearby Essen).',
      ) },
    ],
    stadiums: {
      'Signal Iduna Park': {
        gettingThere: bullets(
          'U45 from Hauptbahnhof to “Stadion” – at least every 5 minutes from three hours before kick-off.',
          'U46 to Westfalenhallen or U42 to Theodor-Fliedner-Heim also serve the ground.',
        ),
        awayFans: 'The North Stand (Nordtribüne), opposite the Yellow Wall, across two tiers. Seated for UEFA games.',
      },
    },
    sources: [
      'https://footballgroundguide.com/news/borussia-dortmund-away-section',
      'https://www.bus-und-bahn.de/en/arrival-signal-iduna-park',
    ],
  },
  {
    city: 'Leipzig',
    countryCode: 'DE',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Leipzig/Halle Airport has its own station: S-Bahn and regional trains reach Leipzig Hauptbahnhof in about 15 minutes.',
        'Berlin airport is about 90 minutes away by train if flights are better there.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The compact city centre between the Hauptbahnhof and the Markt – walkable to the stadium.',
        'Südvorstadt (Karli) for bars and a younger crowd.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Beer is sold on the concourse and you can take it to your seat.',
        'Match tickets have included free local public transport – check yours.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'St Thomas Church (Bach) and the Monument to the Battle of the Nations.',
        'The Museum in the “Runde Ecke” and the Forum of Contemporary History.',
        'Auerbachs Keller for a traditional meal.',
      ) },
    ],
    stadiums: {
      'Red Bull Arena': {
        gettingThere: bullets(
          'Trams 3, 7, 8 or 15 to Am Sportforum Süd, or 18/19 (Sportforum Ost on matchdays).',
          'Walking from the centre takes 20–30 minutes.',
          'Matchday fan shuttles have run from the west side of the Hauptbahnhof.',
        ),
        awayFans: 'The away block sits at the opposite end to the home ultras, across both tiers. Expect plenty of steps to get in.',
      },
    },
    sources: [
      'https://footballgroundguide.com/news/rb-leipzig-away-section',
      'https://www.tottenhamhotspur.com/news/995175/rb-leipzig-v-spurs-travel-advice',
    ],
  },
  {
    city: 'Stuttgart',
    countryCode: 'DE',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'S-Bahn S2 or S3 from the airport to the Hauptbahnhof, about 30 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The centre around Schlossplatz and the Königstraße.',
        'Bad Cannstatt, near the stadium, for old-town beer gardens (and the Wasen festival in season).',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Match tickets have included VVS public transport on the day.',
        'Bags bigger than A4 aren’t allowed; you can be refused entry if you’re clearly drunk.',
        'Food and drink can’t be brought into the stadium.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Mercedes-Benz and Porsche museums.',
        'The Staatsgalerie and the Schlossplatz palaces.',
        'Vineyard walks above the city, and the TV Tower for views.',
      ) },
    ],
    stadiums: {
      MHPArena: {
        gettingThere: bullets(
          'S-Bahn S1 to NeckarPark, then a short walk (matchday U11 trams also stop there).',
          'S2 or S3 to Bad Cannstatt, then about 20 minutes on foot.',
          'U4 or U9 from Staatsgalerie towards Untertürkheim, 15–20 minutes.',
        ),
        awayFans: 'The Untertürkheimer Kurve (blocks 61–65), entering via Benzstraße.',
      },
    },
    sources: [
      'https://footballgroundguide.com/news/how-to-get-to-mhparena.html',
      'https://en.atalanta.it/news/stuttgart-v-atalanta-important-info-for-nerazzurri-fans-travelling-to-germany',
    ],
  },
  // ---------------------------------------------------------------- France & Belgium
  {
    city: 'Paris',
    countryCode: 'FR',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Charles de Gaulle: RER B to Gare du Nord and Châtelet, about 35 minutes.',
        'Orly: metro line 14 straight into the centre, about 25 minutes.',
        'Beauvais: the shuttle coach to Porte Maillot takes about 75 minutes.',
        'Eurostar from London arrives at Gare du Nord.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Left Bank (Saint-Germain, the Latin Quarter) or the Marais for atmosphere.',
        'The 15th and 16th arrondissements and Boulogne-Billancourt are closest to the Parc des Princes.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'French stadiums don’t sell alcohol to general fans.',
        'French police are strict – carry ID and follow their instructions.',
        'Pickpockets work the metro and tourist spots.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Eiffel Tower, the Louvre and Notre-Dame.',
        'Montmartre and the Sacré-Cœur.',
        'A boat along the Seine.',
        'The Musée d’Orsay for the Impressionists.',
      ) },
    ],
    stadiums: {
      'Parc des Princes': {
        gettingThere: bullets(
          'Metro 9 to Porte de Saint-Cloud (about 5 minutes’ walk) or Metro 10 to Porte d’Auteuil (about 10 minutes).',
          'Buses 22, 62 and 72 stop at Porte de Saint-Cloud.',
        ),
        awayFans: 'North-west corner, between the Tribune Auteuil and the main stand, with netting either side.',
      },
    },
    sources: ['https://footballgroundguide.com/news/psg-away-section-guide'],
  },
  {
    city: 'Lille',
    countryCode: 'FR',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Lille-Lesquin airport: shuttle buses to the city centre stations, about 20 minutes.',
        'Most fans arrive by train – Eurostar from London or TGV from Paris and Brussels into Lille Europe.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Vieux-Lille and the Grand Place – cobbled streets, bars and restaurants, and metro line 1 to the stadium.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'French stadiums don’t sell alcohol to general fans.',
        'Security can be heavy-handed – keep ID and your ticket ready, and arrive early.',
        'Tickets may need collecting in Lille before kick-off – check the deadline.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Palais des Beaux-Arts and the Old Stock Exchange.',
        'Waffles at Méert and the restaurants of Vieux-Lille.',
        'Bruges and Brussels are under an hour away by train.',
      ) },
    ],
    stadiums: {
      'Stade Pierre-Mauroy': {
        gettingThere: bullets(
          'Metro line 1 to Cité Scientifique or 4 Cantons–Stade Pierre-Mauroy, then 10–15 minutes on foot. Trains run more often from two hours before events.',
          'Metro line 2 to Les Prés, then the free shuttle bus.',
        ),
        awayFans: 'South-east corner, opposite the home ultras.',
      },
    },
    sources: ['https://footballgroundguide.com/news/aston-villa-fans-in-lille-matchday-guide'],
  },
  {
    city: 'Lens',
    countryCode: 'FR',
    sections: [
      { type: 'to-centre', title: 'Getting there', content: bullets(
        'Lens is a small town with no airport. Fly to Lille, Brussels or Paris, or take the Eurostar to Lille.',
        'Trains from Lille to Lens take about 40–45 minutes; TGVs from Paris Nord take a little over an hour.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Most visiting fans stay in Lille, which has far more hotels and nightlife, and take the train to Lens on matchday.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'French stadiums don’t sell alcohol to general fans.',
        'Check the last train back to Lille before kick-off.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Louvre-Lens museum, a short walk from the stadium.',
        'The First World War memorials at Vimy Ridge and Notre-Dame de Lorette nearby.',
      ) },
    ],
    stadiums: {
      'Stade Bollaert-Delelis': {
        gettingThere: bullets(
          'About 15 minutes on foot from Lens station: left out of the station, across Avenue Alfred Maës and through the car park on Rue Maurice Carton.',
        ),
        awayFans: 'The Tribune Trannin.',
      },
    },
    sources: ['https://whufc.com/news/rc-lens-v-west-ham-united-all-you-need-know'],
  },
  {
    city: 'Bruges',
    countryCode: 'BE',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Brussels Airport: trains to Brugge take about 1 hour 30 minutes (direct or with a change in Brussels).',
        'Ostend-Bruges airport is small but close, about 25 minutes away.',
        'Eurostar to Brussels-Midi, then about an hour by train.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The medieval centre around the Markt and Burg – most away fans spend the day here.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Cards only inside the stadium. Beer is sold before kick-off and at half-time.',
        'The ground is about 3 km from the centre – leave plenty of time.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Climb the Belfry and take a canal boat tour.',
        'The Groeninge Museum and the Basilica of the Holy Blood.',
        'Beer at a local brewery such as De Halve Maan, and Belgian chocolate.',
        'Ghent is only 25 minutes away by train.',
      ) },
    ],
    stadiums: {
      'Jan Breydel Stadium': {
        gettingThere: bullets(
          'Bus 3 to Diksmuidse Heirweg, the nearest stop.',
          'A fan shuttle from the centre often runs on matchdays.',
        ),
        awayFans: 'South-east corner – entrance 4, turnstiles 421–422. There may be extra netting in front.',
      },
    },
    sources: ['https://footballgroundguide.com/news/club-brugge-away-section.html'],
  },
  // ---------------------------------------------------------------- Netherlands
  {
    city: 'Rotterdam',
    countryCode: 'NL',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Amsterdam Schiphol: direct trains to Rotterdam Centraal in about 25–30 minutes.',
        'Rotterdam The Hague Airport is small, with a bus to Rotterdam Centraal.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Around Rotterdam Centraal and the city centre – tram 23 runs straight to De Kuip.',
        'Witte de Withstraat and the Oude Haven for bars.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Away fans are often taken to a secure drop-off right by the ground.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Markthal, the Cube Houses and the Erasmus Bridge.',
        'The Depot Boijmans art building and the Euromast for views.',
        'Delft and The Hague are both short train rides away.',
      ) },
    ],
    stadiums: {
      'De Kuip': {
        gettingThere: bullets(
          'Tram 23 from Rotterdam Centraal to Stadion Feijenoord, about 20 minutes (tram 29 also runs on matchdays).',
          'Matchday-only trains run to Rotterdam Stadion station, right by the ground.',
        ),
        awayFans: 'Top deck of the Gerard Meijer stand – a steep climb, and the view from the back is restricted.',
      },
    },
    sources: ['https://footballgroundguide.com/leagues/feyenoord-rotterdam-de-kuip.html'],
  },
  {
    city: 'Eindhoven',
    countryCode: 'NL',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Eindhoven Airport: buses to Eindhoven station take about 20 minutes.',
        'From Amsterdam Schiphol, direct trains take about 1 hour 30 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The city centre around Stratumseind (one of the longest bar streets in the Netherlands) – walking distance from the stadium.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Away fans are led into the ground through a separate tunnel.',
        'The away-end stairs are steep – take care celebrating!',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The PSV Museum and the Philips Museum.',
        'Strijp-S, a former Philips industrial site turned design district.',
        'The Van Abbemuseum for modern art.',
      ) },
    ],
    stadiums: {
      'Philips Stadion': {
        gettingThere: bullets('About 10 minutes on foot from Eindhoven station – the ground is in the city centre.'),
        awayFans: 'Upper tier of the north-west corner, reached through a tunnel straight into the away end.',
      },
    },
    sources: ['https://footballgroundguide.com/news/psv-away-section'],
  },
  // ---------------------------------------------------------------- Portugal
  {
    city: 'Porto',
    countryCode: 'PT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Metro line E (violet) runs from the airport to Trindade in the centre, about 30 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Ribeira riverside and around Aliados – the heart of the city, with metro links to the stadium.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'There’s heavy segregation and netting around the away section.',
        'Locals are generally relaxed with respectful visitors.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Port wine cellars in Vila Nova de Gaia, across the Dom Luís I bridge.',
        'The Livraria Lello bookshop and São Bento station’s tiles.',
        'A rabelo boat trip on the Douro.',
      ) },
    ],
    stadiums: {
      'Estádio do Dragão': {
        gettingThere: bullets(
          'Metro lines A, B or E to Estádio do Dragão, right by the ground.',
          'Walking from the centre takes about 45 minutes.',
        ),
        awayFans: 'Upper tier of the north-east corner, gates 19 and 20.',
      },
    },
    sources: ['https://footballgroundguide.com/news/estadio-do-dragao-away-section-guide.html'],
  },
  {
    city: 'Lisbon',
    countryCode: 'PT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Metro red line from the airport (Aeroporto), changing at Alameda or São Sebastião – about 25 minutes to the centre.',
        'The stadium is close to the airport – about 15 minutes by taxi.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Baixa, Chiado and Bairro Alto – the centre, with lots of bars.',
        'Alfama for the old town and its views.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Lisbon’s hills and cobbles are hard work – wear comfortable shoes.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Tram 28 through Alfama and São Jorge Castle.',
        'Belém: the tower, the Jerónimos Monastery and pastéis de nata.',
        'A day trip to Sintra’s palaces.',
      ) },
    ],
    stadiums: {
      'Estádio José Alvalade': {
        gettingThere: bullets(
          'Metro green or yellow line to Campo Grande, just outside the stadium.',
          'The ground is about 7 km from the centre.',
        ),
        awayFans: 'Usually the South Stand.',
      },
    },
    sources: ['https://footballgroundguide.com/sporting-cp-away-section-guide'],
  },
  // ---------------------------------------------------------------- Rest of Europe
  {
    city: 'Athens',
    countryCode: 'GR',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Metro line 3 (blue) runs from the airport to Syntagma, about 40 minutes.',
        'The X95 bus runs 24 hours to Syntagma (about an hour, more in traffic).',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Plaka, Monastiraki and Syntagma – central, lively and close to where away fans usually meet.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'No alcohol in Greek stadiums – only alcohol-free beer is sold inside.',
        'Tickets are often collected in person with matching photo ID (passport or driving licence).',
        'Very small bags only, and no power banks.',
        'Watch for pickpockets in the centre.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Acropolis and the Acropolis Museum.',
        'The Ancient Agora and the Plaka streets below.',
        'Sunset from Lycabettus Hill.',
        'A day at the coast at Sounion or a ferry to Aegina.',
      ) },
    ],
    stadiums: {
      'OPAP Arena': {
        gettingThere: bullets(
          'For European games, away fans are usually taken by shuttle buses from a meeting point in the centre (recently outside the Panathenaic Stadium) – about an hour through traffic.',
          'Tickets are checked and searched before boarding.',
        ),
        awayFans: 'Usually blocks 46–48 – two upper-tier blocks and one lower.',
      },
    },
    sources: ['https://www.brightonandhovealbion.com/news/3742662/updated-important-information-for-travelling-to-aek-athens/'],
  },
  {
    city: 'Linz',
    countryCode: 'AT',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Linz has a small airport with buses to the Hauptbahnhof.',
        'Most fans fly to Vienna (about 1 hour 15 minutes by train from Vienna Hbf) or Salzburg (about an hour by train).',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The old town around the Hauptplatz – pubs, restaurants and matchday shuttles from nearby Taubenmarkt.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Match tickets have included free Linz public transport on the day.',
        'There are few pubs near the ground – drink in the centre first.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The Ars Electronica Center and the Lentos art museum on the Danube.',
        'The Pöstlingberg tram up to the hilltop church.',
        'A day trip to Salzburg or along the Danube to the Wachau valley.',
      ) },
    ],
    stadiums: {
      'Raiffeisen Arena': {
        gettingThere: bullets(
          'Buses 17, 19, 45a or 46 from the Hauptbahnhof to “Stadion”, about 5–7 minutes.',
          'Matchday football shuttles run from Taubenmarkt in the centre.',
          'Walking: 15–20 minutes uphill from the Hauptbahnhof, or about 30 minutes from the Hauptplatz.',
        ),
        awayFans: 'Entrance E6 – an all-seated section.',
      },
    },
    sources: ['https://footballgroundguide.com/leagues/lask-linz-raiffeisen-arena.html'],
  },
  {
    city: 'Bratislava',
    countryCode: 'SK',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Bratislava Airport: bus 61 to the main railway station, about 25 minutes.',
        'Vienna Airport is often cheaper to fly into – direct coaches reach Bratislava in about an hour.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The compact Old Town (Staré Mesto) – bars, restaurants, and about 30 minutes’ walk or a short tram ride to the stadium.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Your match ticket has covered public transport from three hours before kick-off to two hours after.',
        'Use an app taxi (Bolt) rather than the cabs waiting at the main station.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Bratislava Castle and St Martin’s Cathedral.',
        'The UFO bridge observation deck.',
        'Devín Castle on the Danube, and Vienna is an hour away.',
      ) },
    ],
    stadiums: {
      'Tehelné pole': {
        gettingThere: bullets(
          'Tram 4 to Nová Doba, right by the stadium.',
          'Many buses stop nearby (Nová Doba, Bajkalská, Zimný štadión).',
          'About 30 minutes on foot from the Old Town.',
        ),
        awayFans: 'Your club confirms the away sector.',
      },
    },
    sources: ['https://spectator.sme.sk/sport/c/ready-for-champions-league-action-in-bratislava-heres-how-to-make-the-most-of-it'],
  },
  {
    city: 'Prague',
    countryCode: 'CZ',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'Bus to Nádraží Veleslavín, then metro line A into the centre – about 30–40 minutes in total.',
        'The Airport Express bus runs to the main railway station.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Old Town and New Town (Wenceslas Square) for bars and sights.',
        'Vinohrady and Vršovice, closer to the stadium, for local pubs.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'No big bags, bottles or laptops; there’s paid left-luggage at the stadium.',
        'Have your ticket ready in the format the club asks for (some games have required printed tickets).',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Prague Castle and the Charles Bridge – early morning is quietest.',
        'The Old Town Square and its Astronomical Clock.',
        'Czech beer at a traditional pub, or a brewery tour.',
      ) },
    ],
    stadiums: {
      'Fortuna Arena': {
        gettingThere: bullets(
          'Trams 6, 7, 22 or 24 to “Slavia”, about two minutes away.',
          'Train S9 to Praha-Eden, next to the stadium, about 8 minutes from the centre.',
          'Metro A to Želivského or Strašnická, then about 20 minutes on foot.',
        ),
        awayFans: 'Your club confirms the away sector and entrance.',
      },
    },
    sources: [
      'https://www.slavia.cz/eng/how-to-get-to-fortuna-arena',
      'https://www.slavia.cz/eng/article/information-for-union-berlin-game-in-prague-30905',
    ],
  },
  {
    city: 'Stavanger',
    countryCode: 'NO',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'The Flybussen airport bus runs from Sola to the centre in about 30 minutes.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The centre around the harbour (Vågen) and the old town – the train to the stadium takes about 8 minutes.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'Norway is expensive – especially beer.',
        'Dress for wind and rain.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Hike to Preikestolen (Pulpit Rock) – a full day out.',
        'A Lysefjord cruise.',
        'Gamle Stavanger’s white wooden houses and the Norwegian Petroleum Museum.',
      ) },
    ],
    stadiums: {
      'SR-Bank Arena': {
        gettingThere: bullets('Train to Jåttåvågen station, right outside the stadium – about 8 minutes from the centre.'),
        awayFans: 'Your club confirms the away section.',
      },
    },
    sources: ['https://vikingfotball.no/om-klubben/engelsk/the-stadium'],
  },
  {
    city: 'Bodø',
    countryCode: 'NO',
    sections: [
      { type: 'to-centre', title: 'Getting there', content: bullets(
        'Fly to Bodø, usually via Oslo. The airport is right next to town – 10–15 minutes’ walk to most hotels and the stadium.',
        'Bus 1 links the airport, centre and stadium.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'Everything is in the small town centre, all within walking distance of the ground.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'No alcohol is sold at the ground under Norwegian rules.',
        'The away section is uncovered safe standing: bring waterproofs and warm layers – umbrellas aren’t allowed.',
        'Small bags only (A4).',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'Saltstraumen, one of the world’s strongest tidal currents, half an hour away.',
        'The Norwegian Aviation Museum.',
        'The northern lights, on clear winter nights.',
      ) },
    ],
    stadiums: {
      'Aspmyra Stadion': {
        gettingThere: bullets('In the town centre – walk. The away pub is about 15 minutes away, and police recommend the route along Torvgata.'),
        awayFans: 'Section C of the Havet stand, behind a goal – uncovered safe standing.',
      },
    },
    sources: [
      'https://www.tottenhamhotspur.com/news/1000328/information-for-fans-travelling-to-bodoglimt',
      'https://footballgroundguide.com/leagues/europe-1/bodo-glimt-aspmyra-stadion.html',
    ],
  },
  {
    city: 'Baku',
    countryCode: 'AZ',
    sections: [
      { type: 'to-centre', title: 'Airport to the city centre', content: bullets(
        'The airport express bus runs to the centre (28 May station) in about 30–40 minutes. Taxis are plentiful – agree the fare or use an app.',
        'Most visitors need an e-visa – apply online well before you travel.',
      ) },
      { type: 'areas', title: 'Best areas for fans', content: bullets(
        'The Old City (İçərişəhər) and around Fountains Square and the seafront boulevard.',
      ) },
      { type: 'tips', title: 'Matchday tips', content: bullets(
        'The stadium café is alcohol-free.',
        'European games here usually kick off late local time; the metro runs after the match.',
        'Traffic after the game is heavy – the metro is quicker than a taxi.',
        CHECK_CLUB,
      ) },
      { type: 'things-to-do', title: 'If you’re staying a few days', content: bullets(
        'The walled Old City, the Maiden Tower and the Palace of the Shirvanshahs.',
        'The Flame Towers and the Heydar Aliyev Center.',
        'Gobustan’s rock art and mud volcanoes, about an hour away.',
      ) },
    ],
    stadiums: {
      'Baku Olympic Stadium': {
        gettingThere: bullets(
          'Metro to Koroğlu (red or green line), about 20 minutes from the centre, then a 10–15-minute walk.',
          'Taxis are cheap, but traffic is heavy before and after the game.',
        ),
        awayFans: 'Usually sectors 307–309. Sabah play their European home games here rather than at their own ground.',
      },
    },
    sources: ['https://liberoguide.com/baku-olympic-stadium/', 'https://footballgroundguide.com/news/the-longest-champions-league-away-days-in-2026-27-season-ranked.html'],
  },
]
