import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AdminThemeWrapper } from '@/components/admin/AdminThemeWrapper'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/admin/login')

  return <AdminThemeWrapper>{children}</AdminThemeWrapper>
}
