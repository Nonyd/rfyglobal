import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { paramId } from '@/lib/api-route-params'
import { logActivity } from '@/lib/activity'
import { UpdatePostSchema } from '@/lib/validations/blog'

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const post = await db.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = await paramId(ctx.params)
  if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const body = await req.json()
  const parsed = UpdatePostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const current = await db.post.findUnique({ where: { id } })
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
    where: { id },
    data,
  })

  await logActivity({
    userId: session.user.id,
    action: `Updated post: ${post.title}`,
    module: 'Blog',
    targetId: id,
    targetTitle: post.title,
  })

  return NextResponse.json(post)
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await paramId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

    const existing = await db.post.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.post.delete({ where: { id } })

    await logActivity({
      userId: session.user.id,
      action: `Deleted post: ${existing.title}`,
      module: 'Blog',
      targetId: id,
      targetTitle: existing.title,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[blog DELETE]', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
