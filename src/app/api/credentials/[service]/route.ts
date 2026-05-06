import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { service } = await params
  const { isActive } = (await req.json()) as { isActive: boolean }

  const record = await db.credential.update({
    where: { service },
    data: { isActive: Boolean(isActive) },
  })

  return NextResponse.json({ service: record.service, isActive: record.isActive })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ service: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { service } = await params
  await db.credential.deleteMany({ where: { service } })
  return NextResponse.json({ success: true })
}
