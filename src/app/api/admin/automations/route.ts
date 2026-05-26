import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AUTOMATION_KEYS = [
  'birthday',
  'welcome',
  'event_reminder',
  'daily_scripture',
  'daily_study',
  'christmas',
  'new_year',
  'easter',
] as const

async function upsertDefaults() {
  for (const key of AUTOMATION_KEYS) {
    await db.automationSetting.upsert({
      where: { key },
      create: { key, enabled: false },
      update: {},
    })
  }
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await upsertDefaults()

  const settings = await db.automationSetting.findMany({
    where: { key: { in: [...AUTOMATION_KEYS] } },
    orderBy: { key: 'asc' },
  })

  return NextResponse.json(settings)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key, enabled, config } = await req.json()

  if (!(AUTOMATION_KEYS as readonly string[]).includes(key)) {
    return NextResponse.json({ error: 'Invalid automation key' }, { status: 400 })
  }

  const setting = await db.automationSetting.upsert({
    where: { key },
    create: { key, enabled: Boolean(enabled), config: config ?? undefined },
    update: {
      enabled: Boolean(enabled),
      ...(config !== undefined ? { config } : {}),
    },
  })

  return NextResponse.json(setting)
}
