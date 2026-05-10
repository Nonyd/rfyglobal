import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { broadcastSSE, createNotification } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { name, email, sessionToken } = await req.json()

    if (sessionToken) {
      const existing = await db.liveChatSession.findUnique({
        where: { sessionToken },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
      if (existing) {
        await db.liveChatSession.update({
          where: { id: existing.id },
          data: { isOnline: true, lastSeenAt: new Date() },
        })
        return NextResponse.json(existing)
      }
    }

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const session = await db.liveChatSession.create({
      data: {
        name: name.trim(),
        email: email.trim(),
        isOnline: true,
      },
      include: { messages: true },
    })

    broadcastSSE({
      type: 'notification',
      event: 'new_chat',
      sessionId: session.id,
      timestamp: Date.now(),
    })

    try {
      await createNotification('live_chat', `${session.name} started a live chat`)
    } catch {
      /* bell notification must not block chat */
    }

    await sendEmail({
      to: 'hello@rfyglobal.org',
      subject: `New live chat from ${session.name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 16px;">New Live Chat Started</p>
          <p style="font-size:16px;font-weight:bold;margin:0 0 4px;">${session.name}</p>
          <p style="color:#A0A0A0;font-size:13px;margin:0 0 24px;">${session.email}</p>
          <a href="https://rfyglobal.org/admin/live-chat" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">Open in Dashboard →</a>
          <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You · rfyglobal.org</p>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('[chat session]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
