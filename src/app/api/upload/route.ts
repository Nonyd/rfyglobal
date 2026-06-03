import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { auth } from '@/lib/auth'
import {
  deleteFromStorage,
  uploadBase64ToStorage,
  type UploadResourceType,
} from '@/lib/upload-storage'
import { UPLOAD_FOLDER_SUBDIRS, type UploadFolderKey } from '@/lib/upload-local'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
    return DELETE(req)
  }

  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { file, folder, resourceType = 'image' } = body as {
    file: string
    folder: UploadFolderKey
    resourceType?: UploadResourceType
  }

  if (!file || !folder) {
    return NextResponse.json({ error: 'file and folder are required' }, { status: 400 })
  }

  if (!UPLOAD_FOLDER_SUBDIRS[folder]) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  const extFromMime = file.match(/^data:([^;]+);base64,/)?.[1]
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/avif': '.avif',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'video/mp4': '.mp4',
  }

  const mime = extFromMime?.toLowerCase()
  if (mime === 'image/heic' || mime === 'image/heif') {
    return NextResponse.json(
      {
        error:
          'HEIC/HEIF photos are not supported. Please export as JPEG or PNG (e.g. Settings → Camera → Formats → Most Compatible on iPhone).',
      },
      { status: 400 },
    )
  }
  const fallbackExt = resourceType === 'raw' ? '.bin' : resourceType === 'video' ? '.mp4' : '.jpg'
  const originalName = `upload${extFromMime && extMap[extFromMime] ? extMap[extFromMime] : fallbackExt}`

  try {
    const result = await uploadBase64ToStorage(file, originalName, folder, resourceType)

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    })
  } catch (err: unknown) {
    console.error('[Upload error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    publicId?: string
    url?: string
    resourceType?: UploadResourceType
  }

  try {
    await deleteFromStorage(body)
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('[Upload delete error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to delete' },
      { status: 400 },
    )
  }
}
