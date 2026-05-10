import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildMessageEmail(name: string, message: string) {
  const safe = escapeHtml(message).replace(/\n/g, '<br>')
  const safeName = escapeHtml(name)
  return `
    <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
      <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
        Room For You
      </p>
      <p style="color:#F8F8F8;font-size:18px;font-weight:600;margin:0 0 24px;">
        A message for you, ${safeName}
      </p>
      <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 24px;"></div>
      <p style="color:#A0A0A0;font-size:14px;line-height:1.8;">
        ${safe}
      </p>
      <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:24px 0;"></div>
      <p style="color:#585858;font-size:11px;text-align:center;">
        Room For You · rfyglobal.org
      </p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const denied = await forbidUnlessCanAccess(session, 'messages')
    if (denied) return denied

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const threads = await db.messageThread.findMany({
      where: status && status !== 'all' ? { status } : undefined,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        _count: {
          select: {
            messages: { where: { isRead: false, fromAdmin: false } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json(threads)
  } catch (error) {
    console.error('[messages GET]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  const body = await req.json()
  const {
    recipientEmail,
    recipientName,
    fromEmail,
    fromName,
    subject,
    message,
    sendEmailNow,
  } = body as {
    recipientEmail?: string
    recipientName?: string | null
    fromEmail?: string
    fromName?: string | null
    subject?: string | null
    message: string
    sendEmailNow?: boolean
    recipients?: { email: string; name?: string }[]
  }

  const resolvedEmail = (fromEmail ?? recipientEmail)?.trim()
  const resolvedName = (fromName ?? recipientName ?? '').trim() || resolvedEmail || 'Recipient'

  if (Array.isArray(body.recipients)) {
    const results = await Promise.allSettled(
      body.recipients.map(async (r: { email: string; name?: string }) => {
        const emailAddr = r.email.trim()
        const displayName = (r.name ?? '').trim() || emailAddr
        const subj = subject?.trim() || 'A message from Room For You'
        const thread = await db.messageThread.create({
          data: {
            fromEmail: emailAddr,
            fromName: displayName,
            subject: subj,
            status: 'open',
            messages: {
              create: { body: message, fromAdmin: true, isRead: true },
            },
          },
        })

        if (sendEmailNow) {
          await sendEmail({
            to: emailAddr,
            subject: subj,
            html: buildMessageEmail(displayName, message),
            fromName: EMAIL_SENDERS.hello.name,
            fromEmail: EMAIL_SENDERS.hello.email,
          })
        }

        return thread
      }),
    )

    return NextResponse.json({ success: true, count: results.length })
  }

  if (!resolvedEmail || !message) {
    return NextResponse.json(
      { error: 'fromEmail (or recipientEmail) and message are required' },
      { status: 400 },
    )
  }

  const subj = subject?.trim() || 'A message from Room For You'

  const thread = await db.messageThread.create({
    data: {
      fromEmail: resolvedEmail,
      fromName: resolvedName,
      subject: subj,
      status: 'open',
      messages: {
        create: { body: message, fromAdmin: true, isRead: true },
      },
    },
    include: { messages: true },
  })

  if (sendEmailNow) {
    await sendEmail({
      to: resolvedEmail,
      subject: subj,
      html: buildMessageEmail(resolvedName, message),
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
    })
  }

  return NextResponse.json(thread, { status: 201 })
}
