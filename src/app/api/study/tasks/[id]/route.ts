import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.dueDate === '' || body.dueDate === null) {
    body.dueDate = null
  } else if (typeof body.dueDate === 'string') {
    body.dueDate = new Date(body.dueDate)
  }
  const task = await db.studyTask.update({ where: { id: params.id }, data: body })
  return NextResponse.json(task)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.studyTask.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
