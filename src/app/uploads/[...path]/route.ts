import { createReadStream } from 'fs'
import { stat } from 'fs/promises'
import path from 'path'
import { Readable } from 'stream'
import { NextRequest, NextResponse } from 'next/server'
import { resolveUploadPath } from '@/lib/upload-local'

/**
 * Serves uploaded media from UPLOADS_DIR (outside the deploy root in production) at the same
 * /uploads/... URLs already stored in the DB. If public/uploads still exists, Next serves those
 * files first and this route only sees what is missing there.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.caf': 'audio/x-caf',
  '.wav': 'audio/wav',
  '.webm': 'audio/webm',
  '.ogg': 'audio/ogg',
  '.mp4': 'video/mp4',
}

async function serve(req: NextRequest, segments: string[], headOnly: boolean) {
  const filepath = resolveUploadPath(segments.join('/'))
  const contentType = filepath ? CONTENT_TYPES[path.extname(filepath).toLowerCase()] : undefined
  if (!filepath || !contentType) {
    return new NextResponse('Not found', { status: 404 })
  }

  let size: number
  try {
    const info = await stat(filepath)
    if (!info.isFile()) throw new Error('not a file')
    size = info.size
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }

  const headers = new Headers({
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    // Upload filenames are unique (timestamp + random / Cloudinary ids), so files never change in place.
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
  // Uploaded SVGs are same-origin: never let them run script.
  if (contentType === 'image/svg+xml') {
    headers.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'; sandbox")
  }

  // Range support so scripture audio and video can seek.
  let start = 0
  let end = size - 1
  let status = 200
  const range = req.headers.get('range')
  const match = range?.match(/^bytes=(\d*)-(\d*)$/)
  if (match && (match[1] || match[2])) {
    if (match[1]) {
      start = Number(match[1])
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1
    } else {
      start = Math.max(size - Number(match[2]), 0)
    }
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
    }
    status = 206
    headers.set('Content-Range', `bytes ${start}-${end}/${size}`)
  }
  headers.set('Content-Length', String(end - start + 1))

  if (headOnly) return new NextResponse(null, { status, headers })

  const stream = Readable.toWeb(createReadStream(filepath, { start, end })) as ReadableStream
  return new NextResponse(stream, { status, headers })
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return serve(req, params.path, false)
}

export async function HEAD(req: NextRequest, { params }: { params: { path: string[] } }) {
  return serve(req, params.path, true)
}
