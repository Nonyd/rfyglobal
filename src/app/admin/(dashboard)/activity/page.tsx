import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { ActivityLogViewer } from '@/components/admin/ActivityLogViewer'
import { hasPermission } from '@/lib/permissions'

export const dynamic = 'force-dynamic'

export default async function ActivityPage() {
  const session = await auth()
  if (!session || !hasPermission(session.user.role, 'activity')) redirect('/admin')

  const [logs, users, total] = await Promise.all([
    db.activityLog.findMany({
      include: { user: { select: { name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.user.findMany({
      select: { id: true, name: true, email: true },
    }),
    db.activityLog.count(),
  ])

  const totalPages = Math.ceil(total / 50) || 1

  return (
    <ActivityLogViewer
      initialLogs={logs}
      users={users}
      initialTotalPages={totalPages}
      isSuperAdmin={session.user.role === 'SUPER_ADMIN'}
    />
  )
}
