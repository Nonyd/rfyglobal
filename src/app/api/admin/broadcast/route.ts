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

  const { subject, body, replyTo, group, groupFilter, templateKey } = await req.json()

  if (!subject || !body || !group) {
    return NextResponse.json({ error: 'subject, body and group are required' }, { status: 400 })
  }

  const recipients = await getBroadcastRecipients(group, groupFilter)

  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients found for this group' }, { status: 400 })
  }

  const message = await db.broadcastMessage.create({
    data: {
      subject,
      body,
      replyTo: replyTo || null,
      group,
      groupFilter: groupFilter || null,
      templateKey: templateKey || null,
      recipientCount: recipients.length,
      status: 'sent',
      sentAt: new Date(),
    },
  })

  let sent = 0
  let failed = 0

  for (const recipient of recipients) {
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
      status: failed === recipients.length ? 'failed' : 'sent',
      recipientCount: sent,
    },
  })

  return NextResponse.json({
    success: true,
    sent,
    failed,
    total: recipients.length,
    messageId: message.id,
  })
}
