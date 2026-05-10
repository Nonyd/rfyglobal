import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { PrayerRequestStatus } from '@prisma/client'

export const runtime = 'nodejs'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = params?.id
    if (!id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

    const body = await req.json()
    const { status, adminNote, sendReply, replyMessage } = body as {
      status?: string
      adminNote?: string | null
      sendReply?: boolean
      replyMessage?: string
    }

    const updateData: Record<string, unknown> = {}
    if (status && Object.values(PrayerRequestStatus).includes(status as PrayerRequestStatus)) {
      updateData.status = status
    }
    if (adminNote !== undefined) updateData.adminNote = adminNote
    if (status === 'PRAYED') updateData.prayedAt = new Date()

    if (Object.keys(updateData).length > 0) {
      await db.prayerRequest.update({
        where: { id },
        data: updateData,
      })
    }

    let request = await db.prayerRequest.findUnique({ where: { id } })
    if (!request) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (sendReply && replyMessage?.trim()) {
      const trimmed = replyMessage.trim()
      if (!request.email?.trim()) {
        return NextResponse.json(
          { error: 'This prayer request has no email address, so a reply cannot be sent.' },
          { status: 400 },
        )
      }

      const displayName = request.isAnonymous ? 'Friend' : (request.name || 'Friend')
      const safeBody = escapeHtml(trimmed).replace(/\n/g, '<br>')
      const safeSubject = escapeHtml(request.subject)
      const vars = {
        first_name: escapeHtml(displayName),
        subject: safeSubject,
        reply_body: safeBody,
      }
      const defaultHtml = `
        <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
          <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
            Room For You · Prayer Team
          </p>
          <h2 style="color:#F8F8F8;font-size:24px;margin:0 0 24px;">
            We prayed for you, ${escapeHtml(displayName)}.
          </h2>
          <div style="height:1px;background:linear-gradient(90deg,#C9A84C,transparent);margin:0 0 24px;"></div>
          <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">
            ${safeBody}
          </p>
          <div style="height:1px;background:linear-gradient(90deg,transparent,#C9A84C,transparent);margin:24px 0;"></div>
          <p style="color:#585858;font-size:12px;text-align:center;">
            Room For You · rfyglobal.org · Jesus to Nations
          </p>
        </div>
      `
      const html = (await getTemplateHtml('prayer_reply', vars)) ?? defaultHtml
      const subject =
        (await getTemplateSubject('prayer_reply', vars)) ??
        `Re: Your Prayer Request — ${request.subject}`

      const sent = await sendEmail({
        to: request.email,
        subject,
        fromName: EMAIL_SENDERS.prayer.name,
        fromEmail: EMAIL_SENDERS.prayer.email,
        html,
      })

      if (!sent.ok) {
        return NextResponse.json(
          {
            error:
              sent.error ||
              'The email could not be sent. Check Brevo (API key, sender verification for prayer@rfyglobal.org).',
          },
          { status: 502 },
        )
      }

      await db.prayerRequest.update({
        where: { id },
        data: { status: 'REPLIED' },
      })
      request = await db.prayerRequest.findUnique({ where: { id } })
    }

    return NextResponse.json(request)
  } catch (err) {
    console.error('[admin prayer PATCH]', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db.prayerRequest.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
