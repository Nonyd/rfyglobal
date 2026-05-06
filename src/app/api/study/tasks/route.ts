import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { CreateTaskSchema } from '@/lib/validations/study'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const parsed = CreateTaskSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { dueDate, ...rest } = parsed.data
  const task = await db.studyTask.create({
    data: {
      ...rest,
      dueDate: dueDate && String(dueDate).length > 0 ? new Date(dueDate) : null,
    },
  })
  return NextResponse.json(task, { status: 201 })
}
