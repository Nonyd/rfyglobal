import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma, TestimonyStatus } from '@prisma/client'

export const runtime = 'nodejs'

async function testimonyId(params: { id: string } | Promise<{ id: string }>): Promise<string | undefined> {
  const p = await Promise.resolve(params)
  return p?.id?.trim() || undefined
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await testimonyId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Invalid testimony id' }, { status: 400 })

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const data: Prisma.TestimonyUpdateInput = {}

    if (body.status !== undefined) {
      const st = body.status
      if (!Object.values(TestimonyStatus).includes(st as TestimonyStatus)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      const status = st as TestimonyStatus
      data.status = status
      if (status === 'APPROVED') data.publishedAt = new Date()
      if (status === 'REJECTED') data.publishedAt = null
    }

    if (body.isFeatured !== undefined) {
      data.isFeatured = Boolean(body.isFeatured)
    }

    if (body.adminNote !== undefined) {
      data.adminNote =
        body.adminNote === null ? null : typeof body.adminNote === 'string' ? body.adminNote : String(body.adminNote)
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const testimony = await db.testimony.update({
      where: { id },
      data,
    })

    return NextResponse.json(testimony)
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Testimony not found' }, { status: 404 })
    }
    console.error('[admin testimony PATCH]', e)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: { id: string } | Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const id = await testimonyId(ctx.params)
    if (!id) return NextResponse.json({ error: 'Invalid testimony id' }, { status: 400 })

    await db.testimony.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      return NextResponse.json({ error: 'Testimony not found' }, { status: 404 })
    }
    console.error('[admin testimony DELETE]', e)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
