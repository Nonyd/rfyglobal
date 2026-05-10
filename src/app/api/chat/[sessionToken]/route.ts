import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { broadcastSSE } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function tokenFromParams(params: { sessionToken: string } | Promise<{ sessionToken: string }>) {
  const p = await Promise.resolve(params)
  return p.sessionToken
}

export async function GET(
  req: NextRequest,
  ctx: { params: { sessionToken: string } | Promise<{ sessionToken: string }> },
) {
  try {
    const sessionToken = await tokenFromParams(ctx.params)
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { isOnline: true, lastSeenAt: new Date() },
    })

    await db.liveChatMessage.updateMany({
      where: { sessionId: session.id, fromAdmin: true, isRead: false },
      data: { isRead: true },
    })

    return NextResponse.json({ ...session, messages: session.messages })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  ctx: { params: { sessionToken: string } | Promise<{ sessionToken: string }> },
) {
  try {
    const sessionToken = await tokenFromParams(ctx.params)
    const session = await db.liveChatSession.findUnique({
      where: { sessionToken },
    })
    if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const { body } = await req.json()
    if (!body?.trim()) return NextResponse.json({ error: 'Body required' }, { status: 400 })

    await db.liveChatMessage.create({
      data: {
        sessionId: session.id,
        body: body.trim(),
        fromAdmin: false,
        isRead: false,
      },
    })

    await db.liveChatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date(), isOnline: true, lastSeenAt: new Date() },
    })

    broadcastSSE({
      type: 'notification',
      event: 'new_chat_message',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    const count = await db.liveChatMessage.count({
      where: { sessionId: session.id, fromAdmin: false },
    })
    if (count === 1) {
      await sendEmail({
        to: 'hello@rfyglobal.org',
        subject: `Live chat message from ${session.name}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
            <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">Live Chat Message</p>
            <p style="font-size:15px;font-weight:bold;margin:0 0 4px;">${session.name} · ${session.email}</p>
            <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px;margin:16px 0 24px;">
              <p style="margin:0;color:#F8F8F8;font-size:14px;line-height:1.6;">${body.trim()}</p>
            </div>
            <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">Reply in Dashboard →</a>
          </div>
        `,
        fromName: EMAIL_SENDERS.hello.name,
        fromEmail: EMAIL_SENDERS.hello.email,
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
