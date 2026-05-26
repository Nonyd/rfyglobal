import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { getBroadcastRecipients } from '@/lib/broadcast-recipients'
import { personalizeBroadcastText, wrapInEmailTemplate } from '@/lib/broadcast-email'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type BroadcastOverrideRecipient = { email: string; name?: string }

export async function GET() {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  const messages = await db.broadcastMessage.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(messages)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  const {
    subject,
    body,
    replyTo,
    group,
    groupFilter,
    templateKey,
    recipients,
  } = (await req.json()) as {
    subject?: string
    body?: string
    replyTo?: string | null
    group?: string
    groupFilter?: string | null
    templateKey?: string
    recipients?: BroadcastOverrideRecipient[]
  }

  if (!subject || !body) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  const normalizeEmail = (email: string) => email.trim()
  const isProbablyEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  let resolvedGroup = group?.trim() || undefined
  let resolvedGroupFilter = groupFilter?.trim() || undefined

  let resolvedRecipients: Array<{ email: string; name: string }> = []

  if (Array.isArray(recipients) && recipients.length > 0) {
    const seen = new Set<string>()
    for (const r of recipients) {
      const email = typeof r.email === 'string' ? normalizeEmail(r.email) : ''
      if (!email || !isProbablyEmail(email)) continue
      const key = email.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      resolvedRecipients.push({ email, name: (r.name?.trim() || email) })
    }

    if (resolvedRecipients.length === 0) {
      return NextResponse.json({ error: 'No valid recipient emails provided' }, { status: 400 })
    }

    // If the client is overriding recipients, we still store the group for audit/history purposes.
    if (!resolvedGroup) resolvedGroup = 'individual_emails'
    resolvedGroupFilter = undefined
  } else {
    if (!resolvedGroup) {
      return NextResponse.json({ error: 'group or recipients are required' }, { status: 400 })
    }
    resolvedRecipients = await getBroadcastRecipients(resolvedGroup, resolvedGroupFilter)
    if (resolvedRecipients.length === 0) {
      return NextResponse.json({ error: 'No recipients found for this group' }, { status: 400 })
    }
  }

  const message = await db.broadcastMessage.create({
    data: {
      subject,
      body,
      replyTo: replyTo || null,
      group: resolvedGroup,
      groupFilter: resolvedGroupFilter || null,
      templateKey: templateKey || null,
      recipientCount: resolvedRecipients.length,
      status: 'sent',
      sentAt: new Date(),
    },
  })

  let sent = 0
  let failed = 0

  for (const recipient of resolvedRecipients) {
    try {
      const personalizedBody = personalizeBroadcastText(body, recipient)
      const personalizedSubject = personalizeBroadcastText(subject, recipient)

      const result = await sendEmail({
        to: recipient.email,
        subject: personalizedSubject,
        html: wrapInEmailTemplate(personalizedBody),
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
        replyTo: replyTo || undefined,
      })

      if (!result.ok) throw new Error(result.error)
      sent++
    } catch (err) {
      console.error(`[broadcast] Failed to send to ${recipient.email}:`, err)
      failed++
    }
  }

  await db.broadcastMessage.update({
    where: { id: message.id },
    data: {
      status: failed === resolvedRecipients.length ? 'failed' : 'sent',
      recipientCount: sent,
    },
  })

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: resolvedRecipients.length,
    messageId: message.id,
  })
}
