import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess, forbidUnlessCanAccessAny } from '@/lib/admin-api-access'
import { EMAIL_TEMPLATE_DEFAULTS, type EmailTemplateKey } from '@/lib/email-defaults'
import { isBuiltInTemplateKey, resolveEmailTemplateRecord } from '@/lib/email-template-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { key: string } },
) {
  const session = await auth()
  const denied = await forbidUnlessCanAccessAny(session, ['messages', 'email-templates'])
  if (denied) return denied

  const dbTemplate = await db.emailTemplate.findUnique({
    where: { key: params.key },
  })

  const resolved = resolveEmailTemplateRecord(params.key, dbTemplate)
  if (!resolved) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  return NextResponse.json(resolved)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { key: string } },
) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'email-templates')
  if (denied) return denied

  const body = (await req.json()) as {
    design?: unknown
    html?: string
    subject?: string
    name?: string
    description?: string
  }

  const { design, html, subject, name, description } = body

  if (design === undefined || html === undefined || typeof html !== 'string') {
    return NextResponse.json({ error: 'design and html are required' }, { status: 400 })
  }

  const key = params.key
  const builtIn = isBuiltInTemplateKey(key)
  const existing = await db.emailTemplate.findUnique({ where: { key } })

  if (!builtIn && !existing) {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 })
  }

  const defaults = builtIn ? EMAIL_TEMPLATE_DEFAULTS[key as EmailTemplateKey] : null

  const template = await db.emailTemplate.upsert({
    where: { key },
    create: {
      key,
      name: name ?? defaults?.name ?? key,
      subject: subject ?? defaults?.subject ?? '',
      description: description ?? defaults?.description ?? null,
      design: design as object,
      html,
    },
    update: {
      design: design as object,
      html,
      ...(subject !== undefined ? { subject } : {}),
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
    },
  })

  return NextResponse.json(template)
}
