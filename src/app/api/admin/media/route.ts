import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { forbidUnlessCanAccess } from '@/lib/admin-api-access'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  const denied = await forbidUnlessCanAccess(session, 'media')
  if (denied) return denied

  const tracks = await db.audioTrack.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(tracks)
}
