import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'
import { logActivity } from '@/lib/activity'
import { deleteFromStorage } from '@/lib/upload-storage'

export const runtime = 'nodejs'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'media')
  if (denied) return denied

  const body = (await req.json().catch(() => ({}))) as {
    title?: unknown
    description?: unknown
    isPublished?: unknown
  }

  const data: { title?: string; description?: string | null; isPublished?: boolean } = {}
  if (typeof body.title === 'string') {
    const title = body.title.trim().slice(0, 200)
    if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    data.title = title
  }
  if (typeof body.description === 'string') {
    data.description = body.description.trim().slice(0, 5000) || null
  }
  if (typeof body.isPublished === 'boolean') data.isPublished = body.isPublished

  const track = await db.audioTrack.update({ where: { id: params.id }, data }).catch(() => null)
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  revalidatePath(`/listen/${track.slug}`)
  return NextResponse.json(track)
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'media')
  if (denied) return denied

  const track = await db.audioTrack.findUnique({ where: { id: params.id } })
  if (!track) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await db.audioTrack.delete({ where: { id: track.id } })
  await deleteFromStorage({ url: track.url })
  revalidatePath(`/listen/${track.slug}`)

  if (session?.user?.id && session.user.id !== 'env-admin') {
    await logActivity({
      userId: session.user.id,
      action: 'Deleted audio',
      module: 'Media',
      targetId: track.id,
      targetTitle: track.title,
    })
  }

  return NextResponse.json({ success: true })
}

/** Cloudflare WAF blocks PATCH/DELETE on /api/*, so adminFetch sends them as POST + override header. */
export async function POST(req: NextRequest, ctx: Ctx) {
  const override = req.headers.get('X-HTTP-Method-Override')
  if (override === 'DELETE') return DELETE(req, ctx)
  if (override === 'PATCH') return PATCH(req, ctx)
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
