import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreatePostSchema } from '@/lib/validations/blog'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const session = await auth()
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1', 10)
  const limit = parseInt(searchParams.get('limit') ?? '9', 10)
  const skip = (page - 1) * limit

  const where = session ? {} : { isPublished: true }

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        isPublished: true,
        publishedAt: true,
        createdAt: true,
      },
    }),
    db.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = CreatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { slug, isPublished, coverImage, ...rest } = parsed.data

  const existing = await db.post.findUnique({ where: { slug } })
  if (existing) {
    return NextResponse.json({ error: 'Slug already in use' }, { status: 409 })
  }

  const post = await db.post.create({
    data: {
      ...rest,
      slug,
      isPublished,
      coverImage: coverImage && coverImage.length > 0 ? coverImage : null,
      publishedAt: isPublished ? new Date() : null,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
