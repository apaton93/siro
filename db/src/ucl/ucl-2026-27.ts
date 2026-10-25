/**
 * UEFA Champions League 2026/27 – league phase.
 *
 * Sources (checked 25 Oct 2026):
 * - Fixtures & kickoff times: UEFA league phase calendar (editorial.uefa.com PDF), UEFA.com
 *   "All the league phase fixtures and results", SI.com kickoff list – all three agree.
 * - Results MD1–3: UEFA.com fixtures list and "fixtures and results by team" – agree.
 * - Venue changes: Shakhtar at Stamford Bridge (shakhtar.com, 21 Aug 2026); Sabah at Baku Olympic
 *   Stadium (Bank Respublika Arena doesn't meet UEFA requirements); Real Betis at La Cartuja
 *   (Villamarín being rebuilt).
 * - Fan access: UEFA "Sanctions affecting supporter attendance" (active list, 22 Oct 2026) has no
 *   clubs in this competition; the Feyenoord and Lens ticket restrictions are suspended.
 *
 * Coordinates are stadium/airport/city-centre points to ~100 m. Colours are main kit colours,
 * with a text colour chosen for contrast.
 */

export const COMPETITION = { name: 'UEFA Champions League', code: 'UCL', type: 'club' as const }
export const STAGE = 'League phase'
/** Fixtures in this window belong to this season (used to match existing rows). */
export const SEASON = { from: '2026-07-01T00:00:00Z', to: '2027-07-01T00:00:00Z' }

export interface CityData {
  name: string
  countryCode: string
  currency: string
  language: string
  timezone: string
  lat: number
  lng: number
}

export const CITIES = {
  athens: { name: 'Athens', countryCode: 'GR', currency: 'EUR', language: 'Greek', timezone: 'Europe/Athens', lat: 37.9838, lng: 23.7275 },
  linz: { name: 'Linz', countryCode: 'AT', currency: 'EUR', language: 'German', timezone: 'Europe/Vienna', lat: 48.3069, lng: 14.2858 },
  bruges: { name: 'Bruges', countryCode: 'BE', currency: 'EUR', language: 'Dutch', timezone: 'Europe/Brussels', lat: 51.2093, lng: 3.2247 },
  birmingham: { name: 'Birmingham', countryCode: 'GB', currency: 'GBP', language: 'English', timezone: 'Europe/London', lat: 52.4862, lng: -1.8904 },
  dortmund: { name: 'Dortmund', countryCode: 'DE', currency: 'EUR', language: 'German', timezone: 'Europe/Berlin', lat: 51.5136, lng: 7.4653 },
  villarreal: { name: 'Villarreal', countryCode: 'ES', currency: 'EUR', language: 'Spanish, Valencian', timezone: 'Europe/Madrid', lat: 39.9381, lng: -0.1009 },
  porto: { name: 'Porto', countryCode: 'PT', currency: 'EUR', language: 'Portuguese', timezone: 'Europe/Lisbon', lat: 41.1579, lng: -8.6291 },
  manchester: { name: 'Manchester', countryCode: 'GB', currency: 'GBP', language: 'English', timezone: 'Europe/London', lat: 53.4808, lng: -2.2426 },
  lille: { name: 'Lille', countryCode: 'FR', currency: 'EUR', language: 'French', timezone: 'Europe/Paris', lat: 50.6292, lng: 3.0573 },
  seville: { name: 'Seville', countryCode: 'ES', currency: 'EUR', language: 'Spanish', timezone: 'Europe/Madrid', lat: 37.3891, lng: -5.9845 },
  madrid: { name: 'Madrid', countryCode: 'ES', currency: 'EUR', language: 'Spanish', timezone: 'Europe/Madrid', lat: 40.4168, lng: -3.7038 },
  milan: { name: 'Milan', countryCode: 'IT', currency: 'EUR', language: 'Italian', timezone: 'Europe/Rome', lat: 45.4642, lng: 9.19 },
  barcelona: { name: 'Barcelona', countryCode: 'ES', currency: 'EUR', language: 'Catalan, Spanish', timezone: 'Europe/Madrid', lat: 41.387, lng: 2.1701 },
  rotterdam: { name: 'Rotterdam', countryCode: 'NL', currency: 'EUR', language: 'Dutch', timezone: 'Europe/Amsterdam', lat: 51.9244, lng: 4.4777 },
  stuttgart: { name: 'Stuttgart', countryCode: 'DE', currency: 'EUR', language: 'German', timezone: 'Europe/Berlin', lat: 48.7758, lng: 9.1829 },
  stavanger: { name: 'Stavanger', countryCode: 'NO', currency: 'NOK', language: 'Norwegian', timezone: 'Europe/Oslo', lat: 58.97, lng: 5.7331 },
  liverpool: { name: 'Liverpool', countryCode: 'GB', currency: 'GBP', language: 'English', timezone: 'Europe/London', lat: 53.4084, lng: -2.9916 },
  paris: { name: 'Paris', countryCode: 'FR', currency: 'EUR', language: 'French', timezone: 'Europe/Paris', lat: 48.8566, lng: 2.3522 },
  bratislava: { name: 'Bratislava', countryCode: 'SK', currency: 'EUR', language: 'Slovak', timezone: 'Europe/Bratislava', lat: 48.1486, lng: 17.1077 },
  lisbon: { name: 'Lisbon', countryCode: 'PT', currency: 'EUR', language: 'Portuguese', timezone: 'Europe/Lisbon', lat: 38.7223, lng: -9.1393 },
  istanbul: { name: 'Istanbul', countryCode: 'TR', currency: 'TRY', language: 'Turkish', timezone: 'Europe/Istanbul', lat: 41.0082, lng: 28.9784 },
  naples: { name: 'Naples', countryCode: 'IT', currency: 'EUR', language: 'Italian', timezone: 'Europe/Rome', lat: 40.8518, lng: 14.2681 },
  london: { name: 'London', countryCode: 'GB', currency: 'GBP', language: 'English', timezone: 'Europe/London', lat: 51.5072, lng: -0.1276 },
  rome: { name: 'Rome', countryCode: 'IT', currency: 'EUR', language: 'Italian', timezone: 'Europe/Rome', lat: 41.9028, lng: 12.4964 },
  eindhoven: { name: 'Eindhoven', countryCode: 'NL', currency: 'EUR', language: 'Dutch', timezone: 'Europe/Amsterdam', lat: 51.4416, lng: 5.4697 },
  donetsk: { name: 'Donetsk', countryCode: 'UA', currency: 'UAH', language: 'Ukrainian', timezone: 'Europe/Kyiv', lat: 48.0159, lng: 37.8029 },
  como: { name: 'Como', countryCode: 'IT', currency: 'EUR', language: 'Italian', timezone: 'Europe/Rome', lat: 45.8081, lng: 9.0852 },
  leipzig: { name: 'Leipzig', countryCode: 'DE', currency: 'EUR', language: 'German', timezone: 'Europe/Berlin', lat: 51.3397, lng: 12.3731 },
  munich: { name: 'Munich', countryCode: 'DE', currency: 'EUR', language: 'German', timezone: 'Europe/Berlin', lat: 48.1351, lng: 11.582 },
  bodo: { name: 'Bodø', countryCode: 'NO', currency: 'NOK', language: 'Norwegian', timezone: 'Europe/Oslo', lat: 67.2804, lng: 14.4049 },
  baku: { name: 'Baku', countryCode: 'AZ', currency: 'AZN', language: 'Azerbaijani', timezone: 'Asia/Baku', lat: 40.4093, lng: 49.8671 },
  prague: { name: 'Prague', countryCode: 'CZ', currency: 'CZK', language: 'Czech', timezone: 'Europe/Prague', lat: 50.0755, lng: 14.4378 },
  lens: { name: 'Lens', countryCode: 'FR', currency: 'EUR', language: 'French', timezone: 'Europe/Paris', lat: 50.432, lng: 2.8333 },
} satisfies Record<string, CityData>

export type CityKey = keyof typeof CITIES

export interface StadiumData {
  name: string
  city: CityKey
  capacity: number | null
  lat: number
  lng: number
}

export const STADIUMS = {
  opapArena: { name: 'OPAP Arena', city: 'athens', capacity: 32500, lat: 38.0367, lng: 23.7225 },
  raiffeisenArena: { name: 'Raiffeisen Arena', city: 'linz', capacity: 19080, lat: 48.2946, lng: 14.2828 },
  janBreydel: { name: 'Jan Breydel Stadium', city: 'bruges', capacity: 29042, lat: 51.1933, lng: 3.1806 },
  villaPark: { name: 'Villa Park', city: 'birmingham', capacity: 42640, lat: 52.5092, lng: -1.8848 },
  signalIduna: { name: 'Signal Iduna Park', city: 'dortmund', capacity: 81365, lat: 51.4926, lng: 7.4519 },
  ceramica: { name: 'Estadio de la Cerámica', city: 'villarreal', capacity: 23008, lat: 39.9441, lng: -0.1036 },
  dragao: { name: 'Estádio do Dragão', city: 'porto', capacity: 50033, lat: 41.1618, lng: -8.5838 },
  etihad: { name: 'Etihad Stadium', city: 'manchester', capacity: null, lat: 53.4831, lng: -2.2004 },
  pierreMauroy: { name: 'Stade Pierre-Mauroy', city: 'lille', capacity: 50186, lat: 50.6119, lng: 3.1305 },
  laCartuja: { name: 'Estadio de La Cartuja', city: 'seville', capacity: null, lat: 37.4163, lng: -6.0042 },
  bernabeu: { name: 'Santiago Bernabéu', city: 'madrid', capacity: null, lat: 40.4531, lng: -3.6883 },
  sanSiro: { name: 'San Siro', city: 'milan', capacity: 75817, lat: 45.4781, lng: 9.124 },
  /** Matches the existing seeded stadium by name. */
  campNou: { name: 'Camp Nou', city: 'barcelona', capacity: null, lat: 41.3809, lng: 2.1228 },
  deKuip: { name: 'De Kuip', city: 'rotterdam', capacity: 47500, lat: 51.8939, lng: 4.5231 },
  mhpArena: { name: 'MHPArena', city: 'stuttgart', capacity: 60058, lat: 48.7922, lng: 9.232 },
  vikingStadion: { name: 'SR-Bank Arena', city: 'stavanger', capacity: 15900, lat: 58.9148, lng: 5.7337 },
  anfield: { name: 'Anfield', city: 'liverpool', capacity: 61276, lat: 53.4308, lng: -2.9608 },
  metropolitano: { name: 'Riyadh Air Metropolitano', city: 'madrid', capacity: 70692, lat: 40.4362, lng: -3.5995 },
  parcDesPrinces: { name: 'Parc des Princes', city: 'paris', capacity: 47929, lat: 48.8414, lng: 2.253 },
  tehelnePole: { name: 'Tehelné pole', city: 'bratislava', capacity: 22500, lat: 48.1636, lng: 17.1366 },
  alvalade: { name: 'Estádio José Alvalade', city: 'lisbon', capacity: 50095, lat: 38.7612, lng: -9.1608 },
  ramsPark: { name: 'RAMS Park', city: 'istanbul', capacity: 52223, lat: 41.1034, lng: 28.9907 },
  maradona: { name: 'Stadio Diego Armando Maradona', city: 'naples', capacity: 54726, lat: 40.828, lng: 14.1931 },
  emirates: { name: 'Emirates Stadium', city: 'london', capacity: 60704, lat: 51.5549, lng: -0.1084 },
  saracoglu: { name: 'Şükrü Saracoğlu Stadium', city: 'istanbul', capacity: 47430, lat: 40.9877, lng: 29.0369 },
  olimpico: { name: 'Stadio Olimpico', city: 'rome', capacity: 70634, lat: 41.9341, lng: 12.4547 },
  philips: { name: 'Philips Stadion', city: 'eindhoven', capacity: 35000, lat: 51.4417, lng: 5.4675 },
  stamfordBridge: { name: 'Stamford Bridge', city: 'london', capacity: 40343, lat: 51.4817, lng: -0.191 },
  sinigaglia: { name: 'Stadio Giuseppe Sinigaglia', city: 'como', capacity: 13602, lat: 45.8139, lng: 9.0722 },
  redBullArena: { name: 'Red Bull Arena', city: 'leipzig', capacity: 47069, lat: 51.3458, lng: 12.3483 },
  allianz: { name: 'Allianz Arena', city: 'munich', capacity: 75024, lat: 48.2188, lng: 11.6247 },
  aspmyra: { name: 'Aspmyra Stadion', city: 'bodo', capacity: 8270, lat: 67.2766, lng: 14.3836 },
  oldTrafford: { name: 'Old Trafford', city: 'manchester', capacity: 74197, lat: 53.4631, lng: -2.2913 },
  bakuOlympic: { name: 'Baku Olympic Stadium', city: 'baku', capacity: 68700, lat: 40.43, lng: 49.9197 },
  fortunaArena: { name: 'Fortuna Arena', city: 'prague', capacity: 19370, lat: 50.0675, lng: 14.4714 },
  bollaert: { name: 'Stade Bollaert-Delelis', city: 'lens', capacity: 38223, lat: 50.4329, lng: 2.815 },
} satisfies Record<string, StadiumData>

export type StadiumKey = keyof typeof STADIUMS

export interface TeamData {
  name: string
  shortName: string
  countryCode: string
  city: CityKey
  /** Where they play this competition's home games. */
  stadium: StadiumKey
  primaryColour: string
  onPrimaryColour: string
}

const INK = '#0B0B0C'
const WHITE = '#FFFFFF'

export const TEAMS = {
  AEK: { name: 'AEK Athens', shortName: 'AEK', countryCode: 'GR', city: 'athens', stadium: 'opapArena', primaryColour: '#FFD200', onPrimaryColour: INK },
  LASK: { name: 'LASK', shortName: 'LASK', countryCode: 'AT', city: 'linz', stadium: 'raiffeisenArena', primaryColour: INK, onPrimaryColour: WHITE },
  CLB: { name: 'Club Brugge', shortName: 'CLB', countryCode: 'BE', city: 'bruges', stadium: 'janBreydel', primaryColour: '#0B5CAD', onPrimaryColour: WHITE },
  AVL: { name: 'Aston Villa', shortName: 'AVL', countryCode: 'GB', city: 'birmingham', stadium: 'villaPark', primaryColour: '#670E36', onPrimaryColour: WHITE },
  BVB: { name: 'Borussia Dortmund', shortName: 'BVB', countryCode: 'DE', city: 'dortmund', stadium: 'signalIduna', primaryColour: '#FDE100', onPrimaryColour: INK },
  VIL: { name: 'Villarreal', shortName: 'VIL', countryCode: 'ES', city: 'villarreal', stadium: 'ceramica', primaryColour: '#FFE600', onPrimaryColour: INK },
  POR: { name: 'Porto', shortName: 'POR', countryCode: 'PT', city: 'porto', stadium: 'dragao', primaryColour: '#00428C', onPrimaryColour: WHITE },
  MCI: { name: 'Manchester City', shortName: 'MCI', countryCode: 'GB', city: 'manchester', stadium: 'etihad', primaryColour: '#6CABDD', onPrimaryColour: INK },
  LIL: { name: 'Lille', shortName: 'LIL', countryCode: 'FR', city: 'lille', stadium: 'pierreMauroy', primaryColour: '#E01E13', onPrimaryColour: WHITE },
  BET: { name: 'Real Betis', shortName: 'BET', countryCode: 'ES', city: 'seville', stadium: 'laCartuja', primaryColour: '#00954C', onPrimaryColour: WHITE },
  RMA: { name: 'Real Madrid', shortName: 'RMA', countryCode: 'ES', city: 'madrid', stadium: 'bernabeu', primaryColour: WHITE, onPrimaryColour: INK },
  INT: { name: 'Inter', shortName: 'INT', countryCode: 'IT', city: 'milan', stadium: 'sanSiro', primaryColour: '#0052A5', onPrimaryColour: WHITE },
  /** Matches the existing seeded team by name. */
  BAR: { name: 'Barcelona', shortName: 'BAR', countryCode: 'ES', city: 'barcelona', stadium: 'campNou', primaryColour: '#A50044', onPrimaryColour: WHITE },
  FEY: { name: 'Feyenoord', shortName: 'FEY', countryCode: 'NL', city: 'rotterdam', stadium: 'deKuip', primaryColour: '#E30613', onPrimaryColour: WHITE },
  VFB: { name: 'Stuttgart', shortName: 'VFB', countryCode: 'DE', city: 'stuttgart', stadium: 'mhpArena', primaryColour: '#E32219', onPrimaryColour: WHITE },
  VIK: { name: 'Viking', shortName: 'VIK', countryCode: 'NO', city: 'stavanger', stadium: 'vikingStadion', primaryColour: '#002F6C', onPrimaryColour: WHITE },
  LIV: { name: 'Liverpool', shortName: 'LIV', countryCode: 'GB', city: 'liverpool', stadium: 'anfield', primaryColour: '#C8102E', onPrimaryColour: WHITE },
  ATM: { name: 'Atlético de Madrid', shortName: 'ATM', countryCode: 'ES', city: 'madrid', stadium: 'metropolitano', primaryColour: '#CB3524', onPrimaryColour: WHITE },
  PSG: { name: 'Paris Saint-Germain', shortName: 'PSG', countryCode: 'FR', city: 'paris', stadium: 'parcDesPrinces', primaryColour: '#004170', onPrimaryColour: WHITE },
  SLO: { name: 'Slovan Bratislava', shortName: 'SLO', countryCode: 'SK', city: 'bratislava', stadium: 'tehelnePole', primaryColour: '#4FA7DE', onPrimaryColour: INK },
  SCP: { name: 'Sporting CP', shortName: 'SCP', countryCode: 'PT', city: 'lisbon', stadium: 'alvalade', primaryColour: '#008057', onPrimaryColour: WHITE },
  GAL: { name: 'Galatasaray', shortName: 'GAL', countryCode: 'TR', city: 'istanbul', stadium: 'ramsPark', primaryColour: '#A90432', onPrimaryColour: '#FDB912' },
  NAP: { name: 'Napoli', shortName: 'NAP', countryCode: 'IT', city: 'naples', stadium: 'maradona', primaryColour: '#087FC4', onPrimaryColour: WHITE },
  ARS: { name: 'Arsenal', shortName: 'ARS', countryCode: 'GB', city: 'london', stadium: 'emirates', primaryColour: '#EF0107', onPrimaryColour: WHITE },
  FEN: { name: 'Fenerbahçe', shortName: 'FEN', countryCode: 'TR', city: 'istanbul', stadium: 'saracoglu', primaryColour: '#002D72', onPrimaryColour: '#FFED00' },
  ROM: { name: 'Roma', shortName: 'ROM', countryCode: 'IT', city: 'rome', stadium: 'olimpico', primaryColour: '#8E1F2F', onPrimaryColour: '#F0BC42' },
  PSV: { name: 'PSV Eindhoven', shortName: 'PSV', countryCode: 'NL', city: 'eindhoven', stadium: 'philips', primaryColour: '#ED1C24', onPrimaryColour: WHITE },
  SHA: { name: 'Shakhtar Donetsk', shortName: 'SHA', countryCode: 'UA', city: 'donetsk', stadium: 'stamfordBridge', primaryColour: '#F37021', onPrimaryColour: INK },
  COM: { name: 'Como', shortName: 'COM', countryCode: 'IT', city: 'como', stadium: 'sinigaglia', primaryColour: '#003DA5', onPrimaryColour: WHITE },
  RBL: { name: 'RB Leipzig', shortName: 'RBL', countryCode: 'DE', city: 'leipzig', stadium: 'redBullArena', primaryColour: '#DD0741', onPrimaryColour: WHITE },
  BAY: { name: 'Bayern München', shortName: 'BAY', countryCode: 'DE', city: 'munich', stadium: 'allianz', primaryColour: '#DC052D', onPrimaryColour: WHITE },
  BOD: { name: 'Bodø/Glimt', shortName: 'BOD', countryCode: 'NO', city: 'bodo', stadium: 'aspmyra', primaryColour: '#FFDD00', onPrimaryColour: INK },
  MUN: { name: 'Manchester United', shortName: 'MUN', countryCode: 'GB', city: 'manchester', stadium: 'oldTrafford', primaryColour: '#DA291C', onPrimaryColour: WHITE },
  SAB: { name: 'Sabah', shortName: 'SAB', countryCode: 'AZ', city: 'baku', stadium: 'bakuOlympic', primaryColour: '#0057B8', onPrimaryColour: WHITE },
  SLA: { name: 'Slavia Praha', shortName: 'SLA', countryCode: 'CZ', city: 'prague', stadium: 'fortunaArena', primaryColour: '#D71920', onPrimaryColour: WHITE },
  RCL: { name: 'Lens', shortName: 'RCL', countryCode: 'FR', city: 'lens', stadium: 'bollaert', primaryColour: '#FCD116', onPrimaryColour: INK },
} satisfies Record<string, TeamData>

export type TeamKey = keyof typeof TEAMS

export interface AirportData {
  iata: string
  name: string
  city: CityKey
  lat: number
  lng: number
}

/** Fixture pages list airports within 150 km of the stadium, so these only need to be close. */
export const AIRPORTS: AirportData[] = [
  { iata: 'ATH', name: 'Athens International', city: 'athens', lat: 37.9364, lng: 23.9445 },
  { iata: 'LNZ', name: 'Linz', city: 'linz', lat: 48.2332, lng: 14.1875 },
  { iata: 'SZG', name: 'Salzburg', city: 'linz', lat: 47.7933, lng: 13.0043 },
  { iata: 'OST', name: 'Ostend-Bruges', city: 'bruges', lat: 51.1989, lng: 2.8622 },
  { iata: 'BRU', name: 'Brussels', city: 'bruges', lat: 50.9014, lng: 4.4844 },
  { iata: 'BHX', name: 'Birmingham', city: 'birmingham', lat: 52.4539, lng: -1.748 },
  { iata: 'DTM', name: 'Dortmund', city: 'dortmund', lat: 51.5183, lng: 7.6122 },
  { iata: 'DUS', name: 'Düsseldorf', city: 'dortmund', lat: 51.2895, lng: 6.7668 },
  { iata: 'CDT', name: 'Castellón', city: 'villarreal', lat: 40.2139, lng: 0.0733 },
  { iata: 'VLC', name: 'Valencia', city: 'villarreal', lat: 39.4893, lng: -0.4816 },
  { iata: 'OPO', name: 'Porto', city: 'porto', lat: 41.2481, lng: -8.6814 },
  { iata: 'MAN', name: 'Manchester', city: 'manchester', lat: 53.3537, lng: -2.275 },
  { iata: 'LPL', name: 'Liverpool John Lennon', city: 'liverpool', lat: 53.3336, lng: -2.8497 },
  { iata: 'LIL', name: 'Lille', city: 'lille', lat: 50.5633, lng: 3.0869 },
  { iata: 'SVQ', name: 'Seville', city: 'seville', lat: 37.418, lng: -5.8931 },
  { iata: 'MAD', name: 'Madrid-Barajas', city: 'madrid', lat: 40.4719, lng: -3.5626 },
  { iata: 'MXP', name: 'Milan Malpensa', city: 'milan', lat: 45.6306, lng: 8.7281 },
  { iata: 'LIN', name: 'Milan Linate', city: 'milan', lat: 45.4451, lng: 9.2767 },
  { iata: 'BGY', name: 'Milan Bergamo', city: 'milan', lat: 45.6739, lng: 9.7042 },
  { iata: 'BCN', name: 'Barcelona El Prat', city: 'barcelona', lat: 41.2974, lng: 2.0833 },
  { iata: 'GRO', name: 'Girona-Costa Brava', city: 'barcelona', lat: 41.901, lng: 2.7606 },
  { iata: 'RTM', name: 'Rotterdam The Hague', city: 'rotterdam', lat: 51.9569, lng: 4.4372 },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'rotterdam', lat: 52.3105, lng: 4.7683 },
  { iata: 'EIN', name: 'Eindhoven', city: 'eindhoven', lat: 51.4501, lng: 5.3745 },
  { iata: 'STR', name: 'Stuttgart', city: 'stuttgart', lat: 48.6899, lng: 9.222 },
  { iata: 'SVG', name: 'Stavanger Sola', city: 'stavanger', lat: 58.8767, lng: 5.6378 },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'paris', lat: 49.0097, lng: 2.5479 },
  { iata: 'ORY', name: 'Paris Orly', city: 'paris', lat: 48.7262, lng: 2.3652 },
  { iata: 'BVA', name: 'Paris Beauvais', city: 'paris', lat: 49.4544, lng: 2.1128 },
  { iata: 'BTS', name: 'Bratislava', city: 'bratislava', lat: 48.1702, lng: 17.2127 },
  { iata: 'VIE', name: 'Vienna', city: 'bratislava', lat: 48.1103, lng: 16.5697 },
  { iata: 'LIS', name: 'Lisbon', city: 'lisbon', lat: 38.7742, lng: -9.1342 },
  { iata: 'IST', name: 'Istanbul', city: 'istanbul', lat: 41.2753, lng: 28.7519 },
  { iata: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'istanbul', lat: 40.8986, lng: 29.3092 },
  { iata: 'NAP', name: 'Naples', city: 'naples', lat: 40.886, lng: 14.2908 },
  { iata: 'LHR', name: 'London Heathrow', city: 'london', lat: 51.47, lng: -0.4543 },
  { iata: 'LGW', name: 'London Gatwick', city: 'london', lat: 51.1537, lng: -0.1821 },
  { iata: 'STN', name: 'London Stansted', city: 'london', lat: 51.886, lng: 0.2389 },
  { iata: 'LTN', name: 'London Luton', city: 'london', lat: 51.8747, lng: -0.3683 },
  { iata: 'LCY', name: 'London City', city: 'london', lat: 51.5048, lng: 0.0495 },
  { iata: 'FCO', name: 'Rome Fiumicino', city: 'rome', lat: 41.8003, lng: 12.2389 },
  { iata: 'CIA', name: 'Rome Ciampino', city: 'rome', lat: 41.7994, lng: 12.5949 },
  { iata: 'LEJ', name: 'Leipzig/Halle', city: 'leipzig', lat: 51.4239, lng: 12.2364 },
  { iata: 'MUC', name: 'Munich', city: 'munich', lat: 48.3538, lng: 11.7861 },
  { iata: 'BOO', name: 'Bodø', city: 'bodo', lat: 67.2692, lng: 14.3653 },
  { iata: 'GYD', name: 'Baku Heydar Aliyev', city: 'baku', lat: 40.4675, lng: 50.0467 },
  { iata: 'PRG', name: 'Prague Václav Havel', city: 'prague', lat: 50.1008, lng: 14.26 },
]

/**
 * [date, kickoff (UEFA time = Central European, Europe/Paris), home, away, result if played]
 */
export type FixtureRow = [string, '18:45' | '21:00', TeamKey, TeamKey, string?]

export const FIXTURES: FixtureRow[] = [
  // Matchday 1
  ['2026-09-08', '18:45', 'AEK', 'LASK', '1-0'],
  ['2026-09-08', '18:45', 'CLB', 'AVL', '2-3'],
  ['2026-09-08', '21:00', 'BVB', 'VIL', '3-2'],
  ['2026-09-08', '21:00', 'POR', 'MCI', '0-2'],
  ['2026-09-08', '21:00', 'LIL', 'BET', '2-3'],
  ['2026-09-08', '21:00', 'RMA', 'INT', '2-1'],
  ['2026-09-09', '18:45', 'BAR', 'FEY', '5-1'],
  ['2026-09-09', '18:45', 'VFB', 'VIK', '3-1'],
  ['2026-09-09', '21:00', 'LIV', 'ATM', '2-1'],
  ['2026-09-09', '21:00', 'PSG', 'SLO', '6-1'],
  ['2026-09-09', '21:00', 'SCP', 'GAL', '3-1'],
  ['2026-09-09', '21:00', 'NAP', 'ARS', '0-1'],
  ['2026-09-10', '18:45', 'FEN', 'ROM', '1-1'],
  ['2026-09-10', '18:45', 'PSV', 'SHA', '1-1'],
  ['2026-09-10', '21:00', 'COM', 'RBL', '4-1'],
  ['2026-09-10', '21:00', 'BAY', 'BOD', '5-0'],
  ['2026-09-10', '21:00', 'MUN', 'SAB', '4-0'],
  ['2026-09-10', '21:00', 'SLA', 'RCL', '2-3'],
  // Matchday 2
  ['2026-10-13', '18:45', 'RCL', 'SCP', '0-2'],
  ['2026-10-13', '18:45', 'SAB', 'SLA', '2-0'],
  ['2026-10-13', '21:00', 'ARS', 'LIL', '3-0'],
  ['2026-10-13', '21:00', 'ATM', 'MUN', '2-0'],
  ['2026-10-13', '21:00', 'INT', 'CLB', '3-4'],
  ['2026-10-13', '21:00', 'GAL', 'BAR', '1-4'],
  ['2026-10-13', '21:00', 'RBL', 'PSV', '1-0'],
  ['2026-10-13', '21:00', 'VIK', 'BAY', '3-3'],
  ['2026-10-13', '21:00', 'VIL', 'NAP', '3-1'],
  ['2026-10-14', '18:45', 'FEY', 'COM', '3-2'],
  ['2026-10-14', '18:45', 'LASK', 'LIV', '3-6'],
  ['2026-10-14', '21:00', 'ROM', 'RMA', '3-4'],
  ['2026-10-14', '21:00', 'AVL', 'FEN', '6-0'],
  ['2026-10-14', '21:00', 'SHA', 'AEK', '3-1'],
  ['2026-10-14', '21:00', 'BOD', 'BVB', '1-0'],
  ['2026-10-14', '21:00', 'MCI', 'PSG', '2-4'],
  ['2026-10-14', '21:00', 'BET', 'POR', '3-2'],
  ['2026-10-14', '21:00', 'SLO', 'VFB', '0-3'],
  // Matchday 3
  ['2026-10-20', '18:45', 'FEN', 'SLA', '2-2'],
  ['2026-10-20', '18:45', 'SAB', 'BVB', '1-2'],
  ['2026-10-20', '21:00', 'ROM', 'SLO', '4-0'],
  ['2026-10-20', '21:00', 'POR', 'PSV', '0-1'],
  ['2026-10-20', '21:00', 'LIV', 'VIL', '4-3'],
  ['2026-10-20', '21:00', 'MCI', 'AEK', '5-1'],
  ['2026-10-20', '21:00', 'PSG', 'BAR', '4-2'],
  ['2026-10-20', '21:00', 'NAP', 'BOD', '4-3'],
  ['2026-10-20', '21:00', 'VFB', 'ATM', '1-1'],
  ['2026-10-21', '18:45', 'COM', 'MUN', '4-1'],
  ['2026-10-21', '18:45', 'LIL', 'GAL', '2-4'],
  ['2026-10-21', '21:00', 'AVL', 'VIK', '3-1'],
  ['2026-10-21', '21:00', 'CLB', 'RCL', '3-0'],
  ['2026-10-21', '21:00', 'BAY', 'ARS', '2-2'],
  ['2026-10-21', '21:00', 'INT', 'SHA', '1-0'],
  ['2026-10-21', '21:00', 'RMA', 'RBL', '4-1'],
  ['2026-10-21', '21:00', 'BET', 'FEY', '1-0'],
  ['2026-10-21', '21:00', 'SCP', 'LASK', '2-3'],
  // Matchday 4
  ['2026-11-03', '18:45', 'SHA', 'SCP'],
  ['2026-11-03', '18:45', 'GAL', 'VFB'],
  ['2026-11-03', '21:00', 'ATM', 'BAY'],
  ['2026-11-03', '21:00', 'BAR', 'AVL'],
  ['2026-11-03', '21:00', 'FEY', 'INT'],
  ['2026-11-03', '21:00', 'BOD', 'LIL'],
  ['2026-11-03', '21:00', 'LASK', 'SLO'],
  ['2026-11-03', '21:00', 'MUN', 'ROM'],
  ['2026-11-03', '21:00', 'VIL', 'PSG'],
  ['2026-11-04', '18:45', 'AEK', 'RMA'],
  ['2026-11-04', '18:45', 'FEN', 'LIV'],
  ['2026-11-04', '21:00', 'BVB', 'BET'],
  ['2026-11-04', '21:00', 'POR', 'NAP'],
  ['2026-11-04', '21:00', 'PSV', 'CLB'],
  ['2026-11-04', '21:00', 'RBL', 'MCI'],
  ['2026-11-04', '21:00', 'RCL', 'COM'],
  ['2026-11-04', '21:00', 'SLA', 'ARS'],
  ['2026-11-04', '21:00', 'VIK', 'SAB'],
  // Matchday 5
  ['2026-11-24', '18:45', 'BOD', 'LASK'],
  ['2026-11-24', '18:45', 'GAL', 'AVL'],
  ['2026-11-24', '21:00', 'ARS', 'BVB'],
  ['2026-11-24', '21:00', 'COM', 'AEK'],
  ['2026-11-24', '21:00', 'FEY', 'POR'],
  ['2026-11-24', '21:00', 'MCI', 'NAP'],
  ['2026-11-24', '21:00', 'RBL', 'RCL'],
  ['2026-11-24', '21:00', 'RMA', 'PSV'],
  ['2026-11-24', '21:00', 'SLO', 'BET'],
  ['2026-11-25', '18:45', 'SAB', 'BAR'],
  ['2026-11-25', '18:45', 'SLA', 'VIL'],
  ['2026-11-25', '21:00', 'ATM', 'VIK'],
  ['2026-11-25', '21:00', 'CLB', 'LIV'],
  ['2026-11-25', '21:00', 'INT', 'VFB'],
  ['2026-11-25', '21:00', 'SHA', 'FEN'],
  ['2026-11-25', '21:00', 'LIL', 'BAY'],
  ['2026-11-25', '21:00', 'PSG', 'ROM'],
  ['2026-11-25', '21:00', 'SCP', 'MUN'],
  // Matchday 6
  ['2026-12-08', '18:45', 'VIK', 'FEY'],
  ['2026-12-08', '18:45', 'VIL', 'SAB'],
  ['2026-12-08', '21:00', 'AEK', 'GAL'],
  ['2026-12-08', '21:00', 'ROM', 'SCP'],
  ['2026-12-08', '21:00', 'AVL', 'PSG'],
  ['2026-12-08', '21:00', 'BAR', 'MCI'],
  ['2026-12-08', '21:00', 'BAY', 'SLA'],
  ['2026-12-08', '21:00', 'MUN', 'RBL'],
  ['2026-12-08', '21:00', 'NAP', 'CLB'],
  ['2026-12-09', '18:45', 'BET', 'COM'],
  ['2026-12-09', '18:45', 'SLO', 'SHA'],
  ['2026-12-09', '21:00', 'ARS', 'RMA'],
  ['2026-12-09', '21:00', 'BVB', 'INT'],
  ['2026-12-09', '21:00', 'LASK', 'FEN'],
  ['2026-12-09', '21:00', 'LIV', 'POR'],
  ['2026-12-09', '21:00', 'PSV', 'ATM'],
  ['2026-12-09', '21:00', 'RCL', 'BOD'],
  ['2026-12-09', '21:00', 'VFB', 'LIL'],
  // Matchday 7
  ['2027-01-19', '18:45', 'BOD', 'ATM'],
  ['2027-01-19', '18:45', 'GAL', 'FEY'],
  ['2027-01-19', '21:00', 'AEK', 'ROM'],
  ['2027-01-19', '21:00', 'AVL', 'BVB'],
  ['2027-01-19', '21:00', 'INT', 'LIV'],
  ['2027-01-19', '21:00', 'POR', 'SLA'],
  ['2027-01-19', '21:00', 'LIL', 'SLO'],
  ['2027-01-19', '21:00', 'RMA', 'LASK'],
  ['2027-01-19', '21:00', 'VFB', 'CLB'],
  ['2027-01-20', '18:45', 'FEN', 'VIL'],
  ['2027-01-20', '18:45', 'SAB', 'NAP'],
  ['2027-01-20', '21:00', 'COM', 'PSG'],
  ['2027-01-20', '21:00', 'MUN', 'BAY'],
  ['2027-01-20', '21:00', 'RBL', 'SHA'],
  ['2027-01-20', '21:00', 'RCL', 'MCI'],
  ['2027-01-20', '21:00', 'BET', 'ARS'],
  ['2027-01-20', '21:00', 'SCP', 'BAR'],
  ['2027-01-20', '21:00', 'VIK', 'PSV'],
  // Matchday 8 (all at the same time)
  ['2027-01-27', '21:00', 'ARS', 'SAB'],
  ['2027-01-27', '21:00', 'ROM', 'LIL'],
  ['2027-01-27', '21:00', 'ATM', 'FEN'],
  ['2027-01-27', '21:00', 'BVB', 'AEK'],
  ['2027-01-27', '21:00', 'CLB', 'BOD'],
  ['2027-01-27', '21:00', 'BAY', 'BET'],
  ['2027-01-27', '21:00', 'BAR', 'COM'],
  ['2027-01-27', '21:00', 'SHA', 'RMA'],
  ['2027-01-27', '21:00', 'FEY', 'RBL'],
  ['2027-01-27', '21:00', 'LASK', 'POR'],
  ['2027-01-27', '21:00', 'LIV', 'RCL'],
  ['2027-01-27', '21:00', 'MCI', 'SCP'],
  ['2027-01-27', '21:00', 'PSG', 'GAL'],
  ['2027-01-27', '21:00', 'PSV', 'VFB'],
  ['2027-01-27', '21:00', 'SLA', 'AVL'],
  ['2027-01-27', '21:00', 'NAP', 'VIK'],
  ['2027-01-27', '21:00', 'VIL', 'MUN'],
  ['2027-01-27', '21:00', 'SLO', 'INT'],
]
