import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { z } from 'zod'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = z.object({ isSubscribed: z.boolean() }).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  await db.communityMember.update({
    where: { id: params.id },
    data: { isSubscribed: parsed.data.isSubscribed },
  })

  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest, ctx: { params: { id: string } }) {
  if (req.headers.get('X-HTTP-Method-Override') === 'PATCH') {
    return PATCH(req, ctx)
  }
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
