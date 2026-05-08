import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { TestimonyStatus } from '@prisma/client'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const updateData: Record<string, unknown> = {}
  if (body.status !== undefined) {
    if (!Object.values(TestimonyStatus).includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    updateData.status = body.status
    if (body.status === 'APPROVED') updateData.publishedAt = new Date()
  }
  if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured
  if (body.adminNote !== undefined) updateData.adminNote = body.adminNote

  const testimony = await db.testimony.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json(testimony)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await db.testimony.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
