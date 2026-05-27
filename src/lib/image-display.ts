/**
 * Helpers for displaying user-uploaded files from public/uploads/.
 * Local paths must bypass next/image optimization (see Hero.tsx).
 */

export function isLocalUploadPath(src: string): boolean {
  return src.startsWith('/uploads/')
}

/** Use with next/image `unoptimized` for local uploads and SVGs. */
export function shouldBypassImageOptimization(src: string): boolean {
  if (!src) return false
  if (isLocalUploadPath(src)) return true
  const pathOnly = src.split('?')[0] ?? src
  return /\.svg$/i.test(pathOnly)
}

/**
 * Stored values may be absolute site URLs; next/image serves local uploads reliably as paths.
 */
export function normalizeUploadSrc(src: string): string {
  const trimmed = src.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('/uploads/')) return trimmed
  try {
    const parsed = new URL(trimmed)
    if (parsed.pathname.startsWith('/uploads/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    // relative or invalid — use as-is
  }
  return trimmed
}
