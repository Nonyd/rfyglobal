import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'
import type { Role } from '@prisma/client'

export const runtime = 'nodejs'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json() as {
    name?: string
    role?: Role
    isActive?: boolean
    password?: string
  }

  if (params.id === session.user.id && body.role && body.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
  }

  const updateData: Record<string, unknown> = {}
  if (body.name !== undefined) updateData.name = body.name
  if (body.role !== undefined) updateData.role = body.role
  if (body.isActive !== undefined) updateData.isActive = body.isActive
  if (body.password) updateData.password = await bcrypt.hash(body.password, 12)

  const user = await db.user.update({
    where: { id: params.id },
    data: updateData,
    select: { id: true, email: true, name: true, role: true, isActive: true },
  })

  await logActivity({
    userId: session.user.id,
    action: `Updated admin user: ${user.email}`,
    module: 'Users',
    targetId: user.id,
    targetTitle: user.email,
  })

  return NextResponse.json(user)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (params.id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const user = await db.user.findUnique({
    where: { id: params.id },
    select: { email: true },
  })

  await db.user.delete({ where: { id: params.id } })

  await logActivity({
    userId: session.user.id,
    action: `Deleted admin user: ${user?.email}`,
    module: 'Users',
    targetId: params.id,
    targetTitle: user?.email,
  })

  return NextResponse.json({ success: true })
}
