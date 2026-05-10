import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { createNotification } from '@/lib/notify'
import { sendEmail } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { SITE_URL } from '@/lib/seo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const thread = await db.messageThread.findUnique({
      where: { replyToken: params.token },
    })

    if (!thread || thread.status === 'archived') {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const body = await req.json()
    const messageBody = body?.body?.trim()

    if (!messageBody) {
      return NextResponse.json({ error: 'Message body required' }, { status: 400 })
    }

    await db.message.create({
      data: {
        threadId: thread.id,
        body: messageBody,
        fromAdmin: false,
        isRead: false,
      },
    })

    await db.messageThread.update({
      where: { id: thread.id },
      data: { updatedAt: new Date(), status: 'open' },
    })

    await createNotification(
      'message',
      `${thread.fromName} replied: "${messageBody.slice(0, 80)}${messageBody.length > 80 ? '…' : ''}"`,
      { targetId: thread.id },
    )

    const safeBody = escapeHtml(messageBody).replace(/\n/g, '<br>')
    await sendEmail({
      to: 'hello@rfyglobal.org',
      subject: `Re: ${thread.subject} — reply from ${thread.fromName}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#0F0F0F;color:#F8F8F8;padding:32px;border-top:3px solid #C9A84C;">
          <p style="color:#C9A84C;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0 0 20px;">New Reply Received</p>
          <p style="font-size:16px;font-weight:bold;margin:0 0 4px;color:#F8F8F8;">${escapeHtml(thread.subject)}</p>
          <p style="color:#A0A0A0;font-size:13px;margin:0 0 20px;">From: ${escapeHtml(thread.fromName)} &lt;${escapeHtml(thread.fromEmail)}&gt;</p>
          <div style="background:#1A1A1A;border-left:3px solid #C9A84C;padding:16px 20px;margin:0 0 24px;">
            <p style="margin:0;line-height:1.7;color:#F8F8F8;font-size:14px;">${safeBody}</p>
          </div>
          <a href="${SITE_URL}/admin/messages" style="display:inline-block;background:#C9A84C;color:#0F0F0F;padding:12px 24px;text-decoration:none;font-size:11px;font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;">View in Dashboard →</a>
          <p style="color:#585858;font-size:11px;margin:24px 0 0;text-align:center;">Room For You · rfyglobal.org</p>
        </div>
      `,
      fromName: EMAIL_SENDERS.hello.name,
      fromEmail: EMAIL_SENDERS.hello.email,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[reply POST]', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
