import { citySchema } from '../src/admin/schemas'

/** The photo would also pass the admin form's validation (https URL, credit ≤ 200 chars). */
export function photoSchemaCheck(p: { url: string; credit: string }) {
  return citySchema.safeParse({
    name: 'X',
    countryCode: 'GB',
    currency: 'GBP',
    language: 'English',
    timezone: 'Europe/London',
    lat: 0,
    lng: 0,
    photoUrl: p.url,
    photoCredit: p.credit,
  }).success
}
