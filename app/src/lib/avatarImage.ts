import { AVATAR } from '@siro/shared'

/**
 * Turn any photo the browser can read into the square JPEG the API accepts: centre-cropped,
 * AVATAR.size px, phone rotation applied. Drawing to a canvas also drops all metadata.
 */
export async function makeAvatar(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = AVATAR.size
  const g = canvas.getContext('2d')
  if (!g) throw new Error('Your browser can’t edit images')
  g.imageSmoothingQuality = 'high'
  g.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, AVATAR.size, AVATAR.size)
  bitmap.close()

  for (const quality of [0.85, 0.7, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (blob && blob.size <= AVATAR.maxBytes) return blob
  }
  throw new Error('That photo couldn’t be made small enough')
}
