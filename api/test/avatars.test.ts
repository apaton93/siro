import { HttpRequest, InvocationContext } from '@azure/functions'
import { fixtures, users } from '@siro/db'
import type { Me, ThreadDetail } from '@siro/shared'
import { eq } from 'drizzle-orm'
import jpeg from 'jpeg-js'
import { beforeAll, describe, expect, it } from 'vitest'
import { encodeClientPrincipal } from '../src/auth'
import { setDbForTests } from '../src/db'
import { avatarRemove } from '../src/functions/admin'
import { avatarGet } from '../src/functions/avatars'
import { threadCreate, threadDetail } from '../src/functions/discussion'
import { avatarDelete, avatarPut, meGet } from '../src/functions/me'
import { createTestDb, type TestDb } from './test-db'

type Fan = { provider: 'github'; userId: string; userDetails: string }
const fan: Fan = { provider: 'github', userId: 'pic-fan', userDetails: 'pic_fan' }
const admin: Fan = { provider: 'github', userId: 'pic-admin', userDetails: 'pic_admin' }
let t: TestDb
const ctx = () => new InvocationContext({ functionName: 'test' })

const image = (w = 256, h = 256) => {
  const data = Buffer.alloc(w * h * 4, 200)
  return Buffer.from(jpeg.encode({ width: w, height: h, data }, 90).data)
}
/** Insert an EXIF (APP1) segment holding fake GPS text right after the JPEG start marker. */
const withExif = (img: Buffer) => {
  const payload = Buffer.concat([Buffer.from('Exif\0\0'), Buffer.from('GPS 55.9533N 3.1883W')])
  const header = Buffer.from([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff])
  return Buffer.concat([img.subarray(0, 2), header, payload, img.subarray(2)])
}

const put = (bytes: Buffer, as: Fan | null = fan) =>
  avatarPut(
    new HttpRequest({
      method: 'PUT',
      url: 'http://localhost/api/me/avatar',
      headers: { 'content-type': 'image/jpeg', ...(as ? { 'x-ms-client-principal': encodeClientPrincipal(as) } : {}) },
      body: { bytes },
    }),
    ctx(),
  )
const get = (userId: string, v?: string) =>
  avatarGet(new HttpRequest({ method: 'GET', url: `http://localhost/api/avatars/${userId}${v ? `?v=${v}` : ''}`, params: { userId } }), ctx())
const asReq = (as: Fan, params: Record<string, string> = {}, body?: unknown) =>
  new HttpRequest({
    method: 'POST',
    url: 'http://localhost/api/x',
    headers: { 'x-ms-client-principal': encodeClientPrincipal(as), ...(body ? { 'content-type': 'application/json' } : {}) },
    params,
    body: body ? { string: JSON.stringify(body) } : undefined,
  })

beforeAll(async () => {
  t = await createTestDb()
  setDbForTests(t.db)
  await meGet(asReq(admin), ctx())
  await t.db.update(users).set({ isAdmin: true }).where(eq(users.authUserId, admin.userId))
})

describe('profile photos', () => {
  let me: Me

  it('starts without a photo', async () => {
    me = (await meGet(asReq(fan), ctx())).jsonBody as Me
    expect(me.avatarUrl).toBeNull()
  })

  it('stores a 256px JPEG, strips metadata and serves it with long caching', async () => {
    const res = await put(withExif(image()))
    expect(res.status).toBe(200)
    me = res.jsonBody as Me
    expect(me.avatarUrl).toMatch(new RegExp(`^/api/avatars/${me.id}\\?v=\\d+$`))

    const served = await get(me.id, me.avatarUrl!.split('v=')[1])
    expect(served.status).toBe(200)
    expect((served.headers as Record<string, string>)['Content-Type']).toBe('image/jpeg')
    expect((served.headers as Record<string, string>)['Cache-Control']).toContain('immutable')
    const bytes = served.body as Buffer
    expect(jpeg.decode(bytes).width).toBe(256)
    expect(bytes.includes(Buffer.from('GPS'))).toBe(false)
    expect(bytes.includes(Buffer.from('Exif'))).toBe(false)
  })

  it('shows the photo next to the fan’s posts', async () => {
    const [{ id: fixtureId }] = await t.db.select({ id: fixtures.id }).from(fixtures)
    const created = await threadCreate(asReq(fan, {}, { fixtureId, category: 'general', title: 'Hello all', body: 'First post' }), ctx())
    const threadId = (created.jsonBody as { id: string }).id
    const detail = (await threadDetail(new HttpRequest({ method: 'GET', url: 'http://localhost/api/x', params: { id: threadId } }), ctx()))
      .jsonBody as ThreadDetail
    expect(detail.posts[0].author.avatarUrl).toBe(me.avatarUrl)
    expect(detail.thread.author.avatarUrl).toBe(me.avatarUrl)
  })

  it.each([
    ['not a JPEG', Buffer.from('\x89PNG\r\n\x1a\nnot really'), /JPEG/],
    ['the wrong size', image(300, 200), /256×256/],
    ['corrupt', Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01]), /couldn’t be read/],
    ['empty', Buffer.alloc(0), /No image/],
    ['too big', Buffer.concat([Buffer.from([0xff, 0xd8]), Buffer.alloc(200_001)]), /too big/],
  ])('rejects an image that is %s', async (_l, bytes, message) => {
    const res = await put(bytes)
    expect(res.status).toBe(400)
    expect((res.jsonBody as { error: string }).error).toMatch(message)
  })

  it('needs sign-in to upload', async () => {
    expect((await put(image(), null)).status).toBe(401)
  })

  it('lets admins remove a photo, and fans remove their own', async () => {
    expect((await avatarRemove(asReq(fan, { id: me.id }), ctx())).status).toBe(403)
    expect((await avatarRemove(asReq(admin, { id: me.id }), ctx())).status).toBe(204)
    expect((await get(me.id)).status).toBe(404)

    await put(image())
    const after = (await avatarDelete(asReq(fan), ctx())).jsonBody as Me
    expect(after.avatarUrl).toBeNull()
  })
})
