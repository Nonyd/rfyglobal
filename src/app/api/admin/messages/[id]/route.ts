import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { broadcastSSE } from '@/lib/notify'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { SITE_URL } from '@/lib/seo'
import { paramId } from '@/lib/api-route-params'
import { Prisma } from '@prisma/client'

export const runtime = 'nodejs'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'messages')
  if (denied) return denied

  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const thread = await db.messageThread.findUnique({
    where: { id },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.message.updateMany({
    where: { threadId: id, isRead: false, fromAdmin: false },
    data: { isRead: true },
  })

  const legacyWindowStart = new Date(thread.createdAt.getTime() - 120_000)
  const legacyWindowEnd = new Date(thread.createdAt.getTime() + 120_000)

  const marked = await db.adminNotification.updateMany({
    where: {
      isRead: false,
      type: { in: ['contact', 'message'] },
      OR: [
        { targetId: id },
        ...(thread.fromName
          ? [
              {
                targetId: null,
                type: 'contact' as const,
                body: `New message from ${thread.fromName}`,
                createdAt: { gte: legacyWindowStart, lte: legacyWindowEnd },
              },
            ]
          : []),
      ],
    },
    data: { isRead: true },
  })

  if (marked.count > 0) {
    try {
      broadcastSSE({ type: 'notification', event: 'thread_read', timestamp: Date.now() })
    } catch {
      /* ignore */
    }
  }

  return NextResponse.json(thread)
}

export async function POST(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    if (req.headers.get('X-HTTP-Method-Override') === 'DELETE') {
      return DELETE(req, ctx)
    }

    const session = await auth()
    const denied = await forbidUnlessCanAccess(session, 'messages')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const thread = await db.messageThread.findUnique({
      where: { id },
    })
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const messageBody = body?.body?.trim()
    if (!messageBody) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    const message = await db.message.create({
      data: {
        threadId: thread.id,
        body: messageBody,
        fromAdmin: true,
        isRead: true,
      },
    })

    await db.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date() },
    })

    const replyUrl = `${SITE_URL}/reply/${thread.replyToken}`
    const safeBody = escapeHtml(messageBody).replace(/\n/g, '<br>')
    const safeName = escapeHtml(thread.fromName)

    await sendEmail({
      to: thread.fromEmail,
      subject: `Re: ${thread.subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0F0F;color:#F8F8F8;padding:0;">
          <div style="background:#0F0F0F;padding:32px 32px 0;border-top:3px solid #C9A84C;">
            <img src="${SITE_URL}/images/logo-white.png" alt="Room For You" style="height:44px;width:auto;display:block;margin:0 0 28px;" />
          </div>
          <div style="padding:0 32px 32px;">
            <p style="font-size:15px;margin:0 0 8px;color:#F8F8F8;">Hi ${safeName},</p>
            <p style="font-size:13px;color:#A0A0A0;margin:0 0 20px;">A message from the Room For You team:</p>
            <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:20px;margin:0 0 28px;">
              <p style="margin:0;line-height:1.8;color:#F8F8F8;font-size:14px;">${safeBody}</p>
            </div>
            <p style="font-size:13px;color:#A0A0A0;margin:0 0 20px;">
              Want to reply? Click the button below:
            </p>
            <a href="${replyUrl}" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:14px 28px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px;">
              Reply to Room For You →
            </a>
            <p style="font-size:11px;color:#585858;margin:8px 0 0;">
              Or paste this link in your browser: ${replyUrl}
            </p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #2A2A2A;">
            <p style="font-size:11px;color:#585858;margin:0;text-align:center;">
              Room For You · rfyglobal.org · Jesus to Nations
            </p>
          </div>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
      replyTo: 'hello@rfyglobal.org',
    })

    broadcastSSE({
      type: 'notification',
      event: 'new_message',
      threadId: thread.id,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('[admin messages POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await auth()
    const denied = await forbidUnlessCanAccess(session, 'messages')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    await db.messageThread.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[admin messages DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 })
  }
}
