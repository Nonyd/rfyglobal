import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, getTemplateHtml, getTemplateSubject } from '@/lib/brevo'
import { EMAIL_SENDERS } from '@/lib/email-senders'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { createNotification } from '@/lib/notify'
import { z } from 'zod'

export const runtime = 'nodejs'

function escapeHtml(text: string) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

const ContactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(3000),
})

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') ?? 'anonymous'
  const { success } = await strictRatelimit.limit(`contact:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = ContactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, email, subject, message } = parsed.data

  const thread = await db.messageThread.create({
    data: {
      subject: subject.trim() || `Message from ${name}`,
      fromName: name.trim(),
      fromEmail: email.trim(),
      status: 'open',
      messages: {
        create: {
          body: message.trim(),
          fromAdmin: false,
          isRead: false,
        },
      },
    },
  })

  await createNotification('contact', `${name}: "${message.trim().slice(0, 80)}…"`, {
    targetId: thread.id,
  })

  const safeName = escapeHtml(name)
  const vars = { first_name: safeName }
  const defaultHtml = `
      <div style="background:#0F0F0F;max-width:600px;margin:0 auto;padding:40px;font-family:Arial,sans-serif;">
        <p style="color:#C9A84C;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin:0 0 8px;">
          Room For You
        </p>
        <p style="color:#F8F8F8;font-size:18px;font-weight:600;margin:0 0 16px;">
          Hi ${safeName},
        </p>
        <p style="color:#A0A0A0;font-size:14px;line-height:1.8;margin:0 0 24px;">
          Thank you for reaching out. We have received your message and will read it as soon as we can.
        </p>
        <p style="color:#585858;font-size:11px;text-align:center;margin:0;">
          Room For You · rfyglobal.org
        </p>
      </div>
    `
  const html = (await getTemplateHtml('contact_reply', vars)) ?? defaultHtml
  const emailSubject =
    (await getTemplateSubject('contact_reply', vars)) ?? 'We received your message — Room For You'

  await sendEmail({
    to: email,
    subject: emailSubject,
    html,
    fromName: EMAIL_SENDERS.hello.name,
    fromEmail: EMAIL_SENDERS.hello.email,
    replyTo: EMAIL_SENDERS.hello.email,
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
