import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PLAYLIST_KEY = 'rfy_live_playlist_id'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const setting = await db.rfySetting.findUnique({ where: { key: PLAYLIST_KEY } })
  return NextResponse.json({
    rfy_live_playlist_id: setting?.value ?? process.env.RFY_LIVE_PLAYLIST_ID ?? '',
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { key?: string; value?: string }
  const key = body.key?.trim()
  const value = typeof body.value === 'string' ? body.value.trim() : ''

  if (!key || key !== PLAYLIST_KEY) {
    return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 })
  }

  const record = await db.rfySetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json(record)
}
