import { randomBytes } from 'crypto'
import { existsSync } from 'fs'
import { appendFile, mkdir, readdir, rename, stat, unlink, writeFile } from 'fs/promises'
import path from 'path'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { logActivity } from '@/lib/activity'
import { UPLOADS_DIR, UPLOAD_FOLDER_SUBDIRS } from '@/lib/upload-local'
import {
  AUDIO_CHUNK_BYTES,
  AUDIO_MAX_BYTES,
  AUDIO_TYPES,
  audioExtension,
  audioSlug,
  isValidUploadId,
  titleFromFileName,
} from '@/lib/audio-media'

/**
 * Chunked audio upload for Admin → Media. The browser sends the file in AUDIO_CHUNK_BYTES pieces
 * (multipart, in order), so large recordings get past Cloudflare's per-request cap and ModSecurity's
 * body limit. Pieces are appended to `<UPLOAD_DIR>/media/audio/.partial/<uploadId><ext>` (dot folder,
 * so the /uploads route never serves it); the last piece moves the file into place and creates the
 * AudioTrack row.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SUBDIR = UPLOAD_FOLDER_SUBDIRS.mediaAudio
const AUDIO_DIR = path.join(UPLOADS_DIR, SUBDIR)
const PARTIAL_DIR = path.join(AUDIO_DIR, '.partial')
const STALE_PARTIAL_MS = 24 * 60 * 60 * 1000

async function removeStalePartials() {
  try {
    const now = Date.now()
    for (const name of await readdir(PARTIAL_DIR)) {
      const p = path.join(PARTIAL_DIR, name)
      const info = await stat(p).catch(() => null)
      if (info && now - info.mtimeMs > STALE_PARTIAL_MS) await unlink(p).catch(() => {})
    }
  } catch {
    /* folder missing: nothing to clean */
  }
}

function bad(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'media')
  if (denied) return denied

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return bad('Invalid upload request')
  }

  const uploadId = String(form.get('uploadId') ?? '')
  const fileName = String(form.get('fileName') ?? '').slice(0, 255)
  const offset = Number(form.get('offset'))
  const totalBytes = Number(form.get('totalBytes'))
  const chunk = form.get('chunk')

  if (!isValidUploadId(uploadId)) return bad('Invalid upload id')
  const ext = audioExtension(fileName)
  if (!AUDIO_TYPES[ext]) {
    return bad(`Unsupported file type. Accepted: ${Object.keys(AUDIO_TYPES).join(', ')}`)
  }
  if (!Number.isSafeInteger(totalBytes) || totalBytes <= 0) return bad('Invalid file size')
  if (totalBytes > AUDIO_MAX_BYTES) return bad('File is larger than 1 GB')
  if (!Number.isSafeInteger(offset) || offset < 0 || offset >= totalBytes) return bad('Invalid offset')
  if (!(chunk instanceof Blob) || chunk.size === 0) return bad('Missing file data')
  if (chunk.size > AUDIO_CHUNK_BYTES || offset + chunk.size > totalBytes) return bad('Chunk too large')

  const partialPath = path.join(PARTIAL_DIR, `${uploadId}${ext}`)
  const data = Buffer.from(await chunk.arrayBuffer())

  try {
    if (!existsSync(PARTIAL_DIR)) await mkdir(PARTIAL_DIR, { recursive: true })

    if (offset === 0) {
      await removeStalePartials()
      await writeFile(partialPath, data)
    } else {
      const have = (await stat(partialPath).catch(() => null))?.size ?? 0
      if (have === offset) {
        await appendFile(partialPath, data)
      } else if (have !== offset + chunk.size) {
        // Out of order (or the partial expired). Tell the client where we are.
        return bad('Upload out of sync', 409, { expectedOffset: have })
      }
      // have === offset + chunk.size: a retried chunk we already stored.
    }
  } catch (err) {
    console.error('[media upload] write failed:', err)
    return bad('Could not save the file on the server', 500)
  }

  const received = offset + chunk.size
  if (received < totalBytes) {
    return NextResponse.json({ done: false, received })
  }

  // Last piece: check the size, move the file into place and record it.
  const finalSize = (await stat(partialPath).catch(() => null))?.size ?? -1
  if (finalSize !== totalBytes) {
    await unlink(partialPath).catch(() => {})
    return bad('Upload incomplete, please try again', 409, { expectedOffset: 0 })
  }

  const filename = `${Date.now()}-${randomBytes(4).toString('hex')}${ext}`
  try {
    await rename(partialPath, path.join(AUDIO_DIR, filename))
  } catch (err) {
    console.error('[media upload] move failed:', err)
    return bad('Could not save the file on the server', 500)
  }

  const rawTitle = String(form.get('title') ?? '').trim().slice(0, 200)
  const title = rawTitle || titleFromFileName(fileName) || 'Untitled audio'
  const description = String(form.get('description') ?? '').trim().slice(0, 5000) || null

  const track = await db.audioTrack.create({
    data: {
      slug: audioSlug(title, randomBytes(4).toString('hex')),
      title,
      description,
      url: `/uploads/${SUBDIR}/${filename}`,
      originalName: fileName,
      mimeType: AUDIO_TYPES[ext],
      bytes: totalBytes,
      uploadedById: session?.user?.id && session.user.id !== 'env-admin' ? session.user.id : null,
    },
  })

  if (session?.user?.id && session.user.id !== 'env-admin') {
    await logActivity({
      userId: session.user.id,
      action: 'Uploaded audio',
      module: 'Media',
      targetId: track.id,
      targetTitle: track.title,
    })
  }

  return NextResponse.json({ done: true, received, track }, { status: 201 })
}
