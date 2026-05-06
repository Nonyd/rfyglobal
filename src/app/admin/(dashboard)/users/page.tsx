import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { UsersManager } from '@/components/admin/users/UsersManager'

export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const session = await auth()
  if (!session || session.user.role !== 'SUPER_ADMIN') redirect('/admin')

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

  return <UsersManager initialUsers={users} currentUserId={session.user.id} />
}
