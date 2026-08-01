import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { maskSecret } from '@/lib/encryption'
import { normalizeApiKey, normalizePlaylistId } from '@/lib/rfy-youtube-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ALLOWED_KEYS = [
  'youtube_api_key',
  'youtube_channel_id',
  'rfy_live_playlist_id',
] as const

type SettingKey = (typeof ALLOWED_KEYS)[number]

const ENV_FALLBACKS: Record<SettingKey, string> = {
  youtube_api_key: process.env.YOUTUBE_API_KEY ?? '',
  youtube_channel_id: process.env.YOUTUBE_CHANNEL_ID ?? '',
  rfy_live_playlist_id: process.env.RFY_LIVE_PLAYLIST_ID ?? '',
}

function isAllowedKey(key: string): key is SettingKey {
  return (ALLOWED_KEYS as readonly string[]).includes(key)
}

function normalizeSettingValue(key: SettingKey, raw: string): string {
  if (key === 'youtube_api_key') return normalizeApiKey(raw)
  if (key === 'rfy_live_playlist_id') return normalizePlaylistId(raw)
  return raw.trim().replace(/^["']|["']$/g, '')
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const records = await db.rfySetting.findMany({
    where: { key: { in: [...ALLOWED_KEYS] } },
  })
  const byKey = Object.fromEntries(records.map((r) => [r.key, r.value])) as Partial<
    Record<SettingKey, string>
  >

  const youtube_api_key = byKey.youtube_api_key || ENV_FALLBACKS.youtube_api_key
  const youtube_channel_id = byKey.youtube_channel_id || ENV_FALLBACKS.youtube_channel_id
  const rfy_live_playlist_id = byKey.rfy_live_playlist_id || ENV_FALLBACKS.rfy_live_playlist_id

  return NextResponse.json({
    youtube_api_key: youtube_api_key ? maskSecret(youtube_api_key) : '',
    youtube_channel_id,
    rfy_live_playlist_id,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as {
    key?: string
    value?: string
    settings?: Partial<Record<SettingKey, string>>
  }

  // Batch save: { settings: { youtube_api_key, youtube_channel_id, rfy_live_playlist_id } }
  if (body.settings && typeof body.settings === 'object') {
    const updates: Array<{ key: SettingKey; value: string }> = []

    for (const [rawKey, rawValue] of Object.entries(body.settings)) {
      if (!isAllowedKey(rawKey)) continue
      if (typeof rawValue !== 'string') continue

      let value = normalizeSettingValue(rawKey, rawValue)

      // Don't overwrite secrets when the client still has a masked value
      if (rawKey === 'youtube_api_key' && (rawValue.includes('•') || value.includes('•'))) {
        const existing = await db.rfySetting.findUnique({ where: { key: rawKey } })
        if (existing?.value) continue
        // If no DB value yet but env exists, keep env — skip writing masked junk
        if (ENV_FALLBACKS.youtube_api_key) continue
        value = ''
      }

      updates.push({ key: rawKey, value })
    }

    const saved = await Promise.all(
      updates.map(({ key, value }) =>
        db.rfySetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        }),
      ),
    )

    return NextResponse.json({ saved: saved.map((r) => r.key) })
  }

  // Single key save (legacy)
  const key = body.key?.trim()
  const rawValue = typeof body.value === 'string' ? body.value : ''

  if (!key || !isAllowedKey(key)) {
    return NextResponse.json({ error: 'Invalid setting key' }, { status: 400 })
  }

  if (key === 'youtube_api_key' && rawValue.includes('•')) {
    const existing = await db.rfySetting.findUnique({ where: { key } })
    if (existing) return NextResponse.json(existing)
    return NextResponse.json({ error: 'Enter a new API key to update' }, { status: 400 })
  }

  const value = normalizeSettingValue(key, rawValue)

  const record = await db.rfySetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json(record)
}
