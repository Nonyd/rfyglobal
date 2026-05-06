import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { cloudinary, UPLOAD_FOLDERS } from '@/lib/cloudinary'

export const runtime = 'nodejs'

type UploadFolder = keyof typeof UPLOAD_FOLDERS

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { file, folder, resourceType = 'image' } = body as {
    file: string
    folder: UploadFolder
    resourceType?: 'image' | 'video' | 'raw'
  }

  if (!file || !folder) {
    return NextResponse.json({ error: 'file and folder are required' }, { status: 400 })
  }

  if (!UPLOAD_FOLDERS[folder]) {
    return NextResponse.json({ error: 'Invalid folder' }, { status: 400 })
  }

  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: UPLOAD_FOLDERS[folder],
      resource_type: resourceType,
      ...(resourceType === 'image' && {
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      }),
    })

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    })
  } catch (err: unknown) {
    console.error('[Cloudinary upload error]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { publicId, resourceType = 'image' } = await req.json()
  if (!publicId) return NextResponse.json({ error: 'publicId required' }, { status: 400 })

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
