import { NextRequest, NextResponse } from 'next/server'
import { ContentType } from '@prisma/client'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

function parseContentType(raw: unknown): ContentType {
  if (raw === 'RICHTEXT') return ContentType.RICHTEXT
  if (raw === 'IMAGE') return ContentType.IMAGE
  if (raw === 'JSON') return ContentType.JSON
  return ContentType.TEXT
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const content = await db.siteContent.findMany({ orderBy: { key: 'asc' } })
  return NextResponse.json(content)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { key?: string; value?: string; type?: string }
  const { key, value, type } = body

  if (!key || value === undefined) {
    return NextResponse.json({ error: 'key and value required' }, { status: 400 })
  }

  const contentType = parseContentType(type)

  const record = await db.siteContent.upsert({
    where: { key },
    update: { value, type: contentType },
    create: { key, value, type: contentType },
  })

  return NextResponse.json(record)
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = (await req.json()) as { key?: string }
  if (!key) return NextResponse.json({ error: 'key required' }, { status: 400 })

  await db.siteContent.deleteMany({ where: { key } })
  return NextResponse.json({ success: true })
}
