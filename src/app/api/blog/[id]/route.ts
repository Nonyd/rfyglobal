import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UpdatePostSchema } from '@/lib/validations/blog'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const post = await db.post.findUnique({ where: { id: params.id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = UpdatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const current = await db.post.findUnique({ where: { id: params.id } })
  if (!current) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const publishedAt =
    parsed.data.isPublished === true && !current.isPublished
      ? new Date()
      : current.publishedAt

  const { coverImage, ...restData } = parsed.data
  const data = {
    ...restData,
    ...(coverImage !== undefined
      ? { coverImage: coverImage && coverImage.length > 0 ? coverImage : null }
      : {}),
    publishedAt,
  }

  const post = await db.post.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.post.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
