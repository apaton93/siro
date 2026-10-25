import { userAvatars } from '@siro/db'
import { AVATAR } from '@siro/shared'
import { eq } from 'drizzle-orm'
import jpeg from 'jpeg-js'
import type { Db } from '../db'

/** Public URL for a fan's photo. The version makes it safe to cache forever. */
export const avatarUrl = (userId: string, updatedAt: Date | string | null) =>
  updatedAt ? `/api/avatars/${userId}?v=${new Date(updatedAt).getTime()}` : null

/**
 * Check an uploaded photo and re-encode it. Only square JPEGs of AVATAR.size are accepted
 * (the app makes these in the browser). Re-encoding drops all metadata, e.g. GPS from phones.
 */
export function processAvatar(input: Buffer): { jpeg: Buffer } | { error: string } {
  if (input.length === 0) return { error: 'No image received' }
  if (input.length > AVATAR.maxBytes) return { error: 'That image is too big' }
  if (input[0] !== 0xff || input[1] !== 0xd8) return { error: 'Photos must be JPEGs' }

  let decoded: { width: number; height: number; data: Uint8Array }
  try {
    decoded = jpeg.decode(input, { useTArray: true, maxResolutionInMP: 1, maxMemoryUsageInMB: 16 })
  } catch {
    return { error: 'That image couldn’t be read' }
  }
  if (decoded.width !== AVATAR.size || decoded.height !== AVATAR.size) {
    return { error: `Photos must be ${AVATAR.size}×${AVATAR.size}` }
  }
  // Pass only the pixels – jpeg-js would otherwise copy the original EXIF (and any GPS) across.
  const pixels = { width: decoded.width, height: decoded.height, data: Buffer.from(decoded.data) }
  return { jpeg: Buffer.from(jpeg.encode(pixels, 85).data) }
}

export async function saveAvatar(db: Db, userId: string, image: Buffer): Promise<void> {
  const updatedAt = new Date()
  await db
    .insert(userAvatars)
    .values({ userId, image, updatedAt })
    .onConflictDoUpdate({ target: userAvatars.userId, set: { image, updatedAt } })
}

/** Returns true if there was a photo to remove. */
export async function deleteAvatar(db: Db, userId: string): Promise<boolean> {
  const rows = await db.delete(userAvatars).where(eq(userAvatars.userId, userId)).returning({ id: userAvatars.userId })
  return rows.length > 0
}

export async function getAvatar(db: Db, userId: string): Promise<Buffer | null> {
  const [row] = await db.select({ image: userAvatars.image }).from(userAvatars).where(eq(userAvatars.userId, userId))
  return row ? Buffer.from(row.image) : null
}
