import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { syncRfyLivePlaylist } from '@/lib/rfy-youtube-sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const result = await syncRfyLivePlaylist()
  return NextResponse.json(result)
}
