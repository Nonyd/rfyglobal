import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { strictRatelimit } from '@/lib/ratelimit'
import { findCommunityMemberByEmail } from '@/lib/community-member'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

export const runtime = 'nodejs'

const VideoUrlSchema = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? undefined : v),
  z.string().url().optional(),
)

const TestimonySchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
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

  const { email, name, isAnonymous, title, body: testimonyBody, imageUrls, videoUrl } = parsed.data

  const member = await findCommunityMemberByEmail(email)

  if (!member) {
    return NextResponse.json(
      {
        error: 'You need to be a member of the Room For You community to share a testimony.',
        notMember: true,
      },
      { status: 403 },
    )
  }

  const testimony = await db.testimony.create({
    data: {
      email: member.email,
      name: isAnonymous ? null : (name || member.name),
      isAnonymous,
      title,
      body: testimonyBody || null,
      imageUrls: imageUrls?.length
        ? (imageUrls as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull,
      videoUrl: videoUrl ?? null,
    },
  })

  return NextResponse.json({ success: true, id: testimony.id }, { status: 201 })
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
