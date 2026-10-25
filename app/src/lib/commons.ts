/** Wikimedia Commons photo search for the admin city form. */

/** A freely licensed photo from Wikimedia Commons, ready to use with its credit. */
export interface CommonsPhoto {
  title: string
  thumbUrl: string
  pageUrl: string
  author: string
  license: string
  width: number
  height: number
}

const API = 'https://commons.wikimedia.org/w/api.php'
/** Licences that allow reuse with credit. */
const FREE = /^(CC BY(-SA)? [0-9.]+|CC0|Public domain|PD)/i

interface ApiPage {
  title: string
  index?: number
  imageinfo?: {
    thumburl: string
    descriptionurl: string
    width: number
    height: number
    extmetadata?: Record<string, { value?: string }>
  }[]
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Commons metadata is HTML (e.g. a linked author name) – reduce it to plain text. */
const plainText = (htmlText = '') =>
  htmlText
    .replace(/<[^>]*>/g, '')
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) =>
      e[0] === '#' ? String.fromCodePoint(parseInt(e.slice(e[1] === 'x' ? 2 : 1), e[1] === 'x' ? 16 : 10)) : (ENTITIES[e] ?? m),
    )
    .replace(/\s+/g, ' ')
    .trim()

/** Drop tracking parameters and use the long-standing upload.wikimedia.org host for stored URLs. */
export const stableUrl = (url: string) => url.split('?')[0].replace('https://thumb.wikimedia.org/', 'https://upload.wikimedia.org/')

/** Search Commons "Quality images" – landscape, at least 1600px wide, free licences only. */
export async function searchCommons(query: string, signal?: AbortSignal): Promise<CommonsPhoto[]> {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*', // anonymous CORS request
    generator: 'search',
    gsrnamespace: '6',
    gsrlimit: '24',
    gsrsearch: `${query} incategory:Quality_images filetype:bitmap`,
    prop: 'imageinfo',
    iiprop: 'url|size|extmetadata',
    iiurlwidth: '1280',
    iiextmetadatafilter: 'Artist|LicenseShortName',
  })
  const res = await fetch(`${API}?${params}`, { signal })
  if (!res.ok) throw new Error(`Wikimedia search failed (HTTP ${res.status})`)
  const data = (await res.json()) as { query?: { pages?: Record<string, ApiPage> } }

  return Object.values(data.query?.pages ?? {})
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .flatMap((p) => {
      const info = p.imageinfo?.[0]
      if (!info) return []
      const license = plainText(info.extmetadata?.LicenseShortName?.value)
      if (!FREE.test(license) || info.width < 1600 || info.width / info.height < 1.3) return []
      return [
        {
          title: p.title.replace(/^File:/, ''),
          thumbUrl: stableUrl(info.thumburl),
          pageUrl: info.descriptionurl,
          author: plainText(info.extmetadata?.Artist?.value) || 'Unknown',
          license,
          width: info.width,
          height: info.height,
        },
      ]
    })
}

/** Credit in the usual "Author, Licence, via Wikimedia Commons" form (max 200 chars for the API). */
export const commonsCredit = (p: CommonsPhoto) => `${p.author}, ${p.license}, via Wikimedia Commons`.slice(0, 200)
