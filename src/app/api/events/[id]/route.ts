import type { Prisma } from '@prisma/client'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const raw = await req.json()
  const body: Record<string, unknown> = { ...raw }
  if (typeof body.date === 'string') body.date = new Date(body.date)
  if (body.imageUrl === '') body.imageUrl = null

  const event = await db.event.update({
    where: { id: params.id },
    data: body as Prisma.EventUpdateInput,
  })
  return NextResponse.json(event)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.event.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
