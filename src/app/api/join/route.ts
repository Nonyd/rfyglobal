import { NextRequest, NextResponse } from 'next/server'
import { EmailType, Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { sendConfirmationEmail } from '@/lib/emails/confirmation'
import { createNotification } from '@/lib/notify'
import { z } from 'zod'

export const runtime = 'nodejs'

const JoinSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  phone: z.string().min(7, 'Valid phone number required').max(20),
  email: z.string().email('Valid email required'),
  country: z.string().min(1, 'Country is required'),
  state: z.string().optional(),
  city: z.string().optional(),
  extraFields: z.record(z.string(), z.unknown()).optional(),
})

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`join:${ip}`)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please wait.' }, { status: 429 })
  }

  const body = await req.json()
  const parsed = JoinSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { name, phone, email, country, state, city, extraFields } = parsed.data

  const existing = await db.communityMember.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json(
      {
        error: 'This email is already registered with Room For You.',
        alreadyRegistered: true,
      },
      { status: 409 },
    )
  }

  const member = await db.communityMember.create({
    data: {
      name,
      phone,
      email,
      country,
      state: country === 'Nigeria' ? (state ?? null) : null,
      city: country !== 'Nigeria' ? (city ?? null) : null,
      extraFields:
        extraFields !== undefined ? (JSON.parse(JSON.stringify(extraFields)) as Prisma.InputJsonValue) : undefined,
    },
  })

  await createNotification('member', `${name} joined the community`, { targetId: member.id })

  const settings = await db.automationSettings.findFirst()
  const whatsappUrl = settings?.whatsappChannelUrl || ''

  try {
    await sendConfirmationEmail({ member, whatsappUrl })
    await db.emailLog.create({
      data: {
        memberId: member.id,
        type: EmailType.CONFIRMATION,
        subject: 'Welcome to Room For You 🙏',
        status: 'sent',
        meta: { whatsappUrl },
      },
    })
  } catch (err) {
    console.error('[Join] Failed to send confirmation email:', err)
    await db.emailLog.create({
      data: {
        memberId: member.id,
        type: EmailType.CONFIRMATION,
        subject: 'Welcome to Room For You 🙏',
        status: 'failed',
      },
    })
  }

  return NextResponse.json(
    {
      success: true,
      memberId: member.id,
      whatsappUrl,
    },
    { status: 201 },
  )
}
