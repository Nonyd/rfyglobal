import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { logActivity } from '@/lib/activity'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await req.json()) as { ids?: unknown }
  const ids = Array.isArray(body.ids) ? body.ids.filter((v): v is string => typeof v === 'string') : []

  if (ids.length === 0) {
    return NextResponse.json({ error: 'No image IDs provided' }, { status: 400 })
  }

  const result = await db.galleryImage.deleteMany({
    where: { id: { in: ids } },
  })

  await logActivity({
    userId: session.user.id,
    action: `Bulk-deleted ${result.count} gallery image${result.count === 1 ? '' : 's'}`,
    module: 'Gallery',
  })

  return NextResponse.json({ deleted: result.count })
}
