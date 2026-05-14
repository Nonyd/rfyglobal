import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/lib/auth'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { broadcastSSE } from '@/lib/notify'
import { paramId } from '@/lib/api-route-params'

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const sessionUser = await auth()
    const denied = await forbidUnlessCanAccess(sessionUser, 'live-chat')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const chatSession = await db.liveChatSession.findUnique({
      where: { id },
    })
    if (!chatSession) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: chatSession.id,
        body: body.trim(),
        fromAdmin: true,
        isRead: false,
      },
    })

    await db.liveChatSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000)
    const isOnline = chatSession.lastSeenAt > twoMinsAgo

    if (!isOnline) {
      const safeName = escapeHtml(chatSession.name)
      const safeBodyHtml = escapeHtml(body.trim()).replace(/\n/g, '<br>')
      try {
        await sendEmail({
          to: chatSession.email,
          subject: 'You have a new message from Room For You',
          html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
        <img src="https://rfyglobal.org/images/logo-white.png" alt="Room For You" style="height:44px;margin-bottom:24px;display:block;" />
        <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 12px;">New Message</p>
        <p style="font-size:15px;margin:0 0 8px;color:#F8F8F8;">Hi ${safeName},</p>
        <p style="color:#A0A0A0;font-size:13px;margin:0 0 16px;">The Room For You team replied to your message:</p>
        <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px 20px;margin:0 0 24px;">
          <p style="margin:0;color:#F8F8F8;font-size:14px;line-height:1.7;">${safeBodyHtml}</p>
        </div>
        <p style="color:#A0A0A0;font-size:13px;margin:0 0 20px;">
          Visit rfyglobal.org and click the chat bubble to continue the conversation.
        </p>
        <a href="https://rfyglobal.org" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">
          Continue Chat →
        </a>
        <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You · rfyglobal.org</p>
      </div>
    `,
          fromName: EMAIL_SENDERS.hello.name,
          fromEmail: EMAIL_SENDERS.hello.email,
        })
      } catch (emailErr) {
        console.error('[admin live-chat reply] offline notify email failed:', emailErr)
      }
    }

    broadcastSSE({
      type: 'chat_reply',
      event: 'chat_reply',
      sessionId: chatSession.id,
      sessionToken: chatSession.sessionToken,
      timestamp: Date.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[admin live-chat reply]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const sessionUser = await auth()
    const denied = await forbidUnlessCanAccess(sessionUser, 'live-chat')
    if (denied) return denied

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    await db.liveChatSession.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    console.error('[admin live-chat DELETE]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
