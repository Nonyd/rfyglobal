import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const thread = await db.messageThread.findUnique({
    where: { id: params.id },
    include: {
      messages: { orderBy: { sentAt: 'asc' } },
    },
  })

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.messageThread.update({
    where: { id: params.id },
    data: { isRead: true },
  })

  return NextResponse.json(thread)
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body: messageBody, sendEmailNow } = (await req.json()) as {
    body: string
    sendEmailNow?: boolean
  }

  if (!messageBody?.trim()) {
    return NextResponse.json({ error: 'body is required' }, { status: 400 })
  }

  const thread = await db.messageThread.findUnique({
    where: { id: params.id },
  })
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const message = await db.message.create({
    data: {
      threadId: params.id,
      body: messageBody,
      fromAdmin: true,
    },
  })

  await db.messageThread.update({
    where: { id: params.id },
    data: { lastMessage: messageBody, lastAt: new Date(), isRead: true },
  })

  if (sendEmailNow) {
    const safe = escapeHtml(messageBody).replace(/\n/g, '<br>')
    await sendEmail({
      to: thread.recipientEmail,
      subject: thread.subject ?? 'A message from Room For You',
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
      html: `
        <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">Room For You</p>
          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;">${safe}</p>
          <p style="color:#585858;font-size:11px;margin-top:24px;text-align:center;">rfyglobal.org</p>
        </div>
      `,
    })
  }

  return NextResponse.json(message, { status: 201 })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.messageThread.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
