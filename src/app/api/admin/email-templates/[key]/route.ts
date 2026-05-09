import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { EMAIL_TEMPLATE_DEFAULTS, type EmailTemplateKey } from '@/lib/email-defaults'

export const runtime = 'nodejs'

const ALLOWED_KEYS = new Set<string>(Object.keys(EMAIL_TEMPLATE_DEFAULTS))

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_KEYS.has(params.key)) {
    return NextResponse.json({ error: 'Unknown template key' }, { status: 400 })
  }

  const template = await db.emailTemplate.findUnique({
    where: { key: params.key },
  })

  return NextResponse.json(template)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (!ALLOWED_KEYS.has(params.key)) {
    return NextResponse.json({ error: 'Unknown template key' }, { status: 400 })
  }

  const body = (await req.json()) as {
    design?: unknown
    html?: string
    subject?: string
    name?: string
  }

  const { design, html, subject, name } = body

  if (design === undefined || html === undefined || typeof html !== 'string') {
    return NextResponse.json({ error: 'design and html are required' }, { status: 400 })
  }

  const defaults = EMAIL_TEMPLATE_DEFAULTS[params.key as EmailTemplateKey]

  const template = await db.emailTemplate.upsert({
    where: { key: params.key },
    create: {
      key: params.key,
      name: name ?? defaults.name,
      subject: subject ?? defaults.subject,
      design: design as object,
      html,
    },
    update: {
      design: design as object,
      html,
      ...(subject !== undefined ? { subject } : {}),
      ...(name !== undefined ? { name } : {}),
    },
  })

  return NextResponse.json(template)
}
