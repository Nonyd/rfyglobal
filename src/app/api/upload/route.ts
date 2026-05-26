import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { auth } from '@/lib/auth'
import {
  deleteFileLocally,
  uploadBase64Locally,
  UPLOAD_FOLDER_SUBDIRS,
  type UploadFolderKey,
} from '@/lib/upload-local'

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
    resourceType?: 'image' | 'video' | 'raw'
  }

  if (!file || !folder) {
    return NextResponse.json({ error: 'file and folder are required' }, { status: 400 })
  }

  if (!UPLOAD_FOLDER_SUBDIRS[folder]) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  const subDir = UPLOAD_FOLDER_SUBDIRS[folder]
  const extFromMime = file.match(/^data:([^;]+);base64,/)?.[1]
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
    'application/pdf': '.pdf',
    'audio/mpeg': '.mp3',
    'audio/mp4': '.m4a',
    'video/mp4': '.mp4',
  }
  const fallbackExt = resourceType === 'raw' ? '.bin' : resourceType === 'video' ? '.mp4' : '.jpg'
  const originalName = `upload${extFromMime && extMap[extFromMime] ? extMap[extFromMime] : fallbackExt}`

  try {
    const result = await uploadBase64Locally(file, originalName, subDir)

    return NextResponse.json({
      url: result.url,
      publicId: result.filename,
      width: null,
      height: null,
      format: path.extname(originalName).replace('.', ''),
      bytes: result.size,
    })
  } catch (err: unknown) {
    console.error('[Local upload error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicId, url } = await req.json()
  const targetUrl =
    typeof url === 'string' && url.startsWith('/uploads/')
      ? url
      : typeof publicId === 'string' && publicId.startsWith('/uploads/')
        ? publicId
        : null

  if (!targetUrl) {
    return NextResponse.json({ error: 'Local upload url required' }, { status: 400 })
  }

  try {
    await deleteFileLocally(targetUrl)
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
