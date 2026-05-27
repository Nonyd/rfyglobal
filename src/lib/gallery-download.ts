import { normalizeUploadSrc } from '@/lib/image-display'

export interface GalleryDownloadImage {
  id: string
  url: string
  caption?: string | null
}

export function resolveGalleryFetchUrl(url: string): string {
  const normalized = normalizeUploadSrc(url)
  if (/^https?:\/\//i.test(normalized)) return normalized
  if (normalized.startsWith('/') && typeof window !== 'undefined') {
    return `${window.location.origin}${normalized}`
  }
  return normalized
}

function extensionFromUrl(url: string): string {
  const path = url.split('?')[0] ?? url
  const match = path.match(/\.(jpe?g|png|gif|webp|avif)$/i)
  return match ? match[1]!.toLowerCase() : 'jpg'
}

export function galleryImageFilename(image: GalleryDownloadImage, index?: number): string {
  const ext = extensionFromUrl(image.url)
  let base = image.caption
    ? image.caption
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 60)
    : `rfy-gallery-${image.id.slice(0, 8)}`
  if (!base) base = `rfy-gallery-${image.id.slice(0, 8)}`
  if (index !== undefined) base = `${String(index + 1).padStart(3, '0')}-${base}`
  return `${base}.${ext}`
}

export async function fetchGalleryImageBlob(url: string): Promise<Blob> {
  const res = await fetch(resolveGalleryFetchUrl(url))
  if (!res.ok) throw new Error(`Could not fetch image (${res.status})`)
  return res.blob()
}

export async function downloadGalleryImage(image: GalleryDownloadImage): Promise<void> {
  const blob = await fetchGalleryImageBlob(image.url)
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = galleryImageFilename(image)
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}

export async function downloadGalleryImagesZip(
  images: GalleryDownloadImage[],
  zipName = 'rfy-gallery-photos.zip',
): Promise<void> {
  if (images.length === 0) return

  const JSZip = (await import('jszip')).default
  const zip = new JSZip()
  const usedNames = new Set<string>()

  for (let i = 0; i < images.length; i++) {
    const image = images[i]!
    let name = galleryImageFilename(image, i)
    while (usedNames.has(name)) {
      const parts = name.split('.')
      const ext = parts.pop() ?? 'jpg'
      const stem = parts.join('.')
      name = `${stem}-dup${usedNames.size}.${ext}`
    }
    usedNames.add(name)
    const blob = await fetchGalleryImageBlob(image.url)
    zip.file(name, blob)
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' })
  const objectUrl = URL.createObjectURL(zipBlob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = zipName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(objectUrl)
}
