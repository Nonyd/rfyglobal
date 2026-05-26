import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess, forbidUnlessCanAccessAny } from '@/lib/admin-api-access'
import { getBaseDesign } from '@/lib/email-defaults'
import {
  buildPlaceholderHtml,
  isBuiltInTemplateKey,
  isValidTemplateKey,
  mergeEmailTemplateList,
} from '@/lib/email-template-utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const denied = await forbidUnlessCanAccessAny(session, ['messages', 'email-templates'])
  if (denied) return denied

  const dbTemplates = await db.emailTemplate.findMany({
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(mergeEmailTemplateList(dbTemplates))
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'email-templates')
  if (denied) return denied

  const body = (await req.json()) as {
    name?: string
    key?: string
    subject?: string
    description?: string
  }

  const name = body.name?.trim()
  const key = body.key?.trim()
  const subject = body.subject?.trim()
  const description = body.description?.trim() || null

  if (!name || !key || !subject) {
    return NextResponse.json({ error: 'name, key and subject are required' }, { status: 400 })
  }

  if (!isValidTemplateKey(key)) {
    return NextResponse.json(
      { error: 'Template key must be lowercase letters, numbers, and underscores (e.g. monthly_newsletter)' },
      { status: 400 },
    )
  }

  if (isBuiltInTemplateKey(key)) {
    return NextResponse.json({ error: 'This template key is reserved for a system template' }, { status: 409 })
  }

  const existing = await db.emailTemplate.findUnique({ where: { key } })
  if (existing) {
    return NextResponse.json({ error: 'A template with this key already exists' }, { status: 409 })
  }

  const bodyText = description || 'Edit this template to customize your email content.'
  const design = getBaseDesign({
    heading: name,
    body: bodyText,
    ctaText: 'Visit rfyglobal.org',
    ctaUrl: 'https://rfyglobal.org',
  })

  const template = await db.emailTemplate.create({
    data: {
      key,
      name,
      subject,
      description,
      design: design as object,
      html: buildPlaceholderHtml(name, bodyText),
    },
  })

  return NextResponse.json(template, { status: 201 })
}
