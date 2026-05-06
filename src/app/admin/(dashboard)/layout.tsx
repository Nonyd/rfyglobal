import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminDashboardShell } from '@/components/admin/AdminDashboardShell'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return <AdminDashboardShell userEmail={session.user?.email}>{children}</AdminDashboardShell>
}
