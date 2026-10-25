import { afterEach, describe, expect, it, vi } from 'vitest'
import { commonsCredit, searchCommons } from './commons'

const page = (title: string, index: number, width: number, height: number, license: string, artist: string) => ({
  title,
  index,
  imageinfo: [
    {
      thumburl: `https://thumb.wikimedia.org/thumb/${index}/1280px-x.jpg?utm_source=commons`,
      descriptionurl: `https://commons.wikimedia.org/wiki/${title}`,
      width,
      height,
      extmetadata: { LicenseShortName: { value: license }, Artist: { value: artist } },
    },
  ],
})

afterEach(() => vi.unstubAllGlobals())

describe('searchCommons', () => {
  it('keeps free, wide, landscape photos in search order with plain-text authors', async () => {
    const pages = {
      a: page('File:Second.jpg', 2, 4000, 2600, 'CC BY-SA 4.0', '<a href="/u">Jane &amp; Co</a>'),
      b: page('File:First.jpg', 1, 3000, 2000, 'CC0', 'Joe'),
      c: page('File:Portrait.jpg', 3, 2000, 3000, 'CC BY 4.0', 'X'),
      d: page('File:Small.jpg', 4, 1200, 800, 'CC BY 4.0', 'X'),
      e: page('File:Fair use.jpg', 5, 4000, 2000, 'Fair use', 'X'),
    }
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ query: { pages } }) })
    vi.stubGlobal('fetch', fetchMock)

    const photos = await searchCommons('Linz')
    expect(photos.map((p) => [p.title, p.author])).toEqual([
      ['First.jpg', 'Joe'],
      ['Second.jpg', 'Jane & Co'],
    ])
    expect(String(fetchMock.mock.calls[0][0])).toContain('origin=*')
    expect(photos[0].thumbUrl).toBe('https://upload.wikimedia.org/thumb/1/1280px-x.jpg')
    expect(commonsCredit(photos[1])).toBe('Jane & Co, CC BY-SA 4.0, via Wikimedia Commons')
  })
})
