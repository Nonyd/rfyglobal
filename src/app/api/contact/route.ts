import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { z } from 'zod'

export const runtime = 'nodejs'

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

  await db.messageThread.create({
    data: {
      recipientEmail: email,
      recipientName: name,
      subject: `[Contact] ${subject}`,
      lastMessage: message,
      lastAt: new Date(),
      isRead: false,
      messages: {
        create: {
          body: `**From:** ${name} (${email})\n\n${message}`,
          fromAdmin: false,
          sentAt: new Date(),
        },
      },
    },
  })

  return NextResponse.json({ success: true }, { status: 201 })
}
