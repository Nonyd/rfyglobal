import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'

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

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const threads = await db.messageThread.findMany({
    orderBy: { lastAt: 'desc' },
    include: {
      messages: {
        orderBy: { sentAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
  })

  return NextResponse.json(threads)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { recipientEmail, recipientName, subject, message, sendEmailNow } = body as {
    recipientEmail?: string
    recipientName?: string | null
    subject?: string | null
    message: string
    sendEmailNow?: boolean
    recipients?: { email: string; name?: string }[]
  }

  if (Array.isArray(body.recipients)) {
    const results = await Promise.allSettled(
      body.recipients.map(async (r: { email: string; name?: string }) => {
        const thread = await db.messageThread.create({
          data: {
            recipientEmail: r.email.trim(),
            recipientName: r.name ?? null,
            subject: subject ?? null,
            lastMessage: message,
            lastAt: new Date(),
            isRead: false,
            messages: {
              create: { body: message, fromAdmin: true },
            },
          },
        })

        if (sendEmailNow) {
          await sendEmail({
            to: r.email.trim(),
            subject: subject ?? 'Message from Room For You',
            html: buildMessageEmail(r.name ?? r.email, message),
          })
        }

        return thread
      }),
    )

    return NextResponse.json({ success: true, count: results.length })
  }

  if (!recipientEmail || !message) {
    return NextResponse.json({ error: 'recipientEmail and message are required' }, { status: 400 })
  }

  const thread = await db.messageThread.create({
    data: {
      recipientEmail: recipientEmail.trim(),
      recipientName: recipientName ?? null,
      subject: subject ?? null,
      lastMessage: message,
      lastAt: new Date(),
      isRead: false,
      messages: {
        create: { body: message, fromAdmin: true },
      },
    },
    include: { messages: true },
  })

  if (sendEmailNow) {
    await sendEmail({
      to: recipientEmail.trim(),
      subject: subject ?? 'Message from Room For You',
      html: buildMessageEmail(recipientName ?? recipientEmail, message),
    })
  }

  return NextResponse.json(thread, { status: 201 })
}
