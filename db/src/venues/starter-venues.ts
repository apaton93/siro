import type { CITIES } from '../ucl/ucl-2026-27'

/**
 * Starter pubs and bars per city, from away-fan guides (sourceUrl on each). Locations from
 * OpenStreetMap via Nominatim – a few are to the street address rather than the venue itself.
 * Imported as approved by `npm run db:import-venues`; fans add more via "Suggest a place".
 */
export interface StarterVenue {
  city: keyof typeof CITIES
  name: string
  type: 'pub' | 'restaurant' | 'other'
  awayFriendly: boolean
  notes: string | null
  lat: number
  lng: number
  sourceUrl: string
}

export const STARTER_VENUES: StarterVenue[] = [
  { city: 'bodo', name: 'Hundholmen Brygghus', type: 'pub', awayFriendly: true, notes: "Brewpub in the centre – the usual away fans' pub.", lat: 67.284773, lng: 14.378068, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-bodo.html' },
  { city: 'bodo', name: 'Piccadilly Pub', type: 'pub', awayFriendly: true, notes: null, lat: 67.282874, lng: 14.376754, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-bodo.html' },
  { city: 'bodo', name: 'Norlænningen', type: 'pub', awayFriendly: true, notes: null, lat: 67.283893, lng: 14.380957, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-bodo.html' },
  { city: 'bruges', name: "'t Brugs Beertje", type: 'pub', awayFriendly: true, notes: 'Classic Belgian beer bar in the centre, about 4 km from the ground.', lat: 51.206849, lng: 3.221697, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-brugge.html' },
  { city: 'bruges', name: 'De Garre', type: 'pub', awayFriendly: true, notes: 'Tiny beer bar down an alley off the Markt.', lat: 51.208327, lng: 3.225871, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-brugge.html' },
  { city: 'porto', name: "Ryan's Irish Bar", type: 'pub', awayFriendly: true, notes: null, lat: 41.14153, lng: -8.613915, sourceUrl: 'https://footballgroundguide.com/news/porto-city-guide.html' },
  { city: 'porto', name: "St. Oliver's", type: 'pub', awayFriendly: true, notes: null, lat: 41.146319, lng: -8.604822, sourceUrl: 'https://footballgroundguide.com/news/porto-city-guide.html' },
  { city: 'porto', name: 'Bonaparte Downtown', type: 'pub', awayFriendly: true, notes: null, lat: 41.147556, lng: -8.614582, sourceUrl: 'https://footballgroundguide.com/news/porto-city-guide.html' },
  { city: 'naples', name: 'The Penny Black', type: 'pub', awayFriendly: true, notes: 'English-style pub in Vomero with live sport – arrive early.', lat: 40.846369, lng: 14.230286, sourceUrl: 'https://footballgroundguide.com/news/where-to-eat-and-drink-in-napoli-best-pubs-and-restaurants-for-away-fans.html' },
  { city: 'naples', name: "Murphy's Law", type: 'pub', awayFriendly: true, notes: 'Irish pub in Vomero with sport and food.', lat: 40.844891, lng: 14.22801, sourceUrl: 'https://footballgroundguide.com/news/where-to-eat-and-drink-in-napoli-best-pubs-and-restaurants-for-away-fans.html' },
  { city: 'naples', name: 'Frank Malone Pub', type: 'pub', awayFriendly: true, notes: null, lat: 40.845953, lng: 14.237306, sourceUrl: 'https://footballgroundguide.com/news/where-to-eat-and-drink-in-napoli-best-pubs-and-restaurants-for-away-fans.html' },
  { city: 'naples', name: 'Kitebeer', type: 'pub', awayFriendly: false, notes: 'Craft beer bar in the historic centre.', lat: 40.842114, lng: 14.251874, sourceUrl: 'https://footballgroundguide.com/news/where-to-eat-and-drink-in-napoli-best-pubs-and-restaurants-for-away-fans.html' },
  { city: 'linz', name: 'Old Dubliner Sports Pub', type: 'pub', awayFriendly: true, notes: null, lat: 48.305357, lng: 14.285583, sourceUrl: 'https://footballgroundguide.com/news/linz-city-guide.html' },
  { city: 'linz', name: 'Chelsea Pub', type: 'pub', awayFriendly: true, notes: null, lat: 48.304778, lng: 14.288022, sourceUrl: 'https://footballgroundguide.com/news/linz-city-guide.html' },
  { city: 'linz', name: 'Rox Musicbar & Grill', type: 'pub', awayFriendly: true, notes: null, lat: 48.243967, lng: 14.235249, sourceUrl: 'https://footballgroundguide.com/news/linz-city-guide.html' },
  { city: 'linz', name: 'Remembar', type: 'pub', awayFriendly: true, notes: null, lat: 48.302904, lng: 14.290271, sourceUrl: 'https://footballgroundguide.com/news/linz-city-guide.html' },
  { city: 'villarreal', name: '1800 Cocktail Bar', type: 'pub', awayFriendly: true, notes: null, lat: 39.936629, lng: -0.098839, sourceUrl: 'https://footballgroundguide.com/away-fans-guide-to-Villarreal' },
  { city: 'villarreal', name: 'Vila-Beer Irish Bar', type: 'pub', awayFriendly: true, notes: null, lat: 39.931237, lng: -0.105976, sourceUrl: 'https://footballgroundguide.com/away-fans-guide-to-Villarreal' },
  { city: 'villarreal', name: 'Bar el Belga', type: 'pub', awayFriendly: true, notes: null, lat: 39.942413, lng: -0.103095, sourceUrl: 'https://footballgroundguide.com/away-fans-guide-to-Villarreal' },
  { city: 'madrid', name: 'James Joyce Irish Pub', type: 'pub', awayFriendly: true, notes: "Keep colours covered until you're at the stadium.", lat: 40.419907, lng: -3.691362, sourceUrl: 'https://footballgroundguide.com/news/away-fans-matchday-guide-to-madrid' },
  { city: 'madrid', name: 'Luckia Sport Cafe', type: 'pub', awayFriendly: true, notes: null, lat: 40.436671, lng: -3.641139, sourceUrl: 'https://footballgroundguide.com/news/away-fans-matchday-guide-to-madrid' },
  { city: 'madrid', name: 'The Irish Rover', type: 'pub', awayFriendly: true, notes: 'Near the Bernabéu.', lat: 40.454725, lng: -3.693984, sourceUrl: 'https://footballgroundguide.com/news/away-fans-matchday-guide-to-madrid' },
  { city: 'istanbul', name: 'James Joyce Irish Pub', type: 'pub', awayFriendly: true, notes: "The city's original Irish pub, in Beyoğlu.", lat: 41.035069, lng: 28.978451, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-istanbul-best-places-for-fans-to-eat-and-drink.html' },
  { city: 'istanbul', name: 'Corner Irish Pub', type: 'pub', awayFriendly: true, notes: 'Plenty of screens and fair prices for the area.', lat: 41.033842, lng: 28.976707, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-istanbul-best-places-for-fans-to-eat-and-drink.html' },
  { city: 'istanbul', name: 'Red River Pub', type: 'pub', awayFriendly: true, notes: null, lat: 41.013484, lng: 28.977452, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-istanbul-best-places-for-fans-to-eat-and-drink.html' },
  { city: 'munich', name: "Kennedy's", type: 'pub', awayFriendly: true, notes: null, lat: 48.134067, lng: 11.567179, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-munich' },
  { city: 'munich', name: 'Le Clou', type: 'pub', awayFriendly: true, notes: null, lat: 48.135908, lng: 11.577665, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-munich' },
  { city: 'munich', name: "Ned Kelly's Australian Bar", type: 'pub', awayFriendly: true, notes: null, lat: 48.138731, lng: 11.574664, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-munich' },
  { city: 'paris', name: 'The Auld Alliance', type: 'pub', awayFriendly: true, notes: null, lat: 48.855314, lng: 2.359106, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-paris.html' },
  { city: 'paris', name: 'The French Flair', type: 'pub', awayFriendly: true, notes: null, lat: 48.884076, lng: 2.330537, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-paris.html' },
  { city: 'paris', name: 'Frog XVI', type: 'pub', awayFriendly: true, notes: 'Closest of these to the Parc des Princes.', lat: 48.864689, lng: 2.288099, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-paris.html' },
  { city: 'lisbon', name: 'The Royal Vessel', type: 'pub', awayFriendly: true, notes: null, lat: 38.714405, lng: -9.149769, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-lisbon.html' },
  { city: 'lisbon', name: 'Delirium Café', type: 'pub', awayFriendly: true, notes: null, lat: 38.710337, lng: -9.139597, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-lisbon.html' },
  { city: 'lisbon', name: "O'Gilins", type: 'pub', awayFriendly: true, notes: null, lat: 38.706955, lng: -9.143864, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-lisbon.html' },
  { city: 'como', name: 'Il Birrivico', type: 'pub', awayFriendly: true, notes: 'Relaxed pub with a big beer list, popular with local fans.', lat: 45.810931, lng: 9.072496, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-como' },
  { city: 'como', name: 'Enoteca Da Gigi', type: 'pub', awayFriendly: false, notes: 'Long-running wine bar in the old town – good for aperitivo.', lat: 45.809831, lng: 9.083378, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-como' },
  { city: 'como', name: 'La Griglia di Como', type: 'restaurant', awayFriendly: false, notes: 'Reasonably priced pizza and pasta.', lat: 45.812528, lng: 9.085297, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-como' },
  { city: 'milan', name: 'Old Tenconi Pub', type: 'pub', awayFriendly: true, notes: 'Near San Siro.', lat: 45.479266, lng: 9.117402, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-milan.html' },
  { city: 'milan', name: 'English Football Pub', type: 'pub', awayFriendly: true, notes: null, lat: 45.462042, lng: 9.18539, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-milan.html' },
  { city: 'milan', name: "Pub O'Connell", type: 'pub', awayFriendly: true, notes: null, lat: 45.469679, lng: 9.187945, sourceUrl: 'https://footballgroundguide.com/news/away-fans-guide-to-milan.html' },
  { city: 'dortmund', name: "Miner's Irish Pub", type: 'pub', awayFriendly: true, notes: null, lat: 51.505312, lng: 7.452735, sourceUrl: 'https://footballgroundguide.com/news/celtic-fans-in-dortmund' },
  { city: 'dortmund', name: 'Gänsemarkt', type: 'pub', awayFriendly: true, notes: null, lat: 51.514003, lng: 7.467148, sourceUrl: 'https://footballgroundguide.com/news/celtic-fans-in-dortmund' },
  { city: 'prague', name: 'Londoners Sports Bar', type: 'pub', awayFriendly: true, notes: 'British-style pub, screens on two floors. No reservations.', lat: 50.077755, lng: 14.424773, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-prague.html' },
  { city: 'prague', name: "Rocky O'Reilly's Irish Pub", type: 'pub', awayFriendly: true, notes: 'Big screens, food all day; takes group bookings.', lat: 50.079522, lng: 14.426027, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-prague.html' },
  { city: 'prague', name: "McCarthy's Irish Pub", type: 'pub', awayFriendly: true, notes: 'Shows Premier League and Champions League on two floors.', lat: 50.084278, lng: 14.421649, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-prague.html' },
  { city: 'prague', name: 'U Glaubiců', type: 'restaurant', awayFriendly: false, notes: 'Traditional Czech pub-restaurant – better for a meal than the match.', lat: 50.087619, lng: 14.403493, sourceUrl: 'https://footballgroundguide.com/news/pubs-in-prague.html' },
  { city: 'athens', name: 'Athens Sports Bar', type: 'pub', awayFriendly: true, notes: null, lat: 37.967194, lng: 23.728579, sourceUrl: 'https://footballgroundguide.com/news/chelsea-fans-in-athenes-full-matchday-guide-to-athens-olympic-stadium.html' },
  { city: 'athens', name: 'The James Joyce Irish Pub', type: 'pub', awayFriendly: true, notes: null, lat: 37.97686, lng: 23.722684, sourceUrl: 'https://footballgroundguide.com/news/chelsea-fans-in-athenes-full-matchday-guide-to-athens-olympic-stadium.html' },
  { city: 'athens', name: 'Red Lion Pub', type: 'pub', awayFriendly: true, notes: null, lat: 37.974503, lng: 23.749966, sourceUrl: 'https://footballgroundguide.com/news/chelsea-fans-in-athenes-full-matchday-guide-to-athens-olympic-stadium.html' },
  { city: 'rome', name: 'Open Baladin', type: 'pub', awayFriendly: true, notes: '30+ craft beers, mostly local; serves food.', lat: 41.893572, lng: 12.474438, sourceUrl: 'https://footballgroundguide.com/news/celtic-fans-in-rome-stadio-olimpico.html' },
  { city: 'rome', name: 'La Botticella', type: 'pub', awayFriendly: true, notes: 'Small centro storico bar with indoor and outdoor seating.', lat: 41.899221, lng: 12.471329, sourceUrl: 'https://footballgroundguide.com/news/celtic-fans-in-rome-stadio-olimpico.html' },
  { city: 'rome', name: 'Drink Kong', type: 'pub', awayFriendly: false, notes: 'Cocktail bar near Monti.', lat: 41.895144, lng: 12.497865, sourceUrl: 'https://footballgroundguide.com/news/celtic-fans-in-rome-stadio-olimpico.html' },
]
