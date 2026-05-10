import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { findCommunityMemberByEmail } from '@/lib/community-member'
import { createNotification } from '@/lib/notify'
import { z } from 'zod'

export const runtime = 'nodejs'

const PrayerSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  isAnonymous: z.boolean().default(false),
  subject: z.string().min(3).max(200),
  body: z.string().min(10).max(2000),
})

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`prayer:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = PrayerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { email, name, isAnonymous, subject, body: prayerBody } = parsed.data

  const member = await findCommunityMemberByEmail(email)

  if (!member) {
    return NextResponse.json(
      {
        error: 'You need to be a member of the Room For You community to submit a prayer request.',
        notMember: true,
      },
      { status: 403 },
    )
  }

  const request = await db.prayerRequest.create({
    data: {
      email: member.email,
      name: isAnonymous ? null : (name || member.name),
      isAnonymous,
      subject,
      body: prayerBody,
    },
  })

  await createNotification('prayer', 'New prayer request submitted')

  return NextResponse.json({ success: true, id: request.id }, { status: 201 })
}
