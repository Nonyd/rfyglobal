import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { logActivity } from '@/lib/activity'
import { z } from 'zod'

export const runtime = 'nodejs'

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = ChangePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    )
  }

  const { currentPassword, newPassword } = parsed.data

  // Fetch user with current password hash
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, password: true },
  })

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Verify current password
  const isValid = await bcrypt.compare(currentPassword, user.password)
  if (!isValid) {
    return NextResponse.json(
      {
        error: 'Current password is incorrect',
      },
      { status: 400 }
    )
  }

  // Hash and update new password
  const hashed = await bcrypt.hash(newPassword, 12)
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed },
  })

  // Log activity
  await logActivity({
    userId: session.user.id,
    action: 'Changed their password',
    module: 'Users',
    targetId: session.user.id,
    targetTitle: user.email,
  })

  return NextResponse.json({ success: true })
}
