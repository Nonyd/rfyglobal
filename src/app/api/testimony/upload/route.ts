import { NextRequest, NextResponse } from 'next/server'
import { strictRatelimit } from '@/lib/ratelimit'
import { cloudinary, UPLOAD_FOLDERS } from '@/lib/cloudinary'
import { z } from 'zod'

export const runtime = 'nodejs'

const BodySchema = z.object({
  email: z.string().email(),
  file: z.string().min(20),
})

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`testimony-upload:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await cloudinary.uploader.upload(parsed.data.file, {
      folder: UPLOAD_FOLDERS.testimony,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
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
    console.error('[testimony upload]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 },
    )
  }
}
