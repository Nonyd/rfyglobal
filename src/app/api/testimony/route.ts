import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { findCommunityMemberByEmail } from '@/lib/community-member'
import { sendTestimonyConfirmationEmail } from '@/lib/emails/testimony-confirmation'
import { Prisma } from '@prisma/client'
import { createNotification } from '@/lib/notify'
import { z } from 'zod'

export const runtime = 'nodejs'

const VideoUrlSchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().url().optional(),
)

const EditionSchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().max(200).optional(),
)

const TestimonySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  edition: EditionSchema,
  phone: z.string().min(7).max(20),
  location: z.string().min(1).max(200),
  isAnonymous: z.boolean().default(false),
  title: z.string().min(3).max(200),
  body: z.string().max(5000).optional(),
  imageUrls: z.array(z.string()).max(5).optional(),
  videoUrl: VideoUrlSchema,
})

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  const { success } = await strictRatelimit.limit(`testimony:${ip}`)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const body = await req.json()
  const parsed = TestimonySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const {
    email,
    name,
    edition,
    phone,
    location,
    isAnonymous,
    title,
    body: testimonyBody,
    imageUrls,
    videoUrl,
  } = parsed.data

  const testimony = await db.testimony.create({
    data: {
      email: email.trim(),
      phone,
      location,
      edition: edition?.trim() || null,
      name: isAnonymous ? null : (name?.trim() || null),
      isAnonymous,
      title,
      body: testimonyBody || null,
      imageUrls: imageUrls?.length
        ? (imageUrls as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      videoUrl: videoUrl ?? null,
    },
  })

  await createNotification('testimony', 'New testimony submitted')

  let isNewVisitor = false
  try {
    const member = await findCommunityMemberByEmail(email)
    isNewVisitor = !member
  } catch (err) {
    console.error('[testimony member lookup]', err)
    isNewVisitor = false
  }

  try {
    await sendTestimonyConfirmationEmail({
      email: email.trim(),
      name: isAnonymous ? null : name?.trim() || null,
      isNewVisitor,
    })
  } catch (err) {
    console.error('[testimony confirmation email]', err)
  }

  return NextResponse.json({ success: true, id: testimony.id, isNewVisitor }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const featured = searchParams.get('featured') === 'true'

  const where: Prisma.TestimonyWhereInput = { status: 'APPROVED' }
  if (featured) where.isFeatured = true

  const testimonies = await db.testimony.findMany({
    where,
    orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
    select: {
      id: true,
      name: true,
      isAnonymous: true,
      title: true,
      body: true,
      imageUrls: true,
      videoUrl: true,
      isFeatured: true,
      publishedAt: true,
    },
  })

  return NextResponse.json(testimonies)
}
