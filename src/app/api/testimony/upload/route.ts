import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import { strictRatelimit } from '@/lib/ratelimit'
import { uploadBase64ToStorage } from '@/lib/upload-storage'
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

  const extFromMime = parsed.data.file.match(/^data:([^;]+);base64,/)?.[1]
  const extMap: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  }
  const originalName = `testimony${extFromMime && extMap[extFromMime] ? extMap[extFromMime] : '.jpg'}`

  try {
    const result = await uploadBase64ToStorage(parsed.data.file, originalName, 'testimony', 'image')

    return NextResponse.json({
      url: result.url,
      publicId: result.publicId,
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
