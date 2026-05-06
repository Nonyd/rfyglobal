import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'
import { Role } from '@prisma/client'

export const runtime = 'nodejs'

export async function GET() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json(users)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { email, name, password, role } = body as {
    email?: string
    name?: string
    password?: string
    role?: Role
  }

  if (!email || !password || !role) {
    return NextResponse.json({ error: 'Email, password and role required' }, { status: 400 })
  }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
  }

  const hashed = await bcrypt.hash(password, 12)
  const user = await db.user.create({
    data: { email, name: name ?? null, password: hashed, role, isActive: true },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })

  await logActivity({
    userId: session.user.id,
    action: `Created admin user: ${email} (${role})`,
    module: 'Users',
    targetId: user.id,
    targetTitle: email,
  })

  return NextResponse.json(user, { status: 201 })
}
